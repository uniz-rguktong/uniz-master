import express from "express";
import helmet from "helmet";
import compression from "compression";
import { redis } from "./utils/redis.util";
import { attributionMiddleware } from "./middlewares/attribution.middleware";
import academicRoutes from "./routes/academic.routes";
import queueRoutes from "./routes/queue.routes";
import analyticsRoutes from "./routes/analytics.routes";
import { authMiddleware } from "./middlewares/auth.middleware";
import { startRegistrationPdfWorker } from "./workers/registration-pdf.queue";
import { processNextBatch } from "./services/upload.service";

/** Express app for academics (no listen). */
export function createApp(): express.Application {
  const app = express();
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ limit: "20mb", extended: true }));
  app.use(attributionMiddleware);

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", service: "uniz-academics-service" });
  });

  app.use("/api/queue", queueRoutes);
  app.use("/analytics", authMiddleware, analyticsRoutes);
  app.use("/", academicRoutes);

  startRegistrationPdfWorker();

  setTimeout(async () => {
    try {
      const jobExists = await redis.llen("job:queue");
      if (jobExists > 0) {
        console.log(
          `[Academics] Found ${jobExists} stuck jobs on startup. Resuming...`,
        );
        let result;
        do {
          result = await processNextBatch();
        } while (result && result.status === "continued");
        console.log("[Academics] All stuck jobs processed.");
      }
    } catch (err) {
      console.warn("[Academics] Startup worker check failed:", err);
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

  app.use(
    (
      err: any,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      if (err?.type === "request.aborted") {
        return res.status(400).json({ error: "Request aborted" });
      }
      console.error(err?.stack || err);
      res.status(500).json({ error: "Internal Server Error" });
    },
  );

  return app;
}

export default createApp;
