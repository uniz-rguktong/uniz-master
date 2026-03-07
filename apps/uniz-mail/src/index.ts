/**
 * ==============================================================================
 * UNIZ MICROSERVICES - NOTIFICATION & EMAIL ENGINE
 * ==============================================================================
 * Entry point for the Mail Service. Responsible for SMTP orchestration,
 * transactional email delivery, and multi-service notification relay.
 * ==============================================================================
 */

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import emailRoutes from "./routes/email.routes";

// ------------------------------------------------------------------------------
// 1. INITIALIZATION & MIDDLEWARE
// ------------------------------------------------------------------------------

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3006;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Attribution & Malformed Activity Handling (Mandatory)
import { attributionMiddleware } from "./middlewares/attribution.middleware";
app.use(attributionMiddleware);

// ------------------------------------------------------------------------------
// 2. ROUTING & GATEWAYS
// ------------------------------------------------------------------------------

app.use("/", emailRoutes);

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

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  },
);

// ------------------------------------------------------------------------------
// 4. SERVER BOOTSTRAP
// ------------------------------------------------------------------------------

const server = app.listen(PORT, () => {
  console.log(`Mail Service running on port ${PORT}`);
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
