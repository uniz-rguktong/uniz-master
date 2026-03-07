"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidateAnnouncements } from "@/lib/revalidation";
import { executeAction } from "@/lib/api-utils";
import { getCategoryColor } from "@/lib/constants";
import { sendEmail, getAnnouncementEmailTemplate } from "@/lib/email";
import { Prisma } from "@/lib/generated/client";
import type { ScopeUser } from "@/lib/auth-helpers";

interface CreateAnnouncementData {
  title: string;
  content: string;
  category: string;
  targetAudience: string;
  expiryDate: string;
  isPinned?: boolean;
  notify?: boolean;
}

interface UpdateAnnouncementData {
  title?: string;
  content?: string;
  category?: string;
  targetAudience?: string;
  expiryDate?: string;
}

interface AnnouncementRecipient {
  id: string;
  email: string;
  name: string | null;
}

export interface AnnouncementActionResponse<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface FormattedAnnouncement {
  id: string;
  title: string;
  content: string;
  category: string;
  targetAudience: string;
  isPinned: boolean;
  status: string;
  viewCount: number;
  createdBy: string;
  createdDate: string;
  expiryDate: string;
  categoryColor: string;
}

function buildAnnouncementScope(
  user: ScopeUser,
): Prisma.AnnouncementWhereInput {
  // Return empty where clause so that all announcements/updates
  // are visible to all admins across the platform as requested.
  return {};
}

export async function createAnnouncement(
  data: CreateAnnouncementData,
): Promise<AnnouncementActionResponse<FormattedAnnouncement>> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email)
    return { success: false, error: "Unauthorized" };

  return executeAction(async () => {
    const admin = await prisma.admin.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true, name: true, branch: true, clubId: true },
    });

    if (!admin) return { success: false, error: "Admin not found" };

    const {
      title,
      content,
      category,
      targetAudience,
      expiryDate,
      isPinned,
      notify,
    } = data;
    const expiry = new Date(expiryDate);

    if (admin.role === "BRANCH_ADMIN") {
      const now = new Date();
      const expiryDateOnly = new Date(
        expiry.getFullYear(),
        expiry.getMonth(),
        expiry.getDate(),
      ).getTime();
      const createdDateOnly = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      ).getTime();
      if (!(expiryDateOnly > createdDateOnly)) {
        return {
          success: false,
          error: "Expiry date must be greater than creation date",
        };
      }
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        category,
        targetAudience,
        expiryDate: expiry,
        isPinned: isPinned || false,
        creatorId: admin.id,
        status: "active",
      },
      include: {
        creator: {
          select: { name: true, branch: true, role: true },
        },
      },
    });

    let recipients: AnnouncementRecipient[] = [];
    if (targetAudience === "Global (All Users)") {
      const allStudents = await prisma.user.findMany({
        where: { role: "STUDENT" },
        select: { id: true, email: true, name: true },
      });
      const allAdmins = await prisma.admin.findMany({
        select: { id: true, email: true, name: true },
      });
      recipients = [...allStudents, ...allAdmins];
    } else if (targetAudience === "All Students") {
      recipients = await prisma.user.findMany({
        where: { role: "STUDENT" },
        select: { id: true, email: true, name: true },
      });
    } else if (
      ["I Year", "II Year", "III Year", "IV Year"].includes(targetAudience)
    ) {
      recipients = await prisma.user.findMany({
        where: { role: "STUDENT", currentYear: targetAudience },
        select: { id: true, email: true, name: true },
      });
    } else if (targetAudience === "Registered Participants") {
      recipients = await prisma.user.findMany({
        where: { registrations: { some: { status: "CONFIRMED" } } },
        select: { id: true, email: true, name: true },
      });
    } else if (targetAudience === "Paid Event Registrants") {
      recipients = await prisma.user.findMany({
        where: {
          registrations: {
            some: { status: "CONFIRMED", event: { price: { gt: 0 } } },
          },
        },
        select: { id: true, email: true, name: true },
      });
    } else if (targetAudience === "Workshop Participants") {
      recipients = await prisma.user.findMany({
        where: {
          registrations: {
            some: { status: "CONFIRMED", event: { eventType: "Workshop" } },
          },
        },
        select: { id: true, email: true, name: true },
      });
    }

    if (recipients.length > 0) {
      if (notify) {
        const emailHtml = getAnnouncementEmailTemplate(
          title,
          content,
          category,
          admin.name || "Admin",
        );
        await Promise.allSettled(
          recipients.map((r) =>
            sendEmail({
              to: r.email,
              subject: `New Announcement: ${title}`,
              html: emailHtml,
            }),
          ),
        );
      }
    }

    await revalidateAnnouncements();

    return {
      success: true,
      data: {
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        category: announcement.category,
        targetAudience: announcement.targetAudience,
        isPinned: announcement.isPinned,
        status: announcement.status,
        viewCount: announcement.viewCount || 0,
        createdBy:
          announcement.creator?.role === "SPORTS_ADMIN" ||
          announcement.creator?.role === "BRANCH_SPORTS_ADMIN"
            ? "Sports Admin"
            : `${admin.branch ? admin.branch.toUpperCase() + " " : ""}Admin`,
        createdDate: announcement.createdAt.toISOString(),
        expiryDate: announcement.expiryDate.toISOString(),
        categoryColor: getCategoryColor(announcement.category),
      },
    };
  }, "createAnnouncement");
}

