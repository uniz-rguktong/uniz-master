"use server";

import prisma from "@/lib/prisma";
import { executeAction } from "@/lib/api-utils";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { assertPermission, type User } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";
import { revalidateSportData } from "@/lib/revalidation";
import { Prisma } from "@/lib/generated/client";
import { sendEmail } from "@/lib/email";
import { syncBranchPointsForSport } from "@/actions/branchPointsActions";

function toJsonValue(
  value: unknown,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === null || value === undefined) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
}

/** Build a rich winner certificate email body */
function buildWinnerCertificateEmail(
  branch: string,
  sportName: string,
  rank: number,
  certificateId: string,
): string {
  const rankLabel =
    rank === 1 ? "🥇 1st Place" : rank === 2 ? "🥈 2nd Place" : "🥉 3rd Place";
  const rankColor = rank === 1 ? "#D97706" : rank === 2 ? "#64748B" : "#C2410C";
  const bgColor = rank === 1 ? "#FFFBEB" : rank === 2 ? "#F8FAFC" : "#FFF7ED";

  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
      <!-- Header banner -->
      <div style="background:linear-gradient(135deg,#1a1a1a 0%,#374151 100%);padding:32px 24px;text-align:center;">
        <div style="font-size:48px;margin-bottom:8px;">🏆</div>
        <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:800;letter-spacing:1px;">ORNATE 2K26</h1>
        <p style="color:#9CA3AF;margin:4px 0 0 0;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Championship Results</p>
      </div>

      <!-- Certificate body -->
      <div style="padding:32px 24px;background:${bgColor};">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="font-size:40px;">${rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}</div>
          <h2 style="color:${rankColor};font-size:28px;font-weight:900;margin:8px 0 4px 0;">${rankLabel}</h2>
          <p style="color:#6B7280;font-size:14px;margin:0;">in <strong style="color:#1A1A1A;">${sportName}</strong></p>
        </div>

        <div style="background:#ffffff;border-radius:12px;padding:20px;margin-bottom:24px;border:2px solid ${rankColor}30;text-align:center;">
          <p style="color:#6B7280;font-size:11px;text-transform:uppercase;font-weight:700;margin:0 0 4px 0;letter-spacing:1px;">Awarded to</p>
          <p style="color:#1A1A1A;font-size:26px;font-weight:900;margin:0;">${branch}</p>
          <p style="color:#9CA3AF;font-size:12px;margin:4px 0 0 0;">Department</p>
        </div>

        <div style="background:#F3F4F6;border-radius:8px;padding:14px;text-align:center;margin-bottom:16px;">
          <p style="margin:0;color:#6B7280;font-size:11px;text-transform:uppercase;font-weight:700;letter-spacing:1px;">Certificate ID</p>
          <p style="margin:6px 0 0 0;color:#1A1A1A;font-family:monospace;font-size:18px;font-weight:900;">${certificateId}</p>
        </div>

        <p style="color:#6B7280;font-size:13px;text-align:center;margin:0;">
          This certificate is awarded in recognition of outstanding athletic performance at <strong>Ornate 2K26</strong>.
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#1A1A1A;padding:16px 24px;text-align:center;">
        <p style="color:#9CA3AF;font-size:11px;margin:0;">
          This is an official notification from <strong style="color:#ffffff;">Ornate Core</strong>. Please do not reply to this email.
        </p>
        <p style="color:#6B7280;font-size:10px;margin:6px 0 0 0;">Ornate 2K26 · RGUKT Ongole</p>
      </div>
    </div>`;
}

export async function createSportWinnerAnnouncement(
  sportId: string,
  positions: unknown,
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
    // Fetch sport config for points
    const sport = await prisma.sport.findUnique({
      where: { id: sportId },
      select: {
        name: true,
        winnerPoints: true,
        runnerUpPoints: true,
        participationPoints: true,
      },
    });
    const sportName = sport?.name || "Athletics Event";
    const isAthletics = sportName.toLowerCase().includes("athletic");

    const pts = {
      first: sport?.winnerPoints || (isAthletics ? 5 : 10),
      second: sport?.runnerUpPoints || (isAthletics ? 3 : 5),
      third: sport?.participationPoints || (isAthletics ? 1 : 0),
    };

    const announcement = await prisma.sportWinnerAnnouncement.upsert({
      where: { sportId },
      create: { sportId, positions: toJsonValue(positions), isPublished: true },
      update: { positions: toJsonValue(positions), isPublished: true },
    });

    // ── 1. Persist Branch Points ──
    const pos = positions as any;
    const branchTotals: Record<string, number> = {};

    const addPoints = (
      posKey: "first" | "second" | "third",
      awardPoints: number,
    ) => {
      const b = pos?.[posKey]?.branch;
      if (b) {
        branchTotals[b] = (branchTotals[b] || 0) + awardPoints;
      }
    };

    addPoints("first", pts.first);
    addPoints("second", pts.second);
    addPoints("third", pts.third);

    // Update BranchPoints table
    for (const [branch, points] of Object.entries(branchTotals)) {
      await prisma.branchPoints.upsert({
        where: { sportId_branch: { sportId, branch } },
        create: { sportId, branch, points },
        update: { points },
      });
    }

    await createAuditLog({
      action: "CREATE_SPORT_WINNER_ANNOUNCEMENT",
      entityType: "SPORT_WINNER_ANNOUNCEMENT",
      entityId: announcement.id,
      performedBy: user.id,
      metadata: { sportId, branches: Object.keys(branchTotals) },
    });

    // ── 2. Send winner emails (fire-and-forget) ──
    const placesToNotify = [
      { key: "first", rank: 1 },
      { key: "second", rank: 2 },
      { key: "third", rank: 3 },
    ];

    for (const { key, rank } of placesToNotify) {
      const winner = pos?.[key];
      const email = winner?.email?.trim();
      const branch =
        winner?.branch?.trim() || (typeof winner === "string" ? winner : "");

      if (!email || !branch) continue;

      const certId = `ORNATE-${sportId.slice(0, 6).toUpperCase()}-${rank}-${Date.now().toString(36).toUpperCase()}`;
      const subject = `🏆 Congratulations! You've won ${rank === 1 ? "Winner" : rank === 2 ? "Runner" : "2nd Runner"} in ${sportName} — Ornate 2K26`;
      const html = buildWinnerCertificateEmail(branch, sportName, rank, certId);

      sendEmail({ to: email, subject, html }).catch((err: any) =>
        console.error(`Winner email to ${email} failed:`, err?.message || err),
      );
    }

    await revalidateSportData();
    return { success: true, data: announcement };
  }, "createSportWinnerAnnouncement") as any;
}

