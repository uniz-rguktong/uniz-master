import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import emailRoutes from "../src/routes/email.routes";

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

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "uniz-mail-service" });
});

app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "UniZ Mail Service API holds individual endpoints.",
    health: "/health",
  });
});

// Routes
app.use("/", emailRoutes);

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
