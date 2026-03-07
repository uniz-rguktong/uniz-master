"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePromo } from "@/lib/revalidation";
import { Prisma } from "@/lib/generated/client";
import type { ScopeUser } from "@/lib/auth-helpers";
import { executeAction } from "@/lib/api-utils";

export interface PromoActionResponse<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface FormattedPromoVideo {
  id: string;
  title: string;
  url: string;
  platform: string;
  thumbnail: string | null;
  status: string;
  views: number;
  duration: string;
  category: string;
  uploadDate: string;
  createdAt: string;
}

export interface FormattedBrandLogo {
  id: string;
  name: string;
  type: string;
  format: string;
  size: string;
  dimensions: string;
  url: string;
  thumbnail: string | null;
  status: string;
  uploadDate: string;
}

async function getSessionUser(): Promise<ScopeUser> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("Not authenticated");
  }
  return session.user as ScopeUser;
}

function buildPromoScope(
  user: ScopeUser,
): Prisma.PromoVideoWhereInput | Prisma.BrandLogoWhereInput {
  if (user.role === "SUPER_ADMIN") return {};
  return { creatorId: user.id };
}

interface CreatePromoVideoData {
  title: string;
  url: string;
  platform?: string;
  thumbnail?: string;
  status?: string;
  duration?: string;
  category?: string;
}

interface UpdatePromoVideoData {
  title?: string;
  url?: string;
  platform?: string;
  thumbnail?: string;
  status?: string;
  duration?: string;
  category?: string;
}

interface CreateBrandLogoData {
  name: string;
  type: string;
  format: string;
  size?: string;
  dimensions?: string;
  url: string;
  thumbnail?: string;
  status?: string;
}

interface UpdateBrandLogoData {
  name?: string;
  type?: string;
  format?: string;
  status?: string;
  url?: string;
  thumbnail?: string;
}

// --- PROMO VIDEOS ---

export async function getPromoVideos(): Promise<
  PromoActionResponse<FormattedPromoVideo[]>
> {
  try {
    const user = await getSessionUser();
    const scope = buildPromoScope(user) as Prisma.PromoVideoWhereInput;

    const videos = await prisma.promoVideo.findMany({
      where: scope,
      select: {
        id: true,
        title: true,
        url: true,
        platform: true,
        thumbnail: true,
        status: true,
        views: true,
        duration: true,
        category: true,
        uploadDate: true,
        createdAt: true,
        creatorId: true,
      },
      orderBy: { createdAt: "desc" },
    });
    const formatted: FormattedPromoVideo[] = videos.map((v) => ({
      id: v.id,
      title: v.title,
      url: v.url,
      platform: v.platform,
      thumbnail: v.thumbnail,
      status: v.status,
      views: v.views || 0,
      duration: v.duration || "0:00",
      category: v.category || "video",
      uploadDate: v.uploadDate.toISOString(),
      createdAt: v.createdAt.toISOString(),
    }));
    return { success: true, data: formatted };
  } catch (error) {
    return { success: false, error: "Failed to fetch videos" };
  }
}

export async function createPromoVideo(
  data: CreatePromoVideoData,
): Promise<PromoActionResponse<FormattedPromoVideo>> {
  return executeAction(async () => {
    const user = await getSessionUser();
    const admin = await prisma.admin.findUnique({
      where: { email: user.email },
      select: { id: true },
    });
    if (!admin) return { success: false, error: "Admin not found" };

    const video = await prisma.promoVideo.create({
      data: {
        title: data.title,
        url: data.url,
        platform: data.platform || "YouTube",
        thumbnail: data.thumbnail ?? null,
        status: data.status || "active",
        duration: data.duration ?? null,
        category: data.category || "video",
        creatorId: admin.id,
      },
    });

    void revalidatePromo();
    return {
      success: true,
      data: {
        id: video.id,
        title: video.title,
        url: video.url,
        platform: video.platform,
        thumbnail: video.thumbnail,
        status: video.status,
        views: video.views || 0,
        duration: video.duration || "0:00",
        category: video.category || "video",
        uploadDate: video.uploadDate.toISOString(),
        createdAt: video.createdAt.toISOString(),
      },
    };
  }, "createPromoVideo");
}

export async function updatePromoVideo(
  id: string,
  data: UpdatePromoVideoData,
): Promise<PromoActionResponse<Partial<FormattedPromoVideo>>> {
  return executeAction(async () => {
    const user = await getSessionUser();
    const admin = await prisma.admin.findUnique({
      where: { email: user.email },
      select: { id: true, role: true },
    });
    if (!admin) return { success: false, error: "Admin not found" };

    const videoCheck = await prisma.promoVideo.findUnique({
      where: { id },
      select: { creatorId: true },
    });

    if (!videoCheck) return { success: false, error: "Video not found" };

    const isAuthorized =
      admin.role === "SUPER_ADMIN" || videoCheck.creatorId === admin.id;
    if (!isAuthorized) return { success: false, error: "Unauthorized" };

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.url !== undefined) updateData.url = data.url;
    if (data.platform !== undefined) updateData.platform = data.platform;
    if (data.thumbnail !== undefined) updateData.thumbnail = data.thumbnail;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.category !== undefined) updateData.category = data.category;

    const video = await prisma.promoVideo.update({
      where: { id },
      data: updateData as Prisma.PromoVideoUpdateInput,
    });

    void revalidatePromo();
    return {
      success: true,
      data: {
        id: video.id,
        title: video.title,
        url: video.url,
        platform: video.platform,
        thumbnail: video.thumbnail,
        status: video.status,
      },
    };
  }, "updatePromoVideo");
}

