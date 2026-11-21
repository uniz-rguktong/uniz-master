import { accessRole, isWebadmin, resolveEffectiveRole } from "@uniz/shared";

export const DIRECTORY_ROLES = ["webadmin", "dean", "director"] as const;

export const DIRECTORY_PERMISSIONS = [
  "manage_banners",
  "send_notifications",
  "assign_roles",
  "manage_users",
  "manage_curriculum",
  "view_reports",
] as const;

type RoleUser = {
  id?: string;
  role?: string;
  username?: string;
  email?: string | null;
};

export function canReadStaffBatches(user: RoleUser | undefined): boolean {
  if (!user) return false;
  return resolveEffectiveRole(user) !== "student";
}

export function isDirectoryWebadmin(user: RoleUser | undefined): boolean {
  return isWebadmin(user);
}

/** Role management page is linked for director-level admins. Reads stay with that set. */
export function canReadAdminDirectory(user: RoleUser | undefined): boolean {
  if (!user) return false;
  return isDirectoryRole(accessRole(user));
}

export function isDirectoryRole(role: string): boolean {
  return (DIRECTORY_ROLES as readonly string[]).includes(role);
}

/** Returns the cleaned list, or null when any entry is not a known permission. */
export function sanitizeDirectoryPermissions(input: unknown): string[] | null {
  if (!Array.isArray(input)) return null;
  const allowed = new Set<string>(DIRECTORY_PERMISSIONS);
  const next: string[] = [];
  for (const item of input) {
    if (typeof item !== "string" || !allowed.has(item) || next.includes(item)) {
      return null;
    }
    next.push(item);
  }
  return next;
}
