import axios from "axios";

const TARGET_URL = "https://api.uniz.rguktong.in/";
const CONCURRENT_USERS = 1500;
const DURATION_SECONDS = 30;

async function runLoadTest() {
  console.log(
    `🚀 Starting Load Test: ${CONCURRENT_USERS} concurrent users -> ${TARGET_URL}`,
  );

  let successCount = 0;
  let errorCount = 0;
  let latencies = [];

  const start = Date.now();
  const endTime = start + DURATION_SECONDS * 1000;

  // Function to simulate a single user behavior
  async function userSession() {
    while (Date.now() < endTime) {
      try {
        const requestStart = Date.now();
        await axios.get(TARGET_URL, { timeout: 10000 });
        const requestEnd = Date.now();

        successCount++;
        latencies.push(requestEnd - requestStart);
      } catch (error) {
        errorCount++;
        // console.error(`Error: ${error.message}`);
      }
      // Small stagger to prevent local socket exhaustion if needed,
      // but the user asked for "concurrent at same time"
    }
  }

  // Launch all "users"
  const users = Array.from({ length: CONCURRENT_USERS }).map(() =>
    userSession(),
  );

  // Progress reporter
  const interval = setInterval(() => {
    const elapsed = (Date.now() - start) / 1000;
    console.log(
      `[${elapsed.toFixed(1)}s] Success: ${successCount} | Errors: ${errorCount} | Avg Latency: ${latencies.length ? (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2) : 0}ms`,
    );
  }, 2000);

  await Promise.all(users);
  clearInterval(interval);

  const totalElapsed = (Date.now() - start) / 1000;
  console.log("\n--- Final Result ---");
  console.log(`Total Requests: ${successCount + errorCount}`);
  console.log(
    `Success rate: ${((successCount / (successCount + errorCount)) * 100).toFixed(2)}%`,
  );
  console.log(
    `Requests per second: ${((successCount + errorCount) / totalElapsed).toFixed(2)}`,
  );

  if (latencies.length > 0) {
    latencies.sort((a, b) => a - b);
    console.log(`Min Latency: ${latencies[0]}ms`);
    console.log(`Max Latency: ${latencies[latencies.length - 1]}ms`);
    console.log(
      `p95 Latency: ${latencies[Math.floor(latencies.length * 0.95)]}ms`,
    );
    console.log(
      `p99 Latency: ${latencies[Math.floor(latencies.length * 0.99)]}ms`,
    );
  }
}

runLoadTest().catch(console.error);
