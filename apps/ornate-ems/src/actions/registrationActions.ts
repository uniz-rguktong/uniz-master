'use server'

import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'
import { revalidateRegistrations } from '@/lib/revalidation'
import { RegistrationStatus, PaymentStatus, Prisma } from '@/lib/generated/client'
import { executeAction } from '@/lib/api-utils'
import type { AuthUser } from '@/lib/auth-helpers'
import { assertPermission } from '@/lib/permissions'
import { sendEmail } from '@/lib/email'
import { revalidatePath } from 'next/cache'


export interface RegistrationActionResponse {
    success?: boolean;
    error?: string;
    count?: number;
    successful?: number;
    failed?: number;
    errors?: string[];
    message?: string;
}

async function syncWinnerAnnouncementFromRanks(eventId: string) {
    const rankedRegistrations = await prisma.registration.findMany({
        where: {
            eventId,
            rank: { in: [1, 2, 3] }
        },
        orderBy: [
            { rank: 'asc' },
            { createdAt: 'asc' }
        ],
        select: {
            rank: true,
            studentName: true,
            studentId: true,
            email: true
        }
    });

    if (rankedRegistrations.length === 0) {
        return { success: false as const, error: 'No ranked registrations found. Assign ranks (1/2/3) first in registrations.' };
    }

    const rankMap = new Map<number, string[]>();
    for (const row of rankedRegistrations) {
        if (!row.rank) continue;
        const current = rankMap.get(row.rank) || [];
        const identifier = row.email || row.studentId || row.studentName;
        if (identifier) current.push(identifier);
        rankMap.set(row.rank, current);
    }

    const positions = [1, 2, 3]
        .map((rank) => ({
            rank: String(rank),
            members: rankMap.get(rank) || [],
            prize: rank === 1 ? '1st Prize' : rank === 2 ? '2nd Prize' : '3rd Prize',
            certificate: true
        }))
        .filter((p) => p.members.length > 0);

    if (positions.length === 0) {
        return { success: false as const, error: 'No valid winner entries could be generated from ranked registrations.' };
    }

    await prisma.winnerAnnouncement.upsert({
        where: { eventId },
        create: {
            eventId,
            positions,
            isPublished: true,
            publishedAt: new Date()
        },
        update: {
            positions,
            isPublished: true,
            publishedAt: new Date()
        }
    });

    return { success: true as const, positions };
}

export async function announceWinnersFromRegistrations(eventId: string): Promise<RegistrationActionResponse> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return { error: 'Unauthorized' };

    return executeAction(async () => {
        const sessionUser = session.user as AuthUser;
        const admin = await prisma.admin.findFirst({
            where: { email: { equals: session.user.email!, mode: 'insensitive' } },
            select: { id: true, role: true, branch: true, clubId: true }
        });

        const actorId = admin?.id || sessionUser.id;
        const actorRole = admin?.role || sessionUser.role;
        const actorBranch = admin?.branch ?? sessionUser.branch ?? null;
        const actorClubId = admin?.clubId ?? sessionUser.clubId ?? null;

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: {
                id: true,
                title: true,
                creatorId: true,
                category: true,
                creator: {
                    select: { branch: true, clubId: true }
                }
            }
        });

        if (!event) {
            return { error: 'Event not found.' };
        }

        try {
            assertPermission(
                {
                    id: actorId,
                    role: actorRole,
                    branch: actorBranch,
                    clubId: actorClubId
                },
                'update:event',
                event
            );
        } catch {
            return { error: 'You do not have permission to announce winners for this event.' };
        }

        const syncResult = await syncWinnerAnnouncementFromRanks(eventId);
        if (!syncResult.success) {
            return { error: syncResult.error };
        }

        await createAuditLog({
            action: 'ANNOUNCE_WINNERS_FROM_REGISTRATIONS',
            entityType: 'EVENT',
            entityId: eventId,
            performedBy: actorId,
            metadata: { eventTitle: event.title, positions: syncResult.positions }
        });

        revalidatePath('/(dashboard)/branch-admin/content/winners', 'page');
        revalidatePath('/(dashboard)/branch-admin/registrations', 'page');

        return { success: true, message: 'Winners announced successfully from registrations.' };
    }, 'announceWinnersFromRegistrations');
}

