"use server";

import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import type { AuthUser } from "@/lib/auth-helpers";

import { getCategoryColor, getEventStatus } from "@/lib/constants";
import { formatTimeTo12h } from "@/lib/dateUtils";

// --- Types ---

export interface EventBase {
  id: string;
  title: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
  venue: string;
  category: string | null;
  organizer: string;
  creatorRole: string | null;
  posterUrl: string | null;
  maxCapacity: number | null;
  registrationOpen: boolean;
  status: string | null;
  time: string | null;
  startTime: string | null;
  endTime: string | null;
  registrationsCount: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  category: string;
  categoryColor: string;
  venue: string;
  registrations: number;
  capacity: number | null;
  posterUrl: string | null;
  description: string | null;
}

export interface EventFilterItem {
  id: string;
  title: string;
  category: string | null;
}

export interface EventCoordinator {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
}

export interface EventDetails extends EventBase {
  time: string | null;
  description: string | null;
  fee: string | null;
  createdAt: string;
  updatedAt: string;
  registrationsCount: number;
  customFields: Record<string, unknown>;
  assignedCoordinators: EventCoordinator[];
  documents: unknown[];
  additionalImages: unknown[];
  prizes: unknown[];
  eligibility: unknown[];
  creator: { name: string | null; email: string; branch: string | null } | null;
  [key: string]: unknown; // Allow spread of other Prisma event fields
}

import { UserRole, Prisma } from "@/lib/generated/client";
import { executeAction } from "@/lib/api-utils";

/**
 * Helper to build the where clause based on user role
 */
function buildEventWhereClause(user: AuthUser): Prisma.EventWhereInput {
  const role = user.role as UserRole;

  if (role === UserRole.SUPER_ADMIN) return {};
  if (role === UserRole.HHO) return { creator: { role: UserRole.HHO } };
  if (role === UserRole.SPORTS_ADMIN || role === UserRole.BRANCH_SPORTS_ADMIN)
    return { creator: { role: UserRole.SPORTS_ADMIN } };
  if (role === UserRole.CLUB_COORDINATOR)
    return { creator: { clubId: user.clubId ?? null } };

  // Branch Admin or others: Own events OR Branch events
  return {
    OR: [{ creatorId: user.id }, { creator: { branch: user.branch ?? null } }],
  };
}

// --- Cached Query Functions ---

const getCachedEvents = unstable_cache(
  async (
    userId: string,
    role: string,
    clubId: string | null,
    branch: string | null,
  ) => {
    const user: AuthUser = { id: userId, role, email: "", clubId, branch };
    const whereClause = buildEventWhereClause(user);

    const rawEvents = await prisma.event.findMany({
      where: whereClause,
      orderBy: {
        date: "asc",
      },
      select: {
        id: true,
        title: true,
        date: true,
        createdAt: true,
        venue: true,
        category: true,
        posterUrl: true,
        maxCapacity: true,
        registrationOpen: true,
        status: true,
        updatedAt: true,
        time: true,
        startTime: true,
        endTime: true,
        creator: {
          select: {
            name: true,
            branch: true,
            role: true,
          },
        },
        _count: {
          select: { registrations: true },
        },
      },
    });

    return rawEvents.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date.toISOString(),
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
      venue: e.venue,
      category: e.category,
      organizer: e.creator?.name || e.creator?.branch || "System",
      creatorRole: e.creator?.role || null,
      posterUrl: e.posterUrl,
      maxCapacity: e.maxCapacity,
      time: formatTimeTo12h(e.time),
      startTime: formatTimeTo12h(e.startTime),
      endTime: formatTimeTo12h(e.endTime),
      registrationOpen: e.registrationOpen,
      registrationsCount: e._count.registrations,
      status: e.status || "DRAFT",
    }));
  },
  ["events-list"],
  {
    tags: ["events"],
    revalidate: 60,
  },
);

const getCachedCalendarEvents = unstable_cache(
  async (
    userId: string,
    role: string,
    clubId: string | null,
    branch: string | null,
  ) => {
    const user: AuthUser = { id: userId, role, email: "", clubId, branch };
    const whereClause = buildEventWhereClause(user);

    const events = await prisma.event.findMany({
      where: whereClause,
      orderBy: {
        date: "asc",
      },
      select: {
        id: true,
        title: true,
        date: true,
        time: true,
        startTime: true,
        endTime: true,
        category: true,
        venue: true,
        maxCapacity: true,
        posterUrl: true,
        description: true,
        _count: {
          select: { registrations: true },
        },
      },
    });

    return events.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date.toISOString().split("T")[0]!,
      time: e.time
        ? formatTimeTo12h(e.time)
        : e.startTime
          ? `${formatTimeTo12h(e.startTime)}${e.endTime ? ` - ${formatTimeTo12h(e.endTime)}` : ""}`
          : "TBD",
      category: e.category || "General",
      categoryColor: getCategoryColor(e.category),
      venue: e.venue || "TBD",
      registrations: e._count.registrations,
      capacity: e.maxCapacity,
      posterUrl: e.posterUrl,
      description: e.description,
    }));
  },
  ["calendar-events"],
  {
    tags: ["events", "calendar"],
    revalidate: 60,
  },
);

const getCachedEventsListForFilter = unstable_cache(
  async (
    userId: string,
    role: string,
    clubId: string | null,
    branch: string | null,
  ) => {
    const user: AuthUser = { id: userId, role, email: "", clubId, branch };
    const whereClause = buildEventWhereClause(user);

    const events = await prisma.event.findMany({
      where: whereClause,
      orderBy: {
        date: "desc",
      },
      select: {
        id: true,
        title: true,
        category: true,
      },
    });

    return events;
  },
  ["events-filter-list"],
  {
    tags: ["events"],
    revalidate: 120,
  },
);

