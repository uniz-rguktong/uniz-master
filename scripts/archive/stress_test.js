const axios = require("axios");
const { performance } = require("perf_hooks");

const BASE_URL = "https://uniz-gateway.vercel.app/api/v1";

// Configuration
const CONCURRENCY = 50; // Number of simultaneous requests
const TOTAL_REQUESTS = 1000; // Total requests to fire
const TARGET_USERNAME = "O210008";
const PASSWORDS_TO_TRY = ["password123", "123456"];

async function login() {
  console.log(`[Setup] Attempting login for ${TARGET_USERNAME}...`);
  for (const password of PASSWORDS_TO_TRY) {
    try {
      const res = await axios.post(`${BASE_URL}/auth/login`, {
        username: TARGET_USERNAME,
        password: password,
      });
      if (res.data && res.data.token) {
        console.log(`[Setup] Login successful with password: ${password}`);
        return res.data.token;
      }
    } catch (e) {
      // Continue
    }
  }
  throw new Error("Login failed for stress test user");
}

async function fireBatch(token, batchSize, batchIndex) {
  const promises = [];
  const startTime = performance.now();

  for (let i = 0; i < batchSize; i++) {
    const id = batchIndex * batchSize + i + 1;
    promises.push(
      axios
        .get(`${BASE_URL}/academics/grades`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => ({
          id,
          success: true,
          status: res.status,
          time: 0,
          motivation: !!res.data.motivation,
        }))
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
  console.log("        UniZ API Stress Test            ");
  console.log("========================================");

  let token;
  try {
    token = await login();
  } catch (e) {
    console.error("FATAL: Could not log in. Aborting.");
    process.exit(1);
  }

  console.log(`\n[Load] Starting stress test on GET /academics/grades`);
  console.log(
    `[Load] Config: ${TOTAL_REQUESTS} requests, ${CONCURRENCY} concurrent`,
  );

  let successCount = 0;
  let failCount = 0;
  let totalTime = 0;
  let motivationPresentCount = 0;

  // Process in batches
  const batches = Math.ceil(TOTAL_REQUESTS / CONCURRENCY);

  for (let b = 0; b < batches; b++) {
    const currentBatchSize = Math.min(
      CONCURRENCY,
      TOTAL_REQUESTS - b * CONCURRENCY,
    );
    console.log(
      `\nFiring batch ${b + 1}/${batches} (${currentBatchSize} reqs)...`,
    );

    const { results, duration } = await fireBatch(token, currentBatchSize, b);

    results.forEach((r) => {
      if (r.success) {
        successCount++;
        if (r.motivation) motivationPresentCount++;
      } else {
        failCount++;
        console.log(`   [Fail] Request #${r.id}: ${r.status} - ${r.error}`);
      }
    });

    console.log(
      `   Batch completed in ${duration.toFixed(2)}ms (Avg: ${(duration / currentBatchSize).toFixed(2)}ms/req)`,
    );
    totalTime += duration;
  }

  console.log("\n========================================");
  console.log("           Test Results                 ");
  console.log("========================================");
  console.log(`Total Requests: ${TOTAL_REQUESTS}`);
  console.log(
    `Successful:     ${successCount} (${((successCount / TOTAL_REQUESTS) * 100).toFixed(1)}%)`,
  );
  console.log(`Failed:         ${failCount}`);
  console.log(
    `Motivation Found: ${motivationPresentCount} times (Async check)`,
  );
  console.log(`Total Duration: ${totalTime.toFixed(2)}ms`);
  console.log("========================================");
}

run();
