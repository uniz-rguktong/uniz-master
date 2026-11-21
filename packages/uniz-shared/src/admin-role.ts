/**
 * Strip quote characters that some stored role strings still carry.
 * Authorization uses accessRole / isWebadmin, which also require the
 * canonical webadmin mailbox.
 */
export function aliasWebadminRole(role?: string): string {
  return String(role ?? "")
    .replace(/"/g, "")
    .trim();
}

/** The only account allowed to hold the webadmin role. */
export const WEBADMIN_EMAIL = "webadmin@rguktong.ac.in";

export const WEBADMIN_ASSIGNMENT_MESSAGE =
  "The webadmin role can only be assigned to webadmin@rguktong.ac.in";

export function normalizeAccountEmail(value?: string | null): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

/** Institutional mailbox. Login addresses mail as username@rguktong.ac.in. */
export function institutionalEmail(username?: string | null): string {
  const name = String(username ?? "")
    .replace(/"/g, "")
    .trim()
    .toLowerCase();
  if (!name) return "";
  if (name.includes("@")) return name;
  return `${name}@rguktong.ac.in`;
}

/**
 * Explicit email wins. When a token has no email claim, use the institutional
 * address so the existing webadmin login still matches.
 */
export function resolveAccountEmail(
  user?: { email?: string | null; username?: string | null } | null,
): string {
  const explicit = normalizeAccountEmail(user?.email);
  if (explicit) return explicit;
  return institutionalEmail(user?.username);
}

export function isCanonicalWebadminAccount(
  user?: { email?: string | null; username?: string | null } | null,
): boolean {
  if (!user) return false;
  if (institutionalEmail(user.username) === WEBADMIN_EMAIL) return true;
  return resolveAccountEmail(user) === WEBADMIN_EMAIL;
}

/** Normalize portal/API role; infer HOD from usernames like hod_cse. */
export function resolveEffectiveRole(user: {
  role?: string;
  username?: string;
}): string {
  const raw = String(user.role || "student").replace(/"/g, "");
  let role = raw.toLowerCase();
  const uname = String(user.username || "")
    .replace(/"/g, "")
    .toLowerCase();

  if ((role === "faculty" || role === "teacher") && /^hod[_-]/.test(uname)) {
    role = "hod";
  }

  return role;
}

/**
 * True only when the role is webadmin and the account mailbox is
 * webadmin@rguktong.ac.in (trimmed, case-insensitive). Any other account
 * that still carries the role is not webadmin.
 */
export function isWebadmin(
  user?: {
    role?: string;
    username?: string;
    email?: string | null;
  } | null,
): boolean {
  if (!user) return false;
  if (resolveEffectiveRole(user) !== "webadmin") return false;
  return resolveAccountEmail(user) === WEBADMIN_EMAIL;
}

/**
 * Role stamped onto a request. The internal service identity is unchanged.
 * A webadmin role on any other account is faculty, the least-privileged
 * staff role, so webadmin-only and mixed allow-lists both miss.
 */
export function accessRole(
  user?: {
    id?: string;
    role?: string;
    username?: string;
    email?: string | null;
  } | null,
): string {
  if (!user) return "";
  if (user.id === "internal") return resolveEffectiveRole(user);
  const role = resolveEffectiveRole(user);
  if (role === "webadmin" && !isWebadmin(user)) return "faculty";
  return role;
}

/** Null when the role may be stored. A message when webadmin is refused. */
export function webadminAssignmentRejection(
  target: { username?: string | null; email?: string | null },
  role?: string | null,
): string | null {
  const requested = String(role ?? "")
    .replace(/"/g, "")
    .trim()
    .toLowerCase();
  if (requested !== "webadmin") return null;
  if (isCanonicalWebadminAccount(target)) return null;
  return WEBADMIN_ASSIGNMENT_MESSAGE;
}

export function isHodUser(user: { role?: string; username?: string }): boolean {
  return resolveEffectiveRole(user) === "hod";
}

/** Branch code for HOD accounts (hod_cse → CSE). */
export function resolveHodBranch(user: {
  username?: string;
  department?: string;
}): string {
  const fromJwt = String(user.department || "")
    .trim()
    .toUpperCase();
  if (fromJwt && fromJwt !== "GENERAL") return fromJwt;

  const uname = String(user.username || "")
    .replace(/"/g, "")
    .toLowerCase();

  return String(uname.split(/[_-]/)[1] || "")
    .trim()
    .toUpperCase();
}
