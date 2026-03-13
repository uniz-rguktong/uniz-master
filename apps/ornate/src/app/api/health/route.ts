import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const checks: Record<string, 'ok' | 'error'> = {
        database: 'error',
        redis: 'error',
    };

    try {
        await prisma.$queryRaw`SELECT 1`;
        checks.database = 'ok';
    } catch (e) {
        console.error('[Health] DB check failed:', e);
    }

    try {
        await redis.ping();
        checks.redis = 'ok';
    } catch (e) {
        console.error('[Health] Redis check failed:', e);
    }

    const allHealthy = Object.values(checks).every(v => v === 'ok');

    return NextResponse.json(
        { status: allHealthy ? 'healthy' : 'degraded', checks, timestamp: new Date().toISOString() },
        { status: allHealthy ? 200 : 503 }
    );
}