const getCachedEventById = unstable_cache(
  async (eventId: string) => {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        shortDescription: true,
        description: true,
        category: true,
        eventType: true,
        teamSizeMin: true,
        teamSizeMax: true,
        locationType: true,
        date: true,
        time: true,
        startTime: true,
        endTime: true,
        endDate: true,
        venue: true,
        fee: true,
        paymentGateway: true,
        maxCapacity: true,
        minParticipants: true,
        waitlistEnabled: true,
        registrationOpen: true,
        price: true,
        status: true,
        posterUrl: true,
        rules: true,
        customFields: true,
        documents: true,
        additionalImages: true,
        prizes: true,
        eligibility: true,
        creatorId: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          select: {
            name: true,
            email: true,
            branch: true,
          },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
        assignedCoordinators: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!event) return null;

    return {
      ...event,
      date: event.date.toISOString(),
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
      registrationsCount: event._count.registrations,
      organizer: event.creator?.name || event.creator?.branch || "System",
      customFields: (event.customFields as Record<string, unknown>) || {},
      assignedCoordinators: event.assignedCoordinators || [], // M2M relation
      documents: (event.documents as unknown[]) || [],
      additionalImages: (event.additionalImages as unknown[]) || [],
      prizes: (event.prizes as unknown[]) || [],
      eligibility: (event.eligibility as unknown[]) || [],
    };
  },
  ["event-by-id"],
  {
    tags: ["events", "event-details"],
    revalidate: 60,
  },
);

export async function getEvents(): Promise<{
  success?: boolean;
  data?: EventBase[];
  error?: string;
}> {
  return executeAction(async () => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    const events = await getCachedEvents(
      user.id,
      user.role,
      user.clubId ?? null,
      user.branch ?? null,
    );

    return { success: true, data: events };
  }, "getEvents") as any;
}

export async function getCalendarEvents(): Promise<{
  success?: boolean;
  data?: CalendarEvent[];
  error?: string;
}> {
  return executeAction(async () => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    const events = await getCachedCalendarEvents(
      user.id,
      user.role,
      user.clubId ?? null,
      user.branch ?? null,
    );

    return { success: true, data: events };
  }, "getCalendarEvents") as any;
}

export async function getEventsListForFilter(): Promise<{
  data?: EventFilterItem[];
  success?: boolean;
  error?: string;
}> {
  return executeAction(async () => {
    const user = await getAuthenticatedUser();
    if (!user) {
      console.warn("Unauthorized access to getEventsListForFilter");
      return { data: [] };
    }

    const events = await getCachedEventsListForFilter(
      user.id,
      user.role,
      user.clubId ?? null,
      user.branch ?? null,
    );

    return { success: true, data: events };
  }, "getEventsListForFilter") as any;
}

export async function getEventById(
  eventId: string,
): Promise<{ success?: boolean; data?: EventDetails; error?: string }> {
  return executeAction(async () => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        shortDescription: true,
        description: true,
        category: true,
        eventType: true,
        teamSizeMin: true,
        teamSizeMax: true,
        locationType: true,
        date: true,
        time: true,
        startTime: true,
        endTime: true,
        endDate: true,
        venue: true,
        fee: true,
        paymentGateway: true,
        maxCapacity: true,
        minParticipants: true,
        waitlistEnabled: true,
        registrationOpen: true,
        price: true,
        status: true,
        posterUrl: true,
        rules: true,
        customFields: true,
        documents: true,
        additionalImages: true,
        prizes: true,
        eligibility: true,
        creatorId: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          select: {
            name: true,
            email: true,
            branch: true,
          },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
        assignedCoordinators: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!event) {
      throw new Error("Event not found");
    }

    const formattedEvent = {
      ...event,
      date: event.date.toISOString(),
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
      registrationsCount: event._count.registrations,
      organizer: event.creator?.name || event.creator?.branch || "System",
      customFields: (event.customFields as Record<string, unknown>) || {},
      assignedCoordinators: event.assignedCoordinators || [],
      documents: (event.documents as unknown[]) || [],
      additionalImages: (event.additionalImages as unknown[]) || [],
      prizes: (event.prizes as unknown[]) || [],
      eligibility: (event.eligibility as unknown[]) || [],
    };

    return { success: true, data: formattedEvent };
  }, "getEventById") as any;
}

export async function getWinners(): Promise<{
  success?: boolean;
  data?: any[];
  error?: string;
}> {
  return executeAction(async () => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    const winners = await prisma.winnerAnnouncement.findMany({
      select: {
        id: true,
        eventId: true,
        positions: true,
        isPublished: true,
        publishedAt: true,
        createdAt: true,
        event: {
          select: {
            title: true,
            category: true,
            creator: {
              select: {
                name: true,
                branch: true,
                role: true,
                clubId: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedWinners = winners.map((w) => {
      const positions = w.positions as any;
      return {
        id: w.id,
        eventId: w.eventId,
        event: w.event.title,
        branch: w.event.creator.branch || "Common",
        type: w.event.category || "General",
        organizer: w.event.creator.name || w.event.creator.branch || "System",
        organizerRole: w.event.creator.role,
        winner: positions.rank1 || null,
        runner: positions.rank2 || null,
        secondRunner: positions.rank3 || null,
        isPublished: w.isPublished,
        publishedAt: w.publishedAt?.toISOString(),
      };
    });

    return { success: true, data: formattedWinners };
  }, "getWinners") as any;
}
