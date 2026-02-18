import dotenv from "dotenv";
import { processNextBatch } from "../src/services/upload.service";
import { redis } from "../src/utils/redis.util";

dotenv.config();

async function runLocalWorker() {
  console.log("🚀 Starting Local Worker...");

  let hasJobs = true;
  while (hasJobs) {
    console.log("Checking queue...");
    try {
      // Check if there are items in the queue
      const queueLength = await redis.llen("job:queue");
      if (queueLength === 0) {
        console.log("✅ Queue is empty. Worker finished.");
        hasJobs = false;
        break;
      }

      console.log(`Found ${queueLength} job(s) in queue. Processing...`);
      const result = await processNextBatch();

      if (!result) {
        console.log("No result returned, stopping.");
        hasJobs = false;
      } else if (result.status === "completed") {
        console.log("✅ Batch completed successfully.");
      } else if (result.status === "continued") {
        console.log(`🔄 Job continued. Remaining rows: ${result.remaining}`);
        // Small delay to prevent hammering local CPU/Network too hard
        await new Promise((r) => setTimeout(r, 1000));
      }
    } catch (err) {
      console.error("❌ Worker Error:", err);
      // Wait a bit before retrying on error
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  console.log("👋 Local Worker Exit");
  process.exit(0);
}

runLocalWorker();
