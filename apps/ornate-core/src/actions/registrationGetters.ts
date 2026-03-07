"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma, RegistrationStatus, TeamRole } from "@/lib/generated/client";
import { unstable_cache } from "next/cache";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import type { AuthUser } from "@/lib/auth-helpers";
import { executeAction } from "@/lib/api-utils";

// --- Helper Functions ---

function buildRegistrationScope(
  role: string,
  userId: string,
  clubId: string | null,
  branch: string | null,
): Prisma.EventWhereInput {
  if (role === "SUPER_ADMIN") return {};
  if (role === "HHO") return { creator: { role: "HHO" } };
  if (role === "SPORTS_ADMIN" || role === "BRANCH_SPORTS_ADMIN")
    return { creator: { role: "SPORTS_ADMIN" } };
  if (role === "CLUB_COORDINATOR" && clubId) return { creator: { clubId } };
  if (branch) {
    return {
      OR: [{ creatorId: userId }, { creator: { branch } }],
    };
  }
  return {};
}

// --- Types ---

export interface FormattedRegistration {
  id: string;
  registrationId: string;
  studentName: string;
  email: string;
  rollNumber: string;
  year: string;
  department: string;
  phone: string;
  eventName: string;
  eventType: string;
  registrationDate: string;
  confirmationDate?: string;
  lastUpdate?: string;
  status: string;
  attendanceMarked?: boolean;
  certificateIssued?: boolean;
  eventId: string;
  registrationDeadline?: string | undefined;
  type?: string;
  paymentAmount?: number | null;
  transactionId?: string | null;
  paymentScreenshot?: string | null;
  missingRequirements?: string[];
  notes?: string;
  waitlistPosition?: number;
  totalWaitlist?: number;
  seatsAvailable?: number;
  maxCapacity?: number;
  paymentStatus?: string;
  priority?: string;
  requirementsMet?: boolean;
}

export interface WaitingListRegistration {
  id: string;
  eventName: string;
  category: string | null;
  date: string;
  venue: string;
  registrations: number;
  capacity: number | null;
  waitlistPosition: number;
  registrationDate: string;
}

export interface TeamMember {
  id: string;
  name: string;
  studentId: string;
  year: string;
  section: string;
  role: string;
  phoneNumber: string;
}

export interface FormattedTeam {
  id: string;
  teamName: string;
  sport: string;
  sportColor: string;
  captain: string;
  viceCaptain: string;
  yearLevel: string;
  status: string;
  members: TeamMember[];
  eventId: string;
  eventType: string;
  captainRoll?: string;
  captainYear?: string;
  captainBranch?: string;
  captainSection?: string;
}

export interface ImportHistoryItem {
  id: string;
  filename: string;
  importDate: string;
  records: number;
  successful: number;
  failed: number;
  status: string;
}

export interface ExportHistoryItem {
  id: string;
  name: string;
  createdAt: Date;
  size: string;
  url: string;
}

export interface EventAttendee {
  id: string;
  name: string;
  roll: string;
  department: string;
  status: string;
}

// --- Cached Query Functions ---

// Core registration query function (DRY principle)
type RegistrationFilter = {
  status: string | string[];
  orderBy?: "asc" | "desc";
  includeCount?: boolean;
};

async function fetchRegistrationsCore(
  userId: string,
  role: string,
  clubId: string | null,
  branch: string | null,
  filter: RegistrationFilter,
) {
  const whereClause: Prisma.RegistrationWhereInput = {
    status:
      typeof filter.status === "string"
        ? (filter.status as RegistrationStatus)
        : { in: filter.status as RegistrationStatus[] },
    team: null,
  };

  // Add scope based on role
  const eventScope = buildRegistrationScope(role, userId, clubId, branch);
  if (Object.keys(eventScope).length > 0) {
    whereClause.event = eventScope;
  }

  return await prisma.registration.findMany({
    where: whereClause,
    include: {
      event: {
        select: {
          title: true,
          category: true,
          date: true,
          maxCapacity: true,
          creator: {
            select: {
              branch: true,
            },
          },
          _count: {
            select: {
              registrations: {
                where: {
                  status: { in: ["CONFIRMED", "ATTENDED"] },
                },
              },
            },
          },
        },
      },
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
          branch: true,
          currentYear: true,
        },
      },
    },
    orderBy: {
      createdAt: filter.orderBy || "desc",
    },
  });
}

