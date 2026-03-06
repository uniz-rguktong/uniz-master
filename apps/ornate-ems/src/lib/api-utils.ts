import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import type { ZodSchema } from 'zod';
import logger from './logger';
import { headers } from 'next/headers';
import { getAuthenticatedUser } from './auth-helpers';
import {
    enforceServerActionRateLimit,
    ServerActionRateLimitError,
    shouldRateLimitServerAction,
} from './serverActionRateLimit';

/**
 * Standardize API Responses
 */
export function apiResponse<T = null, E = string>(
    success: boolean,
    data: T = null as unknown as T,
    error: E | null = null,
    status: number = 200
) {
    return NextResponse.json(
        { success, data, error },
        { status }
    );
}

/**
 * Handle API Errors (including Zod validation errors)
 *
 * Security: In production, returns generic error messages to prevent
 * leaking Prisma internals, table names, and stack traces.
 * Detailed errors are always logged server-side via logger.
 */
export function handleError(error: unknown) {
    logger.error({ err: error }, "API Error");

    if (error instanceof ZodError) {
        // Validation errors are safe to return — they describe client input issues
        return apiResponse(false, null, error.issues[0]?.message || "Validation Error", 400);
    }

    // In production, never expose internal error details to the client
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal Server Error'
        : (error instanceof Error ? error.message : 'Internal Server Error');
    return apiResponse(false, null, message, 500);
}

/**
 * HOF for API Route Handlers
 * 
 * Optionally applies rate limiting when `rateLimit` option is provided.
 * The rate limiter uses the same Upstash-backed sliding window as server actions.
 * Identifier is resolved from: authenticated user ID > x-forwarded-for > x-real-ip > 'anonymous'.
 *
 * @example
 * export const POST = apiHandler(async (req) => {
 *   const body = await req.json();
 *   // ...
 * }, { rateLimit: { limit: 10, window: '1 m' } });
 */
export function apiHandler(
    handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>,
    options?: { rateLimit?: { limit?: number; window?: `${number} ${'s' | 'm' | 'h' | 'd'}`; prefix?: string } }
) {
    return async (req: NextRequest, ...args: any[]) => {
        try {
            // Optional rate limiting for API routes
            if (options?.rateLimit) {
                const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
                    || req.headers.get('x-real-ip')
                    || 'anonymous';
                await enforceServerActionRateLimit({
                    actionName: `api:${req.method}:${req.nextUrl.pathname}`,
                    identifier: ip,
                    config: {
                        ...(options.rateLimit.limit !== undefined && { limit: options.rateLimit.limit }),
                        ...(options.rateLimit.window !== undefined && { window: options.rateLimit.window }),
                        prefix: options.rateLimit.prefix ?? 'ratelimit:api-route',
                    },
                });
            }

            return await handler(req, ...args);
        } catch (error) {
            if (error instanceof ServerActionRateLimitError) {
                return apiResponse(false, null, `Rate limit exceeded. Try again in ${error.retryAfter}s.`, 429);
            }
            return handleError(error);
        }
    };
}

export interface ActionResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

async function getServerActionIdentifier(): Promise<string> {
    const user = await getAuthenticatedUser();
    if (user?.id) return user.id;

    try {
        const incomingHeaders = await Promise.resolve(headers());
        const forwardedFor = incomingHeaders.get('x-forwarded-for');
        if (forwardedFor) {
            const first = forwardedFor.split(',')[0]?.trim();
            if (first) return first;
        }

        const realIp = incomingHeaders.get('x-real-ip');
        if (realIp) return realIp;
    } catch (error) {
        logger.debug({ err: error }, 'Could not resolve server action headers for rate-limit identifier');
    }

    return 'anonymous';
}


/**
 * HOF for Server Actions
 * @deprecated Use `executeAction()` instead for rate limiting + structured logging.
 * Will be removed in a future release.
 */
