import * as crypto from "crypto";
import * as ExcelJS from "exceljs";
import prisma from "../utils/prisma.util";

export type SubjectImportRow = {
  branch: string;
  academicYear: string;
  batch: string;
  officialCode: string;
  subjectName: string;
  subjectType: string;
  mode: string;
  credits: number;
  delivery: string;
  electiveGroupCode?: string;
  electiveGroupName?: string;
  electiveLimit?: number;
};

export type RegistrationImportRow = {
  studentId: string;
  email: string;
  name: string;
  phone: string;
  branch: string;
  academicYear: string;
  batch: string;
  submittedAt: Date;
  subjects: Array<{
    raw: string;
    code: string;
    name: string;
    type: string;
  }>;
};

export type RegistrationImportMode = "skip" | "replace";

type ImportError = {
  row?: number;
  studentId?: string;
  message: string;
};

export type RegistrationImportResult = {
  dryRun: boolean;
  mode: RegistrationImportMode;
  semesterId: string;
  parsedRows: number;
  importedStudents: number;
  skippedStudents: number;
  registrationsCreated: number;
  errors: ImportError[];
};

const BRANCH_ALIASES: Record<string, string> = {
  "AI/ML": "AIML",
  "AI_ML": "AIML",
  "ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING": "AIML",
  "COMPUTER SCIENCE AND ENGINEERING": "CSE",
  "CIVIL ENGINEERING": "CE",
  "ELECTRONICS AND COMMUNICATION ENGINEERING": "ECE",
  "ELECTRICAL AND ELECTRONICS ENGINEERING": "EEE",
  "ELECTRICAL AND ELECTRONICS ENGINEERING.": "EEE",
  "MECHANICAL ENGINEERING": "ME",
};

const FORM_LAYOUT: Record<
  string,
  { id: number; email: number; name: number; phone: number; subjects: number[] }
> = {
  // ExcelJS rows are 1-based. Google Forms stores E2/E3/E4 in separate sections.
  E2: { id: 5, email: 6, name: 7, phone: 8, subjects: [9] },
  E3: { id: 11, email: 12, name: 13, phone: 14, subjects: [15] },
  E4: { id: 17, email: 18, name: 19, phone: 20, subjects: [21, 22, 23, 24] },
};

function norm(value: unknown): string {
  return String(value ?? "").trim();
}

function normUpper(value: unknown): string {
  return norm(value).replace(/\s+/g, "").toUpperCase();
}

