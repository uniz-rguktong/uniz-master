'use server';

import prisma from '@/lib/prisma';
import { executeAction } from '@/lib/api-utils';
import { revalidateFixtureData } from '@/lib/revalidation';
import { MatchStatus, MatchWinner, Prisma, type Match } from '@/lib/generated/client';
import { getAuthenticatedUser, type AuthUser } from '@/lib/auth-helpers';
import { assertPermission, hasPermission, ROLES, type User as PermissionUser } from '@/lib/permissions';
import { unstable_cache } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache-tags';
import { syncBranchPointsForSport } from '@/actions/branchPointsActions';

export interface FixtureActionResponse<T = unknown> {
    success: boolean;
    error?: string;
    data?: T;
    results?: T;
}

export interface MatchData {
    id?: string;
    sportId?: string;
    matchId: string | null;
    sport: string;
    gender: string;
    round: string;
    roundOrder: number;
    matchOrder: number;
    team1Id: string | null;
    team1Name: string;
    team2Id: string | null;
    team2Name: string;
    date: string;
    time: string;
    venue: string;
    status: string;
    score1?: string | null;
    score2?: string | null;
    winner?: string | null;
    note?: string | null;
    referee?: string | null;
}

interface BracketMatch {
    matchId: string;
    note: string | null;
    defaultTime: string;
    order: number;
}

interface BracketRound {
    level: string;
    order: number;
    matches: BracketMatch[];
}

const BRACKET_STRUCTURE: BracketRound[] = [
    {
        level: 'Round 1',
        order: 1,
        matches: [{ matchId: 'R1-M1', note: 'Upper Group Eliminator', defaultTime: '10:00 AM', order: 1 }],
    },
    {
        level: 'Semi-Finals',
        order: 2,
        matches: [
            { matchId: 'SF-M1', note: 'Semi-Final 1', defaultTime: '10:00 AM', order: 1 },
            { matchId: 'SF-M2', note: 'Semi-Final 2', defaultTime: '02:00 PM', order: 2 },
        ],
    },
    {
        level: 'Finals',
        order: 3,
        matches: [{ matchId: 'GF-M1', note: 'Championship Match', defaultTime: '03:00 PM', order: 1 }],
    },
];

const BRANCHES = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL'] as const;
const DEFAULT_QUERY_TAKE = 200;
const MAX_QUERY_TAKE = 500;

const clampTake = (take: number | undefined, fallback = DEFAULT_QUERY_TAKE): number => {
    const resolved = typeof take === 'number' ? take : fallback;
    return Math.max(1, Math.min(resolved, MAX_QUERY_TAKE));
};

const getRoundOrder = (roundName: string): number => {
    switch (roundName) {
        case 'Round 1':
            return 1;
        case 'Semi-Finals':
            return 2;
        case 'Finals':
            return 3;
        default:
            return 99;
    }
};

const normalizeGenderForDb = (gender: string | undefined | null): 'MALE' | 'FEMALE' | 'MIXED' | null => {
    const raw = (gender || '').toUpperCase();
    if (!raw || raw === 'ALL') return null;
    if (raw === 'BOYS' || raw === 'MALE') return 'MALE';
    if (raw === 'GIRLS' || raw === 'FEMALE') return 'FEMALE';
    if (raw === 'MIXED') return 'MIXED';
    return null;
};

const normalizeGenderForUi = (gender: string): string => {
    if (gender === 'MALE') return 'Boys';
    if (gender === 'FEMALE') return 'Girls';
    return 'Mixed';
};

const normalizeStatusForDb = (status: string | undefined | null): MatchStatus => {
    const raw = (status || '').toUpperCase();
    if (raw === 'LIVE') return MatchStatus.LIVE;
    if (raw === 'COMPLETED') return MatchStatus.COMPLETED;
    if (raw === 'SCHEDULED') return MatchStatus.SCHEDULED;
    if (raw === 'PENDING') return MatchStatus.PENDING;
    if (raw === 'ONGOING') return MatchStatus.LIVE;
    return MatchStatus.PENDING;
};

const normalizeStatusForUi = (status: MatchStatus): string => {
    return status.toLowerCase();
};

const parseDateInput = (date: string | undefined | null): Date | null => {
    if (!date) return null;
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return null;
    return d;
};

const parseTimeInput = (time: string | undefined | null): { hours: number; minutes: number } | null => {
    if (!time) return null;
    const raw = time.trim();
    if (!raw) return null;

    const twelveHour = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (twelveHour) {
        let hours = Number(twelveHour[1]);
        const minutes = Number(twelveHour[2]);
        const meridiem = (twelveHour[3] || '').toUpperCase();

        if (Number.isNaN(hours) || Number.isNaN(minutes) || minutes < 0 || minutes > 59 || hours < 1 || hours > 12) {
            return null;
        }

        if (meridiem === 'AM') {
            if (hours === 12) hours = 0;
        } else if (hours !== 12) {
            hours += 12;
        }

        return { hours, minutes };
    }

    const twentyFourHour = raw.match(/^(\d{1,2}):(\d{2})$/);
    if (!twentyFourHour) return null;

    const hours = Number(twentyFourHour[1]);
    const minutes = Number(twentyFourHour[2]);

    if (Number.isNaN(hours) || Number.isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return null;
    }

    return { hours, minutes };
};

