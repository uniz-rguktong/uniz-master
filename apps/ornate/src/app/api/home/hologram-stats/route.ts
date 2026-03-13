import { NextResponse } from 'next/server';
import { getPublishedEvents, type MissionData } from '@/lib/data/events';



type PlanetStats = {
    events: number;
    registrations: number;
};

const EMPTY: PlanetStats = { events: 0, registrations: 0 };

const PLANET_KEYS = [
    'sun',
    'mercury',
    'venus',
    'earth',
    'mars',
    'jupiter',
    'uranus',
    'neptune',
    'branch_cse',
    'branch_ece',
    'branch_eee',
    'branch_mech',
    'branch_civil',
    'branch_hho',
    'special_moon',
] as const;

const SUBCATEGORY_TO_PLANET: Record<string, string> = {
    CSE: 'branch_cse',
    ECE: 'branch_ece',
    EEE: 'branch_eee',
    EE: 'branch_eee',
    MECH: 'branch_mech',
    MECHANICAL: 'branch_mech',
    CIVIL: 'branch_civil',
    HHO: 'branch_hho',

    ARTIX: 'mercury',
    KALADHARANI: 'venus',
    KALADHARINI: 'venus',
    ICRO: 'earth',
    KHELSATHI: 'mars',
    KHELSAATHI: 'mars',
    PIXLERO: 'jupiter',
    PIXELRO: 'jupiter',
    SARVASRIJANA: 'uranus',
    TECHXCEL: 'neptune',
};

function createEmptyStats(): Record<string, PlanetStats> {
    return Object.fromEntries(PLANET_KEYS.map((k) => [k, { ...EMPTY }]));
}

function resolvePlanetId(mission: MissionData): string | null {
    const sub = (mission.subCategory || '').toUpperCase();
    const direct = SUBCATEGORY_TO_PLANET[sub];
    if (direct) return direct;

    if (mission.category === 'HHO') return 'branch_hho';
    return null;
}

export const revalidate = 60;

export async function GET(request: Request) {
    try {
        const missions = await getPublishedEvents(250);
        const stats = createEmptyStats();

        for (const mission of missions) {
            const planetId = resolvePlanetId(mission);
            if (!planetId || !stats[planetId]) continue;

            stats[planetId].events += 1;
            stats[planetId].registrations += mission.registered;

            // Aggregate total telemetry on the sun node.
            stats.sun.events += 1;
            stats.sun.registrations += mission.registered;
        }

        return NextResponse.json({
            ok: true,
            updatedAt: new Date().toISOString(),
            stats,
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
            },
        });
    } catch (error) {
        console.error('hologram-stats GET failed', error);
        return NextResponse.json(
            { ok: false, error: 'Failed to load hologram stats' },
            {
                status: 500,
                headers: {
                    'Cache-Control': 'no-store',
                },
            }
        );
    }
}
