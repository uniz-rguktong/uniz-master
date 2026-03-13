'use server'

import prisma from '@/lib/prisma'
import { unstable_cache } from 'next/cache'
import { executeAction } from '@/lib/api-utils'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { CACHE_TAGS } from '@/lib/cache-tags'

export interface CoordinatorEvent {
    id: string;
    title: string;
    category: string | null;
    date: string;
    venue: string;
    posterUrl: string | null;
    eventType: string | null;
    fee: string | number | null;
    capacity: number | null;
    totalRegistrations: number;
    pendingRegistrations: number;
    attendedRegistrations: number;
    sourceDashboard: string;
}

function getDashboardSourceLabel(creator: { role?: string | null; branch?: string | null; clubId?: string | null } | null | undefined) {
    if (creator?.clubId) return creator.clubId;
    if (creator?.branch) return creator.branch;

    switch (creator?.role) {
        case 'CLUB_COORDINATOR':
            return 'Clubs';
        case 'HHO':
            return 'HHO';
        case 'SPORTS_ADMIN':
        case 'BRANCH_SPORTS_ADMIN':
            return 'Sports';
        case 'SUPER_ADMIN':
            return 'Super Admin';
        case 'BRANCH_ADMIN':
        default:
            return 'Branch';
    }
}

export interface CoordinatorEventDetails {
    id: string;
    title: string;
    fee: string | number;
    isPaid: boolean | string | null;
    eventType: string | null;
    teamSizeMin: number | null;
    teamSizeMax: number | null;
    date: string;
    venue: string;
    description: string;
    maxCapacity: number;
    paymentGateway: string | null;
}

const getCachedCoordinatorEvents = unstable_cache(
    async (userId: string, branch?: string | null) => {
        const events = await prisma.event.findMany({
            where: {
                OR: [
                    { assignedCoordinators: { some: { id: userId } } },
                    ...(branch ? [{ creator: { branch } }] : []),
                ],
            },
            orderBy: { date: 'asc' },
            select: {
                id: true,
                title: true,
                category: true,
                date: true,
                venue: true,
                posterUrl: true,
                eventType: true,
                fee: true,
                maxCapacity: true,
                creator: {
                    select: {
                        role: true,
                        branch: true,
                        clubId: true,
                    },
                },
            },
        });

        const eventIds = events.map((event) => event.id);
        const registrationCounts = eventIds.length
            ? await prisma.registration.groupBy({
                by: ['eventId', 'status'],
                where: { eventId: { in: eventIds } },
                _count: { _all: true },
            })
            : [];

        const countsByEventId = registrationCounts.reduce((acc, item) => {
            const key = item.eventId;
            if (!acc[key]) {
                acc[key] = { total: 0, pending: 0, attended: 0 };
            }

            if (item.status !== 'CANCELLED') {
                acc[key]!.total += item._count._all;
            }
            if (item.status === 'PENDING') {
                acc[key]!.pending += item._count._all;
            }
            if (item.status === 'ATTENDED') {
                acc[key]!.attended += item._count._all;
            }

            return acc;
        }, {} as Record<string, { total: number; pending: number; attended: number }>);

        return events.map((event) => ({
            id: event.id,
            title: event.title,
            category: event.category,
            date: event.date.toISOString(),
            venue: event.venue,
            posterUrl: event.posterUrl,
            eventType: event.eventType,
            fee: event.fee,
            capacity: event.maxCapacity,
            totalRegistrations: countsByEventId[event.id]?.total || 0,
            pendingRegistrations: countsByEventId[event.id]?.pending || 0,
            attendedRegistrations: countsByEventId[event.id]?.attended || 0,
            sourceDashboard: getDashboardSourceLabel(event.creator),
        }));
    },
    ['coordinator-events-v4'],
    { tags: [CACHE_TAGS.events, CACHE_TAGS.coordinator], revalidate: 60 }
);

