import { Response } from "express";
import axios from "axios";
import { randomBytes, randomUUID } from "crypto";
import { prisma } from "../utils/prisma";
import { redis } from "../utils/redis.util";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { ErrorCode } from "../shared/error-codes";
import { resolveEffectiveRole, webadminAssignmentRejection } from "@uniz/shared";
import {
  DIRECTORY_ROLES,
  canReadAdminDirectory,
  isDirectoryRole,
  isDirectoryWebadmin,
  sanitizeDirectoryPermissions,
} from "../utils/staff-access";

const AUTH_SERVICE_URL = (
  process.env.AUTH_SERVICE_URL ||
  `${(process.env.GATEWAY_URL || "http://localhost:3000/api/v1").replace(/\/$/, "")}/auth`
).replace(/\/$/, "");

const PERMISSIONS_KEY = "admin:role-permissions";

const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  webadmin: [
    "manage_banners",
    "send_notifications",
    "assign_roles",
    "manage_users",
    "manage_curriculum",
    "view_reports",
  ],
  dean: [
    "manage_banners",
    "send_notifications",
    "manage_curriculum",
    "view_reports",
  ],
  director: ["view_reports", "manage_curriculum", "manage_users"],
};

function deny(res: Response) {
  return res
    .status(403)
    .json({ success: false, code: ErrorCode.AUTH_FORBIDDEN, msg: "Access denied" });
}

function requireUser(
  req: AuthenticatedRequest,
  res: Response,
  allowed: (user: NonNullable<AuthenticatedRequest["user"]>) => boolean,
): boolean {
  if (!req.user) {
    res.status(401).json({ success: false, msg: "Unauthorized" });
    return false;
  }
  if (!allowed(req.user)) {
    deny(res);
    return false;
  }
  return true;
}

function requireWebadmin(req: AuthenticatedRequest, res: Response): boolean {
  return requireUser(req, res, isDirectoryWebadmin);
}

function requireDirectoryReader(req: AuthenticatedRequest, res: Response): boolean {
  return requireUser(req, res, canReadAdminDirectory);
}

async function readPermissions(): Promise<Record<string, string[]>> {
  try {
    const raw = await redis.get(PERMISSIONS_KEY);
    if (!raw) return { ...DEFAULT_PERMISSIONS };
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const next: Record<string, string[]> = { ...DEFAULT_PERMISSIONS };
    for (const role of DIRECTORY_ROLES) {
      const cleaned = sanitizeDirectoryPermissions(parsed[role]);
      if (cleaned) next[role] = cleaned;
    }
    return next;
  } catch (e) {
    console.error("[admin-directory] Failed to read role permissions:", e);
    return { ...DEFAULT_PERMISSIONS };
  }
}

async function listDirectory(query: string) {
  const roleFilter = {
    OR: DIRECTORY_ROLES.map((role) => ({
      role: { equals: role, mode: "insensitive" as const },
    })),
  };
  const nameFilter = query
    ? { username: { contains: query, mode: "insensitive" as const } }
    : {};
  const where = { AND: [roleFilter, nameFilter] };

  const [admins, faculty] = await Promise.all([
    prisma.adminProfile.findMany({ where, orderBy: { username: "asc" } }),
    prisma.facultyProfile.findMany({ where, orderBy: { username: "asc" } }),
  ]);

  const seen = new Set<string>();
  const rows: { id: string; Username: string; role: string }[] = [];
  for (const row of [...admins, ...faculty]) {
    const key = row.username.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
      id: row.id,
      Username: row.username,
      role: resolveEffectiveRole({ role: row.role, username: row.username }),
    });
  }
  return rows;
}

async function syncAuthRole(username: string, role: string, password: string) {
  const secret = (process.env.INTERNAL_SECRET || "uniz-core").trim();
  await axios.post(
    `${AUTH_SERVICE_URL}/signup`,
    {
      username,
      password,
      role,
      email: `${username}@rguktong.ac.in`,
    },
    { headers: { "x-internal-secret": secret }, timeout: 8000 },
  );
}

export const getAdminRoles = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  if (!requireDirectoryReader(req, res)) return;
  const roles = await readPermissions();
  return res.json({ success: true, roles });
};

export const updateAdminRolePermissions = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  if (!requireWebadmin(req, res)) return;
  const role = String(req.params.role || "").toLowerCase();
  if (!isDirectoryRole(role)) {
    return res.status(400).json({ success: false, msg: "Unknown role" });
  }
  const permissions = sanitizeDirectoryPermissions(req.body?.permissions);
  if (!permissions) {
    return res.status(400).json({ success: false, msg: "Invalid permissions" });
  }
  try {
    const current = await readPermissions();
    current[role] = permissions;
    await redis.set(PERMISSIONS_KEY, JSON.stringify(current));
    return res.json({ success: true, msg: "Permissions updated" });
  } catch (e) {
    console.error("[admin-directory] Failed to save role permissions:", e);
    return res.status(500).json({ success: false, msg: "Could not save permissions" });
  }
};

export const getAdmins = async (req: AuthenticatedRequest, res: Response) => {
  if (!requireDirectoryReader(req, res)) return;
  try {
    const admins = await listDirectory("");
    return res.json({ success: true, admins });
  } catch (e) {
    console.error("[admin-directory] Failed to list admins:", e);
    return res.status(500).json({ success: false, msg: "Failed to list admins" });
  }
};

