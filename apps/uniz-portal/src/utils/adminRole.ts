import { type DecodedToken } from "./security";

/** Normalize admin portal role from JWT / storage; infer HOD from usernames like hod_cse. */
export function resolveAdminPortalRole(
  decoded: DecodedToken | null,
  usernameFallback = "",
): string {
  const raw = (
    decoded?.role ||
    localStorage.getItem("admin_role") ||
    "admin"
  ).replace(/"/g, "");
  let role = raw.toLowerCase();
  const uname = (
    decoded?.username ||
    usernameFallback ||
    localStorage.getItem("username") ||
    ""
  )
    .replace(/"/g, "")
    .toLowerCase();

  // Only webadmin@rguktong.ac.in keeps the webadmin shell. Any other account
  // whose stored role still says webadmin is shown as faculty.
  if (role === "webadmin") {
    const email = String(decoded?.email || "")
      .trim()
      .toLowerCase();
    const identity =
      email ||
      (uname.includes("@") ? uname : uname ? `${uname}@rguktong.ac.in` : "");
    if (identity !== "webadmin@rguktong.ac.in") role = "faculty";
  }

  if ((role === "faculty" || role === "teacher") && /^hod[_-]/.test(uname)) {
    role = "hod";
  }

  const stored = (localStorage.getItem("admin_role") || "")
    .replace(/"/g, "")
    .toLowerCase();
  if (role !== stored) {
    localStorage.setItem("admin_role", role);
  }

  return role;
}

/** HOD department from JWT, storage, or username pattern (e.g. hod_cse → CSE). */
export function resolveHodDepartment(
  decoded: DecodedToken | null,
  usernameFallback = "",
): string {
  const fromJwt = (decoded?.department || "")
    .replace(/"/g, "")
    .trim()
    .toUpperCase();
  if (fromJwt && fromJwt !== "GENERAL") return fromJwt;

  const fromStorage = (localStorage.getItem("department") || "")
    .replace(/"/g, "")
    .trim()
    .toUpperCase();
  if (fromStorage && fromStorage !== "GENERAL") return fromStorage;

  const uname = (
    decoded?.username ||
    usernameFallback ||
    localStorage.getItem("username") ||
    ""
  )
    .replace(/"/g, "")
    .toLowerCase();

  const part = uname.split(/[_-]/)[1];
  return part ? part.toUpperCase() : "CSE";
}

/** Branch code for HOD accounts (e.g. hod_cse → CSE). */
export function resolveHodBranch(
  decoded: DecodedToken | null,
  usernameFallback = "",
): string {
  return resolveHodDepartment(decoded, usernameFallback);
}
