import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { redis } from "./utils/redis.util";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

app.use(helmet());
app.use(compression());
// app.use(cors());

app.use(express.json());

// Attribution & Malformed Activity Handling (Mandatory)
import { attributionMiddleware } from "./middlewares/attribution.middleware";
app.use(attributionMiddleware);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "uniz-academics-service" });
});

import academicRoutes from "./routes/academic.routes";
import queueRoutes from "./routes/queue.routes";

// Internal Queue Routes (No Auth Middleware)
app.use("/api/queue", queueRoutes);

// General Academic Routes (With Auth Middleware)
app.use("/", academicRoutes);

// Startup self-healing: Check for stuck jobs
import { processNextBatch } from "./services/upload.service";
const startWorker = async () => {
  try {
    const jobExists = await redis.llen("job:queue");
    if (jobExists > 0) {
      console.log(
        `[Academics] 🔄 Found ${jobExists} stuck jobs on startup. Resuming...`,
      );
      let result;
      do {
        result = await processNextBatch();
      } while (result && result.status === "continued");
      console.log("[Academics]  All stuck jobs processed.");
    }
  } catch (err) {
    console.warn("[Academics] Startup worker check failed:", err);
  }
};
setTimeout(startWorker, 5000); // Wait for services to be ready

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.method} ${req.url} not found`,
    timestamp: new Date().toISOString(),
    attribution: "SABER",
  });
});

// Error Handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    if (err.type === "request.aborted") {
      return res.status(400).json({ error: "Request aborted" });
    }
    console.error(err.stack);
    res.status(500).json({ error: "Internal Server Error" });
  },
);

const server = app.listen(PORT, () => {
  console.log(`Academics Service running on port ${PORT}`);
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
});

// Graceful Shutdown Handler
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Starting graceful shutdown...');
  server.close(() => {
    console.log('HTTP server closed.');
  });
  try {
    if ((global as any).prisma || require('./utils/db.util').prisma) {
        // generic attempt to close prisma if it exists
    }
  } catch (e) {}
  process.exit(0);
});
