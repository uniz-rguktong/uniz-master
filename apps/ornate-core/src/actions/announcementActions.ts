'use server'

import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { revalidateAnnouncements } from '@/lib/revalidation'
import { executeAction } from '@/lib/api-utils'
import { getCategoryColor } from '@/lib/constants'
import { sendEmail, getAnnouncementEmailTemplate } from '@/lib/email'
import { Prisma } from '@/lib/generated/client'
import type { ScopeUser } from '@/lib/auth-helpers'
import logger from '@/lib/logger'

interface CreateAnnouncementData {
    title: string;
    content: string;
    category: string;
    targetAudience: string;
    expiryDate: string;
    isPinned?: boolean;
    notify?: boolean;
}

interface UpdateAnnouncementData {
    title?: string;
    content?: string;
    category?: string;
    targetAudience?: string;
    expiryDate?: string;
}

interface AnnouncementRecipient {
    id: string;
    email: string | null;
    name: string | null;
    role?: string | null;
}

const BRANCH_CODES = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL'] as const;

function normalizeAudienceTokens(targetAudience: string): string[] {
    return targetAudience
        .split(',')
        .map((token) => token.trim())
        .filter(Boolean);
}

function hasAudienceToken(tokens: string[], value: string): boolean {
    return tokens.some((token) => token.toLowerCase() === value.toLowerCase());
}

async function resolveAnnouncementRecipients(targetAudience: string): Promise<AnnouncementRecipient[]> {
    const tokens = normalizeAudienceTokens(targetAudience);
    const includesEveryone =
        hasAudienceToken(tokens, 'Global (All Users)') ||
        hasAudienceToken(tokens, 'Everyone');

    if (includesEveryone) {
        const [allStudents, allAdmins] = await Promise.all([
            prisma.user.findMany({
                where: { role: 'STUDENT' },
                select: { id: true, email: true, name: true, role: true },
            }),
            prisma.admin.findMany({
                select: { id: true, email: true, name: true, role: true },
            }),
        ]);

        return [...allStudents, ...allAdmins];
    }

    const recipientsById = new Map<string, AnnouncementRecipient>();

    const addUsers = (users: AnnouncementRecipient[]) => {
        for (const user of users) {
            recipientsById.set(user.id, user);
        }
    };

    const addAdminRoles = async (roles: Array<'BRANCH_ADMIN' | 'CLUB_COORDINATOR' | 'HHO' | 'SPORTS_ADMIN' | 'BRANCH_SPORTS_ADMIN'>) => {
        const admins = await prisma.admin.findMany({
            where: { role: { in: roles } },
            select: { id: true, email: true, name: true, role: true },
        });
        addUsers(admins);
    };

    if (hasAudienceToken(tokens, 'All Students')) {
        const users = await prisma.user.findMany({
            where: { role: 'STUDENT' },
            select: { id: true, email: true, name: true, role: true },
        });
        addUsers(users);
    }

    const yearTokens = ['I Year', 'II Year', 'III Year', 'IV Year'];
    const selectedYears = yearTokens.filter((year) => hasAudienceToken(tokens, year));
    if (selectedYears.length > 0) {
        const users = await prisma.user.findMany({
            where: { role: 'STUDENT', currentYear: { in: selectedYears } },
            select: { id: true, email: true, name: true, role: true },
        });
        addUsers(users);
    }

    if (hasAudienceToken(tokens, 'Registered Participants') || hasAudienceToken(tokens, 'Registered Students')) {
        const users = await prisma.user.findMany({
            where: { registrations: { some: { status: 'CONFIRMED' } } },
            select: { id: true, email: true, name: true, role: true },
        });
        addUsers(users);
    }

    if (hasAudienceToken(tokens, 'Paid Event Registrants')) {
        const users = await prisma.user.findMany({
            where: { registrations: { some: { status: 'CONFIRMED', event: { price: { gt: 0 } } } } },
            select: { id: true, email: true, name: true, role: true },
        });
        addUsers(users);
    }

    if (hasAudienceToken(tokens, 'Workshop Participants')) {
        const users = await prisma.user.findMany({
            where: { registrations: { some: { status: 'CONFIRMED', event: { eventType: 'Workshop' } } } },
            select: { id: true, email: true, name: true, role: true },
        });
        addUsers(users);
    }

    if (hasAudienceToken(tokens, 'Branch Admins')) {
        await addAdminRoles(['BRANCH_ADMIN']);
    }

    if (hasAudienceToken(tokens, 'Club Admins')) {
        await addAdminRoles(['CLUB_COORDINATOR']);
    }

    if (hasAudienceToken(tokens, 'HHO')) {
        await addAdminRoles(['HHO']);
    }

    if (hasAudienceToken(tokens, 'Sports')) {
        await addAdminRoles(['SPORTS_ADMIN', 'BRANCH_SPORTS_ADMIN']);
    }

    const selectedBranchCodes = BRANCH_CODES.filter((branchCode) =>
        hasAudienceToken(tokens, `${branchCode} Admin`),
    );

    if (selectedBranchCodes.length > 0) {
        const admins = await prisma.admin.findMany({
            where: {
                role: 'BRANCH_ADMIN',
                branch: { in: selectedBranchCodes },
            },
            select: { id: true, email: true, name: true, role: true },
        });
        addUsers(admins);
    }

    if (recipientsById.size === 0) {
        // Safe fallback: preserve previous behavior for any exact payloads
        // not represented above by trying the legacy branches one by one.
        if (targetAudience === 'Global (All Users)') {
            const [allStudents, allAdmins] = await Promise.all([
                prisma.user.findMany({
                    where: { role: 'STUDENT' },
                    select: { id: true, email: true, name: true, role: true },
                }),
                prisma.admin.findMany({
                    select: { id: true, email: true, name: true, role: true },
                }),
            ]);
            addUsers([...allStudents, ...allAdmins]);
        }
    }

    return Array.from(recipientsById.values());
}