const getScheduledDateTime = (date: Date | null | undefined, time: string | null | undefined): Date | null => {
    if (!date) return null;
    const parsedTime = parseTimeInput(time);
    if (!parsedTime) return null;

    const scheduledAt = new Date(date);
    scheduledAt.setHours(parsedTime.hours, parsedTime.minutes, 0, 0);
    return scheduledAt;
};

const collectMatchesToPromoteLive = (matches: Array<{ id: string; date: Date | null; time: string | null; status: MatchStatus }>) => {
    const now = new Date();
    return matches
        .filter((match) => match.status === MatchStatus.SCHEDULED)
        .filter((match) => {
            const scheduledAt = getScheduledDateTime(match.date, match.time);
            return scheduledAt !== null && scheduledAt.getTime() <= now.getTime();
        })
        .map((match) => match.id);
};

async function resolveSportIds(sport: string, gender: string): Promise<string[]> {
    const where: Prisma.SportWhereInput = { isActive: true };

    if (sport && sport !== 'All') {
        where.OR = [{ name: sport }, { id: sport }];
    }

    const g = normalizeGenderForDb(gender);
    if (g) {
        where.gender = g;
    }

    const sports = await prisma.sport.findMany({
        where,
        select: { id: true },
        take: MAX_QUERY_TAKE,
    });

    return sports.map((item) => item.id);
}

async function resolveSingleSportId(sport: string, gender: string): Promise<string | null> {
    const ids = await resolveSportIds(sport, gender);
    return ids[0] || null;
}

async function assertFixtureMutationAccess(user: AuthUser, sportId?: string | null): Promise<void> {
    assertPermission(user as PermissionUser, 'manage:fixtures');

    if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.SPORTS_ADMIN) {
        return;
    }

    throw new Error('Unauthorized: only Sports Admin roles can mutate fixtures.');
}

function toWinnerEnum(
    winner: string | null | undefined,
    team1Name: string | null | undefined,
    team2Name: string | null | undefined
): MatchWinner | null {
    if (!winner) return null;
    const raw = winner.toUpperCase();

    if (raw === 'TEAM1') return MatchWinner.TEAM1;
    if (raw === 'TEAM2') return MatchWinner.TEAM2;
    if (raw === 'DRAW') return MatchWinner.DRAW;

    if (winner === team1Name) return MatchWinner.TEAM1;
    if (winner === team2Name) return MatchWinner.TEAM2;

    return null;
}

function winnerEnumToName(match: {
    winner: MatchWinner | null;
    team1Name: string | null;
    team2Name: string | null;
}): string | null {
    if (!match.winner) return null;
    if (match.winner === MatchWinner.TEAM1) return match.team1Name;
    if (match.winner === MatchWinner.TEAM2) return match.team2Name;
    return 'DRAW';
}

