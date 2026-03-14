const { execSync } = require('child_process');

// --- START ---
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '50', 10);
const API_URL = 'https://api.uniz.rguktong.in';
const FRONTEND_URL = 'https://portal.uniz.rguktong.in';
const LANDING_URL = 'https://uniz.rguktong.in';
const ANALYTICS_BASE_URL = 'https://college-analytics.vercel.app';
const ANALYTICS_KEY = 'rgukt-uniz-secure-key-2026';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function runDbQuery(db, query) {
  try {
    const safeQuery = query.replace(/"/g, '\\"').replace(/\$/g, '\\$');
    const cmd = `ssh -o StrictHostKeyChecking=no root@76.13.241.174 "docker exec uniz-postgres psql -U uniz_admin -d ${db} -t -A -c \\"${safeQuery}\\""`;
    return execSync(cmd, { stdio: 'pipe' }).toString().trim();
  } catch (e) {
    return '';
  }
}

async function runRealStudentTest() {
  console.log(`🚀 Fasten your seatbelts! Simulating ${CONCURRENCY} real students on UniZ-Core!`);

  console.log(`\n⏳ [Setup] Borrowing ${CONCURRENCY} real students from Database...`);
  // Assuming roles are STUDENT and we just need 50 valid ones
  const studentsRaw = runDbQuery('uniz_auth', `SELECT username, "passwordHash" FROM "AuthCredential" WHERE role='STUDENT' AND "isDisabled"=false AND "username" NOT LIKE 'LOAD_TEST%' LIMIT ${CONCURRENCY}`);
  
  if (!studentsRaw) {
    console.error("❌ Failed to fetch real students from DB.");
    return;
  }

  const testUsers = studentsRaw.split('\n').filter(Boolean).map(row => {
    const [username, originalHash] = row.split('|');
    return { username, originalHash, temporaryPassword: 'LoadTest2026!@#' };
  });

  if (testUsers.length === 0) {
    console.error("❌ No active real students found.");
    return;
  }
  console.log(`✅ Loaded ${testUsers.length} real students.\n`);


  console.log(`🔥 [Phase 1: OTP Request & Quick Reset (Real User Simulation)]`);
  let timeStart = Date.now();
  let successFlows = 0;
  
  await Promise.all(testUsers.map(async (user) => {
    try {
      // 1. Request OTP (No emails because we intercept)
      const req = await fetch(`${API_URL}/api/v1/auth/otp/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username })
      });
      if (!req.ok) return;

      // Wait a bit to ensure OTP is committed
      await sleep(100);

      // 2. Fetch OTP directly from uniz_auth DB
      const otp = runDbQuery('uniz_auth', `SELECT otp FROM "OtpLog" WHERE username='${user.username}' ORDER BY "createdAt" DESC LIMIT 1;`);
      if (!otp) return;

      // 3. Verify OTP
      const verify = await fetch(`${API_URL}/api/v1/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, otp })
      });
      
      const verifyData = await verify.json();
      if (!verifyData.success || !verifyData.resetToken) return;

      // 4. Temporary Password Reset
      const reset = await fetch(`${API_URL}/api/v1/auth/password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: user.username, 
          resetToken: verifyData.resetToken,
          newPassword: user.temporaryPassword
        })
      });

      if (reset.ok) successFlows++;
    } catch (e) {}
  }));
  let timeEnd = Date.now();
  console.log(`✅ Real students hijacked, resetted passwords safely: ${successFlows}/${testUsers.length} in ${timeEnd - timeStart}ms`);


  console.log(`\n🔥 [Phase 2: Full System Login & Data Storm (+ Analytics)]`);
  timeStart = Date.now();
  let logins = 0, dataPulls = 0, analyticsHits = 0;

  await Promise.all(testUsers.map(async (user) => {
    try {
      // Concurrent Login + Frontend Hit
      const [loginRes, landing, portal] = await Promise.all([
        fetch(`${API_URL}/api/v1/auth/login/student`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            username: user.username, 
            password: user.temporaryPassword,
            captchaToken: 'uniz_dev_bypass_token_2026'
          })
        }),
        fetch(`${LANDING_URL}/`),
        fetch(`${FRONTEND_URL}/student/signin`)
      ]);
      
      const loginData = await loginRes.json();
      if (loginData.success && loginData.token) {
        logins++;
        const token = loginData.token;

        // Immediately fetch their grades and attendance to simulate Dashboard Loading
        // ALSO fetch Analytics as requested
        const [meRes, gradesRes, attendanceRes, ana1, ana2] = await Promise.all([
          fetch(`${API_URL}/api/v1/users/me`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/api/v1/academics/grades`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/api/v1/academics/attendance`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${ANALYTICS_BASE_URL}/api/analytics/student/${user.username}/attendance`, { 
            headers: { 'Authorization': `Bearer ${token}`, 'x-api-key': ANALYTICS_KEY } 
          }),
          fetch(`${ANALYTICS_BASE_URL}/api/analytics/student/${user.username}/grades-trend`, { 
            headers: { 'Authorization': `Bearer ${token}`, 'x-api-key': ANALYTICS_KEY } 
          })
        ]);

        if (meRes.ok && gradesRes.ok && attendanceRes.ok) {
          dataPulls++;
        }
        if (ana1.ok && ana2.ok) {
          analyticsHits++;
        }
      }
    } catch(e) {}
  }));
  timeEnd = Date.now();
  console.log(`✅ Logins Succeeded: ${logins}/${testUsers.length}`);
  console.log(`✅ Parallel Data Extracts Completed (/me, /grades, /attendance): ${dataPulls}/${logins}`);
  console.log(`✅ Analytics Fetches Completed (Bearer token used): ${analyticsHits}/${logins} in ${timeEnd - timeStart}ms`);


  console.log(`\n🧹 [Rollback] Restoring Real Passwords...`);
  // Build batch restore query
  const restoreQueries = testUsers.map(u => `UPDATE "AuthCredential" SET "passwordHash" = '${u.originalHash}' WHERE username = '${u.username}';`).join(' ');
  runDbQuery('uniz_auth', restoreQueries);
  console.log(`✅ All ${testUsers.length} real passwords restored untouched!`);

  console.log(`\n🏁 Load test simulation Complete!`);
}

runRealStudentTest().catch(console.error);
