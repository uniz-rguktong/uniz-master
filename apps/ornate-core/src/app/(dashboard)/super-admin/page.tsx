import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import {
    Calendar,
    Users,
    Clock,
    Megaphone,
    AlertTriangle,
    Trophy
} from 'lucide-react';

import { MetricCard } from '@/components/MetricCard';
import { StandardCard } from '@/components/ui/StandardCard';
import { InfoTooltip } from '@/components/InfoTooltip';

// Server Actions
import {
    getSuperAdminStats,
    getTodaysEvents,
    getRegistrationTrend,
    getPortalPerformance,
    getPendingApprovals,
    getRecentAnnouncements
} from '@/actions/superAdminGetters';

import { Skeleton } from '@/components/ui/skeleton';

import SafeChart from '@/components/dashboard/SafeChart';
import { WelcomeToast } from '@/components/dashboard/WelcomeToast';

// --- Sub-Components (Server Components) ---

import { EventMetrics } from '@/components/shared/EventMetrics';
import type { MetricItem } from '@/components/shared/EventMetrics';

async function StatsSection() {
    const stats = await getSuperAdminStats();

    const metrics: MetricItem[] = [
        {
            title: "Total Events",
            value: stats.totalEvents.count,
            infoText: "All time events",
            icon: 'Calendar',
            iconBgColor: "#EEF2FF",
            iconColor: "#4F46E5",
        },
        {
            title: "Total Registrations",
            value: stats.totalRegistrations.count.toLocaleString(),
            infoText: "Total users registered",
            icon: 'Users',
            iconBgColor: "#ECFDF5",
            iconColor: "#059669",
        },
        {
            title: "Pending Approvals",
            value: stats.pendingApprovals.count,
            icon: 'Clock',
            iconBgColor: "#FEF2F2",
            iconColor: "#DC2626",
            infoText: "Needs attention",
        },
        {
            title: "Announcements",
            value: stats.activeAnnouncements.count,
            infoText: "Active alerts",
            icon: 'Megaphone',
            iconBgColor: "#F5F3FF",
            iconColor: "#7C3AED",
        }
    ];

    return <EventMetrics metrics={metrics} />;
}

async function ChartSection() {
    const trendData = await getRegistrationTrend();

    return <SafeChart data={trendData} />;
}

