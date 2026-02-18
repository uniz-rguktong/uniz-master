const fs = require("fs");
const path = require("path");
const axios = require("axios");
const dotenv = require("dotenv");

// Load environment variables for the gateway URL if needed, defaulting to localhost
const BASE_URL = "http://localhost:3000/api/v1";

// Student Default Password
const STUDENT_PASSWORD = "123456";

const jsonPath =
  "/Users/sreecharandesu/Downloads/CSE-1 Attendance_upto_february.json";

const mapStudent = (entry) => {
  // Extract ID (Column2) and Name (Column3)
  const id = entry["Column2"];
  const name = entry["Column3"];

  if (!id || !id.startsWith("O")) return null; // Simple filter for valid IDs (O-series)

  return {
    username: id,
    password: STUDENT_PASSWORD,
    role: "student",
    email: `${id.toLowerCase()}@rguktong.ac.in`, // Construct email
    // We'll update profile with metadata after signup
    metadata: {
      name: name,
      year: "E2",
      branch: "CSE", // Hardcoded from file header context
      section: "1", // Hardcoded from file header context
    },
  };
};

async function seedStudents() {
  console.log("🌱 Seeding Students from JSON...");

  if (!fs.existsSync(jsonPath)) {
    console.error("❌ JSON file not found:", jsonPath);
    process.exit(1);
  }

  let rawData = fs.readFileSync(jsonPath, "utf-8").trim();

  // Attempt to fix malformed JSON (series of objects without root array)
  if (rawData.startsWith("{")) {
    rawData = `[${rawData}]`;
  }

  let jsonData;
  try {
    jsonData = JSON.parse(rawData);
  } catch (e) {
    console.error("JSON Parse Error. Trying to fix trailing formatting...");
    // Handle potential trailing comma or issues
    // Replace "}," with "}," and maybe wrap?
    // Currently assuming well-formed "obj", "obj" sequence
    throw e;
  }

  // Filter valid student entries
  const students = jsonData.map(mapStudent).filter((s) => s !== null);

  console.log(`📋 Found ${students.length} valid students to seed.`);

  // ADMIN TOKEN for profile updates (Using webmaster from previous seeds)
  let adminToken = "";
  try {
    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      username: "webmaster",
      password: "webmaster@uniz",
    });
    adminToken = adminLogin.data.token;
    console.log("✅ Admin authenticated for batch operations.");
  } catch (e) {
    console.error(
      "❌ Failed to login as Admin (Webmaster). Ensure seeds were run.",
    );
    // We can still try to signup students, but profile updates might fail if they require admin or self-token
  }

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (const student of students) {
    try {
      // 1. Signup
      try {
        await axios.post(`${BASE_URL}/auth/signup`, {
          username: student.username,
          password: student.password,
          role: student.role,
          email: student.email,
        });
        // console.log(`   Registered ${student.username}`);
      } catch (e) {
        if (e.response && e.response.status === 409) {
          // console.log(`   Skipped ${student.username} (Exists)`);
          skipCount++;
        } else {
          throw e;
        }
      }

      // 2. Update Profile/Init Profile
      // We need to login as student OR use admin to update specific student profile if endpoint allows
      // Currently updateStudentProfile updates 'me'.
      // So we technically need to login as EACH student to update their profile initially if we don't have an admin override.
      // OR we can use direct DB access, but let's try to simulate API usage.
      // Wait, does updateStudentProfile allow Admin to update ANY student?
      // Checking profile.controller.ts: `updateStudentProfile` uses `req.user` -> only updates SELF.
      // So we must login as the student to set their name.

      // Login as Student to get token
      const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
        username: student.username,
        password: student.password,
      });
      const studentToken = loginRes.data.token;

      // Update Profile
      await axios.put(
        `${BASE_URL}/profile/student/update`,
        {
          name: student.metadata.name,
          year: student.metadata.year,
          branch: student.metadata.branch,
          section: student.metadata.section,
        },
        {
          headers: { Authorization: `Bearer ${studentToken}` },
        },
      );

      successCount++;
      process.stdout.write("."); // Progress indicator
    } catch (e) {
      console.error(`\n❌ Failed processing ${student.username}:`, e.message);
      if (e.response) {
        console.error("   Status:", e.response.status);
        console.error("   Data:", JSON.stringify(e.response.data, null, 2));
      }
      failCount++;
    }
  }

  console.log("\n\n✨ Seeding Complete!");
  console.log(`   ✅ Processed/Updated: ${successCount}`);
  console.log(`   ⏭️  Skipped (Signup only): ${skipCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
}

seedStudents();
