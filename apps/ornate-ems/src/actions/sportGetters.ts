"use server";

import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import type { AuthUser } from "@/lib/auth-helpers";
import { executeAction } from "@/lib/api-utils";
import { Prisma } from "@/lib/generated/client";
import { CACHE_TAGS } from "@/lib/cache-tags";

export interface FormattedSport {
  id: string;
  name: string;
  category: string | null;
  type: string;
  poster: string | null;
  venue: string;
  date: string;
  time: string;
  registrations: number;
  capacity: number | null;
  winnerPoints: number;
  runnerPoints: number;
  secondRunnerPoints: number;
  status: string;
  isArchived: boolean;
  isDraft: boolean;
}

export interface SportsDashboardStats {
  totalSports: number;
  activeTournaments: number;
  totalRegistrations: number;
  matchesCompleted: number;
  totalMatches: number;
  categoryBreakdown: { category: string; value: number; color: string }[];
}

export interface SportCalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  category: string;
  categoryColor: string;
  venue: string;
  registrations: number;
  capacity: number | null;
  posterUrl: string | null;
  description: string | null;
}

function buildSportWhereClause(user: AuthUser): Prisma.SportWhereInput {
  if (
    user.role === "SUPER_ADMIN" ||
    user.role === "SPORTS_ADMIN" ||
    user.role === "BRANCH_SPORTS_ADMIN"
  ) {
    return {};
  }

  if (user.role === "BRANCH_ADMIN" && user.branch) {
    return { isActive: true };
  }

  return { isActive: true };
}

function mapSportStatus(status: string): string {
  switch (status) {
    case "REGISTRATION_OPEN":
      return "Registration Open";
    case "ONGOING":
      return "Ongoing";
    case "COMPLETED":
      return "Completed";
    case "UPCOMING":
    default:
      return "Upcoming";
  }
}

function mapSportCategory(category: string): string {
  if (category === "INDIVIDUAL") return "Individual";
  if (category === "TEAM") return "Team";
  return category;
}

function mapSportGender(gender: string): string {
  if (gender === "MALE") return "Boys";
  if (gender === "FEMALE") return "Girls";
  return "Mixed";
}

function getSportCategoryColor(category: string): string {
  if (category === "Individual") return "#8B5CF6";
  if (category === "Team") return "#3B82F6";
  return "#10B981";
}

async function getCachedSports(
  userId: string,
  role: string,
  branch: string | null,
  clubId: string | null,
) {
  const user: AuthUser = {
    id: userId,
    role,
    email: "",
    branch,
    clubId,
  };

  const whereClause = buildSportWhereClause(user);

  const sports = await prisma.sport.findMany({
    where: whereClause,
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      category: true,
      gender: true,
      status: true,
      isActive: true,
      // Excluded bannerUrl here to prevent 2MB cache limit crash with Base64 images
      maxTeamsPerBranch: true,
      winnerPoints: true,
      runnerUpPoints: true,
      participationPoints: true,
      _count: {
        select: {
          registrations: true,
          matches: true,
          teams: true,
        },
      },
      matches: {
        select: {
          date: true,
          time: true,
          venue: true,
        },
        orderBy: [{ date: "asc" }, { createdAt: "asc" }],
        take: 1,
      },
    },
  });

  return sports.map((sport) => {
    const firstMatch = sport.matches[0] || null;
    const registrations = sport._count.registrations;
    const capacity = sport.maxTeamsPerBranch ?? null;

    return {
      id: sport.id,
      name: sport.name,
      category: mapSportCategory(sport.category),
      type: mapSportGender(sport.gender),
      poster: null, // Always null in list view to save bandwidth and prevent memory issues
      venue: firstMatch?.venue || "TBD",
      date: firstMatch?.date
        ? firstMatch.date.toISOString().split("T")[0]!
        : "TBD",
      time: firstMatch?.time || "TBD",
      registrations,
      capacity,
      winnerPoints: sport.winnerPoints,
      runnerPoints: sport.runnerUpPoints,
      secondRunnerPoints: sport.participationPoints,
      status: mapSportStatus(sport.status),
      isArchived: !sport.isActive,
      isDraft: false,
    };
  });
}