export const searchAdmins = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  if (!requireDirectoryReader(req, res)) return;
  try {
    const admins = await listDirectory(String(req.query.q || ""));
    return res.json({ success: true, admins });
  } catch (e) {
    console.error("[admin-directory] Failed to search admins:", e);
    return res.status(500).json({ success: false, msg: "Failed to search admins" });
  }
};

export const addAdmin = async (req: AuthenticatedRequest, res: Response) => {
  if (!requireWebadmin(req, res)) return;
  const username = String(req.body?.username || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const role = String(req.body?.role || "").toLowerCase();
  if (
    !/^[a-z0-9._-]{3,64}$/.test(username) ||
    password.length < 6 ||
    !isDirectoryRole(role)
  ) {
    return res.status(400).json({
      success: false,
      msg: "Username, a password of at least 6 characters, and a role are required",
    });
  }

  const email = `${username}@rguktong.ac.in`;
  const assignmentError = webadminAssignmentRejection({ username, email }, role);
  if (assignmentError) {
    return res.status(403).json({ success: false, msg: assignmentError });
  }
  let createdId: string | null = null;
  try {
    const existing = await prisma.adminProfile.findFirst({
      where: { username: { equals: username, mode: "insensitive" } },
    });
    if (existing) {
      return res.status(409).json({ success: false, msg: "Admin already exists" });
    }
    const profile = await prisma.adminProfile.create({
      data: {
        id: randomUUID(),
        username,
        name: username,
        email,
        role,
      },
    });
    createdId = profile.id;
    await syncAuthRole(username, role, password);
    return res.status(201).json({ success: true, msg: "Admin added" });
  } catch (e: any) {
    if (createdId) {
      await prisma.adminProfile.delete({ where: { id: createdId } }).catch(() => {});
    }
    if (e?.code === "P2002") {
      return res.status(409).json({ success: false, msg: "Admin already exists" });
    }
    console.error(`[admin-directory] Failed to add admin ${username}:`, e?.message || e);
    return res.status(500).json({ success: false, msg: "Could not add admin" });
  }
};

export const deleteAdmin = async (req: AuthenticatedRequest, res: Response) => {
  if (!requireWebadmin(req, res)) return;
  const username = String(req.params.username || "").trim();
  if (!username) {
    return res.status(400).json({ success: false, msg: "Username required" });
  }
  if (username.toLowerCase() === String(req.user?.username || "").toLowerCase()) {
    return res.status(400).json({ success: false, msg: "You cannot remove your own account" });
  }

  try {
    const admin = await prisma.adminProfile.findFirst({
      where: { username: { equals: username, mode: "insensitive" } },
    });
    const faculty = admin
      ? null
      : await prisma.facultyProfile.findFirst({
          where: { username: { equals: username, mode: "insensitive" } },
        });
    if (!admin && !faculty) {
      return res.status(404).json({ success: false, msg: "Admin not found" });
    }
    const target = (admin || faculty)!;
    // This page manages directory roles only; faculty, HOD and other staff
    // accounts are removed from their own screens.
    if (
      !isDirectoryRole(
        resolveEffectiveRole({ role: target.role, username: target.username }),
      )
    ) {
      return res
        .status(403)
        .json({ success: false, msg: "Only directory roles can be removed here" });
    }

    const secret = (process.env.INTERNAL_SECRET || "uniz-core").trim();
    const canonical = target.username;
    await axios.delete(
      `${AUTH_SERVICE_URL}/internal/user/${encodeURIComponent(canonical)}`,
      { headers: { "x-internal-secret": secret }, timeout: 8000 },
    );
    if (admin) {
      await prisma.adminProfile.delete({ where: { id: admin.id } });
    } else if (faculty) {
      await prisma.facultyProfile.delete({ where: { id: faculty.id } });
    }
    return res.json({ success: true, msg: "Admin removed" });
  } catch (e: any) {
    console.error(`[admin-directory] Failed to delete admin ${username}:`, e?.message || e);
    return res.status(500).json({ success: false, msg: "Could not remove admin" });
  }
};

export const assignAdminRole = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  if (!requireWebadmin(req, res)) return;
  const username = String(req.body?.username || "").trim();
  const role = String(req.body?.role || "").toLowerCase();
  if (!username || !isDirectoryRole(role)) {
    return res.status(400).json({ success: false, msg: "Username and role are required" });
  }

  try {
    const admin = await prisma.adminProfile.findFirst({
      where: { username: { equals: username, mode: "insensitive" } },
    });
    const faculty = admin
      ? null
      : await prisma.facultyProfile.findFirst({
          where: { username: { equals: username, mode: "insensitive" } },
        });
    if (!admin && !faculty) {
      return res.status(404).json({ success: false, msg: "Admin not found" });
    }
    const target = (admin || faculty)!;
    const assignmentError = webadminAssignmentRejection(
      { username: target.username, email: target.email },
      role,
    );
    if (assignmentError) {
      return res.status(403).json({ success: false, msg: assignmentError });
    }
    const canonical = target.username;
    if (admin) {
      await prisma.adminProfile.update({ where: { id: admin.id }, data: { role } });
    } else if (faculty) {
      await prisma.facultyProfile.update({
        where: { id: faculty.id },
        data: { role },
      });
    }
    // Existing auth users keep their password; signup only applies this when creating.
    await syncAuthRole(canonical, role, randomBytes(24).toString("base64url"));
    return res.json({ success: true, msg: "Role updated" });
  } catch (e: any) {
    console.error(`[admin-directory] Failed to assign role for ${username}:`, e?.message || e);
    return res.status(500).json({ success: false, msg: "Could not update role" });
  }
};
