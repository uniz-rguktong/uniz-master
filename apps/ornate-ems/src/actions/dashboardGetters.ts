'use server'

import prisma from '@/lib/prisma'
import { Prisma } from '@/lib/generated/client'
import { unstable_cache } from 'next/cache';
import { getCategoryColor, mapRegistrationStatus } from '@/lib/constants'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import type { AuthUser } from '@/lib/auth-helpers'
import { executeAction } from '@/lib/api-utils';

// --- Types ---

interface DashboardStats {
    eventCount: number;
    registrationCount: number;
    activeParticipants: number;
    pendingCount: number;
    waitlistCount: number;
    completionRate: number;
    totalRevenue: number;
    trends: {
        events: {
            value: string;
            isPositive: boolean;
            comparisonText: string;
        };
        registrations: {
            value: string;
            isPositive: boolean;
            comparisonText: string;
        };
    };
}

interface SalesTrendItem {
    label: string;
    registered: number;
    attended: number;
}

interface RevenueBreakdownItem {
    category: string;
    value: number;
    color: string;
}

interface RecentTransaction {
    id: string;
    eventId: string;
    studentName: string;
    eventName: string;
    status: string;
    registrationDate: string;
    contact: string;
    paymentAmount: string;
}

interface EventAnalytics {
    id: string;
    name: string;
    category: string;
    categoryColor: string;
    onlineRegistrations: number;
    offlineRegistrations: number;
    capacity: number;
    attendance: number;
    revenue: number;
    date: string;
}

interface HHOEvent {
    id: string;
    title: string;
    date: string;
    venue: string;
    registrations: number;
    cap: number;
    type: string;
    fee: string | null;
}

// --- HELPER: Scope ---
function buildEventScope(user: AuthUser): Prisma.EventWhereInput {
    if (user.role === 'SUPER_ADMIN') return {};
    if (user.role === 'HHO') return { creator: { role: 'HHO' } };
    if (user.role === 'SPORTS_ADMIN' || user.role === 'BRANCH_SPORTS_ADMIN') return { category: 'Sports' };
    if (user.role === 'CLUB_COORDINATOR') return { creator: { clubId: user.clubId ?? null } };
    return {
        OR: [
            { creatorId: user.id },
            { creator: { branch: user.branch ?? null } }
        ]
    };
}

/**
 * Common scoping logic for database queries
 */
async function getScopedEventIds(
    userId: string,
    role: string,
    clubId: string | null,
    branch: string | null
): Promise<string[]> {
    let eventScope: Prisma.EventWhereInput = {};
    if (role === 'SUPER_ADMIN') {
        eventScope = {};
    } else if (role === 'HHO') {
        eventScope = { creator: { role: 'HHO' } };
    } else if (role === 'SPORTS_ADMIN' || role === 'BRANCH_SPORTS_ADMIN') {
        eventScope = { category: 'Sports' };
    } else if (role === 'CLUB_COORDINATOR' && clubId) {
        eventScope = { creator: { clubId: clubId } };
    } else {
        eventScope = {
            OR: [
                { creatorId: userId },
                { creator: { branch: branch ?? null } }
            ]
        };
    }

    const events = await prisma.event.findMany({
        where: eventScope,
        select: { id: true }
    });

    return events.map(e => e.id);
}

// --- IMPLEMENTATION WRAPPERS (to handle caching with scoping correctly) ---

/**
 * Fetches dashboard statistics scoped to the user
 */