async function handleMatchProgression(match: Match & { sport: { id: string; name: string; gender: string } }) {
    if (!match.matchId) return;

    const sportId = match.sportId;
    const winnerId =
        match.winner === MatchWinner.TEAM1
            ? match.team1Id
            : match.winner === MatchWinner.TEAM2
                ? match.team2Id
                : null;

    const winnerName =
        match.winner === MatchWinner.TEAM1
            ? match.team1Name
            : match.winner === MatchWinner.TEAM2
                ? match.team2Name
                : null;

    if (match.status === MatchStatus.COMPLETED) {
        if (!winnerId || !winnerName) return;

        if (match.matchId === 'R1-M1') {
            await prisma.match.updateMany({
                where: { sportId, matchId: 'SF-M1' },
                data: { team2Id: winnerId, team2Name: winnerName },
            });

            const sportTeams = await prisma.sportTeam.findMany({
                where: { sportId },
                select: { id: true, team: { select: { id: true, teamName: true } } },
                orderBy: { createdAt: 'asc' },
                take: MAX_QUERY_TAKE,
            });

            const usedIds = [match.team1Id, match.team2Id].filter(Boolean);
            const remaining = sportTeams
                .map((item) => item.team)
                .filter((team) => !usedIds.includes(team.id));

            if (remaining.length >= 1) {
                await prisma.match.updateMany({
                    where: { sportId, matchId: 'SF-M1', team1Id: null },
                    data: { team1Id: remaining[0]!.id, team1Name: remaining[0]!.teamName },
                });
            }
            if (remaining.length >= 2) {
                await prisma.match.updateMany({
                    where: { sportId, matchId: 'SF-M2', team1Id: null },
                    data: { team1Id: remaining[1]!.id, team1Name: remaining[1]!.teamName },
                });
            }
            if (remaining.length >= 3) {
                await prisma.match.updateMany({
                    where: { sportId, matchId: 'SF-M2', team2Id: null },
                    data: { team2Id: remaining[2]!.id, team2Name: remaining[2]!.teamName },
                });
            }
        } else if (match.matchId === 'SF-M1') {
            await prisma.match.updateMany({
                where: { sportId, matchId: 'GF-M1' },
                data: { team1Id: winnerId, team1Name: winnerName },
            });
        } else if (match.matchId === 'SF-M2') {
            await prisma.match.updateMany({
                where: { sportId, matchId: 'GF-M1' },
                data: { team2Id: winnerId, team2Name: winnerName },
            });
        }

        const placeholder = `Winner of ${match.matchId}`;
        await prisma.match.updateMany({
            where: { sportId, team1Name: placeholder },
            data: { team1Id: winnerId, team1Name: winnerName },
        });
        await prisma.match.updateMany({
            where: { sportId, team2Name: placeholder },
            data: { team2Id: winnerId, team2Name: winnerName },
        });

        if (match.matchId === 'GF-M1') {
            const runnerUpName = match.winner === MatchWinner.TEAM1 ? match.team2Name : match.team1Name;

            const extractBranch = (name: string | null) => {
                if (!name) return null;
                const first = name.split(' ')[0]?.toUpperCase();
                if (!first) return null;
                return BRANCHES.includes(first as any) ? first : null;
            };

            const winnerBranch = extractBranch(winnerName);
            const runnerBranch = extractBranch(runnerUpName);
            const notifications: Prisma.NotificationCreateManyInput[] = [];

            if (winnerBranch) {
                const winnerAdmin = await prisma.admin.findFirst({ where: { branch: winnerBranch, role: 'BRANCH_ADMIN' }, select: { id: true, name: true } });
                if (winnerAdmin) {
                    notifications.push({
                        recipientId: winnerAdmin.id,
                        recipientName: winnerAdmin.name || 'Branch Admin',
                        recipientRole: 'BRANCH_ADMIN',
                        message: `🏆 Victory Alert! Your ${normalizeGenderForUi(match.sport.gender)} ${match.sport.name} team are the CHAMPIONS! Certificates are ready for distribution.`,
                        type: 'achievement',
                        priority: 'high',
                        senderId: 'system',
                        senderName: 'Sports System',
                        senderRole: 'SYSTEM',
                    });
                }
            }

            if (runnerBranch) {
                const runnerAdmin = await prisma.admin.findFirst({ where: { branch: runnerBranch, role: 'BRANCH_ADMIN' }, select: { id: true, name: true } });
                if (runnerAdmin) {
                    notifications.push({
                        recipientId: runnerAdmin.id,
                        recipientName: runnerAdmin.name || 'Branch Admin',
                        recipientRole: 'BRANCH_ADMIN',
                        message: `🥈 Great Effort! Your ${normalizeGenderForUi(match.sport.gender)} ${match.sport.name} team are the Runner-Ups. Certificates are ready for distribution.`,
                        type: 'achievement',
                        priority: 'normal',
                        senderId: 'system',
                        senderName: 'Sports System',
                        senderRole: 'SYSTEM',
                    });
                }
            }

            if (notifications.length > 0) {
                await prisma.notification.createMany({ data: notifications });
            }

            // ── 1. Update BranchPoints ──
            const sport = await prisma.sport.findUnique({
                where: { id: sportId },
                select: { winnerPoints: true, runnerUpPoints: true },
            });
            if (sport) {
                await prisma.branchPoints.deleteMany({ where: { sportId } });
                const pointRows: { sportId: string; branch: string; points: number; manualAdjustment: number }[] = [];
                if (winnerBranch) pointRows.push({ sportId, branch: winnerBranch, points: sport.winnerPoints || 10, manualAdjustment: 0 });
                if (runnerBranch) pointRows.push({ sportId, branch: runnerBranch, points: sport.runnerUpPoints || 5, manualAdjustment: 0 });
                if (pointRows.length > 0) {
                    await prisma.branchPoints.createMany({ data: pointRows });
                }
            }

            // ── 2. Create SportWinnerAnnouncement ──
            // This ensures team sports also show up in the Overall Results and Championship tracking lists.
            const announcementPositions = {
                first: { branch: winnerBranch || 'TBD', email: '' },
                second: { branch: runnerBranch || 'TBD', email: '' },
                third: { branch: '', email: '' } // Bronze rarely defined in this bracket
            };

            await prisma.sportWinnerAnnouncement.upsert({
                where: { sportId },
                create: {
                    sportId,
                    positions: announcementPositions as any,
                    isPublished: true,
                    publishedAt: new Date()
                },
                update: {
                    positions: announcementPositions as any,
                    isPublished: true,
                    publishedAt: new Date()
                },
            });
        }
    } else if (match.status === MatchStatus.PENDING || match.status === MatchStatus.SCHEDULED) {
        if (match.matchId === 'R1-M1') {
            await prisma.match.updateMany({
                where: {
                    sportId,
                    matchId: 'SF-M1',
                    team2Id: null,
                    OR: [
                        { team2Name: null },
                        { team2Name: '' },
                        { team2Name: 'TBD' },
                        { team2Name: 'Winner of R1-M1' },
                    ],
                },
                data: { team2Id: null, team2Name: 'Winner of R1-M1' },
            });
        } else if (match.matchId === 'SF-M1') {
            await prisma.match.updateMany({
                where: {
                    sportId,
                    matchId: 'GF-M1',
                    team1Id: null,
                    OR: [
                        { team1Name: null },
                        { team1Name: '' },
                        { team1Name: 'TBD' },
                        { team1Name: 'Winner of SF-M1' },
                        { team1Name: 'Winner of SF-M2' },
                    ],
                },
                data: { team1Id: null, team1Name: 'Winner of SF-M1' },
            });
        } else if (match.matchId === 'SF-M2') {
            await prisma.match.updateMany({
                where: {
                    sportId,
                    matchId: 'GF-M1',
                    team2Id: null,
                    OR: [
                        { team2Name: null },
                        { team2Name: '' },
                        { team2Name: 'TBD' },
                        { team2Name: 'Winner of SF-M1' },
                        { team2Name: 'Winner of SF-M2' },
                    ],
                },
                data: { team2Id: null, team2Name: 'Winner of SF-M2' },
            });
        }
    }
}

