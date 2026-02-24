import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.REDIS_URL;

const options = {
  maxRetriesPerRequest: 10,
  connectTimeout: 10000,
};

if (!redisUrl) {
  console.log(
    "REDIS_URL not found, connecting to local Docker Redis (localhost:6379)",
  );
}

export const redis = redisUrl
  ? new Redis(redisUrl, options)
  : new Redis(options);

redis.on("error", (err) => {
  console.error("Redis connection error:", err);
});

redis.on("connect", () => {
  console.log(
  );
});
