'use server';

import prisma from "@/lib/prisma";
import logger from '@/lib/logger';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidateClubSettings } from '@/lib/revalidation';
import { hash, compare } from "bcryptjs";
import { Prisma } from '@/lib/generated/client';
import { executeAction } from '@/lib/api-utils';

export interface ClubSettingsActionResponse<T = unknown> {
    success: boolean;
    error?: string;
    message?: string;
    data?: T;
    settings?: T;
    integrations?: T;
}

export interface ClubSettingsData {
    name: string;
    shortName: string;
    coordinator: string;
    establishedYear: number;
    description: string;
    email: string;
    phone: string;
    logo: string | null;
    stats?: {
        members: number;
        events: number;
    }
}

export interface AdminProfileData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    designation: string;
    bio: string;
    clubName: string;
    profilePicture: string | null;
    preferences: Prisma.JsonValue;
    notificationSettings: Prisma.JsonValue;
}

// --- Club Settings ---

export async function getClubSettings(): Promise<ClubSettingsActionResponse<ClubSettingsData>> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const admin = await prisma.admin.findUnique({
            where: { email: session.user.email },
            select: {
                id: true,
                clubId: true,
                name: true,
                email: true,
                phone: true,
                bio: true,
                profilePicture: true,
                preferences: true,
                createdAt: true
            }
        });

        if (!admin) return { success: false, error: "Admin not found" };

        const preferences = (admin.preferences as Record<string, unknown>) || {};

        const adminData: ClubSettingsData = {
            name: admin.clubId || "My Club",
            shortName: (preferences.shortName as string) || "",
            coordinator: admin.name || "",
            establishedYear: (preferences.establishedYear as number) || new Date().getFullYear(),
            description: admin.bio || "",
            email: admin.email,
            phone: admin.phone || "",
            logo: admin.profilePicture || null
        };

        const activeEventsCount = await prisma.event.count({
            where: {
                creatorId: admin.id,
                status: { not: 'DRAFT' }
            }
        });

        const registrations = await prisma.registration.findMany({
            where: {
                event: {
                    creatorId: admin.id
                }
            },
            select: {
                studentId: true
            },
            distinct: ['studentId']
        });

        return {
            success: true,
            data: {
                ...adminData,
                stats: {
                    members: registrations.length,
                    events: activeEventsCount
                }
            }
        };
    } catch (error) {
        logger.error({ err: error }, 'Error fetching club settings');
        return { success: false, error: "Failed to fetch settings" };
    }
}

export async function updateClubSettings(formData: { name?: string; shortName?: string; coordinator?: string; establishedYear?: number; description?: string; phone?: string; logo?: string; stats?: Record<string, unknown> }): Promise<ClubSettingsActionResponse> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return { success: false, error: "Unauthorized" };
    }

    return executeAction(async () => {
        const currentAdmin = await prisma.admin.findUnique({
            where: { email: session.user!.email! },
            select: { preferences: true }
        });

        const currentPrefs = (currentAdmin?.preferences as Record<string, unknown>) || {};

        const updatedPreferences = {
            ...currentPrefs,
            shortName: formData.shortName,
            establishedYear: formData.establishedYear,
        };

        if (formData.stats) {
            (updatedPreferences as Record<string, unknown>).stats = formData.stats;
        }

        const data: Record<string, unknown> = {};
        if (formData.name !== undefined) data.clubId = formData.name;
        if (formData.coordinator !== undefined) data.name = formData.coordinator;
        if (formData.phone !== undefined) data.phone = formData.phone;
        if (formData.description !== undefined) data.bio = formData.description;
        if (formData.logo !== undefined) data.profilePicture = formData.logo;
        data.preferences = updatedPreferences;

        await prisma.admin.update({
            where: { email: session.user!.email! },
            data: data as Prisma.AdminUpdateInput
        });

        await revalidateClubSettings();
        return { success: true, message: "Club settings updated successfully" };
    }, 'updateClubSettings');
}

// --- Admin Profile ---

export async function getAdminProfile(): Promise<ClubSettingsActionResponse<AdminProfileData>> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const admin = await prisma.admin.findUnique({
            where: { email: session.user.email },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                bio: true,
                designation: true,
                profilePicture: true,
                clubId: true,
                preferences: true,
                notificationSettings: true
            }
        });

        if (!admin) return { success: false, error: "Admin not found" };

        return {
            success: true,
            data: {
                firstName: admin.name ? (admin.name.split(' ')[0] || "") : "",
                lastName: admin.name ? (admin.name.split(' ').slice(1).join(' ') || "") : "",
                email: admin.email,
                phone: admin.phone || "",
                designation: admin.designation || "Coordinator",
                bio: admin.bio || "",
                clubName: admin.clubId || "Club",
                profilePicture: admin.profilePicture,
                preferences: admin.preferences || {},
                notificationSettings: admin.notificationSettings || {}
            }
        };
    } catch (error) {
        logger.error({ err: error }, 'Error fetching admin profile');
        return { success: false, error: "Failed to fetch profile" };
    }
}

