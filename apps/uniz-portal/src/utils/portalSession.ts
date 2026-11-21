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
