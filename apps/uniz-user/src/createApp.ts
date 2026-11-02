import express from "express";
import helmet from "helmet";
import compression from "compression";
import { readFromR2, storageDriver, uploadsDir } from "./utils/storage.util";
import { attributionMiddleware } from "./middlewares/attribution.middleware";
import profileRoutes from "./routes/profile.routes";
import cmsRoutes from "./routes/cms.routes";
import queueRoutes from "./routes/queue.routes";
import filesRoutes from "./routes/files.routes";
import grievanceRoutes from "./routes/grievance.routes";
import { leaveRouter, dutyRouter } from "./routes/leave.routes";
import { feesRouter } from "./routes/fees.routes";
import { processNextStudentBatch } from "./services/bulk-worker.service";
import { redis } from "./utils/redis.util";

/** Express app for user/profile/cms/files/grievance (no listen). */
export function createApp(): express.Application {
  const app = express();
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(compression());
  app.use(express.json());
  app.use(attributionMiddleware);

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", service: "uniz-user-service" });
  });

  app.use(
    "/img",
    express.static(uploadsDir(), {
      index: false,
      fallthrough: storageDriver() === "r2",
      immutable: true,
      maxAge: "365d",
      setHeaders: (res) => {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      },
    }),
  );

  // With STORAGE_DRIVER=r2, files not on local disk are served from R2.
  app.get("/img/*", async (req, res) => {
    try {
      const key = decodeURIComponent(req.path.replace(/^\/img\//, ""));
      const obj = await readFromR2(key);
      if (!obj) return res.status(404).end();
      res.setHeader("Content-Type", obj.contentType || "image/webp");
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      return res.send(obj.body);
    } catch {
      return res.status(404).end();
    }
  });

  // Gateway strips /api/v1/<service>; put leave/duty back so they never
  // collide with the "/" mounted routers below.
  app.use((req, _res, next) => {
    const svc = String(req.headers["x-uniz-service"] || "").toLowerCase();
    if ((svc === "leave" || svc === "duty" || svc === "fees") && !req.url.startsWith(`/${svc}/`)) {
      req.url = `/${svc}${req.url.startsWith("/") ? "" : "/"}${req.url}`;
    }
    next();
  });
  app.use("/leave", leaveRouter);
  app.use("/duty", dutyRouter);
  app.use("/fees", feesRouter);

  app.use("/api/queue", queueRoutes);
  app.use("/", profileRoutes);
  app.use("/", cmsRoutes);
  app.use("/", filesRoutes);
  app.use("/grievance", grievanceRoutes);
  app.use("/api/v1/requests/grievance", grievanceRoutes);
  app.use("/", grievanceRoutes);

  // Resume stuck bulk student jobs once per process
  setTimeout(async () => {
    try {
      const jobExists = await redis.llen("student:job:queue");
      if (jobExists > 0) {
        console.log(
          `[Bulk] Found ${jobExists} stuck student jobs on startup. Resuming...`,
        );
        let result;
        do {
          result = await processNextStudentBatch();
        } while (result && result.status === "continued");
        console.log("[Bulk] All stuck student jobs processed.");
      }
    } catch (err) {
      console.warn("[Bulk] Startup worker check failed:", err);
    }
  }, 5000);

  app.use((req, res) => {
    res.status(404).json({
      status: "error",
      message: `Route ${req.method} ${req.url} not found`,
      timestamp: new Date().toISOString(),
      attribution: "SreeCharan",
    });
  });

  return app;
}

export default createApp;
