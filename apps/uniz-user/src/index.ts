/**
 * ==============================================================================
 * UNIZ MICROSERVICES - USER MANAGEMENT ENGINE
 * ==============================================================================
 * Entry point for the User Service. Responsible for profile management,
 * academic record retrieval, and inter-service identity propagation.
 * ==============================================================================
 */

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";

// ------------------------------------------------------------------------------
// 1. INITIALIZATION & MIDDLEWARE
// ------------------------------------------------------------------------------

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

// ------------------------------------------------------------------------------
// 2. ROUTING & GATEWAYS
// ------------------------------------------------------------------------------

import profileRoutes from "./routes/profile.routes";
import cmsRoutes from "./routes/cms.routes";
// import botRoutes from "./routes/bot.routes";

app.use("/", profileRoutes);
app.use("/", cmsRoutes);
// app.use("/bot", botRoutes);

// ------------------------------------------------------------------------------
// 3. ERROR ORCHESTRATION
// ------------------------------------------------------------------------------

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.method} ${req.url} not found`,
    timestamp: new Date().toISOString(),
    attribution: "SABER",
  });
});

// ------------------------------------------------------------------------------
// 4. SERVER BOOTSTRAP
// ------------------------------------------------------------------------------

const server = app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
});

// ------------------------------------------------------------------------------
// 5. SYSTEM SIGNAL HANDLERS (GRACEFUL TERMINATION)
// ------------------------------------------------------------------------------

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
