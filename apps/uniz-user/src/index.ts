import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";

dotenv.config();
  console.log("[DEBUG] Service starting with priority fixes...");

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
import botRoutes from "./routes/bot.routes";

app.use("/", profileRoutes);
app.use("/", cmsRoutes);
app.use("/bot", botRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.method} ${req.url} not found`,
    timestamp: new Date().toISOString(),
    attribution: "SABER",
  });
});

app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});
