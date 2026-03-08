import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(helmet());
app.use(compression());
// app.use(cors());
app.use(express.json());

// Attribution & Malformed Activity Handling (Mandatory)
import { attributionMiddleware } from "./middlewares/attribution.middleware";
app.use(attributionMiddleware);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "uniz-user-service" });
});

import profileRoutes from "./routes/profile.routes";
import cmsRoutes from "./routes/cms.routes";
import queueRoutes from "./routes/queue.routes";

// Background Job Worker Trigger (Internal only)
app.use("/api/queue", queueRoutes);

app.use("/", profileRoutes);
app.use("/", cmsRoutes);

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
    attribution: "SABER",
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
