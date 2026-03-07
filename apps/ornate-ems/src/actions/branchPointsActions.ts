"use server";

import prisma from "@/lib/prisma";
import { executeAction } from "@/lib/api-utils";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { assertPermission, type User } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";
import { revalidateBranchPointsData } from "@/lib/revalidation";
import { MatchWinner } from "@/lib/generated/client";

const BRANCH_META: Record<string, { name: string; color: string }> = {
  CSE: { name: "Computer Science", color: "#3B82F6" },
  ECE: { name: "Electronics & Comm.", color: "#10B981" },
  EEE: { name: "Electrical & Electronics", color: "#8B5CF6" },
  MECH: { name: "Mechanical", color: "#F59E0B" },
  CIVIL: { name: "Civil Engineering", color: "#EF4444" },
};

const BRANCHES = Object.keys(BRANCH_META);

function extractBranch(teamName: string | null): string | null {
  if (!teamName) return null;
  const first = teamName.split(" ")[0]?.toUpperCase() || "";
  return BRANCH_META[first] ? first : null;
}

function extractBranchFromText(text: unknown): string | null {
  const source = String(text || "").toUpperCase();
  if (!source) return null;
  for (const branch of BRANCHES) {
    if (new RegExp(`\\b${branch}\\b`, "i").test(source)) return branch;
  }
  return null;
}

function extractBranchFromPosition(position: any): string | null {
  const fromTeam = extractBranchFromText(position?.teamName);
  if (fromTeam) return fromTeam;
  const members = Array.isArray(position?.members)
    ? position.members
    : typeof position?.members === "string"
      ? position.members
          .split(",")
          .map((m: string) => m.trim())
          .filter(Boolean)
      : [];
  for (const member of members) {
    const fromMember = extractBranchFromText(member);
    if (fromMember) return fromMember;
  }
  return null;
}

/**
 * Sync BranchPoints for a sport based on completed Grand Final or published winner announcement.
 * Called automatically after match completion or announcement publish — no auth needed.
 */
export async function syncBranchPointsForSport(sportId: string) {
  const sport = await prisma.sport.findUnique({
    where: { id: sportId },
    select: {
      id: true,
      category: true,
      winnerPoints: true,
      runnerUpPoints: true,
    },
  });
  if (!sport) return;

  let winnerBranch: string | null = null;
  let runnerBranch: string | null = null;

  if (sport.category === "TEAM") {
    const final = await prisma.match.findFirst({
      where: { sportId, matchId: "GF-M1", status: "COMPLETED" },
      select: { winner: true, team1Name: true, team2Name: true },
      orderBy: { updatedAt: "desc" },
    });
    if (!final || !final.winner) {
      await prisma.branchPoints.deleteMany({ where: { sportId } });
      await revalidateBranchPointsData();
      return;
    }
    const winnerTeamName =
      final.winner === MatchWinner.TEAM1 ? final.team1Name : final.team2Name;
    const runnerTeamName =
      final.winner === MatchWinner.TEAM1 ? final.team2Name : final.team1Name;
    winnerBranch = extractBranch(winnerTeamName);
    runnerBranch = extractBranch(runnerTeamName);
  } else {
    const announcement = await prisma.sportWinnerAnnouncement.findUnique({
      where: { sportId },
      select: { isPublished: true, positions: true },
    });
    if (!announcement || !announcement.isPublished) {
      await prisma.branchPoints.deleteMany({ where: { sportId } });
      await revalidateBranchPointsData();
      return;
    }
    const positions = Array.isArray(announcement.positions)
      ? announcement.positions
      : [];
    const firstPlace =
      positions.find((p: any) => Number(p?.rank) === 1) || positions[0];
    const secondPlace =
      positions.find((p: any) => Number(p?.rank) === 2) || positions[1];
    winnerBranch = extractBranchFromPosition(firstPlace);
    runnerBranch = extractBranchFromPosition(secondPlace);
  }

  // Preserve manual adjustments
  const existing = await prisma.branchPoints.findMany({
    where: { sportId },
    select: { branch: true, manualAdjustment: true, adjustmentReason: true },
  });
  const adjustmentMap = new Map(
    existing.map((e) => [
      e.branch,
      { adj: e.manualAdjustment, reason: e.adjustmentReason },
    ]),
  );

  await prisma.branchPoints.deleteMany({ where: { sportId } });

  const rows: Array<{
    sportId: string;
    branch: string;
    points: number;
    manualAdjustment: number;
    adjustmentReason: string | null;
  }> = [];
  if (winnerBranch) {
    const prev = adjustmentMap.get(winnerBranch);
    rows.push({
      sportId,
      branch: winnerBranch,
      points: sport.winnerPoints,
      manualAdjustment: prev?.adj || 0,
      adjustmentReason: prev?.reason || null,
    });
  }
  if (runnerBranch && runnerBranch !== winnerBranch) {
    const prev = adjustmentMap.get(runnerBranch);
    rows.push({
      sportId,
      branch: runnerBranch,
      points: sport.runnerUpPoints,
      manualAdjustment: prev?.adj || 0,
      adjustmentReason: prev?.reason || null,
    });
  }

  if (rows.length > 0) {
    await prisma.branchPoints.createMany({ data: rows });
  }
  await revalidateBranchPointsData();
}

