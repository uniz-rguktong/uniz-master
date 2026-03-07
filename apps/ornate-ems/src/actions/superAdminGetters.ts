"use server";

import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import logger from "@/lib/logger";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { EventStatus } from "@/lib/generated/client";

// ─────────────────────────────────────────────────────────
// Auth Helper
// ─────────────────────────────────────────────────────────

async function requireSuperAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  return !!(session?.user && session.user.role === "SUPER_ADMIN");
}

export interface DashboardTrend {
  value: string;
  isPositive: boolean;
  comparisonText: string;
}

export interface DashboardStat {
  count: number;
  trend: DashboardTrend;
}

export interface SuperAdminStats {
  totalEvents: DashboardStat;
  totalRegistrations: DashboardStat;
  pendingApprovals: DashboardStat;
  activeAnnouncements: DashboardStat;
}

export interface TrendDataPoint {
  label: string;
  registered: number;
  attended: number;
}

// ─────────────────────────────────────────────────────────
// Cached Internal Helpers (not exported — auth-free, safe)
// ─────────────────────────────────────────────────────────

const _getCachedStats = unstable_cache(
  async (): Promise<SuperAdminStats> => {
    try {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      const [
        totalEventCount,
        totalRegistrationCount,
        totalSportCount,
        totalSportRegistrationCount,
        pendingEventCount,
        pendingSportRegistrationCount,
        activeAnnouncementsCount,
        prevEvents,
        prevRegistrations,
        prevSports,
        prevSportRegistrations,
      ] = await prisma.$transaction([
        prisma.event.count({ where: { NOT: { category: "Sports" } } }),
        prisma.registration.count({
          where: { event: { NOT: { category: "Sports" } } },
        }),
        prisma.sport.count({ where: { isActive: true } }),
        prisma.sportRegistration.count(),
        prisma.event.count({
          where: { status: EventStatus.DRAFT, NOT: { category: "Sports" } },
        }),
        prisma.sportRegistration.count({ where: { status: "PENDING" } }),
        prisma.announcement.count({ where: { status: "active" } }),
        prisma.event.count({
          where: { createdAt: { lt: lastWeek }, NOT: { category: "Sports" } },
        }),
        prisma.registration.count({
          where: {
            createdAt: { lt: lastWeek },
            event: { NOT: { category: "Sports" } },
          },
        }),
        prisma.sport.count({
          where: { isActive: true, createdAt: { lt: lastWeek } },
        }),
        prisma.sportRegistration.count({
          where: { createdAt: { lt: lastWeek } },
        }),
      ]);

      const totalEvents = totalEventCount + totalSportCount;
      const totalRegistrations =
        totalRegistrationCount + totalSportRegistrationCount;
      const pendingApprovalsCount =
        pendingEventCount + pendingSportRegistrationCount;
      const activeAnnouncementsFinal = activeAnnouncementsCount;
      const previousEvents = prevEvents + prevSports;
      const previousRegistrations = prevRegistrations + prevSportRegistrations;

      const eventDiff = totalEvents - previousEvents;
      const regDiff = totalRegistrations - previousRegistrations;

      return {
        totalEvents: {
          count: totalEvents,
          trend: {
            value: `${eventDiff >= 0 ? "+" : ""}${eventDiff}`,
            isPositive: eventDiff >= 0,
            comparisonText: "vs last week",
          },
        },
        totalRegistrations: {
          count: totalRegistrations,
          trend: {
            value: `${regDiff >= 0 ? "+" : ""}${regDiff}`,
            isPositive: regDiff >= 0,
            comparisonText: "vs last week",
          },
        },
        pendingApprovals: {
          count: pendingApprovalsCount,
          trend: {
            value: pendingApprovalsCount > 0 ? "Urgent" : "Clear",
            isPositive: pendingApprovalsCount === 0,
            comparisonText: "action items",
          },
        },
        activeAnnouncements: {
          count: activeAnnouncementsFinal,
          trend: {
            value: "Live",
            isPositive: true,
            comparisonText: "now",
          },
        },
      };
    } catch (error) {
      logger.error({ err: error }, "Error fetching super admin stats");
      return EMPTY_STATS;
    }
  },
  ["dashboard-stats"],
  { revalidate: 60, tags: ["dashboard-stats"] },
);