async function getCachedSportsDashboardStats(
  userId: string,
  role: string,
  branch: string | null,
  clubId: string | null,
) {
  const user: AuthUser = {
    id: userId,
    role,
    email: "",
    branch,
    clubId,
  };

  const whereClause = buildSportWhereClause(user);

  const sports = await prisma.sport.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      status: true,
      _count: {
        select: {
          registrations: true,
        },
      },
    },
  });

  const totalSports = sports.length;
  const activeTournaments = sports.filter(
    (sport) => sport.status === "ONGOING",
  ).length;
  const totalRegistrations = sports.reduce(
    (sum, sport) => sum + sport._count.registrations,
    0,
  );

  const sportIds = sports.map((sport) => sport.id);

  let totalMatches = 0;
  let matchesCompleted = 0;

  if (sportIds.length > 0) {
    totalMatches = await prisma.match.count({
      where: { sportId: { in: sportIds } },
    });
    matchesCompleted = await prisma.match.count({
      where: {
        sportId: { in: sportIds },
        status: "COMPLETED",
      },
    });
  }

  const categoryBreakdownMap = new Map<string, number>();
  for (const sport of sports) {
    const previous = categoryBreakdownMap.get(sport.name) || 0;
    categoryBreakdownMap.set(sport.name, previous + sport._count.registrations);
  }

  const colors = [
    "#3B82F6",
    "#10B981",
    "#8B5CF6",
    "#EF4444",
    "#F59E0B",
    "#06B6D4",
  ];
  const categoryBreakdown = Array.from(categoryBreakdownMap.entries())
    .map(([category, value], index) => ({
      category,
      value,
      color: colors[index % colors.length]!,
    }))
    .sort((a, b) => b.value - a.value);

  return {
    totalSports,
    activeTournaments,
    totalRegistrations,
    matchesCompleted,
    totalMatches,
    categoryBreakdown,
  };
}

const getCachedSportsListForFilter = unstable_cache(
  async () => {
    return prisma.sport.findMany({
      where: { isActive: true },
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
        gender: true,
      },
    });
  },
  ["sports-filter-list-v2"],
  { tags: [CACHE_TAGS.sports], revalidate: 120 },
);

const getCachedSportsCalendarEvents = unstable_cache(
  async (
    userId: string,
    role: string,
    branch: string | null,
    clubId: string | null,
  ) => {
    const user: AuthUser = {
      id: userId,
      role,
      email: "",
      branch,
      clubId,
    };

    const whereClause = buildSportWhereClause(user);

    const sports = await prisma.sport.findMany({
      where: whereClause,
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        category: true,
        // Excluded description and bannerUrl to prevent cache size crash
        registrationDeadline: true,
        maxTeamsPerBranch: true,
        createdAt: true,
        _count: {
          select: {
            registrations: true,
          },
        },
        matches: {
          select: {
            date: true,
            time: true,
            venue: true,
          },
          orderBy: [{ date: "asc" }, { createdAt: "asc" }],
          take: 1,
        },
      },
    });

    return sports.map((sport) => {
      const firstMatch = sport.matches[0] || null;
      const mappedCategory = mapSportCategory(sport.category);
      const dateSource =
        firstMatch?.date || sport.registrationDeadline || sport.createdAt;

      return {
        id: sport.id,
        title: sport.name,
        date: dateSource.toISOString().split("T")[0]!,
        time: firstMatch?.time || "TBD",
        category: mappedCategory,
        categoryColor: getSportCategoryColor(mappedCategory),
        venue: firstMatch?.venue || "TBD",
        registrations: sport._count.registrations,
        capacity: sport.maxTeamsPerBranch,
        posterUrl: null,
        description: null,
      };
    });
  },
  ["sports-calendar-events-v1"],
  { tags: [CACHE_TAGS.sports, CACHE_TAGS.fixtures], revalidate: 60 },
);

export async function getSports(): Promise<{
  success?: boolean;
  sports?: FormattedSport[];
  error?: string;
}> {
  return executeAction(async () => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    const sports = await getCachedSports(
      user.id,
      user.role,
      user.branch || null,
      user.clubId || null,
    );

    return {
      success: true,
      sports,
    };
  }, "getSports") as any;
}

