'use server'

import prisma from "@/lib/prisma"
import logger from '@/lib/logger'
import { getServerSession } from "next-auth"
import { revalidateBrand } from '@/lib/revalidation'
import { authOptions } from "@/lib/auth"
import type { PromoVideo, BrandLogo, Prisma } from "@/lib/generated/client"
import type { ScopeUser } from '@/lib/auth-helpers'
import { executeAction } from '@/lib/api-utils'

export interface BrandActionResponse<T = unknown> {
    success: boolean;
    error?: string;
    videos?: T;
    video?: T;
    logos?: T;
    logo?: T;
    views?: number;
}

function buildBrandScope(user: ScopeUser): Prisma.PromoVideoWhereInput | Prisma.BrandLogoWhereInput {
    if (user.role === 'SUPER_ADMIN') return {};
    return { creatorId: user.id };
}

interface CreatePromoVideoData {
    title: string;
    url: string;
    platform?: string;
    status?: string;
    thumbnail?: string;
    duration?: string;
    category?: string;
}

interface UpdatePromoVideoData {
    title?: string;
    url?: string;
    platform?: string;
    status?: string;
    thumbnail?: string;
    category?: string;
}

interface CreateBrandLogoData {
    name: string;
    type: string;
    format: string;
    status?: string;
    url: string;
    thumbnail?: string;
    size?: string;
    dimensions?: string;
}

interface UpdateBrandLogoData {
    name?: string;
    type?: string;
    format?: string;
    status?: string;
    url?: string;
    thumbnail?: string;
}

// Promo Videos
export async function getPromoVideos(): Promise<BrandActionResponse<PromoVideo[]>> {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return { success: false, error: "Unauthorized" }
        }

        const admin = await prisma.admin.findUnique({
            where: { email: session.user.email! },
            select: { id: true, role: true, email: true, branch: true, clubId: true }
        });

        if (!admin) return { success: false, error: "Admin not found" };

        const scope = buildBrandScope(admin) as Prisma.PromoVideoWhereInput;

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
                createdAt: true,
                updatedAt: true,
                uploadDate: true,
                creatorId: true,
            },
            orderBy: { createdAt: 'desc' },
        })
        return { success: true, videos }
    } catch (error) {
        logger.error({ err: error }, 'Failed to fetch promo videos')
        return { success: false, error: "Failed to fetch videos" }
    }
}

export async function createPromoVideo(data: CreatePromoVideoData): Promise<BrandActionResponse<PromoVideo>> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return { success: false, error: "Unauthorized" }
    }

    return executeAction(async () => {
        const admin = await prisma.admin.findUnique({
            where: { email: session.user!.email! },
            select: { id: true, role: true }
        });

        if (!admin) return { success: false, error: "Admin not found" };
        if (admin.role === 'BRANCH_SPORTS_ADMIN') return { success: false, error: "Unauthorized: View-only access" };

        const video = await prisma.promoVideo.create({
            data: {
                title: data.title,
                url: data.url,
                platform: data.platform || "YouTube",
                status: data.status || "active",
                thumbnail: data.thumbnail ?? null,
                duration: data.duration || "N/A",
                category: data.category || "video",
                views: 0,
                creatorId: admin.id
            }
        })
        await revalidateBrand()
        return { success: true, video }
    }, 'createPromoVideo');
}

export async function incrementVideoViews(id: string): Promise<BrandActionResponse> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return { success: false, error: "Unauthorized" };
    }

    return executeAction(async () => {
        const video = await prisma.promoVideo.update({
            where: { id },
            data: {
                views: {
                    increment: 1
                }
            }
        });
        await revalidateBrand();
        return { success: true, views: video.views };
    }, 'incrementVideoViews');
}

export async function updatePromoVideo(id: string, data: UpdatePromoVideoData): Promise<BrandActionResponse<PromoVideo>> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return { success: false, error: "Unauthorized" };

    return executeAction(async () => {
        const admin = await prisma.admin.findUnique({
            where: { email: session.user!.email! },
            select: { id: true, role: true }
        });

        if (!admin) return { success: false, error: "Admin not found" };

        // Ownership check
        const videoCheck = await prisma.promoVideo.findUnique({
            where: { id },
            select: { creatorId: true }
        });

        const isAuthorized = (admin.role === 'HHO' || admin.role === 'SUPER_ADMIN' || admin.role === 'SPORTS_ADMIN' || videoCheck?.creatorId === admin.id) && admin.role !== 'BRANCH_SPORTS_ADMIN';
        if (!videoCheck || !isAuthorized) {
            return { success: false, error: "Unauthorized: You do not have permission or have view-only access" };
        }

        const updateData: Record<string, unknown> = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.url !== undefined) updateData.url = data.url;
        if (data.platform !== undefined) updateData.platform = data.platform;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.thumbnail) updateData.thumbnail = data.thumbnail;
        if (data.category !== undefined) updateData.category = data.category;

        const video = await prisma.promoVideo.update({
            where: { id },
            data: updateData as Prisma.PromoVideoUpdateInput
        })
        await revalidateBrand()
        return { success: true, video }
    }, 'updatePromoVideo');
}

