const ExcelJS = require("exceljs");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImE5NzM4YmUwLTUxMjItNGRjMS04NWMxLTFhZTIwZjRjM2E0OCIsInVzZXJuYW1lIjoiV0VCTUFTVEVSIiwicm9sZSI6IndlYm1hc3RlciIsImlhdCI6MTc3MjcxMDM0NSwiZXhwIjoxNzczMzE1MTQ1fQ.K3k_dyVhCrL1gUAF4eoprGoyPyyiV_sfq3j6rFLQQsc";
const BASE_URL = "https://uniz.rguktong.in/api/v1/academics";
const OUTPUT_DIR = path.join(process.cwd(), "tests/generated_bulk_data");

const YEARS = ["E2", "E3", "E4"];
const BRANCHES = ["CSE", "ECE", "CIVIL", "MECH", "EEE"];
const SEMESTER = "SEM-1";

async function fillAttendance(filePath, outPath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.getWorksheet(1);
  let rowCount = 0;
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    rowCount++;
    // 6: Total Classes, 7: Attended
    row.getCell(6).value = 50;
    row.getCell(7).value = Math.floor(Math.random() * 21) + 30; // 30-50
  });
  if (rowCount > 0) {
    await workbook.xlsx.writeFile(outPath);
    return rowCount;
  }
  return 0;
}

async function fillGrades(filePath, outPath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.getWorksheet(1);
  const grades = ["EX", "A", "B", "C", "D", "E", "R"];
  let rowCount = 0;
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    rowCount++;
    // 6: Grade
    row.getCell(6).value = grades[Math.floor(Math.random() * grades.length)];
  });
  if (rowCount > 0) {
    await workbook.xlsx.writeFile(outPath);
    return rowCount;
  }
  return 0;
}

async function run() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const year of YEARS) {
    for (const branch of BRANCHES) {
      console.log(`\n--- Working on: ${year} - ${branch} ---`);
      try {
        // Fetch Attendance Template
        const attRes = await axios.get(
          `${BASE_URL}/attendance/template?branch=${branch}&year=${year}&semesterId=${SEMESTER}`,
          {
            headers: { Authorization: `Bearer ${TOKEN}` },
            responseType: "arraybuffer",
          },
        );
        const tmpAtt = path.join(OUTPUT_DIR, `tmp_att_${year}_${branch}.xlsx`);
        fs.writeFileSync(tmpAtt, attRes.data);
        const attOut = path.join(
          OUTPUT_DIR,
          `attendance_${year}_${branch}_filled.xlsx`,
        );
        const attCount = await fillAttendance(tmpAtt, attOut);
        fs.unlinkSync(tmpAtt);
        console.log(`  Attendance: ${attCount} students processed.`);

        // Fetch Grades Template
        const grdRes = await axios.get(
          `${BASE_URL}/grades/template?branch=${branch}&year=${year}&semesterId=${SEMESTER}`,
          {
            headers: { Authorization: `Bearer ${TOKEN}` },
            responseType: "arraybuffer",
          },
        );
        const tmpGrd = path.join(OUTPUT_DIR, `tmp_grd_${year}_${branch}.xlsx`);
        fs.writeFileSync(tmpGrd, grdRes.data);
        const grdOut = path.join(
          OUTPUT_DIR,
          `grades_${year}_${branch}_filled.xlsx`,
        );
        const grdCount = await fillGrades(tmpGrd, grdOut);
        fs.unlinkSync(tmpGrd);
        console.log(`  Grades: ${grdCount} records processed.`);
      } catch (err) {
        console.error(`  Error for ${year}-${branch}:`, err.message);
      }
    }
  }
  console.log(`\nBulk data generation finished in ${OUTPUT_DIR}`);
}

run();
