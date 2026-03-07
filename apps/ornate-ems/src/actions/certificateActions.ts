"use server";

import prisma from "@/lib/prisma";
import logger from "@/lib/logger";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidateCertificates } from "@/lib/revalidation";
import { generateQRCodeBuffer } from "@/lib/qrCode";
import {
  sendCertificateEmail,
  getParticipationEmailTemplate,
  getWinnerEmailTemplate,
} from "@/lib/email";
import type { EmailAttachment } from "@/lib/email";
import { Prisma, UserRole } from "@/lib/generated/client";
import { executeAction } from "@/lib/api-utils";

interface WinnerPosition {
  rank: string | number;
  members?: string[];
}

export interface CertificateActionResponse<T = unknown> {
  success: boolean;
  error?: string;
  message?: string;
  data?: T;
}

export interface FormattedCertEvent {
  id: string;
  title: string;
  date: string;
  certificateStatus: string;
  certificateTheme: string;
  certificateTemplates: Prisma.JsonValue;
  certificateIssuedAt: string | null;
  registrationsCount: number;
}

export interface CertTheme {
  id: string;
  name: string;
  preview: string;
  style: string;
  colors: string[];
}

/**
 * Fetch events available for certificate configuration.
 */
export async function getEventsForCertificates(
  filterCategory: string | null = null,
): Promise<CertificateActionResponse<FormattedCertEvent[]>> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email)
    return { success: false, error: "Unauthorized" };

  return executeAction(async () => {
    const admin = await prisma.admin.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true, branch: true, clubId: true },
    });

    if (!admin) throw new Error("Admin profile not found");

    let whereClause: Prisma.EventWhereInput = {};

    if (admin.role === "HHO") {
      whereClause = { creatorId: admin.id };
    } else if (admin.role === "SUPER_ADMIN") {
      whereClause = {};
    } else if (
      admin.role === "SPORTS_ADMIN" ||
      admin.role === "BRANCH_SPORTS_ADMIN"
    ) {
      whereClause = { creatorId: admin.id };
    } else if (admin.role === "CLUB_COORDINATOR") {
      whereClause = {
        creator: { clubId: admin.clubId ?? null },
      };
    } else {
      whereClause = {
        OR: [
          { creatorId: admin.id },
          { creator: { branch: admin.branch ?? null } },
        ],
      };
    }

    if (filterCategory) {
      let categoryFilter: Prisma.EventWhereInput = {};
      if (filterCategory === "Sports") {
        categoryFilter = {
          OR: [{ category: "Sports" }, { creator: { role: "SPORTS_ADMIN" } }],
        };
      } else if (filterCategory === "HHO") {
        categoryFilter = {
          OR: [{ category: "HHO" }, { creator: { role: "HHO" } }],
        };
      } else {
        categoryFilter = {
          OR: [
            { category: filterCategory },
            { title: { contains: filterCategory, mode: "insensitive" } },
          ],
        };
      }

      whereClause = { AND: [whereClause, categoryFilter] };
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        date: true,
        certificateStatus: true,
        certificateTheme: true,
        certificateTemplates: true,
        certificateIssuedAt: true,
        _count: { select: { registrations: true } },
      },
      orderBy: { date: "desc" },
    });

    const formattedEvents = events.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date.toISOString(),
      certificateStatus: e.certificateStatus || "DRAFT",
      certificateTheme: e.certificateTheme || "",
      certificateTemplates: e.certificateTemplates
        ? JSON.parse(JSON.stringify(e.certificateTemplates))
        : null,
      certificateIssuedAt: e.certificateIssuedAt
        ? e.certificateIssuedAt.toISOString()
        : null,
      registrationsCount: e._count.registrations || 0,
    }));

    return {
      success: true,
      data: formattedEvents,
    } as CertificateActionResponse<FormattedCertEvent[]>;
  }, "getEventsForCertificates");
}

export async function getSportsForCertificates(): Promise<
  CertificateActionResponse<FormattedCertEvent[]>
> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email)
    return { success: false, error: "Unauthorized" };

  return executeAction(async () => {
    const admin = await prisma.admin.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true },
    });

    if (!admin) throw new Error("Admin profile not found");

    if (
      !["SUPER_ADMIN", "SPORTS_ADMIN", "BRANCH_SPORTS_ADMIN"].includes(
        admin.role,
      )
    ) {
      throw new Error("Unauthorized");
    }

    const sports = await prisma.sport.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        gender: true,
        createdAt: true,
        certificateStatus: true,
        certificateTheme: true,
        certificateTemplates: true,
        certificateIssuedAt: true,
        _count: { select: { registrations: true } },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    const formattedSports = sports.map((sport) => ({
      id: sport.id,
      title: `${sport.name} (${sport.gender === "MALE" ? "Boys" : sport.gender === "FEMALE" ? "Girls" : "Mixed"})`,
      date: sport.createdAt.toISOString(),
      certificateStatus: sport.certificateStatus || "DRAFT",
      certificateTheme: sport.certificateTheme || "",
      certificateTemplates: sport.certificateTemplates
        ? JSON.parse(JSON.stringify(sport.certificateTemplates))
        : null,
      certificateIssuedAt: sport.certificateIssuedAt
        ? sport.certificateIssuedAt.toISOString()
        : null,
      registrationsCount: sport._count.registrations || 0,
    }));

    return {
      success: true,
      data: formattedSports,
    } as CertificateActionResponse<FormattedCertEvent[]>;
  }, "getSportsForCertificates");
}

export async function saveSportCertificateConfiguration(
  sportId: string,
  { themeId, templates }: { themeId: string; templates: Prisma.InputJsonValue },
): Promise<CertificateActionResponse> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email)
    return { success: false, error: "Unauthorized" };

  return executeAction(async () => {
    const admin = await prisma.admin.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true },
    });
    if (!admin) throw new Error("Admin not found");

    if (
      !["SUPER_ADMIN", "SPORTS_ADMIN", "BRANCH_SPORTS_ADMIN"].includes(
        admin.role,
      )
    ) {
      throw new Error("Unauthorized");
    }

    const sportCheck = await prisma.sport.findUnique({
      where: { id: sportId },
      select: { id: true },
    });
    if (!sportCheck) throw new Error("Sport not found");

    await prisma.sport.update({
      where: { id: sportId },
      data: {
        certificateTheme: themeId,
        certificateTemplates: templates || {},
        certificateStatus: "CONFIGURED",
      },
    });

    await revalidateCertificates();
    return { success: true } as CertificateActionResponse;
  }, "saveSportCertificateConfiguration");
}

