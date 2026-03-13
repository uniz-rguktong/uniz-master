'use server';

import prisma from '@/lib/prisma';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { revalidateAdminProfile } from '@/lib/revalidation';
import { Prisma } from '@/lib/generated/client';
import type { AuthUser } from '@/lib/auth-helpers';
import { executeAction } from '@/lib/api-utils';

export interface AdminProfileActionResponse<T = unknown> {
    success: boolean;
    error?: string;
    message?: string;
    data?: T;
}

async function getSessionUser(): Promise<AuthUser> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        throw new Error('Not authenticated');
    }
    return session.user as AuthUser;
}


async function revalidateAdminPath(_email: string) {
    await revalidateAdminProfile();
}

export async function getAdminProfile(): Promise<AdminProfileActionResponse> {
    try {
        const user = await getSessionUser();

        // Fetch fresh data from DB
        const admin = await prisma.admin.findUnique({
            where: { email: user.email! },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                branch: true,
                designation: true,
                phone: true,
                bio: true,
                preferences: true,
                notificationSettings: true,
                profilePicture: true,
                createdAt: true,
            }
        });

        if (!admin) throw new Error('Admin profile not found');

        // Fetch recent login activity
        const recentLogs = await prisma.auditLog.findMany({
            where: {
                performedBy: user.email!,
                action: { in: ['LOGIN', 'PASSWORD_CHANGE', 'PROFILE_UPDATE'] }
            },
            select: { id: true, action: true, timestamp: true, entityType: true, entityId: true, metadata: true },
            orderBy: { timestamp: 'desc' },
            take: 5
        });

        return {
            success: true,
            data: JSON.parse(JSON.stringify({
                ...admin,
                recentActivity: recentLogs
            }))
        };
    } catch (error: unknown) {
        logger.error({ err: error }, 'Failed to fetch admin profile');
        return { success: false, error: 'Failed to fetch profile' };
    }
}

export async function updateAdminProfile(formData: FormData): Promise<AdminProfileActionResponse> {
    const user = await getSessionUser();

    return executeAction(async () => {
        const firstName = (formData.get('firstName') as string | null)?.trim() || '';
        const lastName = (formData.get('lastName') as string | null)?.trim() || '';
        const combinedName = [firstName, lastName].filter(Boolean).join(' ');

        // Extract basic fields
        const updateData: Record<string, unknown> = {
            name: combinedName || undefined,
            designation: formData.get('designation') as string || undefined,
            phone: formData.get('phone') as string || undefined,
            bio: formData.get('bio') as string || undefined,
            profilePicture: formData.get('profilePicture') as string || undefined,
        };

        // Extract Preferences — validate structure
        const preferencesJSON = formData.get('preferencesJSON') as string;
        if (preferencesJSON) {
            try {
                const preferences = JSON.parse(preferencesJSON);
                const validationError = validateJsonPayload(preferences);
                if (validationError) return { success: false, error: validationError };
                updateData.preferences = preferences;
            } catch {
                return { success: false, error: 'Invalid preferences JSON' };
            }
        }

        // Extract Notifications — validate structure
        const notificationsJSON = formData.get('notificationsJSON') as string;
        if (notificationsJSON) {
            try {
                const notificationSettings = JSON.parse(notificationsJSON);
                const validationError = validateJsonPayload(notificationSettings);
                if (validationError) return { success: false, error: validationError };
                updateData.notificationSettings = notificationSettings;
            } catch {
                return { success: false, error: 'Invalid notification settings JSON' };
            }
        }

        // Check for password change
        const currentPassword = formData.get('currentPassword') as string;
        const newPassword = formData.get('newPassword') as string;
        const confirmPassword = formData.get('confirmPassword') as string;

        if (newPassword) {
            if (newPassword !== confirmPassword) {
                return { success: false, error: 'New passwords do not match' };
            }
            if (!currentPassword) {
                return { success: false, error: 'Current password is required to set a new one' };
            }

            const admin = await prisma.admin.findUnique({ where: { email: user.email! }, select: { id: true, password: true } });
            if (!admin || !admin.password) return { success: false, error: 'Admin not found' };

            const isMatch = await bcrypt.compare(currentPassword, admin.password);
            if (!isMatch) {
                return { success: false, error: 'Current password is incorrect' };
            }

            updateData.password = await bcrypt.hash(newPassword, 10);
        }

        // Only update defined fields
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

        const updatedAdmin = await prisma.admin.update({
            where: { email: user.email! },
            data: updateData
        });

        revalidateAdminPath(user.email!);
        return {
            success: true,
            message: 'Profile and settings updated successfully',
            data: JSON.parse(JSON.stringify(updatedAdmin))
        };
    }, 'updateAdminProfile');
}

