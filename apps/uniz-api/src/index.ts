import dotenv from "dotenv";
dotenv.config({ override: true });

import express, { Request, Response, NextFunction } from "express";
import { createApp as createAuthApp } from "uniz-auth-service/createApp";
import { createApp as createUserApp } from "uniz-user-service/createApp";
import { createApp as createAcademicsApp } from "uniz-academics-service/createApp";

const PORT = Number(process.env.PORT || 3001);

const authApp = createAuthApp();
const userApp = createUserApp();
const academicsApp = createAcademicsApp();

const USER_SERVICES = new Set([
  "profile",
  "cms",
  "files",
  "grievance",
  "user",
]);

function resolveUpstream(service: string): express.Application | null {
  const s = service.toLowerCase();
  if (s === "auth") return authApp;
  if (s === "academics") return academicsApp;
  if (USER_SERVICES.has(s)) return userApp;
  return null;
}

const app = express();
app.set("trust proxy", 1);

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "uniz-api",
    modules: ["auth", "user", "academics"],
  });
});

/**
 * Gateway sets X-Uniz-Service from /api/v1/:service/... so we can dispatch
 * to the correct module without path collisions across former microservices.
 */
app.use((req: Request, res: Response, next: NextFunction) => {
  const header = String(req.headers["x-uniz-service"] || "").trim();
  if (!header) {
    return res.status(400).json({
      error: "Missing X-Uniz-Service header (gateway must set it)",
    });
  }
  const upstream = resolveUpstream(header);
  if (!upstream) {
    return res.status(404).json({ error: `Unknown module: ${header}` });
  }
  return upstream(req, res, next);
});

const server = app.listen(PORT, () => {
  console.log(`UniZ API (auth+user+academics) listening on ${PORT}`);
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down uniz-api...");
  server.close(() => process.exit(0));
});

export default app;