export async function distributeSportCertificates(
  sportId: string,
): Promise<CertificateActionResponse> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email)
    return { success: false, error: "Unauthorized" };

  return executeAction(async () => {
    const admin = await prisma.admin.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true },
    });
    if (!admin) throw new Error("Admin not found");

    if (
      !["SUPER_ADMIN", "SPORTS_ADMIN", "BRANCH_SPORTS_ADMIN"].includes(
        admin.role,
      )
    ) {
      throw new Error("Unauthorized");
    }

    const sport = await prisma.sport.findUnique({
      where: { id: sportId },
      select: {
        id: true,
        name: true,
        gender: true,
        registrations: {
          where: { status: "CONFIRMED" },
          select: {
            id: true,
            studentName: true,
            studentId: true,
            email: true,
            branch: true,
          },
        },
        winnerAnnouncement: {
          select: { positions: true, isPublished: true },
        },
      },
    });
    if (!sport) throw new Error("Sport not found");

    const sportTitle = `${sport.name} (${sport.gender === "MALE" ? "Boys" : sport.gender === "FEMALE" ? "Girls" : "Mixed"})`;
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000";

    // Build a set of winner studentIds from the announcement positions
    const winnerMap = new Map<string, number>(); // studentId/name → rank
    if (
      sport.winnerAnnouncement?.isPublished &&
      sport.winnerAnnouncement.positions
    ) {
      const positions = Array.isArray(sport.winnerAnnouncement.positions)
        ? (sport.winnerAnnouncement.positions as unknown as WinnerPosition[])
        : [];
      for (const pos of positions) {
        const rank = parseInt(String(pos.rank));
        if (!rank || !pos.members) continue;
        for (const member of pos.members) {
          winnerMap.set(member.trim().toLowerCase(), rank);
        }
      }
    }

    let emailsSent = 0;
    let certsProcessed = 0;
    let errors = 0;

    for (const reg of sport.registrations) {
      try {
        // Determine if this registration is a winner
        const rank =
          winnerMap.get(reg.studentName.trim().toLowerCase()) ||
          winnerMap.get(reg.studentId.trim().toLowerCase()) ||
          null;

        const isWinner = rank !== null && rank >= 1 && rank <= 3;
        const certType = isWinner
          ? rank === 1
            ? "MERIT_FIRST"
            : rank === 2
              ? "MERIT_SECOND"
              : "MERIT_THIRD"
          : "PARTICIPATION";

        // Only send email if the registration has an email address
        if (!reg.email) continue;

        const verificationUrl = `${appUrl}/verify/sport/${reg.id}`;

        let attachments: EmailAttachment[] = [];
        try {
          const qrCodeBuffer = await generateQRCodeBuffer(verificationUrl);
          if (qrCodeBuffer) {
            attachments.push({
              filename: "qrcode.png",
              content: qrCodeBuffer,
              cid: "qrcode",
            });
          }
        } catch (qrErr) {
          logger.error(
            { err: qrErr, registrationId: reg.id },
            "Sport cert QR generation failed",
          );
        }

        const emailHtml = isWinner
          ? getWinnerEmailTemplate(
              reg.studentName,
              sportTitle,
              rank!,
              verificationUrl,
              reg.id,
            )
          : getParticipationEmailTemplate(
              reg.studentName,
              sportTitle,
              verificationUrl,
              reg.id,
            );

        const subject = isWinner
          ? `Certificate of Achievement: ${sportTitle}`
          : `Certificate of Participation: ${sportTitle}`;

        const result = await sendCertificateEmail(
          reg.email,
          subject,
          emailHtml,
          attachments,
        );
        if (result.success) emailsSent++;

        certsProcessed++;
      } catch (err) {
        errors++;
        logger.error(
          { err, sportId, registrationId: reg.id },
          "Failed to process sport certificate",
        );
      }
    }

    await prisma.sport.update({
      where: { id: sportId },
      data: {
        certificateStatus: "DISTRIBUTED",
        certificateIssuedAt: new Date(),
      },
    });

    logger.info(
      { sportId, certsProcessed, emailsSent, errors },
      "distributeSportCertificates.complete",
    );
    await revalidateCertificates();
    return {
      success: true,
      message: `Certificates distributed: ${emailsSent} emails sent out of ${sport.registrations.length} registrations${errors > 0 ? ` (${errors} errors)` : ""}.`,
    } as CertificateActionResponse;
  }, "distributeSportCertificates");
}

/**
 * Save certificate configuration for an event
 */
export async function saveCertificateConfiguration(
  eventId: string,
  { themeId, templates }: { themeId: string; templates: Prisma.InputJsonValue },
): Promise<CertificateActionResponse> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email)
    return { success: false, error: "Unauthorized" };

  return executeAction(async () => {
    const admin = await prisma.admin.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true, branch: true },
    });
    if (!admin) throw new Error("Admin not found");

    const eventCheck = await prisma.event.findUnique({
      where: { id: eventId },
      select: { creatorId: true, creator: { select: { branch: true } } },
    });

    if (!eventCheck) throw new Error("Event not found");
    const canAccess =
      admin.role === "SUPER_ADMIN" ||
      eventCheck.creatorId === admin.id ||
      (admin.role === "BRANCH_ADMIN" &&
        eventCheck.creator?.branch === admin.branch);
    if (!canAccess) throw new Error("Unauthorized");

    await prisma.event.update({
      where: { id: eventId },
      data: {
        certificateTheme: themeId,
        certificateTemplates: templates || {},
        certificateStatus: "CONFIGURED",
      },
    });

    await revalidateCertificates();
    return { success: true } as CertificateActionResponse;
  }, "saveCertificateConfiguration");
}

/**
 * Fetch certificate themes from database.
 * Security: Requires authentication.
 */
