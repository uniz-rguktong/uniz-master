import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import { sanitizeLog } from "@uniz/shared";
import requestRoutes from "../src/routes/request.routes";

dotenv.config();

const app = express();
app.set("trust proxy", 1);

const allowedOrigins = (
  process.env.FRONTEND_URL ||
  process.env.CLIENT_URL ||
  "http://localhost:5173,http://localhost:3000"
)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json());

app.use((req, res, next) => {
  console.log(
    "[OUTPASS-API] %s %s",
    sanitizeLog(req.method),
    sanitizeLog(req.url),
  );
  next();
});

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "uniz-outpass-service" });
});

// Grievance moved to uniz-user-service.
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