export async function getSportsDashboardStats(): Promise<{
  success?: boolean;
  stats?: SportsDashboardStats;
  error?: string;
}> {
  return executeAction(async () => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    const stats = await getCachedSportsDashboardStats(
      user.id,
      user.role,
      user.branch || null,
      user.clubId || null,
    );

    return {
      success: true,
      stats,
    };
  }, "getSportsDashboardStats") as any;
}

export async function getSportsListForFilter(): Promise<{
  success?: boolean;
  sports?: Array<{
    id: string;
    name: string;
    gender: "MALE" | "FEMALE" | "MIXED";
  }>;
  error?: string;
}> {
  return executeAction(async () => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    const sports = await getCachedSportsListForFilter();

    return {
      success: true,
      sports,
    };
  }, "getSportsListForFilter") as any;
}

export async function getSportById(sportId: string): Promise<{
  success?: boolean;
  data?: Record<string, unknown>;
  error?: string;
}> {
  return executeAction(async () => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    const sport = await prisma.sport.findUnique({
      where: { id: sportId },
      select: {
        id: true,
        name: true,
        category: true,
        gender: true,
        format: true,
        description: true,
        status: true,
        isActive: true,
        bannerUrl: true,
        icon: true,
        maxTeamsPerBranch: true,
        minPlayersPerTeam: true,
        maxPlayersPerTeam: true,
        winnerPoints: true,
        runnerUpPoints: true,
        participationPoints: true,
        awards: true,
        eligibility: true,
        rules: true,
        registrationDeadline: true,
        matchDuration: true,
        matches: {
          select: { date: true, time: true, venue: true },
          orderBy: [{ date: "asc" }, { createdAt: "asc" }],
          take: 1,
        },
      },
    });

    if (!sport) throw new Error("Sport not found");

    // Derive sportCategory and athleticsType from the name
    // Names like "Athletics - 100M" → sportCategory: "Athletics", athleticsType: "100M"
    // Names like "Cricket" → sportCategory: "Cricket", athleticsType: ""
    let sportCategory = sport.name;
    let athleticsType = "";
    if (sport.name.startsWith("Athletics")) {
      sportCategory = "Athletics";
      const parts = sport.name.split(" - ");
      if (parts.length > 1) {
        athleticsType = parts.slice(1).join(" - ").trim();
      }
    }

    const firstMatch = sport.matches[0] || null;
    return {
      success: true,
      data: {
        id: sport.id,
        title: sport.name,
        name: sport.name,
        category: mapSportCategory(sport.category),
        gender: mapSportGender(sport.gender),
        format: sport.format,
        sportCategory,
        athleticsType,
        date: firstMatch?.date ? firstMatch.date.toISOString() : null,
        time: firstMatch?.time || null,
        venue: firstMatch?.venue || null,
        description: sport.description,
        rules: sport.rules,
        icon: sport.icon,
        maxTeamsPerBranch: sport.maxTeamsPerBranch,
        minPlayersPerTeam: sport.minPlayersPerTeam,
        maxPlayersPerTeam: sport.maxPlayersPerTeam,
        maxCapacity: sport.maxTeamsPerBranch,
        registrationDeadline: sport.registrationDeadline
          ? sport.registrationDeadline.toISOString()
          : null,
        matchDuration: sport.matchDuration,
        status: mapSportStatus(sport.status),
        posterUrl: sport.bannerUrl,
        bannerUrl: sport.bannerUrl,
        winnerPoints: sport.winnerPoints,
        runnerUpPoints: sport.runnerUpPoints,
        participationPoints: sport.participationPoints,
        awards: sport.awards,
        eligibility: sport.eligibility,
        customFields: {
          genderType: mapSportGender(sport.gender),
          type: mapSportGender(sport.gender),
          sportCategory,
          athleticsType,
          winnerPoints: sport.winnerPoints,
          runnerupPoints: sport.runnerUpPoints,
          participationPoints: sport.participationPoints,
          awards: sport.awards,
          eligibility: sport.eligibility,
        },
      },
    };
  }, "getSportById") as any;
}

export async function getSportsCalendarEvents(): Promise<{
  success?: boolean;
  data?: SportCalendarEvent[];
  error?: string;
}> {
  return executeAction(async () => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    const events = await getCachedSportsCalendarEvents(
      user.id,
      user.role,
      user.branch || null,
      user.clubId || null,
    );

    return {
      success: true,
      data: events,
    };
  }, "getSportsCalendarEvents") as any;
}
