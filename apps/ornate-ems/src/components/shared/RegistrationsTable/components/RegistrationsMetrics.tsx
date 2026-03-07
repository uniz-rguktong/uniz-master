"use client";

import { Globe, Users, Target, DollarSign } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { MetricCardSkeleton } from "@/components/ui/skeleton";

interface RegistrationsMetricsProps {
  isLoading: boolean;
  stats: {
    totalOnlineRegistrations: number;
    totalOfflineRegistrations: number;
    totalRevenue: number;
    avgAttendanceRate: number;
  };
  trends?: {
    onlineRegistrations?: any;
    offlineRegistrations?: any;
    revenue?: any;
    attendanceRate?: any;
  };
}

export function RegistrationsMetrics({
  isLoading,
  stats,
  trends,
}: RegistrationsMetricsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <MetricCard
        title="Total Online Registrations"
        value={stats.totalOnlineRegistrations.toString()}
        icon={Globe}
        iconBgColor="#EFF6FF"
        iconColor="#3B82F6"
        trend={
          trends?.onlineRegistrations
            ? {
                ...trends.onlineRegistrations,
                comparisonText: "vs last period",
              }
            : undefined
        }
        tooltip="Registrations completed through the online portal"
      />

      <MetricCard
        title="Total Offline Registrations"
        value={stats.totalOfflineRegistrations.toString()}
        icon={Users}
        iconBgColor="#F5F3FF"
        iconColor="#8B5CF6"
        trend={
          trends?.offlineRegistrations
            ? {
                ...trends.offlineRegistrations,
                comparisonText: "vs last period",
              }
            : undefined
        }
        tooltip="Paper-based registrations processed manually"
      />

      <MetricCard
        title="Avg Attendance Rate"
        value={`${stats.avgAttendanceRate}%`}
        icon={Target}
        iconBgColor="#F0FDF4"
        iconColor="#10B981"
        trend={
          trends?.attendanceRate
            ? { ...trends.attendanceRate, comparisonText: "vs last period" }
            : undefined
        }
        tooltip="Average percentage of students who attended events"
      />

      <MetricCard
        title="Total Revenue"
        value={`₹${stats.totalRevenue.toLocaleString()}`}
        icon={DollarSign}
        iconBgColor="#FFFBEB"
        iconColor="#F59E0B"
        trend={
          trends?.revenue
            ? { ...trends.revenue, comparisonText: "vs last period" }
            : undefined
        }
        tooltip="Total funds collected from paid registrations"
      />
    </div>
  );
}
