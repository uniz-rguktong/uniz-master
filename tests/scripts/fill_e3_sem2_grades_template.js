/**
 * Fill grades_ALL_E3_SEM-2_template.xlsx using official results from:
 *   E3(O21) Semester 2-Ongole EST Web Results.xlsx
 *
 * Usage:
 *   node tests/scripts/fill_e3_sem2_grades_template.js \
 *     [results.xlsx] [template.xlsx] [output.xlsx]
 */
const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");

const ROOT = path.resolve(__dirname, "../..");
const DEFAULT_RESULTS = path.join(
  ROOT,
  "E3(O21) Semester 2-Ongole EST Web Results.xlsx",
);
const DEFAULT_TEMPLATE =
  "/Users/sreecharandesu/Desktop/grades_ALL_E3_SEM-2_template.xlsx";
const DEFAULT_OUTPUT = DEFAULT_TEMPLATE;

const resultsPath = process.argv[2] || DEFAULT_RESULTS;
const templatePath = process.argv[3] || DEFAULT_TEMPLATE;
const outputPath = process.argv[4] || DEFAULT_OUTPUT;

function norm(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fuzzyMatch(templateName, resultName) {
  const a = norm(templateName);
  const b = norm(resultName);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;

  const aWords = a.split(" ").filter((w) => w.length > 2);
  const bWords = b.split(" ").filter((w) => w.length > 2);
  const overlap = aWords.filter((w) => bWords.includes(w));
  return overlap.length >= Math.min(3, Math.min(aWords.length, bWords.length) - 1);
}

const KEYWORD_ALIASES = [
  {
    test: (name) => /english/.test(norm(name)) && /lab/.test(norm(name)),
    match: (name) => /english/.test(norm(name)) && /lab/.test(norm(name)),
  },
  {
    test: (name) => norm(name).includes("object oriented programming java"),
    match: (name) => norm(name).includes("java"),
  },
  {
    test: (name) => norm(name).includes("cryptography"),
    match: (name) => norm(name).includes("cryptography"),
  },
  {
    test: (name) => norm(name).includes("artificial intelligence"),
    match: (name) =>
      norm(name).includes("artificial intelligence") &&
      !norm(name).includes("machine learning"),
  },
  {
    test: (name) => norm(name).includes("cloud computing"),
    match: (name) => norm(name).includes("cloud computing"),
  },
  {
    test: (name) => norm(name).includes("managerial economics"),
    match: (name) =>
      norm(name).includes("managerial economics") ||
      norm(name).includes("finance analysis"),
  },
  {
    test: (name) => norm(name).includes("computer aided modeling"),
    match: (name) =>
      norm(name).includes("computer aided") || norm(name).includes("modeling"),
  },
];

function namesMatch(templateName, resultName) {
  if (fuzzyMatch(templateName, resultName)) return true;
  return KEYWORD_ALIASES.some(
    (rule) => rule.test(templateName) && rule.match(resultName),
  );
}

function isGenericSlot(name) {
  const n = norm(name);
  return (
    /elective/.test(n) ||
    /summer internship/.test(n) ||
    /professional elective/.test(n) ||
    /program elective/.test(n)
  );
}

function normGrade(value) {
  if (value == null || value === "") return "";
  const raw = String(value).trim();
  if (!raw) return "";
  const upper = raw.toUpperCase();
  if (upper === "EX" || upper === "EXCELLENT") return "EX";
  if (["A", "B", "C", "D", "E", "R", "F"].includes(upper)) return upper;
  return upper;
}

function formatPassDate(value) {
  if (!value) return "";
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value).trim();
}

async function loadResults(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet =
    workbook.getWorksheet("Ongole") || workbook.worksheets[0];
  const byStudent = new Map();

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const studentId = String(row.getCell(2).value || "")
      .trim()
      .toUpperCase();
    if (!studentId) return;

    const record = {
      code: String(row.getCell(3).value || "").trim(),
      name: String(row.getCell(4).value || "").trim(),
      grade: normGrade(row.getCell(10).value),
      passDate: formatPassDate(row.getCell(12).value),
      used: false,
    };

    if (!byStudent.has(studentId)) byStudent.set(studentId, []);
    byStudent.get(studentId).push(record);
  });

  return byStudent;
}

function gradeForTemplateRow(studentResults, templateSubjectName) {
  if (!studentResults?.length) return null;

  if (!isGenericSlot(templateSubjectName)) {
    const hit = studentResults.find(
      (entry) => !entry.used && namesMatch(templateSubjectName, entry.name),
    );
    if (hit) {
      hit.used = true;
      return hit;
    }
    return null;
  }

  const next = studentResults.find((entry) => !entry.used);
  if (!next) return null;
  next.used = true;
  return next;
}

async function run() {
  if (!fs.existsSync(resultsPath)) {
    throw new Error(`Results file not found: ${resultsPath}`);
  }
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template file not found: ${templatePath}`);
  }

  console.log("Loading results:", resultsPath);
  const resultsByStudent = await loadResults(resultsPath);
  console.log(`Loaded results for ${resultsByStudent.size} students.`);

  console.log("Loading template:", templatePath);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(templatePath);
  const sheet = workbook.getWorksheet("Template") || workbook.worksheets[0];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    row.getCell(7).value = "";
    row.getCell(8).value = "";
    row.getCell(9).value = "";
  });

  const rowsByStudent = new Map();
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const studentId = String(row.getCell(1).value || "")
      .trim()
      .toUpperCase();
    if (!rowsByStudent.has(studentId)) rowsByStudent.set(studentId, []);
    rowsByStudent.get(studentId).push(row);
  });

  let filled = 0;
  let missingStudent = 0;
  let missingGrade = 0;

  for (const [studentId, rows] of rowsByStudent) {
    const studentResults = (resultsByStudent.get(studentId) || []).map(
      (entry) => ({ ...entry, used: false }),
    );

    if (!studentResults.length) {
      missingStudent += rows.length;
      continue;
    }

    rows.sort((a, b) =>
      String(a.getCell(3).value || "").localeCompare(
        String(b.getCell(3).value || ""),
      ),
    );

    const fixedRows = rows.filter(
      (row) => !isGenericSlot(String(row.getCell(4).value || "")),
    );
    const genericRows = rows.filter((row) =>
      isGenericSlot(String(row.getCell(4).value || "")),
    );

    for (const row of [...fixedRows, ...genericRows]) {
      const templateSubjectName = String(row.getCell(4).value || "");
      const match = gradeForTemplateRow(studentResults, templateSubjectName);

      if (!match?.grade) {
        missingGrade += 1;
        continue;
      }

      row.getCell(7).value = match.grade;
      if (match.passDate) row.getCell(8).value = match.passDate;
      filled += 1;
    }
  }

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  await workbook.xlsx.writeFile(outputPath);

  const workspaceCopy = path.join(
    ROOT,
    "tests/final_data/grades_ALL_E3_SEM-2_filled.xlsx",
  );
  fs.mkdirSync(path.dirname(workspaceCopy), { recursive: true });
  await workbook.xlsx.writeFile(workspaceCopy);

  console.log("\nDone.");
  console.log(`Filled grades: ${filled}`);
  console.log(`Rows with no student in results: ${missingStudent}`);
  console.log(`Rows still without grade: ${missingGrade}`);
  console.log(`Updated template: ${outputPath}`);
  console.log(`Workspace copy: ${workspaceCopy}`);
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
