"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { executeAction } from "@/lib/api-utils";
import { assertPermission } from "@/lib/permissions";

export interface ActionResponse<T = unknown> {
  success?: boolean;
  data?: T;
  error?: string;
}

export interface WinnerAnnouncementPayload {
  eventId: string;
  positions: any[];
  isPublished: boolean;
}

export async function createWinnerAnnouncement(
  data: WinnerAnnouncementPayload,
): Promise<ActionResponse> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { error: "Unauthorized" };
  }

  return executeAction(async () => {
    const { eventId, positions, isPublished } = data;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { creatorId: true },
    });

    if (!event) throw new Error("Event not found");

    if (
      session.user.role !== "SUPER_ADMIN" &&
      event.creatorId !== session.user.id
    ) {
      throw new Error(
        "Unauthorized. You do not have permission to announce winners for this event.",
      );
    }

    const announcement = await prisma.winnerAnnouncement.upsert({
      where: { eventId },
      create: {
        eventId,
        positions,
        isPublished,
        publishedAt: isPublished ? new Date() : null,
      },
      update: {
        positions,
        isPublished,
        publishedAt: isPublished ? new Date() : null,
      },
    });

    revalidatePath("/(dashboard)/super-admin/events/winners", "page");
    revalidatePath("/(dashboard)/branch-admin/content/winners", "page");
    revalidatePath("/(dashboard)/clubs-portal/content/winners", "page");
    revalidatePath("/(dashboard)/hho/updates/winners", "page");
    revalidatePath("/(dashboard)/sports/winners", "page");

    return { success: true, data: announcement };
  }, "createWinnerAnnouncement");
}

export async function updateWinnerAnnouncement(
  id: string,
  data: WinnerAnnouncementPayload,
): Promise<ActionResponse> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { error: "Unauthorized" };
  }

  return executeAction(async () => {
    if (session.user.role !== "SUPER_ADMIN") {
      const currentAnn = await prisma.winnerAnnouncement.findUnique({
        where: { id },
        select: { id: true, event: { select: { creatorId: true } } },
      });
      if (!currentAnn || currentAnn.event.creatorId !== session.user.id) {
        throw new Error(
          "Unauthorized. You do not have permission to edit this announcement.",
        );
      }
    }

    const announcement = await prisma.winnerAnnouncement.update({
      where: { id },
      data: {
        eventId: data.eventId,
        positions: data.positions,
        isPublished: data.isPublished,
        publishedAt: data.isPublished ? new Date() : null,
      },
    });

    revalidatePath("/(dashboard)/super-admin/events/winners", "page");
    revalidatePath("/(dashboard)/branch-admin/content/winners", "page");
    revalidatePath("/(dashboard)/clubs-portal/content/winners", "page");
    revalidatePath("/(dashboard)/hho/updates/winners", "page");
    revalidatePath("/(dashboard)/sports/winners", "page");

    return { success: true, data: announcement };
  }, "updateWinnerAnnouncement");
}

export async function deleteWinnerAnnouncement(
  id: string,
): Promise<ActionResponse> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { error: "Unauthorized" };
  }

  return executeAction(async () => {
    await prisma.winnerAnnouncement.delete({
      where: { id },
    });

    revalidatePath("/(dashboard)/super-admin/events/winners", "page");
    revalidatePath("/(dashboard)/branch-admin/content/winners", "page");
    revalidatePath("/(dashboard)/clubs-portal/content/winners", "page");
    revalidatePath("/(dashboard)/hho/updates/winners", "page");
    revalidatePath("/(dashboard)/sports/winners", "page");

    return { success: true };
  }, "deleteWinnerAnnouncement");
}

export async function togglePublishWinnerAnnouncement(
  id: string,
  isPublished: boolean,
): Promise<ActionResponse> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { error: "Unauthorized" };
  }

  return executeAction(async () => {
    await prisma.winnerAnnouncement.update({
      where: { id },
      data: {
        isPublished,
        publishedAt: isPublished ? new Date() : null,
      },
    });

    revalidatePath("/(dashboard)/super-admin/events/winners", "page");
    revalidatePath("/(dashboard)/branch-admin/content/winners", "page");
    revalidatePath("/(dashboard)/clubs-portal/content/winners", "page");
    revalidatePath("/(dashboard)/hho/updates/winners", "page");
    revalidatePath("/(dashboard)/sports/winners", "page");

    return { success: true };
  }, "togglePublishWinnerAnnouncement");
}

export async function getWinnerAnnouncements(): Promise<ActionResponse<any[]>> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { error: "Unauthorized" };
  }

  return executeAction(async () => {
    let whereClause = {};
    if (session.user.role === "BRANCH_ADMIN") {
      whereClause = {
        event: { creator: { branch: session.user.branch ?? null } },
      };
    } else if (session.user.role !== "SUPER_ADMIN") {
      whereClause = {
        event: { creatorId: session.user.id },
      };
    }

    const data = await prisma.winnerAnnouncement.findMany({
      where: whereClause,
      include: {
        event: {
          include: {
            registrations: {
              where: { rank: { in: [1, 2, 3] } },
              select: {
                rank: true,
                studentName: true,
                studentId: true,
                team: {
                  select: {
                    members: {
                      select: {
                        name: true,
                        rollNumber: true,
                      },
                      orderBy: {
                        joinedAt: "asc",
                      },
                    },
                  },
                },
              },
              orderBy: [{ rank: "asc" }, { createdAt: "asc" }],
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data };
  }, "getWinnerAnnouncements");
}

export async function getEventsForWinners(): Promise<ActionResponse<any[]>> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { error: "Unauthorized" };
  }

  return executeAction(async () => {
    let whereClause = {};
    if (session.user.role === "BRANCH_ADMIN") {
      whereClause = { creator: { branch: session.user.branch ?? null } };
    } else if (session.user.role !== "SUPER_ADMIN") {
      whereClause = { creatorId: session.user.id };
    }

    const data = await prisma.event.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        category: true,
        date: true,
        winnerAnnouncement: true,
      },
      orderBy: { date: "desc" },
    });
    return { success: true, data };
  }, "getEventsForWinners");
}