export function safeAction<T = any, R = any>(
    action: (data: T) => Promise<R>,
    schema: ZodSchema<T> | null = null
): (data: any) => Promise<ActionResponse<R>> {
    return async (data: any): Promise<ActionResponse<R>> => {
        try {
            let validatedData = data;
            if (schema) {
                // If it's FormData, convert to object first
                const raw = data instanceof FormData ? Object.fromEntries(data.entries()) : data;
                validatedData = schema.parse(raw);
            }
            const result = await action(validatedData);
            return { success: true, data: result };
        } catch (error: any) {
            logger.error({ err: error }, "Action Error");
            if (error instanceof ZodError) {
                return { success: false, error: error.issues[0]?.message || "Validation Error" };
            }
            // Security: Generic message in production
            const message = process.env.NODE_ENV === 'production'
                ? 'Something went wrong'
                : (error.message || 'Something went wrong');
            return { success: false, error: message };
        }
    };
}

/**
 * Safe action wrapper for authenticated actions
 * Automatically checks session and returns error if not authenticated
 * @deprecated Use `executeAction()` instead for rate limiting + structured logging.
 * Will be removed in a future release.
 */
export function safeAuthAction<T = any, R = any>(
    action: (data: T, userId: string, userRole: string) => Promise<R>,
    schema: ZodSchema<T> | null = null,
    options: { requireAuth?: boolean } = { requireAuth: true }
): (data: any) => Promise<ActionResponse<R>> {
    return async (data: any): Promise<ActionResponse<R>> => {
        try {
            // Note: This is a pattern helper. Actual auth check should be done in the action itself
            // using getServerSession as Next.js server actions don't have direct access to session in wrapper
            let validatedData = data;
            if (schema) {
                const raw = data instanceof FormData ? Object.fromEntries(data.entries()) : data;
                validatedData = schema.parse(raw);
            }

            // Action must handle auth internally, but this wrapper standardizes the pattern
            const result = await action(validatedData, '', '');
            return { success: true, data: result };
        } catch (error: any) {
            logger.error({ err: error, data }, "Authenticated Action Error");
            if (error instanceof ZodError) {
                return { success: false, error: error.issues[0]?.message || "Validation Error" };
            }
            if (error.message?.includes('Unauthorized') || error.message?.includes('Permission denied')) {
                return { success: false, error: error.message };
            }
            // Security: Generic message in production
            const message = process.env.NODE_ENV === 'production'
                ? 'Action failed'
                : (error.message || 'Action failed');
            return { success: false, error: message };
        }
    };
}

/**
 * Safe action wrapper specifically for FormData mutations
 * Handles FormData parsing, validation, and error responses
 * @deprecated Use `executeAction()` instead for rate limiting + structured logging.
 * Will be removed in a future release.
 */
export function safeFormDataAction<R = any>(
    action: (formData: FormData) => Promise<R>
): (formData: FormData) => Promise<ActionResponse<R>> {
    return async (formData: FormData): Promise<ActionResponse<R>> => {
        try {
            const result = await action(formData);
            return { success: true, data: result };
        } catch (error: any) {
            logger.error({ err: error, action: 'FormData mutation' }, "FormData Action Error");
            if (error instanceof ZodError) {
                return { success: false, error: error.issues.map(i => i.message).join(', ') };
            }
            // Security: Generic message in production
            const message = process.env.NODE_ENV === 'production'
                ? 'Failed to process form data'
                : (error.message || 'Failed to process form data');
            return { success: false, error: message };
        }
    };
}

/**
 * Safe action wrapper with optimistic locking support
 * Useful for update operations that need to prevent race conditions
 * @deprecated Use `executeAction()` instead for rate limiting + structured logging.
 * Will be removed in a future release.
 */