const _getCachedTodaysEvents = unstable_cache(
  async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [events, sports] = await Promise.all([
        prisma.event.findMany({
          where: {
            date: { gte: today, lt: tomorrow },
            NOT: { category: "Sports" },
          },
          select: {
            id: true,
            title: true,
            venue: true,
            date: true,
            category: true,
            status: true,
          },
          orderBy: { date: "asc" },
          take: 5,
        }),
        prisma.sport.findMany({
          where: { isActive: true }, // Ideally Sport should have a date field, assuming today/active
          select: { id: true, name: true, createdAt: true, status: true },
          take: 5,
        }),
      ]);

      const mappedEvents = events.map((event) => ({
        id: event.id,
        title: event.title,
        venue: event.venue,
        date: event.date,
        status: event.status,
        time: event.date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        portal: event.category || "General",
      }));

      const mappedSports = sports.map((sport) => ({
        id: sport.id,
        title: sport.name,
        venue: "Sports Arena", // Default for sports if venue missing
        date: sport.createdAt,
        status: sport.status === "ONGOING" ? "ONGOING" : "UPCOMING",
        time: sport.createdAt.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        portal: "Sports",
      }));

      return [...mappedEvents, ...mappedSports]
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, 10);
    } catch (error) {
      logger.error({ err: error }, "Error fetching todays events");
      return [];
    }
  },
  ["todays-events"],
  { revalidate: 60, tags: ["todays-events"] },
);

const _getCachedRegistrationTrend = unstable_cache(
  async () => {
    try {
      const getTrendData = async (type: "Weekly" | "Monthly" | "Yearly") => {
        const queryGen = (table: string) => {
          if (type === "Weekly") {
            return prisma.$queryRawUnsafe<any[]>(`
                            WITH weeks AS (
                                SELECT generate_series(
                                    date_trunc('week', NOW()) - interval '3 weeks',
                                    date_trunc('week', NOW()),
                                    '1 week'::interval
                                ) as week_start
                            )
                            SELECT
                                'W' || (4 - (EXTRACT(EPOCH FROM (date_trunc('week', NOW()) - w.week_start)) / 604800))::text as label,
                                COUNT(r.id)::int as count
                            FROM weeks w
                            LEFT JOIN "${table}" r ON date_trunc('week', r."createdAt") = w.week_start
                            GROUP BY w.week_start
                            ORDER BY w.week_start;
                        `);
          } else if (type === "Monthly") {
            return prisma.$queryRawUnsafe<any[]>(`
                            WITH months AS (
                                SELECT generate_series(
                                    date_trunc('year', NOW()),
                                    date_trunc('year', NOW()) + interval '11 months',
                                    '1 month'::interval
                                ) as month_start
                            )
                            SELECT
                                TO_CHAR(m.month_start, 'MON') as label,
                                COUNT(r.id)::int as count
                            FROM months m
                            LEFT JOIN "${table}" r ON date_trunc('month', r."createdAt") = m.month_start
                            GROUP BY m.month_start
                            ORDER BY m.month_start;
                        `);
          } else {
            return prisma.$queryRawUnsafe<any[]>(`
                            WITH years AS (
                                SELECT generate_series(
                                    date_trunc('year', NOW()) - interval '2 years',
                                    date_trunc('year', NOW()),
                                    '1 year'::interval
                                ) as year_start
                            )
                            SELECT
                                EXTRACT(YEAR FROM y.year_start)::text as label,
                                COUNT(r.id)::int as count
                            FROM years y
                            LEFT JOIN "${table}" r ON date_trunc('year', r."createdAt") = y.year_start
                            GROUP BY y.year_start
                            ORDER BY y.year_start;
                        `);
          }
        };

        const [regData, sportData] = await Promise.all([
          queryGen("Registration"),
          queryGen("SportRegistration"),
        ]);

        return regData.map((item, idx) => ({
          label: item.label,
          registered: item.count + (sportData[idx]?.count || 0),
          attended: Math.round(
            (item.count + (sportData[idx]?.count || 0)) * 0.8,
          ), // Simulated attendance
        }));
      };

      const [Weekly, Monthly, Yearly] = await Promise.all([
        getTrendData("Weekly"),
        getTrendData("Monthly"),
        getTrendData("Yearly"),
      ]);

      return { Weekly, Monthly, Yearly };
    } catch (error) {
      logger.error({ err: error }, "Error fetching registration trend");
      return { Weekly: [], Monthly: [], Yearly: [] };
    }
  },
  ["registration-trend"],
  { revalidate: 300, tags: ["registration-trend"] },
);