export async function getCertificateThemes(): Promise<
  CertificateActionResponse<CertTheme[]>
> {
  return executeAction(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return {
        success: false,
        error: "Unauthorized",
      } as CertificateActionResponse<CertTheme[]>;
    }

    const themes = await prisma.certificateTheme.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        preview: true,
        style: true,
        colors: true,
      },
    });

    const formattedThemes = themes.map((t) => ({
      id: t.id,
      name: t.name,
      preview:
        t.preview ||
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=450&fit=crop",
      style: t.style || "Classic",
      colors: t.colors || [],
    }));

    return {
      success: true,
      data: formattedThemes,
    } as CertificateActionResponse<CertTheme[]>;
  }, "getCertificateThemes");
}

/**
 * Master distribution function
 */
export async function distributeCertificates(
  eventId: string,
): Promise<CertificateActionResponse> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email)
    return { success: false, error: "Unauthorized" };

  return executeAction(async () => {
    const admin = await prisma.admin.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true, branch: true },
    });
    if (!admin) throw new Error("Admin not found");

    const eventCheck = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        creatorId: true,
        title: true,
        creator: { select: { branch: true } },
      },
    });

    if (!eventCheck) throw new Error("Event not found");
    const canAccess =
      admin.role === "SUPER_ADMIN" ||
      eventCheck.creatorId === admin.id ||
      (admin.role === "BRANCH_ADMIN" &&
        eventCheck.creator?.branch === admin.branch);
    if (!canAccess) throw new Error("Unauthorized");

    let winnerAnnouncement = await prisma.winnerAnnouncement.findUnique({
      where: { eventId },
      select: { id: true, positions: true },
    });

    if (!winnerAnnouncement) {
      let sport: string | null = null;
      if (eventCheck.title.includes("Cricket")) sport = "Cricket";
      else if (eventCheck.title.includes("Football")) sport = "Football";
      else if (eventCheck.title.includes("Basketball")) sport = "Basketball";
      else if (eventCheck.title.includes("Volleyball")) sport = "Volleyball";
      else if (eventCheck.title.includes("Kabaddi")) sport = "Kabaddi";
      else if (eventCheck.title.includes("Badminton")) sport = "Badminton";

      let autoAnnouncement = null;

      if (sport) {
        const finalMatch = await prisma.match.findFirst({
          where: {
            sport: {
              is: {
                name: sport,
              },
            },
            matchId: "GF-M1",
            status: "COMPLETED",
            winner: { not: null },
          },
          select: { id: true, winner: true, team1Name: true, team2Name: true },
          orderBy: { updatedAt: "desc" },
        });

        if (finalMatch && finalMatch.winner) {
          const winnerName =
            finalMatch.winner === "TEAM1"
              ? finalMatch.team1Name
              : finalMatch.team2Name;
          const runnerName =
            finalMatch.winner === "TEAM1"
              ? finalMatch.team2Name
              : finalMatch.team1Name;

          if (winnerName && runnerName) {
            autoAnnouncement = await prisma.winnerAnnouncement.create({
              data: {
                eventId: eventId,
                isPublished: true,
                publishedAt: new Date(),
                positions: [
                  { rank: "1", members: [winnerName] },
                  { rank: "2", members: [runnerName] },
                ] as Prisma.JsonArray,
              },
            });
          }
        }
      }

      if (!autoAnnouncement) {
        return {
          success: false,
          error:
            "Certificate distribution blocked. Please create and publish a Winner Announcement, or ensure the Tournament Final Match is marked as Completed.",
        };
      }

      winnerAnnouncement = autoAnnouncement;
    }

    await distributeWinnerCertificates(eventId);
    await distributeParticipationCertificates(eventId);

    await prisma.event.update({
      where: { id: eventId },
      data: {
        certificateStatus: "DISTRIBUTED",
        certificateIssuedAt: new Date(),
      },
    });

    if (winnerAnnouncement) {
      const positions = Array.isArray(winnerAnnouncement.positions)
        ? (winnerAnnouncement.positions as unknown as WinnerPosition[])
        : [];

      let winnerBranch: string | null = null;
      let runnerBranch: string | null = null;

      const extractBranch = (
        memberList: string[] | undefined,
      ): string | null => {
        if (!memberList || memberList.length === 0) return null;
        const firstMember = memberList[0];
        if (!firstMember) return null;

        const name = firstMember.toUpperCase();
        if (name.includes("MECH") || name.includes("MECHANICAL")) return "MECH";
        if (name.includes("CSE") || name.includes("COMPUTER")) return "CSE";
        if (name.includes("ECE") || name.includes("ELECTRONICS")) return "ECE";
        if (name.includes("EEE") || name.includes("ELECTRICAL")) return "EEE";
        if (name.includes("CIVIL")) return "CIVIL";

        const firstWord = name.split(" ")[0];
        if (
          firstWord &&
          ["CSE", "ECE", "EEE", "MECH", "CIVIL"].includes(firstWord)
        )
          return firstWord;
        return null;
      };

      positions.forEach((pos) => {
        if (pos && String(pos.rank) === "1")
          winnerBranch = extractBranch(pos.members as string[] | undefined);
        if (pos && String(pos.rank) === "2")
          runnerBranch = extractBranch(pos.members as string[] | undefined);
      });

      const notifications: Prisma.NotificationCreateManyInput[] = [];

      if (winnerBranch) {
        const winnerAdmin = await prisma.admin.findFirst({
          where: { branch: winnerBranch, role: "BRANCH_ADMIN" },
          select: { id: true, name: true },
        });
        if (winnerAdmin) {
          notifications.push({
            recipientId: winnerAdmin.id,
            recipientName: winnerAdmin.name || "Branch Admin",
            recipientRole: "BRANCH_ADMIN",
            message: `🎓 Certificates Distributed! Your team (Champions) can now access their certificates for ${eventCheck.title}.`,
            type: "achievement",
            priority: "high",
            senderId: "system",
            senderName: "System",
            senderRole: "SYSTEM",
          });
        }
      }

      if (runnerBranch) {
        const runnerAdmin = await prisma.admin.findFirst({
          where: { branch: runnerBranch, role: "BRANCH_ADMIN" },
          select: { id: true, name: true },
        });
        if (runnerAdmin) {
          notifications.push({
            recipientId: runnerAdmin.id,
            recipientName: runnerAdmin.name || "Branch Admin",
            recipientRole: "BRANCH_ADMIN",
            message: `🎓 Certificates Distributed! Your team (Runner-Ups) can now access their certificates for ${eventCheck.title}.`,
            type: "achievement",
            priority: "normal",
            senderId: "system",
            senderName: "System",
            senderRole: "SYSTEM",
          });
        }
      }

      if (notifications.length > 0) {
        await prisma.notification.createMany({ data: notifications });
      }
    }

    await revalidateCertificates();
    return {
      success: true,
      message:
        "Certificates distributed successfully to winners and participants.",
    } as CertificateActionResponse;
  }, "distributeCertificates");
}

