const axios = require("axios");
const { performance } = require("perf_hooks");

const BASE_URL = "https://uniz-gateway.vercel.app/api/v1";

// Configuration for Unique User Stress (Real DB Load)
const CONCURRENCY = 20; // Match the DB connection limit (20)
const TOTAL_USERS = 40;
const TARGET_BATCH = "O21"; // We'll generate IDs O210001, O210002...

async function runUniqueTest() {
  console.log("========================================");
  console.log("   REAL DB HURDLE: UNIQUE USER STRESS   ");
  console.log("========================================");

  // 1. Get Admin Token
  console.log("[Setup] Logging in as Admin...");
  let adminToken;
  try {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      username: "webmaster",
      password: "webmaster@uniz",
    });
    adminToken = res.data.token;
  } catch (e) {
    console.error("Admin Login Failed");
    return;
  }

  // 2. Fire unique requests
  console.log(
    `[Load] Firing ${TOTAL_USERS} unique student grade requests (CONCURRENCY: ${CONCURRENCY})...`,
  );
  console.log(`[Load] This triggers 100% CACHE MISS -> REAL DB LOAD.`);

  let successCount = 0;
  let failCount = 0;
  let totalTime = 0;
  const startOverall = performance.now();

  const batches = Math.ceil(TOTAL_USERS / CONCURRENCY);

  for (let b = 0; b < batches; b++) {
    const promises = [];
    for (let i = 0; i < CONCURRENCY; i++) {
      const studentIdx = (b * CONCURRENCY + i + 1).toString().padStart(4, "0");
      const studentId = `${TARGET_BATCH}${studentIdx}`;

      promises.push(
        axios
          .get(`${BASE_URL}/academics/grades?studentId=${studentId}`, {
            headers: { Authorization: `Bearer ${adminToken}` },
          })
          .then((res) => ({ success: true, studentId }))
          .catch((err) => ({
            success: false,
            studentId,
            status: err.response?.status || 500,
          })),
      );
    }

    const results = await Promise.all(promises);
    results.forEach((r) => {
      if (r.success) successCount++;
      else {
        failCount++;
        console.log(`   [FAIL] User ${r.studentId}: ${r.status}`);
      }
    });
    console.log(`   Batch ${b + 1} complete.`);
  }

  const endOverall = performance.now();
  console.log("\n========================================");
  console.log("           Unique Load Results          ");
  console.log("========================================");
  console.log(`Total Unique Users: ${TOTAL_USERS}`);
  console.log(`Success:           ${successCount}`);
  console.log(`Failed:            ${failCount}`);
  console.log(
    `Avg Latency:       ${((endOverall - startOverall) / TOTAL_USERS).toFixed(2)}ms`,
  );

  if (failCount > 0) {
    console.log("\n THE HURDLE IS THE DATABASE POOL.");
    console.log(
      "Wait times for DB connections are exceeding the gateway timeout.",
    );
  } else {
    console.log(
      "\n The system survived unique hits, but watch the latency increase!",
    );
  }
}

runUniqueTest();
