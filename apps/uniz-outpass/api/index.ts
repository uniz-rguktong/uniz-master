import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import requestRoutes from "../src/routes/request.routes";

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

app.use((req, res, next) => {
  console.log(`[OUTPASS-API] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "uniz-outpass-service" });
});

import grievanceRoutes from "../src/routes/grievance.routes";

// Routes
app.use("/grievance", grievanceRoutes); // New Grievance Route
app.use("/", requestRoutes);

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
