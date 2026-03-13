/**
 * Registration-specific Types
 *
 * Input types, filter types, and enriched registration shapes with relations.
 * Complements the lightweight `RegistrationSummary` in `@/types/models`.
 *
 * Usage:
 *   import type { CreateRegistrationInput, RegistrationWithEvent } from '@/types/registration';
 */

import type { z } from 'zod';
import type { RegistrationSchema } from '@/lib/schemas';

// ============================================================================
// Zod-inferred input types
// ============================================================================

/** Validated input for creating a registration (mirrors RegistrationSchema). */
export type CreateRegistrationInput = z.infer<typeof RegistrationSchema>;

/**
 * Spot / manual registration input used by coordinators.
 * Has more fields than the public form.
 */
export interface SpotRegistrationInput {
    eventId: string;
    studentName: string;
    studentId: string;
    email?: string;
    phone?: string;
    branch?: string;
    year?: string;
    paymentStatus?: string;
    amount?: number;
    transactionId?: string;
}

// ============================================================================
// Filter / Query Types
// ============================================================================

/** Filters passed to registration listing getters. */
export interface RegistrationFilters {
    eventId?: string;
    status?: string | string[];
    paymentStatus?: string;
    search?: string;
    dateFrom?: Date | string;
    dateTo?: Date | string;
    page?: number;
    pageSize?: number;
}

/** Sort options for registration tables. */
export type RegistrationSortField = 'studentName' | 'registrationDate' | 'status' | 'eventName' | 'paymentStatus';

export interface RegistrationSortOption {
    field: RegistrationSortField;
    direction: 'asc' | 'desc';
}

// ============================================================================
// Enriched Registration Shapes (with relations)
// ============================================================================

/**
 * Registration with user details — commonly returned by getters
 * that `include: { user: { select: ... } }`.
 */
export interface RegistrationWithUser {
    id: string;
    eventId: string;
    studentName: string;
    studentId: string;
    status: string;
    paymentStatus: string;
    amount: number;
    transactionId: string | null;
    screenshotUrl: string | null;
    createdAt: string;
    certificateUrl: string | null;
    certificateIssuedAt: string | null;
    rank: number | null;
    user: {
        id: string;
        name: string | null;
        email: string;
        phone: string | null;
        branch: string | null;
        currentYear: string | null;
    } | null;
}

/**
 * Registration with event details — used when displaying a user's
 * registration history or the registrations inbox.
 */
export interface RegistrationWithEvent {
    id: string;
    studentName: string;
    studentId: string;
    status: string;
    paymentStatus: string;
    amount: number;
    createdAt: string;
    event: {
        id: string;
        title: string;
        date: string;
        venue: string;
        category: string | null;
        maxCapacity: number;
    };
}

/**
 * Full registration detail for the registration detail page / modal.
 */
export interface RegistrationDetail {
    id: string;
    eventId: string;
    userId: string | null;
    studentName: string;
    studentId: string;
    status: string;
    paymentStatus: string;
    amount: number;
    transactionId: string | null;
    screenshotUrl: string | null;
    createdAt: string;
    certificateUrl: string | null;
    certificateIssuedAt: string | null;
    certificateType: string | null;
    rank: number | null;
    event: {
        id: string;
        title: string;
        date: string;
        venue: string;
        category: string | null;
        fee: string | null;
        price: number;
        maxCapacity: number;
    };
    user: {
        id: string;
        name: string | null;
        email: string;
        phone: string | null;
        branch: string | null;
        currentYear: string | null;
    } | null;
    team: {
        id: string;
        teamName: string;
        teamCode: string;
        status: string;
    } | null;
}

// ============================================================================
// Bulk Operation Types
// ============================================================================

/** Shape of a single row in a CSV/Excel bulk import. */
export interface BulkRegistrationRow {
    studentName: string;
    studentId: string;
    email?: string;
    phone?: string;
    eventId: string;
    paymentStatus?: string;
    amount?: number;
}

/** Result of validating a bulk import file before processing. */
export interface BulkImportValidation {
    valid: BulkRegistrationRow[];
    invalid: { row: number; errors: string[] }[];
    totalRows: number;
}

// ============================================================================
// Status Update Types
// ============================================================================

/** Input for updating a single registration's status. */
export interface UpdateRegistrationStatusInput {
    registrationId: string;
    status: string;
    reason?: string;
}

/** Input for updating payment status. */
export interface UpdatePaymentStatusInput {
    registrationId: string;
    paymentStatus: string;
    transactionId?: string;
    amount?: number;
}

/** Input for bulk status change. */
export interface BulkStatusChangeInput {
    registrationIds: string[];
    status: string;
    reason?: string;
}