function formatMatchForUi(match: any) {
    return {
        ...match,
        sportId: match.sportId,
        sport: match.sport?.name || 'Unknown',
        gender: match.sport ? normalizeGenderForUi(match.sport.gender) : 'Mixed',
        roundOrder: getRoundOrder(match.round),
        status: normalizeStatusForUi(match.status),
        winner: winnerEnumToName(match),
        date: match.date ? match.date.toISOString().split('T')[0] : null,
    };
}

export async function getMatches(sport: string, gender: string): Promise<FixtureActionResponse<Match[]>> {
    const user = await getAuthenticatedUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    return executeAction(async () => {
        const sportIds = await resolveSportIds(sport, gender);

        const where: Prisma.MatchWhereInput = {};
        if (sportIds.length > 0) {
            where.sportId = { in: sportIds };
        } else if (sport !== 'All' || gender !== 'All') {
            return { success: true, data: [] } as FixtureActionResponse<Match[]>;
        }

        const matches = await prisma.match.findMany({
            where,
            select: {
                id: true,
                sportId: true,
                round: true,
                matchId: true,
                team1Id: true,
                team1Name: true,
                team2Id: true,
                team2Name: true,
                date: true,
                time: true,
                venue: true,
                status: true,
                score1: true,
                score2: true,
                winner: true,
                note: true,
                referee: true,
                matchOrder: true,
                createdAt: true,
                sport: { select: { id: true, name: true, gender: true } },
            },
            orderBy: [{ matchOrder: 'asc' }, { createdAt: 'asc' }],
            take: MAX_QUERY_TAKE,
        });

        const toLiveIds = collectMatchesToPromoteLive(matches);
        if (toLiveIds.length > 0) {
            await prisma.match.updateMany({
                where: {
                    id: { in: toLiveIds },
                    status: MatchStatus.SCHEDULED,
                },
                data: { status: MatchStatus.LIVE },
            });

            for (const match of matches) {
                if (toLiveIds.includes(match.id)) {
                    match.status = MatchStatus.LIVE;
                }
            }
        }

        const sorted = matches.sort((a, b) => {
            const orderA = getRoundOrder(a.round);
            const orderB = getRoundOrder(b.round);
            if (orderA !== orderB) return orderA - orderB;
            return (a.matchOrder || 0) - (b.matchOrder || 0);
        });

        return { success: true, data: sorted.map(formatMatchForUi) } as FixtureActionResponse<Match[]>;
    }, 'getMatches');
}

export async function getCompletedMatches(sport: string, gender: string): Promise<FixtureActionResponse<Match[]>> {
    const user = await getAuthenticatedUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    return executeAction(async () => {
        const sportIds = await resolveSportIds(sport, gender);

        const where: Prisma.MatchWhereInput = { status: MatchStatus.COMPLETED };
        if (sportIds.length > 0) {
            where.sportId = { in: sportIds };
        } else if (sport !== 'All' || gender !== 'All') {
            return { success: true, data: [] } as FixtureActionResponse<Match[]>;
        }

        const matches = await prisma.match.findMany({
            where,
            select: {
                id: true,
                sportId: true,
                round: true,
                matchId: true,
                team1Id: true,
                team1Name: true,
                team2Id: true,
                team2Name: true,
                date: true,
                time: true,
                venue: true,
                status: true,
                score1: true,
                score2: true,
                winner: true,
                note: true,
                referee: true,
                matchOrder: true,
                createdAt: true,
                sport: { select: { id: true, name: true, gender: true } },
            },
            orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
            take: MAX_QUERY_TAKE,
        });

        return { success: true, data: matches.map(formatMatchForUi) } as FixtureActionResponse<Match[]>;
    }, 'getCompletedMatches');
}