interface RegistrationWithRelations {
  id: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  eventId: string;
  paymentStatus: string | null;
  amount: number;
  transactionId: string | null;
  studentName: string | null;
  studentId: string | null;
  email: string | null;
  phone: string | null;
  branch: string | null;
  year: string | null;
  screenshotUrl: string | null;
  event?: {
    title: string;
    category: string | null;
    date: Date;
    maxCapacity: number | null;
    _count?: { registrations: number };
  } | null;
  user?: {
    name: string | null;
    email: string | null;
    phone: string | null;
    branch: string | null;
    currentYear: string | null;
  } | null;
}

// Formatters for different registration types
function formatConfirmedRegistration(
  reg: RegistrationWithRelations,
): FormattedRegistration {
  return {
    id: reg.id,
    registrationId: reg.id.substring(0, 8).toUpperCase(),
    studentName: reg.studentName || reg.user?.name || "Unknown",
    email: reg.email || reg.user?.email || "N/A",
    rollNumber: reg.studentId || "N/A",
    year: reg.year || reg.user?.currentYear || "N/A",
    department: reg.branch || reg.user?.branch || "N/A",
    phone: reg.phone || reg.user?.phone || "N/A",
    eventName: reg.event?.title || "Unknown Event",
    eventType: reg.event?.category || "N/A",
    registrationDate: reg.createdAt
      ? reg.createdAt.toISOString()
      : new Date().toISOString(),
    confirmationDate: reg.createdAt
      ? reg.createdAt.toISOString()
      : new Date().toISOString(),
    lastUpdate:
      (reg.updatedAt || reg.createdAt)?.toISOString() ||
      new Date().toISOString(),
    status: reg.status,
    attendanceMarked: reg.status === "ATTENDED",
    certificateIssued: false,
    eventId: reg.eventId,
  };
}

function formatPendingRegistration(
  reg: RegistrationWithRelations,
): FormattedRegistration {
  const type = reg.paymentStatus === "PAID" ? "requirements" : "payment";

  return {
    id: reg.id,
    registrationId: reg.id.substring(0, 8).toUpperCase(),
    studentName: reg.studentName || reg.user?.name || "Unknown User",
    email: reg.email || reg.user?.email || "N/A",
    rollNumber: reg.studentId || "N/A",
    year: reg.year || reg.user?.currentYear || "N/A",
    department: reg.branch || reg.user?.branch || "N/A",
    phone: reg.phone || reg.user?.phone || "N/A",
    eventName: reg.event?.title || "Unknown Event",
    eventType: reg.event?.category || "N/A",
    registrationDate: reg.createdAt.toISOString(),
    type: type,
    paymentAmount: reg.amount || 0,
    transactionId: reg.transactionId || "N/A",
    paymentScreenshot:
      reg.screenshotUrl ||
      "https://images.unsplash.com/photo-1554224311-beee415c201f?w=400&h=300&fit=crop",
    missingRequirements: ["Document Verification"],
    notes: "Pending verification",
    eventId: reg.eventId,
    registrationDeadline: reg.event?.date
      ? reg.event.date.toISOString()
      : undefined,
    status: reg.status,
  };
}

