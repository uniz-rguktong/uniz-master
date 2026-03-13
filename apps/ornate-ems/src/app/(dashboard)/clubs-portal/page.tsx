import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
    getDashboardStats,
    getSalesTrendData,
    getRevenueBreakdownData,
    getRecentTransactionsData,
    getEventsList,
    getBranchesList
} from '@/actions/dashboardGetters';
import { getAllTrends } from '@/actions/trendsGetters';

import { StatsCards } from '@/components/dashboard/StatsCards';
import { ChartsSection } from '@/components/dashboard/ChartsSection';
import { TransactionsSection } from '@/components/dashboard/TransactionsSection';

import {
    MetricsSectionSkeleton,
    ChartsSectionSkeleton,
    TransactionsSectionSkeleton
} from '@/components/dashboard/Skeletons';
import { WelcomeToast } from '@/components/dashboard/WelcomeToast';
import { getCurrentUserEntity } from '@/actions/clubEntityGetters';

function formatClubId(clubId?: string | null) {
    if (!clubId) return null;
    if (clubId.toLowerCase() === 'techexcel') return 'TechXcel';
    return clubId
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
}

async function StatsCardsLoader() {
    const statsResult = await getDashboardStats();
    const trendsResult = await getAllTrends();

    const stats = 'stats' in statsResult ? statsResult.stats || {} : {};
    const trends = trendsResult.success ? trendsResult.trends : null;

    return <StatsCards stats={stats} trends={trends} />;
}

async function ChartsLoader() {
    const salesResult = await getSalesTrendData();
    const revenueResult = await getRevenueBreakdownData();

    const salesData = 'Weekly' in salesResult ? salesResult : undefined;
    const revenueData = 'data' in revenueResult ? revenueResult.data : undefined;

    return <ChartsSection salesData={salesData} revenueData={revenueData} />;
}

async function TransactionsLoader() {
    const transResult = await getRecentTransactionsData();
    const data = 'data' in transResult ? transResult.data : undefined;
    const eventsRes = await getEventsList();
    const branchesRes = await getBranchesList();

    const events = 'data' in eventsRes ? eventsRes.data : [];
    const branches = 'data' in branchesRes ? (branchesRes.data as string[]) : [];

    return <TransactionsSection
        transactions={data}
        events={(events || []) as any[]}
        branches={branches}
        allowEdit={false}
    />;
}

export default async function DashboardRoute() {
    const session = await getServerSession(authOptions);
    const user = session?.user;
    const { entity } = await getCurrentUserEntity();

    const clubName = entity?.name || formatClubId(user?.clubId) || 'Club';
    const title = `${clubName} Dashboard Overview`;

    return (
        <div className="p-4 md:p-8 animate-page-entrance">
            <WelcomeToast title={clubName} />
            <div className="mb-0">
                <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
                    <span>Dashboard</span>
                    <span className="text-[#9CA3AF]">›</span>
                    <span className="text-[#1A1A1A] font-medium">Overview</span>
                </div>

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl md:text-[28px] font-semibold text-[#1A1A1A] mb-2">{title}</h1>
                        <p className="text-sm text-[#6B7280]">Comprehensive analytics and event tracking for your club.</p>
                    </div>
                </div>

                <Suspense fallback={<MetricsSectionSkeleton />}>
                    <StatsCardsLoader />
                </Suspense>
            </div>

            <Suspense fallback={<ChartsSectionSkeleton />}>
                <ChartsLoader />
            </Suspense>

            <Suspense fallback={<TransactionsSectionSkeleton />}>
                <TransactionsLoader />
            </Suspense>
        </div>
    );
}
