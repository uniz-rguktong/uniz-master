'use server';

import { redis } from '@/lib/redis';
import { prisma } from '@/lib/prisma';

export async function viewAnnouncement(id: string) {
    if (!id) return { success: false, error: 'ID required' };

    try {
        // Increment in Redis first (Write Buffer)
        const redisKey = `announcement:views:${id}`;
        const newCount = await redis.incr(redisKey);

        // Sync to DB every 5 views to reduce DB pressure
        if (newCount % 5 === 0) {
            await prisma.announcement.update({
                where: { id },
                data: { viewCount: { increment: 5 } }
            });
        }

        return { success: true };
    } catch (error) {
        console.error('[ViewAnnouncement] Error tracking view:', error);
        // Fallback to direct DB update if Redis fails
        try {
            await prisma.announcement.update({
                where: { id },
                data: { viewCount: { increment: 1 } }
            });
            return { success: true };
        } catch (dbError) {
            console.error('[ViewAnnouncement] DB Fallback failed:', dbError);
            return { success: false };
        }
    }
}
