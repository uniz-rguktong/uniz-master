import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { uploadsDir } from "./utils/storage.util";

dotenv.config({ override: true });

const app = express();
const PORT = process.env.PORT || 3002;

// Portal/Landing are on different hosts (Cloudflare Pages). Default Helmet
// CORP=same-origin blocks browser reads of CMS/public JSON even when CORS passes.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(compression());
// CORS is handled centrally at the gateway; services sit behind it.
app.use(express.json());

// Attribution & Malformed Activity Handling (Mandatory)
import { attributionMiddleware } from "./middlewares/attribution.middleware";
app.use(attributionMiddleware);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "uniz-user-service" });
});

// Public, immutable serving of self-hosted uploaded images. Exposed through the
// gateway at /api/v1/files/img/*. Mounted before the auth-protected routers so
// image reads stay public (URLs are unguessable per-user keys / cache-busted).
app.use(
  "/img",
  express.static(uploadsDir(), {
    index: false,
    fallthrough: false,
    immutable: true,
    maxAge: "365d",
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  }),
);

import profileRoutes from "./routes/profile.routes";
import cmsRoutes from "./routes/cms.routes";
import queueRoutes from "./routes/queue.routes";
import filesRoutes from "./routes/files.routes";
import grievanceRoutes from "./routes/grievance.routes";

// Background Job Worker Trigger (Internal only)
app.use("/api/queue", queueRoutes);

app.use("/", profileRoutes);
app.use("/", cmsRoutes);
// Former files-service upload path (gateway /api/v1/files → /image/upload)
app.use("/", filesRoutes);

// Grievance (moved from outpass). Preserve both path families:
// - /api/v1/grievance/* → gateway strips to /submit|/list|...
// - /api/v1/requests/grievance/* → /grievance/...
app.use("/grievance", grievanceRoutes);
app.use("/api/v1/requests/grievance", grievanceRoutes);
app.use("/", grievanceRoutes);

// Startup self-healing: Check for stuck student jobs
import { processNextStudentBatch } from "./services/bulk-worker.service";
import { redis } from "./utils/redis.util";

const startWorker = async () => {
  try {
    const jobExists = await redis.llen("student:job:queue");
    if (jobExists > 0) {
      console.log(
        `[Bulk] 🔄 Found ${jobExists} stuck student jobs on startup. Resuming...`,
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
};
setTimeout(startWorker, 5000);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.method} ${req.url} not found`,
    timestamp: new Date().toISOString(),
    attribution: "SreeCharan",
  });
});

const server = app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
});

// Graceful Shutdown Handler
process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Starting graceful shutdown...");
  server.close(() => {
    console.log("HTTP server closed.");
  });
  try {
    if ((global as any).prisma || require("./utils/db.util").prisma) {
      // generic attempt to close prisma if it exists
    }
  } catch (e) {}
  process.exit(0);
});
