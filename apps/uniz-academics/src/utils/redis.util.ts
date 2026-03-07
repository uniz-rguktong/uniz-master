import Redis from "ioredis";
import { Queue } from "bullmq";
import dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.REDIS_URL;

// General Redis Options
const options = {
  maxRetriesPerRequest: 10,
  connectTimeout: 15000, // Increased for serverless stability
  retryStrategy: (times: number) => Math.min(times * 100, 3000),
};

// BullMQ requires maxRetriesPerRequest to be null
const queueOptions = {
  connection: redisUrl
    ? { url: redisUrl, maxRetriesPerRequest: null }
    : { host: "localhost", port: 6379, maxRetriesPerRequest: null },
};

if (!redisUrl) {
  console.log(
    "REDIS_URL not found, connecting to local Docker Redis (localhost:6379)",
  );
}

export const redis = redisUrl
  ? new Redis(redisUrl, options)
  : new Redis(options);

// Reuse Redis connection config but ensure compatibility with BullMQ
export const notificationQueue = new Queue("notification-queue", {
  connection: redisUrl
    ? {
        host: new URL(redisUrl).hostname,
        port: Number(new URL(redisUrl).port),
        password: new URL(redisUrl).password,
        maxRetriesPerRequest: null,
      }
    : { host: "localhost", port: 6379, maxRetriesPerRequest: null },
});

redis.on("error", (err) => {
  console.error("Redis connection error:", err);
});

redis.on("connect", () => {
  console.log(
    redisUrl ? "Connected to Redis Cloud" : "Connected to Internal Redis",
  );
});