function normalizeLoose(value: unknown): string {
  return norm(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function canonicalBranch(value: unknown): string {
  const raw = norm(value).toUpperCase().replace(/\s+/g, " ");
  return BRANCH_ALIASES[raw] || raw.replace(/[^A-Z0-9]/g, "");
}

function yearBand(value: unknown): "E2" | "E3" | "E4" | "" {
  const raw = norm(value).toUpperCase();
  if (raw.includes("E2")) return "E2";
  if (raw.includes("E3")) return "E3";
  if (raw.includes("E4")) return "E4";
  return "";
}

function batchFromYear(value: unknown): string {
  const raw = norm(value).toUpperCase();
  const match = raw.match(/\((O\d{2})\s+BATCH\)/i) || raw.match(/\b(O\d{2})\b/i);
  return match ? match[1].toUpperCase() : "";
}

function normalizeStudentId(value: unknown): string {
  return norm(value).replace(/\s+/g, "").toUpperCase();
}

function studentIdFromEmail(value: unknown): string {
  const match = norm(value).toLowerCase().match(/^([os]\d{6})@/);
  return match ? match[1].toUpperCase() : "";
}

function excelDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    // Excel serial date epoch: 1899-12-30.
    return new Date(Math.round((value - 25569) * 86400 * 1000));
  }
  const asNumber = Number(value);
  if (Number.isFinite(asNumber) && asNumber > 20000) {
    return new Date(Math.round((asNumber - 25569) * 86400 * 1000));
  }
  const parsed = new Date(norm(value));
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function hash8(value: string): string {
  return crypto.createHash("sha1").update(value).digest("hex").slice(0, 8);
}

function slug(value: unknown): string {
  return norm(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function internalSubjectCode(row: {
  semesterId: string;
  branch: string;
  academicYear: string;
  batch: string;
  officialCode: string;
  subjectName: string;
}): string {
  const base = [
    "SEMREG",
    row.semesterId,
    row.branch,
    row.academicYear,
    row.batch,
    slug(row.officialCode),
    hash8(`${row.officialCode}|${row.subjectName}`),
  ].join("-");
  return base.slice(0, 180).toUpperCase();
}

function inferSubjectType(value: unknown): {
  subjectType: string;
  isMandatory: boolean;
  electiveGroupCode: string;
  electiveGroupName: string;
  electiveLimit: number;
} {
  const raw = norm(value);
  const upper = raw.toUpperCase();
  if (!upper || upper.includes("CORE")) {
    return {
      subjectType: "CORE",
      isMandatory: true,
      electiveGroupCode: "",
      electiveGroupName: "",
      electiveLimit: 1,
    };
  }
  const isOpen = upper.includes("OPEN");
  const limitMatch = upper.match(/(\d)\s*,\s*(\d)/);
  const explicitNumber = upper.match(/ELECTIVE\s*-?\s*(\d+)/);
  const groupCode = isOpen
    ? "OPEN_ELECTIVE"
    : limitMatch
      ? `ELECTIVE-${limitMatch[0].replace(/\s+/g, "")}`
      : explicitNumber
        ? `ELECTIVE-${explicitNumber[1]}`
        : "ELECTIVE";
  return {
    subjectType: isOpen ? "OPEN_ELECTIVE" : "ELECTIVE",
    isMandatory: false,
    electiveGroupCode: groupCode,
    electiveGroupName: raw || groupCode,
    electiveLimit: limitMatch ? limitMatch[0].split(",").length : 1,
  };
}

function integerCreditOverride(credits: number): number | null {
  return Number.isInteger(credits) ? credits : null;
}

function parseBatchHeader(value: unknown): { academicYear: string; batch: string } | null {
  const raw = norm(value).toUpperCase();
  const match = raw.match(/\b(E[1-4])\s*-\s*(O\d{2})\s+BATCH\b/);
  if (match) return { academicYear: match[1], batch: match[2] };
  const year = raw.match(/\b(E[1-4])\b/)?.[1];
  const batch = raw.match(/\b(O\d{2})\b/)?.[1];
  if (year || batch) return { academicYear: year || "", batch: batch || "" };
  return null;
}

function cellText(row: ExcelJS.Row, index: number): string {
  const value = row.getCell(index).value as any;
  if (value && typeof value === "object") {
    if ("text" in value) return norm(value.text);
    if ("richText" in value) {
      return (value.richText || []).map((r: any) => r.text || "").join("").trim();
    }
    if ("result" in value) return norm(value.result);
  }
  return norm(value);
}

export async function parseSubjectCatalogWorkbook(
  buffer: Buffer,
): Promise<SubjectImportRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  const rows: SubjectImportRow[] = [];

  workbook.eachSheet((sheet) => {
    const branch = canonicalBranch(sheet.name);
    let academicYear = "";
    let batch = "";

    sheet.eachRow((row) => {
      const first = cellText(row, 1);
      const second = cellText(row, 2);
      const third = cellText(row, 3);
      const batchHeader = parseBatchHeader(first);
      if (batchHeader) {
        academicYear = batchHeader.academicYear || academicYear;
        batch = batchHeader.batch || batch;
        return;
      }
      if (/S\.?\s*No/i.test(first) || /subject code/i.test(second)) return;
      if (!second || !third) return;

      const officialCode = normUpper(second);
      const subjectName = third;
      const credits = Number(cellText(row, 6) || 0);
      const inferred = inferSubjectType(cellText(row, 4));
      rows.push({
        branch,
        academicYear,
        batch,
        officialCode,
        subjectName,
        subjectType: inferred.subjectType,
        mode: cellText(row, 5),
        credits: Number.isFinite(credits) ? credits : 0,
        delivery: cellText(row, 7),
        electiveGroupCode: inferred.electiveGroupCode,
        electiveGroupName: inferred.electiveGroupName,
        electiveLimit: inferred.electiveLimit,
      });
    });
  });

  return rows.filter((r) => r.branch && r.academicYear && r.officialCode);
}

function splitSubjectSelections(value: string): string[] {
  return value
    .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
    .map((v) => v.trim().replace(/^"|"$/g, ""))
    .filter(Boolean);
}

export function parseSubjectSelection(raw: string): {
  raw: string;
  code: string;
  name: string;
  type: string;
} | null {
  const value = norm(raw);
  if (!value) return null;
  const codeMatch = value.match(/^([A-Za-z0-9][A-Za-z0-9\s]*?)-/);
  if (!codeMatch) return null;
  const code = normUpper(codeMatch[1]);
  const rest = value.slice(codeMatch[0].length);
  const lastDash = rest.lastIndexOf("-");
  const name = lastDash >= 0 ? rest.slice(0, lastDash).trim() : rest.trim();
  const type = lastDash >= 0 ? rest.slice(lastDash + 1).trim() : "";
  return { raw: value, code, name, type };
}

export async function parseRegistrationFormWorkbook(
  buffer: Buffer,
  fallbackBranch?: string,
): Promise<RegistrationImportRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  const parsed: RegistrationImportRow[] = [];

  workbook.eachSheet((sheet) => {
    let headerRowNumber = 1;
    sheet.eachRow((row, rowNumber) => {
      if (/timestamp/i.test(cellText(row, 1)) && /email/i.test(cellText(row, 2))) {
        headerRowNumber = rowNumber;
      }
    });

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber <= headerRowNumber) return;
      const timestamp = cellText(row, 1);
      const submitterEmail = cellText(row, 2);
      const year = cellText(row, 4);
      const band = yearBand(year);
      if (!timestamp || !submitterEmail || !band) return;
      const layout = FORM_LAYOUT[band];

      const studentId =
        normalizeStudentId(cellText(row, layout.id)) ||
        studentIdFromEmail(submitterEmail) ||
        studentIdFromEmail(cellText(row, layout.email));
      if (!studentId) return;

      const subjects = layout.subjects.flatMap((subjectCol) =>
        splitSubjectSelections(cellText(row, subjectCol))
          .map(parseSubjectSelection)
          .filter((s): s is NonNullable<ReturnType<typeof parseSubjectSelection>> =>
            Boolean(s),
          ),
      );
      const dedupedSubjects = Array.from(
        new Map(subjects.map((s) => [`${s.code}|${normalizeLoose(s.name)}`, s])).values(),
      );

      parsed.push({
        studentId,
        email: norm(cellText(row, layout.email) || submitterEmail).toLowerCase(),
        name: cellText(row, layout.name),
        phone: cellText(row, layout.phone),
        branch: canonicalBranch(fallbackBranch || cellText(row, 3)),
        academicYear: band,
        batch: batchFromYear(year),
        submittedAt: excelDate(Number(timestamp) || timestamp),
        subjects: dedupedSubjects,
      });
    });
  });

  // Latest submission wins for duplicate student IDs.
  return Array.from(
    parsed
      .sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime())
      .reduce((map, row) => map.set(row.studentId, row), new Map<string, RegistrationImportRow>())
      .values(),
  );
}

