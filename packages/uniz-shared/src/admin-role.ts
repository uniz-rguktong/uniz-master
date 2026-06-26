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
