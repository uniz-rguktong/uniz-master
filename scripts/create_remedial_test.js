const ExcelJS = require("exceljs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "tests", "data", "grades_upload");
const SOURCE = path.join(DATA_DIR, "O21_E1_SEM-1.xlsx");

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(SOURCE);
  const ws = wb.worksheets[0];

  // Pick first 10 distinct students
  const students = [];
  const seen = new Set();
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r).values;
    const sid = row[1];
    if (sid && !seen.has(sid)) {
      seen.add(sid);
      students.push(sid);
    }
    if (students.length >= 10) break;
  }
  console.log("Sample students:", students);

  // Collect all rows for those 10 students
  const rows = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r).values;
    if (row[1] && students.includes(row[1])) rows.push(row.slice(1));
  }
  console.log("Total rows for test files:", rows.length);

  const HEADERS = [
    "Student ID",
    "Student Name",
    "Subject Code",
    "Subject Name",
    "Semester ID",
    "Grade (EX, A, B, C, D, E, R)",
  ];

  // --- REMEDIAL FILE: mark all as 'R' (failed) ---
  const wbRem = new ExcelJS.Workbook();
  const wsRem = wbRem.addWorksheet("Grades");
  wsRem.addRow(HEADERS);
  for (const row of rows) {
    wsRem.addRow([row[0], row[1], row[2], row[3], row[4], "R"]);
  }
  const remPath = path.join(DATA_DIR, "REMEDIAL_E1_SEM-1.xlsx");
  await wbRem.xlsx.writeFile(remPath);
  console.log("✅ Written:", remPath);

  // --- CORRECT FILE: original real grades ---
  const wbCorr = new ExcelJS.Workbook();
  const wsCorr = wbCorr.addWorksheet("Grades");
  wsCorr.addRow(HEADERS);
  for (const row of rows) {
    wsCorr.addRow([row[0], row[1], row[2], row[3], row[4], row[5]]);
  }
  const corrPath = path.join(DATA_DIR, "CORRECT_E1_SEM-1.xlsx");
  await wbCorr.xlsx.writeFile(corrPath);
  console.log("✅ Written:", corrPath);

  console.log("\nContent preview (first 3 rows of REMEDIAL):");
  for (let i = 0; i < Math.min(3, rows.length); i++) {
    const r = rows[i];
    console.log(`  ${r[0]} | ${r[2]} | E1-SEM-1 | R`);
  }
  console.log("\nContent preview (first 3 rows of CORRECT):");
  for (let i = 0; i < Math.min(3, rows.length); i++) {
    const r = rows[i];
    console.log(`  ${r[0]} | ${r[2]} | E1-SEM-1 | ${r[5]}`);
  }
}

main().catch(console.error);
