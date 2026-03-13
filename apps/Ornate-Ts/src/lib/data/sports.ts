import { prisma } from '@/lib/prisma';

// Redis cache configuration
type RedisClientLike = {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string, mode: 'EX', seconds: number) => Promise<unknown>;
};

let redis: RedisClientLike | null = null;
const CACHE_TTL = 30; // 30 seconds
const SPORTS_SCHEDULE_TTL = 60;
const SPORTS_FIXTURES_TTL = 60;
const SPORTS_FIXTURES_MATCH_LIMIT = 50;

// Initialize Redis lazily
const getRedis = async () => {
    if (redis) return redis;
    try {
        const { redis: r } = await import('@/lib/redis');
        redis = r;
        return redis;
    } catch {
        return null;
    }
};

export type SportData = {
    id: string;
    name: string;
    gender: string;
    category: string;
    format: string;
    status: string;
    description?: string;
    icon?: string | null;
    bannerUrl?: string | null;
    matches: MatchData[];
    branchPoints: BranchPointData[];
    winnerAnnouncement?: {
        isPublished: boolean;
        positions: unknown;
        publishedAt?: Date | null;
    } | null;
};

export type MatchData = {
    id: string;
    round: string;
    team1Name: string;
    team2Name: string;
    score1: string | null;
    score2: string | null;
    venue: string | null;
    date: string | null;
    time: string | null;
    status: string;
    winner: string | null;
    sportName?: string;
    updatedAt?: string;
};

export type BranchPointData = {
    branch: string;
    points: number;
};

export interface StandingRow {
    dept: string;
    total: number;
    scores: Record<string, number>;
}

export function normalizeSportName(name: string, category?: string): string {
    const cat = category?.toUpperCase().trim();

    // 1. Priority: If the database 'category' field has a specific group name (not generic TEAM/INDIVIDUAL)
    if (cat && cat !== 'TEAM' && cat !== 'INDIVIDUAL' && cat !== '') {
        return cat;
    }

    const n = name.toUpperCase().trim();

    // 2. Secondary: If the name contains any of the major event categories defined in the UI
    const eventCategories = ['CRICKET', 'FOOTBALL', 'BASKETBALL', 'BADMINTON', 'KABADDI', 'VOLLEYBALL', 'THROWBALL', 'KHO KHO', 'CHESS', 'ATHLETICS'];
    for (const ec of eventCategories) {
        if (n.includes(ec)) return ec;
    }

    // 3. Special handling for Athletics sub-events if not already caught
    const athleticsKeywords = ['100M', '200M', '400M', '800M', '1500M', 'RELAY', 'SPRINT', 'JUMP', 'THROW', 'SHOT PUT'];
    if (athleticsKeywords.some(kw => n.includes(kw))) {
        return 'ATHLETICS';
    }

    return n
        .replace(/-/g, ' ')
        .replace(/\s+/g, ' ')
        .replace('KABBADI', 'KABADDI')
        .replace('KABADI', 'KABADDI')
        .replace('KNO KHO', 'KHO KHO')
        .replace('VOLLEY BALL', 'VOLLEYBALL');
}

export function computeDynamicStandings(sportsData: SportData[], genderFilter: (gender: string) => boolean) {
    const catSet = new Set<string>();
    const branches = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL'];

    // 1. First, collect all possible categories matching the gender filter.
    // This ensures that even sports with 0 points get a column in the table.
    sportsData.forEach(sport => {
        if (sport.name && genderFilter(sport.gender)) {
            catSet.add(normalizeSportName(sport.name, sport.category));
        }
    });

    const categories = Array.from(catSet).sort();

    // 2. Initialize the standings array with all branches and 0 points for all categories
    const standings: StandingRow[] = branches.map(dept => {
        const row: StandingRow = { dept, total: 0, scores: {} };
        categories.forEach(cat => row.scores[cat] = 0);
        return row;
    });

    // 3. Fill in the actual points where they exist
    sportsData.forEach(sport => {
        if (genderFilter(sport.gender) && sport.name) {
            const cat = normalizeSportName(sport.name, sport.category);
            sport.branchPoints.forEach((pointData: BranchPointData) => {
                const branchName = pointData.branch.toUpperCase();
                let branchRow = standings.find(b => b.dept.toUpperCase() === branchName);

                if (!branchRow) {
                    branchRow = { dept: branchName, total: 0, scores: {} };
                    categories.forEach(c => branchRow!.scores[c] = 0);
                    standings.push(branchRow);
                }

                branchRow.scores[cat] = (branchRow.scores[cat] || 0) + (pointData.points || 0);
                branchRow.total += pointData.points || 0;
            });
        }
    });

    standings.sort((a, b) => b.total - a.total);

    return { standings, categories };
}