export interface AnnouncementActionResponse<T = unknown> {
    success: boolean;
    error?: string;
    data?: T;
}

export interface FormattedAnnouncement {
    id: string;
    title: string;
    content: string;
    category: string;
    targetAudience: string;
    isPinned: boolean;
    status: string;
    viewCount: number;
    createdBy: string;
    createdDate: string;
    expiryDate: string;
    categoryColor: string;
}

function buildAnnouncementScope(user: ScopeUser): Prisma.AnnouncementWhereInput {
    // Return empty where clause so that all announcements/updates 
    // are visible to all admins across the platform as requested.
    return {};
}

function getAnnouncementPushUrl(role?: string | null): string {
    switch (role) {
        case 'SUPER_ADMIN':
            return '/super-admin/announcements/create';
        case 'BRANCH_ADMIN':
            return '/branch-admin/content/announcements';
        case 'CLUB_COORDINATOR':
            return '/clubs-portal/content/announcements';
        case 'SPORTS_ADMIN':
        case 'BRANCH_SPORTS_ADMIN':
            return '/sports/all-updates';
        case 'HHO':
            return '/hho/updates';
        case 'EVENT_COORDINATOR':
            return '/coordinator';
        default:
            return '/';
    }
}

export async function createAnnouncement(data: CreateAnnouncementData): Promise<AnnouncementActionResponse<FormattedAnnouncement>> {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) return { success: false, error: 'Unauthorized' }

    return executeAction(async () => {
        const admin = await prisma.admin.findUnique({
            where: { email: session.user.email! },
            select: { id: true, role: true, name: true, branch: true, clubId: true }
        })

        if (!admin) return { success: false, error: 'Admin not found' }

        const { title, content, category, targetAudience, expiryDate, isPinned, notify } = data
        const expiry = new Date(expiryDate)

        if (admin.role === 'BRANCH_ADMIN') {
            const now = new Date();
            const expiryDateOnly = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate()).getTime();
            const createdDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            if (!(expiryDateOnly > createdDateOnly)) {
                return { success: false, error: 'Expiry date must be greater than creation date' }
            }
        }

        const announcement = await prisma.announcement.create({
            data: {
                title,
                content,
                category,
                targetAudience,
                expiryDate: expiry,
                isPinned: isPinned || false,
                creatorId: admin.id,
                status: 'active'
            },
            include: {
                creator: {
                    select: { name: true, branch: true, role: true }
                }
            }
        })

        const resolvedRecipients = await resolveAnnouncementRecipients(targetAudience)
        const recipients = resolvedRecipients.filter((recipient) => !!recipient.email)

        if (recipients.length > 0) {
            if (notify) {
                const emailHtml = getAnnouncementEmailTemplate(title, content, category, admin.name || 'Admin')
                await Promise.allSettled(recipients.map(r =>
                    sendEmail({
                        to: r.email!,
                        subject: `New Announcement: ${title}`,
                        html: emailHtml
                    })
                ))
            }

            try {
                const { sendWebPushNow } = await import('@/lib/notifications/notification-worker');
                const compactBody = content.length > 160 ? `${content.slice(0, 157)}...` : content;
                const recipientEmails = recipients
                    .map((recipient) => recipient.email?.trim().toLowerCase())
                    .filter((email): email is string => !!email);

                const uniqueEmails = Array.from(new Set(recipientEmails));
                const subscribedRows = await prisma.pushSubscription.findMany({
                    where: { username: { in: uniqueEmails } },
                    select: { username: true },
                });

                const subscribedUsers = new Set(subscribedRows.map((row) => row.username.trim().toLowerCase()));
                const pushTargets = recipients.filter((recipient) => {
                    const email = recipient.email?.trim().toLowerCase();
                    return !!email && subscribedUsers.has(email);
                });

                if (pushTargets.length === 0) {
                    logger.warn(
                        {
                            announcementId: announcement.id,
                            targetAudience,
                            totalRecipients: recipients.length,
                            subscribedRecipients: 0,
                        },
                        'Announcement push skipped: no subscribed recipients found',
                    );
                }

                const enqueueResults = await Promise.allSettled(
                    pushTargets.map((recipient) =>
                        sendWebPushNow(recipient.email!, {
                            title: `New Announcement: ${title}`,
                            body: compactBody,
                            url: getAnnouncementPushUrl(recipient.role),
                            tag: 'announcement-update',
                            data: {
                                type: 'announcement',
                                announcementId: announcement.id,
                                category,
                            },
                            requireInteraction: true,
                        }),
                    ),
                );

                const enqueueFailures = enqueueResults.filter((result) => result.status === 'rejected');
                if (enqueueFailures.length > 0) {
                    logger.warn(
                        {
                            announcementId: announcement.id,
                            totalTargets: pushTargets.length,
                            failedTargets: enqueueFailures.length,
                        },
                        'Announcement push delivery partially failed',
                    );
                }

                logger.info(
                    {
                        announcementId: announcement.id,
                        targetAudience,
                        totalRecipients: recipients.length,
                        subscribedRecipients: pushTargets.length,
                    },
                    'Announcement push delivery attempt completed',
                );
            } catch (error) {
                // Keep announcement creation successful even if push delivery fails.
                logger.error({ err: error, announcementId: announcement.id }, 'Announcement push delivery failed');
            }
        }

        await revalidateAnnouncements()

        return {
            success: true,
            data: {
                id: announcement.id,
                title: announcement.title,
                content: announcement.content,
                category: announcement.category,
                targetAudience: announcement.targetAudience,
                isPinned: announcement.isPinned,
                status: announcement.status,
                viewCount: announcement.viewCount || 0,
                createdBy: (announcement.creator?.role === 'SPORTS_ADMIN' || announcement.creator?.role === 'BRANCH_SPORTS_ADMIN') ? 'Sports Admin' : `${admin.branch ? admin.branch.toUpperCase() + ' ' : ''}Admin`,
                createdDate: announcement.createdAt.toISOString(),
                expiryDate: announcement.expiryDate.toISOString(),
                categoryColor: getCategoryColor(announcement.category)
            }
        }
    }, 'createAnnouncement');
}

