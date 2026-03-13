import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getMyGamificationProfile, syncCadetEnergy } from '@/lib/actions/gamification';
import { redis } from '@/lib/redis';

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session?.user?.id) {
            return NextResponse.json({ ok: true, profile: null }, {
                headers: { 'Cache-Control': 'private, no-store' },
            });
        }

        // Sync energy from DB records (throttled to once per 10 min for the user)
        await syncCadetEnergy(session.user.id);

        const profile = await getMyGamificationProfile();

        return NextResponse.json({ ok: true, profile }, {
            headers: { 'Cache-Control': 'private, no-store' },
        });
    } catch (error) {
        console.error('[api/me/gamification]', error);
        return NextResponse.json({ ok: false, profile: null, error: 'Failed to load profile' }, {
            status: 500,
            headers: { 'Cache-Control': 'no-store' },
        });
    }
}

// POST: Force-sync (ignores throttle — use after manual data changes)
export async function POST() {
    try {
        const session = await getSession();
        if (!session?.user?.id) {
            return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Clear throttle so sync runs immediately
        try { await redis.del(`energy_sync:${session.user.id}`); } catch { /* ignore */ }

        await syncCadetEnergy(session.user.id);
        const profile = await getMyGamificationProfile();

        return NextResponse.json({ ok: true, profile, synced: true }, {
            headers: { 'Cache-Control': 'private, no-store' },
        });
    } catch (error) {
        console.error('[api/me/gamification POST]', error);
        return NextResponse.json({ ok: false, error: 'Sync failed' }, { status: 500 });
    }
}
