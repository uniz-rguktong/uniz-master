const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");
const colors = require("colors");

const BASE_URL = "http://localhost:3000/api/v1";

// --- CONFIG ---
const STUDENT_USER = {
  username: "S999999",
  email: "test.student@uniz.edu",
  password: "password123",
  role: "student",
  metadata: { name: "Test Student", studentId: "S999999" },
};

const ADMIN_USER = {
  username: "admin_test",
  password: "password123",
  role: "webmaster",
  email: "admin.test@uniz.edu",
};

let studentToken = "";
let adminToken = "";
let studentProfile = null;

// --- UTILS ---
const logStep = (step) => console.log(`\n🔹 ${step}`.cyan.bold);
const logSuccess = (msg) => console.log(`    ${msg}`.green);
const logError = (msg, err) => {
  console.log(`   ❌ ${msg}`.red);
  if (err.response) {
    console.log(`      Status: ${err.response.status}`);
    console.log(`      Data:`, JSON.stringify(err.response.data, null, 2));
  } else {
    console.log(`      Error: ${err.message}`);
  }
};

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// --- TESTS ---

// 1. Auth Flow
async function testAuth() {
  logStep("Testing Authentication Flow");

  try {
    // Signup Student
    try {
      await axios.post(`${BASE_URL}/auth/signup`, STUDENT_USER);
      logSuccess("Student Signup Successful");
    } catch (e) {
      if (e.response && e.response.status === 409)
        logSuccess("Student already exists (Signup Skipped)");
      else throw e;
    }

    // Login Student
    const sLogin = await axios.post(`${BASE_URL}/auth/login`, {
      username: STUDENT_USER.username,
      password: STUDENT_USER.password,
    });
    studentToken = sLogin.data.token;
    logSuccess("Student Login Successful");

    // Create Admin (via Seed Endpoint usually, but we'll try signup if allowed or assume existed)
    // Since admin signup isn't open usually, we'll try to login as a known admin seeded earlier
    // Or if that fails, use the one we just defined if the system allows role signup (it shouldn't for safety)
    // Let's try to login as 'webmaster' (seeded by default in scripts/seed-admins.sh)
    try {
      const aLogin = await axios.post(`${BASE_URL}/auth/login`, {
        username: "webmaster",
        password: "webmaster@uniz", // From seed script
      });
      adminToken = aLogin.data.token;
      logSuccess("Admin (Webmaster) Login Successful");
    } catch (e) {
      logError("Failed to login as Webmaster", e);
      process.exit(1);
    }
  } catch (e) {
    logError("Auth Flow Failed", e);
    process.exit(1);
  }
}

