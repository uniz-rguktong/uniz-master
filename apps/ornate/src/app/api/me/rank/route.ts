import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

const getRankCacheKey = (userId: string) => `rank:${userId}`;
const RANK_CACHE_TTL_SECONDS = 300;

export async function GET() {
    try {
        const session = await getSession();
        if (!session?.user?.id) {
            return NextResponse.json({ rank: null }, { status: 200 });
        }

        const userId = session.user.id;
        const cacheKey = getRankCacheKey(userId);

        try {
            const cached = await redis.get(cacheKey);
            if (cached) {
                const parsed = JSON.parse(cached) as { rank: number | null; energy: number };
                return NextResponse.json(parsed, {
                    status: 200,
                    headers: {
                        'Cache-Control': `private, max-age=${RANK_CACHE_TTL_SECONDS}`,
                        'X-Cache': 'HIT',
                    },
                });
            }
        } catch {
            // Ignore Redis read failures and fall back to DB.
        }

        const cadet = await (prisma as any).cadetProfile?.findUnique({
            where: { userId },
            select: { totalEnergy: true },
        });

        if (!cadet) {
            const payload = { rank: null, energy: 0 };
            try {
                await redis.set(cacheKey, JSON.stringify(payload), 'EX', RANK_CACHE_TTL_SECONDS);
            } catch {
                // Ignore Redis write failures.
            }
            return NextResponse.json(payload, {
                status: 200,
                headers: {
                    'Cache-Control': `private, max-age=${RANK_CACHE_TTL_SECONDS}`,
                    'X-Cache': 'MISS',
                },
            });
        }

        // Count how many users have MORE energy = rank position
        const above = await (prisma as any).cadetProfile.count({
            where: { totalEnergy: { gt: cadet.totalEnergy } },
        });

        const payload = { rank: above + 1, energy: cadet.totalEnergy };
        try {
            await redis.set(cacheKey, JSON.stringify(payload), 'EX', RANK_CACHE_TTL_SECONDS);
        } catch {
            // Ignore Redis write failures.
        }

        return NextResponse.json(payload, {
            status: 200,
            headers: {
                'Cache-Control': `private, max-age=${RANK_CACHE_TTL_SECONDS}`,
                'X-Cache': 'MISS',
            },
        });
    } catch {
        return NextResponse.json({ rank: null }, { status: 200 });
    }
}
