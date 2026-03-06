'use server'

import prisma from '@/lib/prisma'
import logger from '@/lib/logger'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { calculateTrend } from '@/lib/trends'
import { unstable_cache } from 'next/cache';
import { Prisma } from '@/lib/generated/client';
import type { AnalyticsSnapshot } from '@/lib/generated/client';
import { executeAction } from '@/lib/api-utils';

// --- Types ---

export interface LiveMetrics {
    totalEvents: number;
    totalOnlineRegistrations: number;
    totalOfflineRegistrations: number;
    confirmedRegistrations: number;
    pendingRegistrations: number;
    waitlistRegistrations: number;
    cancelledRegistrations: number;
    totalAttendance: number;
    avgAttendanceRate: number;
    activeParticipants: number;
    totalRevenue: number;
    pendingRevenue: number;
    completionRate: number;
}

export interface TrendValue {
    value: string;
    isPositive: boolean;
}

export interface AllTrends {
    totalEvents: TrendValue | null;
    totalRegistrations: TrendValue | null;
    activeParticipants: TrendValue | null;
    completionRate: TrendValue | null;
    confirmedRegistrations: TrendValue | null;
    pendingRegistrations: TrendValue | null;
    waitlistRegistrations: TrendValue | null;
    onlineRegistrations: TrendValue | null;
    offlineRegistrations: TrendValue | null;
    totalRevenue: TrendValue | null;
    avgAttendanceRate: TrendValue | null;
    totalAttendance: TrendValue | null;
    pendingRevenue: TrendValue | null;
}


const getCachedYesterdaySnapshot = unstable_cache(
    async () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        return await prisma.analyticsSnapshot.findFirst({
            where: {
                snapshotDate: {
                    gte: yesterday,
                    lt: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000)
                }
            }
        });
    },
    ['yesterday-snapshot'],
    { tags: ['analytics', 'snapshot'], revalidate: 3600 }
);

const getCachedMetricsForAdmin = unstable_cache(
    async (email: string) => {
        const adminClient = prisma.admin;
        const eventClient = prisma.event;
        const regClient = prisma.registration;

        const admin = await adminClient.findUnique({
            where: { email },
            select: {
                id: true,
                role: true,
                branch: true,
                clubId: true
            }
        });

        if (!admin) {
            return {
                totalEvents: 0,
                totalOnlineRegistrations: 0,
                totalOfflineRegistrations: 0,
                confirmedRegistrations: 0,
                pendingRegistrations: 0,
                waitlistRegistrations: 0,
                cancelledRegistrations: 0,
                totalAttendance: 0,
                avgAttendanceRate: 0,
                activeParticipants: 0,
                totalRevenue: 0,
                pendingRevenue: 0,
                completionRate: 0
            } as LiveMetrics;
        }

        const adminId = admin.id;
        const isAdmin = admin.role === 'SUPER_ADMIN';
        const isClubCoordinator = admin.role === 'CLUB_COORDINATOR';
        const branch = admin.branch;
        const clubId = admin.clubId;

        const eventScope: Prisma.EventWhereInput = isAdmin ? {} :
            isClubCoordinator ? {
                creator: { clubId: clubId }
            } : {
                OR: [
                    { creatorId: adminId },
                    { creator: { branch: branch } }
                ]
            };

        const registrationScope = { event: eventScope };

        const [
            totalEvents,
            statusGroups,
            revenueGroups
        ] = await Promise.all([
            eventClient.count({ where: eventScope }),
            regClient.groupBy({
                by: ['status'],
                where: registrationScope,
                _count: { _all: true }
            }),
            regClient.groupBy({
                by: ['paymentStatus'],
                where: registrationScope,
                _sum: { amount: true }
            })
        ]);

        const statusMap: Record<string, number> = (statusGroups as { status: string; _count: { _all: number } }[]).reduce((acc: Record<string, number>, curr) => {
            acc[curr.status] = curr._count._all;
            return acc;
        }, {});

        const totalRegistrations = (statusGroups as { status: string; _count: { _all: number } }[]).reduce((sum: number, curr) => sum + curr._count._all, 0);
        const confirmedCount = statusMap['CONFIRMED'] || 0;
        const attendedCount = statusMap['ATTENDED'] || 0;
        const pendingCount = statusMap['PENDING'] || 0;
        const waitlistCount = statusMap['WAITLISTED'] || 0;
        const cancelledCount = statusMap['CANCELLED'] || 0;
        const rejectedCount = statusMap['REJECTED'] || 0;

        const revenueMap: Record<string, number> = (revenueGroups as { paymentStatus: string; _sum: { amount: number | null } }[]).reduce((acc: Record<string, number>, curr) => {
            acc[curr.paymentStatus] = curr._sum.amount || 0;
            return acc;
        }, {});

        const paidRevenue = revenueMap['PAID'] || 0;
        const pendingRevenue = revenueMap['PENDING'] || 0;

        const derivedConfirmed = confirmedCount + attendedCount;
        const derivedPending = pendingCount;
        const derivedCancelled = cancelledCount + rejectedCount;

        const activeParticipants = derivedConfirmed;
        const completionRate = totalRegistrations > 0
            ? Math.round((attendedCount / totalRegistrations) * 100)
            : 0;

        return {
            totalEvents,
            totalOnlineRegistrations: totalRegistrations,
            totalOfflineRegistrations: 0,
            confirmedRegistrations: derivedConfirmed,
            pendingRegistrations: derivedPending,
            waitlistRegistrations: waitlistCount,
            cancelledRegistrations: derivedCancelled,
            totalAttendance: attendedCount,
            avgAttendanceRate: completionRate,
            activeParticipants,
            totalRevenue: paidRevenue,
            pendingRevenue: pendingRevenue,
            completionRate
        };
    },
    ['current-live-metrics'],
    { tags: ['metrics', 'analytics'], revalidate: 60 }
);

