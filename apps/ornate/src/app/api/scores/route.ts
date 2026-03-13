import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 60;

// Redis cache configuration
const CACHE_KEY = 'live-scores';
const CACHE_TTL = 10; // 10 seconds

export async function GET(request: Request) {
    try {
        // Try to get Redis client (lazy load inside function to avoid top-level issues)
        let redis: any = null;
        try {
            const redisModule = await import('@/lib/redis');
            redis = redisModule.redis;
        } catch (e) {
            // Redis module load failed — continue without cache
        }

        // Try Redis cache first
        if (redis) {
            try {
                const cached = await redis.get(CACHE_KEY);
                if (cached) {
                    return NextResponse.json(JSON.parse(cached));
                }
            } catch (cacheError) {
                console.warn('[api/scores] Redis read failed, falling back to DB');
            }
        }

        // Fetch live/recent matches from DB — wrap in specific try/catch for clarity
        let data: any[] = [];
        try {
            const matches = await prisma.match.findMany({
                where: {
                    status: { in: ['LIVE', 'COMPLETED'] },
                },
                include: {
                    sport: { select: { name: true, gender: true } },
                },
                orderBy: { updatedAt: 'desc' },
                take: 20,
            });

            data = matches.map((m) => ({
                id: m.id,
                sport: m.sport.name,
                gender: m.sport.gender,
                round: m.round,
                team1: m.team1Name,
                team2: m.team2Name,
                score1: m.score1,
                score2: m.score2,
                status: m.status,
                winner: m.winner,
                venue: m.venue,
                time: m.time,
            }));
        } catch (dbError) {
            console.error('[api/scores] Database error:', dbError);
            // If DB fails, we still return [] below
        }

        // Cache in Redis if available
        if (redis && data.length > 0) {
            try {
                await redis.set(CACHE_KEY, JSON.stringify(data), 'EX', CACHE_TTL);
            } catch (cacheWriteError) {
                // Ignore cache write failures
            }
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('[api/scores] Unexpected error:', error);
        return NextResponse.json([], { status: 200 });
    }
}