export async function updateProfileSettings(data: Partial<{ name: string; phone: string; bio: string; designation: string; profilePicture: string }>): Promise<AdminProfileActionResponse> {
    const user = await getSessionUser();

    return executeAction(async () => {
        // Security: Explicitly pick only allowed fields to prevent mass assignment
        // (e.g., attacker sending { role: "SUPER_ADMIN" } in the payload)
        const safeData: Record<string, string | undefined> = {};
        if (data.name !== undefined) safeData.name = data.name;
        if (data.phone !== undefined) safeData.phone = data.phone;
        if (data.bio !== undefined) safeData.bio = data.bio;
        if (data.designation !== undefined) safeData.designation = data.designation;
        if (data.profilePicture !== undefined) safeData.profilePicture = data.profilePicture;

        await prisma.admin.update({
            where: { email: user.email! },
            data: safeData
        });

        revalidateAdminPath(user.email!);
        return { success: true };
    }, 'updateProfileSettings');
}

/**
 * Validates a JSON payload before storing in the database.
 * Guards against: non-object payloads, oversized data, and excessive nesting.
 */
function validateJsonPayload(value: unknown, maxSizeBytes = 10240, maxDepth = 3): string | null {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        return 'JSON payload must be a plain object';
    }
    const serialized = JSON.stringify(value);
    if (serialized.length > maxSizeBytes) {
        return `JSON payload too large (max ${maxSizeBytes / 1024}KB)`;
    }
    // Check nesting depth
    function depth(obj: unknown, current: number): number {
        if (current > maxDepth) return current;
        if (obj && typeof obj === 'object') {
            return Math.max(...Object.values(obj as Record<string, unknown>).map(v => depth(v, current + 1)));
        }
        return current;
    }
    if (depth(value, 0) > maxDepth) {
        return `JSON payload nesting too deep (max ${maxDepth} levels)`;
    }
    return null;
}

export async function updatePreferences(preferences: Prisma.InputJsonValue): Promise<AdminProfileActionResponse> {
    const user = await getSessionUser();

    // Security: Validate JSON structure before storing
    const validationError = validateJsonPayload(preferences);
    if (validationError) return { success: false, error: validationError };

    return executeAction(async () => {
        await prisma.admin.update({
            where: { email: user.email! },
            data: { preferences }
        });

        revalidateAdminPath(user.email!);
        return { success: true };
    }, 'updatePreferences');
}

export async function updateNotificationSettings(settings: Prisma.InputJsonValue): Promise<AdminProfileActionResponse> {
    const user = await getSessionUser();

    // Security: Validate JSON structure before storing
    const validationError = validateJsonPayload(settings);
    if (validationError) return { success: false, error: validationError };

    return executeAction(async () => {
        await prisma.admin.update({
            where: { email: user.email! },
            data: { notificationSettings: settings }
        });

        revalidateAdminPath(user.email!);
        return { success: true };
    }, 'updateNotificationSettings');
}

export async function updatePassword(currentPassword: string, newPassword: string): Promise<AdminProfileActionResponse> {
    const user = await getSessionUser();

    return executeAction(async () => {
        const admin = await prisma.admin.findUnique({
            where: { email: user.email! },
            select: { id: true, password: true }
        });

        if (!admin || !admin.password) {
            return { success: false, error: 'User not found' };
        }

        const isValid = await bcrypt.compare(currentPassword, admin.password);
        if (!isValid) {
            return { success: false, error: 'Incorrect current password' };
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.admin.update({
            where: { email: user.email! },
            data: { password: hashedPassword }
        });

        return { success: true, message: 'Password updated successfully' };
    }, 'updatePassword');
}

