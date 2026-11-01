import { parseJwt } from "./security";

export const PASSWORD_CHANGE_PATH = "/student/resetpassword";

export function tokenMustChangePassword(
  token: string | null | undefined,
): boolean {
  if (!token) return false;
  const cleaned = token.replace(/^"|"$/g, "");
  return parseJwt(cleaned)?.mustChangePassword === true;
}

export function sessionMustChangePassword(): boolean {
  if (typeof localStorage === "undefined") return false;
  return (
    tokenMustChangePassword(localStorage.getItem("student_token")) ||
    tokenMustChangePassword(localStorage.getItem("admin_token")) ||
    tokenMustChangePassword(localStorage.getItem("faculty_token"))
  );
}

export function redirectToPasswordChange(): void {
  if (window.location.pathname === PASSWORD_CHANGE_PATH) return;
  window.location.assign(PASSWORD_CHANGE_PATH);
}