const BRANCH_TEAM_SEEDS = BRANCHES.map((branch) => ({
    teamName: `${branch}`,
    teamCode: `BR-${branch}`,
}));

async function ensureBranchTeamsExist(): Promise<boolean> {
    const existingCodes = await prisma.team.findMany({
        where: { teamCode: { in: BRANCH_TEAM_SEEDS.map((s) => s.teamCode) } },
        select: { teamCode: true },
    });

    const existingSet = new Set(existingCodes.map((t) => t.teamCode));
    const missing = BRANCH_TEAM_SEEDS.filter((s) => !existingSet.has(s.teamCode));

    if (missing.length === 0) return false; // nothing to create

    // Find or create a system user to act as team leader
    let systemUser = await prisma.user.findFirst({
        where: { email: 'system@ornate.internal' },
        select: { id: true },
    });

    if (!systemUser) {
        systemUser = await prisma.user.create({
            data: {
                name: 'System',
                email: 'system@ornate.internal',
                password: 'SYSTEM_NO_LOGIN',
                role: 'STUDENT',
            },
            select: { id: true },
        });
    }

    await prisma.team.createMany({
        data: missing.map((seed) => ({
            teamName: seed.teamName,
            teamCode: seed.teamCode,
            leaderId: systemUser.id,
            leaderName: 'System',
            leaderEmail: 'system@ornate.internal',
            status: 'CONFIRMED' as const,
            paymentStatus: 'PAID' as const,
        })),
        skipDuplicates: true,
    });

    return true; // teams were created
}

const getCachedTeams = unstable_cache(
    async () => {
        return prisma.team.findMany({
            select: {
                id: true,
                teamName: true,
                teamCode: true,
            },
            orderBy: { teamName: 'asc' },
            take: MAX_QUERY_TAKE,
        });
    },
    ['teams-list-v2'],
    { tags: [CACHE_TAGS.teams], revalidate: 120 }
);

export async function getTeams(): Promise<FixtureActionResponse<any[]>> {
    const user = await getAuthenticatedUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    return executeAction(async () => {
        // Ensure the 5 branch teams always exist
        const created = await ensureBranchTeamsExist();

        // If we just created teams, bypass cache to get fresh data
        if (created) {
            const teams = await prisma.team.findMany({
                select: { id: true, teamName: true, teamCode: true },
                orderBy: { teamName: 'asc' },
                take: MAX_QUERY_TAKE,
            });
            return { success: true, data: teams };
        }

        const teams = await getCachedTeams();
        return { success: true, data: teams };
    }, 'getTeams');
}

const REQUIRED_MATCH_IDS = BRACKET_STRUCTURE.flatMap((r) => r.matches.map((m) => m.matchId));

