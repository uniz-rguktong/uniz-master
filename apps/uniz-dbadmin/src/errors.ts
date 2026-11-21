export class DbAdminError extends Error {
  status: number;
  confirmText?: string;

  constructor(status: number, message: string, confirmText?: string) {
    super(message);
    this.name = "DbAdminError";
    this.status = status;
    this.confirmText = confirmText;
  }
}

export function sanitizePgMessage(code: string | undefined, message: string): string {
  if (/password|postgres(ql)?:\/\//i.test(message)) {
    return "The database rejected that request.";
  }
  if (code === "42501") {
    return "This login can edit rows. It cannot change the database structure or logins.";
  }
  if (code === "23505") {
    return "That value is already used by another row.";
  }
  if (code === "23502") {
    return "A required field was left empty.";
  }
  if (code === "23503") {
    return "That change would break a link to another row.";
  }
  if (code === "42P01") {
    return "That table was not found.";
  }
  if (code === "42703") {
    return "That column was not found.";
  }
  if (code === "42601") {
    return "The database could not read that command.";
  }
  const trimmed = message.replace(/\s+/g, " ").trim();
  if (!trimmed) return "The database rejected that request.";
  return trimmed.length > 400 ? `${trimmed.slice(0, 400)}…` : trimmed;
}
