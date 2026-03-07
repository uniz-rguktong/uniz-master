import { Redis } from "ioredis";
import dotenv from "dotenv";
dotenv.config();

const redisUrl = process.env.REDIS_URL;
const redis = new Redis(redisUrl!);

async function check() {
  const jobs = await redis.lrange("job:queue", 0, -1);
  console.log("Jobs in queue:", jobs.length);
  if (jobs.length > 0) {
    console.log("First job sample:", jobs[0].substring(0, 100) + "...");
  }

  const progressKeys = await redis.keys("upload:progress:*");
  for (const key of progressKeys) {
    const val = await redis.get(key);
    console.log(`Progress [${key}]:`, val);
  }

  process.exit(0);
}

check();