export async function getAnnouncements(): Promise<AnnouncementActionResponse<FormattedAnnouncement[]>> {
    const session = await getServerSession(authOptions)
    if (!session) return { success: false, error: 'Unauthorized' }

    return executeAction(async () => {
        const scope = buildAnnouncementScope(session.user as ScopeUser);

        const announcements = await prisma.announcement.findMany({
            where: scope,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                content: true,
                category: true,
                targetAudience: true,
                isPinned: true,
                status: true,
                viewCount: true,
                createdAt: true,
                expiryDate: true,
                creator: {
                    select: { name: true, branch: true, role: true }
                }
            }
        })

        const formatted: FormattedAnnouncement[] = announcements.map(a => ({
            id: a.id,
            title: a.title,
            content: a.content,
            category: a.category,
            targetAudience: a.targetAudience,
            isPinned: a.isPinned,
            status: a.status,
            viewCount: a.viewCount || 0,
            createdBy: (a.creator?.role === 'SPORTS_ADMIN' || a.creator?.role === 'BRANCH_SPORTS_ADMIN') ? 'Sports Admin' : `${a.creator?.branch ? a.creator.branch.toUpperCase() + ' ' : ''}Admin`,
            createdDate: a.createdAt.toISOString(),
            expiryDate: a.expiryDate.toISOString(),
            categoryColor: getCategoryColor(a.category)
        }))

        return { success: true, data: formatted }
    }, 'getAnnouncements');
}