/**
 * Generate and assign participation certificates
 * @internal Called by distributeCertificates — not directly callable as a server action.
 */
async function distributeParticipationCertificates(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      registrations: {
        where: { status: "ATTENDED" },
        include: { user: { select: { email: true } } },
      },
    },
  });

  if (!event) throw new Error("Event not found");

  for (const reg of event.registrations) {
    if (reg.rank && reg.rank >= 1 && reg.rank <= 3) continue;

    try {
      const publicUrl = `/api/certificates/download/${reg.id}`;

      await prisma.registration.update({
        where: { id: reg.id },
        data: {
          certificateUrl: publicUrl,
          certificateType: "PARTICIPATION",
          certificateIssuedAt: new Date(),
        },
      });

      const recipientEmail = reg.user?.email || reg.email;
      if (recipientEmail) {
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL ||
          process.env.NEXTAUTH_URL ||
          "http://localhost:3000";
        const verificationUrl = `${appUrl}/verify/${reg.id}`;

        let attachments: EmailAttachment[] = [];
        try {
          const qrCodeBuffer = await generateQRCodeBuffer(verificationUrl);
          if (qrCodeBuffer) {
            attachments.push({
              filename: "qrcode.png",
              content: qrCodeBuffer,
              cid: "qrcode",
            });
          }
        } catch (qrErr) {
          logger.error({ err: qrErr }, "QR Code Generation failed");
        }

        const emailHtml = getParticipationEmailTemplate(
          reg.studentName,
          event.title,
          verificationUrl,
          reg.id,
        );

        await sendCertificateEmail(
          recipientEmail,
          `Certificate of Participation: ${event.title}`,
          emailHtml,
          attachments,
        );
      }
    } catch (err) {
      logger.error(
        { err, registrationId: reg.id },
        "Failed to process participation cert",
      );
    }
  }
}