export async function deletePromoVideo(id: string): Promise<BrandActionResponse> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return { success: false, error: "Unauthorized" };

    return executeAction(async () => {
        const admin = await prisma.admin.findUnique({
            where: { email: session.user!.email! },
            select: { id: true, role: true }
        });

        if (!admin) return { success: false, error: "Admin not found" };

        // Ownership check
        const videoCheck = await prisma.promoVideo.findUnique({
            where: { id },
            select: { creatorId: true }
        });

        const isAuthorized = (admin.role === 'HHO' || admin.role === 'SUPER_ADMIN' || admin.role === 'SPORTS_ADMIN' || videoCheck?.creatorId === admin.id) && admin.role !== 'BRANCH_SPORTS_ADMIN';
        if (!videoCheck || !isAuthorized) {
            return { success: false, error: "Unauthorized: You do not have permission or have view-only access" };
        }

        await prisma.promoVideo.delete({
            where: { id }
        })
        await revalidateBrand()
        return { success: true }
    }, 'deletePromoVideo');
}

// Brand Logos
export async function getBrandLogos(): Promise<BrandActionResponse<BrandLogo[]>> {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return { success: false, error: "Unauthorized" }
        }

        const admin = await prisma.admin.findUnique({
            where: { email: session.user.email! },
            select: { id: true, role: true, email: true, branch: true, clubId: true }
        });

        if (!admin) return { success: false, error: "Admin not found" };

        const scope = buildBrandScope(admin) as Prisma.BrandLogoWhereInput;

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
                createdAt: true,
                updatedAt: true,
                uploadDate: true,
                creatorId: true,
            },
            orderBy: { createdAt: 'desc' },
        })
        return { success: true, logos }
    } catch (error) {
        logger.error({ err: error }, 'Failed to fetch brand logos')
        return { success: false, error: "Failed to fetch logos" }
    }
}

export async function createBrandLogo(data: CreateBrandLogoData): Promise<BrandActionResponse<BrandLogo>> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return { success: false, error: "Unauthorized" }
    }

    return executeAction(async () => {
        const admin = await prisma.admin.findUnique({
            where: { email: session.user!.email! },
            select: { id: true, role: true }
        });

        if (!admin) return { success: false, error: "Admin not found" };
        if (admin.role === 'BRANCH_SPORTS_ADMIN') return { success: false, error: "Unauthorized: View-only access" };

        const logo = await prisma.brandLogo.create({
            data: {
                name: data.name,
                type: data.type,
                format: data.format,
                status: data.status || "active",
                url: data.url,
                thumbnail: data.thumbnail || data.url,
                size: data.size || "Unknown",
                dimensions: data.dimensions || "Unknown",
                creatorId: admin.id
            }
        })
        void revalidateBrand()
        return { success: true, logo }
    }, 'createBrandLogo');
}

export async function updateBrandLogo(id: string, data: UpdateBrandLogoData): Promise<BrandActionResponse<BrandLogo>> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return { success: false, error: "Unauthorized" };

    return executeAction(async () => {
        const admin = await prisma.admin.findUnique({
            where: { email: session.user!.email! },
            select: { id: true, role: true }
        });

        if (!admin) return { success: false, error: "Admin not found" };

        // Ownership check
        const logoCheck = await prisma.brandLogo.findUnique({
            where: { id },
            select: { creatorId: true }
        });

        const isAuthorized = (admin.role === 'HHO' || admin.role === 'SUPER_ADMIN' || admin.role === 'SPORTS_ADMIN' || logoCheck?.creatorId === admin.id) && admin.role !== 'BRANCH_SPORTS_ADMIN';
        if (!logoCheck || !isAuthorized) {
            return { success: false, error: "Unauthorized: You do not have permission or have view-only access" };
        }

        const updateData: Record<string, unknown> = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.type !== undefined) updateData.type = data.type;
        if (data.format !== undefined) updateData.format = data.format;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.url) updateData.url = data.url;
        if (data.thumbnail) updateData.thumbnail = data.thumbnail;

        const logo = await prisma.brandLogo.update({
            where: { id },
            data: updateData as Prisma.BrandLogoUpdateInput
        })
        void revalidateBrand()
        return { success: true, logo }
    }, 'updateBrandLogo');
}

export async function deleteBrandLogo(id: string): Promise<BrandActionResponse> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return { success: false, error: "Unauthorized" };

    return executeAction(async () => {
        const admin = await prisma.admin.findUnique({
            where: { email: session.user!.email! },
            select: { id: true, role: true }
        });

        if (!admin) return { success: false, error: "Admin not found" };

        // Ownership check
        const logoCheck = await prisma.brandLogo.findUnique({
            where: { id },
            select: { creatorId: true }
        });

        const isAuthorized = (admin.role === 'HHO' || admin.role === 'SUPER_ADMIN' || admin.role === 'SPORTS_ADMIN' || logoCheck?.creatorId === admin.id) && admin.role !== 'BRANCH_SPORTS_ADMIN';
        if (!logoCheck || !isAuthorized) {
            return { success: false, error: "Unauthorized: You do not have permission or have view-only access" };
        }

        await prisma.brandLogo.delete({
            where: { id }
        })
        await revalidateBrand()
        return { success: true }
    }, 'deleteBrandLogo');
}

