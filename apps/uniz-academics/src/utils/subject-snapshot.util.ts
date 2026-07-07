/**
 * Subject label resolution — internal catalog codes vs per-semester academic codes.
 *
 * - Internal (`Subject.code`): stable catalog key for DB joins, APIs, upload matching.
 * - Academic (`BranchAllocation.customCode`): official code on slips, grade sheets, portal.
 */
export function resolveDisplaySubjectCode(opts: {
  customCode?: string | null;
  snapshotCode?: string | null;
  catalogCode?: string | null;
}): string {
  return (
    opts.customCode?.trim() ||
    opts.snapshotCode?.trim() ||
    opts.catalogCode?.trim() ||
    ""
  ).toUpperCase();
}

export function resolveInternalSubjectCode(
  subject?: { code?: string | null } | null,
): string {
  return String(subject?.code || "")
    .trim()
    .toUpperCase();
}

/**
 * Denormalized subject labels for grades/attendance — survives catalog edits
 * and per-semester allocation overrides (volatile semester subjects).
 */
export function buildSubjectSnapshot(opts: {
  code: string;
  catalogName: string;
  customCode?: string | null;
  subjectNameOverride?: string | null;
  customName?: string | null;
  spreadsheetName?: string | null;
}): { subjectCode: string; subjectName: string } {
  const internalCode = resolveInternalSubjectCode({ code: opts.code });
  const subjectCode = resolveDisplaySubjectCode({
    customCode: opts.customCode,
    catalogCode: internalCode,
  });
  const subjectName = (
    opts.subjectNameOverride?.trim() ||
    opts.customName?.trim() ||
    opts.spreadsheetName?.trim() ||
    opts.catalogName ||
    subjectCode ||
    internalCode
  ).trim();
  return { subjectCode, subjectName };
}

export function displaySubjectCode(row: {
  subjectCode?: string | null;
  subject?: { code?: string } | null;
  customCode?: string | null;
  allocation?: { customCode?: string | null } | null;
}): string {
  return resolveDisplaySubjectCode({
    customCode: row.customCode ?? row.allocation?.customCode,
    snapshotCode: row.subjectCode,
    catalogCode: row.subject?.code,
  });
}

export function displaySubjectName(row: {
  subjectNameOverride?: string | null;
  subjectName?: string | null;
  subject?: { name?: string; code?: string } | null;
  customName?: string | null;
  allocation?: { customName?: string | null } | null;
}): string {
  return (
    row.subjectNameOverride?.trim() ||
    row.customName?.trim() ||
    row.allocation?.customName?.trim() ||
    row.subjectName?.trim() ||
    row.subject?.name?.trim() ||
    row.subject?.code?.trim() ||
    "Unknown"
  );
}