// 2. Profile Flow
async function testProfile() {
  logStep("Testing Profile Flow");
  try {
    // Initialize Profile via Upsert
    await axios.put(
      `${BASE_URL}/profile/student/update`,
      {
        name: STUDENT_USER.metadata.name,
        branch: "CSE",
        year: "E4",
        section: "A",
      },
      {
        headers: { Authorization: `Bearer ${studentToken}` },
      },
    );
    logSuccess("Initialized/Updated Student Profile");

    const res = await axios.get(`${BASE_URL}/profile/student/me`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    studentProfile = res.data.student;
    logSuccess(`Fetched Profile for ${studentProfile.username}`);

    await axios.put(
      `${BASE_URL}/profile/student/status`,
      {
        username: studentProfile.username,
        isPresent: false,
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` }, // Requires Admin
      },
    );
    logSuccess('Updated Presence Status to "Out of Campus"');
  } catch (e) {
    logError("Profile Flow Failed", e);
  }
}

// 3. Outpass Flow

let requestId = ""; // Global request ID

// ... existing code ...

// 3. Outpass Flow
async function testOutpass() {
  logStep("Testing Outpass Request Flow");
  try {
    // RESET PRESENCE TO TRUE FIRST (To allow request)
    await axios.put(
      `${BASE_URL}/profile/student/status`,
      {
        username: STUDENT_USER.username,
        isPresent: true,
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    );
    logSuccess('Reset Presence Status to "In Campus" for Outpass test');

    // Create
    try {
      const res = await axios.post(
        `${BASE_URL}/requests/outpass`,
        {
          reason: "Integration Test",
          fromDay: new Date().toISOString(),
          toDay: new Date(Date.now() + 86400000).toISOString(),
          studentGender: "M", // Explicit gender
        },
        { headers: { Authorization: `Bearer ${studentToken}` } },
      );

      requestId = res.data.request ? res.data.request.id : res.data.data.id; // Handle different response structures
      logSuccess(`Created Outpass Request: ${requestId}`);
    } catch (e) {
      if (e.response && e.response.status === 409) {
        logSuccess("Outpass creation skipped (Pending request exists)");
        // Try to fetch pending request to reuse ID?
        // For now, assuming fresh flow or we can't test approval/checkout on old one easily
        return;
      }
      throw e;
    }

    if (requestId) {
      // Admin poling/approving (Simulate Flow: Caretaker -> Warden -> SWO -> Approved)
      // Since we logged in as 'webmaster', we might have super-admin powers or need to login as specific roles.
      // Our code says: if (superRoles.includes(role)) finalApproval = true;
      // Webmaster is in superRoles?
      // Let's check shared/roles.enum.ts values in memory...
      // In request.controller.ts: const superRoles = [UserRole.DIRECTOR, UserRole.WEBMASTER, UserRole.SWO, UserRole.DEAN];
      // So Webmaster approval should be FINAL.

      await axios.post(
        `${BASE_URL}/requests/${requestId}/approve`,
        {
          comment: "Auto-Approved by Test Script",
        },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      logSuccess(`Admin Approved Request: ${requestId} (Final Approval)`);
    }
  } catch (e) {
    logError("Outpass Flow Failed", e);
  }
}

// 4. File Generation & Upload
async function testFileUploads() {
  logStep("Testing File Uploads (Excel) & Cloudinary");

  const testDir = path.join(__dirname, "temp_files");
  if (!fs.existsSync(testDir)) fs.mkdirSync(testDir);

  const gradeFile = path.join(testDir, "grades.xlsx");
  const attendanceFile = path.join(testDir, "attendance.xlsx");

  try {
    // Generate Grades Excel
    const wb1 = new ExcelJS.Workbook();
    const ws1 = wb1.addWorksheet("Grades");
    ws1.addRow(["Student ID", "Subject Code", "Semester", "Grade"]); // Header
    ws1.addRow([
      studentProfile ? studentProfile.studentId : "S999999",
      "TEST-101",
      "SEM-1",
      9.5,
    ]);
    await wb1.xlsx.writeFile(gradeFile);
    logSuccess("Generated Grades Excel");

    // Generate Attendance Excel
    const wb2 = new ExcelJS.Workbook();
    const ws2 = wb2.addWorksheet("Attendance");
    ws2.addRow([
      "Student ID",
      "Subject Code",
      "Semester",
      "Attended Classes",
      "Total Classes",
    ]); // Header
    ws2.addRow([
      studentProfile ? studentProfile.studentId : "S999999",
      "TEST-101",
      "SEM-1",
      45,
      50,
    ]);
    await wb2.xlsx.writeFile(attendanceFile);
    logSuccess("Generated Attendance Excel");

    // Setup Test Subject first
    try {
      await axios.post(
        `${BASE_URL}/academics/subjects/add`,
        {
          name: "Test Subject",
          code: "TEST-101",
          credits: 4,
        },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      logSuccess("Added Test Subject (TEST-101)");
    } catch (e) {
      /* Ignore if exists */
    }

    // Upload Grades
    const form1 = new FormData();
    form1.append("file", fs.createReadStream(gradeFile));
    const res1 = await axios.post(
      `${BASE_URL}/academics/grades/upload`,
      form1,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          ...form1.getHeaders(),
        },
      },
    );
    logSuccess(`Uploaded Grades: ${res1.data.successCount} processed`);
    if (res1.data.failCount > 0) console.log("      Errors:", res1.data.errors);

    // Upload Attendance
    const form2 = new FormData();
    form2.append("file", fs.createReadStream(attendanceFile));
    const res2 = await axios.post(
      `${BASE_URL}/academics/attendance/upload`,
      form2,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          ...form2.getHeaders(),
        },
      },
    );
    logSuccess(`Uploaded Attendance: ${res2.data.successCount} processed`);
    if (res2.data.failCount > 0) console.log("      Errors:", res2.data.errors);
  } catch (e) {
    logError("File Upload Flow Failed", e);
  } finally {
    // Cleanup
    // if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });
  }
}

// 5. Polling / Async Check
async function testPolling() {
  logStep("Testing System Polling (Health)");
  try {
    const start = Date.now();
    const res = await axios.get(`${BASE_URL}/system/health`);
    const duration = Date.now() - start;

    if (res.data.success) {
      logSuccess(`System Health is UP (Latency: ${duration}ms)`);
      res.data.services.forEach((s) => {
        const icon = s.status === "UP" ? "ok" : "❌";
        console.log(`      ${s.name}: ${s.status} [${s.latency}]`);
      });
    } else {
      logError("System Health Check Failed");
    }
  } catch (e) {
    logError("Polling Failed", e);
  }
}

// 6. Security Flow
async function testSecurityFlow() {
  logStep("Testing Security Check-In/Out Flow");
  if (!requestId) {
    console.log("    Skipping Security Flow (No Request ID)");
    return;
  }

  try {
    // Login as Security
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      username: "security_admin",
      password: "security@uniz",
    });
    const secToken = res.data.token;
    logSuccess("Security Login Successful");

    // Check Out
    await axios.post(
      `${BASE_URL}/requests/${requestId}/checkout`,
      {},
      {
        headers: { Authorization: `Bearer ${secToken}` },
      },
    );
    logSuccess(`Security Checked Out Request: ${requestId}`);

    // Verify Status is OUT
    const p1 = await axios.get(`${BASE_URL}/profile/student/me`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    // API returns snake_case mapped object
    if (p1.data.student.is_in_campus === false)
      logSuccess("Verified Student Status: OUT OF CAMPUS");
    else
      logError("Verifiction Failed: Student is still IN CAMPUS", {
        message: "Status mismatch",
      });

    // Check In
    await axios.post(
      `${BASE_URL}/requests/${requestId}/checkin`,
      {},
      {
        headers: { Authorization: `Bearer ${secToken}` },
      },
    );
    logSuccess(`Security Checked In Request: ${requestId}`);

    // Verify Status is IN
    const p2 = await axios.get(`${BASE_URL}/profile/student/me`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (p2.data.student.is_in_campus === true)
      logSuccess("Verified Student Status: IN CAMPUS");
    else
      logError("Verification Failed: Student is still OUT OF CAMPUS", {
        message: "Status mismatch",
      });
  } catch (e) {
    logError("Security Flow Failed", e);
  }
}

// --- RUNNER ---
(async () => {
  console.log(" Starting UniZ Full Production Flow Test".magenta.bold);

  await testAuth();
  if (studentToken && adminToken) {
    await testProfile();
    await testOutpass();
    await testFileUploads();
    await testSecurityFlow();
    await testPolling();
  }

  console.log("\n Test Sequence Complete".magenta.bold);
})();
