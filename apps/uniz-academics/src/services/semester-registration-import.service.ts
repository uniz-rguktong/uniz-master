import * as crypto from "crypto";
import * as ExcelJS from "exceljs";
import prisma from "../utils/prisma.util";
import {
  canonicalSubjectSemester,
  deriveSemesterSuffix,
} from "../utils/semester-subject.util";
import { validateRegistrationSubjectIds } from "./registration-validation.service";

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

/** Strip form/catalog noise so "Foo (NPTEL)-Elective -2" aligns with "Foo". */
function normalizeSubjectName(value: unknown): string {
  let text = normalizeLoose(value);
  text = text
    .replace(/\bNPTEL\b/g, " ")
    .replace(/\bOPEN ELECTIVE\b/g, " ")
    .replace(/\bELECTIVE\b/g, " ")
    .replace(/\bCORE\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text;
}

function looksLikeSubjectSelection(raw: string): boolean {
  const value = norm(raw);
  if (!value) return false;
  if (!/^[A-Za-z0-9]/.test(value)) return false;
  if (!/-/.test(value)) return false;
  const upper = value.toUpperCase().replace(/\s+/g, "");
  if (upper.includes("IHEREBYSUBMIT") || upper.includes("IAFFIRMTHAT")) return false;
  if (/^SEMESTER\s*-?\s*I\b/i.test(value)) return false;
  return true;
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

/** Accept only campus IDs like O210008 / S220011. */
export function isValidCampusStudentId(value: unknown): boolean {
  return /^[OS]\d{6}$/.test(normalizeStudentId(value));
}

/**
 * Recover a campus ID from messy form input:
 * emails (o210008@...), leading-zero typos (0210008), N/I/RO prefixes, etc.
 */
export function coerceCampusStudentId(value: unknown): string {
  const raw = normalizeStudentId(value);
  if (!raw) return "";
  if (isValidCampusStudentId(raw)) return raw;

  const emailLike = raw.match(/^([OS]\d{6})(?:@|$)/);
  if (emailLike) return emailLike[1];

  const embedded = raw.match(/([OS]\d{6})/);
  if (embedded) return embedded[1];

  const leadingZero = raw.match(/^0(\d{6})$/);
  if (leadingZero) return `O${leadingZero[1]}`;

  const sixDigits = raw.match(/^(\d{6})$/);
  if (sixDigits) return `O${sixDigits[1]}`;

  const niTypo = raw.match(/^[NI](\d{6})$/);
  if (niTypo) return `O${niTypo[1]}`;

  const roTypo = raw.match(/^RO(\d{6})$/);
  if (roTypo) return `O${roTypo[1]}`;

  const owTypo = raw.match(/^OW(\d{5})$/);
  if (owTypo) return `O2${owTypo[1]}`;

  return "";
}

function studentIdFromEmail(value: unknown): string {
  return coerceCampusStudentId(value);
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

function headerIndexMap(row: ExcelJS.Row): Map<string, number> {
  const map = new Map<string, number>();
  row.eachCell((cell, col) => {
    const key = norm(cell.value).toLowerCase().replace(/\s+/g, " ");
    if (key) map.set(key, col);
  });
  return map;
}

function colByHeader(
  row: ExcelJS.Row,
  headers: Map<string, number>,
  aliases: string[],
): string {
  for (const alias of aliases) {
    const idx = headers.get(alias.toLowerCase());
    if (idx) return cellText(row, idx);
  }
  return "";
}

function parseFlatSubjectCatalogWorkbook(
  workbook: ExcelJS.Workbook,
): SubjectImportRow[] {
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  let headerRow = 1;
  let headers = headerIndexMap(sheet.getRow(headerRow));
  if (!headers.has("branch") && !headers.has("subject code")) {
    sheet.eachRow((row, rowNumber) => {
      const probe = headerIndexMap(row);
      if (probe.has("branch") && probe.has("subject code")) {
        headerRow = rowNumber;
        headers = probe;
      }
    });
  }

  const rows: SubjectImportRow[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber <= headerRow) return;

    const branch = canonicalBranch(
      colByHeader(row, headers, ["branch", "department"]),
    );
    const academicYear = colByHeader(row, headers, [
      "academic year",
      "year",
    ]).toUpperCase();
    const batch = colByHeader(row, headers, ["batch"]).toUpperCase();
    const officialCode = normUpper(
      colByHeader(row, headers, ["subject code", "official code", "code"]),
    );
    const subjectName = colByHeader(row, headers, ["subject name", "name"]);
    const typeRaw = colByHeader(row, headers, ["type", "subject type"]);
    const mode = colByHeader(row, headers, ["theory/lab/project", "mode"]);
    const credits = Number(colByHeader(row, headers, ["credits"]) || 0);
    const delivery = colByHeader(row, headers, [
      "regular/nptel/elective",
      "delivery",
    ]);
    const electiveGroupCode = colByHeader(row, headers, [
      "elective group",
      "elective group code",
    ]);
    const electiveLimitRaw = colByHeader(row, headers, ["elective limit"]);
    const electiveLimit = Number(electiveLimitRaw || 0);

    if (!branch || !academicYear || !officialCode || !subjectName) return;

    const inferred = inferSubjectType(typeRaw || delivery);
    rows.push({
      branch,
      academicYear,
      batch,
      officialCode,
      subjectName,
      subjectType: inferred.subjectType,
      mode,
      credits: Number.isFinite(credits) ? credits : 0,
      delivery,
      electiveGroupCode: electiveGroupCode || inferred.electiveGroupCode,
      electiveGroupName:
        colByHeader(row, headers, ["elective group name"]) ||
        inferred.electiveGroupName,
      electiveLimit:
        electiveLimit > 0 ? electiveLimit : inferred.electiveLimit,
    });
  });

  return rows;
}

export async function parseSubjectCatalogWorkbook(
  buffer: Buffer,
): Promise<SubjectImportRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);

  const firstSheet = workbook.worksheets[0];
  if (firstSheet) {
    const probe = headerIndexMap(firstSheet.getRow(1));
    if (probe.has("branch") && probe.has("subject code")) {
      return parseFlatSubjectCatalogWorkbook(workbook).filter(
        (r) => r.branch && r.academicYear && r.officialCode,
      );
    }
  }

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

