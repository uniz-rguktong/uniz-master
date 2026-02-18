const axios = require("axios");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const BASE_URL = "http://localhost:3000/api/v1";
const DATA_DIR = path.join(__dirname, "../tests/data");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

async function generateTestData() {
  console.log("🚀 Generating Full Batch Test Data...");

  try {
    // 1. Login
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      username: "webmaster",
      password: "webmaster@uniz",
    });
    const token = loginRes.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // 2. Fetch Data
    console.log("📚 Fetching Subjects...");
    const subRes = await axios.get(`${BASE_URL}/academics/subjects`, {
      headers,
    });
    const allSubjects = subRes.data.subjects || subRes.data;

    console.log("👥 Fetching Students...");
    const stuRes = await axios.post(
      `${BASE_URL}/profile/student/search`,
      { limit: 1000 },
      { headers },
    );
    const students = stuRes.data.students || [];

    const gradesRows = [
      [
        "Student ID",
        "Subject Code",
        "Semester ID",
        "Grade (EX, A, B, C, D, E, R)",
      ],
    ];
    const attendanceRows = [
      [
        "Student ID",
        "Subject Code",
        "Semester ID",
        "Total Classes Occurred",
        "Total Classes Attended",
      ],
    ];

    let recordCount = 0;

    for (const student of students) {
      // Find subjects matching student branch
      const departmentSubjects = allSubjects.filter(
        (sub) =>
          sub.department === student.branch ||
          (student.branch === "CSE" && sub.code.startsWith("CSE-")),
      );

      for (const subject of departmentSubjects) {
        // Determine actual Semester ID from subject code or semester field
        // Subjects have code like CSE-E1-SEM-1-01
        // We'll use the subject's semester field but prefix with year from code if possible
        let semId = subject.semester;
        const yearMatch = subject.code.match(/E[1-4]/);
        if (yearMatch) {
          semId = `${yearMatch[0]}-${subject.semester}`;
        }

        // Random Grade
        const grades = ["EX", "A", "B", "C", "D", "E"];
        const grade = grades[Math.floor(Math.random() * grades.length)];
        gradesRows.push([student.username, subject.code, semId, grade]);

        // Random Attendance
        const total = Math.floor(Math.random() * 15) + 30; // 30-45 classes
        const attended =
          Math.floor(Math.random() * (total - Math.floor(total * 0.7))) +
          Math.floor(total * 0.7); // 70%-100%
        attendanceRows.push([
          student.username,
          subject.code,
          semId,
          total,
          attended,
        ]);

        recordCount++;
      }
    }

    console.log(
      `📦 Generated ${recordCount} records for ${students.length} students.`,
    );

    // Write Grades Workbook
    const gradesWb = XLSX.utils.book_new();
    const gradesWs = XLSX.utils.aoa_to_sheet(gradesRows);
    XLSX.utils.book_append_sheet(gradesWb, gradesWs, "Grades");
    XLSX.writeFile(gradesWb, path.join(DATA_DIR, "full_batch_grades.xlsx"));

    // Write Attendance Workbook
    const attendanceWb = XLSX.utils.book_new();
    const attendanceWs = XLSX.utils.aoa_to_sheet(attendanceRows);
    XLSX.utils.book_append_sheet(attendanceWb, attendanceWs, "Attendance");
    XLSX.writeFile(
      attendanceWb,
      path.join(DATA_DIR, "full_batch_attendance.xlsx"),
    );

    console.log(`✅ Files generated successfully in ${DATA_DIR}`);
  } catch (e) {
    console.error("❌ Generation Failed:", e.message);
    if (e.response) console.error(e.response.data);
  }
}

generateTestData();
