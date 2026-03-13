/**
 * Event-specific Types
 *
 * Contains input types (for creating / updating events), filter types,
 * and enriched event shapes with relations. These complement the
 * lightweight `EventSummary` / `CalendarEvent` shapes in `@/types/models`.
 *
 * Usage:
 *   import type { CreateEventInput, EventWithRelations } from '@/types/event';
 */

import type { z } from 'zod';
import type { EventSchema } from '@/lib/schemas';
import type { Prisma } from '@/lib/generated/client';

// ============================================================================
// Zod-inferred input types
// ============================================================================

/** Validated input for creating an event (mirrors EventSchema). */
export type CreateEventInput = z.infer<typeof EventSchema>;

/**
 * Partial version used for updates — every field is optional except `id`.
 * Components that call `updateEvent()` can use this.
 */
export type UpdateEventInput = Partial<CreateEventInput> & { id: string };

// ============================================================================
// Filter / Query Types
// ============================================================================

/** Filters passed to event listing getters. */
export interface EventFilters {
    status?: string;
    category?: string;
    creatorId?: string;
    dateFrom?: Date | string;
    dateTo?: Date | string;
    search?: string;
    page?: number;
    pageSize?: number;
}

/** Sort options used by event tables. */
export type EventSortField = 'title' | 'date' | 'status' | 'registrationsCount' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

export interface EventSortOption {
    field: EventSortField;
    direction: SortDirection;
}

// ============================================================================
// Enriched Event Shapes (with relations)
// ============================================================================

/**
 * Event with its creator info — the typical shape returned by
 * `eventGetters.getEventsForAdmin()` after `include: { creator }`.
 */
export interface EventWithCreator {
    id: string;
    title: string;
    description: string;
    date: string;
    venue: string;
    category: string | null;
    posterUrl: string | null;
    status: string | null;
    maxCapacity: number;
    registrationOpen: boolean;
    createdAt: string;
    registrationsCount: number;
    creator: {
        id: string;
        name: string | null;
        email: string;
        role: string;
        branch: string | null;
    };
}

/**
 * Full event detail with nested relations — used on event detail / edit pages.
 */
export interface EventDetail {
    id: string;
    title: string;
    description: string;
    shortDescription: string | null;
    date: string;
    endDate: string | null;
    startTime: string | null;
    endTime: string | null;
    venue: string;
    category: string | null;
    eventType: string | null;
    locationType: string;
    posterUrl: string | null;
    additionalImages: string[];
    status: string | null;
    maxCapacity: number;
    minParticipants: number | null;
    registrationOpen: boolean;
    waitlistEnabled: boolean;
    fee: string | null;
    price: number;
    rules: string | null;
    eligibility: unknown;
    customFields: unknown;
    documents: unknown;
    prizes: unknown;
    certificateStatus: string;
    certificateTheme: string | null;
    createdAt: string;
    updatedAt: string;

    creator: {
        id: string;
        name: string | null;
        email: string;
        role: string;
    };
    registrations: {
        id: string;
        studentName: string;
        status: string;
        paymentStatus: string;
    }[];
    assignedCoordinators: {
        id: string;
        name: string | null;
        email: string;
    }[];
    teams: {
        id: string;
        teamName: string;
        status: string;
        membersCount: number;
    }[];
    _count: {
        registrations: number;
        teams: number;
    };
}

/**
 * Live event shape used in the live events dashboard view.
 */
export interface LiveEvent {
    id: string;
    title: string;
    venue: string;
    date: string;
    startTime: string | null;
    endTime: string | null;
    category: string | null;
    registrationsCount: number;
    maxCapacity: number;
    status: string | null;
}

/**
 * Event approval item used in the approvals queue.
 */
export interface EventApprovalItem {
    id: string;
    title: string;
    date: string;
    category: string | null;
    status: string;
    creatorName: string;
    creatorRole: string;
    registrationsCount: number;
    createdAt: string;
}

/**
 * Roadmap / timeline event milestone.
 */
export interface EventMilestone {
    id: string;
    title: string;
    date: string;
    status: string;
    category: string | null;
}
