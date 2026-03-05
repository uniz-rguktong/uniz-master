const ExcelJS = require("exceljs");
const axios = require("axios");
const fs = require("fs");

const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImE5NzM4YmUwLTUxMjItNGRjMS04NWMxLTFhZTIwZjRjM2E0OCIsInVzZXJuYW1lIjoiV0VCTUFTVEVSIiwicm9sZSI6IndlYm1hc3RlciIsImlhdCI6MTc3MjcxMDM0NSwiZXhwIjoxNzczMzE1MTQ1fQ.K3k_dyVhCrL1gUAF4eoprGoyPyyiV_sfq3j6rFLQQsc";

async function run() {
  try {
    console.log("Downloading Attendance Template for CSE E3 SEM-1...");
    const attRes = await axios.get(
      "https://uniz.rguktong.in/api/v1/academics/attendance/template?branch=CSE&year=E3&semesterId=SEM-1",
      {
        headers: { Authorization: `Bearer ${TOKEN}` },
        responseType: "arraybuffer",
        timeout: 30000,
      },
    );
    fs.writeFileSync("/tmp/att_temp_e3.xlsx", attRes.data);

    console.log("Downloading Grades Template for CSE E3 SEM-1...");
    const grdRes = await axios.get(
      "https://uniz.rguktong.in/api/v1/academics/grades/template?branch=CSE&year=E3&semesterId=SEM-1",
      {
        headers: { Authorization: `Bearer ${TOKEN}` },
        responseType: "arraybuffer",
        timeout: 30000,
      },
    );
    fs.writeFileSync("/tmp/grd_temp_e3.xlsx", grdRes.data);

    console.log("Filling out Attendance...");
    const w1 = new ExcelJS.Workbook();
    await w1.xlsx.readFile("/tmp/att_temp_e3.xlsx");
    const s1 = w1.getWorksheet(1);
    s1.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      // Attendance columns might vary depending on exactly how many subjects they have,
      // but for template format:
      // 6: Total Classes Occurred
      // 7: Total Classes Attended
      const c6 = row.getCell(6); // Total
      const c7 = row.getCell(7); // Attended
      c6.value = 50;
      // Random attendance between 30 and 50
      c7.value = Math.floor(Math.random() * 21) + 30;
    });
    await w1.xlsx.writeFile(
      "/Users/sreecharandesu/Projects/uniz-master/attendance_E3_filled.xlsx",
    );

    console.log("Filling out Grades...");
    const w2 = new ExcelJS.Workbook();
    await w2.xlsx.readFile("/tmp/grd_temp_e3.xlsx");
    const s2 = w2.getWorksheet(1);
    const grades = ["EX", "A", "B", "C", "D"];
    s2.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const c6 = row.getCell(6); // Grade
      c6.value = grades[Math.floor(Math.random() * grades.length)];
    });
    await w2.xlsx.writeFile(
      "/Users/sreecharandesu/Projects/uniz-master/final_grades_E3_filled.xlsx",
    );

    console.log("Both E3 files generated successfully!");
  } catch (e) {
    console.error("Error occurred:");
    console.error(e.message || e);
  }
}
run();
