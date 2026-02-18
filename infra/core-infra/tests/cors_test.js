const axios = require("axios");
const colors = require("colors");

const BASE_URL = process.env.BASE_URL || "http://localhost/api/v1";

const FRONTEND_ORIGINS = ["http://localhost:5173", "http://localhost:5174"];

const log = {
  phase: (name) => {
    console.log(`\n${"=".repeat(80)}`.cyan.bold);
    console.log(` ${name.toUpperCase().padEnd(78)}`.cyan.bold);
    console.log(`${"=".repeat(80)}`.cyan.bold);
  },
  step: (name) => {
    process.stdout.write(` ${"›".cyan} ${name.padEnd(60)} `);
  },
  pass: (info = "") => {
    process.stdout.write(`${"✓".green.bold} `);
    if (info) process.stdout.write(`  ${info.green}`);
    process.stdout.write("\n");
  },
  fail: (err) => {
    process.stdout.write(`${"✗".red.bold}\n`);
    console.error(`  ${"Error:".red.bold} ${err.message || err}`);
    process.exit(1);
  },
  info: (msg) => console.log(`    ${"•".blue} ${msg.gray}`),
};

async function testCORS(origin) {
  const testEndpoint = `${BASE_URL}/auth/login/student`;

  // Test OPTIONS preflight
  log.step(`CORS Preflight from ${origin}`);
  try {
    const preflightResponse = await axios({
      method: "OPTIONS",
      url: testEndpoint,
      headers: {
        Origin: origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type,Authorization",
      },
      validateStatus: () => true,
    });

    if (
      preflightResponse.status === 204 &&
      preflightResponse.headers["access-control-allow-origin"] === origin
    ) {
      log.pass("PREFLIGHT_OK");
    } else {
      log.fail(
        new Error(
          `Preflight failed: Status ${preflightResponse.status}, CORS header: ${preflightResponse.headers["access-control-allow-origin"]}`,
        ),
      );
    }
  } catch (error) {
    log.fail(error);
  }

  // Test actual POST request
  log.step(`CORS POST Request from ${origin}`);
  try {
    const response = await axios({
      method: "POST",
      url: testEndpoint,
      headers: {
        Origin: origin,
        "Content-Type": "application/json",
      },
      data: {
        username: "O210008",
        password: "password123",
      },
      validateStatus: () => true,
    });

    const corsHeader = response.headers["access-control-allow-origin"];
    const credentialsHeader =
      response.headers["access-control-allow-credentials"];

    if (corsHeader === origin && credentialsHeader === "true") {
      log.pass(`CORS_OK (${response.status})`);
    } else {
      log.fail(
        new Error(
          `CORS headers missing or incorrect. Expected: ${origin}, Got: ${corsHeader}, Credentials: ${credentialsHeader}`,
        ),
      );
    }
  } catch (error) {
    log.fail(error);
  }
}

async function testBlockedOrigin() {
  const blockedOrigin = "http://malicious-site.com";
  const testEndpoint = `${BASE_URL}/auth/login/student`;

  log.step(`Blocked Origin Test (${blockedOrigin})`);
  try {
    const response = await axios({
      method: "POST",
      url: testEndpoint,
      headers: {
        Origin: blockedOrigin,
        "Content-Type": "application/json",
      },
      data: {
        username: "O210008",
        password: "password123",
      },
      validateStatus: () => true,
    });

    const corsHeader = response.headers["access-control-allow-origin"];

    if (!corsHeader || corsHeader !== blockedOrigin) {
      log.pass("BLOCKED_CORRECTLY");
    } else {
      log.fail(
        new Error(
          `Security issue: Blocked origin ${blockedOrigin} was allowed!`,
        ),
      );
    }
  } catch (error) {
    log.fail(error);
  }
}

async function run() {
  log.phase("CORS Verification Test");

  log.info(
    `Testing CORS from frontend origins: ${FRONTEND_ORIGINS.join(", ")}`,
  );
  log.info(`Target: ${BASE_URL}`);

  // Test each allowed origin
  for (const origin of FRONTEND_ORIGINS) {
    await testCORS(origin);
  }

  // Test that blocked origins are rejected
  await testBlockedOrigin();

  console.log(
    `\n${"✓".green.bold} All CORS tests passed! Frontend origins are properly configured.\n`,
  );
}

run().catch((err) => {
  console.error(`\n${"✗".red.bold} CORS Test Failed:`, err);
  process.exit(1);
});