export async function updateSportWinnerAnnouncement(
  id: string,
  data: { positions?: unknown; isPublished?: boolean },
) {
  const user = await getAuthenticatedUser();
  if (!user) return { success: false, error: "Unauthorized" };

  return executeAction(async () => {
    const updated = await prisma.sportWinnerAnnouncement.update({
      where: { id },
      data: {
        ...(data.positions !== undefined
          ? { positions: toJsonValue(data.positions) }
          : {}),
        ...(data.isPublished !== undefined
          ? { isPublished: data.isPublished }
          : {}),
      },
    });

    await createAuditLog({
      action: "UPDATE_SPORT_WINNER_ANNOUNCEMENT",
      entityType: "SPORT_WINNER_ANNOUNCEMENT",
      entityId: id,
      performedBy: user.id,
      metadata: { isPublished: data.isPublished ?? null },
    });

    if (data.isPublished !== undefined || data.positions !== undefined) {
      await syncBranchPointsForSport(updated.sportId);
    }

    await revalidateSportData();
    return { success: true, data: updated };
  }, "updateSportWinnerAnnouncement") as any;
}

export async function publishSportWinnerAnnouncement(id: string) {
  const user = await getAuthenticatedUser();
  if (!user) return { success: false, error: "Unauthorized" };

  return executeAction(async () => {
    const updated = await prisma.sportWinnerAnnouncement.update({
      where: { id },
      data: { isPublished: true, publishedAt: new Date() },
    });

    await createAuditLog({
      action: "PUBLISH_SPORT_WINNER_ANNOUNCEMENT",
      entityType: "SPORT_WINNER_ANNOUNCEMENT",
      entityId: id,
      performedBy: user.id,
    });

    await syncBranchPointsForSport(updated.sportId);
    await revalidateSportData();
    return { success: true, data: updated };
  }, "publishSportWinnerAnnouncement") as any;
}

