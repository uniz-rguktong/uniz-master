import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import profileRoutes from "../src/routes/profile.routes";

dotenv.config();

const app = express();
app.set("trust proxy", 1);

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  }),
);
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "uniz-user-service" });
});

app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "UniZ User Service API holds user profile data.",
    health: "/health",
  });
});

import cmsRoutes from "../src/routes/cms.routes";

// Routes
app.use("/", profileRoutes);
app.use("/", cmsRoutes);

// Error Handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("Error:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  },
);

// Export for Vercel serverless
export default app;
