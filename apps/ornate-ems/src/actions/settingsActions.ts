'use server';

import prisma from "@/lib/prisma";
import logger from '@/lib/logger';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidateSettings } from '@/lib/revalidation';
import { Prisma } from '@/lib/generated/client';
import { executeAction } from '@/lib/api-utils';

export interface SettingsActionResponse<T = unknown> {
    success: boolean;
    error?: string;
    message?: string;
    data?: T;
}

export interface HHOSettingsData {
    name: string | null;
    email: string;
    phone: string | null;
    bio: string | null;
    designation: string | null;
    role: string;
    branch: string | null;
    profilePicture: string | null;
    stats: {
        volunteers: number;
        events: number;
        fundsRaised: string;
    }
}

export interface HHOProfileData {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    bio: string | null;
    designation: string | null;
    role: string;
    profilePicture: string | null;
    createdAt: Date;
}

/**
 * Get HHO admin settings
 */
export async function getHHOSettings(): Promise<SettingsActionResponse<HHOSettingsData>> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const admin = await prisma.admin.findUnique({
            where: {
                email: session.user.email
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                bio: true,
                designation: true,
                role: true,
                branch: true,
                profilePicture: true,
                createdAt: true,
                _count: {
                    select: {
                        eventsCreated: true,
                        announcementsCreated: true,
                        promoVideosCreated: true
                    }
                }
            }
        });

        if (!admin) {
            return { success: false, error: "HHO ADMIN not found in database" };
        }

        // Get volunteer count (users who registered for HHO events)
        const hhoEvents = await prisma.event.findMany({
            where: { creatorId: admin.id },
            select: { id: true }
        });

        const eventIds = hhoEvents.map(e => e.id);

        const volunteerCount = await prisma.registration.count({
            where: {
                eventId: { in: eventIds },
                status: 'ATTENDED'
            }
        });

        // Calculate total funds raised (sum of all paid registrations for HHO events)
        const fundsData = await prisma.registration.aggregate({
            where: {
                eventId: { in: eventIds },
                paymentStatus: 'PAID'
            },
            _sum: {
                amount: true
            }
        });

        const fundsRaised = fundsData._sum.amount || 0;

        return {
            success: true,
            data: {
                name: admin.name,
                email: admin.email,
                phone: admin.phone,
                bio: admin.bio,
                designation: admin.designation,
                role: admin.role,
                branch: admin.branch,
                profilePicture: admin.profilePicture,
                stats: {
                    volunteers: volunteerCount,
                    events: admin._count.eventsCreated,
                    fundsRaised: `₹${fundsRaised.toLocaleString('en-IN')}`
                }
            }
        };
    } catch (error: unknown) {
        logger.error({ err: error }, 'Error fetching HHO settings');
        return { success: false, error: "Failed to fetch settings" };
    }
}

/**
 * Update HHO admin settings
 */
export async function updateHHOSettings(formData: { name?: string; phone?: string; description?: string; coordinator?: string; logo?: string }): Promise<SettingsActionResponse> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return { success: false, error: "Unauthorized" };
    }

    return executeAction(async () => {
        const updateData: Prisma.AdminUpdateInput = {};
        if (formData.name !== undefined) updateData.name = formData.name;
        if (formData.phone !== undefined) updateData.phone = formData.phone;
        if (formData.description !== undefined) updateData.bio = formData.description;
        if (formData.coordinator !== undefined) updateData.designation = formData.coordinator;
        if (formData.logo !== undefined) updateData.profilePicture = formData.logo;

        await prisma.admin.update({
            where: { email: session.user!.email! },
            data: updateData
        });

        await revalidateSettings();
        return { success: true, message: "Settings updated successfully" };
    }, 'updateHHOSettings');
}

/**
 * Get HHO admin profile data
 */
export async function getHHOProfile(): Promise<SettingsActionResponse<HHOProfileData>> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const admin = await prisma.admin.findUnique({
            where: {
                email: session.user.email
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                bio: true,
                designation: true,
                role: true,
                profilePicture: true,
                createdAt: true
            }
        });

        if (!admin) {
            return { success: false, error: "HHO Admin not found in database" };
        }

        return {
            success: true,
            data: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                phone: admin.phone,
                bio: admin.bio,
                designation: admin.designation,
                role: admin.role,
                profilePicture: admin.profilePicture,
                createdAt: admin.createdAt
            }
        };
    } catch (error: unknown) {
        logger.error({ err: error }, 'Error fetching HHO profile');
        return { success: false, error: "Failed to fetch profile" };
    }
}

/**
 * Update HHO admin profile data
 */
export async function updateHHOProfile(formData: { name?: string; phone?: string; bio?: string; designation?: string; profilePicture?: string }): Promise<SettingsActionResponse> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return { success: false, error: "Unauthorized" };
    }

    return executeAction(async () => {
        const updateData: Prisma.AdminUpdateInput = {};
        if (formData.name !== undefined) updateData.name = formData.name;
        if (formData.phone !== undefined) updateData.phone = formData.phone;
        if (formData.bio !== undefined) updateData.bio = formData.bio;
        if (formData.designation !== undefined) updateData.designation = formData.designation;
        if (formData.profilePicture !== undefined) updateData.profilePicture = formData.profilePicture;

        await prisma.admin.update({
            where: { email: session.user!.email! },
            data: updateData
        });

        await revalidateSettings();
        return { success: true, message: "Profile updated successfully" };
    }, 'updateHHOProfile');
}

