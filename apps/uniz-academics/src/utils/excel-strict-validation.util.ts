export type UploadValidationError = {
  row?: number;
  studentId?: string;
  field?: string;
  message: string;
};

export function uploadRejected(
  errors: UploadValidationError[],
  summary?: string,
) {
  const head =
    summary ||
    `Upload rejected: ${errors.length} validation error(s). Fix every issue below and re-upload. No data was saved.`;
  return {
    success: false,
    message: head,
    errorCount: errors.length,
    errors: errors.slice(0, 200),
  };
}

export function isBlank(value: unknown): boolean {
  return String(value ?? "").trim() === "";
}

export function rowNumberFromIndex(index: number): number {
  return index + 2; // Excel row (1-based header + data offset)
}

export function pickRowValue(
  row: Record<string, string>,
  aliases: string[],
): string {
  for (const alias of aliases) {
    const exact = row[alias];
    if (!isBlank(exact)) return String(exact).trim();
  }
  const lower = Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k.toLowerCase(), v]),
  );
  for (const alias of aliases) {
    const val = lower[alias.toLowerCase()];
    if (!isBlank(val)) return String(val).trim();
  }
  return "";
}
