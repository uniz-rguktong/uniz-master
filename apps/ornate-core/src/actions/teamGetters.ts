'use server'

import prisma from '@/lib/prisma'
import logger from '@/lib/logger'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { unstable_cache } from 'next/cache';
import { Prisma } from '@/lib/generated/client';

// --- Types ---

export interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: string;
}

export interface TeamEventInfo {
    id: string;
    title: string;
    date: Date;
    venue: string;
    creator?: { branch: string | null; name: string | null };
    teamSizeMin?: number | null;
    teamSizeMax?: number | null;
}

export interface TeamLeaderInfo {
    id?: string;
    name: string | null;
    email: string;
    phone: string | null;
    role?: string;
    branch?: string | null;
    currentYear?: string | null;
}

export interface TeamRegistrationInfo {
    id: string;
    status: string;
    createdAt: Date;
}

export interface TeamDetails {
    id: string;
    teamName: string;
    event: TeamEventInfo;
    leader: TeamLeaderInfo;
    members: TeamMember[];
    registration: TeamRegistrationInfo | null;
}


const getCachedAllTeams = unstable_cache(
    async (adminRole: string, adminBranch: string | null | undefined, adminClubId: string | null | undefined) => {
        if (!prisma.team) return null;

        const whereClause: Prisma.TeamWhereInput = {};
        if (adminRole === 'SUPER_ADMIN') {
            // No filters for super admin
        } else if (adminRole === 'CLUB_COORDINATOR' && adminClubId) {
            whereClause.event = {
                creator: { clubId: adminClubId }
            };
        } else if (adminBranch) {
            whereClause.event = {
                creator: { branch: adminBranch }
            };
        }

        // Ensure only student-led teams are shown
        whereClause.leader = { role: 'STUDENT' };

        return await prisma.team.findMany({
            where: whereClause,
            include: {
                event: {
                    select: {
                        id: true,
                        title: true,
                        date: true,
                        venue: true,
                        creator: {
                            select: {
                                branch: true,
                                name: true
                            }
                        }
                    }
                },
                leader: {
                    select: {
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                members: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    }
                },
                _count: {
                    select: {
                        members: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    },
    ['all-teams-list'],
    { tags: ['teams'], revalidate: 60 }
);

const getCachedTeamDetails = unstable_cache(
    async (teamId: string) => {
        if (!prisma.team) return null;

        return await prisma.team.findUnique({
            where: { id: teamId },
            include: {
                event: {
                    select: {
                        id: true,
                        title: true,
                        date: true,
                        venue: true,
                        teamSizeMin: true,
                        teamSizeMax: true
                    }
                },
                leader: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        role: true,
                        branch: true,
                        currentYear: true
                    }
                },
                members: {
                    orderBy: {
                        role: 'asc'
                    },
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true,
                                phone: true,
                                branch: true,
                                currentYear: true
                            }
                        }
                    }
                },
                registration: {
                    select: {
                        id: true,
                        status: true,
                        createdAt: true
                    }
                }
            }
        });
    },
    ['team-details'],
    { tags: ['teams'], revalidate: 60 }
);

export async function getAllTeams(): Promise<{ success: true; data: unknown[] } | { success: false; error: string }> {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return { success: false, error: 'Unauthorized' };
    }

    const adminBranch = session.user.branch;
    const adminClubId = session.user.clubId;
    const adminRole = session.user.role;

    try {
        console.log(`Fetching teams for user: ${session.user.email}, role: ${adminRole}, branch: ${adminBranch}`);
        const teams = await getCachedAllTeams(adminRole, adminBranch, adminClubId);

        if (!teams) {
            console.log('No teams found or team model missing');
            return { success: false, error: 'Team model not found in database client' };
        }

        console.log(`Successfully fetched ${teams.length} teams`);
        return { success: true, data: teams };
    } catch (error: unknown) {
        logger.error({ err: error }, 'Error fetching all teams');
        return { success: false, error: 'Failed to fetch teams' };
    }
}

export async function getTeamDetails(teamId: string): Promise<{ success: true; data: unknown } | { success: false; error: string }> {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const team = await getCachedTeamDetails(teamId);

        if (!team) {
            // Check if null meant not found or client error
            if (!prisma.team) return { success: false, error: 'Team model not found' };
            return { success: false, error: 'Team not found' };
        }

        return { success: true, data: team };
    } catch (error) {
        logger.error({ err: error }, 'Error fetching team details');
        return { success: false, error: 'Failed to fetch team details' };
    }
}