export async function getBranchPointsBySport(sportId: string) {
  const user = await getAuthenticatedUser();
  if (!user) return { success: false, error: "Unauthorized" };

  return executeAction(async () => {
    const points = await prisma.branchPoints.findMany({
      where: { sportId },
      orderBy: [{ points: "desc" }, { branch: "asc" }],
    });

    return {
      success: true,
      data: points.map((row, index) => ({
        ...row,
        name: BRANCH_META[row.branch]?.name || row.branch,
        color: BRANCH_META[row.branch]?.color || "#6B7280",
        rank: index + 1,
      })),
    };
  }, "getBranchPointsBySport") as any;
}

export async function getOverallBranchStandings() {
  const user = await getAuthenticatedUser();
  if (!user) return { success: false, error: "Unauthorized" };

  return executeAction(async () => {
    const grouped = await prisma.branchPoints.groupBy({
      by: ["branch"],
      _sum: { points: true, manualAdjustment: true },
    });

    const standings = grouped
      .map((row) => ({
        branch: row.branch,
        name: BRANCH_META[row.branch]?.name || row.branch,
        color: BRANCH_META[row.branch]?.color || "#6B7280",
        points: (row._sum.points || 0) + (row._sum.manualAdjustment || 0),
      }))
      .sort((a, b) => b.points - a.points)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    return { success: true, data: standings };
  }, "getOverallBranchStandings") as any;
}

export async function updateBranchPoints(
  sportId: string,
  branch: string,
  points: number,
  adjustmentReason?: string,
) {
  const user = await getAuthenticatedUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    assertPermission(user as User, "manage:fixtures");
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Permission denied",
    };
  }

  return executeAction(async () => {
    const updated = await prisma.branchPoints.upsert({
      where: { sportId_branch: { sportId, branch } },
      create: {
        sportId,
        branch,
        points,
        manualAdjustment: 0,
        adjustmentReason: adjustmentReason || null,
      },
      update: { points, adjustmentReason: adjustmentReason || null },
    });

    await createAuditLog({
      action: "UPDATE_BRANCH_POINTS",
      entityType: "BRANCH_POINTS",
      entityId: updated.id,
      performedBy: user.id,
      metadata: { sportId, branch, points },
    });

    await revalidateBranchPointsData();
    return { success: true, data: updated };
  }, "updateBranchPoints") as any;
}

export async function recalculateBranchPoints(sportId: string) {
  const user = await getAuthenticatedUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    assertPermission(user as User, "manage:fixtures");
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Permission denied",
    };
  }

  return executeAction(async () => {
    const sport = await prisma.sport.findUnique({
      where: { id: sportId },
      select: { winnerPoints: true, runnerUpPoints: true },
    });
    if (!sport) throw new Error("Sport not found");

    const final = await prisma.match.findFirst({
      where: { sportId, matchId: "GF-M1", status: "COMPLETED" },
      select: { id: true, winner: true, team1Name: true, team2Name: true },
      orderBy: { updatedAt: "desc" },
    });

    if (!final || !final.winner) {
      await prisma.branchPoints.deleteMany({ where: { sportId } });
      await revalidateBranchPointsData();
      return {
        success: true,
        data: { recalculated: false, reason: "Final not completed yet" },
      };
    }

    const winnerTeamName =
      final.winner === MatchWinner.TEAM1 ? final.team1Name : final.team2Name;
    const runnerTeamName =
      final.winner === MatchWinner.TEAM1 ? final.team2Name : final.team1Name;

    const winnerBranch = extractBranch(winnerTeamName);
    const runnerBranch = extractBranch(runnerTeamName);

    await prisma.branchPoints.deleteMany({ where: { sportId } });

    const createRows: Array<{
      sportId: string;
      branch: string;
      points: number;
      manualAdjustment: number;
    }> = [];
    if (winnerBranch)
      createRows.push({
        sportId,
        branch: winnerBranch,
        points: sport.winnerPoints,
        manualAdjustment: 0,
      });
    if (runnerBranch)
      createRows.push({
        sportId,
        branch: runnerBranch,
        points: sport.runnerUpPoints,
        manualAdjustment: 0,
      });

    if (createRows.length > 0) {
      await prisma.branchPoints.createMany({ data: createRows });
    }

    await createAuditLog({
      action: "RECALCULATE_BRANCH_POINTS",
      entityType: "BRANCH_POINTS",
      entityId: sportId,
      performedBy: user.id,
      metadata: { sportId, rows: createRows.length },
    });

    await revalidateBranchPointsData();
    return {
      success: true,
      data: { recalculated: true, rows: createRows.length },
    };
  }, "recalculateBranchPoints") as any;
}
