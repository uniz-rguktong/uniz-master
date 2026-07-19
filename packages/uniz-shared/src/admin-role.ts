/**
 * Backward-compat alias for the webmaster -> webadmin role rename.
 *
 * 'webadmin' is now the canonical highest-privilege role; authorization gates on
 * it everywhere. This shim maps any lingering legacy 'webmaster' token (issued
 * before the DB flip, valid up to its 7-day expiry) onto 'webadmin'. Only the
 * alias is touched; every other role string passes through unchanged.
 *
 * Remove this shim once all pre-flip 'webmaster' JWTs have expired.
 */
export function aliasWebadminRole(role?: string): string {
  const raw = String(role ?? "").replace(/"/g, "");
  return raw.toLowerCase() === "webmaster" ? "webadmin" : raw;
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

  // Backward-compat shim: legacy 'webmaster' tokens map onto the canonical
  // 'webadmin'. Remove once all pre-flip webmaster JWTs have expired.
  if (role === "webmaster") role = "webadmin";

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
