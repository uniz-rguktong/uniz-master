import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

export type AnnouncementData = {
    id: string;
    category: string;
    priority: string;
    title: string;
    time: string;
    desc: string;
    tag: string;
};

export const getActiveAnnouncements = unstable_cache(
    async (): Promise<AnnouncementData[]> => {
        const now = new Date();
        const announcements = await prisma.announcement.findMany({
            where: {
                status: 'active',
                expiryDate: { gt: now },
            },
            orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
            take: 50,
        });

        return announcements.map((a) => {
            const createdAt = new Date(a.createdAt);
            const diffMs = now.getTime() - createdAt.getTime();
            const diffHrs = Math.floor(diffMs / 3600000);
            const timeLabel = diffHrs < 1 ? 'Just now' :
                diffHrs < 24 ? `${diffHrs}h ago` :
                    `${Math.floor(diffHrs / 24)}d ago`;

            return {
                id: a.id,
                category: a.category.toUpperCase(),
                priority: a.isPinned ? 'CRITICAL' : 'NORMAL',
                title: a.title,
                time: timeLabel,
                desc: a.content,
                tag: a.targetAudience,
            };
        });
    },
    ['active-announcements'],
    { tags: ['announcements'], revalidate: 30 }
);
