export const MUST_CHANGE_PASSWORD_KEY = "uniz_must_change_password";

export function mustChangePassword(): boolean {
  try {
    return localStorage.getItem(MUST_CHANGE_PASSWORD_KEY) === "1";
  } catch {
    return false;
  }
}

export function setMustChangePassword(required: boolean) {
  if (required) localStorage.setItem(MUST_CHANGE_PASSWORD_KEY, "1");
  else localStorage.removeItem(MUST_CHANGE_PASSWORD_KEY);
}

/** True when a portal session token is already stored. */
export function hasPortalSession(): boolean {
  try {
    return Boolean(
      localStorage.getItem("student_token") ||
        localStorage.getItem("admin_token") ||
        localStorage.getItem("faculty_token"),
    );
  } catch {
    return false;
  }
}
