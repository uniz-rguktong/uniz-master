/**
 * Local semester registration E2E test — reports PASS/FAIL per stage.
 * Usage: node scripts/test-sem-registration-local.js
 */
const BASE_URL = process.env.API_URL || "http://localhost:3000/api/v1";
const CAPTCHA = "uniz_dev_bypass_token_2026";
const results = [];

function log(stage, status, detail) {
  const entry = { stage, status, detail };
  results.push(entry);
  const icon = status === "PASS" ? "✅" : status === "FAIL" ? "❌" : "⚠️";
  console.log(`${icon} [${stage}] ${status}: ${typeof detail === "string" ? detail : JSON.stringify(detail)}`);
}

async function req(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

async function login(username, password, admin = false) {
  const path = admin ? "/auth/login/admin" : "/auth/login";
  const { status, body } = await req(`${BASE_URL}${path}`, {
    method: "POST",
    body: JSON.stringify({ username, password, captchaToken: CAPTCHA }),
  });
  if (status === 200 && body?.token) return body.token;
  return null;
}

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

async function run() {
  console.log("=== LOCAL SEMESTER REGISTRATION E2E ===\n");
  console.log(`API: ${BASE_URL}\n`);

  // --- AUTH ---
  const wmToken = await login("webmaster", "password123", true);
  log("Auth: Webmaster", wmToken ? "PASS" : "FAIL", wmToken ? "token acquired" : "login failed");

  const deanToken = await login("dean", "password123", true);
  log("Auth: Dean", deanToken ? "PASS" : "FAIL", deanToken ? "token acquired" : "login failed");

  let hodCseToken = await login("hod_cse", "password123", true);
  if (!hodCseToken) {
    hodCseToken = await login("hod_cse", "hod_cse@uniz", true);
  }
  log("Auth: HOD CSE", hodCseToken ? "PASS" : "WARN", hodCseToken ? "token acquired" : "no hod_cse account — will try to create");

  let studentToken = await login("O210008", "password123");
  if (!studentToken) studentToken = await login("O210008", "O210008@rguktong");
  log("Auth: Student O210008", studentToken ? "PASS" : "FAIL", studentToken ? "token acquired" : "login failed");

  if (!wmToken) {
    console.log("\n=== BLOCKED: cannot continue without webmaster ===");
    return results;
  }

  // --- CLEANUP existing test semesters ---
  const { body: existingSems } = await req(`${BASE_URL}/academics/semester`, { headers: auth(wmToken) });
  if (Array.isArray(existingSems)) {
    for (const s of existingSems) {
      await req(`${BASE_URL}/academics/semester/${s.id}`, { method: "DELETE", headers: auth(wmToken) });
    }
    log("Cleanup", "PASS", `deleted ${existingSems.length} existing semester(s)`);
  }

  // --- WEBMASTER: init semester (CSE-only so one HOD advance opens registration) ---
  const semLabel = `AY 2026-27 E3-SEM-1 TEST-${Date.now()}`;
  const initRes = await req(`${BASE_URL}/academics/semester/init`, {
    method: "POST",
    headers: auth(wmToken),
    body: JSON.stringify({ academicSemester: semLabel, branches: ["CSE"] }),
  });
  const semId = initRes.body?.semester?.id;
  const initOk = initRes.status === 201 && semId;
  log("Webmaster: init semester", initOk ? "PASS" : "FAIL", { status: initRes.status, semId, status_field: initRes.body?.semester?.status });

  if (!semId) return results;

  // Verify allocations created
  const { body: cseAllocs } = await req(`${BASE_URL}/academics/dean/review/CSE?semesterId=${semId}`, { headers: auth(wmToken) });
  log("Webmaster: branch allocations", Array.isArray(cseAllocs) && cseAllocs.length > 0 ? "PASS" : "FAIL", `CSE allocations: ${Array.isArray(cseAllocs) ? cseAllocs.length : "error"}`);

  // Auth: student blocked from init
  const studentInit = await req(`${BASE_URL}/academics/semester/init`, {
    method: "POST",
    headers: auth(studentToken || "invalid"),
    body: JSON.stringify({ academicSemester: "SHOULD-FAIL", branches: ["CSE"] }),
  });
  log("Auth: student cannot init", studentInit.status === 401 || studentInit.status === 403 ? "PASS" : "FAIL", `HTTP ${studentInit.status}`);

  // --- DEAN: advance to HOD_REVIEW ---
  if (deanToken) {
    const deanAdvance = await req(`${BASE_URL}/academics/semester/${semId}/advance`, {
      method: "POST",
      headers: auth(deanToken),
      body: JSON.stringify({ action: "approve" }),
    });
    const deanOk = deanAdvance.status === 200 && deanAdvance.body?.semester?.status === "HOD_REVIEW";
    log("Dean: approve → HOD_REVIEW", deanOk ? "PASS" : "FAIL", { status: deanAdvance.status, semesterStatus: deanAdvance.body?.semester?.status });

    // Dean cannot approve again from wrong state (student register should fail)
    if (studentToken) {
      const closedReg = await req(`${BASE_URL}/academics/student/register`, {
        method: "POST",
        headers: auth(studentToken),
        body: JSON.stringify({ subjectIds: ["fake-id"] }),
      });
      log("Student: register while HOD_REVIEW", closedReg.status === 403 ? "PASS" : "FAIL", { status: closedReg.status, error: closedReg.body?.error });
    }
  } else {
    log("Dean: approve", "FAIL", "no dean token");
  }

  // --- HOD: create if missing, then approve CSE ---
  if (!hodCseToken && wmToken) {
    const createHod = await req(`${BASE_URL}/profile/faculty/create`, {
      method: "POST",
      headers: auth(wmToken),
      body: JSON.stringify({
        username: "hod_cse",
        name: "CSE HOD Test",
        email: "hod_cse@test.local",
        department: "CSE",
        role: "hod",
        designation: "Head of Department",
        password: "password123",
      }),
    });
    log("Setup: create hod_cse", createHod.status === 200 || createHod.status === 201 ? "PASS" : "WARN", { status: createHod.status, body: createHod.body });
    hodCseToken = await login("hod_cse", "password123", true) || await login("hod_cse", "hod_cse@uniz", true);
  }

  if (hodCseToken) {
    const crossBranch = await req(`${BASE_URL}/academics/semester/${semId}/advance`, {
      method: "POST",
      headers: auth(hodCseToken),
      body: JSON.stringify({ action: "approve", branch: "ECE" }),
    });
    log(
      "Auth: CSE HOD approving ECE",
      crossBranch.status === 403 ? "PASS" : "FAIL",
      { status: crossBranch.status, body: crossBranch.body },
    );

    const hodAdvance = await req(`${BASE_URL}/academics/semester/${semId}/advance`, {
      method: "POST",
      headers: auth(hodCseToken),
      body: JSON.stringify({ action: "approve", branch: "CSE" }),
    });
    const hodOk =
      hodAdvance.status === 200 &&
      hodAdvance.body?.semester?.status === "REGISTRATION_OPEN";
    log("HOD CSE: advance approve", hodOk ? "PASS" : "FAIL", {
      status: hodAdvance.status,
      semesterStatus: hodAdvance.body?.semester?.status,
    });
  } else {
    log("HOD CSE: advance approve", "FAIL", "no hod_cse account");
  }

  // --- STUDENT: available + register ---
  if (studentToken) {
    const avail = await req(
      `${BASE_URL}/academics/student/available?branch=CSE&year=E3&v=${Date.now()}`,
      { headers: auth(studentToken) },
    );
    const availOk = avail.status === 200 && avail.body?.isOpen === true;
    log("Student: fetch available subjects", availOk ? "PASS" : "FAIL", {
      status: avail.status,
      isOpen: avail.body?.isOpen,
      count: avail.body?.subjects?.length,
      alreadyRegistered: avail.body?.alreadyRegistered,
    });

    if (availOk && avail.body?.subjects?.length > 0 && !avail.body?.alreadyRegistered) {
      const allIds = avail.body.subjects.map((s) => s.subject?.id || s.subjectId);

      const regPartial = await req(`${BASE_URL}/academics/student/register`, {
        method: "POST",
        headers: auth(studentToken),
        body: JSON.stringify({ subjectIds: allIds.slice(0, 2) }),
      });
      log(
        "Student: partial register blocked",
        regPartial.status === 400 ? "PASS" : "FAIL",
        { status: regPartial.status, error: regPartial.body?.error?.slice?.(0, 80) },
      );

      const regFull = await req(`${BASE_URL}/academics/student/register`, {
        method: "POST",
        headers: auth(studentToken),
        body: JSON.stringify({ subjectIds: allIds }),
      });
      log(
        "Student: full register",
        regFull.status === 200 || regFull.status === 201 ? "PASS" : "FAIL",
        { status: regFull.status, success: regFull.body?.success, error: regFull.body?.error },
      );

      const regDup = await req(`${BASE_URL}/academics/student/register`, {
        method: "POST",
        headers: auth(studentToken),
        body: JSON.stringify({ subjectIds: allIds }),
      });
      log(
        "Student: duplicate register",
        regDup.status === 409 ? "PASS" : "FAIL",
        { status: regDup.status, error: regDup.body?.error },
      );

      const availAfter = await req(
        `${BASE_URL}/academics/student/available?branch=CSE&year=E3&v=${Date.now()}`,
        { headers: auth(studentToken) },
      );
      log(
        "Student: alreadyRegistered flag",
        availAfter.body?.alreadyRegistered === true ? "PASS" : "FAIL",
        availAfter.body?.alreadyRegistered,
      );
    } else if (avail.body?.alreadyRegistered) {
      log("Student: register", "WARN", "already registered from prior run");
    } else {
      log("Student: register", "FAIL", "no subjects available for E3 CSE");
    }
  }

  // --- Closed window edge case ---
  const closeRes = await req(`${BASE_URL}/academics/semester/${semId}/config`, {
    method: "PUT",
    headers: auth(wmToken),
    body: JSON.stringify({
      registrationStart: "2099-01-01T00:00:00.000Z",
      registrationEnd: "2099-01-02T00:00:00.000Z",
    }),
  });
  if (studentToken) {
    const futureReg = await req(`${BASE_URL}/academics/student/register`, {
      method: "POST",
      headers: auth(studentToken),
      body: JSON.stringify({ subjectIds: [] }),
    });
    log("Student: closed/future window", futureReg.status === 403 ? "PASS" : "WARN", { status: futureReg.status, error: futureReg.body?.error });
  }

  // --- Admin verification ---
  const regs = await req(`${BASE_URL}/academics/registrations?semesterId=${semId}&branch=all`, { headers: auth(wmToken) });
  log("Webmaster: view registrations", Array.isArray(regs.body) ? "PASS" : "FAIL", `count=${Array.isArray(regs.body) ? regs.body.length : "n/a"}`);

  const overview = await req(`${BASE_URL}/academics/semester/overview`, { headers: auth(wmToken) });
  log("Webmaster: semester overview", overview.status === 200 ? "PASS" : "FAIL", overview.body?.semester?.name || overview.body);

  console.log("\n=== SUMMARY ===");
  const pass = results.filter((r) => r.status === "PASS").length;
  const fail = results.filter((r) => r.status === "FAIL").length;
  const warn = results.filter((r) => r.status === "WARN").length;
  console.log(`PASS: ${pass} | FAIL: ${fail} | WARN: ${warn}`);
  return results;
}

run().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
