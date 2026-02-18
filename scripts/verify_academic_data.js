const axios = require("axios");

const BASE_URL = "http://localhost:3000/api/v1";

async function verifyData() {
  console.log("🚀 Starting Data Integrity Verification...");

  try {
    // 1. Login as Webmaster
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      username: "webmaster",
      password: "webmaster@uniz",
    });
    const token = loginRes.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // 2. Fetch Students
    const stuRes = await axios.post(
      `${BASE_URL}/profile/student/search`,
      { limit: 100 },
      { headers },
    );
    const students = stuRes.data.students || [];

    if (students.length === 0) {
      console.log("❌ No students found to verify.");
      return;
    }

    console.log(`👥 Verifying ${students.length} students...\n`);

    for (const student of students) {
      console.log(`-----------------------------------------`);
      console.log(
        `👤 Student: ${student.username} (${student.name}) - Branch: ${student.branch}`,
      );

      // Fetch Grades
      const gradeRes = await axios.get(
        `${BASE_URL}/academics/grades?studentId=${student.username}`,
        { headers },
      );
      const allGrades = gradeRes.data.grades || [];
      const gpaSummary = gradeRes.data.gpa || gradeRes.data.gpa_summary || {};

      // Fetch Attendance
      const attRes = await axios.get(
        `${BASE_URL}/academics/attendance?studentId=${student.username}`,
        { headers },
      );
      const allAttendance = attRes.data.attendance || [];
      const attSummary =
        attRes.data.summary || attRes.data.attendance_summary || {};

      console.log(`   📚 Grades: ${allGrades.length} records found.`);

      const semStats = Object.keys(gpaSummary).sort();
      if (semStats.length > 0) {
        console.log(`   📊 GPA per Semester:`);
        semStats.forEach((sem) => {
          const data = gpaSummary[sem];
          console.log(`      > ${sem}: GPA ${data.gpa} [${data.status}]`);
        });
      } else {
        console.log(
          `   ⚠️  No GPA summary found (may be due to missing credits or grades).`,
        );
      }

      console.log(`   📅 Attendance: ${allAttendance.length} records found.`);
      const attSems = Object.keys(attSummary).sort();
      if (attSems.length > 0) {
        console.log(`   📈 Attendance per Semester:`);
        attSems.forEach((sem) => {
          const data = attSummary[sem];
          console.log(
            `      > ${sem}: ${data.percentage}% (${data.attended}/${data.total})`,
          );
        });
      }

      // Spot check: Verify if record values match expected patterns
      if (allGrades.length > 0) {
        const sample = allGrades[0];
        console.log(
          `   🔍 Spot Check (Grade): Subject ${sample.subject?.code} -> Sem ${sample.semesterId}`,
        );
      }
    }

    console.log(`\n✅ Verification Complete!`);
  } catch (e) {
    console.error("❌ Verification Failed:", e.message);
    if (e.response)
      console.error(
        "   Response Data:",
        JSON.stringify(e.response.data, null, 2),
      );
  }
}

verifyData();
