/**
 * Build a Student_Upload_Template.xlsx from Ongole admission (+ optional branch allocation) data.
 *
 * Usage:
 *   node scripts/ops/k6/scripts/generate_student_upload_template.js \
 *     --admission "/path/to/O23-admissions.xlsx" \
 *     --batch O23 \
 *     --year E1 \
 *     --output /tmp/o23.xlsx
 *
 * Optional branch allocation file (add when available):
 *   --allocation /path/to/O23_BranchAllocationData.xlsx
 */

const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");

const BRANCH_MAP = {
  "COMPUTER SCIENCE AND ENGINEERING": "CSE",
  "ELECTRONICS AND COMMUNICATION ENGINEERING": "ECE",
  "ELECTRICAL AND ELECTRONICS ENGINEERING": "EEE",
  "MECHANICAL ENGINEERING": "MECH",
  "CIVIL ENGINEERING": "CIVIL",
  "CHEMICAL ENGINEERING": "CHEM",
  "METALLURGICAL AND MATERIALS ENGINEERING": "MME",
  "METALLURGY AND MATERIALS ENGINEERING": "MME",
  "ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING": "AI/ML",
  "ARTIFICIAL INTELLIGENCE & ML": "AI/ML",
  "ARTIFICAL INTELLIGENCE & ML": "AI/ML",
  "AI&ML": "AI/ML",
};

const TEMPLATE_HEADERS = [
  "Student ID",
  "Name",
  "Email",
  "Gender",
  "Branch",
  "Year",
  "Section",
  "Batch",
  "Room No",
  "Is In Campus",
  "Phone",
];

function parseArgs(argv) {
  const args = {
    admission: process.env.ADMISSION_XLSX || "",
    allocation: "",
    batch: "O23",
    year: "E1",
    section: "",
    output: path.join(__dirname, "../data/o23.xlsx"),
  };

  for (let i = 2; i < argv.length; i++) {
    const key = argv[i];
    const val = argv[i + 1];
    if (key === "--admission" && val) args.admission = val;
    if (key === "--allocation" && val) args.allocation = val;
    if (key === "--batch" && val) args.batch = val.toUpperCase();
    if (key === "--year" && val) args.year = val.toUpperCase();
    if (key === "--section" && val) args.section = val.toUpperCase();
    if (key === "--output" && val) args.output = val;
  }

  return args;
}

function cellText(value) {
  if (value == null) return "";
  if (typeof value === "object") {
    if (value.text) return String(value.text).trim();
    if (value.result != null) return String(value.result).trim();
    if (value instanceof Date) return value.toISOString();
    return String(value).trim();
  }
  return String(value).trim();
}

function normalizeStudentId(raw) {
  let id = cellText(raw).toUpperCase();
  if (id.startsWith("RO")) id = `O${id.slice(2)}`;
  return id;
}

function mapBranch(name) {
  const upper = cellText(name).toUpperCase();
  return BRANCH_MAP[upper] || upper;
}

function mapGender(raw) {
  const g = cellText(raw).toUpperCase();
  if (g.startsWith("M")) return "Male";
  if (g.startsWith("F")) return "Female";
  return raw ? cellText(raw) : "";
}

function headerIndexMap(worksheet) {
  const map = {};
  worksheet.getRow(1).eachCell((cell, col) => {
    const key = cellText(cell.value).toLowerCase().replace(/\s+/g, " ").trim();
    if (key && map[key] == null) map[key] = col;
  });
  return map;
}

function pick(row, map, keys) {
  for (const key of keys) {
    const col = map[key];
    if (col) return row.getCell(col).value;
  }
  return "";
}

/** Ongole admissions export uses fixed column positions on Sheet1. */
function pickAdmissionField(row, map, keys, fallbackCol) {
  const value = pick(row, map, keys);
  if (cellText(value)) return value;
  if (fallbackCol) return row.getCell(fallbackCol).value;
  return "";
}

async function loadAllocationMap(allocationPath) {
  if (!allocationPath || !fs.existsSync(allocationPath)) return new Map();

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(allocationPath);
  const ws = wb.worksheets[0];
  const map = headerIndexMap(ws);
  const byId = new Map();

  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const id = normalizeStudentId(
      pick(row, map, ["student_id", "student id", "studentid"]),
    );
    if (!id) continue;

    const branch = mapBranch(
      pick(row, map, ["branch", "allocation_branch", "department"]),
    );
    if (!branch || branch === "ABSENT") continue;

    byId.set(id, {
      branch,
      name: cellText(pick(row, map, ["student name", "student_name", "name"])),
      gender: mapGender(pick(row, map, ["gender", "sex"])),
      category: cellText(pick(row, map, ["category", "caste"])),
      campus: cellText(pick(row, map, ["campus", "center"])),
    });
  }

  return byId;
}