export function validateSubjectCatalogRows(rows: SubjectImportRow[]): ImportError[] {
  const errors: ImportError[] = [];
  if (!rows.length) {
    errors.push({
      message:
        "No valid subject rows found. Download the semester template and fill Branch, Academic Year, Batch, Subject Code, and Subject Name for every row.",
    });
    return errors;
  }

  const seen = new Map<string, number>();
  rows.forEach((row, idx) => {
    const rowNo = idx + 2;
    if (!/^E[1-4]$/.test(row.academicYear)) {
      errors.push({
        row: rowNo,
        message: `Row ${rowNo}: Academic Year must be E1, E2, E3, or E4 (got "${row.academicYear}").`,
      });
    }
    if (!row.batch || !/^O\d{2}$/i.test(row.batch)) {
      errors.push({
        row: rowNo,
        message: `Row ${rowNo}: Batch must be like O23 (got "${row.batch || ""}").`,
      });
    }
    if (row.credits < 0 || !Number.isFinite(row.credits)) {
      errors.push({
        row: rowNo,
        message: `Row ${rowNo}: Credits must be 0 or greater for "${row.officialCode} - ${row.subjectName}".`,
      });
    }
    const key = `${row.branch}|${row.academicYear}|${row.batch}|${row.officialCode}|${normalizeLoose(row.subjectName)}`;
    if (seen.has(key)) {
      errors.push({
        row: rowNo,
        message: `Row ${rowNo}: Duplicate subject "${row.officialCode} - ${row.subjectName}" for ${row.branch}/${row.academicYear}/${row.batch} (also at row ${seen.get(key)}).`,
      });
    } else {
      seen.set(key, rowNo);
    }
  });

  return errors;
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
  if (!looksLikeSubjectSelection(value)) return null;
  const codeMatch = value.match(/^([A-Za-z0-9][A-Za-z0-9\s]*?)\s*-/);
  if (!codeMatch) return null;
  const code = normUpper(codeMatch[1]);
  if (!/^[A-Z0-9]{5,}$/.test(code)) return null;
  let rest = value.slice(codeMatch[0].length).trim();
  // Forms often append "-Elective -2" / "-Core" after the title.
  let type = "";
  const typeMatch = rest.match(
    /\s*-\s*((?:OPEN\s+)?ELECTIVE|CORE|PE|LAB)(?:\s*-\s*\d+)?\s*$/i,
  );
  if (typeMatch) {
    type = typeMatch[1].trim();
    rest = rest.slice(0, typeMatch.index).trim();
  } else {
    const trailingNum = rest.match(/\s*-\s*(\d+)\s*$/);
    if (trailingNum) {
      type = trailingNum[1];
      rest = rest.slice(0, trailingNum.index).trim();
    }
  }
  const name = rest.replace(/^-+|-+$/g, "").trim();
  if (!name || name.length < 3) return null;
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
        coerceCampusStudentId(cellText(row, layout.id)) ||
        coerceCampusStudentId(submitterEmail) ||
        coerceCampusStudentId(cellText(row, layout.email));
      if (!studentId || !isValidCampusStudentId(studentId)) return;

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
  const errors: ImportError[] = [
    ...validateSubjectCatalogRows(opts.rows),
  ];
  const validRows = opts.rows.filter((row, idx) => {
    const missing = ["branch", "academicYear", "batch", "officialCode", "subjectName"].filter(
      (key) => !norm((row as any)[key]),
    );
    if (missing.length > 0) {
      errors.push({
        row: idx + 2,
        message: `Row ${idx + 2}: Missing ${missing.join(", ")}`,
      });
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

  if (errors.length > 0) {
    return {
      dryRun: false,
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
          semester: canonicalSubjectSemester(
            row.academicYear,
            opts.semesterName,
          ),
        },
        create: {
          id: code,
          code,
          name: row.subjectName,
          credits: row.credits,
          department: row.branch,
          semester: canonicalSubjectSemester(
            row.academicYear,
            opts.semesterName,
          ),
        },
      });
      subjectsUpserted++;

      const inferred = inferSubjectType(row.subjectType);
      const groupCode = row.electiveGroupCode || inferred.electiveGroupCode;
      const groupName = row.electiveGroupName || inferred.electiveGroupName;
      const groupLimit = row.electiveLimit || inferred.electiveLimit;
      if (!inferred.isMandatory && groupCode) {
        await tx.electiveGroup.upsert({
          where: {
            semesterId_branch_groupCode: {
              semesterId: opts.semesterId,
              branch: row.branch,
              groupCode,
            },
          },
          update: {
            academicYear: row.academicYear,
            groupName,
            selectionLimit: groupLimit,
          },
          create: {
            semesterId: opts.semesterId,
            branch: row.branch,
            academicYear: row.academicYear,
            groupCode,
            groupName,
            selectionLimit: groupLimit,
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
          electiveGroupId: groupCode,
          electiveGroupName: groupName,
          electiveLimit: groupLimit,
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
          electiveGroupId: groupCode,
          electiveGroupName: groupName,
          electiveLimit: groupLimit,
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

function subjectMatchKey(code: string, name: string): string {
  return `${normUpper(code)}|${normalizeSubjectName(name)}`;
}

function resolveAllocationMatch<T extends {
  customCode: string | null;
  customName: string | null;
  subject: { code: string; name: string };
}>(
  selected: { code: string; name: string },
  allocationByKey: Map<string, T>,
  allocationsByCode: Map<string, T[]>,
): T | undefined {
  const exact = allocationByKey.get(subjectMatchKey(selected.code, selected.name));
  if (exact) return exact;

  const code = normUpper(selected.code);
  const wanted = normalizeSubjectName(selected.name);
  if (!wanted) return undefined;

  const candidates = allocationsByCode.get(code) || [];
  const exactName = candidates.filter(
    (alloc) =>
      normalizeSubjectName(alloc.customName || alloc.subject.name) === wanted,
  );
  if (exactName.length === 1) return exactName[0];

  // Tolerate catalog typos / truncated form titles under shared XX codes.
  const fuzzy = candidates.filter((alloc) => {
    const have = normalizeSubjectName(alloc.customName || alloc.subject.name);
    if (!have) return false;
    return have.includes(wanted) || wanted.includes(have);
  });
  if (fuzzy.length === 1) return fuzzy[0];
  return undefined;
}

export async function importRegistrationRows(opts: {
  semesterId: string;
  rows: RegistrationImportRow[];
  mode?: RegistrationImportMode;
  dryRun?: boolean;
  skipValidation?: boolean;
  strict?: boolean;
}): Promise<RegistrationImportResult> {
  const mode = opts.mode || "replace";
  const strict = opts.strict !== false;
  const errors: ImportError[] = [];
  if (!opts.rows.length) {
    errors.push({
      message:
        "No registration responses parsed. Export the Google Form responses as Excel and ensure Timestamp, Email, Year, and subject columns are present.",
    });
    return {
      dryRun: Boolean(opts.dryRun),
      mode,
      semesterId: opts.semesterId,
      parsedRows: 0,
      importedStudents: 0,
      skippedStudents: 0,
      registrationsCreated: 0,
      errors,
    };
  }

  const allocations = await prisma.branchAllocation.findMany({
    where: { semesterId: opts.semesterId, isApproved: true },
    include: { subject: true },
  });
  if (!allocations.length) {
    errors.push({
      message:
        "No approved subject allocations exist for this semester. Upload and approve the subject catalog before importing registrations.",
    });
    return {
      dryRun: Boolean(opts.dryRun),
      mode,
      semesterId: opts.semesterId,
      parsedRows: opts.rows.length,
      importedStudents: 0,
      skippedStudents: 0,
      registrationsCreated: 0,
      errors,
    };
  }

  type PreparedRow = {
    row: RegistrationImportRow;
    uniqueSubjectIds: string[];
  };
  const prepared: PreparedRow[] = [];
  let skippedStudents = 0;

  for (const row of opts.rows) {
    const rowAllocations = allocations.filter(
      (a) =>
        a.branch.toUpperCase() === row.branch.toUpperCase() &&
        (!row.academicYear ||
          !a.academicYear ||
          a.academicYear.toUpperCase() === row.academicYear.toUpperCase()),
    );
    const allocationByKeyRow = new Map<string, (typeof allocations)[number]>();
    const allocationsByCodeRow = new Map<
      string,
      Array<(typeof allocations)[number]>
    >();
    for (const alloc of rowAllocations) {
      const code = normUpper(alloc.customCode || alloc.subject.code);
      allocationByKeyRow.set(
        subjectMatchKey(code, alloc.customName || alloc.subject.name),
        alloc,
      );
      const list = allocationsByCodeRow.get(code) || [];
      list.push(alloc);
      allocationsByCodeRow.set(code, list);
    }

    const subjectIds: string[] = [];
    for (const selected of row.subjects) {
      const match = resolveAllocationMatch(
        selected,
        allocationByKeyRow,
        allocationsByCodeRow,
      );
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

    if (!opts.skipValidation) {
      const validation = validateRegistrationSubjectIds(
        uniqueSubjectIds,
        rowAllocations,
      );
      if (!validation.ok) {
        errors.push({
          studentId: row.studentId,
          message: `Student ${row.studentId}: ${validation.error}`,
        });
        continue;
      }
    }

    if (mode === "skip") {
      const existingCount = await prisma.registration.count({
        where: {
          studentId: { equals: row.studentId, mode: "insensitive" },
          semesterId: opts.semesterId,
          status: "REGISTERED",
        },
      });
      if (existingCount > 0) {
        skippedStudents++;
        continue;
      }
    }

    prepared.push({ row, uniqueSubjectIds });
  }

  if (strict && errors.length > 0) {
    return {
      dryRun: Boolean(opts.dryRun),
      mode,
      semesterId: opts.semesterId,
      parsedRows: opts.rows.length,
      importedStudents: 0,
      skippedStudents,
      registrationsCreated: 0,
      errors,
    };
  }

  let importedStudents = 0;
  let registrationsCreated = 0;

  for (const item of prepared) {
    const { row, uniqueSubjectIds } = item;

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

export async function buildSubjectTemplateWorkbook(opts?: {
  semesterId?: string;
  branch?: string;
  academicYear?: string;
}): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  const instructions = workbook.addWorksheet("Instructions");
  instructions.addRow(["Semester Registration Subject Template"]);
  instructions.addRow([
    "1. Fill one row per subject allocation (core, lab, and each elective option).",
  ]);
  instructions.addRow([
    "2. Electives sharing a code (e.g. 23CS41XX) must use the same Elective Group; set Elective Limit to how many a student picks (1, 2, 3).",
  ]);
  instructions.addRow([
    "3. Upload without approve — Dean reviews, then HODs approve branch subjects, then open registration for students.",
  ]);
  instructions.addRow([
    "4. RGUKT multi-sheet workbooks (sheet name = branch) are also accepted.",
  ]);

  const sheet = workbook.addWorksheet("Subjects");
  const columns = [
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
  sheet.columns = columns;

  if (opts?.semesterId) {
    const { loadTemplateSubjectsFromSemester } = await import(
      "../utils/semester-subject.util"
    );
    const { subjects } = await loadTemplateSubjectsFromSemester({
      academicSemesterId: opts.semesterId,
      branch: opts.branch,
      academicYear: opts.academicYear,
      approvedOnly: false,
    });

    if (subjects.length > 0) {
      for (const sub of subjects) {
        const typeLabel = sub.isMandatory
          ? "Core"
          : sub.electiveGroupName || sub.subjectType || "Elective";
        sheet.addRow({
          branch: sub.department,
          academicYear: sub.academicYear || "",
          batch: sub.batch || "",
          officialCode: sub.academicCode || sub.code,
          subjectName: sub.name,
          subjectType: typeLabel,
          mode: sub.name.toLowerCase().includes("lab") ? "Lab" : "Theory",
          credits: sub.credits,
          delivery: sub.isMandatory ? "Regular" : "NPTEL/Elective",
          electiveGroupCode: sub.electiveGroupId || "",
          electiveLimit: sub.isMandatory ? "" : sub.electiveLimit || 1,
        });
      }
      return Buffer.from(await workbook.xlsx.writeBuffer());
    }
  }

  // Example rows when no semester data exists yet.
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
    electiveGroupCode: "",
    electiveLimit: "",
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
  sheet.addRow({
    branch: "CSE",
    academicYear: "E4",
    batch: "O21",
    officialCode: "23CS41XX",
    subjectName: "Introduction to Internet of Things (NPTEL)",
    subjectType: "Elective-4",
    mode: "Theory",
    credits: 3,
    delivery: "NPTEL/Elective-4",
    electiveGroupCode: "ELECTIVE-4",
    electiveLimit: 1,
  });
  sheet.addRow({
    branch: "CE",
    academicYear: "E4",
    batch: "O21",
    officialCode: "23CE41XX",
    subjectName: "Sustainable Transportation Systems",
    subjectType: "Elective-2",
    mode: "Theory",
    credits: 3,
    delivery: "NPTEL/Elective-2",
    electiveGroupCode: "ELECTIVE-2",
    electiveLimit: 2,
  });
  sheet.addRow({
    branch: "CE",
    academicYear: "E4",
    batch: "O21",
    officialCode: "23CE41XX",
    subjectName: "Ground Improvement",
    subjectType: "Elective-2",
    mode: "Theory",
    credits: 3,
    delivery: "NPTEL/Elective-2",
    electiveGroupCode: "ELECTIVE-2",
    electiveLimit: 2,
  });
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
