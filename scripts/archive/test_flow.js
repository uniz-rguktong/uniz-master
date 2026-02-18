const fs = require("fs");
const FormData = require("form-data");
const axios = require("axios");
const readline = require("readline");
const { performance } = require("perf_hooks");

const BASE_URL = "https://uniz-gateway.vercel.app/api/v1";

const log = (msg) => console.log(msg);
const section = (msg) =>
  console.log(
    `\n========================================\n${msg}\n========================================`,
  );

// Mock user input function
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askUser = (question) =>
  new Promise((resolve) => rl.question(question, resolve));

// Standard Fetch Helper
async function request(method, endpoint, body = null, token = null) {
  console.log(`\n[${method}] ${endpoint}`);
  if (body) console.log("Payload:", JSON.stringify(body));

  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const start = performance.now();
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const duration = (performance.now() - start).toFixed(2);

    const text = await res.text();
    let data = {};
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { message: text };
    }

    console.log(`Response (${res.status}) - ${duration}ms:`);
    const jsonStr = JSON.stringify(data, null, 2);
    if (jsonStr.length > 2000)
      console.log(jsonStr.substring(0, 2000) + "... [Truncated]");
    else console.log(jsonStr);

    if (!res.ok) {
      throw new Error(`API Error ${res.status}: ${JSON.stringify(data)}`);
    }
    return data;
  } catch (e) {
    if (e.cause && e.cause.code === "ECONNREFUSED") {
      throw new Error("Connection Refused! Is the server running?");
    }
    throw e;
  }
}

