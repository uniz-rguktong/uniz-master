import express, { type ErrorRequestHandler, type Request, type Response } from "express";
import rateLimitMiddleware from "express-rate-limit";
import helmet from "helmet";
import { routerLimiterOptions } from "@uniz/shared";
import { insertRequest } from "./audit/store";
import { requireWebadmin } from "./auth";
import { loadTargets, withClient } from "./db";
import { DbAdminError, sanitizePgMessage } from "./errors";
import { createRateLimiter } from "./rate-limit";
import routes from "./routes";

const reads = createRateLimiter({ windowMs: 60_000, max: 60 });
const writes = createRateLimiter({ windowMs: 60_000, max: 30 });
const routerRateLimiter = rateLimitMiddleware(
  routerLimiterOptions,
) as unknown as express.RequestHandler;

function requestPath(req: Request): string {
  return String(req.originalUrl || req.url || "/").split("?")[0].slice(0, 300);
}

function attachRequestLog(req: Request, res: Response, next: express.NextFunction): void {
  res.on("finish", () => {
    const target = loadTargets()[0];
    if (!target) return;
    const kind = req.method === "GET" || req.method === "HEAD" ? "read" : "write";
    void withClient(target.id, "write", (client) =>
      insertRequest(client, {
        actor: req.actor,
        method: req.method,
        path: requestPath(req),
        status: res.statusCode,
        ip: req.ip || "",
        kind,
      }),
    ).catch(() => {
      /* the visit log is best-effort; row changes keep their own record */
    });
  });
  next();
}

function rateLimit(req: Request, res: Response, next: express.NextFunction): void {
  const key = req.actor?.username || req.ip || "anonymous";
  if (!reads.allow(key)) {
    res.status(429).json({
      success: false,
      message: "Too many database actions. Wait a minute and try again.",
    });
    return;
  }
  const writing = req.method !== "GET" && req.method !== "HEAD";
  if (writing && !writes.allow(`${key}:write`)) {
    res.status(429).json({
      success: false,
      message: "Too many changes. Wait a minute and try again.",
    });
    return;
  }
  next();
}

const onError: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }
  if (err instanceof DbAdminError) {
    res.status(err.status).json({
      success: false,
      message: err.message,
      confirmText: err.confirmText,
    });
    return;
  }
  const code = typeof err?.code === "string" ? err.code : "";
  const message = typeof err?.message === "string" ? err.message : "";
  if (code === "ECONNREFUSED" || code === "ENOTFOUND" || code === "ETIMEDOUT" || code === "28P01" || code === "28000") {
    res.status(503).json({
      success: false,
      message: "The database editor cannot reach the database yet. The uniz_dbadmin login may still need to be created.",
    });
    return;
  }
  if (/^[0-9A-Z]{5}$/.test(code)) {
    res.status(400).json({ success: false, message: sanitizePgMessage(code, message) });
    return;
  }
  console.error("[dbadmin] request failed");
  res.status(500).json({ success: false, message: "The database editor hit an unexpected problem." });
};

export function createApp(): express.Express {
  const app = express();
  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(express.json({ limit: "1mb" }));
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", service: "uniz-dbadmin" });
  });
  app.use(attachRequestLog);
  app.use(routerRateLimiter);
  app.use(requireWebadmin);
  app.use(rateLimit);
  app.use(routes);
  app.use(onError);
  return app;
}