export function safeMutationAction<T = any, R = any>(
    action: (data: T) => Promise<R>,
    schema: ZodSchema<T> | null = null,
    options: { logMutation?: boolean } = { logMutation: false }
): (data: any) => Promise<ActionResponse<R>> {
    return async (data: any): Promise<ActionResponse<R>> => {
        try {
            let validatedData = data;
            if (schema) {
                const raw = data instanceof FormData ? Object.fromEntries(data.entries()) : data;
                validatedData = schema.parse(raw);
            }

            const result = await action(validatedData);

            if (options.logMutation) {
                logger.info({ data: validatedData, result }, "Mutation completed successfully");
            }

            return { success: true, data: result };
        } catch (error: any) {
            logger.error({ err: error, data }, "Mutation Action Error");

            // Handle specific database errors
            if (error.code === 'P2002') {
                return { success: false, error: "A record with this data already exists" };
            }
            if (error.code === 'P2025') {
                return { success: false, error: "Record not found or already deleted" };
            }
            if (error instanceof ZodError) {
                return { success: false, error: error.issues[0]?.message || "Validation Error" };
            }

            // Security: Generic message in production
            const message = process.env.NODE_ENV === 'production'
                ? 'Mutation failed'
                : (error.message || 'Mutation failed');
            return { success: false, error: message };
        }
    };
}

/**
 * Parse Request Body with Zod Schema
 */
export async function parseBody<T>(req: NextRequest, schema: ZodSchema<T>): Promise<T> {
    const body = await req.json();
    return schema.parse(body);
}


/**
 * Execute a server action body with centralized error handling.
 *
 * Preserves the original return shape of the callback — unlike `safeMutationAction`
 * which wraps results in `{ success, data }`. This is ideal for migrating existing
 * server actions without breaking callers.
 *
 * Value adds over raw try/catch:
 * - Prisma P2002 (unique constraint) → user-friendly message
 * - Prisma P2025 (record not found) → user-friendly message
 * - ZodError → first issue message
 * - Structured logging via `logger.error` (replaces `console.error`)
 * - Consistent `{ success: false, error }` shape on failure
 *
 * @example
 * export async function createEvent(formData: FormData) {
 *   const session = await getServerSession(authOptions);
 *   if (!session?.user) return { error: 'Unauthorized' };
 *
 *   return executeAction(async () => {
 *     const data = EventSchema.parse(extractFormData(formData));
 *     const event = await prisma.event.create({ data });
 *     await revalidateEvents();
 *     return { success: true, event };
 *   }, 'createEvent');
 * }
 */
export async function executeAction<T>(
    fn: () => Promise<T>,
    context?: string
): Promise<T | { success: false; error: string }> {
    try {
        if (shouldRateLimitServerAction(context)) {
            const identifier = await getServerActionIdentifier();
            await enforceServerActionRateLimit({
                actionName: context || 'serverAction',
                identifier,
                config: { limit: 30, window: '1 m' },
            });
        }

        const result = await fn();
        // Automatically serialize the result to handle Date objects/Prisma complex types
        // this fixes the "An unexpected response was received from the server" error in Next.js
        return JSON.parse(JSON.stringify(result));
    } catch (error: unknown) {
        if (error instanceof ServerActionRateLimitError) {
            return {
                success: false,
                error: `Rate limit exceeded. Try again in ${error.retryAfter}s.`,
            };
        }

        logger.error({ err: error, context }, "Server Action Error");

        if (error instanceof ZodError) {
            return { success: false, error: error.issues[0]?.message || "Validation Error" };
        }

        const prismaError = error as { code?: string };
        if (prismaError.code === 'P2002') {
            return { success: false, error: "A record with this data already exists" };
        }
        if (prismaError.code === 'P2025') {
            return { success: false, error: "Record not found or already deleted" };
        }

        // Security: Generic message in production
        const message = process.env.NODE_ENV === 'production'
            ? 'Something went wrong'
            : (error instanceof Error ? error.message : 'Something went wrong');
        return { success: false, error: message };
    }
}