async function uploadFile(endpoint, filePath, token) {
  console.log(`\n[POST] (Upload) ${endpoint}`);
  console.log(`File: ${filePath}`);

  try {
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath));

    const res = await axios.post(`${BASE_URL}${endpoint}`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`,
        "x-upload-type": "FULL_BATCH",
      },
    });

    console.log(`Response (${res.status}):`, JSON.stringify(res.data, null, 2));
    return res.data;
  } catch (e) {
    console.error("Upload Error:", e.message);
    throw new Error(`Upload Failed: ${e.message}`);
  }
}

async function run() {
  section("UniZ Full Flow Test: Academic & Outpass");

  try {
    // ==========================================
    // PHASE 0: ACCOUNT SECURITY (Interactive)
    // ==========================================
    section("Phase 0: Account Security (Interactive)");

    console.log("INFO: Testing Password Reset Flow for O210008...");

    try {
      await request("POST", "/auth/otp/request", { username: "O210008" });
      log("SUCCESS: OTP Requested. Check your email/console.");
    } catch (e) {
      log(`FAILURE: OTP Request Failed: ${e.message}`);
    }

    while (true) {
      const otp = await askUser(
        "\nPROMPT: Enter the OTP sent to O210008 (or press Enter/type 'skip' to skip): ",
      );

      if (!otp || otp.toLowerCase() === "skip") {
        log("WARN: OTP Step Skipped by user.");
        break;
      }

      try {
        const newPass = "password123"; // Force keep it consistent for test
        await request("POST", "/auth/password/reset", {
          username: "O210008",
          otp: otp.trim(),
          newPassword: newPass,
        });
        log("SUCCESS: Password Reset Successful");
        await request("POST", "/auth/login", {
          username: "O210008",
          password: newPass,
        });
        log("SUCCESS: Logged in with New Password!");
        global.studentPassword = newPass;
        break;
      } catch (e) {
        log(`FAILURE: Error: ${e.message}`);
        log("INFO: Please try again.");
      }
    }

    // ==========================================
    // PHASE 1: ACADEMIC UPLOADS (Webmaster)
    // ==========================================
    section("Phase 1: Academic Uploads (Webmaster)");
    let webmasterToken;
    try {
      const res = await request("POST", "/auth/login", {
        username: "webmaster",
        password: "webmaster@uniz",
      });
      webmasterToken = res.token;
      log("SUCCESS: Webmaster Logged In");

      if (fs.existsSync("tests/data/full_batch_grades.xlsx")) {
        await uploadFile(
          "/academics/grades/upload",
          "tests/data/full_batch_grades.xlsx",
          webmasterToken,
        );
        log("SUCCESS: Grades Uploaded");
      }

      if (fs.existsSync("tests/data/full_batch_attendance.xlsx")) {
        await uploadFile(
          "/academics/attendance/upload",
          "tests/data/full_batch_attendance.xlsx",
          webmasterToken,
        );
        log("SUCCESS: Attendance Uploaded");
      }
    } catch (e) {
      log(`FAILURE: Academic Phase Failed: ${e.message}`);
    }

    // ==========================================
    // PHASE 2: STUDENT VIEW (Academics)
    // ==========================================
    section("Phase 2: Student Academic View");
    let studentToken;
    try {
      let passwords = ["password123", "123456"];
      if (global.studentPassword) passwords.unshift(global.studentPassword);

      for (const p of passwords) {
        try {
          console.log(`Trying login with '${p}'...`);
          const res = await request("POST", "/auth/login", {
            username: "O210008",
            password: p,
          });
          studentToken = res.token;
          log(`SUCCESS: Student Logged In (Password: ${p})`);
          break;
        } catch (e) {
          /* Cont */
        }
      }

      if (!studentToken)
        throw new Error(
          "CRITICAL: Student Login Failed for O210008. Aborting test.",
        );

      const gradesRes = await request(
        "GET",
        "/academics/grades",
        null,
        studentToken,
      );
      log(`SUCCESS: Grades Fetched: ${gradesRes.grades?.length || 0} records`);

      const attRes = await request(
        "GET",
        "/academics/attendance",
        null,
        studentToken,
      );
      log(
        `SUCCESS: Attendance Fetched: ${attRes.attendance?.length || 0} records`,
      );
    } catch (e) {
      log(`FAILURE: Student Academic Phase Failed: ${e.message}`);
      if (e.message.includes("CRITICAL")) {
        rl.close();
        process.exit(1);
      }
    }

    // ==========================================
    // PHASE 3: OUTPASS FLOW
    // ==========================================
    section("Phase 3: Outpass Lifecycle");

    let gender = "Male";
    try {
      const profile = await request(
        "GET",
        "/profile/student/me",
        null,
        studentToken,
      );
      gender = profile.gender || "Male";
    } catch (e) {}

    let requestId;
    const caretakerUser =
      gender.toLowerCase() === "female" ? "caretaker_female" : "caretaker_male";
    let caretakerToken;
    try {
      const res = await request("POST", "/auth/login", {
        username: caretakerUser,
        password: `${caretakerUser}@uniz`,
      });
      caretakerToken = res.token;
    } catch (e) {
      log(`FAILURE: Caretaker Login Failed`);
      return;
    }

    log("INFO: Checking Existing Requests (Admin View)...");
    try {
      const outpassesRes = await request(
        "GET",
        `/requests/outpass/all?search=O210008`,
        null,
        caretakerToken,
      );
      const outingsRes = await request(
        "GET",
        `/requests/outing/all?search=O210008`,
        null,
        caretakerToken,
      );
      const allRequests = [
        ...(outpassesRes.outpasses || []),
        ...(outingsRes.outings || []),
      ];
      const active = allRequests.find(
        (r) => !r.is_rejected && !r.is_expired && !r.checked_in_time,
      );

      if (active) {
        requestId = active._id || active.id;
        log(`WARN: Found active request ${requestId}. Resuming...`);
      } else {
        const payload = {
          reason: "Full Flow Test",
          destination: "Test Dest",
          contact: "9999999999",
          fromDay: new Date(Date.now() + 86400000).toISOString(),
          toDay: new Date(Date.now() + 172800000).toISOString(),
        };
        const res = await request(
          "POST",
          "/requests/outpass",
          payload,
          studentToken,
        );
        requestId = res.data?.id || res.id;
        log(`SUCCESS: Created New Outpass: ${requestId}`);
      }
    } catch (e) {
      log(`FAILURE: Setup Failed: ${e.message}`);
      return;
    }

    // 3. Chain with 'forward' actions to test hierarchical flow
    const tryAction = async (role, token, action = "approve") => {
      try {
        const res = await request(
          "POST",
          `/requests/${requestId}/approve`,
          { comments: "OK", action },
          token,
        );
        const status = res.data.isApproved ? "Approved" : "Forwarded";
        log(`SUCCESS: ${role} ${status}`);
        return res.data;
      } catch (e) {
        if (e.message.includes("409"))
          log(`INFO: ${role} already finalized (Skipped)`);
        else log(`WARN: ${role} Failed: ${e.message}`);
      }
    };

    // Standard Hierarchy: Caretaker Forward -> Warden Forward -> SWO Approve
    await tryAction("Caretaker", caretakerToken, "forward");

    const wardenUser =
      gender.toLowerCase() === "female" ? "warden_female" : "warden_male";
    try {
      const { token } = await request("POST", "/auth/login", {
        username: wardenUser,
        password: `${wardenUser}@uniz`,
      });
      await tryAction("Warden", token, "forward");
    } catch (e) {
      log(`FAILURE: Warden Login Failed`);
    }

    try {
      const { token } = await request("POST", "/auth/login", {
        username: "swo",
        password: "swo@uniz",
      });
      await tryAction("SWO", token, "approve"); // Final approval
    } catch (e) {
      log(`FAILURE: SWO Login Failed`);
    }

    // Security
    try {
      const { token } = await request("POST", "/auth/login", {
        username: "security",
        password: "security@uniz",
      });
      const securityToken = token;
      await request(
        "POST",
        `/requests/${requestId}/checkout`,
        {},
        securityToken,
      );
      log("SUCCESS: Security Check-Out");
      await request(
        "POST",
        `/requests/${requestId}/checkin`,
        {},
        securityToken,
      );
      log("SUCCESS: Security Check-In");
    } catch (e) {
      log(`FAILURE: Security Flow Failed`);
    }

    section("Phase 4: Final Verification");
    const outpassesRes = await request(
      "GET",
      `/requests/outpass/all?search=O210008`,
      null,
      caretakerToken,
    );
    const allRequests = outpassesRes.outpasses || [];
    const active = allRequests.find(
      (r) => !r.is_rejected && !r.is_expired && !r.checked_in_time,
    );

    if (active)
      log(`FAILURE: Request ${active._id || active.id} is still ACTIVE!`);
    else log(`SUCCESS: FINAL CHECK PASSED: No active requests found.`);
  } finally {
    rl.close();
    section("Test Complete");
  }
}

run();
