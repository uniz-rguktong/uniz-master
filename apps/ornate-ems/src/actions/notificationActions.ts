"use server";

import prisma from "@/lib/prisma";
import logger from "@/lib/logger";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@/lib/generated/client";
import { revalidateNotifications } from "@/lib/revalidation";
import { executeAction } from "@/lib/api-utils";

interface NotificationRecipient {
  id: string;
  name: string | null;
  branch: string | null;
  role: string;
  clubId?: string | null;
}

interface SendNotificationInput {
  recipientId: string;
  message: string;
  priority?: string;
  type?: string;
  recipientName?: string;
  recipientRole?: string;
}

/**
 * Get notifications for the logged-in user
 */
export async function getNotifications(isArchived = false, isSent = false) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      logger.error("[getNotifications] unauthorized (no session/email)");
      return { success: false, error: "Unauthorized" };
    }

    let dbUser: { id: string; email: string; role: string } | null =
      await prisma.admin.findFirst({
        where: { email: { equals: session.user.email, mode: "insensitive" } },
        select: { id: true, email: true, role: true },
      });

    if (!dbUser) {
      dbUser = await prisma.user.findFirst({
        where: { email: { equals: session.user.email, mode: "insensitive" } },
        select: { id: true, email: true, role: true },
      });
    }

    if (!dbUser) {
      logger.error(
        { email: session.user.email },
        "[getNotifications] User not found in ANY table",
      );
      return { success: false, error: "User not found in database" };
    }

    // Logic as per user request:
    let whereClause: Prisma.NotificationWhereInput = {};

    if (isSent) {
      whereClause = {
        senderId: dbUser.id,
        isArchived: isArchived,
      };
    } else {
      whereClause = {
        recipientId: dbUser.id,
        isArchived: isArchived,
      };

      // HHO specifically wants to see notifications from other admins
      if (dbUser.role === "HHO") {
        whereClause.senderRole = { not: "STUDENT" };
      }
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      select: {
        id: true,
        senderId: true,
        senderName: true,
        senderRole: true,
        senderBranch: true,
        recipientId: true,
        recipientName: true,
        recipientRole: true,
        message: true,
        isRead: true,
        isStarred: true,
        isArchived: true,
        priority: true,
        type: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    return { success: true, data: notifications };
  } catch (error: unknown) {
    logger.error({ err: error }, "Get Notifications Error");
    return { success: false, error: "Failed to fetch notifications" };
  }
}

/**
 * Resolve the DB user id from session (checks Admin then User table).
 * Used for ownership verification on notification mutations.
 */
async function resolveSessionUserId(session: {
  user?: { email?: string | null };
}): Promise<string | null> {
  if (!session?.user?.email) return null;
  const admin = await prisma.admin.findFirst({
    where: { email: { equals: session.user.email, mode: "insensitive" } },
    select: { id: true },
  });
  if (admin) return admin.id;
  const user = await prisma.user.findFirst({
    where: { email: { equals: session.user.email, mode: "insensitive" } },
    select: { id: true },
  });
  return user?.id ?? null;
}

/**
 * Toggle Read Status
 * Security: Verifies notification belongs to caller (recipientId or senderId).
 */
export async function toggleReadStatus(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Unauthorized" };

  return executeAction(async () => {
    const userId = await resolveSessionUserId(session);
    if (!userId) return { success: false, error: "User not found" };

    const notification = await prisma.notification.findFirst({
      where: { id, OR: [{ recipientId: userId }, { senderId: userId }] },
      select: { id: true, isRead: true },
    });
    if (!notification)
      return { success: false, error: "Notification not found" };

    await prisma.notification.update({
      where: { id },
      data: { isRead: !notification.isRead },
    });

    await revalidateNotifications();
    return { success: true };
  }, "toggleReadStatus");
}

/**
 * Mark as Read (Explicit)
 * Security: Verifies notification belongs to caller.
 */
export async function markAsRead(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Unauthorized" };

  return executeAction(async () => {
    const userId = await resolveSessionUserId(session);
    if (!userId) return { success: false, error: "User not found" };

    // Only update if caller owns this notification
    const result = await prisma.notification.updateMany({
      where: { id, recipientId: userId },
      data: { isRead: true },
    });
    if (result.count === 0)
      return { success: false, error: "Notification not found" };

    await revalidateNotifications();
    return { success: true };
  }, "markAsRead");
}

/**
 * Toggle Starred Status
 * Security: Verifies notification belongs to caller.
 */
export async function toggleStarStatus(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Unauthorized" };

  return executeAction(async () => {
    const userId = await resolveSessionUserId(session);
    if (!userId) return { success: false, error: "User not found" };

    const notification = await prisma.notification.findFirst({
      where: { id, OR: [{ recipientId: userId }, { senderId: userId }] },
      select: { id: true, isStarred: true },
    });
    if (!notification)
      return { success: false, error: "Notification not found" };

    await prisma.notification.update({
      where: { id },
      data: { isStarred: !notification.isStarred },
    });

    await revalidateNotifications();
    return { success: true };
  }, "toggleStarStatus");
}

