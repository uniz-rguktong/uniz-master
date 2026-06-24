/**
 * Denormalized subject labels for grades/attendance — survives catalog edits
 * and per-semester allocation overrides (volatile semester subjects).
 */
export function buildSubjectSnapshot(opts: {
  code: string;
  catalogName: string;
  subjectNameOverride?: string | null;
  customName?: string | null;
  spreadsheetName?: string | null;
}): { subjectCode: string; subjectName: string } {
  const subjectCode = String(opts.code || "").trim().toUpperCase();
  const subjectName = (
    opts.subjectNameOverride?.trim() ||
    opts.customName?.trim() ||
    opts.spreadsheetName?.trim() ||
    opts.catalogName ||
    subjectCode
  ).trim();
  return { subjectCode, subjectName };
}

export function displaySubjectCode(row: {
  subjectCode?: string | null;
  subject?: { code?: string } | null;
}): string {
  return row.subjectCode?.trim() || row.subject?.code?.trim() || "";
}

export function displaySubjectName(row: {
  subjectNameOverride?: string | null;
  subjectName?: string | null;
  subject?: { name?: string; code?: string } | null;
}): string {
  return (
    row.subjectNameOverride?.trim() ||
    row.subjectName?.trim() ||
    row.subject?.name?.trim() ||
    row.subject?.code?.trim() ||
    "Unknown"
  );
}