function formatWaitlistRegistration(
  reg: any,
  index: number,
): FormattedRegistration {
  const confirmedCount = reg.event?._count?.registrations || 0;
  const maxCapacity = reg.event?.maxCapacity || 0;
  const seatsAvailable = Math.max(0, maxCapacity - confirmedCount);

  return {
    id: reg.id,
    registrationId: reg.id.substring(0, 8).toUpperCase(),
    studentName: reg.studentName || reg.user?.name || "Unknown User",
    email: reg.email || reg.user?.email || "N/A",
    rollNumber: reg.studentId || "N/A",
    year: reg.year || reg.user?.currentYear || "N/A",
    department: reg.branch || reg.user?.branch || "N/A",
    phone: reg.phone || reg.user?.phone || "N/A",
    eventName: reg.event?.title || "Unknown Event",
    eventType: reg.event?.category || "N/A",
    registrationDate: reg.createdAt.toISOString(),
    waitlistPosition: index + 1,
    totalWaitlist: 0, // We could fetch total waitlist count if ever needed
    seatsAvailable: seatsAvailable,
    maxCapacity: maxCapacity,
    eventId: reg.eventId,
    status: reg.status,
    priority: seatsAvailable > 0 ? "high" : "medium",
  };
}

// Thin cached wrappers using the core function
const getCachedConfirmedRegistrations = unstable_cache(
  async (
    userId: string,
    role: string,
    clubId: string | null,
    branch: string | null,
  ) => {
    const registrations = await fetchRegistrationsCore(
      userId,
      role,
      clubId,
      branch,
      {
        status: ["CONFIRMED", "ATTENDED"],
        orderBy: "desc",
      },
    );
    return (registrations as unknown as RegistrationWithRelations[]).map(
      formatConfirmedRegistration,
    );
  },
  ["confirmed-registrations"],
  {
    tags: ["registrations", "confirmed-registrations"],
    revalidate: 30,
  },
);

const getCachedPendingRegistrations = unstable_cache(
  async (
    userId: string,
    role: string,
    clubId: string | null,
    branch: string | null,
  ) => {
    const registrations = await fetchRegistrationsCore(
      userId,
      role,
      clubId,
      branch,
      {
        status: "PENDING",
        orderBy: "desc",
      },
    );
    return (registrations as unknown as RegistrationWithRelations[]).map(
      formatPendingRegistration,
    );
  },
  ["pending-registrations"],
  {
    tags: ["registrations", "pending-registrations"],
    revalidate: 30,
  },
);

const getCachedWaitlistRegistrations = unstable_cache(
  async (
    userId: string,
    role: string,
    clubId: string | null,
    branch: string | null,
  ) => {
    const registrations = await fetchRegistrationsCore(
      userId,
      role,
      clubId,
      branch,
      {
        status: "WAITLISTED",
        orderBy: "asc",
        includeCount: true,
      },
    );
    return (registrations as unknown as RegistrationWithRelations[]).map(
      formatWaitlistRegistration,
    );
  },
  ["waitlist-registrations"],
  {
    tags: ["registrations", "waitlist-registrations"],
    revalidate: 30,
  },
);

export async function getConfirmedRegistrations(): Promise<{
  success?: boolean;
  data?: FormattedRegistration[];
  error?: string;
}> {
  return executeAction(async () => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    const registrations = await getCachedConfirmedRegistrations(
      user.id,
      user.role,
      user.clubId ?? null,
      user.branch ?? null,
    );

    return { success: true, data: registrations };
  }, "getConfirmedRegistrations") as any;
}

export async function getPendingRegistrations(): Promise<{
  success?: boolean;
  data?: FormattedRegistration[];
  error?: string;
}> {
  return executeAction(async () => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    const registrations = await getCachedPendingRegistrations(
      user.id,
      user.role,
      user.clubId ?? null,
      user.branch ?? null,
    );

    return { success: true, data: registrations };
  }, "getPendingRegistrations") as any;
}

export async function getWaitlistRegistrations(): Promise<{
  success?: boolean;
  data?: FormattedRegistration[];
  error?: string;
}> {
  return executeAction(async () => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    const registrations = await getCachedWaitlistRegistrations(
      user.id,
      user.role,
      user.clubId ?? null,
      user.branch ?? null,
    );

    return { success: true, data: registrations };
  }, "getWaitlistRegistrations") as any;
}