export async function initializeTournament(sport: string, gender: string): Promise<FixtureActionResponse<Match[]>> {
    const user = await getAuthenticatedUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    return executeAction(async () => {
        const sportId = await resolveSingleSportId(sport, gender);
        if (!sportId) {
            return { success: false, error: 'Sport not found for the selected filters.' } as FixtureActionResponse<Match[]>;
        }

        const canManage = hasPermission(user as PermissionUser, 'manage:fixtures');

        // ── Fast read-only path: skip all writes if bracket is already complete ──
        const existing = await prisma.match.findMany({
            where: { sportId },
            include: { sport: { select: { id: true, name: true, gender: true } } },
            orderBy: [{ matchOrder: 'asc' }, { createdAt: 'asc' }],
            take: MAX_QUERY_TAKE,
        });

        const existingTemplateIds = new Set(existing.filter((m) => m.matchId).map((m) => m.matchId));
        const allBracketSlotsExist = REQUIRED_MATCH_IDS.every((id) => existingTemplateIds.has(id));

        if (allBracketSlotsExist) {
            // Bracket already fully initialized — only promote scheduled→live if needed
            const toLiveIds = collectMatchesToPromoteLive(existing);
            if (toLiveIds.length > 0 && canManage) {
                await prisma.match.updateMany({
                    where: { id: { in: toLiveIds }, status: MatchStatus.SCHEDULED },
                    data: { status: MatchStatus.LIVE },
                });
                for (const match of existing) {
                    if (toLiveIds.includes(match.id)) match.status = MatchStatus.LIVE;
                }
                await revalidateFixtureData();
            }
            return { success: true, data: existing.map(formatMatchForUi) } as FixtureActionResponse<Match[]>;
        }

        // ── Slow path: bracket needs initialization (first time only) ──
        const toCreate: Prisma.MatchCreateManyInput[] = [];

        for (const round of BRACKET_STRUCTURE) {
            for (const template of round.matches) {
                if (!existingTemplateIds.has(template.matchId)) {
                    let team1Name = 'TBD';
                    let team2Name = 'TBD';

                    if (template.matchId === 'SF-M1') team2Name = 'Winner of R1-M1';
                    if (template.matchId === 'GF-M1') {
                        team1Name = 'Winner of SF-M1';
                        team2Name = 'Winner of SF-M2';
                    }

                    toCreate.push({
                        sportId,
                        round: round.level,
                        matchId: template.matchId,
                        matchOrder: template.order,
                        note: template.note,
                        date: null,
                        time: null,
                        venue: null,
                        status: MatchStatus.PENDING,
                        team1Name,
                        team2Name,
                    });
                }
            }
        }

        // Batch creation + placeholder fixes in a single transaction
        await prisma.$transaction(async (tx) => {
            if (toCreate.length > 0) {
                await tx.match.createMany({ data: toCreate });
            }
            await tx.match.updateMany({
                where: {
                    sportId,
                    matchId: 'GF-M1',
                    team1Id: null,
                    OR: [
                        { team1Name: null },
                        { team1Name: '' },
                        { team1Name: 'TBD' },
                        { team1Name: 'Winner of SF-M1' },
                        { team1Name: 'Winner of SF-M2' },
                    ],
                },
                data: { team1Name: 'Winner of SF-M1' },
            });
            await tx.match.updateMany({
                where: {
                    sportId,
                    matchId: 'GF-M1',
                    team2Id: null,
                    OR: [
                        { team2Name: null },
                        { team2Name: '' },
                        { team2Name: 'TBD' },
                        { team2Name: 'Winner of SF-M1' },
                        { team2Name: 'Winner of SF-M2' },
                    ],
                },
                data: { team2Name: 'Winner of SF-M2' },
            });
        });

        const matches = await prisma.match.findMany({
            where: { sportId },
            include: { sport: { select: { id: true, name: true, gender: true } } },
            orderBy: [{ matchOrder: 'asc' }, { createdAt: 'asc' }],
            take: MAX_QUERY_TAKE,
        });

        const toLiveIds = collectMatchesToPromoteLive(matches);
        if (toLiveIds.length > 0 && canManage) {
            await prisma.match.updateMany({
                where: {
                    id: { in: toLiveIds },
                    status: MatchStatus.SCHEDULED,
                },
                data: { status: MatchStatus.LIVE },
            });

            for (const match of matches) {
                if (toLiveIds.includes(match.id)) {
                    match.status = MatchStatus.LIVE;
                }
            }
        }

        if (canManage) await revalidateFixtureData();
        return { success: true, data: matches.map(formatMatchForUi) } as FixtureActionResponse<Match[]>;
    }, 'initializeTournament');
}

