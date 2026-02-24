import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());

// Attribution & Malformed Activity Handling (Mandatory)
import { attributionMiddleware } from "./middlewares/attribution.middleware";
app.use(attributionMiddleware);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "uniz-outpass-service" });
});

import requestRoutes from "./routes/request.routes";
import grievanceRoutes from "./routes/grievance.routes";

// Consolidated Routing
// 1. Grievance routes (handles both /grievance/list and /list if prefix stripped)
app.use("/grievance", grievanceRoutes);
app.use("/api/v1/requests/grievance", grievanceRoutes); // Direct match fallback
app.use("/", grievanceRoutes);

// 2. Request routes (handles history, outpass, etc.)
app.use("/", requestRoutes);

// 404 Handler with internal path logging
app.use((req, res) => {
  console.log(`[Outpass] 404 - No route for: ${req.method} ${req.url}`);
  res.status(404).json({
    status: "error",
    message: `Route ${req.method} ${req.url} not found`,
    timestamp: new Date().toISOString(),
    attribution: "SABER",
  });
});

const server = app.listen(PORT, () => {
  console.log(`Outpass Service running on port ${PORT}`);
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
