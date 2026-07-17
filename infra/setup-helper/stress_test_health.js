const http = require("http");
const https = require("https");

// Configuration
const CONCURRENT_USERS = 500; // Start with 500, user asked for 10k but local/DB limits apply
const TOTAL_REQUESTS = 2000; // Total requests to send
const TARGET_URL = "http://localhost:3001/health"; // Start with health check (lightest)
// For DB load: 'http://localhost:3001/login' (POST)

const stats = {
  success: 0,
  failed: 0,
  minTime: Infinity,
  maxTime: 0,
  totalTime: 0,
  errors: {},
};

const startTime = process.hrtime();

function makeRequest(id) {
  return new Promise((resolve) => {
    const reqStart = process.hrtime();

    const req = http.get(TARGET_URL, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        const reqEnd = process.hrtime(reqStart);
        const duration = reqEnd[0] * 1000 + reqEnd[1] / 1e6;

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

    req.end();
  });
}

async function runBatch(batchSize) {
  const promises = [];
  for (let i = 0; i < batchSize; i++) {
    promises.push(makeRequest(i));
  }
  await Promise.all(promises);
}

async function main() {
  console.log(
    `Starting load test with ${CONCURRENT_USERS} concurrent requests...`,
  );
  console.log(`Target: ${TARGET_URL}`);

  // We strictly want concurrency, so we launch them all at once?
  // Node might choke on 10k simultaneous outgoing sockets.
  // Let's try to maintain a pool of CONCURRENT_USERS.

  let active = 0;
  let completed = 0;
  let started = 0;

  const queue = [];

  // Fill queue
  for (let i = 0; i < TOTAL_REQUESTS; i++) {
    queue.push(i);
  }

  const next = () => {
    if (queue.length === 0) return;

    const id = queue.shift();
    active++;
    started++;

    makeRequest(id).then(() => {
      active--;
      completed++;
      if (completed % 100 === 0) {
        process.stdout.write(
          `\rCompleted: ${completed}/${TOTAL_REQUESTS} | Active: ${active} `,
        );
      }
      if (queue.length > 0) {
        next();
      }
    });
  };

  // Start initial batch
  const initialBatch = Math.min(CONCURRENT_USERS, TOTAL_REQUESTS);
  for (let i = 0; i < initialBatch; i++) {
    next();
  }

  // Wait for all to finish
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

  console.log("\n\n=== LOAD TEST RESULTS ===");
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
