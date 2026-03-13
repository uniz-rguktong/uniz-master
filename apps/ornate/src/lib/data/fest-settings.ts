import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

export type FestSettingsData = {
    festName: string;
    tagline: string | null;
    logoUrl: string | null;
    description: string | null;
    startDate: string | null;
    endDate: string | null;
    venue: string | null;
    registrationOpen: boolean;
    maintenanceMode: boolean;
    instagramUrl: string | null;
    youtubeUrl: string | null;
    supportEmail: string | null;
};

export const getFestSettings = unstable_cache(
    async (): Promise<FestSettingsData> => {
        const settings = await prisma.festSettings.findFirst({
            where: { id: 'singleton' },
        });

        if (!settings) {
            return {
                festName: 'ORNATE 2K26',
                tagline: 'Innovation Meets Culture',
                logoUrl: null,
                description: 'The biggest technical and cultural fest of RGUKT Ongole',
                startDate: '2026-03-27',
                endDate: '2026-03-29',
                venue: 'RGUKT Ongole Campus',
                registrationOpen: true,
                maintenanceMode: false,
                instagramUrl: null,
                youtubeUrl: null,
                supportEmail: null,
            };
        }

        return {
            festName: settings.festName,
            tagline: settings.tagline,
            logoUrl: settings.logoUrl,
            description: settings.description,
            startDate: settings.startDate?.toISOString() ?? null,
            endDate: settings.endDate?.toISOString() ?? null,
            venue: settings.venue,
            registrationOpen: settings.registrationOpen,
            maintenanceMode: settings.maintenanceMode,
            instagramUrl: settings.instagramUrl,
            youtubeUrl: settings.youtubeUrl,
            supportEmail: settings.supportEmail,
        };
    },
    ['fest-settings'],
    { tags: ['fest-settings'], revalidate: 120 }
);
