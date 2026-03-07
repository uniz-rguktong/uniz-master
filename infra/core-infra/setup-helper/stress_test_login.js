const http = require("http");

// Configuration
const CONCURRENT_USERS = 200; // Lower concurrency for heavily DB-bound test to avoid instant crash
const TOTAL_REQUESTS = 500; // Keep it small to check stability first
const TARGET_HOST = "localhost";
const TARGET_PORT = 3001;
const TARGET_PATH = "/login";

const stats = {
  success: 0,
  failed: 0,
  minTime: Infinity,
  maxTime: 0,
  totalTime: 0,
  errors: {},
};

const startTime = process.hrtime();

const payload = JSON.stringify({
  username: "o210008",
  password: "sree@2006",
});

function makeRequest(id) {
  return new Promise((resolve) => {
    const reqStart = process.hrtime();

    const options = {
      hostname: TARGET_HOST,
      port: TARGET_PORT,
      path: TARGET_PATH,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        const reqEnd = process.hrtime(reqStart);
        const duration = reqEnd[0] * 1000 + reqEnd[1] / 1e6;

        // Login returns 200 on success, 401 on failure
        if (res.statusCode >= 200 && res.statusCode < 300) {
          stats.success++;
          stats.totalTime += duration;
          if (duration < stats.minTime) stats.minTime = duration;
          if (duration > stats.maxTime) stats.maxTime = duration;
        } else {
          stats.failed++;
          const code = res.statusCode;
          stats.errors[code] = (stats.errors[code] || 0) + 1;
        }
        resolve();
      });
    });

    req.on("error", (e) => {
      stats.failed++;
      const msg = e.code || e.message;
      stats.errors[msg] = (stats.errors[msg] || 0) + 1;
      resolve();
    });

    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log(
    `Starting DB Load Test (Login) with ${CONCURRENT_USERS} concurrent requests...`,
  );

  let active = 0;
  let completed = 0;

  const queue = [];
  for (let i = 0; i < TOTAL_REQUESTS; i++) queue.push(i);

  const next = () => {
    if (queue.length === 0) return;
    const id = queue.shift();
    active++;

    makeRequest(id).then(() => {
      active--;
      completed++;
      if (completed % 20 === 0) {
        process.stdout.write(
          `\rCompleted: ${completed}/${TOTAL_REQUESTS} | Active: ${active} `,
        );
      }
      if (queue.length > 0) next();
    });
  };

  const initialBatch = Math.min(CONCURRENT_USERS, TOTAL_REQUESTS);
  for (let i = 0; i < initialBatch; i++) next();

  const checkInterval = setInterval(() => {
    if (completed >= TOTAL_REQUESTS) {
      clearInterval(checkInterval);
      printReport();
    }
  }, 100);
}

function printReport() {
  const totalEnd = process.hrtime(startTime);
  const totalDurationSec = totalEnd[0] + totalEnd[1] / 1e9;

  console.log("\n\n=== LOGIN LOAD TEST RESULTS ===");
  console.log(`Total Requests: ${TOTAL_REQUESTS}`);
  console.log(`Concurrency:    ${CONCURRENT_USERS}`);
  console.log(`Total Time:     ${totalDurationSec.toFixed(2)}s`);
  console.log(
    `RPS:            ${(TOTAL_REQUESTS / totalDurationSec).toFixed(2)} req/s`,
  );
  console.log(`Success:        ${stats.success}`);
  console.log(`Failed:         ${stats.failed}`);
  console.log(
    `Avg Latency:    ${(stats.success > 0 ? stats.totalTime / stats.success : 0).toFixed(2)} ms`,
  );
  console.log(
    `Min Latency:    ${stats.minTime === Infinity ? 0 : stats.minTime.toFixed(2)} ms`,
  );
  console.log(`Max Latency:    ${stats.maxTime.toFixed(2)} ms`);

  if (Object.keys(stats.errors).length > 0) {
    console.log("\nErrors:");
    console.table(stats.errors);
  }
}

main();
