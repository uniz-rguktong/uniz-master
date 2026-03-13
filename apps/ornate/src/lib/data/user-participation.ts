import { prisma } from '@/lib/prisma';

export type UserProfileSnapshot = {
    id: string;
    name: string | null;
    stdid: string | null;
    branch: string | null;
    currentYear: string | null;
};

export type EventParticipationSnapshot = {
    registeredEventIds: string[];
    userProfile: UserProfileSnapshot | null;
};

export async function getEventParticipationSnapshot(userId: string): Promise<EventParticipationSnapshot> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            stdid: true,
            role: true,
            email: true,
            branch: true,
            currentYear: true,
            registrations: {
                select: { eventId: true },
            },
            leaderOf: {
                select: { eventId: true },
            },
            teamMembers: {
                select: {
                    team: {
                        select: { eventId: true },
                    },
                },
            },
        },
    });

    if (!user) {
        return {
            registeredEventIds: [],
            userProfile: null,
        };
    }

    const regIds = user.registrations.map((r: any) => r.eventId);
    const leaderIds = user.leaderOf.map((t: any) => t.eventId).filter((id): id is string => !!id);
    const teamIds = user.teamMembers.map((tm: any) => tm.team?.eventId).filter((id): id is string => !!id);

    return {
        registeredEventIds: Array.from(new Set([...regIds, ...leaderIds, ...teamIds])),
        userProfile: {
            id: user.id,
            name: user.name,
            stdid: user.stdid || (user.role === 'STUDENT' ? user.email.split('@')[0].toUpperCase() : null),
            branch: user.branch,
            currentYear: user.currentYear,
        },
    };
}