export async function upsertSemesterSubjectCatalog(opts: {
  semesterId: string;
  semesterName: string;
  rows: SubjectImportRow[];
  dryRun?: boolean;
  approve?: boolean;
}) {
  const errors: ImportError[] = [];
  const validRows = opts.rows.filter((row, idx) => {
    const missing = ["branch", "academicYear", "batch", "officialCode", "subjectName"].filter(
      (key) => !norm((row as any)[key]),
    );
    if (missing.length > 0) {
      errors.push({ row: idx + 1, message: `Missing ${missing.join(", ")}` });
      return false;
    }
    return true;
  });

  if (opts.dryRun) {
    return {
      dryRun: true,
      semesterId: opts.semesterId,
      parsedRows: opts.rows.length,
      validRows: validRows.length,
      subjectsUpserted: 0,
      allocationsUpserted: 0,
      electiveGroupsUpserted: 0,
      errors,
    };
  }

  let subjectsUpserted = 0;
  let allocationsUpserted = 0;
  let electiveGroupsUpserted = 0;

  await prisma.$transaction(async (tx) => {
    for (const row of validRows) {
      const code = internalSubjectCode({
        semesterId: opts.semesterId,
        branch: row.branch,
        academicYear: row.academicYear,
        batch: row.batch,
        officialCode: row.officialCode,
        subjectName: row.subjectName,
      });
      const subject = await tx.subject.upsert({
        where: { code },
        update: {
          name: row.subjectName,
          credits: row.credits,
          department: row.branch,
          semester: `${row.academicYear}-${deriveSemesterSuffix(opts.semesterName)}`,
        },
        create: {
          id: code,
          code,
          name: row.subjectName,
          credits: row.credits,
          department: row.branch,
          semester: `${row.academicYear}-${deriveSemesterSuffix(opts.semesterName)}`,
        },
      });
      subjectsUpserted++;

      const inferred = inferSubjectType(row.subjectType);
      if (!inferred.isMandatory && inferred.electiveGroupCode) {
        await tx.electiveGroup.upsert({
          where: {
            semesterId_branch_groupCode: {
              semesterId: opts.semesterId,
              branch: row.branch,
              groupCode: inferred.electiveGroupCode,
            },
          },
          update: {
            academicYear: row.academicYear,
            groupName: inferred.electiveGroupName,
            selectionLimit: row.electiveLimit || inferred.electiveLimit,
          },
          create: {
            semesterId: opts.semesterId,
            branch: row.branch,
            academicYear: row.academicYear,
            groupCode: inferred.electiveGroupCode,
            groupName: inferred.electiveGroupName,
            selectionLimit: row.electiveLimit || inferred.electiveLimit,
          },
        });
        electiveGroupsUpserted++;
      }

      await tx.branchAllocation.upsert({
        where: {
          branch_subjectId_semesterId: {
            branch: row.branch,
            subjectId: subject.id,
            semesterId: opts.semesterId,
          },
        },
        update: {
          academicYear: row.academicYear,
          batch: row.batch,
          customCode: row.officialCode,
          customName: row.subjectName,
          customCredits: integerCreditOverride(row.credits),
          subjectType: inferred.subjectType,
          isMandatory: inferred.isMandatory,
          electiveGroupId: inferred.electiveGroupCode,
          electiveGroupName: inferred.electiveGroupName,
          electiveLimit: row.electiveLimit || inferred.electiveLimit,
          status: opts.approve ? "APPROVED" : "DEAN_PENDING",
          isApproved: Boolean(opts.approve),
        },
        create: {
          branch: row.branch,
          academicYear: row.academicYear,
          batch: row.batch,
          subjectId: subject.id,
          semesterId: opts.semesterId,
          customCode: row.officialCode,
          customName: row.subjectName,
          customCredits: integerCreditOverride(row.credits),
          subjectType: inferred.subjectType,
          isMandatory: inferred.isMandatory,
          electiveGroupId: inferred.electiveGroupCode,
          electiveGroupName: inferred.electiveGroupName,
          electiveLimit: row.electiveLimit || inferred.electiveLimit,
          status: opts.approve ? "APPROVED" : "DEAN_PENDING",
          isApproved: Boolean(opts.approve),
        },
      });
      allocationsUpserted++;
    }
  });

  return {
    dryRun: false,
    semesterId: opts.semesterId,
    parsedRows: opts.rows.length,
    validRows: validRows.length,
    subjectsUpserted,
    allocationsUpserted,
    electiveGroupsUpserted,
    errors,
  };
}

