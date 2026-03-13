'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { rateLimiters } from '@/lib/rate-limit';
import { uploadToR2 } from '@/lib/r2';
import crypto from 'crypto';

type PrismaWithOptionalGamification = typeof prisma & {
    cadetProfile?: typeof prisma.cadetProfile;
    energyTransaction?: typeof prisma.energyTransaction;
};

const prismaGamification = prisma as PrismaWithOptionalGamification;

const UpdateProfileSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    phone: z.string().regex(/^\d{10}$/).optional(),
    branch: z.string().optional(),
    currentYear: z.string().optional(),
});

function isUnauthorizedError(error: unknown): boolean {
    return error instanceof Error && error.message === 'Unauthorized';
}

export async function updateProfile(input: z.infer<typeof UpdateProfileSchema>) {
    try {
        const user = await requireAuth();
        const rl = await rateLimiters.action(user.id);
        if (!rl.success) return { success: false, error: 'Too many requests.' };

        const parsed = UpdateProfileSchema.safeParse(input);
        if (!parsed.success) return { success: false, error: 'Invalid input.' };

        const data: Record<string, string> = {};
        if (parsed.data.name) data.name = parsed.data.name;
        if (parsed.data.phone) data.phone = parsed.data.phone;
        if (parsed.data.branch) data.branch = parsed.data.branch;
        if (parsed.data.currentYear) data.currentYear = parsed.data.currentYear;

        if (Object.keys(data).length === 0) return { success: false, error: 'Nothing to update.' };

        let userData = await prisma.user.findUnique({ where: { id: user.id } });
        if (!userData && user.email) userData = await prisma.user.findUnique({ where: { email: user.email } });

        if (!userData) return { success: false, error: 'User profile not found.' };

        await prisma.user.update({
            where: { id: userData.id },
            data,
        });

        return { success: true };
    } catch (error: unknown) {
        if (isUnauthorizedError(error)) return { success: false, error: 'Please log in.' };
        console.error('[updateProfile]', error);
        return { success: false, error: 'Profile update failed.' };
    }
}

export async function uploadAvatar(formData: FormData) {
    try {
        const user = await requireAuth();
        const rl = await rateLimiters.action(user.id);
        if (!rl.success) return { success: false, error: 'Too many requests.' };

        const file = formData.get('avatar') as File | null;
        if (!file) return { success: false, error: 'No file provided.' };
        if (file.size > 5 * 1024 * 1024) return { success: false, error: 'File too large (max 5MB).' };

        const ext = file.name.split('.').pop() ?? 'jpg';
        const key = `avatars/${user.id}-${crypto.randomUUID()}.${ext}`;
        const buffer = Buffer.from(await file.arrayBuffer());
        const url = await uploadToR2(key, buffer, file.type);

        return { success: true, data: { avatarUrl: url } };
    } catch (error: unknown) {
        if (isUnauthorizedError(error)) return { success: false, error: 'Please log in.' };
        console.error('[uploadAvatar]', error);
        return { success: false, error: 'Upload failed.' };
    }
}

