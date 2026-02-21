// CI/CD Trigger
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import authRoutes from "./routes/auth.routes";

dotenv.config();

const app = express();
app.set("trust proxy", 1); // Trust first proxy (Vercel/Gateway)
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(compression());
// app.use(cors());
app.use(express.json());

import { attributionMiddleware } from "./middlewares/attribution.middleware";
app.use(attributionMiddleware);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "uniz-auth-service" });
});

app.use("/", authRoutes);

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
  console.log(`Auth Service running on port ${PORT}`);
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
});

export default app;

// Graceful Shutdown Handler
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Starting graceful shutdown...');
  server.close(() => {
    console.log('HTTP server closed.');
  });
  try {
    if (global.prisma || require('./utils/db.util').prisma) {
        // generic attempt to close prisma if it exists
    }
  } catch (e) {}
  process.exit(0);
});
