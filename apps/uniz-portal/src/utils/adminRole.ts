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

  if ((role === "faculty" || role === "teacher") && /^hod[_-]/.test(uname)) {
    role = "hod";
  }

  const stored = (localStorage.getItem("admin_role") || "").replace(/"/g, "").toLowerCase();
  if (role !== stored) {
    localStorage.setItem("admin_role", role);
  }

  return role;
}