export async function deletePromoVideo(
  id: string,
): Promise<PromoActionResponse> {
  return executeAction(async () => {
    const user = await getSessionUser();
    const admin = await prisma.admin.findUnique({
      where: { email: user.email },
      select: { id: true, role: true },
    });
    if (!admin) return { success: false, error: "Admin not found" };

    const videoCheck = await prisma.promoVideo.findUnique({
      where: { id },
      select: { creatorId: true },
    });

    if (!videoCheck) return { success: false, error: "Video not found" };

    const isAuthorized =
      admin.role === "SUPER_ADMIN" || videoCheck.creatorId === admin.id;
    if (!isAuthorized) return { success: false, error: "Unauthorized" };

    await prisma.promoVideo.delete({ where: { id } });
    await revalidatePromo();
    return { success: true };
  }, "deletePromoVideo");
}

// --- BRAND LOGOS ---

export async function getBrandLogos(): Promise<
  PromoActionResponse<FormattedBrandLogo[]>
> {
  try {
    const user = await getSessionUser();
    const scope = buildPromoScope(user) as Prisma.BrandLogoWhereInput;

    const logos = await prisma.brandLogo.findMany({
      where: scope,
      select: {
        id: true,
        name: true,
        type: true,
        format: true,
        size: true,
        dimensions: true,
        url: true,
        thumbnail: true,
        status: true,
        uploadDate: true,
        creatorId: true,
      },
      orderBy: { createdAt: "desc" },
    });
    const formattedLogos: FormattedBrandLogo[] = logos.map((l) => ({
      id: l.id,
      name: l.name,
      type: l.type,
      format: l.format,
      size: l.size || "N/A",
      dimensions: l.dimensions || "N/A",
      url: l.url,
      thumbnail: l.thumbnail,
      status: l.status,
      uploadDate: l.uploadDate.toISOString(),
    }));
    return { success: true, data: formattedLogos };
  } catch (error) {
    return { success: false, error: "Failed to fetch logos" };
  }
}

export async function createBrandLogo(
  data: CreateBrandLogoData,
): Promise<PromoActionResponse<Partial<FormattedBrandLogo>>> {
  return executeAction(async () => {
    const user = await getSessionUser();
    const admin = await prisma.admin.findUnique({
      where: { email: user.email },
      select: { id: true },
    });
    if (!admin) return { success: false, error: "Admin not found" };

    const logo = await prisma.brandLogo.create({
      data: {
        name: data.name,
        type: data.type,
        format: data.format,
        size: data.size ?? null,
        dimensions: data.dimensions ?? null,
        url: data.url,
        thumbnail: data.thumbnail ?? null,
        status: data.status || "active",
        creatorId: admin.id,
      },
    });

    await revalidatePromo();
    return {
      success: true,
      data: {
        id: logo.id,
        name: logo.name,
        type: logo.type,
        format: logo.format,
        url: logo.url,
        thumbnail: logo.thumbnail,
        status: logo.status,
      },
    };
  }, "createBrandLogo");
}

export async function updateBrandLogo(
  id: string,
  data: UpdateBrandLogoData,
): Promise<PromoActionResponse<Partial<FormattedBrandLogo>>> {
  return executeAction(async () => {
    const user = await getSessionUser();
    const admin = await prisma.admin.findUnique({
      where: { email: user.email },
      select: { id: true, role: true },
    });
    if (!admin) return { success: false, error: "Admin not found" };

    const logoCheck = await prisma.brandLogo.findUnique({
      where: { id },
      select: { creatorId: true },
    });

    if (!logoCheck) return { success: false, error: "Logo not found" };

    const isAuthorized =
      admin.role === "SUPER_ADMIN" || logoCheck.creatorId === admin.id;
    if (!isAuthorized) return { success: false, error: "Unauthorized" };

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.format !== undefined) updateData.format = data.format;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.url !== undefined) updateData.url = data.url;
    if (data.thumbnail !== undefined) updateData.thumbnail = data.thumbnail;

    const logo = await prisma.brandLogo.update({
      where: { id },
      data: updateData as Prisma.BrandLogoUpdateInput,
    });

    await revalidatePromo();
    return {
      success: true,
      data: {
        id: logo.id,
        name: logo.name,
        type: logo.type,
        format: logo.format,
        url: logo.url,
        thumbnail: logo.thumbnail,
        status: logo.status,
      },
    };
  }, "updateBrandLogo");
}

export async function deleteBrandLogo(
  id: string,
): Promise<PromoActionResponse> {
  return executeAction(async () => {
    const user = await getSessionUser();
    const admin = await prisma.admin.findUnique({
      where: { email: user.email },
      select: { id: true, role: true },
    });
    if (!admin) return { success: false, error: "Admin not found" };

    const logoCheck = await prisma.brandLogo.findUnique({
      where: { id },
      select: { creatorId: true },
    });

    if (!logoCheck) return { success: false, error: "Logo not found" };

    const isAuthorized =
      admin.role === "SUPER_ADMIN" || logoCheck.creatorId === admin.id;
    if (!isAuthorized) return { success: false, error: "Unauthorized" };

    await prisma.brandLogo.delete({ where: { id } });
    await revalidatePromo();
    return { success: true };
  }, "deleteBrandLogo");
}