export type PromoVideoData = {
    id: string;
    title: string;
    url: string;
    platform: string;
    thumbnail: string | null;
    status: string;
    views: number;
    duration: string | null;
    uploadDate: string;
    category: string;
    creator: {
        role: string;
        branch: string | null;
        clubId: string | null;
    };
};

export async function getPromoVideosData(): Promise<PromoVideoData[]> {
    const cacheKey = 'sports:promo-videos';
    const redis = await getRedis();

    // Try cache
    if (redis) {
        try {
            const cached = await redis.get(cacheKey);
            if (cached) return JSON.parse(cached);
        } catch (e) {
            console.warn('[Cache] Redis read error (promo-videos):', e);
        }
    }

    try {
        const videos = await prisma.promoVideo.findMany({
            where: {
                status: 'active',
                OR: [
                    { Admin: { role: { in: ['SPORTS_ADMIN', 'BRANCH_SPORTS_ADMIN'] } } },
                    { Admin: { role: 'SUPER_ADMIN' } }
                ]
            },
            select: {
                id: true,
                title: true,
                url: true,
                platform: true,
                thumbnail: true,
                status: true,
                views: true,
                duration: true,
                uploadDate: true,
                category: true,
                Admin: {
                    select: {
                        role: true,
                        branch: true,
                        clubId: true,
                    }
                }
            },
            orderBy: { uploadDate: 'desc' },
            take: 10,
        });

        const data = videos.map((v) => ({
            id: v.id,
            title: v.title,
            url: v.url,
            platform: v.platform,
            thumbnail: v.thumbnail,
            status: v.status,
            views: v.views,
            duration: v.duration,
            uploadDate: v.uploadDate.toISOString(),
            category: v.category,
            creator: v.Admin
        }));

        // Write to cache
        if (redis && data.length > 0) {
            try {
                await redis.set(cacheKey, JSON.stringify(data), 'EX', CACHE_TTL);
            } catch (e) {
                // Ignore cache write errors
            }
        }

        return data;
    } catch (error) {
        console.error('Error fetching promo videos:', error);
        return [];
    }
}

export async function getSportsStandingsData(): Promise<SportData[]> {
    const cacheKey = 'sports:standings';
    const redis = await getRedis();

    if (redis) {
        try {
            const cached = await redis.get(cacheKey);
            if (cached) return JSON.parse(cached);
        } catch (e) {
            console.warn('[Cache] Redis read error (standings):', e);
        }
    }

    try {
        const sports = await prisma.sport.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                gender: true,
                category: true,
                description: true,
                icon: true,
                bannerUrl: true,
                BranchPoints: {
                    select: {
                        branch: true,
                        points: true,
                        manualAdjustment: true,
                    },
                    orderBy: { points: 'desc' },
                },
                SportWinnerAnnouncement: {
                    select: {
                        isPublished: true,
                        positions: true,
                    },
                },
            },
            take: 100,
        });

        const data = sports.map((s) => ({
            id: s.id,
            name: s.name,
            gender: s.gender,
            category: s.category,
            description: s.description ?? '',
            icon: s.icon,
            bannerUrl: s.bannerUrl,
            format: '',
            status: '',
            matches: [],
            branchPoints: s.BranchPoints.map((bp) => ({
                branch: bp.branch,
                points: bp.points + bp.manualAdjustment,
            })),
            winnerAnnouncement: s.SportWinnerAnnouncement,
        }));

        if (redis && data.length > 0) {
            try {
                await redis.set(cacheKey, JSON.stringify(data), 'EX', CACHE_TTL);
            } catch (e) {
                // Ignore
            }
        }

        return data;
    } catch (error) {
        console.error('Error fetching sports standings:', error);
        return [];
    }
}

export async function getSportsScheduleData(): Promise<SportData[]> {
    const cacheKey = 'sports:schedule';
    const redis = await getRedis();

    if (redis) {
        try {
            const cached = await redis.get(cacheKey);
            if (cached) return JSON.parse(cached);
        } catch (e) {
            console.warn('[Cache] Redis read error (sports-schedule):', e);
        }
    }

    try {
        const sports = await prisma.sport.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                gender: true,
                category: true,
                Match: {
                    select: {
                        id: true,
                        round: true,
                        team1Name: true,
                        team2Name: true,
                        venue: true,
                        date: true,
                        time: true,
                        status: true,
                    },
                    orderBy: [{ date: 'asc' }, { matchOrder: 'asc' }],
                    take: 50,
                },
            },
            take: 50,
        });

        const data = sports.map((s) => ({
            id: s.id,
            name: s.name,
            gender: s.gender,
            category: s.category,
            format: '',
            status: '',
            matches: s.Match.map((m) => ({
                id: m.id,
                round: m.round,
                team1Name: m.team1Name ?? 'TBD',
                team2Name: m.team2Name ?? 'TBD',
                score1: null,
                score2: null,
                venue: m.venue,
                date: m.date?.toISOString() ?? null,
                time: m.time,
                status: m.status,
                winner: null,
            })),
            branchPoints: [],
        }));

        if (redis && data.length > 0) {
            try {
                await redis.set(cacheKey, JSON.stringify(data), 'EX', SPORTS_SCHEDULE_TTL);
            } catch (e) {
                // Ignore cache write errors
            }
        }

        return data;
    } catch (error) {
        console.error('Error fetching sports schedule:', error);
        return [];
    }
}

