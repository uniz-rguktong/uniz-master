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

/**
 * Staff roles from UserRole / ADMIN_ROLES, excluding student and webadmin.
 * A demoted account whose username is one of these keeps that role.
 * `coe` is here because the July role flip stored webadmin on the coe login.
 */
export const STAFF_ROLE_USERNAMES = [
  "teacher",
  "faculty",
  "hod",
  "dean",
  "director",
  "coe",
  "ao",
  "swo",
  "warden_male",
  "warden_female",
  "caretaker_male",
  "caretaker_female",
  "security",
  "librarian",
  "dsw",
  "warden",
  "caretaker",
  "admin",
] as const;

export function normalizeRoleToken(value?: string | null): string {
  return String(value ?? "")
    .replace(/"/g, "")
    .trim()
    .toLowerCase();
}

/** The credential username is exactly webadmin, never the mailbox string. */
export function isCanonicalWebadminUsername(username?: string | null): boolean {
  return normalizeRoleToken(username) === "webadmin";
}

export function isCanonicalWebadminAccount(
  user?: { email?: string | null; username?: string | null } | null,
): boolean {
  if (!user) return false;
  const username = normalizeRoleToken(user.username);
  // A second credential named webadmin@rguktong.ac.in is not this account,
  // even when that string is also passed as the email.
  if (username === WEBADMIN_EMAIL) return false;
  if (username === "webadmin") return true;
  return normalizeAccountEmail(user.email) === WEBADMIN_EMAIL;
}

/**
 * Role to store when a non-canonical row currently says webadmin.
 * 1. Username is itself a staff role (coe, dean, ...).
 * 2. FacultyProfile role for the same username, when that role is staff.
 * 3. hod, for hod_<branch> / hod-<branch>.
 * 4. Designation, when it is a staff role.
 * 5. faculty.
 * The canonical username webadmin, or the canonical mailbox, stays webadmin.
 */
export function demoteStoredWebadminRole(input: {
  username?: string | null;
  email?: string | null;
  designation?: string | null;
  facultyProfileRole?: string | null;
}): string {
  const username = normalizeRoleToken(input.username);
  const email = normalizeAccountEmail(input.email);
  if (username === "webadmin" || email === WEBADMIN_EMAIL) return "webadmin";
  if ((STAFF_ROLE_USERNAMES as readonly string[]).includes(username)) {
    return username;
  }
  const facultyRole = normalizeRoleToken(input.facultyProfileRole);
  if (
    facultyRole &&
    (STAFF_ROLE_USERNAMES as readonly string[]).includes(facultyRole)
  ) {
    return facultyRole;
  }
  if (/^hod[_-]/.test(username)) return "hod";
  const designation = normalizeRoleToken(input.designation);
  if ((STAFF_ROLE_USERNAMES as readonly string[]).includes(designation)) {
    return designation;
  }
  return "faculty";
}

/** Academics Faculty.role is an uppercase label. The coe mailbox becomes COE. */
export function demoteAcademicsDisplayRole(input: {
  email?: string | null;
  designation?: string | null;
}): string {
  const email = normalizeAccountEmail(input.email);
  if (email === WEBADMIN_EMAIL) return "WEBADMIN";
  const local = email.split("@")[0] || "";
  // Only the full canonical mailbox stays WEBADMIN. A different domain whose
  // local part is webadmin is not that account.
  return demoteStoredWebadminRole({
    username: local === "webadmin" ? "" : local,
    designation: input.designation,
  }).toUpperCase();
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
  // The mailbox string is not a second webadmin username.
  if (normalizeRoleToken(user.username) === WEBADMIN_EMAIL) return false;
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
