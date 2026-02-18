const axios = require("axios");
const fs = require("fs");

const BASE_URL = "http://localhost:3000/api/v1";
// const BASE_URL = 'http://localhost:3000/api/v1';

const BATCH_SIZE = 50; // Update 50 students at a time to be safe

async function run() {
  console.log("🚀 Starting Full Academic History Seeding...");

  try {
    // 1. Login
    console.log("🔐 Logging in as Webmaster...");
    const randomIP = `10.5.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    const baseHeaders = { "X-Forwarded-For": randomIP };

    const loginRes = await axios.post(
      `${BASE_URL}/auth/login`,
      {
        username: "webmaster",
        password: "webmaster@uniz",
      },
      { headers: baseHeaders },
    );
    const token = loginRes.data.token;
    const headers = { Authorization: `Bearer ${token}`, ...baseHeaders };

    // 2. Fetch Metadata
    console.log("📚 Fetching Subjects...");
    const subRes = await axios.get(`${BASE_URL}/academics/subjects`, {
      headers,
    });
    const allSubjects = subRes.data.subjects || subRes.data; // Handle potential response structures

    console.log(`   > Found ${allSubjects.length} subjects.`);

    // Group subjects by Semester
    // Key: "SEM-1", Value: [Subject Objects]
    // But we need to handle "E1-SEM1" vs "E1-SEM2".
    // Subjects usually have 'semester' field like 'SEM-1' and 'year' field 'E1'?
    // Or 'code' containing the pattern.
    // Let's inspect the first subject structure if possible, but safely assume standard fields.

    // 3. Fetch Students
    console.log("👥 Fetching Students...");
    const stuRes = await axios.post(
      `${BASE_URL}/profile/student/search`,
      { limit: 1000 },
      { headers },
    );
    const students = stuRes.data.students || stuRes.data.data || [];
    console.log(`   > Found ${students.length} students.`);

    // 3.5 Filter for CSE
    const cseStudents = students.filter(
      (s) => s.branch === "CSE" || s.department === "CSE",
    );
    const cseSubjects = allSubjects.filter(
      (sub) =>
        sub.branch === "CSE" ||
        sub.department === "CSE" ||
        sub.code?.includes("CS"),
    );

    console.log(
      `   > Filtered: ${cseStudents.length} CSE students and ${cseSubjects.length} CSE subjects.`,
    );

    // 4. Generate Updates
    const allUpdates = [];

    for (const student of cseStudents) {
      for (const subject of cseSubjects) {
        const grades = ["EX", "A", "B", "C", "D", "E"];
        const randomGrade = grades[Math.floor(Math.random() * grades.length)];

        allUpdates.push({
          studentId: student.username || student.studentId,
          subjectId: subject.id || subject._id,
          semesterId: subject.semester || "SEM-1",
          year: subject.year || "E1",
          grade: randomGrade,
        });
      }
    }

    console.log(`📦 Generated ${allUpdates.length} grade records.`);

    // 5. Upload in Batches
    const CHUNK_SIZE = 100; // API likely has a limit
    for (let i = 0; i < allUpdates.length; i += CHUNK_SIZE) {
      const chunk = allUpdates.slice(i, i + CHUNK_SIZE);
      console.log(`   > Uploading batch ${i} to ${i + CHUNK_SIZE}...`);

      try {
        await axios.put(
          `${BASE_URL}/academics/grades/bulk-update`,
          { updates: chunk },
          { headers },
        );
      } catch (e) {
        console.error(
          `   ❌ Failed batch: ${e.response?.data?.message || e.message}`,
        );
      }

      // Tiny delay to be nice to rate limiter
      await new Promise((r) => setTimeout(r, 100));
    }

    console.log("✅ Seeding Complete!");
  } catch (e) {
    console.error("CRITICAL FAILURE:", e.message);
    if (e.response) console.error(e.response.data);
  }
}

run();
