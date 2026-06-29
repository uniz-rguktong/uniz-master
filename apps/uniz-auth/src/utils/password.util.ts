import bcrypt from "bcryptjs";

const DEFAULT_CAMPUS_PASSWORD_SUFFIX = "@rguktong";

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

/** Canonical default: lowercase `{id}@rguktong` (matches college email style). */
export function defaultCampusPassword(username: string): string {
  return `${username.trim().toLowerCase()}${DEFAULT_CAMPUS_PASSWORD_SUFFIX}`;
}

/** Compare login password; for default campus passwords accept lower/upper ID case. */
export function campusDefaultPasswordCandidates(
  password: string,
  username: string,
): string[] {
  const trimmed = password.trim();
  const candidates = new Set<string>([trimmed]);
  if (!trimmed.toLowerCase().endsWith(DEFAULT_CAMPUS_PASSWORD_SUFFIX)) {
    return [...candidates];
  }
  const idPart = trimmed.slice(0, -DEFAULT_CAMPUS_PASSWORD_SUFFIX.length);
  if (/^[a-z]\d+$/i.test(idPart)) {
    const lower = `${username.toLowerCase()}${DEFAULT_CAMPUS_PASSWORD_SUFFIX}`;
    const upper = `${username.toUpperCase()}${DEFAULT_CAMPUS_PASSWORD_SUFFIX}`;
    candidates.add(lower);
    candidates.add(upper);
    candidates.add(`${idPart.toLowerCase()}${DEFAULT_CAMPUS_PASSWORD_SUFFIX}`);
    candidates.add(`${idPart.toUpperCase()}${DEFAULT_CAMPUS_PASSWORD_SUFFIX}`);
  }
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