export async function assignWinnerPrizeAndAnnounce(params: {
    eventId: string;
    targetId: string;
    targetType: 'registration' | 'team';
    rank: 1 | 2 | 3;
}): Promise<RegistrationActionResponse> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return { error: 'Unauthorized' };

    return executeAction(async () => {
        const sessionUser = session.user as AuthUser;
        const admin = await prisma.admin.findFirst({
            where: { email: { equals: session.user.email!, mode: 'insensitive' } },
            select: { id: true, role: true, branch: true, clubId: true }
        });

        const actorId = admin?.id || sessionUser.id;
        const actorRole = admin?.role || sessionUser.role;
        const actorBranch = admin?.branch ?? sessionUser.branch ?? null;
        const actorClubId = admin?.clubId ?? sessionUser.clubId ?? null;

        const event = await prisma.event.findUnique({
            where: { id: params.eventId },
            select: {
                id: true,
                title: true,
                creatorId: true,
                category: true,
                creator: {
                    select: { branch: true, clubId: true }
                }
            }
        });

        if (!event) return { error: 'Event not found.' };

        try {
            assertPermission(
                {
                    id: actorId,
                    role: actorRole,
                    branch: actorBranch,
                    clubId: actorClubId
                },
                'update:event',
                event
            );
        } catch {
            return { error: 'You do not have permission to announce winners for this event.' };
        }

        let registrationIdToUpdate: string | null = null;

        if (params.targetType === 'registration') {
            const reg = await prisma.registration.findFirst({
                where: { id: params.targetId, eventId: params.eventId },
                select: { id: true }
            });
            if (!reg) return { error: 'Registration not found for this event.' };
            registrationIdToUpdate = reg.id;
        } else {
            const team = await prisma.team.findFirst({
                where: { id: params.targetId, eventId: params.eventId },
                select: { id: true, registrationId: true, leaderEmail: true, leaderName: true }
            });

            if (!team) return { error: 'Team not found for this event.' };

            if (team.registrationId) {
                registrationIdToUpdate = team.registrationId;
            } else {
                const fallbackRegistration = await prisma.registration.findFirst({
                    where: {
                        eventId: params.eventId,
                        OR: [
                            { email: team.leaderEmail },
                            { studentName: team.leaderName }
                        ]
                    },
                    select: { id: true }
                });
                registrationIdToUpdate = fallbackRegistration?.id || null;
            }

            if (!registrationIdToUpdate) {
                return { error: 'Team is not linked to a registration. Please register team leader first.' };
            }
        }

        await prisma.registration.update({
            where: { id: registrationIdToUpdate },
            data: { rank: params.rank }
        });

        const syncResult = await syncWinnerAnnouncementFromRanks(params.eventId);
        if (!syncResult.success) return { error: syncResult.error };

        await createAuditLog({
            action: 'ASSIGN_WINNER_PRIZE_AND_ANNOUNCE',
            entityType: params.targetType === 'team' ? 'TEAM' : 'REGISTRATION',
            entityId: params.targetId,
            performedBy: actorId,
            metadata: {
                eventId: params.eventId,
                eventTitle: event.title,
                rank: params.rank,
                targetType: params.targetType,
                registrationId: registrationIdToUpdate
            }
        });

        revalidatePath('/(dashboard)/branch-admin/content/winners', 'page');
        revalidatePath('/(dashboard)/branch-admin/registrations', 'page');

        return { success: true, message: `${params.rank} prize assigned and winners announcement updated.` };
    }, 'assignWinnerPrizeAndAnnounce');
}

