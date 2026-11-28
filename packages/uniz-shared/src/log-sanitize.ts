/** Strip carriage returns and newlines before writing dynamic values to logs. */
export function sanitizeLog(value: unknown): string {
  return String(value).replace(/[\r\n]/g, " ");
}
