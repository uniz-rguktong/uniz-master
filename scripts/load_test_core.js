const fs = require("fs");
const { execSync } = require("child_process");

let internalSecret = "uniz-core";
let authDbUrl = "";

try {
  const envFile = fs.readFileSync("/root/uniz-secrets.env", "utf8");
  envFile.split("\n").forEach((line) => {
    if (line.startsWith("INTERNAL_SECRET="))
      internalSecret = line.split("=")[1].replace(/["']/g, "");
    if (line.startsWith("AUTH_DATABASE_URL="))
      authDbUrl = line.split("=")[1].replace(/["']/g, "");
  });
} catch (e) {}

// --- CONFIGURATION ---
const CONCURRENCY = parseInt(process.env.CONCURRENCY || "50", 10);
const API_URL = "https://api.uniz.rguktong.in";
const FRONTEND_URL = "https://portal.uniz.rguktong.in";
const LANDING_URL = "https://uniz.rguktong.in";
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || internalSecret;
const DATABASE_URL = authDbUrl;
const TEST_USERS_COUNT = CONCURRENCY;

// Sleep utility
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function runDbCommand(query) {
  try {
    // Escape single quotes for the bash command inside kubectl
    const safeQuery = query.replace(/'/g, "'\\''");
    const cmd = `kubectl exec -i $(kubectl get pods -l app=uniz-auth-service -o jsonpath='{.items[0].metadata.name}') -- psql "${DATABASE_URL}" -t -A -c '${safeQuery}'`;
    return execSync(cmd).toString().trim();
  } catch (e) {
    return "";
  }
}

async function runLoadTest() {
  console.log(
    `🚀 Starting UniZ-Core Load Test with ${CONCURRENCY} concurrent users...`,
  );
  console.log(`Target APIs: ${API_URL}`);

  // 1. Setup Phase: Create Test Users
  console.log(
    `\n⏳ [Setup] Creating ${TEST_USERS_COUNT} temporary test users...`,
  );
  const testUsers = [];
  for (let i = 1; i <= TEST_USERS_COUNT; i++) {
    const username = `LOAD_TEST_STU_${i.toString().padStart(3, "0")}`;
    testUsers.push({ username, password: "InitialPassword123" });
  }

  // Create users in parallel using internal signup bypass
  let createdCount = 0;
  await Promise.all(
    testUsers.map(async (user) => {
      try {
        const res = await fetch(`${API_URL}/api/v1/auth/signup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": INTERNAL_SECRET,
          },
          body: JSON.stringify({
            username: user.username,
            password: user.password,
            role: "STUDENT",
          }),
        });
        if (res.ok || res.status === 409) createdCount++;
      } catch (e) {}
    }),
  );
  console.log(
    `✅ [Setup] ${createdCount}/${TEST_USERS_COUNT} test users ready.`,
  );

  // 2. Load Testing Phase
  console.log(`\n🔥 [Phase 1: Frontend & Landing Page Hit]`);
  let timeStart = Date.now();
  let success = 0;

  await Promise.all(
    testUsers.map(async () => {
      try {
        const [landing, portal] = await Promise.all([
          fetch(`${LANDING_URL}/`),
          fetch(`${FRONTEND_URL}/student/signin`),
        ]);
        if (landing.ok && portal.ok) success++;
      } catch (e) {}
    }),
  );
  let timeEnd = Date.now();
  console.log(
    `✅ Frontend Hits: ${success}/${TEST_USERS_COUNT} successful in ${timeEnd - timeStart}ms`,
  );

  console.log(`\n🔥 [Phase 2: OTP Request & Password Reset Simulation]`);
  timeStart = Date.now();
  success = 0;

  await Promise.all(
    testUsers.map(async (user) => {
      try {
        // 1. Request OTP
        const req = await fetch(`${API_URL}/api/v1/auth/otp/request`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: user.username }),
        });
        if (!req.ok) return;

        // 2. Fetch OTP directly from DB via kubectl
        const otp = runDbCommand(
          `SELECT otp FROM "OtpLog" WHERE username='${user.username}' ORDER BY "createdAt" DESC LIMIT 1;`,
        );
        if (!otp) return;

        // 3. Verify OTP
        const verify = await fetch(`${API_URL}/api/v1/auth/otp/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: user.username, otp }),
        });

        const verifyData = await verify.json();
        if (!verifyData.success || !verifyData.resetToken) return;

        // 4. Reset Password
        user.password = "NewPassword789!"; // Update memory
        const reset = await fetch(`${API_URL}/api/v1/auth/password/reset`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: user.username,
            resetToken: verifyData.resetToken,
            newPassword: user.password,
          }),
        });

        if (reset.ok) success++;
      } catch (e) {}
    }),
  );
  timeEnd = Date.now();
  console.log(
    `✅ Full Reset Flows: ${success}/${TEST_USERS_COUNT} completed in ${timeEnd - timeStart}ms`,
  );

  console.log(`\n🔥 [Phase 3: Login & Data Fetching (Token Exchange)]`);
  timeStart = Date.now();
  success = 0;
  let dataSuccess = 0;

  await Promise.all(
    testUsers.map(async (user) => {
      try {
        const loginRes = await fetch(`${API_URL}/api/v1/auth/login/student`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: user.username,
            password: user.password,
            captchaToken: "uniz_dev_bypass_token_2026",
          }),
        });

        const loginData = await loginRes.json();
        if (loginData.success && loginData.token) {
          success++;
          const token = loginData.token;

          // Fetch user data simultaneously
          const [meRes, gradesRes, attendanceRes] = await Promise.all([
            fetch(`${API_URL}/api/v1/users/me`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(`${API_URL}/api/v1/academics/grades`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(`${API_URL}/api/v1/academics/attendance`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);

          if (meRes.ok && attendanceRes.ok) {
            dataSuccess++;
          }
        }
      } catch (e) {}
    }),
  );
  timeEnd = Date.now();
  console.log(`✅ Logins: ${success}/${TEST_USERS_COUNT}`);
  console.log(
    `✅ Parallel Data Fetches(/me, /grades, /attendance): ${dataSuccess}/${TEST_USERS_COUNT} completed in ${timeEnd - timeStart}ms`,
  );

  console.log(`\n🧹 [Cleanup] Removing test users...`);
  runDbCommand(
    `DELETE FROM "AuthCredential" WHERE username LIKE 'LOAD_TEST_STU_%'; DELETE FROM "OtpLog" WHERE username LIKE 'LOAD_TEST_STU_%';`,
  );
  console.log(`✅ Cleanup Done.`);

  console.log(`\n🏁 load test complete!`);
}

runLoadTest().catch(console.error);
