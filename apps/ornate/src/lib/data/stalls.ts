import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

export type StallData = {
    id: string;
    name: string;
    no: string;
    team: string;
    price: string;
    rating: string;
    description: string;
    color: string;
    type: string;
    menuItems: unknown;
    qrCodeUrl: string | null;
    qrTargetUrl: string | null;
};

export const getStalls = unstable_cache(
    async (): Promise<StallData[]> => {
        const stalls = await prisma.stall.findMany({
            where: { status: { not: 'Vacant' } },
            select: {
                id: true,
                name: true,
                stallNo: true,
                teamName: true,
                bidAmount: true,
                description: true,
                type: true,
                menuItems: true,
                qrCodeUrl: true,
                qrTargetUrl: true,
            },
            orderBy: { stallNo: 'asc' },
            take: 50,
        });

        const typeColors: Record<string, string> = {
            food: 'var(--color-neon)',
            dessert: '#BDFF00',
            cafe: '#FFA800',
            lifestyle: '#00FFD1',
            other: '#7000FF'
        };

        return stalls.map((s) => ({
            id: s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            name: s.name,
            no: s.stallNo === '-' ? String(s.id).padStart(2, '0') : s.stallNo,
            team: s.teamName === '-' ? 'HHO' : s.teamName,
            price: s.bidAmount === '-' ? '0' : (s.bidAmount.startsWith('₹') ? s.bidAmount.slice(1) : s.bidAmount),
            rating: (4.0 + (s.id % 10) / 10).toFixed(1), // Derived rating since it's not in DB
            description: s.description,
            color: typeColors[s.type.toLowerCase()] || typeColors.other,
            type: s.type.toLowerCase(),
            menuItems: s.menuItems,
            qrCodeUrl: s.qrCodeUrl,
            qrTargetUrl: s.qrTargetUrl,
        }));
    },
    ['stalls-list'],
    { tags: ['stalls'], revalidate: 60 }
);

export type StallPromoVideoData = {
    id: string;
    title: string;
    url: string;
    thumbnail: string | null;
    category: string;
    creator: {
        role: string;
        branch: string | null;
        clubId: string | null;
    };
};

export async function getStallsPromoVideos(): Promise<StallPromoVideoData[]> {
    const videos = await prisma.promoVideo.findMany({
        where: {
            status: 'active',
            OR: [
                { creator: { role: 'SUPER_ADMIN' } }
            ]
        },
        select: {
            id: true,
            title: true,
            url: true,
            thumbnail: true,
            category: true,
            creator: {
                select: {
                    role: true,
                    branch: true,
                    clubId: true,
                }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
    });

    return videos.map((v) => ({
        id: v.id,
        title: v.title,
        url: v.url,
        thumbnail: v.thumbnail,
        category: v.category,
        creator: v.creator
    }));
}

