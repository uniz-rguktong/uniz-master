const ExcelJS = require("exceljs");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImE5NzM4YmUwLTUxMjItNGRjMS04NWMxLTFhZTIwZjRjM2E0OCIsInVzZXJuYW1lIjoiV0VCTUFTVEVSIiwicm9sZSI6IndlYm1hc3RlciIsImlhdCI6MTc3MjcxMDM0NSwiZXhwIjoxNzczMzE1MTQ1fQ.K3k_dyVhCrL1gUAF4eoprGoyPyyiV_sfq3j6rFLQQsc";
const BASE_URL = "https://uniz.rguktong.in/api/v1/academics";
const OUTPUT_DIR =
  "/Users/sreecharandesu/Projects/uniz-master/tests/final_data/consolidated";

const YEARS = ["E2", "E3", "E4"];
const BRANCHES = ["CSE", "ECE", "CIVIL", "MECH", "EEE", "GENERAL"];
const SEMESTER = "SEM-1";

async function run() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const year of YEARS) {
    console.log(`\n--- Generating Consolidated Files for Year: ${year} ---`);

    const attendanceWorkbook = new ExcelJS.Workbook();
    const attendanceSheet = attendanceWorkbook.addWorksheet("Attendance");
    attendanceSheet.addRow([
      "Student ID",
      "Student Name",
      "Subject Code",
      "Subject Name",
      "Semester ID",
      "Total Classes Occurred",
      "Total Classes Attended",
    ]);

    const gradesWorkbook = new ExcelJS.Workbook();
    const gradesSheet = gradesWorkbook.addWorksheet("Grades");
    gradesSheet.addRow([
      "Student ID",
      "Student Name",
      "Subject Code",
      "Subject Name",
      "Semester ID",
      "Grade (EX, A, B, C, D, E, R)",
    ]);

    let totalAttRows = 0;
    let totalGrdRows = 0;

    for (const branch of BRANCHES) {
      try {
        console.log(`  Processing ${branch}...`);

        // Fetch Attendance Template
        const attRes = await axios.get(
          `${BASE_URL}/attendance/template?branch=${branch}&year=${year}&semesterId=${SEMESTER}`,
          {
            headers: { Authorization: `Bearer ${TOKEN}` },
            responseType: "arraybuffer",
          },
        );
        const tempAttWb = new ExcelJS.Workbook();
        await tempAttWb.xlsx.load(attRes.data);
        const tempAttSheet = tempAttWb.getWorksheet(1);

        tempAttSheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return;
          const studentId = row.getCell(1).value;
          const studentName = row.getCell(2).value;
          const subjectCode = row.getCell(3).value;
          const subjectName = row.getCell(4).value;
          const semesterId = row.getCell(5).value;

          if (studentId) {
            attendanceSheet.addRow([
              studentId,
              studentName,
              subjectCode,
              subjectName,
              semesterId,
              50, // Total Classes
              Math.floor(Math.random() * 21) + 30, // Attended Classes (30-50)
            ]);
            totalAttRows++;
          }
        });

        // Fetch Grades Template
        const grdRes = await axios.get(
          `${BASE_URL}/grades/template?branch=${branch}&year=${year}&semesterId=${SEMESTER}`,
          {
            headers: { Authorization: `Bearer ${TOKEN}` },
            responseType: "arraybuffer",
          },
        );
        const tempGrdWb = new ExcelJS.Workbook();
        await tempGrdWb.xlsx.load(grdRes.data);
        const tempGrdSheet = tempGrdWb.getWorksheet(1);
        const gradeOptions = ["EX", "A", "B", "C", "D", "E", "R"];

        tempGrdSheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return;
          const studentId = row.getCell(1).value;
          const studentName = row.getCell(2).value;
          const subjectCode = row.getCell(3).value;
          const subjectName = row.getCell(4).value;
          const semesterId = row.getCell(5).value;

          if (studentId) {
            gradesSheet.addRow([
              studentId,
              studentName,
              subjectCode,
              subjectName,
              semesterId,
              gradeOptions[Math.floor(Math.random() * gradeOptions.length)],
            ]);
            totalGrdRows++;
          }
        });
      } catch (err) {
        console.error(`    Error for ${branch}:`, err.message);
      }
    }

    if (totalAttRows > 0) {
      const outPath = path.join(
        OUTPUT_DIR,
        `attendance_${year}_consolidated.xlsx`,
      );
      await attendanceWorkbook.xlsx.writeFile(outPath);
      console.log(`✅ Saved Attendance for ${year}: ${totalAttRows} rows.`);
    } else {
      console.log(`⚠️ No attendance data for ${year}.`);
    }

    if (totalGrdRows > 0) {
      const outPath = path.join(OUTPUT_DIR, `grades_${year}_consolidated.xlsx`);
      await gradesWorkbook.xlsx.writeFile(outPath);
      console.log(`✅ Saved Grades for ${year}: ${totalGrdRows} rows.`);
    } else {
      console.log(`⚠️ No grades data for ${year}.`);
    }
  }

  console.log(`\nAll consolidated files are in: ${OUTPUT_DIR}`);
}

run();
