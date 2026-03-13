import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

const PUBLISHED_EVENTS_LIMIT = 100;
const PUBLISHED_EVENTS_MAX_LIMIT = 300;

export type MissionData = {
    id: string;
    title: string;
    description: string;
    category: string;       // mapped from Event.category (e.g., "CSE" → "BRANCHES")
    subCategory: string;    // the actual category/branch/club name
    eventCategory: string;  // mapped from Event.eventType
    exp: number;            // derived from prizes or customFields
    deadline: string;
    slots: string;
    status: string;
    isPaid: boolean;
    eventDate: string;
    eventDay: string;
    venue: string;
    registered: number;
    totalSlots: number;
    isTeam: boolean;
    teamSizeMin: number | null;
    teamSizeMax: number | null;
    coordinators: { name: string; phone: string | null }[];
};

type MissionEventInput = {
    id: string;
    title: string;
    description: string;
    shortDescription: string | null;
    category: string | null;
    eventType: string | null;
    customFields: unknown;
    date: Date;
    endDate: Date | null;
    venue: string;
    maxCapacity: number;
    registrationOpen: boolean;
    price: number;
    teamSizeMin: number | null;
    teamSizeMax: number | null;
    Admin_Event_creatorIdToAdmin: {
        branch: string | null;
        clubId: string | null;
    } | null;
    Admin_EventCoordinators: Array<{
        name: string | null;
        phone: string | null;
        email: string | null;
    }>;
};

function readNumberField(record: Record<string, unknown>, key: string, fallback: number): number {
    const raw = record[key];
    return typeof raw === 'number' ? raw : fallback;
}

/**
 * Maps an Event row + its registration count to the MissionData shape
 * consumed by MissionCard component.
 */
export function mapEventToMission(event: MissionEventInput, registrationCount: number): MissionData {
    // Determine category bucket: BRANCHES / CLUBS / HHO
    const branchSlugs = ['CSE', 'ECE', 'MECH', 'MECHANICAL', 'CIVIL', 'EE', 'EEE', 'HHO'];
    const clubSlugs = ['PIXLERO', 'SARVASRIJANA', 'ICRO', 'TECHXCEL', 'ARTIX', 'KALADHARANI', 'KALADHARINI', 'KHELSAATHI', 'KHELSATHI', 'TECHXCEL', 'PIXELRO'];

    // Prioritize explicitly matched category, otherwise fallback to admin's branch/club
    const rawCat = (event.category ?? '').toUpperCase();
    const adminRef = event.Admin_Event_creatorIdToAdmin;
    const adminBranch = (adminRef?.branch ?? '').toUpperCase();
    const adminClub = (adminRef?.clubId ?? '').toUpperCase();

    let bucket: 'BRANCHES' | 'CLUBS' | 'HHO' = 'HHO';
    let subCategory = rawCat;

    if (branchSlugs.includes(rawCat)) {
        bucket = rawCat === 'HHO' ? 'HHO' : 'BRANCHES';
    } else if (clubSlugs.includes(rawCat)) {
        bucket = 'CLUBS';
    } else if (branchSlugs.includes(adminBranch)) {
        bucket = 'BRANCHES';
        subCategory = adminBranch;
    } else if (clubSlugs.includes(adminClub)) {
        bucket = 'CLUBS';
        subCategory = adminClub;
    }

    // Normalized display labels
    if (subCategory === 'MECHANICAL') subCategory = 'MECH';
    if (subCategory === 'TECHXCEL' || subCategory === 'TECHXCEL') subCategory = 'TECHXCEL';
    if (subCategory === 'PIXELRO') subCategory = 'PIXLERO';
    if (subCategory === 'KHELSAATHI') subCategory = 'KHELSATHI';
    if (subCategory === 'KALADHARINI') subCategory = 'KALADHARANI';

    const festStart = new Date('2026-03-27');
    const eventDate = new Date(event.date);
    const dayDiff = Math.floor((eventDate.getTime() - festStart.getTime()) / 86400000) + 1;
    const dayLabel = `Day ${Math.max(1, Math.min(3, dayDiff))}`;

    const now = new Date();
    const endDate = event.endDate ? new Date(event.endDate) : eventDate;
    const hoursLeft = Math.max(0, Math.floor((endDate.getTime() - now.getTime()) / 3600000));
    const deadline = hoursLeft > 0 ? `${hoursLeft}H` : 'CLOSED';

    const custom = event.customFields && typeof event.customFields === 'object'
        ? event.customFields as Record<string, unknown>
        : null;
    const exp = custom
        ? readNumberField(custom, 'xp', readNumberField(custom, 'exp', 1000))
        : 1000;

    // If subCategory was inferred from Admin, use original category for the secondary tag
    const eventCategory = (subCategory !== rawCat && rawCat)
        ? rawCat
        : (event.eventType ?? 'TECHNICAL').toUpperCase();

    return {
        id: event.id,
        title: event.title,
        description: event.shortDescription ?? event.description,
        category: bucket,
        subCategory: subCategory || 'HHO',
        eventCategory: eventCategory,
        exp,
        deadline,
        slots: `${registrationCount}/${event.maxCapacity}`,
        status: registrationCount >= event.maxCapacity ? 'COMPLETED' : (event.registrationOpen ? 'OPEN' : 'IN_PROGRESS'),
        isPaid: event.price > 0,
        eventDate: eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        eventDay: dayLabel,
        venue: event.venue,
        registered: registrationCount,
        totalSlots: event.maxCapacity,
        isTeam: (event.teamSizeMin ?? 0) > 1,
        teamSizeMin: event.teamSizeMin,
        teamSizeMax: event.teamSizeMax,
        coordinators: Array.isArray(event.Admin_EventCoordinators)
            ? event.Admin_EventCoordinators
                .map((c: { name?: string | null; phone?: string | null; email?: string | null }) => ({
                    name: (c.name || c.email || 'Coordinator').toString(),
                    phone: c.phone ?? null,
                }))
                .filter((c: { name: string; phone: string | null }) => !!c.name)
            : [],
    };
}