/**
 * Get yesterday's analytics snapshot
 */
export async function getYesterdaySnapshot(): Promise<AnalyticsSnapshot | null> {
    const snapshot = await getCachedYesterdaySnapshot();
    return snapshot;
}

/**
 * Get current live metrics from the database scoped to the current admin
 */
export async function getCurrentMetrics(): Promise<LiveMetrics> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
        return {
            totalEvents: 0,
            totalOnlineRegistrations: 0,
            totalOfflineRegistrations: 0,
            confirmedRegistrations: 0,
            pendingRegistrations: 0,
            waitlistRegistrations: 0,
            cancelledRegistrations: 0,
            totalAttendance: 0,
            avgAttendanceRate: 0,
            activeParticipants: 0,
            totalRevenue: 0,
            pendingRevenue: 0,
            completionRate: 0
        };
    }

    try {
        return await getCachedMetricsForAdmin(session.user.email);
    } catch (error) {
        logger.error({ err: error }, 'Error in getCurrentMetrics');
        return {
            totalEvents: 0,
            totalOnlineRegistrations: 0,
            totalOfflineRegistrations: 0,
            confirmedRegistrations: 0,
            pendingRegistrations: 0,
            waitlistRegistrations: 0,
            cancelledRegistrations: 0,
            totalAttendance: 0,
            avgAttendanceRate: 0,
            activeParticipants: 0,
            totalRevenue: 0,
            pendingRevenue: 0,
            completionRate: 0
        };
    }
}

/**
 * Get all trends by comparing current metrics to yesterday's snapshot
 */
export async function getAllTrends(): Promise<{ success?: boolean; hasYesterdayData?: boolean; current?: LiveMetrics; trends?: AllTrends | null; error?: string }> {
    const session = await getServerSession(authOptions);
    if (!session) {
        return { error: 'Unauthorized' };
    }

    try {
        const [current, yesterday] = await Promise.all([
            getCurrentMetrics(),
            getYesterdaySnapshot()
        ]);

        if (!yesterday) {
            return {
                success: true,
                hasYesterdayData: false,
                current,
                trends: null
            };
        }

        const trends: AllTrends = {
            totalEvents: calculateTrend(current.totalEvents, yesterday.totalEvents),
            totalRegistrations: calculateTrend(current.totalOnlineRegistrations, yesterday.totalOnlineRegistrations),
            activeParticipants: calculateTrend(current.activeParticipants, yesterday.activeParticipants),
            completionRate: calculateTrend(current.completionRate, yesterday.completionRate),
            confirmedRegistrations: calculateTrend(current.confirmedRegistrations, yesterday.confirmedRegistrations),
            pendingRegistrations: calculateTrend(current.pendingRegistrations, yesterday.pendingRegistrations),
            waitlistRegistrations: calculateTrend(current.waitlistRegistrations, yesterday.waitlistRegistrations),
            onlineRegistrations: calculateTrend(current.totalOnlineRegistrations, yesterday.totalOnlineRegistrations),
            offlineRegistrations: calculateTrend(current.totalOfflineRegistrations, yesterday.totalOfflineRegistrations),
            totalRevenue: calculateTrend(current.totalRevenue, yesterday.totalRevenue),
            avgAttendanceRate: calculateTrend(current.avgAttendanceRate, yesterday.avgAttendanceRate),
            totalAttendance: calculateTrend(current.totalAttendance, yesterday.totalAttendance),
            pendingRevenue: calculateTrend(current.pendingRevenue, yesterday.pendingRevenue)
        };

        return {
            success: true,
            hasYesterdayData: true,
            current,
            trends
        };
    } catch (error) {
        logger.error({ err: error }, 'Get All Trends Error');
        return { error: 'Failed to fetch trends' };
    }
}

/**
 * Create a daily snapshot with current metrics
 */
export async function createDailySnapshot(): Promise<{ success: true; data: AnalyticsSnapshot } | { success: false; error: string }> {
    const session = await getServerSession(authOptions);
    if (!session) {
        return { success: false, error: 'Unauthorized' };
    }

    return executeAction(async () => {
        const metrics = await getCurrentMetrics();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const snapshot = await prisma.analyticsSnapshot.upsert({
            where: { snapshotDate: today },
            update: metrics,
            create: {
                snapshotDate: today,
                ...metrics
            }
        });

        return { success: true, data: snapshot };
    }, 'createDailySnapshot');
}

