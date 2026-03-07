"use server";

import prisma from "@/lib/prisma";
import { executeAction } from "@/lib/api-utils";
import { unstable_cache } from "next/cache";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { TeamRole } from "@/lib/generated/client";

function normalizeMemberRole(role: TeamRole): string {
  if (role === TeamRole.LEADER) return "Captain";
  if (role === TeamRole.VICE_CAPTAIN) return "Vice Captain";
  return "Member";
}

function buildSportRegistrationWhere(user: {
  role: string;
  id: string;
  branch?: string | null;
}) {
  if (
    user.role === "SUPER_ADMIN" ||
    user.role === "SPORTS_ADMIN" ||
    user.role === "BRANCH_SPORTS_ADMIN"
  ) {
    return {};
  }

  if (user.role === "BRANCH_ADMIN" && user.branch) {
    return {
      branch: user.branch,
    };
  }

  return {};
}

const getCachedAllSportRegistrations = unstable_cache(
  async (userId: string, role: string, branch: string | null) => {
    const where = buildSportRegistrationWhere({ id: userId, role, branch });

    const registrations = await prisma.sportRegistration.findMany({
      where,
      include: {
        sport: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return registrations.map((registration) => ({
      id: registration.id,
      registrationId: registration.id.substring(0, 8).toUpperCase(),
      studentName: registration.studentName,
      email: registration.email || "N/A",
      rollNumber: registration.studentId,
      year: registration.year || "N/A",
      department: registration.branch || "N/A",
      branch: registration.branch || "N/A",
      section: registration.section || "N/A",
      phone: registration.phone || "N/A",
      eventName: registration.sport.name,
      eventType: registration.sport.category,
      registrationDate: registration.createdAt.toISOString(),
      status: registration.status.toLowerCase(),
      eventId: registration.sportId,
      paymentAmount: 0,
      transactionId: null,
    }));
  },
  ["all-sport-registrations-v1"],
  { tags: [CACHE_TAGS.sportRegistrations, CACHE_TAGS.sports], revalidate: 30 },
);

const getCachedSportTeamRegistrations = unstable_cache(
  async (userId: string, role: string, branch: string | null) => {
    const teamWhere: any = {};

    if (role === "BRANCH_ADMIN" && branch) {
      teamWhere.team = { members: { some: { department: branch } } };
    } else if (
      !["SUPER_ADMIN", "SPORTS_ADMIN", "BRANCH_SPORTS_ADMIN"].includes(role)
    ) {
      // Default: show all teams
    }

    const sportTeams = await prisma.sportTeam.findMany({
      where: teamWhere,
      include: {
        sport: {
          select: {
            id: true,
            name: true,
          },
        },
        team: {
          include: {
            members: {
              include: {
                sportRegistration: {
                  select: {
                    id: true,
                    status: true,
                  },
                },
              },
              orderBy: { joinedAt: "asc" },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return sportTeams.map((sportTeam) => {
      const captain =
        sportTeam.team.members.find(
          (member) => member.role === TeamRole.LEADER,
        ) ||
        sportTeam.team.members[0] ||
        null;

      return {
        id: sportTeam.team.id,
        registrationId: captain?.sportRegistration?.id || null,
        teamName: sportTeam.team.teamName,
        sport: sportTeam.sport.name,
        sportColor: "#3B82F6",
        captain: captain?.name || sportTeam.team.leaderName,
        viceCaptain:
          sportTeam.team.members.find(
            (member) => member.role === TeamRole.VICE_CAPTAIN,
          )?.name || "N/A",
        yearLevel: captain?.year || "N/A",
        status: (
          captain?.sportRegistration?.status || sportTeam.team.status
        ).toLowerCase(),
        eventId: sportTeam.sportId,
        eventType: "TEAM",
        registeredDate: sportTeam.createdAt.toISOString(),
        captainRoll: captain?.rollNumber || null,
        captainYear: captain?.year || null,
        captainBranch: captain?.department || null,
        captainSection: captain?.section || null,
        members: sportTeam.team.members.map((member) => ({
          id: member.id,
          name: member.name,
          studentId: member.rollNumber || "N/A",
          year: member.year || "N/A",
          section: member.section || "N/A",
          role: normalizeMemberRole(member.role),
          phoneNumber: member.phone || "N/A",
        })),
      };
    });
  },
  ["sport-team-registrations-v1"],
  { tags: [CACHE_TAGS.sportRegistrations, CACHE_TAGS.teams], revalidate: 30 },
);

export async function getAllSportRegistrations() {
  return executeAction(async () => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    const registrations = await getCachedAllSportRegistrations(
      user.id,
      user.role,
      user.branch || null,
    );

    return {
      success: true,
      data: { registrations },
    };
  }, "getAllSportRegistrations") as any;
}

export async function getSportTeamRegistrations() {
  return executeAction(async () => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    const teams = await getCachedSportTeamRegistrations(
      user.id,
      user.role,
      user.branch || null,
    );

    return {
      success: true,
      data: teams,
    };
  }, "getSportTeamRegistrations") as any;
}