const _getCachedPortalPerformance = unstable_cache(
  async () => {
    try {
      const [eventsByCategory, sportsCount] = await Promise.all([
        prisma.event.groupBy({
          by: ["category"],
          where: { NOT: { category: "Sports" } },
          _count: { id: true },
        }),
        prisma.sport.count({ where: { isActive: true } }),
      ]);

      const eventData = eventsByCategory.map((item) => ({
        name: item.category || "General",
        events: item._count.id,
        score: Math.min(100, item._count.id * 10),
      }));

      const sportsData = {
        name: "Sports",
        events: sportsCount,
        score: Math.min(100, sportsCount * 10),
      };

      return [...eventData, sportsData]
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
    } catch (error) {
      logger.error({ err: error }, "Error fetching portal performance");
      return [];
    }
  },
  ["portal-performance"],
  { revalidate: 300, tags: ["portal-performance"] },
);

const _getCachedLiveEvents = unstable_cache(
  async () => {
    try {
      const [events, sports] = await Promise.all([
        prisma.event.findMany({
          where: { status: "ONGOING", NOT: { category: "Sports" } },
          select: {
            id: true,
            title: true,
            venue: true,
            date: true,
            _count: { select: { registrations: true } },
          },
          take: 10,
        }),
        prisma.sport.findMany({
          where: { status: "ONGOING" },
          select: {
            id: true,
            name: true,
            createdAt: true,
            _count: { select: { registrations: true } },
          },
          take: 10,
        }),
      ]);

      const mappedEvents = events.map((event) => ({
        id: event.id,
        name: event.title,
        venue: event.venue || "TBD",
        startedAt: event.date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        participants: event._count.registrations,
        status: "Running",
      }));

      const mappedSports = sports.map((sport) => ({
        id: sport.id,
        name: sport.name,
        venue: "Sports Arena",
        startedAt: sport.createdAt.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        participants: sport._count.registrations,
        status: "Running",
      }));

      return [...mappedEvents, ...mappedSports];
    } catch (error) {
      logger.error({ err: error }, "Error fetching live events");
      return [];
    }
  },
  ["live-events"],
  { revalidate: 30, tags: ["live-events"] },
);

const _getCachedAllWinners = unstable_cache(
  async () => {
    try {
      const [eventWinners, sportWinners] = await Promise.all([
        prisma.winnerAnnouncement.findMany({
          where: { isPublished: true, event: { NOT: { category: "Sports" } } },
          select: {
            id: true,
            positions: true,
            publishedAt: true,
            event: {
              select: {
                title: true,
                category: true,
                venue: true,
                creator: { select: { name: true, branch: true } },
              },
            },
          },
          orderBy: { publishedAt: "desc" },
        }),
        prisma.sportWinnerAnnouncement.findMany({
          where: { isPublished: true },
          select: {
            id: true,
            positions: true,
            publishedAt: true,
            sport: { select: { name: true } },
          },
          orderBy: { publishedAt: "desc" },
        }),
      ]);

      const mappedEventWinners = eventWinners.map((w: any) => ({
        event: w.event.title,
        branch: w.event.creator?.branch || "General",
        organizer: w.event.creator?.name || "Admin",
        type: w.event.category || "Event",
        winner: (w.positions as any)?.first,
        runner: (w.positions as any)?.second,
        secondRunner: (w.positions as any)?.third,
      }));

      const mappedSportWinners = sportWinners.map((w: any) => ({
        event: w.sport.name,
        branch: w.sport.branch || "General",
        organizer: "Sports Admin",
        type: "Sports",
        winner: (w.positions as any)?.first,
        runner: (w.positions as any)?.second,
        secondRunner: (w.positions as any)?.third,
      }));

      return [...mappedEventWinners, ...mappedSportWinners];
    } catch (error) {
      logger.error({ err: error }, "Error fetching all winners");
      return [];
    }
  },
  ["all-winners"],
  { revalidate: 300, tags: ["winners"] },
);

const _getCachedGlobalSchedule = unstable_cache(
  async () => {
    try {
      const [events, sports] = await Promise.all([
        prisma.event.findMany({
          where: {
            status: {
              in: [
                EventStatus.DRAFT,
                EventStatus.PUBLISHED,
                EventStatus.ONGOING,
              ],
            },
            NOT: { category: "Sports" },
          },
          select: {
            id: true,
            title: true,
            date: true,
            time: true,
            endTime: true,
            venue: true,
            category: true,
            status: true,
          },
          orderBy: { date: "asc" },
        }),
        prisma.sport.findMany({
          where: {
            status: { in: ["UPCOMING", "REGISTRATION_OPEN", "ONGOING"] as any },
          },
          select: { id: true, name: true, createdAt: true, status: true },
          orderBy: { createdAt: "asc" },
        }),
      ]);

      const mappedEvents = events.map((event) => ({
        id: event.id,
        name: event.title,
        time: event.time || "TBD",
        endTime: event.endTime || "TBD",
        venue: event.venue || "TBD",
        type: event.category || "General",
        date: event.date.toISOString(),
        status: event.status,
      }));

      const mappedSports = sports.map((sport) => ({
        id: sport.id,
        name: sport.name,
        time: sport.createdAt.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        endTime: "TBD",
        venue: "Sports Arena",
        type: "Sports",
        date: sport.createdAt.toISOString(),
        status: sport.status,
      }));

      return [...mappedEvents, ...mappedSports];
    } catch (error) {
      logger.error({ err: error }, "Error fetching global schedule");
      return [];
    }
  },
  ["global-schedule"],
  { revalidate: 300, tags: ["schedule", "events"] },
);

