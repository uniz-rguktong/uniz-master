/** Roles that may list every registration. Matches registration tracking. */
const REGISTRATION_LIST_ROLES = new Set([
  "webadmin",
  "coe",
  "dean",
  "director",
  "hod",
]);

export function canListRegistrations(role: string): boolean {
  return REGISTRATION_LIST_ROLES.has(String(role || "").toLowerCase());
}
