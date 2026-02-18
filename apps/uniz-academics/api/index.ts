import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import academicRoutes from "../src/routes/academic.routes";
import queueRoutes from "../src/routes/queue.routes";
import compression from "compression";

dotenv.config();

const app = express();
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors());
app.use(compression()); // Enable Gzip
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "uniz-academics-service" });
});

app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    message:
      "UniZ Academics Service API manages grades, attendance and curriculum.",
    health: "/health",
  });
});

app.use("/", academicRoutes);
app.use("/api/queue", queueRoutes);

export default app;
