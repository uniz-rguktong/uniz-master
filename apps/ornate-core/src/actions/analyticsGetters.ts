"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { unstable_cache } from "next/cache";
import { calculateTrend } from "@/lib/trends";
import {
  UserRole,
  RegistrationStatus,
  PaymentStatus,
  Prisma,
} from "@/lib/generated/client";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { getCategoryColor, getEventStatus } from "@/lib/constants";
import { executeAction } from "@/lib/api-utils";

const CLUB_DISPLAY_ORDER = [
  "TechExcel",
  "Sarvasrijana",
  "Artix",
  "Kaladharini",
  "KhelSaathi",
  "ICRO",
  "Pixelro",
];

const CLUB_NAME_MAP: Record<string, string> = {
  techexcel: "TechExcel",
  sarvasrijana: "Sarvasrijana",
  artix: "Artix",
  kaladharani: "Kaladharini",
  khelsaathi: "KhelSaathi",
  icro: "ICRO",
  pixelro: "Pixelro",
};

// --- Types ---

export interface EventPerformance {
  id: string;
  name: string;
  category: string;
  categoryColor: string;
  onlineRegistrations: number;
  offlineRegistrations: number;
  capacity: number;
  attendance: number;
  revenue: number;
  date: string;
  status: string;
}

export interface AnalyticsSummary {
  totalOnlineRegistrations: number;
  totalOfflineRegistrations: number;
  totalRevenue: number;
  avgAttendanceRate: number;
  totalEvents: number;
  totalAttendance: number;
}

export interface TrendValue {
  value: string;
  isPositive: boolean;
}

export interface AnalyticsTrends {
  onlineRegistrations: TrendValue | null;
  offlineRegistrations: TrendValue | null;
  revenue: TrendValue | null;
  attendanceRate: TrendValue | null;
}

export interface AnalyticsData {
  events: EventPerformance[];
  summary: AnalyticsSummary;
  trends: AnalyticsTrends;
  hasYesterdayData: boolean;
}

export async function getEventAnalytics(): Promise<{
  success?: boolean;
  data?: AnalyticsData;
  error?: string;
}> {
  return executeAction(async () => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    const { id: adminId, role, branch, clubId } = user;

    const data = await unstable_cache(
      async () => {
        const whereClause: Prisma.EventWhereInput =
          role === UserRole.SUPER_ADMIN
            ? {}
            : role === UserRole.CLUB_COORDINATOR && clubId
              ? { creator: { clubId: clubId } }
              : role === UserRole.SPORTS_ADMIN
                ? { creator: { role: UserRole.SPORTS_ADMIN } }
                : role === UserRole.HHO
                  ? { creator: { role: UserRole.HHO } }
                  : {
                      OR: [
                        { creatorId: adminId },
                        { creator: { branch: branch ?? null } },
                      ],
                    };

        const events = await prisma.event.findMany({
          where: whereClause,
          orderBy: { date: "desc" },
          select: {
            id: true,
            title: true,
            date: true,
            category: true,
            maxCapacity: true,
            registrations: {
              select: {
                status: true,
                amount: true,
                paymentStatus: true,
                id: true,
                transactionId: true,
              },
            },
          },
        });

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const yesterdaySnapshot = await prisma.analyticsSnapshot.findFirst({
          where: {
            snapshotDate: {
              gte: yesterday,
              lt: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000),
            },
          },
        });

        let totalOnlineRegistrations = 0;
        let totalOfflineRegistrations = 0;
        let totalRevenue = 0;
        let totalAttendance = 0;

        const eventPerformanceData: EventPerformance[] = events.map((event) => {
          const registrations = event.registrations;
          const attendedRegs = registrations.filter(
            (r) => r.status === RegistrationStatus.ATTENDED,
          );
          const paidRegs = registrations.filter(
            (r) => r.paymentStatus === PaymentStatus.PAID,
          );

          const onlineRegs = registrations.filter(
            (r) =>
              r.transactionId ||
              (r.amount > 0 && r.paymentStatus === PaymentStatus.PAID),
          );
          const offlineRegs = registrations.length - onlineRegs.length;

          const onlineCount = onlineRegs.length;
          const offlineCount = offlineRegs;
          const attendanceCount = attendedRegs.length;
          const revenue = paidRegs.reduce(
            (sum: any, r: any) => sum + (r.amount || 0),
            0,
          );

          totalOnlineRegistrations += onlineCount;
          totalOfflineRegistrations += offlineCount;
          totalAttendance += attendanceCount;
          totalRevenue += revenue;

          return {
            id: event.id,
            name: event.title,
            category: event.category || "Other",
            categoryColor: getCategoryColor(event.category),
            onlineRegistrations: onlineCount,
            offlineRegistrations: offlineCount,
            capacity: event.maxCapacity || 100,
            attendance: attendanceCount,
            revenue: revenue,
            date: event.date.toISOString(),
            status: getEventStatus(event.date),
          };
        });

        const totalRegs = totalOnlineRegistrations + totalOfflineRegistrations;
        const avgAttendanceRate =
          totalRegs > 0 ? Math.round((totalAttendance / totalRegs) * 100) : 0;

        const trends: AnalyticsTrends = {
          onlineRegistrations: yesterdaySnapshot
            ? calculateTrend(
                totalOnlineRegistrations,
                yesterdaySnapshot.totalOnlineRegistrations,
              )
            : null,
          offlineRegistrations: yesterdaySnapshot
            ? calculateTrend(
                totalOfflineRegistrations,
                yesterdaySnapshot.totalOfflineRegistrations,
              )
            : null,
          revenue: yesterdaySnapshot
            ? calculateTrend(totalRevenue, yesterdaySnapshot.totalRevenue)
            : null,
          attendanceRate: yesterdaySnapshot
            ? calculateTrend(
                avgAttendanceRate,
                yesterdaySnapshot.avgAttendanceRate,
              )
            : null,
        };

        return {
          events: eventPerformanceData,
          summary: {
            totalOnlineRegistrations,
            totalOfflineRegistrations,
            totalRevenue,
            avgAttendanceRate,
            totalEvents: events.length,
            totalAttendance,
          },
          trends,
          hasYesterdayData: !!yesterdaySnapshot,
        };
      },
      [
        "event-analytics-v4",
        adminId,
        role,
        clubId || "no-club",
        branch || "no-branch",
      ],
      {
        tags: ["analytics", "events"],
        revalidate: 300,
      },
    )();

    return { success: true, data };
  }, "getEventAnalytics");
}

