const axios = require("axios");
const { performance } = require("perf_hooks");

const BASE_URL = "https://uniz-gateway.vercel.app/api/v1";

// Configuration for Login Stress
const CONCURRENCY = 30; // Login is heavy, keeping concurrency lower to avoid instant BAN
const TOTAL_REQUESTS = 60;
const TARGET_USERNAME = "O210008";
const PASSWORD = "password123";

async function fireLoginBatch(batchSize, batchIndex) {
  const promises = [];
  const startTime = performance.now();

  for (let i = 0; i < batchSize; i++) {
    const id = batchIndex * batchSize + i + 1;
    promises.push(
      axios
        .post(`${BASE_URL}/auth/login`, {
          username: TARGET_USERNAME,
          password: PASSWORD,
        })
        .then((res) => ({ id, success: true, status: res.status, duration: 0 }))
        .catch((err) => ({
          id,
          success: false,
          status: err.response?.status || 500,
          error: err.message,
        })),
    );
  }

  const results = await Promise.all(promises);
  const duration = performance.now() - startTime;
  return { results, duration };
}

async function run() {
  console.log("========================================");
  console.log("    CRITICAL HURDLE TEST: /AUTH/LOGIN   ");
  console.log("========================================");
  console.log(`[Load] ${TOTAL_REQUESTS} Logins, ${CONCURRENCY} Concurrent`);

  let successCount = 0;
  let failCount = 0;
  let latencies = [];

  const batches = Math.ceil(TOTAL_REQUESTS / CONCURRENCY);

  for (let b = 0; b < batches; b++) {
    const currentBatchSize = Math.min(
      CONCURRENCY,
      TOTAL_REQUESTS - b * CONCURRENCY,
    );
    console.log(`\nFiring Login Batch ${b + 1}/${batches}...`);

    const { results, duration } = await fireLoginBatch(currentBatchSize, b);

    results.forEach((r) => {
      if (r.success) successCount++;
      else {
        failCount++;
        console.log(`   [FAIL] Login #${r.id}: ${r.status}`);
      }
    });

    const avg = duration / currentBatchSize;
    latencies.push(avg);
    console.log(
      `   Completed in ${duration.toFixed(2)}ms (Avg: ${avg.toFixed(2)}ms/login)`,
    );
  }

  const totalAvg = latencies.reduce((a, b) => a + b, 0) / latencies.length;

  console.log("\n========================================");
  console.log("           Hurdle Analysis              ");
  console.log("========================================");
  console.log(`Avg Login Time: ${totalAvg.toFixed(2)}ms`);
  console.log(
    `Compared to Grades: ${totalAvg > 300 ? "MUCH HEAVIER" : "Comparable"}`,
  );
  if (failCount > 0)
    console.log(" HURDLE DETECTED: Service started failing under load.");
  else console.log(" Service survived, but check the latency increase.");
  console.log("========================================");
}

run();