export async function getDashboardStats() {
    return executeAction(async () => {
        const user = await getAuthenticatedUser();
        if (!user) throw new Error('Unauthorized');

        const { id: adminId, role, branch, clubId } = user;

        // Cache per user scope
        const result = await unstable_cache(
            async () => {
                let eventScope: Prisma.EventWhereInput = buildEventScope(user);

                const now = new Date();
                const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);

                const [
                    eventCount,
                    activeEventCount,
                    registrationCount,
                    attendedCount,
                    pendingCount,
                    waitlistCount,
                    revenueResult,
                    prevMonthEventCount,
                    prevMonthRegistrationCount
                ] = await prisma.$transaction([
                    prisma.event.count({ where: eventScope }),
                    prisma.event.count({
                        where: {
                            ...eventScope,
                            date: { gte: now }
                        }
                    }),
                    prisma.registration.count({
                        where: {
                            event: eventScope,
                            status: { notIn: ['CANCELLED', 'REJECTED'] }
                        }
                    }),
                    prisma.registration.count({
                        where: {
                            event: eventScope,
                            status: 'ATTENDED'
                        }
                    }),
                    prisma.registration.count({
                        where: {
                            event: eventScope,
                            status: 'PENDING'
                        }
                    }),
                    prisma.registration.count({
                        where: {
                            event: eventScope,
                            status: 'WAITLISTED'
                        }
                    }),
                    prisma.registration.aggregate({
                        where: {
                            event: eventScope,
                            paymentStatus: 'PAID'
                        },
                        _sum: {
                            amount: true
                        }
                    }),
                    prisma.event.count({
                        where: {
                            ...eventScope,
                            createdAt: {
                                gte: startOfPrevMonth,
                                lte: endOfPrevMonth
                            }
                        }
                    }),
                    prisma.registration.count({
                        where: {
                            event: eventScope,
                            status: { notIn: ['CANCELLED', 'REJECTED'] },
                            createdAt: {
                                gte: startOfPrevMonth,
                                lte: endOfPrevMonth
                            }
                        }
                    })
                ]);

                return {
                    eventCount,
                    activeEventCount,
                    registrationCount,
                    attendedCount,
                    pendingCount,
                    waitlistCount,
                    totalRevenue: revenueResult._sum.amount || 0,
                    prevMonthEventCount,
                    prevMonthRegistrationCount
                };
            },
            ['dashboard-stats-v3', adminId, role, clubId || 'no-club', branch || 'no-branch'],
            { tags: ['dashboard-stats'], revalidate: 60 }
        )();

        const completionRate = result.registrationCount > 0
            ? Math.round((result.attendedCount / result.registrationCount) * 100)
            : 0;

        const eventTrend = result.eventCount - result.prevMonthEventCount;
        const regTrendPercent = result.prevMonthRegistrationCount > 0
            ? Math.round(((result.registrationCount - result.prevMonthRegistrationCount) / result.prevMonthRegistrationCount) * 100)
            : 0;

        return {
            success: true,
            stats: {
                ...result,
                activeParticipants: result.attendedCount,
                completionRate,
                trends: {
                    events: {
                        value: (eventTrend >= 0 ? "+" : "") + eventTrend,
                        isPositive: eventTrend >= 0,
                        comparisonText: "vs last month"
                    },
                    registrations: {
                        value: (regTrendPercent >= 0 ? "+" : "") + regTrendPercent + "%",
                        isPositive: regTrendPercent >= 0,
                        comparisonText: "vs last month"
                    }
                }
            }
        };
    }, 'getDashboardStats');
}

