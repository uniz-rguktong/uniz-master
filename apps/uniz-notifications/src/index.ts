import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import IORedis from "ioredis";
import { attributionMiddleware } from "./middlewares/attribution.middleware";
import { createNotificationWorker } from "./worker/notification.worker";
import pushRoutes from "./routes/push.routes";
import inboxRoutes from "./routes/inbox.routes";
import { publicVapidKey } from "./services/push.service";

dotenv.config({ override: true });

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
connection.on("error", (err) => console.error("Redis connection error:", err));

createNotificationWorker(connection);

const app = express();
app.set("trust proxy", 1);
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(attributionMiddleware);

app.get("/", (_req, res) => {
  res.json({
    service: "uniz-notification-service",
    status: "running",
    endpoints: { health: "/health", subscribe: "/subscribe" },
    vapidPublicKey: publicVapidKey || null,
  });
});

app.use("/", pushRoutes);
app.use("/", inboxRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "uniz-notification-service" });
});

app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.method} ${req.url} not found`,
    timestamp: new Date().toISOString(),
  });
});

const port = process.env.PORT ? Number(process.env.PORT) : 3007;
const server = app.listen(port, () => {
  console.log(`Notification service listening on ${port}`);
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
});

process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
});

export default app;