export async function updateAdminProfile(data: { firstName?: string; lastName?: string; phone?: string; bio?: string; designation?: string; profilePicture?: string; preferences?: Prisma.InputJsonValue; notificationSettings?: Prisma.InputJsonValue; currentPassword?: string; newPassword?: string }): Promise<ClubSettingsActionResponse> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return { success: false, error: "Unauthorized" };
    }

    return executeAction(async () => {
        const updateData: Prisma.AdminUpdateInput = {};
        if (data.firstName || data.lastName) {
            updateData.name = `${data.firstName || ''} ${data.lastName || ''}`.trim();
        }
        if (data.phone !== undefined) updateData.phone = data.phone;
        if (data.bio !== undefined) updateData.bio = data.bio;
        if (data.designation !== undefined) updateData.designation = data.designation;
        if (data.profilePicture !== undefined) updateData.profilePicture = data.profilePicture;
        if (data.preferences !== undefined) updateData.preferences = data.preferences as Prisma.InputJsonValue;
        if (data.notificationSettings !== undefined) updateData.notificationSettings = data.notificationSettings as Prisma.InputJsonValue;

        if (data.newPassword) {
            if (!data.currentPassword) {
                return { success: false, error: "Current password is required to set a new password." };
            }

            const adminAuth = await prisma.admin.findUnique({
                where: { email: session.user!.email! },
                select: { password: true }
            });

            if (!adminAuth?.password) {
                return { success: false, error: "Account security error. Please contact support." };
            }

            const isValid = await compare(data.currentPassword, adminAuth.password);
            if (!isValid) {
                return { success: false, error: "Incorrect current password." };
            }

            updateData.password = await hash(data.newPassword, 10);
        }

        await prisma.admin.update({
            where: { email: session.user!.email! },
            data: updateData
        });

        await revalidateClubSettings();
        return { success: true, message: "Profile updated successfully" };
    }, 'updateAdminProfile');
}

// --- Notification Settings ---

export async function getNotificationSettings(): Promise<ClubSettingsActionResponse> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const admin = await prisma.admin.findUnique({
            where: { email: session.user.email },
            select: { notificationSettings: true }
        });

        return {
            success: true,
            settings: admin?.notificationSettings || {}
        };
    } catch (error) {
        logger.error({ err: error }, 'Error fetching notifications');
        return { success: false, error: "Failed to fetch settings" };
    }
}

export async function updateNotificationSettings(settings: Prisma.InputJsonValue): Promise<ClubSettingsActionResponse> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return { success: false, error: "Unauthorized" };
    }

    return executeAction(async () => {
        await prisma.admin.update({
            where: { email: session.user!.email! },
            data: { notificationSettings: settings }
        });

        await revalidateClubSettings();
        return { success: true, message: "Notification preferences saved" };
    }, 'updateNotificationSettings');
}

// --- Integrations ---

export async function getIntegrationSettings(): Promise<ClubSettingsActionResponse> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const admin = await prisma.admin.findUnique({
            where: { email: session.user.email },
            select: { preferences: true }
        });

        const prefs = (admin?.preferences as Record<string, unknown>) || {};
        return {
            success: true,
            integrations: prefs.integrations || []
        };
    } catch (error) {
        logger.error({ err: error }, 'Error fetching integrations');
        return { success: false, error: "Failed to fetch integrations" };
    }
}

export async function updateIntegrationSettings(integrations: Prisma.InputJsonValue[]): Promise<ClubSettingsActionResponse> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return { success: false, error: "Unauthorized" };
    }

    return executeAction(async () => {
        const admin = await prisma.admin.findUnique({
            where: { email: session.user!.email! },
            select: { preferences: true }
        });

        const currentPrefs = (admin?.preferences as Record<string, unknown>) || {};

        await prisma.admin.update({
            where: { email: session.user!.email! },
            data: {
                preferences: {
                    ...currentPrefs,
                    integrations: integrations
                }
            }
        });

        await revalidateClubSettings();
        return { success: true, message: "Integrations updated" };
    }, 'updateIntegrationSettings');
}