export async function getAnnouncements(): Promise<
  AnnouncementActionResponse<FormattedAnnouncement[]>
> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Unauthorized" };

  return executeAction(async () => {
    const scope = buildAnnouncementScope(session.user as ScopeUser);

    const announcements = await prisma.announcement.findMany({
      where: scope,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        targetAudience: true,
        isPinned: true,
        status: true,
        viewCount: true,
        createdAt: true,
        expiryDate: true,
        creator: {
          select: { name: true, branch: true, role: true },
        },
      },
    });

    const formatted: FormattedAnnouncement[] = announcements.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      category: a.category,
      targetAudience: a.targetAudience,
      isPinned: a.isPinned,
      status: a.status,
      viewCount: a.viewCount || 0,
      createdBy:
        a.creator?.role === "SPORTS_ADMIN" ||
        a.creator?.role === "BRANCH_SPORTS_ADMIN"
          ? "Sports Admin"
          : `${a.creator?.branch ? a.creator.branch.toUpperCase() + " " : ""}Admin`,
      createdDate: a.createdAt.toISOString(),
      expiryDate: a.expiryDate.toISOString(),
      categoryColor: getCategoryColor(a.category),
    }));

    return { success: true, data: formatted };
  }, "getAnnouncements");
}

export async function updateAnnouncement(
  id: string,
  data: UpdateAnnouncementData,
): Promise<AnnouncementActionResponse<FormattedAnnouncement>> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email)
    return { success: false, error: "Unauthorized" };

  return executeAction(async () => {
    const admin = await prisma.admin.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true, name: true, branch: true, clubId: true },
    });

    if (!admin) return { success: false, error: "Admin not found" };

    const announcementCheck = await prisma.announcement.findUnique({
      where: { id },
      select: { creatorId: true, createdAt: true },
    });

    if (!announcementCheck)
      return { success: false, error: "Announcement not found" };

    const isAuthorized =
      admin.role === "SUPER_ADMIN" || announcementCheck.creatorId === admin.id;
    if (!isAuthorized) return { success: false, error: "Unauthorized" };

    const { title, content, category, targetAudience, expiryDate } = data;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (category !== undefined) updateData.category = category;
    if (targetAudience !== undefined)
      updateData.targetAudience = targetAudience;
    if (expiryDate !== undefined) {
      const parsedExpiry = new Date(expiryDate);
      if (admin.role === "BRANCH_ADMIN") {
        const expiryDateOnly = new Date(
          parsedExpiry.getFullYear(),
          parsedExpiry.getMonth(),
          parsedExpiry.getDate(),
        ).getTime();
        const createdDateOnly = new Date(
          announcementCheck.createdAt.getFullYear(),
          announcementCheck.createdAt.getMonth(),
          announcementCheck.createdAt.getDate(),
        ).getTime();
        if (!(expiryDateOnly > createdDateOnly)) {
          return {
            success: false,
            error: "Expiry date must be greater than creation date",
          };
        }
      }
      updateData.expiryDate = parsedExpiry;
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: updateData as Prisma.AnnouncementUpdateInput,
      include: {
        creator: { select: { branch: true, role: true } },
      },
    });

    await revalidateAnnouncements();

    return {
      success: true,
      data: {
        id: updated.id,
        title: updated.title,
        content: updated.content,
        category: updated.category,
        targetAudience: updated.targetAudience,
        isPinned: updated.isPinned,
        status: updated.status,
        viewCount: updated.viewCount || 0,
        createdBy:
          updated.creator?.role === "SPORTS_ADMIN" ||
          updated.creator?.role === "BRANCH_SPORTS_ADMIN"
            ? "Sports Admin"
            : `${updated.creator?.branch ? updated.creator.branch.toUpperCase() + " " : ""}Admin`,
        createdDate: updated.createdAt.toISOString(),
        expiryDate: updated.expiryDate.toISOString(),
        categoryColor: getCategoryColor(updated.category),
      },
    };
  }, "updateAnnouncement");
}

export async function deleteAnnouncement(
  id: string,
): Promise<AnnouncementActionResponse> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email)
    return { success: false, error: "Unauthorized" };

  return executeAction(async () => {
    const admin = await prisma.admin.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true, name: true, branch: true, clubId: true },
    });

    if (!admin) return { success: false, error: "Admin not found" };

    const announcement = await prisma.announcement.findUnique({
      where: { id },
      select: { creatorId: true },
    });

    if (!announcement)
      return { success: false, error: "Announcement not found" };

    if (announcement.creatorId !== admin.id && admin.role !== "SUPER_ADMIN") {
      return {
        success: false,
        error: "You do not have permission to delete this announcement",
      };
    }

    await prisma.announcement.delete({ where: { id } });
    await revalidateAnnouncements();
    return { success: true };
  }, "deleteAnnouncement");
}

export async function incrementViewCount(
  id: string,
): Promise<AnnouncementActionResponse> {
  return executeAction(async () => {
    await prisma.announcement.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
    return { success: true };
  }, "incrementViewCount");
}