export async function updateMatch(id: string, data: Partial<MatchData>): Promise<FixtureActionResponse<Match>> {
    const user = await getAuthenticatedUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    return executeAction(async () => {
        const current = await prisma.match.findUnique({
            where: { id },
            include: { sport: { select: { id: true, name: true, gender: true } } },
        });

        if (!current) throw new Error('Match not found');

        await assertFixtureMutationAccess(user, current.sportId);

        const updateData: Prisma.MatchUncheckedUpdateInput = {};

        if (data.round !== undefined) updateData.round = data.round;
        if (data.matchId !== undefined) updateData.matchId = data.matchId;
        if (data.matchOrder !== undefined) updateData.matchOrder = data.matchOrder;

        if (data.team1Id !== undefined) updateData.team1Id = data.team1Id;
        if (data.team1Name !== undefined) updateData.team1Name = data.team1Name;
        if (data.team2Id !== undefined) updateData.team2Id = data.team2Id;
        if (data.team2Name !== undefined) updateData.team2Name = data.team2Name;

        if (data.date !== undefined) updateData.date = parseDateInput(data.date);
        if (data.time !== undefined) updateData.time = data.time;
        if (data.venue !== undefined) updateData.venue = data.venue;

        if (data.score1 !== undefined) updateData.score1 = data.score1;
        if (data.score2 !== undefined) updateData.score2 = data.score2;
        if (data.note !== undefined) updateData.note = data.note;
        if (data.referee !== undefined) updateData.referee = data.referee;

        if (data.winner !== undefined) {
            const winnerEnum = toWinnerEnum(
                data.winner,
                data.team1Name ?? current.team1Name,
                data.team2Name ?? current.team2Name
            );
            updateData.winner = winnerEnum;
        }

        const explicitCompleted = data.status !== undefined && normalizeStatusForDb(data.status) === MatchStatus.COMPLETED;
        if (explicitCompleted) {
            const nextDate = (updateData.date as Date | null | undefined) !== undefined ? (updateData.date as Date | null) : current.date;
            const nextTime = updateData.time !== undefined ? (updateData.time as string | null) : current.time;
            const nextVenue = updateData.venue !== undefined ? (updateData.venue as string | null) : current.venue;
            const nextScore1 = updateData.score1 !== undefined ? (updateData.score1 as string | null) : current.score1;
            const nextScore2 = updateData.score2 !== undefined ? (updateData.score2 as string | null) : current.score2;
            const nextWinner = updateData.winner !== undefined ? (updateData.winner as MatchWinner | null) : current.winner;

            const hasScheduling = Boolean(nextDate && (nextTime || '').trim() && (nextVenue || '').trim());
            const hasResult = Boolean((nextScore1 || '').trim() && (nextScore2 || '').trim() && nextWinner);
            if (!hasScheduling) {
                throw new Error('Cannot mark match as completed without date, time and venue');
            }
            if (!hasResult) {
                throw new Error('Cannot mark match as completed without score and winner');
            }

            updateData.status = MatchStatus.COMPLETED;
        } else if (current.status !== MatchStatus.COMPLETED) {
            const nextDate = (updateData.date as Date | null | undefined) !== undefined ? (updateData.date as Date | null) : current.date;
            const nextTime = updateData.time !== undefined ? (updateData.time as string | null) : current.time;
            const nextVenue = updateData.venue !== undefined ? (updateData.venue as string | null) : current.venue;

            const hasScheduling = Boolean(nextDate && (nextTime || '').trim() && (nextVenue || '').trim());
            updateData.status = hasScheduling ? MatchStatus.SCHEDULED : MatchStatus.PENDING;
        }

        const updated = await prisma.match.update({
            where: { id },
            data: updateData,
            include: { sport: { select: { id: true, name: true, gender: true } } },
        });

        await handleMatchProgression(updated);

        // Auto-sync BranchPoints when a Grand Final is completed
        if (updated.status === MatchStatus.COMPLETED && updated.matchId === 'GF-M1') {
            await syncBranchPointsForSport(updated.sportId);
        }

        await revalidateFixtureData();

        return { success: true, data: formatMatchForUi(updated) } as FixtureActionResponse<Match>;
    }, 'updateMatch');
}

export async function createMatch(data: Partial<MatchData>): Promise<FixtureActionResponse<Match>> {
    const user = await getAuthenticatedUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    return executeAction(async () => {
        const sportId =
            data.sportId ||
            (data.sport ? await resolveSingleSportId(data.sport, data.gender || 'All') : null);

        if (!sportId) throw new Error('Sport is required to create a match');

        await assertFixtureMutationAccess(user, sportId);

        const round = data.round || 'Round 1';
        const created = await prisma.match.create({
            data: {
                sportId,
                round,
                matchId: data.matchId || null,
                matchOrder: data.matchOrder ?? 0,
                team1Id: data.team1Id || null,
                team1Name: data.team1Name || 'TBD',
                team2Id: data.team2Id || null,
                team2Name: data.team2Name || 'TBD',
                date: parseDateInput(data.date),
                time: data.time || null,
                venue: data.venue || null,
                status: MatchStatus.PENDING,
                score1: data.score1 || null,
                score2: data.score2 || null,
                winner: toWinnerEnum(data.winner, data.team1Name, data.team2Name),
                note: data.note || null,
                referee: data.referee || null,
            },
            include: { sport: { select: { id: true, name: true, gender: true } } },
        });

        await revalidateFixtureData();
        return { success: true, data: formatMatchForUi(created) } as FixtureActionResponse<Match>;
    }, 'createMatch');
}

export async function deleteMatch(id: string): Promise<FixtureActionResponse> {
    const user = await getAuthenticatedUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    return executeAction(async () => {
        const existing = await prisma.match.findUnique({
            where: { id },
            select: { id: true, sportId: true },
        });
        if (!existing) throw new Error('Match not found');

        await assertFixtureMutationAccess(user, existing.sportId);

        await prisma.match.delete({ where: { id } });
        await revalidateFixtureData();
        return { success: true };
    }, 'deleteMatch');
}