export async function getSportsResultsData(): Promise<SportData[]> {
    try {
        const sports = await prisma.sport.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                gender: true,
                category: true,
                Match: {
                    where: { status: 'COMPLETED' },
                    select: {
                        id: true,
                        round: true,
                        team1Name: true,
                        team2Name: true,
                        score1: true,
                        score2: true,
                        venue: true,
                        date: true,
                        status: true,
                        winner: true,
                    },
                    orderBy: { date: 'desc' },
                    take: 10,
                },
            },
            take: 50,
        });

        return sports.map((s) => ({
            id: s.id,
            name: s.name,
            gender: s.gender,
            category: s.category,
            format: '',
            status: '',
            matches: s.Match.map((m) => ({
                id: m.id,
                round: m.round,
                team1Name: m.team1Name ?? 'TBD',
                team2Name: m.team2Name ?? 'TBD',
                score1: m.score1,
                score2: m.score2,
                venue: m.venue,
                date: m.date?.toISOString() ?? null,
                time: null,
                status: m.status,
                winner: m.winner,
            })),
            branchPoints: [],
        }));
    } catch (error) {
        console.error('Error fetching sports results:', error);
        return [];
    }
}

export async function getSportsFixturesData(): Promise<SportData[]> {
    const cacheKey = 'sports:fixtures';
    const redis = await getRedis();

    if (redis) {
        try {
            const cached = await redis.get(cacheKey);
            if (cached) return JSON.parse(cached);
        } catch (e) {
            console.warn('[Cache] Redis read error (sports-fixtures):', e);
        }
    }

    try {
        const sports = await prisma.sport.findMany({
            where: {
                isActive: true,
                NOT: [
                    { name: { contains: 'ATHLETIC', mode: 'insensitive' } },
                    { name: { contains: 'SPRINT', mode: 'insensitive' } },
                    { name: { contains: 'RUN', mode: 'insensitive' } },
                    { name: { contains: 'RACE', mode: 'insensitive' } },
                    { name: { contains: 'JUMP', mode: 'insensitive' } },
                    { name: { contains: 'RELAY', mode: 'insensitive' } },
                    { name: { contains: 'DASH', mode: 'insensitive' } },
                    { name: { contains: '100M', mode: 'insensitive' } },
                    { name: { contains: '200M', mode: 'insensitive' } },
                    { name: { contains: '400M', mode: 'insensitive' } },
                    { name: { contains: '800M', mode: 'insensitive' } },
                    { name: { contains: '1500M', mode: 'insensitive' } },
                    { name: { contains: 'SHOT PUT', mode: 'insensitive' } },
                    { name: { contains: 'DISCUS', mode: 'insensitive' } },
                    { name: { contains: 'JAVELIN', mode: 'insensitive' } },
                    { name: { contains: 'LONG JUMP', mode: 'insensitive' } },
                    { name: { contains: 'HIGH JUMP', mode: 'insensitive' } },
                ]
            },
            select: {
                id: true,
                name: true,
                gender: true,
                category: true,
                Match: {
                    select: {
                        id: true,
                        round: true,
                        team1Name: true,
                        team2Name: true,
                        score1: true,
                        score2: true,
                        venue: true,
                        date: true,
                        time: true,
                        status: true,
                        winner: true,
                    },
                    orderBy: [{ date: 'asc' }, { matchOrder: 'asc' }],
                    take: SPORTS_FIXTURES_MATCH_LIMIT,
                },
            },
            take: 50,
        });

        const data = sports.map((s) => ({
            id: s.id,
            name: normalizeSportName(s.name, s.category),
            gender: s.gender,
            category: s.category,
            format: '',
            status: '',
            matches: s.Match.map((m) => ({
                id: m.id,
                round: m.round,
                team1Name: m.team1Name ?? 'TBD',
                team2Name: m.team2Name ?? 'TBD',
                score1: m.score1,
                score2: m.score2,
                venue: m.venue,
                date: m.date?.toISOString() ?? null,
                time: m.time,
                status: m.status,
                winner: m.winner,
            })),
            branchPoints: [],
        }));

        if (redis && data.length > 0) {
            try {
                await redis.set(cacheKey, JSON.stringify(data), 'EX', SPORTS_FIXTURES_TTL);
            } catch (e) {
                // Ignore cache write errors
            }
        }

        return data;
    } catch (error) {
        console.error('Error fetching sports fixtures:', error);
        return [];
    }
}