export async function getMyProfile() {
    try {
        const user = await requireAuth();

        let userData = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
                registrations: {
                    include: { event: { select: { title: true, date: true, venue: true, price: true, category: true } } },
                    orderBy: { createdAt: 'desc' },
                    take: 100,
                },
                leaderOf: {
                    include: {
                        event: { select: { title: true, date: true, venue: true } },
                        members: { select: { name: true, role: true, status: true } },
                        sportTeam: {
                            include: {
                                sport: { select: { name: true, category: true, gender: true, status: true } }
                            }
                        }
                    },
                    take: 50,
                },
                teamMembers: {
                    include: {
                        team: {
                            include: {
                                event: { select: { title: true, date: true, venue: true } },
                                sportTeam: {
                                    include: {
                                        sport: { select: { name: true, category: true, gender: true, status: true } }
                                    }
                                }
                            }
                        }
                    },
                    take: 100,
                }
            },
        });

        if (!userData && user.email) {
            userData = await prisma.user.findUnique({
                where: { email: user.email },
                include: {
                    registrations: {
                        include: { event: { select: { title: true, date: true, venue: true, price: true, category: true } } },
                        orderBy: { createdAt: 'desc' },
                        take: 100,
                    },
                    leaderOf: {
                        include: {
                            event: { select: { title: true, date: true, venue: true } },
                            members: { select: { name: true, role: true, status: true } },
                            sportTeam: {
                                include: {
                                    sport: { select: { name: true, category: true, gender: true, status: true } }
                                }
                            }
                        },
                        take: 50,
                    },
                    teamMembers: {
                        include: {
                            team: {
                                include: {
                                    event: { select: { title: true, date: true, venue: true } },
                                    sportTeam: {
                                        include: {
                                            sport: { select: { name: true, category: true, gender: true, status: true } }
                                        }
                                    }
                                }
                            }
                        },
                        take: 100,
                    }
                },
            });
        }

        if (!userData) return null;

        const sportRegistrations = await prisma.sportRegistration.findMany({
            where: { email: user.email || undefined },
            include: { sport: { select: { name: true, category: true, gender: true, status: true } } },
            orderBy: { createdAt: 'desc' }
        });

        // ─── Gamification profile ─────────────────────────────────────────────
        let gamification: {
            totalEnergy: number;
            level: { level: number; name: string; min: number; max: number };
            badgeIds: string[];
            rank: number | null;
            transactions: { amount: number; reason: string; note: string | null; createdAt: string }[];
        } | null = null;

        try {
            const { getCadetLevel } = await import('@/lib/gamification-constants');
            if (prismaGamification.cadetProfile) {
                const cadetProfile = await prismaGamification.cadetProfile.findUnique({
                    where: { userId: userData.id },
                });

                const transactions = prismaGamification.energyTransaction ? await prismaGamification.energyTransaction.findMany({
                    where: { userId: userData.id },
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                }) as Array<{ amount: number; reason: string; note: string | null; createdAt: Date }> : [];

                if (cadetProfile) {
                    const rank = await prismaGamification.cadetProfile.count({
                        where: { totalEnergy: { gt: cadetProfile.totalEnergy } },
                    });
                    gamification = {
                        totalEnergy: cadetProfile.totalEnergy,
                        level: getCadetLevel(cadetProfile.totalEnergy),
                        badgeIds: cadetProfile.badgeIds,
                        rank: rank + 1,
                        transactions: transactions.map((t) => ({
                            amount: t.amount,
                            reason: t.reason,
                            note: t.note,
                            createdAt: t.createdAt.toISOString(),
                        })),
                    };
                } else {
                    gamification = {
                        totalEnergy: 0,
                        level: getCadetLevel(0),
                        badgeIds: [],
                        rank: null,
                        transactions: [],
                    };
                }
            }
        } catch (error) {
            console.error('[getMyProfile gamification error]', error);
        }

        // ─── Compute stats from real data ────────────────────────────────────
        const uniqueSportTeamIds = new Set<string>();
        userData.leaderOf.forEach((t: any) => { if (t.sportTeam) uniqueSportTeamIds.add(t.id); });
        userData.teamMembers.forEach((tm: any) => { if (tm.team?.sportTeam) uniqueSportTeamIds.add(tm.team.id); });

        const missionsCount = 
            userData.registrations.length + 
            sportRegistrations.length + 
            uniqueSportTeamIds.size;

        const achievementsCount = userData.registrations.filter(
            (r: { rank: number | null; certificateUrl: string | null }) => (r.rank && r.rank > 0) || r.certificateUrl
        ).length;

        const userExt = userData as Record<string, unknown>;

        return {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            branch: userData.branch,
            currentYear: userData.currentYear,
            stdid: userData.stdid || (userData.role === 'STUDENT' ? userData.email.split('@')[0].toUpperCase() : null),
            phone: userData.phone,
            avatarUrl: typeof userExt.avatarUrl === 'string' ? userExt.avatarUrl : null,
            stats: {
                missions: missionsCount,
                achievements: achievementsCount,
                skills: 0,
                followers: 0,
                following: 0,
            },
            gamification,
            registrations: userData.registrations.map((r) => ({
                id: r.id,
                eventTitle: r.event.title,
                eventDate: r.event.date.toISOString(),
                venue: r.event.venue,
                status: r.status,
                paymentStatus: r.paymentStatus,
                certificateUrl: r.certificateUrl,
                certificateIssuedAt: r.certificateIssuedAt?.toISOString() ?? null,
                rank: r.rank,
                isPaid: r.event.price > 0,
                type: r.event.category,
            })),
            teams: userData.leaderOf.map((t: any) => ({
                id: t.id,
                teamName: t.teamName,
                teamCode: t.teamCode,
                eventTitle: t.sportTeam
                    ? `${t.sportTeam.sport.name} (${t.sportTeam.sport.category})`
                    : t.event?.title ?? 'Unknown',
                eventDate: t.event?.date?.toISOString() ?? null,
                venue: t.event?.venue ?? null,
                sportName: t.sportTeam?.sport.name ?? null,
                sportStatus: t.sportTeam?.sport.status ?? null,
                status: t.status,
                role: 'LEADER',
                isSport: !!t.sportTeam,
                members: t.members.map((m: any) => ({
                    name: m.name,
                    role: m.role,
                    status: m.status,
                })),
            })),
            teamMemberships: userData.teamMembers
                .filter((tm: any) => tm.team?.leaderId !== userData?.id)
                .map((tm: any) => ({
                    id: tm.id,
                    teamId: tm.team?.id,
                    teamName: tm.team?.teamName,
                    role: tm.role,
                    status: tm.status,
                    eventTitle: tm.team?.sportTeam
                        ? `${tm.team.sportTeam.sport.name} (${tm.team.sportTeam.sport.category})`
                        : tm.team?.event?.title ?? 'Unknown',
                    eventDate: tm.team?.event?.date?.toISOString() ?? null,
                    venue: tm.team?.event?.venue ?? null,
                    sportName: tm.team?.sportTeam?.sport.name ?? null,
                    sportStatus: tm.team?.sportTeam?.sport.status ?? null,
                    isSport: !!tm.team?.sportTeam,
                })),
            sportRegistrations: sportRegistrations.map((sr) => ({
                id: sr.id,
                sportName: sr.sport.name,
                category: sr.sport.category,
                gender: sr.sport.gender,
                status: sr.status,
                sportStatus: sr.sport.status,
            }))
        };
    } catch (error: unknown) {
        console.error('[getMyProfile error]', error);
        return null;
    }
}