/**
 * Generate and assign winner certificates
 * @internal Called by distributeCertificates — not directly callable as a server action.
 */
async function distributeWinnerCertificates(eventId: string) {
  const winnerAnnouncement = await prisma.winnerAnnouncement.findUnique({
    where: { eventId },
    select: { id: true, positions: true },
  });

  if (winnerAnnouncement) {
    const positions = Array.isArray(winnerAnnouncement.positions)
      ? (winnerAnnouncement.positions as unknown as WinnerPosition[])
      : [];

    for (const pos of positions) {
      const rankStr = String(pos.rank);
      const members = pos.members;
      if (rankStr && members && Array.isArray(members)) {
        for (const member of members) {
          const identifier = (member as string).trim();
          if (!identifier) continue;

          if (identifier.includes("@")) {
            const user = await prisma.user.findUnique({
              where: { email: identifier },
              select: { id: true },
            });
            if (user) {
              await prisma.registration.updateMany({
                where: { eventId, userId: user.id },
                data: { rank: parseInt(rankStr) },
              });
            }
          } else if (
            /^[A-Za-z]\d{6}$/.test(identifier) ||
            /^\d{7}$/.test(identifier)
          ) {
            await prisma.registration.updateMany({
              where: {
                eventId,
                studentId: { equals: identifier, mode: "insensitive" },
              },
              data: { rank: parseInt(rankStr) },
            });
          } else {
            await prisma.registration.updateMany({
              where: {
                eventId,
                studentName: { equals: identifier, mode: "insensitive" },
              },
              data: { rank: parseInt(rankStr) },
            });
          }
        }
      }
    }
  }

  const winners = await prisma.registration.findMany({
    where: {
      eventId: eventId,
      rank: { in: [1, 2, 3] },
    },
    include: {
      event: true,
      user: { select: { email: true } },
    },
  });

  for (const winner of winners) {
    try {
      const publicUrl = `/api/certificates/download/${winner.id}`;
      let certType = "MERIT_FIRST";
      if (winner.rank === 2) certType = "MERIT_SECOND";
      else if (winner.rank === 3) certType = "MERIT_THIRD";

      await prisma.registration.update({
        where: { id: winner.id },
        data: {
          certificateUrl: publicUrl,
          certificateType: certType,
          certificateIssuedAt: new Date(),
        },
      });

      const recipientEmail = winner.user?.email || winner.email;
      if (recipientEmail) {
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL ||
          process.env.NEXTAUTH_URL ||
          "http://localhost:3000";
        const verificationUrl = `${appUrl}/verify/${winner.id}`;

        let attachments: EmailAttachment[] = [];
        try {
          const qrCodeBuffer = await generateQRCodeBuffer(verificationUrl);
          if (qrCodeBuffer) {
            attachments.push({
              filename: "qrcode.png",
              content: qrCodeBuffer,
              cid: "qrcode",
            });
          }
        } catch (qrErr) {
          logger.error({ err: qrErr }, "QR Code Generation failed");
        }

        const emailHtml = getWinnerEmailTemplate(
          winner.studentName,
          winner.event.title,
          winner.rank!,
          verificationUrl,
          winner.id,
        );

        await sendCertificateEmail(
          recipientEmail,
          `Certificate of Achievement: ${winner.event.title}`,
          emailHtml,
          attachments,
        );
      }
    } catch (err) {
      logger.error(
        { err, winnerId: winner.id },
        "Failed to process winner cert",
      );
    }
  }
}
