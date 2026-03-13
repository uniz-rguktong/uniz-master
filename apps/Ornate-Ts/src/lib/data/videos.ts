import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

export type VideoData = {
    id: string;
    title: string;
    url: string;
    platform: string;
    thumbnail: string | null;
    duration: string | null;
};

export const getPromoVideos = unstable_cache(
    async (): Promise<VideoData[]> => {
        const videos = await prisma.promoVideo.findMany({
            where: { status: 'active' },
            select: {
                id: true,
                title: true,
                url: true,
                platform: true,
                thumbnail: true,
                duration: true,
            },
            orderBy: { uploadDate: 'desc' },
            take: 20,
        });

        return videos.map((v) => ({
            id: v.id,
            title: v.title,
            url: v.url,
            platform: v.platform,
            thumbnail: v.thumbnail,
            duration: v.duration,
        }));
    },
    ['promo-videos'],
    { tags: ['promo-videos'], revalidate: 300 }
);
