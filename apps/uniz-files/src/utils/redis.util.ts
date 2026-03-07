import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.warn(
    "REDIS_URL not found, falling back to local redis or failing elegantly",
  );
}

export const redis = redisUrl ? new Redis(redisUrl) : new Redis();

redis.on("error", (err) => {
  console.error("Redis connection error:", err);
});

redis.on("connect", () => {
  console.log("Connected to Redis Cloud");
});