/**
 * Toggle Archive Status
 * Security: Verifies notification belongs to caller.
 */
export async function toggleArchiveStatus(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Unauthorized" };

  return executeAction(async () => {
    const userId = await resolveSessionUserId(session);
    if (!userId) return { success: false, error: "User not found" };

    const notification = await prisma.notification.findFirst({
      where: { id, OR: [{ recipientId: userId }, { senderId: userId }] },
      select: { isArchived: true },
    });

    if (!notification)
      return { success: false, error: "Notification not found" };

    await prisma.notification.update({
      where: { id },
      data: { isArchived: !notification.isArchived },
    });

    await revalidateNotifications();
    return { success: true };
  }, "toggleArchiveStatus");
}

/**
 * Permanently Delete Notification
 * Security: Verifies notification belongs to caller before deletion.
 */
export async function deleteNotification(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Unauthorized" };

  return executeAction(async () => {
    const userId = await resolveSessionUserId(session);
    if (!userId) return { success: false, error: "User not found" };

    // Only delete if caller owns this notification
    const result = await prisma.notification.deleteMany({
      where: { id, OR: [{ recipientId: userId }, { senderId: userId }] },
    });
    if (result.count === 0)
      return { success: false, error: "Notification not found" };

    await revalidateNotifications();
    return { success: true };
  }, "deleteNotification");
}

/**
 * Send Notification / Compose Message
 */
export async function sendNotification(data: SendNotificationInput) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Unauthorized: No session" };
  if (!session.user?.email)
    return { success: false, error: "Unauthorized: No email in session" };

  return executeAction(async () => {
    const sender: {
      id: string;
      name: string | null;
      role: string;
      branch: string | null;
    } | null =
      (await prisma.admin.findUnique({
        where: { email: session.user!.email! },
        select: { id: true, name: true, role: true, branch: true },
      })) ||
      (await prisma.user.findUnique({
        where: { email: session.user!.email! },
        select: { id: true, name: true, role: true, branch: true },
      }));

    if (!sender) {
      return { success: false, error: "Sender not found" };
    }

    const { recipientId, message, priority, type } = data;

    if (!recipientId) {
      return { success: false, error: "Recipient is required" };
    }

    // Fetch recipient name and role for sent messages history
    let recipientName = data.recipientName;
    let recipientRole = data.recipientRole;

    if (!recipientName) {
      const recipient: { name: string | null; role: string } | null =
        (await prisma.admin.findUnique({
          where: { id: recipientId },
          select: { name: true, role: true },
        })) ||
        (await prisma.user.findFirst({
          where: { id: recipientId },
          select: { name: true, role: true },
        }));

      recipientName = recipient?.name || "Recipient";
      recipientRole = recipient?.role || "Recipient";
    }

    await prisma.notification.create({
      data: {
        senderId: sender.id,
        senderName: sender.name || "Admin",
        senderRole: sender.role || "Admin",
        senderBranch: sender.branch || "Main",
        recipientId,
        recipientName: recipientName || "Recipient",
        recipientRole: recipientRole || "Recipient",
        message,
        priority: priority || "medium",
        type: type || "admin",
      },
    });

    return { success: true, message: "Message sent successfully" };
  }, "sendNotification");
}

/**
 * Search Recipients (Admins, Students, or Clubs)
 */
export async function searchRecipients(
  query: string,
  type: "admin" | "student" | "club",
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "Unauthorized" };

    let results: NotificationRecipient[] = [];

    if (type === "admin") {
      const adminWhere =
        query.trim().length > 0
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" as const } },
                { email: { contains: query, mode: "insensitive" as const } },
                { branch: { contains: query, mode: "insensitive" as const } },
              ],
            }
          : null;

      results = await prisma.admin.findMany({
        ...(adminWhere ? { where: adminWhere } : {}),
        take: 200,
        select: {
          id: true,
          name: true,
          branch: true,
          role: true,
          clubId: true,
        },
      });
    } else if (type === "student") {
      results = await prisma.user.findMany({
        where: {
          role: "STUDENT",
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { branch: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 10,
        select: { id: true, name: true, branch: true, role: true },
      });
    } else if (type === "club") {
      const clubWhere =
        query.trim().length > 0
          ? {
              role: "CLUB_COORDINATOR" as const,
              OR: [
                { name: { contains: query, mode: "insensitive" as const } },
                { clubId: { contains: query, mode: "insensitive" as const } },
              ],
            }
          : {
              role: "CLUB_COORDINATOR" as const,
            };

      results = await prisma.admin.findMany({
        where: clubWhere,
        take: 200,
        select: {
          id: true,
          name: true,
          branch: true,
          role: true,
          clubId: true,
        },
      });
    }

    return { success: true, data: results };
  } catch (error: unknown) {
    return { success: false, error: "Failed to search recipients" };
  }
}