const getCachedAllRegistrations = unstable_cache(
  async (
    userId: string,
    role: string,
    clubId: string | null,
    branch: string | null,
    page: number,
    limit: number,
    search: string,
    status: string,
    eventId: string,
  ) => {
    const skip = (page - 1) * limit;
    let whereClause: Prisma.RegistrationWhereInput = {
      team: null,
    };

    // Role-based scoping
    const eventScope = buildRegistrationScope(role, userId, clubId, branch);
    if (Object.keys(eventScope).length > 0) {
      whereClause.event = eventScope;
    }

    // Apply Status Filter
    if (status !== "all") {
      whereClause.status = {
        equals: status.toUpperCase() as RegistrationStatus,
      };
    }

    // Apply Event Filter
    if (eventId !== "all") {
      whereClause.eventId = eventId;
    }

    // Apply Search Filter
    if (search) {
      whereClause.OR = [
        { studentName: { contains: search } },
        { studentId: { contains: search } },
        { id: { contains: search } },
        { event: { title: { contains: search } } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
      ];
    }

    const [
      registrations,
      total,
      onlineCount,
      revenueResult,
      attendedCount,
      confirmedCount,
    ] = await prisma.$transaction([
      prisma.registration.findMany({
        where: whereClause,
        skip: skip,
        take: limit,
        select: {
          id: true,
          studentName: true,
          studentId: true,
          status: true,
          paymentStatus: true,
          amount: true,
          transactionId: true,
          createdAt: true,
          eventId: true,
          branch: true,
          event: {
            select: {
              id: true,
              title: true,
              category: true,
              creator: {
                select: {
                  branch: true,
                },
              },
            },
          },
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
              branch: true,
              currentYear: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.registration.count({ where: whereClause }),
      prisma.registration.count({
        where: {
          AND: [
            whereClause,
            { OR: [{ transactionId: { not: null } }, { amount: { gt: 0 } }] },
          ],
        },
      }),
      prisma.registration.aggregate({
        where: whereClause,
        _sum: { amount: true },
      }),
      prisma.registration.count({
        where: {
          AND: [whereClause, { status: "ATTENDED" }],
        },
      }),
      prisma.registration.count({
        where: {
          AND: [whereClause, { status: { in: ["CONFIRMED", "ATTENDED"] } }],
        },
      }),
    ]);

    const totalOffline = total - onlineCount;
    const totalRevenue = revenueResult._sum.amount || 0;
    const avgAttendanceRate =
      confirmedCount > 0
        ? Math.round((attendedCount / confirmedCount) * 100)
        : 0;

    const stats = {
      totalOnlineRegistrations: onlineCount,
      totalOfflineRegistrations: totalOffline,
      totalRevenue,
      avgAttendanceRate,
    };

    const formattedRegistrations = registrations.map((reg) => ({
      id: reg.id,
      registrationId: reg.id.substring(0, 8).toUpperCase(),
      studentName: reg.studentName || reg.user?.name || "Unknown",
      rollNumber: reg.studentId || "N/A",
      email: reg.user?.email || "N/A",
      phone: reg.user?.phone || "N/A",
      year: reg.user?.currentYear || "N/A",
      department: reg.branch || reg.user?.branch || "N/A",
      eventName: reg.event?.title || "Unknown Event",
      eventType: reg.event?.category || "N/A",
      registrationDate: reg.createdAt.toISOString(),
      status: reg.status.toLowerCase(),
      paymentStatus: reg.paymentStatus?.toLowerCase() || "pending",
      paymentAmount: reg.amount,
      transactionId: reg.transactionId,
      requirementsMet: true,
      eventId: reg.eventId,
    }));

    return {
      registrations: formattedRegistrations,
      total,
      page,
      limit,
      stats,
    };
  },
  ["all-registrations"],
  {
    tags: ["registrations", "all-registrations"],
    revalidate: 30,
  },
);

const getCachedEventRegistrations = unstable_cache(
  async (eventId: string) => {
    const registrations = await prisma.registration.findMany({
      where: {
        eventId: eventId,
        status: {
          in: ["CONFIRMED", "ATTENDED", "PENDING", "CANCELLED", "WAITLISTED"],
        },
      },
      select: {
        id: true,
        studentName: true,
        studentId: true,
        status: true,
        branch: true,
        year: true,
        user: {
          select: {
            name: true,
            email: true,
            branch: true,
            currentYear: true,
          },
        },
      },
      orderBy: {
        studentName: "asc",
      },
    });

    return registrations.map((reg) => ({
      id: reg.id,
      name: reg.studentName || reg.user?.name || "Unknown",
      roll: reg.studentId || (reg.user as any)?.rollNumber || "N/A",
      department: reg.branch || reg.user?.branch || "N/A",
      year: reg.year || reg.user?.currentYear || "N/A",
      status:
        reg.status === "ATTENDED"
          ? "present"
          : reg.status === "CANCELLED"
            ? "absent"
            : "not-marked",
    }));
  },
  ["event-registrations"],
  {
    tags: ["registrations", "event-registrations"],
    revalidate: 30,
  },
);

const getCachedTeamRegistrations = unstable_cache(
  async (
    userId: string,
    role: string,
    clubId: string | null,
    branch: string | null,
  ) => {
    const eventWhere = buildRegistrationScope(role, userId, clubId, branch);

    const teams = await prisma.team.findMany({
      where: Object.keys(eventWhere).length > 0 ? { event: eventWhere } : {},
      include: {
        event: {
          select: {
            id: true,
            title: true,
            category: true,
            date: true,
          },
        },
        members: {
          select: {
            id: true,
            name: true,
            rollNumber: true,
            year: true,
            department: true,
            role: true,
            phone: true,
          },
        },
        leader: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return teams.map((team) => ({
      id: team.id,
      teamName: team.teamName,
      sport: team.event?.title || "Unknown",
      sportColor: "#3B82F6",
      captain: team.leaderName || team.leader?.name || "Unknown",
      viceCaptain:
        team.members.find(
          (m: any) =>
            (m.role as unknown as string) === "VICE_CAPTAIN" ||
            (m.role as unknown as string) === "Vice Captain",
        )?.name || "N/A",
      yearLevel: "Mixed",
      status: team.status.toLowerCase(),
      registeredDate: team.createdAt.toISOString(),
      members: team.members.map((m: any) => ({
        id: m.id,
        name: m.name,
        studentId: m.rollNumber || "N/A",
        year: m.year || "N/A",
        section: m.department || "N/A",
        role: m.role === "LEADER" ? "Captain" : "Member",
        phoneNumber: m.phone || "N/A",
      })),
      eventId: team.eventId,
      eventType: team.event?.category || "N/A",
      captainRoll:
        team.members.find((m: any) => m.role === "LEADER")?.rollNumber || "N/A",
      captainYear:
        team.members.find((m: any) => m.role === "LEADER")?.year || "N/A",
      captainBranch:
        team.members.find((m: any) => m.role === "LEADER")?.department || "N/A",
      captainSection:
        team.members.find((m: any) => m.role === "LEADER")?.department || "N/A",
    }));
  },
  ["team-registrations"],
  {
    tags: ["registrations", "team-registrations"],
    revalidate: 60,
  },
);

const getCachedStudentWaitlist = unstable_cache(
  async (userId: string) => {
    const registrations = await prisma.registration.findMany({
      where: {
        userId: userId,
        status: "WAITLISTED",
      },
      include: {
        event: {
          select: {
            title: true,
            category: true,
            date: true,
            venue: true,
            maxCapacity: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return registrations.map((reg: any, index: any) => ({
      id: reg.id,
      eventName: reg.event?.title || "Unknown Event",
      category: reg.event?.category || "N/A",
      date: reg.event?.date.toISOString() || new Date().toISOString(),
      venue: reg.event?.venue || "N/A",
      registrations: 0,
      capacity: reg.event?.maxCapacity || 0,
      waitlistPosition: index + 1,
      registrationDate: reg.createdAt.toISOString(),
    }));
  },
  ["student-waitlist"],
  { tags: ["registrations", "student-waitlist"], revalidate: 30 },
);

export async function getStudentWaitlist(): Promise<{
  success?: boolean;
  data?: WaitingListRegistration[];
  error?: string;
}> {
  return executeAction(async () => {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) throw new Error("Unauthorized");

    const registrations = await getCachedStudentWaitlist(session.user.id);
    return { success: true, data: registrations };
  }, "getStudentWaitlist") as any;
}

export async function getAllRegistrations({
  page = 1,
  limit = 10,
  search = "",
  status = "all",
  eventId = "all",
}: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  eventId?: string;
} = {}): Promise<{ success?: boolean; data?: any; error?: string }> {
  return executeAction(async () => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    const result = await getCachedAllRegistrations(
      user.id,
      user.role,
      user.clubId ?? null,
      user.branch ?? null,
      page,
      limit,
      search,
      status,
      eventId,
    );

    return {
      success: true as const,
      data: {
        registrations: result.registrations,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit),
        },
      },
    };
  }, "getAllRegistrations") as any;
}

export async function getEventRegistrations(
  eventId: string,
): Promise<{ success?: boolean; data?: EventAttendee[]; error?: string }> {
  return executeAction(async () => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    const registrations = await getCachedEventRegistrations(eventId);

    return { success: true, data: registrations };
  }, "getEventRegistrations") as any;
}

export async function getTeamRegistrations(): Promise<{
  success?: boolean;
  data?: FormattedTeam[];
  error?: string;
}> {
  return executeAction(async () => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    const teams = await getCachedTeamRegistrations(
      user.id,
      user.role,
      user.clubId ?? null,
      user.branch ?? null,
    );

    return { success: true, data: teams };
  }, "getTeamRegistrations") as any;
}

/**
 * Get bulk import history from AuditLog
 */
const getCachedImportHistory = unstable_cache(
  async () => {
    const logs = await prisma.auditLog.findMany({
      where: {
        action: "BULK_IMPORT_REGISTRATIONS",
      },
      select: { id: true, timestamp: true, metadata: true },
      orderBy: {
        timestamp: "desc",
      },
      take: 20,
    });

    return logs.map((log) => {
      const metadata =
        (log.metadata as {
          filename?: string;
          total?: number;
          successful?: number;
          failed?: number;
        }) || {};

      return {
        id: log.id,
        filename: metadata.filename || "Unknown File",
        importDate: log.timestamp.toISOString(),
        records: metadata.total || 0,
        successful: metadata.successful || 0,
        failed: metadata.failed || 0,
        status: "completed",
      };
    });
  },
  ["import-history"],
  { tags: ["import-history", "logs"], revalidate: 60 },
);

export async function getImportHistory(): Promise<{
  success?: boolean;
  data?: ImportHistoryItem[];
  error?: string;
}> {
  return executeAction(async () => {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    const history = await getCachedImportHistory();
    return { success: true, data: history };
  }, "getImportHistory") as any;
}

/**
 * Get export history from AuditLog
 */
const getCachedExportHistory = unstable_cache(
  async () => {
    const logs = await prisma.auditLog.findMany({
      where: {
        action: "EXPORT_REGISTRATIONS",
      },
      select: { id: true, timestamp: true, metadata: true },
      orderBy: {
        timestamp: "desc",
      },
      take: 20,
    });

    return logs.map((log) => {
      const metadata =
        (log.metadata as {
          name?: string;
          filename?: string;
          size?: string;
          url?: string;
        }) || {};

      return {
        id: log.id,
        name: metadata.filename || "export.csv",
        createdAt: log.timestamp,
        size: metadata.size || "N/A",
        url: metadata.url || "#",
      };
    });
  },
  ["export-history"],
  { tags: ["export-history", "logs"], revalidate: 60 },
);

export async function getExportHistory(): Promise<{
  success?: boolean;
  data?: ExportHistoryItem[];
  error?: string;
}> {
  return executeAction(async () => {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    const files = await getCachedExportHistory();
    return { success: true, data: files };
  }, "getExportHistory") as any;
}
