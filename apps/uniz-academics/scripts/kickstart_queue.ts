import { processNextBatch } from "../src/services/upload.service";
import dotenv from "dotenv";
dotenv.config();

async function run() {
  console.log("Attempting to process one batch...");
  const result = await processNextBatch();
  console.log("Result:", result);
  process.exit(0);
}

run();