export async function getTournamentStandings(): Promise<FixtureActionResponse> {
    const user = await getAuthenticatedUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    return executeAction(async () => {
        // Read pre-computed points from BranchPoints table (1 query + 1 for sport names)
        const [branchPoints, activeSports] = await Promise.all([
            prisma.branchPoints.findMany({
                include: { sport: { select: { name: true, gender: true } } },
                take: MAX_QUERY_TAKE,
            }),
            prisma.sport.findMany({
                where: { isActive: true },
                select: { name: true },
                orderBy: [{ name: 'asc' }],
                take: MAX_QUERY_TAKE,
            }),
        ]);

        const sports = Array.from(new Set(activeSports.map((s) => s.name).filter(Boolean)));

        type GenderStandings = Record<string, Record<string, number>>;
        const standings: { Boys: GenderStandings; Girls: GenderStandings } = { Boys: {}, Girls: {} };

        for (const sport of sports) {
            standings.Boys[sport] = {};
            standings.Girls[sport] = {};
            for (const branch of BRANCHES) {
                standings.Boys[sport]![branch] = 0;
                standings.Girls[sport]![branch] = 0;
            }
        }

        for (const bp of branchPoints) {
            const rawSportName = bp.sport.name;
            const genderKey = bp.sport.gender === 'FEMALE' ? 'Girls' : 'Boys';

            // Grouping logic: All sub-categories of Athletics are combined into one row
            const isAthletic = rawSportName.toLowerCase().includes('athletic');
            const bucketName = isAthletic ? 'Athletics' : rawSportName;

            if (!standings[genderKey][bucketName]) {
                standings[genderKey][bucketName] = {};
                for (const branch of BRANCHES) {
                    standings[genderKey][bucketName]![branch] = 0;
                }
            }

            const pointsObj = standings[genderKey][bucketName]!;
            pointsObj[bp.branch] = (pointsObj[bp.branch] || 0) + (bp.points + bp.manualAdjustment);
        }

        return { success: true, data: standings };
    }, 'getTournamentStandings');
}

export async function getOverallBranchStandings(): Promise<FixtureActionResponse> {
    const user = await getAuthenticatedUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    return executeAction(async () => {
        const grouped = await prisma.branchPoints.groupBy({
            by: ['branch'],
            _sum: { points: true, manualAdjustment: true },
        });

        const branchMetadata: Record<string, { name: string; color: string }> = {
            CSE: { name: 'Computer Science', color: '#3B82F6' },
            ECE: { name: 'Electronics & Comm.', color: '#10B981' },
            MECH: { name: 'Mechanical', color: '#F59E0B' },
            CIVIL: { name: 'Civil Engineering', color: '#EF4444' },
            EEE: { name: 'Electrical & Electronics', color: '#8B5CF6' },
        };

        const allBranches = Object.keys(branchMetadata);
        const groupedMap = new Map(grouped.map(g => [g.branch, (g._sum.points || 0) + (g._sum.manualAdjustment || 0)]));

        const data = allBranches
            .map((branch) => ({
                branch,
                name: branchMetadata[branch]!.name,
                points: groupedMap.get(branch) || 0,
                color: branchMetadata[branch]!.color,
            }))
            .sort((a, b) => b.points - a.points)
            .map((item, index) => ({ ...item, rank: index + 1 }));

        return { success: true, data };
    }, 'getOverallBranchStandings');
}

export async function getUpcomingMatches(limit = 6): Promise<FixtureActionResponse<Match[]>> {
    const user = await getAuthenticatedUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    return executeAction(async () => {
        const matches = await prisma.match.findMany({
            where: {
                status: { in: [MatchStatus.PENDING, MatchStatus.SCHEDULED, MatchStatus.LIVE] },
            },
            select: {
                id: true,
                sportId: true,
                round: true,
                matchId: true,
                team1Id: true,
                team1Name: true,
                team2Id: true,
                team2Name: true,
                date: true,
                time: true,
                venue: true,
                status: true,
                score1: true,
                score2: true,
                winner: true,
                note: true,
                referee: true,
                matchOrder: true,
                createdAt: true,
                sport: { select: { id: true, name: true, gender: true } },
            },
            orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
            take: clampTake(limit, 6),
        });

        const toLiveIds = collectMatchesToPromoteLive(matches);
        if (toLiveIds.length > 0) {
            await prisma.match.updateMany({
                where: {
                    id: { in: toLiveIds },
                    status: MatchStatus.SCHEDULED,
                },
                data: { status: MatchStatus.LIVE },
            });

            for (const match of matches) {
                if (toLiveIds.includes(match.id)) {
                    match.status = MatchStatus.LIVE;
                }
            }
        }

        return { success: true, data: matches.map(formatMatchForUi) } as FixtureActionResponse<Match[]>;
    }, 'getUpcomingMatches');
}

export async function initializeAllTournaments(): Promise<
    FixtureActionResponse<{ sport: string; gender: string; success: boolean }[]>
> {
    const user = await getAuthenticatedUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    return executeAction(async () => {
        await assertFixtureMutationAccess(user);

        const sports = await prisma.sport.findMany({
            where: { isActive: true },
            select: { name: true, gender: true },
            orderBy: [{ name: 'asc' }],
            take: MAX_QUERY_TAKE,
        });

        const results: { sport: string; gender: string; success: boolean }[] = [];
        for (const sport of sports) {
            const gender = normalizeGenderForUi(sport.gender);
            const res = await initializeTournament(sport.name, gender);
            results.push({ sport: sport.name, gender, success: res.success });
        }

        await revalidateFixtureData();
        return { success: true, results };
    }, 'initializeAllTournaments');
}
