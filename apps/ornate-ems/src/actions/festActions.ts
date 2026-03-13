'use server';

import prisma from '@/lib/prisma'
import { revalidateFestSettings } from '@/lib/revalidation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { executeAction } from '@/lib/api-utils'

export interface FestSettingsInput {
    festName?: string;
    tagline?: string;
    startDate?: string | Date;
    endDate?: string | Date;
    venue?: string;
    description?: string;
    logoUrl?: string;
    brochureUrl?: string;
    registrationOpen?: boolean;
    maintenanceMode?: boolean;
    guestRegistration?: boolean;
    emailNotifications?: boolean;
    instagramUrl?: string;
    youtubeUrl?: string;
    supportEmail?: string;
}

export async function getFestSettings() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return null;

    return executeAction(async () => {
        let settings = await prisma.festSettings.findFirst();

        if (!settings) {
            // Initialize with defaults if not exists
            settings = await prisma.festSettings.create({
                data: {
                    id: 'singleton'
                }
            });
        }

        return settings;
    }, 'getFestSettings');
}

export async function updateFestSettings(data: FestSettingsInput) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
        return { error: 'Unauthorized' };
    }

    return executeAction(async () => {
        const payload: any = {};
        if (data.festName !== undefined) payload.festName = data.festName;
        if (data.tagline !== undefined) payload.tagline = data.tagline;
        if (data.startDate !== undefined) payload.startDate = data.startDate ? new Date(data.startDate) : null;
        if (data.endDate !== undefined) payload.endDate = data.endDate ? new Date(data.endDate) : null;
        if (data.venue !== undefined) payload.venue = data.venue;
        if (data.description !== undefined) payload.description = data.description;
        if (data.logoUrl !== undefined) payload.logoUrl = data.logoUrl;
        if (data.brochureUrl !== undefined) payload.brochureUrl = data.brochureUrl;
        if (data.registrationOpen !== undefined) payload.registrationOpen = data.registrationOpen;
        if (data.maintenanceMode !== undefined) payload.maintenanceMode = data.maintenanceMode;
        if (data.guestRegistration !== undefined) payload.guestRegistration = data.guestRegistration;
        if (data.emailNotifications !== undefined) payload.emailNotifications = data.emailNotifications;
        if (data.instagramUrl !== undefined) payload.instagramUrl = data.instagramUrl;
        if (data.youtubeUrl !== undefined) payload.youtubeUrl = data.youtubeUrl;
        if (data.supportEmail !== undefined) payload.supportEmail = data.supportEmail;

        const settings = await prisma.festSettings.upsert({
            where: { id: 'singleton' },
            update: payload,
            create: { id: 'singleton', ...payload },
        });

        await revalidateFestSettings();
        return { success: true, settings };
    }, 'updateFestSettings');
}