async function fetchPublishedEvents(limit: number): Promise<MissionData[]> {
    const events = await prisma.event.findMany({
        where: { status: 'PUBLISHED' },
        select: {
            id: true,
            title: true,
            description: true,
            shortDescription: true,
            category: true,
            eventType: true,
            customFields: true,
            date: true,
            endDate: true,
            venue: true,
            maxCapacity: true,
            registrationOpen: true,
            price: true,
            teamSizeMin: true,
            teamSizeMax: true,
            _count: { select: { Registration: true } },
            Admin_Event_creatorIdToAdmin: {
                select: { branch: true, clubId: true }
            },
            Admin_EventCoordinators: {
                select: {
                    name: true,
                    phone: true,
                    email: true,
                },
            },
        },
        orderBy: { date: 'asc' },
        take: limit,
    });

    return events.map((e) => mapEventToMission(e, e._count.Registration));
}

const getPublishedEventsCached = unstable_cache(
    async (limit: number): Promise<MissionData[]> => {
        return fetchPublishedEvents(limit);
    },
    ['published-events'],
    { tags: ['events'], revalidate: 15 }
);

const getPublishedEventsRoadmapCached = unstable_cache(
    async (limit: number): Promise<MissionData[]> => {
        return fetchPublishedEvents(limit);
    },
    ['published-events-roadmap'],
    { tags: ['events'], revalidate: 300 }
);

export async function getPublishedEvents(limit = PUBLISHED_EVENTS_LIMIT): Promise<MissionData[]> {
    const boundedLimit = Math.max(1, Math.min(PUBLISHED_EVENTS_MAX_LIMIT, limit));
    return getPublishedEventsCached(boundedLimit);
}

export async function getPublishedEventsForRoadmap(limit = PUBLISHED_EVENTS_LIMIT): Promise<MissionData[]> {
    const boundedLimit = Math.max(1, Math.min(PUBLISHED_EVENTS_MAX_LIMIT, limit));
    return getPublishedEventsRoadmapCached(boundedLimit);
}