const _getCachedPendingApprovals = unstable_cache(
  async () => {
    try {
      const [events, sportRegs] = await Promise.all([
        prisma.event.findMany({
          where: {
            status: EventStatus.DRAFT,
            NOT: [
              { category: "Sports" },
              {
                creator: {
                  role: { in: ["SPORTS_ADMIN", "BRANCH_SPORTS_ADMIN"] },
                },
              },
            ],
          },
          select: {
            id: true,
            title: true,
            shortDescription: true,
            description: true,
            posterUrl: true,
            createdAt: true,
            creator: { select: { name: true, branch: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.sportRegistration.findMany({
          where: { status: "PENDING" },
          select: {
            id: true,
            studentName: true,
            createdAt: true,
            branch: true,
            sport: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
      ]);

      const mappedEvents = events.map((event) => ({
        id: event.id,
        name: event.title,
        organizer: event.creator?.name || "Organizer",
        branch: event.creator?.branch || "General",
        submittedAt: new Date(event.createdAt).toLocaleDateString(),
        description: event.shortDescription || event.description,
        conflicts: [],
        poster:
          event.posterUrl ||
          "https://images.unsplash.com/photo-1501612780327-45045538702b?w=200&h=200&fit=crop",
      }));

      const mappedSports = sportRegs.map((reg) => ({
        id: reg.id,
        name: `Registration: ${reg.studentName}`,
        organizer: reg.studentName,
        branch: reg.branch || "N/A",
        submittedAt: reg.createdAt.toLocaleDateString(),
        description: `Pending participation for ${reg.sport.name}`,
        conflicts: [],
        poster: "/sports-placeholder.png", // Or generic sports icon
      }));

      return [...mappedEvents, ...mappedSports];
    } catch (error) {
      logger.error({ err: error }, "Error fetching pending approvals");
      return [];
    }
  },
  ["pending-approvals"],
  { revalidate: 60, tags: ["approvals"] },
);

// Cached Student Users (from User table — students only)
const _getCachedStudentUsers = unstable_cache(
  async () => {
    try {
      const students = await prisma.user.findMany({
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          branch: true,
          currentYear: true,
          phone: true,
          createdAt: true,
          _count: {
            select: { registrations: true },
          },
          registrations: {
            select: {
              id: true,
              status: true,
              createdAt: true,
              event: {
                select: {
                  id: true,
                  title: true,
                  date: true,
                  category: true,
                  venue: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      });

      return students.map((student) => ({
        id: student.id,
        name: student.name || "Unnamed Student",
        email: student.email,
        role: "Student",
        portal: student.branch || "N/A",
        currentYear: student.currentYear || "N/A",
        phone: student.phone || "",
        registrationCount: student._count.registrations,
        registrations: student.registrations.map((r) => ({
          id: r.id,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
          eventTitle: r.event.title,
          eventDate: r.event.date.toISOString(),
          eventCategory: r.event.category,
          eventVenue: r.event.venue,
        })),
        status: "Active",
        lastLogin: "Recently",
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || "Student")}&background=random`,
        isStudent: true,
      }));
    } catch (error) {
      logger.error({ err: error }, "Error fetching student users");
      return [];
    }
  },
  ["student-users"],
  { revalidate: 300, tags: ["students"] },
);

// Task 1.4: Use explicit `select` to exclude password hash from memory
const _getCachedAdminUsers = unstable_cache(
  async () => {
    try {
      const admins = await prisma.admin.findMany({
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          branch: true,
          clubId: true,
          profilePicture: true,
          createdAt: true,
        },
      });

      return admins.map((admin) => {
        // Role Mapping
        let roleDisplay = "Admin";
        switch (admin.role) {
          case "SUPER_ADMIN":
            roleDisplay = "Super Admin";
            break;
          case "BRANCH_ADMIN":
            roleDisplay = "Branch Admin";
            break;
          case "CLUB_COORDINATOR":
            roleDisplay = "Clubs";
            break;
          case "SPORTS_ADMIN":
            roleDisplay = "Sports";
            break;
          case "BRANCH_SPORTS_ADMIN":
            roleDisplay = "Branch Sports";
            break;
          case "HHO":
            roleDisplay = "HHO";
            break;
          case "EVENT_COORDINATOR":
            roleDisplay = "Event Coordinator";
            break;
          default:
            roleDisplay = admin.role;
        }

        // Portal Mapping
        let portalDisplay = "All";
        if (admin.role === "BRANCH_ADMIN")
          portalDisplay = admin.branch || "N/A";
        else if (admin.role === "CLUB_COORDINATOR")
          portalDisplay = admin.clubId || "N/A";
        else if (admin.role === "SPORTS_ADMIN") portalDisplay = "Sports";
        else if (admin.role === "BRANCH_SPORTS_ADMIN")
          portalDisplay = admin.branch || "Branch Sports";
        else if (admin.role === "HHO") portalDisplay = "HHO";

        return {
          id: admin.id,
          name: admin.name || "Unnamed Admin",
          email: admin.email,
          role: roleDisplay,
          portal: portalDisplay,
          status: "Active", // Default since schema doesn't have status
          lastLogin: "Recently", // Default
          avatar:
            admin.profilePicture ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(admin.name || "Admin")}&background=random`,
        };
      });
    } catch (error) {
      logger.error({ err: error }, "Error fetching admin users");
      return [];
    }
  },
  ["admin-users"],
  { revalidate: 300, tags: ["admins"] },
);

// ─────────────────────────────────────────────────────────
// Public Auth-Protected Exports
//
// Each exported function verifies SUPER_ADMIN session first,
// then delegates to the cached internal helper. The auth
// check is NOT cached (runs every request), while the DB
// query result IS cached (via unstable_cache above).
// ─────────────────────────────────────────────────────────

const EMPTY_STATS: SuperAdminStats = {
  totalEvents: {
    count: 0,
    trend: { value: "0", isPositive: true, comparisonText: "waiting" },
  },
  totalRegistrations: {
    count: 0,
    trend: { value: "0", isPositive: true, comparisonText: "waiting" },
  },
  pendingApprovals: {
    count: 0,
    trend: { value: "0", isPositive: true, comparisonText: "waiting" },
  },
  activeAnnouncements: {
    count: 0,
    trend: { value: "0", isPositive: true, comparisonText: "waiting" },
  },
};

export async function getSuperAdminStats() {
  if (!(await requireSuperAdmin())) return EMPTY_STATS;
  return _getCachedStats();
}

export async function getTodaysEvents() {
  if (!(await requireSuperAdmin())) return [];
  return _getCachedTodaysEvents();
}

export async function getRegistrationTrend() {
  if (!(await requireSuperAdmin()))
    return { Weekly: [], Monthly: [], Yearly: [] };
  return _getCachedRegistrationTrend();
}

export async function getPortalPerformance() {
  if (!(await requireSuperAdmin())) return [];
  return _getCachedPortalPerformance();
}

export async function getLiveEvents() {
  if (!(await requireSuperAdmin())) return [];
  return _getCachedLiveEvents();
}

export async function getAllWinners() {
  if (!(await requireSuperAdmin())) return [];
  return _getCachedAllWinners();
}

export async function getGlobalSchedule() {
  if (!(await requireSuperAdmin())) return [];
  return _getCachedGlobalSchedule();
}

export async function getPendingApprovals() {
  if (!(await requireSuperAdmin())) return [];
  return _getCachedPendingApprovals();
}

export async function getAdminUsers() {
  if (!(await requireSuperAdmin())) return [];
  return _getCachedAdminUsers();
}

export async function getStudentUsers() {
  if (!(await requireSuperAdmin())) return [];
  return _getCachedStudentUsers();
}

export async function getRecentAnnouncements() {
  if (!(await requireSuperAdmin())) return [];
  try {
    const announcements = await prisma.announcement.findMany({
      where: { status: "active" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        createdAt: true,
        creator: {
          select: { name: true, branch: true },
        },
      },
    });
    return announcements.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      category: a.category,
      date: a.createdAt.toLocaleDateString(),
      createdBy: a.creator?.name || "Admin",
    }));
  } catch (error) {
    logger.error({ err: error }, "Error fetching recent announcements");
    return [];
  }
}