export async function deleteSportWinnerAnnouncement(id: string) {
  const user = await getAuthenticatedUser();
  if (!user) return { success: false, error: "Unauthorized" };

  return executeAction(async () => {
    const existing = await prisma.sportWinnerAnnouncement.findUnique({
      where: { id },
      select: {
        id: true,
        sportId: true,
      },
    });

    if (!existing) throw new Error("Winner announcement not found");

    assertPermission(user as User, "manage:fixtures");

    await prisma.sportWinnerAnnouncement.delete({ where: { id } });

    await createAuditLog({
      action: "DELETE_SPORT_WINNER_ANNOUNCEMENT",
      entityType: "SPORT_WINNER_ANNOUNCEMENT",
      entityId: id,
      performedBy: user.id,
      metadata: { sportId: existing.sportId },
    });

    // Clear branch points when announcement is deleted
    await syncBranchPointsForSport(existing.sportId);
    await revalidateSportData();
    return { success: true };
  }, "deleteSportWinnerAnnouncement") as any;
}

export async function toggleSportWinnerAnnouncementPublish(
  id: string,
  isPublished: boolean,
) {
  const user = await getAuthenticatedUser();
  if (!user) return { success: false, error: "Unauthorized" };

  return executeAction(async () => {
    const existing = await prisma.sportWinnerAnnouncement.findUnique({
      where: { id },
      select: {
        id: true,
      },
    });

    if (!existing) throw new Error("Winner announcement not found");

    assertPermission(user as User, "manage:fixtures");

    const updated = await prisma.sportWinnerAnnouncement.update({
      where: { id },
      data: {
        isPublished,
        publishedAt: isPublished ? new Date() : null,
      },
    });

    await createAuditLog({
      action: "TOGGLE_SPORT_WINNER_ANNOUNCEMENT_PUBLISH",
      entityType: "SPORT_WINNER_ANNOUNCEMENT",
      entityId: id,
      performedBy: user.id,
      metadata: { isPublished },
    });

    await syncBranchPointsForSport(updated.sportId);
    await revalidateSportData();
    return { success: true, data: updated };
  }, "toggleSportWinnerAnnouncementPublish") as any;
}

export async function getSportWinnerAnnouncements() {
  const user = await getAuthenticatedUser();
  if (!user) return { success: false, error: "Unauthorized" };

  return executeAction(async () => {
    const whereClause: Prisma.SportWinnerAnnouncementWhereInput =
      user.role === "SUPER_ADMIN" ||
      user.role === "SPORTS_ADMIN" ||
      user.role === "BRANCH_SPORTS_ADMIN"
        ? {}
        : user.branch
          ? { sport: { isActive: true } }
          : {};

    const data = await prisma.sportWinnerAnnouncement.findMany({
      where: whereClause,
      include: {
        sport: {
          select: {
            id: true,
            name: true,
            gender: true,
            category: true,
            winnerPoints: true,
            runnerUpPoints: true,
            participationPoints: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data };
  }, "getSportWinnerAnnouncements") as any;
}

export async function getSportsForWinners() {
  const user = await getAuthenticatedUser();
  if (!user) return { success: false, error: "Unauthorized" };

  return executeAction(async () => {
    const whereClause: Prisma.SportWhereInput =
      user.role === "SUPER_ADMIN" ||
      user.role === "SPORTS_ADMIN" ||
      user.role === "BRANCH_SPORTS_ADMIN"
        ? { isActive: true }
        : { isActive: true };

    const data = await prisma.sport.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        category: true,
        createdAt: true,
        winnerAnnouncement: { select: { id: true } },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    return { success: true, data };
  }, "getSportsForWinners") as any;
}

export async function getSportWinnerAnnouncement(sportId: string) {
  const user = await getAuthenticatedUser();
  if (!user) return { success: false, error: "Unauthorized" };

  return executeAction(async () => {
    const announcement = await prisma.sportWinnerAnnouncement.findUnique({
      where: { sportId },
    });
    return { success: true, data: announcement };
  }, "getSportWinnerAnnouncement") as any;
}