// Fetches all matches — uses select (not include) to keep payload small.
export async function getTodaysMatchesData(): Promise<MatchData[]> {
    const cacheKey = 'sports:todays-matches';
    const redis = await getRedis();

    if (redis) {
        try {
            const cached = await redis.get(cacheKey);
            if (cached) return JSON.parse(cached);
        } catch (e) {
            console.warn('[Cache] Redis read error (today-matches):', e);
        }
    }

    try {
        const matches = await prisma.match.findMany({
            select: {
                id: true,
                round: true,
                team1Name: true,
                team2Name: true,
                score1: true,
                score2: true,
                venue: true,
                date: true,
                time: true,
                status: true,
                winner: true,
                updatedAt: true,
                Sport: {
                    select: { name: true } // only fetch sport name, not full Sport record
                },
            },
            orderBy: [{ date: 'asc' }, { time: 'asc' }],
            take: 200, // Hard cap to prevent unbounded fetches
        });

        const data = matches.map((m) => ({
            id: m.id,
            round: m.round,
            team1Name: m.team1Name ?? 'TBD',
            team2Name: m.team2Name ?? 'TBD',
            score1: m.score1,
            score2: m.score2,
            venue: m.venue,
            date: m.date?.toISOString() ?? null,
            time: m.time,
            status: m.status,
            winner: m.winner,
            sportName: m.Sport.name,
            updatedAt: m.updatedAt.toISOString(),
        } as MatchData));

        if (redis && data.length > 0) {
            try {
                await redis.set(cacheKey, JSON.stringify(data), 'EX', 60); // 1 minute for matches
            } catch (e) { /* ignore */ }
        }

        return data;
    } catch (error) {
        console.error('Error fetching today\'s matches:', error);
        return [];
    }
}

export async function getAthleticsData(): Promise<SportData[]> {
    const cacheKey = 'sports:athletics';
    const redis = await getRedis();

    if (redis) {
        try {
            const cached = await redis.get(cacheKey);
            if (cached) return JSON.parse(cached);
        } catch (e) {
            console.warn('[Cache] Redis read error (athletics):', e);
        }
    }

    try {
        const athletics = await prisma.sport.findMany({
            where: {
                isActive: true,
                NOT: { name: { contains: 'THROWBALL', mode: 'insensitive' } },
                OR: [
                    { name: { contains: 'ATHLETIC', mode: 'insensitive' } },
                    { name: { contains: 'SPRINT', mode: 'insensitive' } },
                    { name: { contains: 'RUN', mode: 'insensitive' } },
                    { name: { contains: 'RACE', mode: 'insensitive' } },
                    { name: { contains: 'JUMP', mode: 'insensitive' } },
                    { name: { contains: 'THROW', mode: 'insensitive' } },
                    { name: { contains: 'RELAY', mode: 'insensitive' } },
                    { name: { contains: 'DASH', mode: 'insensitive' } },
                    { name: { contains: '100M', mode: 'insensitive' } },
                    { name: { contains: '200M', mode: 'insensitive' } },
                    { name: { contains: '400M', mode: 'insensitive' } },
                    { name: { contains: '800M', mode: 'insensitive' } },
                    { name: { contains: '1500M', mode: 'insensitive' } },
                    { name: { contains: 'SHOT PUT', mode: 'insensitive' } },
                    { name: { contains: 'DISCUS', mode: 'insensitive' } },
                    { name: { contains: 'JAVELIN', mode: 'insensitive' } },
                    { name: { contains: 'LONG JUMP', mode: 'insensitive' } },
                    { name: { contains: 'HIGH JUMP', mode: 'insensitive' } },
                ],
            },
            select: {
                id: true,
                name: true,
                gender: true,
                category: true,
                description: true,
                icon: true,
                bannerUrl: true,
                SportWinnerAnnouncement: {
                    select: {
                        isPublished: true,
                        positions: true,
                        publishedAt: true,
                    },
                },
            },
        });

        const data = athletics.map((s) => ({
            id: s.id,
            name: s.name,
            gender: s.gender,
            category: s.category,
            description: s.description ?? '',
            icon: s.icon,
            bannerUrl: s.bannerUrl,
            format: '',
            status: '',
            matches: [],
            branchPoints: [],
            winnerAnnouncement: s.SportWinnerAnnouncement,
        }));

        if (redis && data.length > 0) {
            try {
                await redis.set(cacheKey, JSON.stringify(data), 'EX', CACHE_TTL);
            } catch (e) { /* ignore */ }
        }

        return data;
    } catch (error) {
        console.error('Error fetching athletics data:', error);
        return [];
    }
}

export const getSportsData = getSportsStandingsData;
