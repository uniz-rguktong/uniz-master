// 1. Define Roles as Constants to Avoid Typo Bugs
export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  BRANCH_ADMIN: "BRANCH_ADMIN",
  SPORTS_ADMIN: "SPORTS_ADMIN",
  BRANCH_SPORTS_ADMIN: "BRANCH_SPORTS_ADMIN",
  HHO: "HHO",
  CLUB_COORDINATOR: "CLUB_COORDINATOR",
  EVENT_COORDINATOR: "EVENT_COORDINATOR",
} as const;

// 2. Define Permission Actions
export type PermissionAction =
  | "create:event"
  | "update:event"
  | "delete:event"
  | "create:sport"
  | "update:sport"
  | "delete:sport"
  | "manage:sport_registrations"
  | "manage:fixtures"
  | "view:fixtures"
  | "view:analytics"
  | "manage:users";

// 3. User Interface (Shared across app) - Minimal
export interface User {
  id: string;
  role: string;
  branch?: string | null;
  clubId?: string | null;
}

/**
 * Checks if a user has a specific permission.
 * Centralizes the logic so we don't repeat "if role === X || role === Y" everywhere.
 */
export function hasPermission(
  user: User,
  action: PermissionAction,
  resource?: any,
): boolean {
  if (!user || !user.role) return false;

  const { role } = user;
  const isMainSportsAdmin = role === ROLES.SPORTS_ADMIN;
  const isBranchSportsAdmin = role === ROLES.BRANCH_SPORTS_ADMIN;

  // Super Admin can do everything
  if (role === ROLES.SUPER_ADMIN) return true;

  switch (action) {
    case "create:event":
      // All admins except Event Coordinator (usually) can create events
      return (
        (
          [ROLES.BRANCH_ADMIN, ROLES.HHO, ROLES.CLUB_COORDINATOR] as string[]
        ).includes(role) || isMainSportsAdmin
      );

    case "update:event":
    case "delete:event":
      // Resource-based authorization
      if (!resource) return false;

      // Creator always has access
      if (resource.creatorId === user.id) return true;

      // HHO Admin can edit/delete HHO events
      if (role === ROLES.HHO && resource.category === "HHO") return true;

      // Main Sports Admin can edit/delete all Sports events
      if (isMainSportsAdmin && resource.category === "Sports") return true;

      // Branch Admin can edit/delete events from their branch
      if (
        role === ROLES.BRANCH_ADMIN &&
        resource.creator?.branch === user.branch
      )
        return true;

      // Club Coordinator can edit/delete events from their club
      if (
        role === ROLES.CLUB_COORDINATOR &&
        resource.creator?.clubId === user.clubId
      )
        return true;

      return false;

    case "create:sport":
      return isMainSportsAdmin;

    case "update:sport":
    case "delete:sport":
      if (!resource) return false;

      if (resource.creatorId === user.id) return true;

      if (isMainSportsAdmin) return true;

      return false;

    case "manage:sport_registrations":
      return (
        ([ROLES.BRANCH_ADMIN] as string[]).includes(role) ||
        isMainSportsAdmin ||
        isBranchSportsAdmin
      );

    case "manage:fixtures":
      return isMainSportsAdmin;

    case "view:fixtures":
      return isMainSportsAdmin || isBranchSportsAdmin;

    default:
      return false;
  }
}

/**
 * Asserts permission, throwing an error if failed.
 * Useful for Server Actions to fail fast.
 */
export function assertPermission(
  user: User,
  action: PermissionAction,
  resource?: any,
) {
  if (!hasPermission(user, action, resource)) {
    throw new Error(
      `Unauthorized: You do not have permission to perform '${action}'.`,
    );
  }
}
