/**
 * Transitional alias for the webmaster -> webadmin role rename.
 *
 * During the staged rename, 'webadmin' and 'webmaster' denote the same
 * (highest) privilege. Backend authorization currently gates on 'webmaster',
 * so we converge 'webadmin' onto 'webmaster' here. Only the alias is touched;
 * every other role string passes through unchanged.
 *
 * Remove this shim in the final stage once 'webmaster' is fully retired.
 */
export function aliasWebadminRole(role?: string): string {
  const raw = String(role ?? "").replace(/"/g, "");
  return raw.toLowerCase() === "webadmin" ? "webmaster" : raw;
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

  // Transition shim: webadmin is equivalent to webmaster.
  if (role === "webadmin") role = "webmaster";

  if ((role === "faculty" || role === "teacher") && /^hod[_-]/.test(uname)) {
    role = "hod";
  }

  return role;
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
