"use client";
"use client";
import { useState, useEffect } from "react";
import { Calendar, Users, UserCheck, TrendingUp } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { SalesTrendChart } from "@/components/SalesTrendChart";
import { RevenueBreakdown } from "@/components/RevenueBreakdown";
import { TransactionsTable } from "@/components/TransactionsTable";
import { MetricCardSkeleton, Skeleton } from "@/components/ui/skeleton";
import { useClub } from "@/context/ClubContext";
import { useToast } from "@/hooks/useToast";
import { getDashboardStats } from "@/actions/dashboardGetters";

interface DashboardUser {
  clubId?: string;
}

interface DashboardOverviewProps {
  user?: DashboardUser;
}

export function DashboardOverview({ user }: DashboardOverviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const { clubDetails } = useClub();
  const { showToast } = useToast();

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      const response = await getDashboardStats();
      if (response.success) {
        setStats(response.stats);
      } else {
        showToast("Failed to fetch dashboard stats", "error");
      }
      setIsLoading(false);
    }
    fetchStats();
  }, [showToast]);

  const displayClubName = user?.clubId
    ? user.clubId.charAt(0).toUpperCase() + user.clubId.slice(1)
    : clubDetails?.name || "Entity";
  const title = displayClubName.toLowerCase().includes("dashboard")
    ? displayClubName
    : `${displayClubName} Dashboard`;

  return (
    <div className="p-4 md:p-8 animate-page-entrance">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-[28px] font-semibold text-[#1A1A1A] mb-6">
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
                value={stats?.eventCount?.toString() || "0"}
                icon={Calendar}
                iconBgColor="#EFF6FF"
                iconColor="#3B82F6"
                trend={stats?.trends?.events}
                infoText="Total number of scheduled events including upcoming and completed"
                delay={0}
              />
              <MetricCard
                title="Total Registrations"
                value={stats?.registrationCount?.toString() || "0"}
                icon={Users}
                iconBgColor="#D1FAE5"
                iconColor="#10B981"
                trend={stats?.trends?.registrations}
                infoText="Total unique student registrations across all events"
                delay={40}
              />
              <MetricCard
                title="Active Participants"
                value={stats?.activeParticipants?.toString() || "0"}
                icon={UserCheck}
                iconBgColor="#F5F3FF"
                iconColor="#8B5CF6"
                trend={{
                  value: `${stats?.activeParticipants || 0}`,
                  isPositive: true,
                  comparisonText: "attendees",
                }}
                infoText="Students who have checked in or participated in at least one event"
                delay={80}
              />
              <MetricCard
                title="Completion Rate"
                value={`${stats?.completionRate || 0}%`}
                icon={TrendingUp}
                iconBgColor="#FEF3C7"
                iconColor="#F59E0B"
                trend={{
                  value: `${stats?.completionRate || 0}%`,
                  isPositive: (stats?.completionRate || 0) > 50,
                  comparisonText: "avg",
                }}
                infoText="Percentage of registered students who attended the event"
                delay={120}
              />
            </>
          )}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div
          className="lg:col-span-2 animate-card-entrance"
          style={{ animationDelay: "160ms" }}
        >
          {isLoading ? (
            <Skeleton height={340} borderRadius={16} />
          ) : (
            <SalesTrendChart />
          )}
        </div>
        <div
          className="animate-card-entrance"
          style={{ animationDelay: "200ms" }}
        >
          {isLoading ? (
            <Skeleton height={340} borderRadius={16} />
          ) : (
            <RevenueBreakdown />
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div
        className="animate-card-entrance"
        style={{ animationDelay: "240ms" }}
      >
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
          <TransactionsTable allowEdit={false} />
        )}
      </div>
    </div>
  );
}