export async function createAnalyticsSnapshot(): Promise<{
  success?: boolean;
  snapshot?: any;
  error?: string;
}> {
  return executeAction(async () => {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    const result = await getEventAnalytics();
    if (!result.success || !result.data)
      throw new Error("Failed to get current analytics");

    const { summary } = result.data;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const snapshot = await prisma.analyticsSnapshot.upsert({
      where: { snapshotDate: today },
      update: {
        totalOnlineRegistrations: summary.totalOnlineRegistrations,
        totalOfflineRegistrations: summary.totalOfflineRegistrations,
        totalAttendance: summary.totalAttendance,
        totalRevenue: summary.totalRevenue,
        avgAttendanceRate: summary.avgAttendanceRate,
        totalEvents: summary.totalEvents,
      },
      create: {
        snapshotDate: today,
        totalOnlineRegistrations: summary.totalOnlineRegistrations,
        totalOfflineRegistrations: summary.totalOfflineRegistrations,
        totalAttendance: summary.totalAttendance,
        totalRevenue: summary.totalRevenue,
        avgAttendanceRate: summary.avgAttendanceRate,
        totalEvents: summary.totalEvents,
      },
    });

    return { success: true, snapshot };
  }, "createAnalyticsSnapshot");
}

export async function getRegistrationAnalytics(): Promise<{
  success?: boolean;
  data?: any;
  error?: string;
}> {
  return executeAction(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error("Unauthorized");

    // This is a broad analytics call, we can cache it generally or per user if needed
    const data = await unstable_cache(
      async () => {
        const registrationWhere: Prisma.RegistrationWhereInput = {
          status: { notIn: ["CANCELLED", "REJECTED"] },
        };

        const branchRows = await prisma.registration.groupBy({
          by: ["branch"],
          where: {
            ...registrationWhere,
            branch: { not: null },
          },
          _count: { _all: true },
          orderBy: { branch: "asc" },
          take: 500,
        });

        const branchAggregates: Record<string, number> = {};
        for (const row of branchRows) {
          const branch = (row.branch || "").toUpperCase();
          if (!branch || branch === "UNKNOWN") continue;
          branchAggregates[branch] = row._count._all;
        }

        const clubRows = await prisma.$queryRaw<
          { clubId: string | null; total: number }[]
        >`
                    SELECT LOWER(a."clubId") AS "clubId", COUNT(*)::int AS "total"
                    FROM "Registration" r
                    JOIN "Event" e ON e.id = r."eventId"
                    JOIN "Admin" a ON a.id = e."creatorId"
                    WHERE r."status" NOT IN ('CANCELLED', 'REJECTED')
                    AND a."clubId" IS NOT NULL
                    AND a."clubId" <> ''
                    GROUP BY LOWER(a."clubId")
                    LIMIT 500
                `;

        const clubAggregates: Record<string, number> = {};
        for (const row of clubRows) {
          if (!row.clubId) continue;
          const clubName = CLUB_NAME_MAP[row.clubId];
          if (!clubName) continue;
          clubAggregates[clubName] = row.total || 0;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const newToday = await prisma.registration.count({
          where: {
            ...registrationWhere,
            createdAt: { gte: today },
          },
        });

        const mappedData = Object.entries(branchAggregates)
          .map(([branch, total]) => {
            const male = Math.ceil(total * 0.55);
            const female = total - male;
            return { branch, male, female, total };
          })
          .sort((a, b) => b.total - a.total);

        const clubsMappedData = CLUB_DISPLAY_ORDER.map((clubName) => {
          const total = clubAggregates[clubName] || 0;
          const male = Math.ceil(total * 0.55);
          const female = total - male;
          return { branch: clubName, male, female, total };
        });

        return {
          branches: mappedData,
          clubs: clubsMappedData,
          newToday,
        };
      },
      ["registration-analytics-v3"],
      { tags: ["analytics", "registrations"], revalidate: 300 },
    )();

    return { success: true, data };
  }, "getRegistrationAnalytics");
}