function buildRegistrationEmailHtml(params: {
    studentName: string;
    eventTitle: string;
    status: string;
    reason?: string;
}): string {
    const { studentName, eventTitle, status, reason } = params;
    const isConfirmed = status === 'CONFIRMED';

    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #111827; margin: 0 0 12px 0;">Registration Update</h2>
        <p style="color: #374151; margin: 0 0 10px 0;">Hello ${studentName || 'Participant'},</p>
        <p style="color: #374151; margin: 0 0 10px 0;">
            Your registration for <strong>${eventTitle}</strong> has been <strong>${isConfirmed ? 'confirmed' : 'rejected'}</strong>.
        </p>
        ${!isConfirmed && reason ? `<p style="color: #7f1d1d; margin: 0 0 10px 0;"><strong>Reason:</strong> ${reason}</p>` : ''}
        <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">This is an automated message from Ornate EMS.</p>
    </div>
    `;
}

interface RegistrationUpdateInput {
    studentName: string;
    eventId?: string;
    contact?: string;
}

interface RegistrationCreateInput {
    studentName: string;
    studentId: string;
    eventId: string;
    amount: number | string;
    paymentStatus?: string;
}

interface ImportRow {
    'Event Name'?: string;
    'Event'?: string;
    'Roll Number'?: string;
    'Student ID'?: string;
    'Roll No'?: string;
    'Email'?: string;
    'Student Name'?: string;
    'Status'?: string;
    'Amount'?: string | number;
}


/**
 * Delete a registration by ID
 */
export async function deleteRegistration(id: string): Promise<RegistrationActionResponse> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return { error: 'Unauthorized' };

    return executeAction(async () => {
        const admin = await prisma.admin.findUnique({
            where: { email: session.user.email! },
            select: { id: true, role: true, branch: true, clubId: true }
        });

        if (!admin) return { error: 'Admin not found' };

        let whereClause: Prisma.RegistrationWhereInput = { id };

        if (admin.role === 'CLUB_COORDINATOR' && admin.clubId) {
            whereClause.event = { creator: { clubId: admin.clubId } };
        } else if (admin.role === 'HHO') {
            whereClause.event = { creator: { role: 'HHO' } };
        } else if (admin.role === 'SPORTS_ADMIN' || admin.role === 'BRANCH_SPORTS_ADMIN') {
            whereClause.event = { creator: { role: 'SPORTS_ADMIN' } };
        } else if (admin.role !== 'SUPER_ADMIN') {
            whereClause.event = { creator: { branch: admin.branch } };
        }

        const registration = await prisma.registration.findFirst({ where: whereClause, select: { id: true } });

        if (!registration && admin.role !== 'SUPER_ADMIN') {
            return { error: 'Unauthorized. You can only delete registrations for your assigned events.' };
        }

        await prisma.registration.delete({ where: { id } });

        await createAuditLog({
            action: 'DELETE_REGISTRATION',
            entityType: 'REGISTRATION',
            entityId: id,
            performedBy: admin.id
        });

        return { success: true };
    }, 'deleteRegistration');
}

/**
 * Bulk delete registrations
 */
export async function bulkDeleteRegistrations(ids: string[]): Promise<RegistrationActionResponse> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return { error: 'Unauthorized' };

    return executeAction(async () => {
        const admin = await prisma.admin.findUnique({
            where: { email: session.user.email! },
            select: { id: true }
        });

        if (!admin) return { error: 'Admin not found' };

        await prisma.registration.deleteMany({
            where: { id: { in: ids } }
        });

        await createAuditLog({
            action: 'BULK_DELETE_REGISTRATIONS',
            entityType: 'REGISTRATION',
            entityId: 'bulk',
            performedBy: admin.id,
            metadata: { count: ids.length, ids }
        });

        return { success: true };
    }, 'bulkDeleteRegistrations');
}


/**
 * Update registration details
 */
export async function updateRegistration(id: string, data: RegistrationUpdateInput): Promise<RegistrationActionResponse> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return { error: 'Unauthorized' };

    return executeAction(async () => {
        const admin = await prisma.admin.findUnique({
            where: { email: session.user.email! },
            select: { id: true, role: true, branch: true, clubId: true }
        });

        if (!admin) return { error: 'Admin not found' };

        let whereClause: Prisma.RegistrationWhereInput = { id };

        if (admin.role === 'CLUB_COORDINATOR' && admin.clubId) {
            whereClause.event = { creator: { clubId: admin.clubId } };
        } else if (admin.role === 'HHO') {
            whereClause.event = { creator: { role: 'HHO' } };
        } else if (admin.role === 'SPORTS_ADMIN' || admin.role === 'BRANCH_SPORTS_ADMIN') {
            whereClause.event = { creator: { role: 'SPORTS_ADMIN' } };
        } else if (admin.role !== 'SUPER_ADMIN') {
            whereClause.event = { creator: { branch: admin.branch } };
        }

        const registration = await prisma.registration.findFirst({ where: whereClause, select: { id: true, userId: true } });

        if (!registration && admin.role !== 'SUPER_ADMIN') {
            return { error: 'Unauthorized. You can only update registrations for your assigned events.' };
        }

        const { studentName, eventId, contact } = data;

        await prisma.registration.update({
            where: { id },
            data: {
                studentName,
                ...(eventId && { eventId })
            }
        });

        if (contact && registration?.userId) {
            await prisma.user.update({
                where: { id: registration.userId },
                data: { phone: contact }
            });
        }

        await createAuditLog({
            action: 'UPDATE_REGISTRATION',
            entityType: 'REGISTRATION',
            entityId: id,
            performedBy: admin.id,
            metadata: { ...data }
        });

        return { success: true };
    }, 'updateRegistration');
}

/**
 * Create a manual registration
 */
export async function createRegistration(data: RegistrationCreateInput): Promise<RegistrationActionResponse> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { error: 'Unauthorized' };

    return executeAction(async () => {
        const { studentName, studentId, eventId, amount, paymentStatus = 'PAID' } = data;

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                creator: { select: { id: true, branch: true, clubId: true, role: true } },
                assignedCoordinators: { select: { id: true } }
            }
        });

        if (!event) return { error: 'Event not found' };

        const user = session.user as AuthUser;
        let isAuthorized = false;

        if (user.role === 'SUPER_ADMIN' || event.creatorId === user.id) isAuthorized = true;
        else if (user.role === 'HHO' && event.creator?.role === 'HHO') isAuthorized = true;
        else if ((user.role === 'SPORTS_ADMIN' || user.role === 'BRANCH_SPORTS_ADMIN') && event.creator?.role === 'SPORTS_ADMIN') isAuthorized = true;
        else if (user.role === 'BRANCH_ADMIN' && event.creator?.branch === user.branch) isAuthorized = true;
        else if (user.role === 'CLUB_COORDINATOR' && event.creator?.clubId === user.clubId) isAuthorized = true;
        else if (user.role === 'EVENT_COORDINATOR' && event.assignedCoordinators?.some(c => c.id === user.id)) isAuthorized = true;

        if (!isAuthorized) {
            return { error: 'Unauthorized. You do not have permission to register students for this event.' };
        }

        const activeCount = await prisma.registration.count({
            where: {
                eventId,
                status: { in: ['CONFIRMED', 'ATTENDED', 'PENDING'] }
            }
        });

        const registrationStatus = activeCount >= (event.maxCapacity || 100)
            ? RegistrationStatus.WAITLISTED
            : RegistrationStatus.CONFIRMED;

        await prisma.registration.create({
            data: {
                eventId,
                studentName,
                studentId,
                status: registrationStatus,
                paymentStatus: (registrationStatus === RegistrationStatus.WAITLISTED) ? 'PENDING' : (paymentStatus as PaymentStatus),
                amount: parseFloat(String(amount)) || 0,
            }
        });

        await createAuditLog({
            action: 'CREATE_REGISTRATION_MANUAL',
            entityType: 'REGISTRATION',
            entityId: studentId,
            performedBy: session.user.id,
            metadata: { studentName, eventId, amount }
        });

        return { success: true };
    }, 'createRegistration');
}

/**
 * Update registration status (e.g. CONFIRMED, CANCELLED, REJECTED)
 */
export async function updateRegistrationStatus(id: string, status: string, extraData: Record<string, unknown> = {}): Promise<RegistrationActionResponse> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { error: 'Unauthorized' };

    return executeAction(async () => {
        const registration = await prisma.registration.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        email: true,
                        name: true
                    }
                },
                event: {
                    include: {
                        creator: { select: { id: true, branch: true, clubId: true, role: true } },
                        assignedCoordinators: { select: { id: true } }
                    }
                },
                team: {
                    select: { id: true, isLocked: true }
                }
            }
        });

        if (!registration) return { error: 'Registration not found' };

        const event = registration.event;
        const user = session.user;
        let isAuthorized = false;

        if (user.role === 'SUPER_ADMIN' || event.creatorId === user.id) isAuthorized = true;
        else if (user.role === 'HHO' && event.creator?.role === 'HHO') isAuthorized = true;
        else if ((user.role === 'SPORTS_ADMIN' || user.role === 'BRANCH_SPORTS_ADMIN') && event.creator?.role === 'SPORTS_ADMIN') isAuthorized = true;
        else if (user.role === 'BRANCH_ADMIN' && event.creator?.branch === user.branch) isAuthorized = true;
        else if (user.role === 'CLUB_COORDINATOR' && event.creator?.clubId === user.clubId) isAuthorized = true;
        else if (user.role === 'EVENT_COORDINATOR' && event.assignedCoordinators?.some(c => c.id === user.id)) isAuthorized = true;

        if (!isAuthorized) {
            return { error: 'Unauthorized. You (Role: ' + user.role + ') can only update registrations for your assigned events.' };
        }

        if (status === 'CONFIRMED' && registration.status === 'WAITLISTED') {
            const confirmedCount = await prisma.registration.count({
                where: {
                    eventId: registration.eventId,
                    status: { in: [RegistrationStatus.CONFIRMED, RegistrationStatus.ATTENDED] }
                }
            });

            if (confirmedCount >= (event.maxCapacity || 100)) {
                return { error: 'Please increase the capacity to approve' };
            }
        }

        const updateData: { status: RegistrationStatus; paymentStatus?: PaymentStatus } = {
            status: status as RegistrationStatus
        };

        if (extraData.paymentStatus) {
            updateData.paymentStatus = extraData.paymentStatus as PaymentStatus;
        }

        await prisma.registration.update({
            where: { id },
            data: updateData
        });

        if (registration.team) {
            await prisma.team.update({
                where: { id: registration.team.id },
                data: {
                    status: updateData.status,
                    isLocked: updateData.status === 'CONFIRMED' || updateData.status === 'ATTENDED' || registration.team.isLocked
                }
            });
            await import('@/lib/revalidation').then(m => m.revalidateTeams());
        }

        const previousStatus = registration.status;
        const eventDate = registration.event?.date ? new Date(registration.event.date) : null;
        const now = new Date();
        const eventEnded = Boolean(eventDate && eventDate <= now);
        const recipientEmail = registration.email || registration.user?.email || null;
        const studentName = registration.studentName || registration.user?.name || 'Participant';
        const eventTitle = registration.event?.title || 'Event';

        if (recipientEmail) {
            const shouldSendImmediateReject = status === 'REJECTED' && previousStatus !== 'WAITLISTED';
            const shouldSendWaitlistRejectAfterDeadline = status === 'REJECTED' && previousStatus === 'WAITLISTED' && eventEnded;
            const shouldSendConfirmAfterDeadline = status === 'CONFIRMED' && eventEnded;

            if (shouldSendImmediateReject || shouldSendWaitlistRejectAfterDeadline || shouldSendConfirmAfterDeadline) {
                const rejectionReason = typeof extraData.rejectionReason === 'string' ? extraData.rejectionReason : undefined;
                const emailSubject = status === 'CONFIRMED'
                    ? `Registration Confirmed: ${eventTitle}`
                    : `Registration Rejected: ${eventTitle}`;

                await sendEmail({
                    to: recipientEmail,
                    subject: emailSubject,
                    html: buildRegistrationEmailHtml({
                        studentName,
                        eventTitle,
                        status,
                        ...(rejectionReason ? { reason: rejectionReason } : {})
                    })
                });
            }
        }

        await createAuditLog({
            action: 'UPDATE_REGISTRATION_STATUS',
            entityType: 'REGISTRATION',
            entityId: id,
            performedBy: session.user.id,
            metadata: { status, ...extraData }
        });

        await revalidateRegistrations(registration.eventId);

        return { success: true };
    }, 'updateRegistrationStatus');
}

/**
 * Release seats from waitlist
 */
export async function releaseWaitlistSeats(eventId: string, count: number): Promise<RegistrationActionResponse> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { error: 'Unauthorized' };

    return executeAction(async () => {
        if (!eventId) return { error: 'Event ID is required' };
        if (!count || count < 1) return { error: 'Invalid count' };

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                creator: { select: { id: true, branch: true, clubId: true, role: true } }
            }
        });

        if (!event) return { error: 'Event not found' };

        const user = session.user;
        let isAuthorized = false;

        if (user.role === 'SUPER_ADMIN' || event.creatorId === user.id) isAuthorized = true;
        else if (user.role === 'HHO' && event.creator?.role === 'HHO') isAuthorized = true;
        else if ((user.role === 'SPORTS_ADMIN' || user.role === 'BRANCH_SPORTS_ADMIN') && event.creator?.role === 'SPORTS_ADMIN') isAuthorized = true;
        else if (user.role === 'BRANCH_ADMIN' && event.creator?.branch === user.branch) isAuthorized = true;
        else if (user.role === 'CLUB_COORDINATOR' && event.creator?.clubId === user.clubId) isAuthorized = true;

        if (!isAuthorized) {
            return { error: 'Unauthorized. You do not have permission to release seats for this event.' };
        }

        const waitlisted = await prisma.registration.findMany({
            where: { eventId, status: 'WAITLISTED' },
            orderBy: { createdAt: 'asc' },
            take: count,
            select: { id: true }
        });

        if (waitlisted.length === 0) {
            return { success: true, count: 0, message: 'No students currently on the waitlist for this event.' };
        }

        const idsToUpdate = waitlisted.map((r: { id: string }) => r.id);

        await prisma.registration.updateMany({
            where: { id: { in: idsToUpdate } },
            data: { status: 'CONFIRMED' }
        });

        await createAuditLog({
            action: 'RELEASE_WAITLIST_SEATS',
            entityType: 'EVENT',
            entityId: eventId,
            performedBy: session.user.id,
            metadata: { count: idsToUpdate.length, studentIds: idsToUpdate }
        });

        await revalidateRegistrations(eventId);

        return { success: true, count: idsToUpdate.length };
    }, 'releaseWaitlistSeats');
}

/**
 * Bulk import registrations from parsed data
 */
export async function bulkImportRegistrations(registrationsData: ImportRow[], filename = 'spreadsheet.csv'): Promise<RegistrationActionResponse> {
    const session = await getServerSession(authOptions);
    if (!session) return { error: 'Unauthorized' };

    return executeAction(async () => {
        const admin = await prisma.admin.findUnique({
            where: { email: session.user.email! },
            select: { id: true }
        });

        if (!admin) return { error: 'Admin not found' };

        const eventMap = new Map<string, string>();
        const allEvents = await prisma.event.findMany({
            select: { id: true, title: true }
        });
        allEvents.forEach(e => eventMap.set(e.title.toLowerCase().trim(), e.id));

        const emailsToFetch = new Set<string>();
        const rollNumbersToFetch = new Set<string>();
        const eventIdsInvolved = new Set<string>();
        const validRows: Array<{
            rowNumber: number;
            eventId: string;
            eventName: string;
            rollNumber: string;
            email?: string | null | undefined;
            studentName: string;
            status: RegistrationStatus;
            amount: number;
        }> = [];

        const errors: string[] = [];
        let successfulCount = 0;
        let failedCount = 0;

        registrationsData.forEach((row: any, index: any) => {
            const rowNumber = index + 1;
            if (!Object.values(row).some(v => v && v.toString().trim())) return;

            const eventName = row['Event Name'] || row['Event'];
            const rollNumber = row['Roll Number'] || row['Student ID'] || row['Roll No'];
            const email = row['Email']?.trim();

            if (!eventName || eventName === 'undefined') {
                failedCount++;
                errors.push(`Row ${rowNumber}: Event name is missing`);
                return;
            }

            const eventId = eventMap.get(eventName.toLowerCase().trim());
            if (!eventId) {
                failedCount++;
                errors.push(`Row ${rowNumber}: Event "${eventName}" not found`);
                return;
            }

            if (!rollNumber) {
                failedCount++;
                errors.push(`Row ${rowNumber}: Student ID is missing`);
                return;
            }

            if (email) emailsToFetch.add(email);
            rollNumbersToFetch.add(rollNumber);
            eventIdsInvolved.add(eventId);

            validRows.push({
                rowNumber,
                eventId,
                eventName,
                rollNumber,
                email,
                studentName: String(row['Student Name'] || 'Unknown Student'),
                status: (String(row['Status'] || '').toUpperCase() || RegistrationStatus.CONFIRMED) as RegistrationStatus,
                amount: row['Amount'] ? parseFloat(String(row['Amount'])) : 0,
            });
        });

        const userMap = new Map<string, string>();
        if (emailsToFetch.size > 0) {
            const users = await prisma.user.findMany({
                where: { email: { in: Array.from(emailsToFetch) } },
                select: { id: true, email: true }
            });
            users.forEach((u: { id: string; email: string }) => userMap.set(u.email, u.id));
        }

        const existingRegMap = new Set<string>();
        if (eventIdsInvolved.size > 0 && rollNumbersToFetch.size > 0) {
            const existing = await prisma.registration.findMany({
                where: {
                    eventId: { in: Array.from(eventIdsInvolved) },
                    studentId: { in: Array.from(rollNumbersToFetch) }
                },
                select: { eventId: true, studentId: true }
            });
            existing.forEach((r: { eventId: string; studentId: string | null }) => existingRegMap.add(`${r.eventId}:${r.studentId}`));
        }

        const toInsert: Prisma.RegistrationCreateManyInput[] = [];

        for (const item of validRows) {
            if (existingRegMap.has(`${item.eventId}:${item.rollNumber}`)) {
                failedCount++;
                errors.push(`Row ${item.rowNumber}: Student ${item.rollNumber} is already registered for "${item.eventName}"`);
                continue;
            }

            toInsert.push({
                eventId: item.eventId,
                userId: item.email ? userMap.get(item.email) || null : null,
                studentName: item.studentName,
                studentId: item.rollNumber,
                status: item.status,
                paymentStatus: 'PAID',
                amount: item.amount,
                createdAt: new Date(),
            });
        }

        if (toInsert.length > 0) {
            const batchResult = await prisma.registration.createMany({
                data: toInsert,
                skipDuplicates: true
            });
            successfulCount += batchResult.count;
        }

        await createAuditLog({
            action: 'BULK_IMPORT_REGISTRATIONS',
            entityType: 'REGISTRATION',
            entityId: 'bulk',
            performedBy: admin.id,
            metadata: {
                successful: successfulCount,
                failed: failedCount,
                total: registrationsData.length,
                filename: filename
            }
        });

        await revalidateRegistrations();

        return {
            success: true,
            successful: successfulCount,
            failed: failedCount,
            errors: errors
        };
    }, 'bulkImportRegistrations');
}

/**
 * Log export activity to AuditLog
 */
export async function logExportAction(metadata: Record<string, unknown>): Promise<RegistrationActionResponse> {
    const session = await getServerSession(authOptions);
    if (!session) return { error: 'Unauthorized' };

    return executeAction(async () => {
        const admin = await prisma.admin.findUnique({
            where: { email: session.user.email! },
            select: { id: true }
        });

        if (!admin) return { error: 'Admin not found' };

        await createAuditLog({
            action: 'EXPORT_REGISTRATIONS',
            entityType: 'REGISTRATION',
            entityId: 'multiple',
            performedBy: admin.id,
            metadata: metadata
        });

        return { success: true };
    }, 'logExportAction');
}