export async function getSalesTrendData() {
    return executeAction(async () => {
        const user = await getAuthenticatedUser();
        if (!user) throw new Error('Unauthorized');

        const { id: userId, role, branch, clubId } = user;

        return await unstable_cache(
            async () => {
                const eventIds = await getScopedEventIds(userId, role, clubId ?? null, branch ?? null);
                if (eventIds.length === 0) return { Weekly: [], Monthly: [], Yearly: [] };

                const [weeklyRaw, monthlyRaw, yearlyRaw] = await Promise.all([
                    prisma.$queryRaw<SalesTrendItem[]>`
                        WITH weeks AS (
                            SELECT generate_series(
                                date_trunc('week', NOW()) - interval '3 weeks',
                                date_trunc('week', NOW()),
                                '1 week'::interval
                            ) as week_start
                        )
                        SELECT
                            'Week ' || EXTRACT(WEEK FROM w.week_start)::text as label,
                            COUNT(r.id)::int as registered,
                            COUNT(r.id) FILTER (WHERE r.status IN ('ATTENDED', 'CONFIRMED'))::int as attended
                        FROM weeks w
                        LEFT JOIN "Registration" r ON date_trunc('week', r."createdAt") = w.week_start
                        AND r."eventId" = ANY(${eventIds})
                        GROUP BY w.week_start
                        ORDER BY w.week_start;
                    `,
                    prisma.$queryRaw<SalesTrendItem[]>`
                        WITH months AS (
                            SELECT generate_series(
                                date_trunc('year', NOW()),
                                date_trunc('year', NOW()) + interval '11 months',
                                '1 month'::interval
                            ) as month_start
                        )
                        SELECT
                            TO_CHAR(m.month_start, 'MON') as label,
                            COUNT(r.id)::int as registered,
                            COUNT(r.id) FILTER (WHERE r.status IN ('ATTENDED', 'CONFIRMED'))::int as attended
                        FROM months m
                        LEFT JOIN "Registration" r ON date_trunc('month', r."createdAt") = m.month_start
                        AND r."eventId" = ANY(${eventIds})
                        GROUP BY m.month_start
                        ORDER BY m.month_start;
                    `,
                    prisma.$queryRaw<SalesTrendItem[]>`
                        WITH years AS (
                            SELECT generate_series(
                                date_trunc('year', NOW()) - interval '2 years',
                                date_trunc('year', NOW()),
                                '1 year'::interval
                            ) as year_start
                        )
                        SELECT
                            EXTRACT(YEAR FROM y.year_start)::text as label,
                            COUNT(r.id)::int as registered,
                            COUNT(r.id) FILTER (WHERE r.status IN ('ATTENDED', 'CONFIRMED'))::int as attended
                        FROM years y
                        LEFT JOIN "Registration" r ON date_trunc('year', r."createdAt") = y.year_start
                        AND r."eventId" = ANY(${eventIds})
                        GROUP BY y.year_start
                        ORDER BY y.year_start;
                    `
                ]);

                return { Weekly: weeklyRaw, Monthly: monthlyRaw, Yearly: yearlyRaw };
            },
            ['sales-trend-data-v3', userId, role, clubId || 'no-club', branch || 'no-branch'],
            { tags: ['dashboard-trends'], revalidate: 300 }
        )();
    }, 'getSalesTrendData');
}

export async function getRevenueBreakdownData() {
    return executeAction(async () => {
        const user = await getAuthenticatedUser();
        if (!user) throw new Error('Unauthorized');

        const { id: userId, role, branch, clubId } = user;

        const data = await unstable_cache(
            async () => {
                const eventIds = await getScopedEventIds(userId, role, clubId ?? null, branch ?? null);
                if (eventIds.length === 0) return [];

                const rawData = await prisma.$queryRaw<{ category: string; value: number }[]>`
                    SELECT 
                        COALESCE(e.category, 'Other') as category,
                        CAST(COUNT(r.id) AS INTEGER) as value
                    FROM "Registration" r
                    JOIN "Event" e ON r."eventId" = e.id
                    WHERE r.status NOT IN ('CANCELLED', 'REJECTED')
                    AND e.id = ANY(${eventIds})
                    GROUP BY e.category
                    ORDER BY value DESC
                `;

                return rawData.map((item: any) => ({
                    category: item.category,
                    value: Number(item.value || 0),
                    color: getCategoryColor(item.category)
                }));
            },
            ['revenue-breakdown-v3', userId, role, clubId || 'no-club', branch || 'no-branch'],
            { tags: ['dashboard-revenue'], revalidate: 300 }
        )();

        return { success: true, data };
    }, 'getRevenueBreakdownData');
}

