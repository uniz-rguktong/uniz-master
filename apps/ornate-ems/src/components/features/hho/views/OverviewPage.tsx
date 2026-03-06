'use client';
import { useState, useEffect } from 'react';
import { Calendar, Users } from 'lucide-react';
import { MetricCard } from '@/components/MetricCard';
import { useToast } from '@/hooks/useToast';
import { MetricCardSkeleton, Skeleton } from '@/components/ui/skeleton';
import { SalesTrendChart } from '@/components/SalesTrendChart';
import { TransactionsTable } from '@/components/TransactionsTable';
import { getHHODashboardData } from '@/actions/dashboardGetters';

interface OverviewPageProps {
  user?: Record<string, any>;
}

export function OverviewPage({ user }: OverviewPageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [recentRegistrations, setRecentRegistrations] = useState<any[]>([]);
  const { showToast } = useToast();

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await getHHODashboardData();

        if (res.success) {
          setStats(res.stats);
          setRecentRegistrations(res.recentActivity || []);
        } else {
          showToast('error' in res ? res.error : 'Failed to load dashboard', 'error');
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        showToast('An unexpected error occurred', 'error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [showToast]);

  const now = new Date();

  const salesData = {
    Weekly: Array.from({ length: 4 }, (_, index) => ({
      label: `W${index + 1}`,
      registered: 0,
      attended: 0
    })),
    Monthly: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].map(label => ({
      label,
      registered: 0,
      attended: 0
    })),
    Yearly: [String(now.getFullYear() - 2), String(now.getFullYear() - 1), String(now.getFullYear())].map(label => ({
      label,
      registered: 0,
      attended: 0
    }))
  };

  recentRegistrations.forEach((registration: any) => {
    const date = new Date(registration.registrationDate);
    if (Number.isNaN(date.getTime())) return;

    const isSuccessful = (registration.status || '').toLowerCase() === 'success';

    if (date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()) {
      const weekIndex = Math.min(3, Math.floor((date.getDate() - 1) / 7));
      salesData.Weekly[weekIndex]!.registered += 1;
      if (isSuccessful) salesData.Weekly[weekIndex]!.attended += 1;
    }

    if (date.getFullYear() === now.getFullYear()) {
      const monthIndex = date.getMonth();
      salesData.Monthly[monthIndex]!.registered += 1;
      if (isSuccessful) salesData.Monthly[monthIndex]!.attended += 1;
    }

    const yearIndex = salesData.Yearly.findIndex(point => point.label === String(date.getFullYear()));
    if (yearIndex !== -1) {
      salesData.Yearly[yearIndex]!.registered += 1;
      if (isSuccessful) salesData.Yearly[yearIndex]!.attended += 1;
    }
  });

  return (
    <div className="p-4 md:p-8 animate-page-entrance">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-[28px] font-semibold text-[#1A1A1A] mb-6">
          HHO Dashboard Overview
        </h1>

        {/* Metric Cards - Section 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {isLoading ? (
            <>
              <MetricCardSkeleton />
              <MetricCardSkeleton />
            </>
          ) : (
            <>
              <MetricCard
                title="Total Events"
                value={stats?.eventCount || 0}
                icon={Calendar}
                iconBgColor="#EFF6FF"
                iconColor="#3B82F6"
                infoText="Total events (Free & Paid)"
                delay={0}
              />
              <MetricCard
                title="Total Registrations"
                value={stats?.registrationCount || 0}
                icon={Users}
                iconBgColor="#D1FAE5"
                iconColor="#10B981"
                infoText="Total registrations across all events"
                delay={40}
              />
            </>
          )}
        </div>
      </div>

      {/* Participation Trends */}
      <div className="mb-8 animate-card-entrance" style={{ animationDelay: '160ms' }}>
        {isLoading ? <Skeleton height={340} borderRadius={16} /> : <SalesTrendChart data={salesData} />}
      </div>

      {/* Recent Registrations */}
      <div className="animate-card-entrance" style={{ animationDelay: '200ms' }}>
        {isLoading ? (
          <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
            <div className="bg-white rounded-[14px] border border-[#E5E7EB] overflow-hidden p-6 space-y-4">
              <Skeleton width="40%" height={24} />
              <div className="space-y-3">
                <Skeleton width="100%" height={40} />
                <Skeleton width="100%" height={40} />
                <Skeleton width="100%" height={40} />
              </div>
            </div>
          </div>
        ) : (
          <TransactionsTable transactions={recentRegistrations as any} allowEdit={false} />
        )}
      </div>
    </div>
  );
}

