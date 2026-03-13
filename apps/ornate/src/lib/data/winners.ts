import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

export type WinnerData = {
    eventId: string;
    eventTitle: string;
    positions: unknown; // JSON payload
    publishedAt: string | null;
};

export type SportWinnerData = {
    sportId: string;
    sportName: string;
    positions: unknown;
    publishedAt: string | null;
};

export const getEventWinners = unstable_cache(
    async (): Promise<WinnerData[]> => {
        const winners = await prisma.winnerAnnouncement.findMany({
            where: { isPublished: true },
            select: {
                eventId: true,
                positions: true,
                publishedAt: true,
                Event: { select: { title: true } },
            },
            orderBy: { publishedAt: 'desc' },
            take: 50,
        });

        return winners.map((w) => ({
            eventId: w.eventId,
            eventTitle: w.Event.title,
            positions: w.positions,
            publishedAt: w.publishedAt?.toISOString() ?? null,
        }));
    },
    ['event-winners'],
    { tags: ['event-winners'], revalidate: 120 }
);

export const getSportWinners = unstable_cache(
    async (): Promise<SportWinnerData[]> => {
        const winners = await prisma.sportWinnerAnnouncement.findMany({
            where: { isPublished: true },
            select: {
                sportId: true,
                positions: true,
                publishedAt: true,
                Sport: { select: { name: true } },
            },
            orderBy: { publishedAt: 'desc' },
            take: 50,
        });

        return winners.map((w) => ({
            sportId: w.sportId,
            sportName: w.Sport.name,
            positions: w.positions,
            publishedAt: w.publishedAt?.toISOString() ?? null,
        }));
    },
    ['sport-winners'],
    { tags: ['sport-winners'], revalidate: 120 }
);