async function LeaderboardSection() {
    const portals = await getPortalPerformance();

    return (
        <StandardCard
            className="h-full"
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-[#1A1A1A]">Activity Leaderboard</h3>
                        <InfoTooltip text="Events count by category" size="sm" />
                    </div>
                    <Trophy className="w-5 h-5 text-yellow-500" />
                </div>
            }
        >
            <div className="space-y-4">
                {portals.length === 0 ? (
                    <div className="text-sm text-gray-500 text-center py-4">No data available</div>
                ) : (
                    portals.map((portal: any, index: any) => (
                        <div key={portal.name} className="flex items-center gap-4 p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group">
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                                ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                    index === 1 ? 'bg-gray-100 text-gray-700' :
                                        index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-white border border-gray-200 text-gray-500'}
                            `}>
                                {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-semibold text-[#1A1A1A]">{portal.name}</span>
                                    <span className="text-xs font-medium text-gray-500">{portal.events} Events</span>
                                </div>
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${index < 3 ? 'bg-indigo-500' : 'bg-gray-400'}`}
                                        style={{ width: `${Math.min(portal.events * 10, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </StandardCard>
    );
}

async function ScheduleSection() {
    const events = await getTodaysEvents();

    return (
        <StandardCard
            header={
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        Today&apos;s Events
                    </h3>
                    <span className="text-sm text-gray-500">
                        {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                </div>
            }
        >
            <div className="space-y-3">
                {events.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        No events scheduled for today.
                    </div>
                ) : (
                    events.map((event: any) => (
                        <div key={event.id} className="flex items-center gap-4 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 hover:border-gray-200 transition-all">
                            <div className="flex flex-col items-center justify-center w-14 p-1 bg-gray-50 rounded-lg shrink-0">
                                <span className="text-xs font-bold text-gray-900">{event.time}</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-[#1A1A1A] text-sm">{event.title}</h4>
                                <p className="text-xs text-gray-500">{event.venue} • <span className="font-medium text-indigo-600">{event.portal}</span></p>
                            </div>
                            <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase
                                ${event.status === 'ONGOING' ? 'bg-green-100 text-green-700 animate-pulse' : 'bg-blue-100 text-blue-700'}
                            `}>
                                {event.status}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </StandardCard>
    );
}

async function PendingApprovalsSection() {
    const approvals = await getPendingApprovals();

    return (
        <StandardCard
            header={
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
                        <Clock className="w-5 h-5 text-red-400" />
                        Pending Approvals
                    </h3>
                    <InfoTooltip text="Events waiting for publication" size="sm" />
                </div>
            }
        >
            <div className="space-y-4">
                {approvals.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        No pending event approvals.
                    </div>
                ) : (
                    approvals.slice(0, 5).map((item: any) => (
                        <div key={item.id} className="flex items-start gap-4 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-all">
                            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                                <Calendar className="w-5 h-5 text-red-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-[#1A1A1A] text-sm truncate">{item.name}</h4>
                                <p className="text-xs text-gray-500 mb-1">By {item.organizer} • {item.branch}</p>
                                <span className="text-[10px] text-gray-400">Submitted {item.submittedAt}</span>
                            </div>
                            <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg">
                                Review
                            </button>
                        </div>
                    ))
                )}
            </div>
        </StandardCard>
    );
}

async function RecentAnnouncementsSection() {
    const announcements = await getRecentAnnouncements();

    return (
        <StandardCard
            header={
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
                        <Megaphone className="w-5 h-5 text-purple-400" />
                        Platform Announcements
                    </h3>
                    <InfoTooltip text="Recent updates sent to users" size="sm" />
                </div>
            }
        >
            <div className="space-y-4">
                {announcements.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        No active announcements.
                    </div>
                ) : (
                    announcements.map((item: any) => (
                        <div key={item.id} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-xl transition-all">
                            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                                <Megaphone className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-semibold text-[#1A1A1A] text-sm">{item.title}</h4>
                                    <span className="text-[10px] text-gray-400">{item.date}</span>
                                </div>
                                <p className="text-xs text-gray-600 line-clamp-2 mb-2">{item.content}</p>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-gray-100 text-[#6B7280] text-[10px] font-medium rounded">
                                        {item.category}
                                    </span>
                                    <span className="text-[10px] text-gray-400">By {item.createdBy}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </StandardCard>
    );
}

// --- Main Page Component ---

export default function MissionControlPage() {
    return (
        <div className="p-4 md:p-8 animate-page-entrance max-w-[1600px] mx-auto">
            <WelcomeToast title="Super Admin" />
            {/* Header */}
            <div className="mb-0">
                <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
                    <span>Dashboard</span>
                    <span className="text-[#9CA3AF]">›</span>
                    <span className="text-[#1A1A1A] font-medium">Mission Control</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-xl md:text-[28px] font-semibold text-[#1A1A1A] mb-2">System Performance Overview</h1>
                        <p className="text-sm text-[#6B7280]">Real-time system health and participation analytics across all portals.</p>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5 flex items-center gap-3">
                        <div className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </div>
                        <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">System Status: Live</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4 mb-8">
                <Suspense fallback={<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /></div>}>
                    <StatsSection />
                </Suspense>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
                        <ChartSection />
                    </Suspense>
                </div>
                <div className="lg:col-span-1">
                    <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
                        <LeaderboardSection />
                    </Suspense>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-2xl" />}>
                    <ScheduleSection />
                </Suspense>
                <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-2xl" />}>
                    <PendingApprovalsSection />
                </Suspense>
            </div>

            <div className="mt-8">
                <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
                    <RecentAnnouncementsSection />
                </Suspense>
            </div>
        </div >
    );
}
