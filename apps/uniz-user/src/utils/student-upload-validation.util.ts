import { ENGINEERING_BRANCHES, resolveStudentBranch } from "@uniz/shared";

export type StudentUploadValidationError = {
  row?: number;
  studentId?: string;
  field?: string;
  message: string;
};

const REQUIRED_HEADERS = [
  "student id",
  "name",
  "email",
  "branch",
  "year",
  "section",
] as const;

const VALID_YEARS = new Set(["E1", "E2", "E3", "E4"]);

function pick(row: Record<string, unknown>, aliases: string[]): string {
  const lower = Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k.toLowerCase().trim(), v]),
  );
  for (const alias of aliases) {
    const val = lower[alias];
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      return String(val).trim();
    }
  }
  return "";
}

function isDataRow(row: Record<string, unknown>): boolean {
  return Object.values(row).some((v) => String(v ?? "").trim() !== "");
}

export function validateStudentUploadHeaders(headers: string[]): StudentUploadValidationError[] {
  const normalized = headers.map((h) => h.toLowerCase().trim());
  const missing = REQUIRED_HEADERS.filter((h) => !normalized.includes(h));
  if (!missing.length) return [];
  return missing.map((field) => ({
    field,
    message: `Missing required column: ${field
      .split(" ")
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(" ")}`,
  }));
}

export function validateStudentUploadRows(
  rows: Record<string, unknown>[],
): StudentUploadValidationError[] {
  const errors: StudentUploadValidationError[] = [];
  const dataRows = rows.filter(isDataRow);
  if (!dataRows.length) {
    errors.push({ message: "No data rows found in the Excel file." });
    return errors;
  }

  const seenIds = new Map<string, number>();

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowNo = i + 2;
    let id = pick(row, ["student id", "studentid", "student_id", "id", "username"]).toUpperCase();
    if (id.startsWith("RO")) id = "O" + id.slice(2);

    const name = pick(row, ["name", "student name", "student_name"]);
    const email = pick(row, ["email", "mail", "student_email"]);
    const branchRaw = pick(row, ["branch", "department", "allocation_branch"]);
    const branch = resolveStudentBranch(branchRaw);
    const year = pick(row, ["year", "class", "academic_year"]).toUpperCase();
    const section = pick(row, ["section", "sec"]).toUpperCase();

    if (!id) {
      errors.push({
        row: rowNo,
        field: "Student ID",
        message: `Row ${rowNo}: Student ID is required.`,
      });
    } else {
      if (!/^[OS]\d{6}$/i.test(id)) {
        errors.push({
          row: rowNo,
          studentId: id,
          field: "Student ID",
          message: `Row ${rowNo}: Student ID "${id}" is not valid (expected O###### or S######).`,
        });
      }
      if (seenIds.has(id)) {
        errors.push({
          row: rowNo,
          studentId: id,
          field: "Student ID",
          message: `Row ${rowNo}: Duplicate Student ID "${id}" (also at row ${seenIds.get(id)}).`,
        });
      } else {
        seenIds.set(id, rowNo);
      }
    }

    if (!name) {
      errors.push({
        row: rowNo,
        studentId: id,
        field: "Name",
        message: `Row ${rowNo}: Name is required for student ${id || "(unknown)"}.`,
      });
    }

    if (!email) {
      errors.push({
        row: rowNo,
        studentId: id,
        field: "Email",
        message: `Row ${rowNo}: Email is required for student ${id || "(unknown)"}.`,
      });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({
        row: rowNo,
        studentId: id,
        field: "Email",
        message: `Row ${rowNo}: Email "${email}" is not valid for student ${id || "(unknown)"}.`,
      });
    }

    if (!branchRaw || branch === "N/A") {
      errors.push({
        row: rowNo,
        studentId: id,
        field: "Branch",
        message: `Row ${rowNo}: Branch is required and must be a valid engineering branch for student ${id || "(unknown)"}. Allowed: ${ENGINEERING_BRANCHES.join(", ")}.`,
      });
    }

    if (!year) {
      errors.push({
        row: rowNo,
        studentId: id,
        field: "Year",
        message: `Row ${rowNo}: Year is required for student ${id || "(unknown)"} (E1, E2, E3, or E4).`,
      });
    } else if (!VALID_YEARS.has(year)) {
      errors.push({
        row: rowNo,
        studentId: id,
        field: "Year",
        message: `Row ${rowNo}: Year "${year}" is invalid for student ${id || "(unknown)"}. Use E1, E2, E3, or E4.`,
      });
    }

    if (!section || ["UNKNOWN", "GENERAL"].includes(section)) {
      errors.push({
        row: rowNo,
        studentId: id,
        field: "Section",
        message: `Row ${rowNo}: Section is required for student ${id || "(unknown)"}.`,
      });
    }
  }

  return errors;
}

export function studentUploadRejected(errors: StudentUploadValidationError[]) {
  return {
    success: false,
    message: `Upload rejected: ${errors.length} validation error(s). Fix every issue below and re-upload. No students were created or updated.`,
    errorCount: errors.length,
    errors: errors.slice(0, 200),
  };
}
