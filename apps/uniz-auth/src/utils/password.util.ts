import bcrypt from "bcryptjs";

const DEFAULT_CAMPUS_PASSWORD_SUFFIX = "@rguktong";
const CAMPUS_DEFAULT_PASSWORD_RE = /^[a-z]\d+@rguktong$/i;

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/** True only for the issued default format: letter + digits + @rguktong */
export function isCampusDefaultPassword(password: string): boolean {
  return CAMPUS_DEFAULT_PASSWORD_RE.test(password.trim());
}

/** Canonical default for new accounts: lowercase `{id}@rguktong` */
export function defaultCampusPassword(username: string): string {
  return `${username.trim().toLowerCase()}${DEFAULT_CAMPUS_PASSWORD_SUFFIX}`;
}

/**
 * Login compare only. Custom passwords (after student reset) are checked as-is.
 * Default campus passwords accept upper/lower ID letter case for legacy hashes.
 */
export function campusDefaultPasswordCandidates(
  password: string,
  username: string,
): string[] {
  const trimmed = password.trim();
  if (!isCampusDefaultPassword(trimmed)) {
    return [trimmed];
  }

  const idPart = trimmed.slice(0, -DEFAULT_CAMPUS_PASSWORD_SUFFIX.length);
  const candidates = new Set<string>([
    trimmed,
    `${idPart.toLowerCase()}${DEFAULT_CAMPUS_PASSWORD_SUFFIX}`,
    `${idPart.toUpperCase()}${DEFAULT_CAMPUS_PASSWORD_SUFFIX}`,
    `${username.toLowerCase()}${DEFAULT_CAMPUS_PASSWORD_SUFFIX}`,
    `${username.toUpperCase()}${DEFAULT_CAMPUS_PASSWORD_SUFFIX}`,
  ]);
  return [...candidates];
}

export async function comparePasswordForUser(
  password: string,
  hash: string,
  username: string,
): Promise<boolean> {
  for (const candidate of campusDefaultPasswordCandidates(password, username)) {
    if (await comparePassword(candidate, hash)) return true;
  }
  return false;
}
