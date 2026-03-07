/**
 * Standardized Server Action Return Types
 *
 * These types define the canonical response shapes for ALL server actions.
 * They are compatible with the `safeAction` / `safeMutationAction` wrappers
 * in `src/lib/api-utils.ts` which already return `{ success, data?, error? }`.
 *
 * Usage:
 *   import type { ActionResult, MutationResult } from '@/types/actions';
 *
 * Existing per-file interfaces like `WinnerActionResponse<T>`, `GalleryActionResponse<T>`, etc.
 * all follow the same `{ success, data?, error? }` shape — these canonical types
 * can progressively replace them.
 */

// ---------------------------------------------------------------------------
// Core Result Types
// ---------------------------------------------------------------------------

/**
 * Standard return type for any server action.
 * Matches the `ActionResponse<T>` from `src/lib/api-utils.ts`.
 */
export type ActionResult<T = unknown> =
  | { success: true; data: T; error?: never }
  | { success: false; error: string; data?: never };

/**
 * Mutation result with optional message (used by actions that return
 * a confirmation string alongside data, e.g. "Registration deleted").
 */
export type MutationResult<T = unknown> =
  | { success: true; data: T; message?: string; error?: never }
  | { success: false; error: string; data?: never; message?: never };

/**
 * Paginated result for list endpoints.
 */
export interface PaginatedResult<T> {
  success: true;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Bulk operation result — for actions that process multiple items at once
 * (e.g. bulk import registrations, bulk send certificates).
 * Matches the shape already used by `registrationActions.ts`.
 */
export interface BulkActionResult {
  success: boolean;
  error?: string;
  count?: number;
  successful?: number;
  failed?: number;
  errors?: string[];
  message?: string;
}

// ---------------------------------------------------------------------------
// Error Types
// ---------------------------------------------------------------------------

/**
 * Structured error that can carry a field-level mapping for form validation.
 */
export interface ServerActionError {
  code: "VALIDATION" | "AUTH" | "NOT_FOUND" | "CONFLICT" | "INTERNAL";
  message: string;
  /** Per-field errors for form-level feedback (mirrors Zod issue paths). */
  fieldErrors?: Record<string, string>;
}

/**
 * Form-specific action result that can surface field-level errors.
 */
export type FormActionResult<T = unknown> =
  | { success: true; data: T; error?: never; fieldErrors?: never }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string>;
      data?: never;
    };

// ---------------------------------------------------------------------------
// Auth Helpers
// ---------------------------------------------------------------------------

/**
 * Authenticated user shape extracted from next-auth session.
 * Re-exported from the centralized auth helper.
 */
export type { AuthUser } from "@/lib/auth-helpers";

// ---------------------------------------------------------------------------
// Generic Helpers
// ---------------------------------------------------------------------------

/**
 * Extract the `data` type from an ActionResult.
 * Useful when you have a function that returns `ActionResult<Foo>` and
 * you want `Foo` in a component.
 *
 * Usage:
 *   type Events = ExtractData<Awaited<ReturnType<typeof getEvents>>>;
 */
export type ExtractData<T> = T extends { success: true; data: infer D }
  ? D
  : never;
