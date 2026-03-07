"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { unstable_cache } from "next/cache";
import { executeAction } from "@/lib/api-utils";
import { withPrismaPoolRetry } from "@/lib/prismaPoolRetry";

// --- Types ---

export interface FormattedCoordinator {
  id: string;
  name: string;
  email: string;
  phone: string;
  assignedEvent: string;
  status: string;
}

export interface FormattedSystemUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastActive: string;
  initial: string;
  color: string;
}

export interface FormattedAuditLog {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  ip: string;
}

const getCachedSystemUsers = unstable_cache(
  async () => {
    const admins = await withPrismaPoolRetry(
      () =>
        prisma.admin.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
      { label: "getCachedSystemUsers:admin-findMany" },
    );

    return admins.map((admin) => ({
      id: admin.id,
      name: admin.name || "Admin",
      email: admin.email,
      role:
        admin.role === "SUPER_ADMIN"
          ? "Super Admin"
          : admin.role === "EVENT_COORDINATOR"
            ? "Event Coordinator"
            : "Administrative Entity",
      status: "active",
      lastActive: "Recent",
      initial: admin.name
        ? admin.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : "A",
      color: "bg-indigo-500", // Default color
    }));
  },
  ["user-system-users"],
  { tags: ["users", "admins"], revalidate: 60 },
);

const getCachedAuditLogs = unstable_cache(
  async () => {
    const logs = await withPrismaPoolRetry(
      () =>
        prisma.auditLog.findMany({
          orderBy: { timestamp: "desc" },
          take: 50,
          select: {
            id: true,
            performedBy: true,
            action: true,
            entityType: true,
            timestamp: true,
            ipAddress: true,
          },
        }),
      { label: "getCachedAuditLogs:auditLog-findMany" },
    );

    return logs.map((log) => ({
      id: log.id,
      user: log.performedBy || "System",
      action: log.action,
      target: log.entityType,
      timestamp: log.timestamp.toISOString(),
      ip: log.ipAddress || "127.0.0.1",
    }));
  },
  ["audit-logs"],
  { tags: ["logs"], revalidate: 30 },
);

export async function getCoordinators(): Promise<{
  success?: boolean;
  data?: FormattedCoordinator[];
  error?: string;
}> {
  return executeAction(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const { id: adminId, role } = session.user as { id: string; role: string };

    const selectFields = {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      coordinatorToken: true,
      assignedEvents: { select: { title: true }, take: 5 },
    } as const;

    type Row = Awaited<
      ReturnType<typeof prisma.admin.findMany<{ select: typeof selectFields }>>
    >[number];

    const format = (rows: Row[]): FormattedCoordinator[] =>
      rows.map((c) => {
        const assigned = [...c.assignedEvents.map((e) => e.title)];
        return {
          id: c.id,
          name: c.name || "Unnamed Coordinator",
          email: c.email,
          phone: c.phone || "N/A",
          assignedEvent:
            assigned.length > 0 ? assigned.join(", ") : "Unassigned",
          status: c.coordinatorToken ? "Pending" : "Active",
        };
      });

    const coordinatorRoles = ["EVENT_COORDINATOR"] as const;

    // SUPER_ADMIN: all coordinators
    if (role === "SUPER_ADMIN") {
      const rows = await withPrismaPoolRetry(
        () =>
          prisma.admin.findMany({
            where: { role: { in: [...coordinatorRoles] } },
            orderBy: { createdAt: "desc" },
            select: selectFields,
          }),
        { label: "getCoordinators:super-admin-findMany" },
      );
      return { success: true, data: format(rows) };
    }

    // Other admins: coordinators linked to their events + any unlinked coordinators (legacy)
    // Single efficient query using OR
    const rows = await withPrismaPoolRetry(
      () =>
        prisma.admin.findMany({
          where: {
            role: { in: [...coordinatorRoles] },
            OR: [
              { assignedEvents: { some: { creatorId: adminId } } },
              // Fallback: include unlinked coordinators so legacy data still shows
              {
                assignedEvents: { none: {} },
              },
            ],
          },
          orderBy: { createdAt: "desc" },
          select: selectFields,
        }),
      { label: "getCoordinators:scoped-findMany" },
    );

    return { success: true, data: format(rows) };
  }, "getCoordinators") as any;
}

export async function getSystemUsers(): Promise<{
  success?: boolean;
  data?: FormattedSystemUser[];
  error?: string;
}> {
  return executeAction(async () => {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    const formattedUsers = await getCachedSystemUsers();

    return { success: true, data: formattedUsers };
  }, "getSystemUsers") as any;
}

export async function getAuditLogs(): Promise<{
  success?: boolean;
  data?: FormattedAuditLog[];
  error?: string;
}> {
  return executeAction(async () => {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    const formattedLogs = await getCachedAuditLogs();

    return { success: true, data: formattedLogs };
  }, "getAuditLogs") as any;
}