export async function getRecentTransactionsData() {
    return executeAction(async () => {
        const user = await getAuthenticatedUser();
        if (!user) throw new Error('Unauthorized');

        const { id: userId, role, branch, clubId } = user;

        const data = await unstable_cache(
            async () => {
                const eventIds = await getScopedEventIds(userId, role, clubId ?? null, branch ?? null);
                if (eventIds.length === 0) return [];

                const rawTransactions = await prisma.$queryRaw<{
                    id: string;
                    studentName: string | null;
                    eventName: string;
                    status: string;
                    registrationDate: Date;
                    contact: string | null;
                    paymentAmount: number;
                    eventId: string;
                }[]>`
                    SELECT 
                        r.id,
                        r."studentName" as "studentName",
                        e.title as "eventName",
                        r.status,
                        r."createdAt" as "registrationDate",
                        u.phone as contact,
                        r.amount as "paymentAmount",
                        r."eventId"
                    FROM "Registration" r
                    JOIN "Event" e ON r."eventId" = e.id
                    LEFT JOIN "User" u ON r."userId" = u.id
                    WHERE e.id = ANY(${eventIds})
                    ORDER BY r."createdAt" DESC
                    LIMIT 5
                `;

                return rawTransactions.map(t => ({
                    id: t.id,
                    eventId: t.eventId,
                    studentName: t.studentName || 'Unknown Student',
                    eventName: t.eventName,
                    status: t.status,
                    registrationDate: new Date(t.registrationDate).toLocaleDateString(),
                    contact: t.contact || 'N/A',
                    paymentAmount: `₹${t.paymentAmount}`
                }));
            },
            ['recent-transactions-v3', userId, role, clubId || 'no-club', branch || 'no-branch'],
            { tags: ['dashboard-transactions'], revalidate: 30 }
        )();

        return { success: true, data };
    }, 'getRecentTransactionsData');
}

export async function getEventsList() {
    return executeAction(async () => {
        const user = await getAuthenticatedUser();
        if (!user) throw new Error('Unauthorized');

        const { id: userId, role, branch, clubId } = user;

        const events = await unstable_cache(
            async () => {
                let eventScope = buildEventScope(user);
                return await prisma.event.findMany({
                    where: eventScope,
                    select: { id: true, title: true },
                    orderBy: { createdAt: 'desc' }
                });
            },
            ['events-list-v3', userId, role, clubId || 'no-club', branch || 'no-branch'],
            { tags: ['events', 'events-list'], revalidate: 60 }
        )();

        return { success: true, data: events };
    }, 'getEventsList');
}

export async function getEventAnalyticsData() {
    return executeAction(async () => {
        const user = await getAuthenticatedUser();
        if (!user) throw new Error('Unauthorized');

        const { id: userId, role, branch, clubId } = user;

        const data = await unstable_cache(
            async () => {
                let eventScope = buildEventScope(user);
                const events = await prisma.event.findMany({
                    where: eventScope,
                    orderBy: { date: 'desc' },
                    select: {
                        id: true,
                        title: true,
                        category: true,
                        maxCapacity: true,
                        date: true,
                        registrations: {
                            select: {
                                status: true,
                                amount: true,
                                paymentStatus: true
                            }
                        }
                    }
                });

                return events.map((event: any) => {
                    const validRegistrations = event.registrations.filter((r: any) => r.status !== 'CANCELLED' && r.status !== 'REJECTED');
                    const onlineRegs = validRegistrations.length;
                    const attendanceCount = event.registrations.filter((r: any) => r.status === 'ATTENDED').length;

                    const revenue = event.registrations
                        .filter((r: any) => r.paymentStatus === 'PAID')
                        .reduce((sum: number, r: any) => sum + (r.amount || 0), 0);

                    return {
                        id: event.id,
                        name: event.title,
                        category: event.category || 'Uncategorized',
                        categoryColor: getCategoryColor(event.category),
                        onlineRegistrations: onlineRegs,
                        offlineRegistrations: 0,
                        capacity: event.maxCapacity,
                        attendance: attendanceCount,
                        revenue: revenue,
                        date: event.date.toISOString()
                    };
                });
            },
            ['event-analytics-dashboard-v3', userId, role, clubId || 'no-club', branch || 'no-branch'],
            { tags: ['events', 'event-analytics'], revalidate: 300 }
        )();

        return { success: true, data };
    }, 'getEventAnalyticsData');
}