function deriveSemesterSuffix(semesterName: string): string {
  const match = semesterName.match(/SEM[-\s]?([12])/i);
  return match ? `SEM-${match[1]}` : "SEM-1";
}

function subjectMatchKey(code: string, name: string): string {
  return `${normUpper(code)}|${normalizeLoose(name)}`;
}

export async function importRegistrationRows(opts: {
  semesterId: string;
  rows: RegistrationImportRow[];
  mode?: RegistrationImportMode;
  dryRun?: boolean;
}): Promise<RegistrationImportResult> {
  const mode = opts.mode || "replace";
  const errors: ImportError[] = [];
  const allocations = await prisma.branchAllocation.findMany({
    where: { semesterId: opts.semesterId, isApproved: true },
    include: { subject: true },
  });
  const allocationByKey = new Map<string, (typeof allocations)[number]>();
  for (const alloc of allocations) {
    allocationByKey.set(
      subjectMatchKey(alloc.customCode || alloc.subject.code, alloc.customName || alloc.subject.name),
      alloc,
    );
  }

  let importedStudents = 0;
  let skippedStudents = 0;
  let registrationsCreated = 0;

  for (const row of opts.rows) {
    const subjectIds: string[] = [];
    for (const selected of row.subjects) {
      const match = allocationByKey.get(subjectMatchKey(selected.code, selected.name));
      if (!match) {
        errors.push({
          studentId: row.studentId,
          message: `No approved allocation matched ${selected.code} - ${selected.name}`,
        });
        continue;
      }
      subjectIds.push(match.subjectId);
    }

    const uniqueSubjectIds = [...new Set(subjectIds)];
    if (uniqueSubjectIds.length === 0) {
      errors.push({ studentId: row.studentId, message: "No subjects resolved" });
      continue;
    }

    const existingCount = await prisma.registration.count({
      where: {
        studentId: { equals: row.studentId, mode: "insensitive" },
        semesterId: opts.semesterId,
        status: "REGISTERED",
      },
    });

    if (mode === "skip" && existingCount > 0) {
      skippedStudents++;
      continue;
    }

    if (opts.dryRun) {
      importedStudents++;
      registrationsCreated += uniqueSubjectIds.length;
      continue;
    }

    await prisma.$transaction(async (tx) => {
      if (mode === "replace") {
        await tx.registration.deleteMany({
          where: {
            studentId: { equals: row.studentId, mode: "insensitive" },
            semesterId: opts.semesterId,
          },
        });
      }

      await tx.registration.createMany({
        data: uniqueSubjectIds.map((subjectId) => ({
          studentId: row.studentId,
          subjectId,
          semesterId: opts.semesterId,
          status: "REGISTERED",
          batch: row.batch,
          submittedAt: row.submittedAt,
        })),
        skipDuplicates: true,
      });
    });
    importedStudents++;
    registrationsCreated += uniqueSubjectIds.length;
  }

  return {
    dryRun: Boolean(opts.dryRun),
    mode,
    semesterId: opts.semesterId,
    parsedRows: opts.rows.length,
    importedStudents,
    skippedStudents,
    registrationsCreated,
    errors,
  };
}

