'use server'

import { revalidateEvents } from '@/lib/revalidation'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { EventSchema } from '@/lib/schemas'
import { createAuditLog } from '@/lib/audit'
import { inviteCoordinator } from '@/actions/coordinatorActions'
import { sendEmail } from '@/lib/email'
import type { User } from '@/lib/permissions'
import { assertPermission } from '@/lib/permissions'
import { EventStatus, Prisma } from '@/lib/generated/client'
import type { Event } from '@/lib/generated/client'
import { executeAction } from '@/lib/api-utils'
import type { AuthUser } from '@/lib/auth-helpers'

export interface ActionResponse<T = unknown> {
    success?: boolean;
    data?: T;
    error?: string;
}

const EVENT_STATUS_VALUES = new Set(Object.values(EventStatus));

interface CoordinatorContact {
    name: string;
    email: string;
    phone?: string;
}

function parseCoordinatorPayload(raw: string | null): unknown[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

/**
 * Safely extract coordinator admin IDs from form data.
 * Frontend may send either string IDs (new M2M pattern) or objects {name, email, phone} (legacy pattern).
 * Only valid string IDs are passed through; objects are filtered out.
 */
function extractCoordinatorIds(raw: string | null): string[] {
    const parsed = parseCoordinatorPayload(raw);
    return parsed
        .map((item: unknown) => {
            if (typeof item === 'string' && item.length > 0) return item;
            if (item && typeof item === 'object' && 'id' in item) {
                const value = (item as { id?: unknown }).id;
                return typeof value === 'string' && value.length > 0 ? value : null;
            }
            return null;
        })
        .filter((id): id is string => Boolean(id));
}

function extractCoordinatorContacts(raw: string | null): CoordinatorContact[] {
    const parsed = parseCoordinatorPayload(raw);
    const byEmail = new Map<string, CoordinatorContact>();

    for (const item of parsed) {
        if (!item || typeof item !== 'object') continue;
        const maybeObject = item as { id?: unknown; name?: unknown; email?: unknown; phone?: unknown };

        // Existing assigned coordinators already have IDs and are handled via relation set/connect.
        if (typeof maybeObject.id === 'string' && maybeObject.id.length > 0) continue;

        const email = typeof maybeObject.email === 'string' ? maybeObject.email.trim().toLowerCase() : '';
        if (!email) continue;

        const name = typeof maybeObject.name === 'string' && maybeObject.name.trim().length > 0
            ? maybeObject.name.trim()
            : email.split('@')[0]!;

        const phone = typeof maybeObject.phone === 'string' && maybeObject.phone.trim().length > 0
            ? maybeObject.phone.trim()
            : undefined;

        byEmail.set(email, phone ? { name, email, phone } : { name, email });
    }

    return Array.from(byEmail.values());
}

/**
 * Notify existing coordinators (already in the DB) that they have been assigned to an event.
 * This is separate from inviteCoordinator which handles brand-new coordinator account creation.
 */
async function notifyAssignedCoordinators(
    coordinatorIds: string[],
    eventTitle: string,
    eventId: string
) {
    if (coordinatorIds.length === 0) return;

    const coordinators = await prisma.admin.findMany({
        where: { id: { in: coordinatorIds } },
        select: { id: true, name: true, email: true },
    });

    const dashboardUrl = `${process.env.NEXTAUTH_URL}/coordinator`;

    await Promise.allSettled(
        coordinators.map((coordinator) =>
            sendEmail({
                to: coordinator.email,
                subject: `You've been assigned to: ${eventTitle}`,
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                        <h2 style="color: #1a1a1a;">Event Assignment Notification</h2>
                        <p>Hello <strong>${coordinator.name}</strong>,</p>
                        <p>You have been assigned as a coordinator for the event: <strong>${eventTitle}</strong>.</p>
                        <p>You can view the event and manage registrations from your coordinator dashboard:</p>
                        <a href="${dashboardUrl}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Open Dashboard</a>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                        <p style="font-size: 12px; color: #888;">Ornate Event Management System</p>
                    </div>
                `,
            })
        )
    );
}

function parseEventStatus(value: unknown): EventStatus | null {
    if (typeof value !== 'string') return null;
    const normalized = value.trim().toUpperCase();
    if (EVENT_STATUS_VALUES.has(normalized as EventStatus)) {
        return normalized as EventStatus;
    }
    return null;
}

export async function createEvent(formData: FormData): Promise<ActionResponse<Event>> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return { error: 'Unauthorized. Please login to create events.' };
    }

    try {
        assertPermission(session.user as User, 'create:event');
    } catch (e: unknown) {
        return { error: e instanceof Error ? e.message : 'Permission denied' };
    }

    return executeAction(async () => {
        const coordinatorPayload = formData.get('coordinators') as string | null;
        const getOptional = (key: string) => {
            const val = formData.get(key);
            return (val === null || val === '') ? undefined : val as string;
        };

        const rawData = {
            title: formData.get('title'),
            description: getOptional('description'),
            shortDescription: getOptional('shortDescription'),
            category: getOptional('category'),
            eventType: formData.get('eventType'), // This now comes from the split UI
            teamSizeMin: formData.get('teamSizeMin') ? Number(formData.get('teamSizeMin')) : undefined,
            teamSizeMax: formData.get('teamSizeMax') ? Number(formData.get('teamSizeMax')) : undefined,
            locationType: getOptional('locationType'),
            venue: getOptional('venue'),
            date: formData.get('date'),
            startTime: getOptional('startTime'),
            endTime: getOptional('endTime'),
            endDate: getOptional('endDate'),
            registrationOpen: formData.get('registrationStatus') === 'open',
            maxCapacity: formData.get('maxParticipants') ? Number(formData.get('maxParticipants')) : undefined,
            minParticipants: formData.get('minParticipants') ? Number(formData.get('minParticipants')) : undefined,
            waitlistEnabled: formData.get('waitlistEnabled') === 'true',
            fee: getOptional('fee'),
            price: formData.get('isPaid') === 'true' ? (Number(formData.get('fee')) || 0) : 0,
            posterUrl: getOptional('posterUrl'),
            coordinatorIds: extractCoordinatorIds(coordinatorPayload),
            eligibility: formData.get('eligibility') ? JSON.parse(formData.get('eligibility') as string) : [],
            customFields: formData.get('customFields') ? JSON.parse(formData.get('customFields') as string) : [],
            documents: formData.get('documents') ? JSON.parse(formData.get('documents') as string) : [],
            status: (formData.get('status') as string) || undefined,
            additionalImages: formData.get('additionalImages') ? JSON.parse(formData.get('additionalImages') as string) : [],
            prizes: formData.get('hasPrizes') === 'false' ? [] : (formData.get('prizes') ? JSON.parse(formData.get('prizes') as string) : []),
            rules: formData.get('rules') as string,
            paymentGateway: getOptional('paymentGateway'),
        };

        const validatedData = EventSchema.parse(rawData);
        const { coordinatorIds, ...eventFields } = validatedData;
        const normalizedStatus = parseEventStatus(validatedData.status) || EventStatus.DRAFT;

        const timeDisplay = validatedData.startTime && validatedData.endTime
            ? `${validatedData.startTime} - ${validatedData.endTime}`
            : null;

        const newEvent = await prisma.event.create({
            data: {
                ...eventFields,
                maxCapacity: validatedData.maxCapacity ?? 100,
                description: validatedData.description ?? '',
                shortDescription: validatedData.shortDescription ?? null,
                category: validatedData.category ?? null,
                posterUrl: validatedData.posterUrl ?? null,
                venue: validatedData.venue ?? '',
                eventType: validatedData.eventType ?? null,
                locationType: validatedData.locationType ?? 'physical',
                startTime: validatedData.startTime ?? null,
                endTime: validatedData.endTime ?? null,
                endDate: validatedData.endDate ?? null,
                rules: validatedData.rules ?? null,
                teamSizeMin: validatedData.teamSizeMin ?? null,
                teamSizeMax: validatedData.teamSizeMax ?? null,
                minParticipants: validatedData.minParticipants ?? null,
                eligibility: (validatedData.eligibility as Prisma.InputJsonValue) ?? Prisma.JsonNull,
                customFields: (validatedData.customFields as Prisma.InputJsonValue) ?? Prisma.JsonNull,
                documents: (validatedData.documents as Prisma.InputJsonValue) ?? Prisma.JsonNull,
                additionalImages: (validatedData.additionalImages as string[]) ?? [],
                prizes: (validatedData.prizes as Prisma.InputJsonValue) ?? Prisma.JsonNull,
                status: normalizedStatus,
                time: timeDisplay,
                creatorId: (session.user as AuthUser).id,
                ...(coordinatorIds && coordinatorIds.length > 0 && {
                    assignedCoordinators: {
                        connect: coordinatorIds.map((id: string) => ({ id }))
                    }
                })
            }
        });

        await createAuditLog({
            action: 'CREATE_EVENT',
            entityType: 'EVENT',
            entityId: newEvent.id,
            performedBy: (session.user as AuthUser).id,
            metadata: { title: validatedData.title }
        });

        // Notify existing coordinators that they've been assigned
        if (coordinatorIds && coordinatorIds.length > 0) {
            await notifyAssignedCoordinators(coordinatorIds, validatedData.title as string, newEvent.id);
        }

        // Invite brand-new coordinators (creates accounts + sends setup email)
        const coordinatorContacts = extractCoordinatorContacts(coordinatorPayload);
        if (coordinatorContacts.length > 0) {
            await Promise.allSettled(
                coordinatorContacts.map((coordinator) => inviteCoordinator(newEvent.id, coordinator))
            );
        }

        await revalidateEvents();

        return { success: true, data: newEvent } as ActionResponse<Event>;
    }, 'createEvent');
}

export async function updateEvent(formData: FormData): Promise<ActionResponse<Event>> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return { error: 'Unauthorized. Please login to update events.' };
    }

    return executeAction(async () => {
        const eventId = formData.get('id') as string;
        if (!eventId) throw new Error('Event ID is required for update');

        const coordinatorPayload = formData.get('coordinators') as string | null;

        const existingEvent = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                creator: { select: { id: true, branch: true, clubId: true, role: true } },
                assignedCoordinators: { select: { id: true } },
            }
        });

        if (!existingEvent) throw new Error('Event not found');

        assertPermission(session.user as User, 'update:event', existingEvent);

        const getOptional = (key: string) => {
            const val = formData.get(key);
            return (val === null || val === '') ? undefined : val as string;
        };

        const rawData = {
            title: formData.get('title'),
            description: getOptional('description') || '',
            shortDescription: getOptional('shortDescription'),
            category: getOptional('category'),
            eventType: formData.get('eventType'),
            teamSizeMin: formData.get('teamSizeMin') ? Number(formData.get('teamSizeMin')) : undefined,
            teamSizeMax: formData.get('teamSizeMax') ? Number(formData.get('teamSizeMax')) : undefined,
            locationType: getOptional('locationType') || 'physical',
            venue: getOptional('venue') || '',
            date: formData.get('date'),
            startTime: getOptional('startTime'),
            endTime: getOptional('endTime'),
            endDate: getOptional('endDate'),
            registrationOpen: formData.get('registrationStatus') === 'open',
            maxCapacity: (formData.get('maxParticipants') || formData.get('capacity')) ? Number(formData.get('maxParticipants') || formData.get('capacity')) : undefined,
            minParticipants: formData.get('minParticipants') ? Number(formData.get('minParticipants')) : undefined,
            waitlistEnabled: formData.get('waitlistEnabled') === 'true',
            fee: getOptional('fee'),
            price: formData.get('isPaid') === 'true' ? (Number(formData.get('fee')) || 0) : 0,
            posterUrl: getOptional('posterUrl'),
            coordinatorIds: extractCoordinatorIds(coordinatorPayload),
            eligibility: formData.get('eligibility') ? JSON.parse(formData.get('eligibility') as string) : [],
            customFields: formData.get('customFields') ? JSON.parse(formData.get('customFields') as string) : [],
            documents: formData.get('documents') ? JSON.parse(formData.get('documents') as string) : [],
            status: (formData.get('status') as string) || 'DRAFT',
            additionalImages: formData.get('additionalImages') ? JSON.parse(formData.get('additionalImages') as string) : [],
            prizes: formData.get('hasPrizes') === 'false' ? [] : (formData.get('prizes') ? JSON.parse(formData.get('prizes') as string) : []),
            rules: getOptional('rules'),
            paymentGateway: getOptional('paymentGateway'),
        };

        const validatedData = EventSchema.parse(rawData);
        const { coordinatorIds, ...eventFields } = validatedData;
        const normalizedStatus = parseEventStatus(validatedData.status) || existingEvent.status;

        const timeDisplay = validatedData.startTime && validatedData.endTime
            ? `${validatedData.startTime} - ${validatedData.endTime}`
            : null;

        const updatedEvent = await prisma.event.update({
            where: { id: eventId },
            data: {
                ...eventFields,
                maxCapacity: validatedData.maxCapacity ?? existingEvent.maxCapacity ?? 100,
                description: validatedData.description ?? null,
                shortDescription: validatedData.shortDescription ?? null,
                category: validatedData.category ?? null,
                posterUrl: validatedData.posterUrl ?? null,
                venue: validatedData.venue ?? '',
                eventType: validatedData.eventType ?? null,
                locationType: validatedData.locationType ?? 'physical',
                startTime: validatedData.startTime ?? null,
                endTime: validatedData.endTime ?? null,
                endDate: validatedData.endDate ?? null,
                rules: validatedData.rules ?? null,
                teamSizeMin: validatedData.teamSizeMin ?? null,
                teamSizeMax: validatedData.teamSizeMax ?? null,
                minParticipants: validatedData.minParticipants ?? null,
                eligibility: (validatedData.eligibility as Prisma.InputJsonValue) ?? Prisma.JsonNull,
                customFields: (validatedData.customFields as Prisma.InputJsonValue) ?? Prisma.JsonNull,
                documents: (validatedData.documents as Prisma.InputJsonValue) ?? Prisma.JsonNull,
                additionalImages: (validatedData.additionalImages as string[]) ?? [],
                prizes: (validatedData.prizes as Prisma.InputJsonValue) ?? Prisma.JsonNull,
                status: normalizedStatus,
                time: timeDisplay,
                assignedCoordinators: {
                    set: (coordinatorIds || []).map((id: string) => ({ id }))
                }
            }
        });

        await createAuditLog({
            action: 'UPDATE_EVENT',
            entityType: 'EVENT',
            entityId: updatedEvent.id,
            performedBy: (session.user as AuthUser).id,
            metadata: { title: validatedData.title }
        });

        // Notify only newly assigned existing coordinators (not those already assigned before)
        const previousCoordinatorIds = new Set((existingEvent.assignedCoordinators || []).map(c => c.id));
        const newlyAssignedIds = (coordinatorIds || []).filter((id: string) => !previousCoordinatorIds.has(id));
        if (newlyAssignedIds.length > 0) {
            await notifyAssignedCoordinators(newlyAssignedIds, validatedData.title as string, eventId);
        }

        // Invite brand-new coordinators (creates accounts + sends setup email)
        const coordinatorContacts = extractCoordinatorContacts(coordinatorPayload);
        if (coordinatorContacts.length > 0) {
            await Promise.allSettled(
                coordinatorContacts.map((coordinator) => inviteCoordinator(eventId, coordinator))
            );
        }

        await revalidateEvents();

        return { success: true, data: updatedEvent } as ActionResponse<Event>;
    }, 'updateEvent');
}

export async function deleteEvent(eventId: string): Promise<ActionResponse> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return { error: 'Unauthorized. Please login to delete events.' };
    }

    return executeAction(async () => {
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                creator: {
                    select: { id: true, branch: true, clubId: true, role: true }
                }
            }
        });

        if (!event) throw new Error('Event not found');

        const isAdmin = session.user.role === 'SUPER_ADMIN';
        const isHHO = session.user.role === 'HHO' && event.creator.role === 'HHO';
        const isSports = (session.user.role === 'SPORTS_ADMIN' || session.user.role === 'BRANCH_SPORTS_ADMIN') && (event.creator.role === 'SPORTS_ADMIN' || event.category === 'Sports');
        const isSameBranch = session.user.role === 'BRANCH_ADMIN' && event.creator.branch === session.user.branch;
        const isSameClub = session.user.role === 'CLUB_COORDINATOR' && event.creator.clubId === session.user.clubId;
        const isCreator = event.creator.id === session.user.id;

        if (!isAdmin && !isCreator && !isSameBranch && !isSameClub && !isHHO && !isSports) {
            throw new Error('Unauthorized. You do not have permission to delete this event.');
        }

        await prisma.$transaction([
            prisma.registration.deleteMany({ where: { eventId: eventId } }),
            prisma.winnerAnnouncement.deleteMany({ where: { eventId: eventId } }),
            prisma.event.delete({ where: { id: eventId } })
        ]);

        await createAuditLog({
            action: 'DELETE_EVENT',
            entityType: 'EVENT',
            entityId: eventId,
            performedBy: session.user.id,
            metadata: { eventId }
        });

        await revalidateEvents();

        return { success: true } as ActionResponse;
    }, 'deleteEvent');
}

export async function updateEventStatus(eventId: string, newStatus: string): Promise<ActionResponse<Event>> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return { error: 'Unauthorized' };
    }

    return executeAction(async () => {
        const parsedStatus = parseEventStatus(newStatus);
        if (!parsedStatus) {
            throw new Error('Invalid event status');
        }

        const updatedEvent = await prisma.event.update({
            where: { id: eventId },
            data: { status: parsedStatus }
        });

        await revalidateEvents();

        return { success: true, data: updatedEvent } as ActionResponse<Event>;
    }, 'updateEventStatus');
}

export async function duplicateEvent(eventId: string): Promise<ActionResponse<Event>> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { error: 'Unauthorized' };

    return executeAction(async () => {
        const originalEvent = await prisma.event.findUnique({
            where: { id: eventId }
        });

        if (!originalEvent) throw new Error('Original event not found');

        const { id, createdAt, updatedAt, creatorId, status, ...eventData } = originalEvent;

        const newEvent = await prisma.event.create({
            data: {
                ...eventData,
                title: `${originalEvent.title} (Copy)`,
                status: originalEvent.status,
                creatorId: session.user.id,
            } as any
        });

        await createAuditLog({
            action: 'DUPLICATE_EVENT',
            entityType: 'EVENT',
            entityId: newEvent.id,
            performedBy: session.user.id,
            metadata: { originalEventId: eventId, newTitle: newEvent.title }
        });

        await revalidateEvents();

        return { success: true, data: newEvent } as ActionResponse<Event>;
    }, 'duplicateEvent');
}