export async function getHHODashboardData() {
    return executeAction(async () => {
        const user = await getAuthenticatedUser();
        if (!user) throw new Error('Unauthorized');
        if (user.role !== 'HHO' && user.role !== 'SUPER_ADMIN') {
            throw new Error('Unauthorized: HHO access required');
        }

        const result = await unstable_cache(
            async () => {
                const hhoScope: Prisma.EventWhereInput = { creator: { role: 'HHO' } };

                const [statsResult, transactions, events] = await Promise.all([
                    (async () => {
                        const [
                            eventCount,
                            registrationCount,
                            attendedCount,
                            pendingCount,
                            waitlistCount,
                            revenueResult
                        ] = await prisma.$transaction([
                            prisma.event.count({ where: hhoScope }),
                            prisma.registration.count({ where: { event: hhoScope, status: { notIn: ['CANCELLED', 'REJECTED'] } } }),
                            prisma.registration.count({ where: { event: hhoScope, status: 'ATTENDED' } }),
                            prisma.registration.count({ where: { event: hhoScope, status: 'PENDING' } }),
                            prisma.registration.count({ where: { event: hhoScope, status: 'WAITLISTED' } }),
                            prisma.registration.aggregate({ where: { event: hhoScope, paymentStatus: 'PAID' }, _sum: { amount: true } })
                        ]);
                        return { eventCount, registrationCount, attendedCount, pendingCount, waitlistCount, totalRevenue: revenueResult._sum.amount || 0 };
                    })(),
                    prisma.registration.findMany({
                        where: { event: hhoScope },
                        take: 10,
                        orderBy: { createdAt: 'desc' },
                        select: {
                            id: true,
                            studentName: true,
                            status: true,
                            createdAt: true,
                            amount: true,
                            eventId: true,
                            event: { select: { title: true } },
                            user: { select: { phone: true, email: true } }
                        }
                    }),
                    prisma.event.findMany({
                        where: hhoScope,
                        orderBy: { date: 'asc' },
                        take: 10,
                        select: {
                            id: true,
                            title: true,
                            date: true,
                            venue: true,
                            maxCapacity: true,
                            fee: true,
                            _count: { select: { registrations: true } }
                        }
                    })
                ]);

                return {
                    stats: statsResult,
                    recentActivity: transactions.map((t: any) => ({
                        id: t.id,
                        eventId: t.eventId,
                        studentName: t.studentName,
                        eventName: t.event?.title || 'Unknown Event',
                        status: mapRegistrationStatus(t.status),
                        registrationDate: t.createdAt.toISOString(),
                        contact: t.user?.phone || t.user?.email || 'N/A',
                        paymentAmount: t.amount > 0 ? `$${t.amount}` : 'Free'
                    })),
                    upcomingEvents: events.map(e => ({
                        id: e.id,
                        title: e.title,
                        date: e.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                        venue: e.venue || 'TBD',
                        registrations: e._count.registrations || 0,
                        cap: e.maxCapacity || 100,
                        type: (!e.fee || e.fee === 'Free' || e.fee === '0') ? 'Free' : 'Paid',
                        fee: e.fee
                    }))
                };
            },
            ['hho-dashboard-data-v3'],
            { tags: ['dashboard-stats', 'hho-data', 'events', 'registrations'], revalidate: 60 }
        )();

        return { success: true, ...result };
    }, 'getHHODashboardData');
}

export async function getBranchesList() {
    return executeAction(async () => {
        const data = await unstable_cache(
            async () => {
                const branches = await prisma.user.findMany({
                    select: { branch: true },
                    distinct: ['branch'],
                    where: { branch: { not: null } },
                    orderBy: { branch: 'asc' }
                });

                const branchList = branches.map(b => b.branch).filter(Boolean);

                if (branchList.length === 0) {
                    return ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AI&DS'];
                }

                return branchList;
            },
            ['branches-list-v3'],
            { tags: ['branches'], revalidate: 3600 }
        )();

        return { success: true, data };
    }, 'getBranchesList');
}