export async function buildSubjectTemplateWorkbook(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Subjects");
  sheet.columns = [
    { header: "Branch", key: "branch", width: 12 },
    { header: "Academic Year", key: "academicYear", width: 14 },
    { header: "Batch", key: "batch", width: 10 },
    { header: "Subject Code", key: "officialCode", width: 18 },
    { header: "Subject Name", key: "subjectName", width: 45 },
    { header: "Type", key: "subjectType", width: 20 },
    { header: "Theory/Lab/Project", key: "mode", width: 18 },
    { header: "Credits", key: "credits", width: 10 },
    { header: "Regular/NPTEL/Elective", key: "delivery", width: 24 },
    { header: "Elective Group", key: "electiveGroupCode", width: 18 },
    { header: "Elective Limit", key: "electiveLimit", width: 14 },
  ];
  sheet.addRow({
    branch: "CSE",
    academicYear: "E2",
    batch: "O23",
    officialCode: "23CS2101",
    subjectName: "Design & Analysis of Algorithms",
    subjectType: "Core",
    mode: "Theory",
    credits: 4,
    delivery: "Regular",
  });
  sheet.addRow({
    branch: "CSE",
    academicYear: "E4",
    batch: "O21",
    officialCode: "23CS41XX",
    subjectName: "The Joy Of Computing Using Python (NPTEL)",
    subjectType: "Elective-4",
    mode: "Theory",
    credits: 3,
    delivery: "NPTEL/Elective-4",
    electiveGroupCode: "ELECTIVE-4",
    electiveLimit: 1,
  });
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