export async function getStudentProfileByEmail(email: string) {
    try {
        const userData = await prisma.user.findUnique({
            where: { email },
            include: {
                registrations: {
                    include: {
                        event: { select: { title: true, date: true, venue: true, price: true, category: true } }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 100,
                },
                leaderOf: {
                    include: {
                        event: { select: { title: true, date: true, venue: true } },
                        members: { select: { name: true, role: true, status: true } },
                        sportTeam: {
                            include: {
                                sport: { select: { name: true, category: true, gender: true, status: true } }
                            }
                        }
                    },
                    take: 50,
                },
                teamMembers: {
                    include: {
                        team: {
                            include: {
                                event: { select: { title: true, date: true, venue: true } },
                                sportTeam: {
                                    include: {
                                        sport: { select: { name: true, category: true, gender: true, status: true } }
                                    }
                                }
                            }
                        }
                    },
                    take: 120,
                }
            },
        });

        if (!userData) return null;

        // Individual sport registrations
        const sportRegistrations = await prisma.sportRegistration.findMany({
            where: { email: userData.email },
            include: { sport: { select: { name: true, category: true, gender: true, status: true } } },
            orderBy: { createdAt: 'desc' }
        });

        // ─── Compute real counts ────────────────────────────────────────────────
        // Missions = event regs + individual sport regs + team sport memberships
        const uniqueSportTeamIds = new Set<string>();
        userData.leaderOf.forEach((t: { id: string; sportTeam: unknown | null }) => { if (t.sportTeam) uniqueSportTeamIds.add(t.id); });
        userData.teamMembers.forEach((tm: { team: { id: string; sportTeam: unknown | null } | null }) => { if (tm.team?.sportTeam) uniqueSportTeamIds.add(tm.team.id); });

        const missionsCount =
            userData.registrations.length +
            sportRegistrations.length +
            uniqueSportTeamIds.size;

        // Achievements = events with rank > 0 OR with a certificate issued
        const achievementsCount =
            userData.registrations.filter((r: { rank: number | null; certificateUrl: string | null }) => (r.rank && r.rank > 0) || r.certificateUrl).length;

        const userExt = userData as Record<string, unknown>;
        const followersCount = typeof userExt.followersCount === 'number' ? userExt.followersCount : 0;
        const skillsCount = typeof userExt.skillsCount === 'number' ? userExt.skillsCount : 0;
        const followingCount = typeof userExt.followingCount === 'number' ? userExt.followingCount : 0;

        return {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            branch: userData.branch,
            currentYear: userData.currentYear,
            stdid: userData.stdid || (userData.role === 'STUDENT' ? userData.email.split('@')[0].toUpperCase() : null),
            phone: userData.phone,
            stats: {
                missions: missionsCount,
                achievements: achievementsCount,
                followers: followersCount,
                skills: skillsCount,
                following: followingCount,
                xp: (missionsCount * 100) + (achievementsCount * 500)
            },
            registrations: userData.registrations.map((r: any) => ({
                id: r.id,
                eventTitle: r.event.title,
                eventDate: r.event.date.toISOString(),
                venue: r.event.venue,
                status: r.status,
                paymentStatus: r.paymentStatus,
                certificateUrl: r.certificateUrl,
                certificateIssuedAt: r.certificateIssuedAt?.toISOString() ?? null,
                rank: r.rank,
                isPaid: r.event.price > 0,
                type: r.event.category,
            })),
            // Teams where this user is the LEADER
            teams: userData.leaderOf.map((t: {
                id: string;
                teamName: string;
                teamCode: string;
                event: { title: string; date: Date; venue: string } | null;
                sportTeam: { sport: { name: string; category: string; status: string } } | null;
                status: string;
                members: Array<{ name: string; role: string; status: string }>;
            }) => ({
                id: t.id,
                teamName: t.teamName,
                teamCode: t.teamCode,
                eventTitle: t.sportTeam
                    ? `${t.sportTeam.sport.name} (${t.sportTeam.sport.category})`
                    : t.event?.title ?? 'Unknown',
                eventDate: t.event?.date?.toISOString() ?? null,
                venue: t.event?.venue ?? null,
                sportName: t.sportTeam?.sport.name ?? null,
                sportStatus: t.sportTeam?.sport.status ?? null,
                status: t.status,
                role: 'LEADER',
                isSport: !!t.sportTeam,
                members: t.members.map((m: { name: string; role: string; status: string }) => ({
                    name: m.name,
                    role: m.role,
                    status: m.status,
                })),
            })),
            // Teams where this user is a MEMBER (not leader)
            teamMemberships: userData.teamMembers
                .filter((tm: { team: { leaderId: string } }) => tm.team.leaderId !== userData.id) // exclude teams led by self (already in teams)
                .map((tm: {
                    id: string;
                    role: string;
                    status: string;
                    team: {
                        id: string;
                        teamName: string;
                        event: { title: string; date: Date; venue: string } | null;
                        sportTeam: { sport: { name: string; category: string; status: string } } | null;
                    };
                }) => ({
                    id: tm.id,
                    teamId: tm.team.id,
                    teamName: tm.team.teamName,
                    role: tm.role,
                    status: tm.status,
                    eventTitle: tm.team.sportTeam
                        ? `${tm.team.sportTeam.sport.name} (${tm.team.sportTeam.sport.category})`
                        : tm.team.event?.title ?? 'Unknown',
                    eventDate: tm.team.event?.date?.toISOString() ?? null,
                    venue: tm.team.event?.venue ?? null,
                    sportName: tm.team.sportTeam?.sport.name ?? null,
                    sportStatus: tm.team.sportTeam?.sport.status ?? null,
                    isSport: !!tm.team.sportTeam,
                })),
            sportRegistrations: sportRegistrations.map((sr: {
                id: string;
                status: string;
                sport: { name: string; category: string; gender: string; status: string };
            }) => ({
                id: sr.id,
                sportName: sr.sport.name,
                category: sr.sport.category,
                gender: sr.sport.gender,
                status: sr.status,
                sportStatus: sr.sport.status,
            }))
        };
    } catch (error) {
        console.error('[getStudentProfileByEmail]', error);
        return null;
    }
}
