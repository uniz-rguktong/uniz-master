'use client';
"use client";
import { useState, useEffect } from 'react';
import { Calendar, Users, UserCheck, TrendingUp } from 'lucide-react';
import { MetricCard } from '@/components/MetricCard';
import { SalesTrendChart } from '@/components/SalesTrendChart';
import { RevenueBreakdown } from '@/components/RevenueBreakdown';
import { TransactionsTable } from '@/components/TransactionsTable';
import { MetricCardSkeleton, Skeleton } from '@/components/ui/skeleton';

import { getNotifications } from '@/actions/notificationActions';
import { useToast } from '@/hooks/useToast';

interface DashboardUser {
  branch?: string;
}

interface DashboardStats {
  eventCount?: number;
  registrationCount?: number;
  activeParticipants?: number;
  completionRate?: number;
}

interface DashboardOverviewProps {
  user?: DashboardUser;
  initialStats?: DashboardStats;
  trends?: Record<string, unknown>;
  salesData?: unknown;
  revenueData?: unknown;
  transactions?: unknown;
}

export function DashboardOverview({ user, initialStats, trends, salesData, revenueData, transactions }: DashboardOverviewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    async function checkAchievements() {
      try {
        const res = await getNotifications();
        if (res.success && res.data) {
          // Filter for unread achievements
          const unreadAchievements = res.data.filter(n => !n.isRead && n.type === 'achievement');

          unreadAchievements.forEach(n => {
            const key = `toast_shown_${n.id}`;
            if (typeof window !== 'undefined' && !sessionStorage.getItem(key)) {
              // Show toast
              showToast(n.message, 'success');
              // Mark as shown in this session
              sessionStorage.setItem(key, 'true');
            }
          });
        }
      } catch (err) {
        console.error("Failed to check notifications", err);
      }
    }

    checkAchievements();
  }, [showToast]);

  // Use initialStats or fallback to defaults (active participants and completion rate are placeholders in getter for now)
  const stats = initialStats || { eventCount: 0, registrationCount: 0, activeParticipants: 0, completionRate: 0 };

  const title = user?.branch
    ? `${user.branch === 'cse' ? 'Computer Science' :
      user.branch === 'ece' ? 'Electronics & Comm.' :
        user.branch === 'eee' ? 'Electrical & Electronics' :
          user.branch === 'mech' ? 'Mechanical' :
            user.branch === 'civil' ? 'Civil Engineering' : user.branch.toUpperCase()} Dashboard`
    : 'Dashboard Overview';

  // Helper to create trend object
  const getTrend = (trendData: any) => {
    if (!trendData) return null;
    return { ...trendData };
  };

  return (
    <div className="p-4 md:p-8 animate-page-entrance">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-xl md:text-[28px] font-semibold text-[#1A1A1A] mb-6">
          {title}
        </h1>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {isLoading ? (
            <>
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
            </>
          ) : (
            <>
              <MetricCard
                title="Total Events"
                value={stats.eventCount || 0}
                icon={Calendar}
                iconBgColor="#EFF6FF"
                iconColor="#3B82F6"
                trend={getTrend(trends?.totalEvents)}
                infoText="Total number of scheduled events including upcoming and completed"
                className="!pb-[25px]"
                delay={0}
              />
              <MetricCard
                title="Total Registrations"
                value={stats.registrationCount || 0}
                icon={Users}
                iconBgColor="#D1FAE5"
                iconColor="#10B981"
                trend={getTrend(trends?.totalRegistrations)}
                infoText="Total unique student registrations across all events"
                className="!pb-[25px]"
                delay={40}
              />
              <MetricCard
                title="Active Participants"
                value={stats.activeParticipants || 0}
                icon={UserCheck}
                iconBgColor="#F5F3FF"
                iconColor="#8B5CF6"
                trend={getTrend(trends?.activeParticipants)}
                infoText="Students who have checked in or participated in at least one event"
                className="!pb-[25px]"
                delay={80}
              />
              <MetricCard
                title="Completion Rate"
                value={`${stats.completionRate || 0}%`}
                icon={TrendingUp}
                iconBgColor="#FEF3C7"
                iconColor="#F59E0B"
                trend={getTrend(trends?.completionRate)}
                infoText="Percentage of registered students who attended the event"
                className="!pb-[15px]"
                delay={120}
              />
            </>
          )}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 animate-card-entrance" style={{ animationDelay: '160ms' }}>
          {isLoading ? <Skeleton height={340} borderRadius={16} /> : <SalesTrendChart data={salesData as any} />}
        </div>
        <div className="animate-card-entrance" style={{ animationDelay: '200ms' }}>
          {isLoading ? <Skeleton height={340} borderRadius={16} /> : <RevenueBreakdown data={revenueData as any} />}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="animate-card-entrance" style={{ animationDelay: '240ms' }}>
        {isLoading ? (
          <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
            <div className="bg-white rounded-[14px] border border-[#E5E7EB] overflow-hidden p-6 space-y-4">
              <Skeleton width="40%" height={24} />
              <div className="space-y-3">
                <Skeleton width="100%" height={40} />
                <Skeleton width="100%" height={40} />
                <Skeleton width="100%" height={40} />
                <Skeleton width="100%" height={40} />
              </div>
            </div>
          </div>
        ) : (
          <TransactionsTable transactions={transactions as any} />
        )}
      </div>
    </div>
  );
}