export async function updateAnnouncement(id: string, data: UpdateAnnouncementData): Promise<AnnouncementActionResponse<FormattedAnnouncement>> {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) return { success: false, error: 'Unauthorized' }

    return executeAction(async () => {
        const admin = await prisma.admin.findUnique({
            where: { email: session.user.email! },
            select: { id: true, role: true, name: true, branch: true, clubId: true }
        })

        if (!admin) return { success: false, error: 'Admin not found' }

        const announcementCheck = await prisma.announcement.findUnique({
            where: { id },
            select: { creatorId: true, createdAt: true }
        })

        if (!announcementCheck) return { success: false, error: 'Announcement not found' }

        const isAuthorized = admin.role === 'SUPER_ADMIN' || announcementCheck.creatorId === admin.id;
        if (!isAuthorized) return { success: false, error: 'Unauthorized' }

        const { title, content, category, targetAudience, expiryDate } = data

        const updateData: Record<string, unknown> = {};
        if (title !== undefined) updateData.title = title;
        if (content !== undefined) updateData.content = content;
        if (category !== undefined) updateData.category = category;
        if (targetAudience !== undefined) updateData.targetAudience = targetAudience;
        if (expiryDate !== undefined) {
            const parsedExpiry = new Date(expiryDate);
            if (admin.role === 'BRANCH_ADMIN') {
                const expiryDateOnly = new Date(parsedExpiry.getFullYear(), parsedExpiry.getMonth(), parsedExpiry.getDate()).getTime();
                const createdDateOnly = new Date(announcementCheck.createdAt.getFullYear(), announcementCheck.createdAt.getMonth(), announcementCheck.createdAt.getDate()).getTime();
                if (!(expiryDateOnly > createdDateOnly)) {
                    return { success: false, error: 'Expiry date must be greater than creation date' }
                }
            }
            updateData.expiryDate = parsedExpiry;
        }

        const updated = await prisma.announcement.update({
            where: { id },
            data: updateData as Prisma.AnnouncementUpdateInput,
            include: {
                creator: { select: { branch: true, role: true } }
            }
        })

        await revalidateAnnouncements()

        return {
            success: true,
            data: {
                id: updated.id,
                title: updated.title,
                content: updated.content,
                category: updated.category,
                targetAudience: updated.targetAudience,
                isPinned: updated.isPinned,
                status: updated.status,
                viewCount: updated.viewCount || 0,
                createdBy: (updated.creator?.role === 'SPORTS_ADMIN' || updated.creator?.role === 'BRANCH_SPORTS_ADMIN') ? 'Sports Admin' : `${updated.creator?.branch ? updated.creator.branch.toUpperCase() + ' ' : ''}Admin`,
                createdDate: updated.createdAt.toISOString(),
                expiryDate: updated.expiryDate.toISOString(),
                categoryColor: getCategoryColor(updated.category)
            }
        }
    }, 'updateAnnouncement');
}

export async function deleteAnnouncement(id: string): Promise<AnnouncementActionResponse> {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) return { success: false, error: 'Unauthorized' }

    return executeAction(async () => {
        const admin = await prisma.admin.findUnique({
            where: { email: session.user.email! },
            select: { id: true, role: true, name: true, branch: true, clubId: true }
        })

        if (!admin) return { success: false, error: 'Admin not found' }

        const announcement = await prisma.announcement.findUnique({
            where: { id },
            select: { creatorId: true }
        })

        if (!announcement) return { success: false, error: 'Announcement not found' }

        if (announcement.creatorId !== admin.id && admin.role !== 'SUPER_ADMIN') {
            return { success: false, error: 'You do not have permission to delete this announcement' }
        }

        await prisma.announcement.delete({ where: { id } })
        await revalidateAnnouncements()
        return { success: true }
    }, 'deleteAnnouncement');
}

export async function incrementViewCount(id: string): Promise<AnnouncementActionResponse> {
    return executeAction(async () => {
        await prisma.announcement.update({
            where: { id },
            data: { viewCount: { increment: 1 } }
        })
        return { success: true }
    }, 'incrementViewCount');
}