async function loadAdmissionRows(admissionPath, batchPrefix) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(admissionPath);

  const students = [];
  const seen = new Set();

  for (const ws of wb.worksheets) {
    const map = headerIndexMap(ws);

    for (let r = 2; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const id = normalizeStudentId(
        pickAdmissionField(
          row,
          map,
          ["studentid", "student id", "id no", "admissionnumber"],
          5,
        ),
      );

      if (!id || !id.startsWith(batchPrefix)) continue;

      const status = cellText(
        pick(row, map, ["admissionstatus", "admission status", "status"]),
      ).toLowerCase();
      if (
        status &&
        (status.includes("cancel") ||
          status.includes("not instersted") ||
          status.includes("not interested"))
      ) {
        continue;
      }

      if (seen.has(id)) continue;
      seen.add(id);

      students.push({
        id,
        name: cellText(
          pickAdmissionField(row, map, [
            "student_name",
            "student name",
            "name of the student",
            "name",
          ], 6),
        ),
        gender: mapGender(
          pickAdmissionField(row, map, ["gender", "sex"], 7),
        ),
        category: cellText(
          pickAdmissionField(row, map, ["caste", "category"], 8),
        ),
        campus: cellText(
          pickAdmissionField(row, map, ["campus", "center"], 4),
        ),
        phone: cellText(
          pickAdmissionField(row, map, [
            "contactno1",
            "contact no1",
            "studentmobile",
            "mobile 1",
            "phone",
          ], 18),
        ),
      });
    }
  }

  students.sort((a, b) => a.id.localeCompare(b.id));
  return students;
}

async function writeTemplate(rows, outputPath) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Template");

  ws.addRow(TEMPLATE_HEADERS);
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFF" } };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "1A237E" },
  };
  header.alignment = { vertical: "middle", horizontal: "center" };
  header.height = 25;

  for (const row of rows) {
    ws.addRow([
      row.id,
      row.name,
      row.email,
      row.gender,
      row.branch,
      row.year,
      row.section,
      row.batch,
      row.roomNo,
      row.isInCampus,
      row.phone,
    ]);
  }

  ws.columns.forEach((col) => {
    col.width = 20;
    col.alignment = { vertical: "middle", horizontal: "left" };
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await wb.xlsx.writeFile(outputPath);
}

async function main() {
  const args = parseArgs(process.argv);
  const batchPrefix = args.batch.replace(/[^A-Z0-9]/gi, "").toUpperCase();

  if (!args.admission) {
    console.error(
      "Missing admission file. Pass --admission /path/to/admissions.xlsx or set ADMISSION_XLSX.",
    );
    process.exit(1);
  }

  if (!fs.existsSync(args.admission)) {
    console.error(`Admission file not found: ${args.admission}`);
    process.exit(1);
  }

  const [admissionRows, allocationMap] = await Promise.all([
    loadAdmissionRows(args.admission, batchPrefix.slice(0, 3)),
    loadAllocationMap(args.allocation),
  ]);

  const rows = admissionRows.map((student) => {
    const alloc = allocationMap.get(student.id);
    const branch = alloc?.branch || "N/A";
    const section = args.section || alloc?.section || "A";

    return {
      id: student.id,
      name: alloc?.name || student.name,
      email: `${student.id.toLowerCase()}@rguktong.ac.in`,
      gender: alloc?.gender || student.gender,
      branch,
      year: args.year,
      section,
      batch: batchPrefix,
      roomNo: "",
      isInCampus: "YES",
      phone: student.phone,
      category: alloc?.category || student.category,
      campus: alloc?.campus || student.campus,
    };
  });

  const missingBranch = rows.filter((r) => !r.branch || r.branch === "N/A").length;

  await writeTemplate(rows, args.output);

  console.log(`Wrote ${rows.length} students -> ${args.output}`);
  console.log(
    `Batch ${batchPrefix}, year ${args.year}, allocation matches ${allocationMap.size}`,
  );
  if (missingBranch > 0 && allocationMap.size === 0) {
    console.log(
      `Branch set to N/A for ${missingBranch} students (update when allocation data is available).`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