const getCachedEventForCoordinator = unstable_cache(
    async (eventId: string) => {
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: {
                id: true,
                title: true,
                fee: true,
                eventType: true,
                teamSizeMin: true,
                teamSizeMax: true,
                date: true,
                venue: true,
                description: true,
                maxCapacity: true,
                paymentGateway: true,
                creator: { select: { branch: true } },
                assignedCoordinators: { select: { id: true } },
            },
        });

        if (!event) return null;

        return {
            id: event.id,
            title: event.title,
            fee: event.fee || 0,
            isPaid: !!(event.fee && event.fee !== 'Free' && event.fee !== '0'),
            eventType: event.eventType || null,
            teamSizeMin: event.teamSizeMin,
            teamSizeMax: event.teamSizeMax,
            date: event.date.toISOString(),
            venue: event.venue,
            description: event.description || '',
            maxCapacity: event.maxCapacity || 0,
            paymentGateway: event.paymentGateway || null,
            assignedCoordinatorIds: event.assignedCoordinators.map((coordinator) => coordinator.id),
            coordinatorBranch: event.creator?.branch || null,
        };
    },
    ['coordinator-event-details-v4'],
    { tags: [CACHE_TAGS.events, CACHE_TAGS.coordinator], revalidate: 60 }
);
const getCachedSportForCoordinator = unstable_cache(
    async (sportId: string) => {
        const sport = await prisma.sport.findUnique({
            where: { id: sportId },
            select: {
                id: true,
                name: true,
                category: true,
                minPlayersPerTeam: true,
                maxPlayersPerTeam: true,
                registrationDeadline: true,
                description: true,
                maxTeamsPerBranch: true,
            },
        });

        if (!sport) return null;

        return {
            id: sport.id,
            title: sport.name,
            fee: 0,
            isPaid: false,
            eventType: sport.category === 'TEAM' ? 'team' : 'individual',
            teamSizeMin: sport.minPlayersPerTeam,
            teamSizeMax: sport.maxPlayersPerTeam,
            date: sport.registrationDeadline?.toISOString() || new Date().toISOString(),
            venue: 'Main Ground / Indoor Arena',
            description: sport.description || '',
            maxCapacity: sport.maxTeamsPerBranch || 0,
            paymentGateway: null,
            assignedCoordinatorIds: [] as string[],
            coordinatorBranch: null,
            isSport: true
        };
    },
    ['coordinator-sport-details-v2'],
    { tags: [CACHE_TAGS.sports], revalidate: 60 }
);

export async function getCoordinatorEvents(): Promise<{ success?: boolean; events?: CoordinatorEvent[]; error?: string }> {
    return executeAction(async () => {
        const user = await getAuthenticatedUser();
        if (!user || (user.role !== 'EVENT_COORDINATOR' && user.role !== 'SUPER_ADMIN')) {
            throw new Error('Unauthorized');
        }

        const events = await getCachedCoordinatorEvents(user.id, user.branch || null);

        return {
            success: true,
            events,
        };
    }, 'getCoordinatorEvents') as any;
}

export async function getCoordinatorEventDetails(eventId: string): Promise<{ success?: boolean; event?: CoordinatorEventDetails; error?: string }> {
    return executeAction(async () => {
        const user = await getAuthenticatedUser();
        const allowedRoles = ['EVENT_COORDINATOR', 'SUPER_ADMIN', 'BRANCH_ADMIN', 'HHO', 'SPORTS_ADMIN', 'BRANCH_SPORTS_ADMIN'];
        const normalizedEventId = eventId?.trim();

        if (!user || !allowedRoles.includes(user.role)) {
            throw new Error('Unauthorized');
        }
        if (!normalizedEventId) {
            throw new Error('Event ID is required');
        }

        let eventData = await getCachedEventForCoordinator(normalizedEventId);
        let isSportFallback = false;

        if (!eventData) {
            eventData = await getCachedSportForCoordinator(normalizedEventId);
            if (eventData) isSportFallback = true;
        }

        if (!eventData) throw new Error('Event not found');

        const isAdmin = ['SUPER_ADMIN', 'BRANCH_ADMIN', 'HHO', 'SPORTS_ADMIN'].includes(user.role);
        const isAssigned = eventData.assignedCoordinatorIds.some((id: string) => id === user.id);
        const isBranchScopedAccess =
            (user.role === 'BRANCH_ADMIN' || user.role === 'BRANCH_SPORTS_ADMIN') &&
            !!user.branch &&
            (!eventData.coordinatorBranch || eventData.coordinatorBranch === user.branch);

        // For sports, we allow access if they have the appropriate role, as sports are currently more global
        if (!isAdmin && !isAssigned && !isBranchScopedAccess && !isSportFallback) {
            throw new Error('Access denied: You are not authorized to view this event');
        }

        return {
            success: true,
            event: {
                id: eventData.id,
                title: eventData.title,
                fee: eventData.fee,
                isPaid: eventData.isPaid,
                eventType: eventData.eventType,
                teamSizeMin: eventData.teamSizeMin,
                teamSizeMax: eventData.teamSizeMax,
                date: eventData.date,
                venue: eventData.venue,
                description: eventData.description,
                maxCapacity: eventData.maxCapacity,
                paymentGateway: eventData.paymentGateway,
            },
        };
    }, 'getCoordinatorEventDetails') as any;
}
