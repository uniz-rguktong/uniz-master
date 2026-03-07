"use client";
import { Calendar, Users, UserCheck, TrendingUp } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import type { AllTrends } from "@/actions/trendsGetters";

interface MetricTrendData {
  value: string;
  isPositive: boolean;
}

interface MetricTrendWithComparison extends MetricTrendData {
  comparisonText: string;
}

interface StatsCardsValues {
  eventCount?: number;
  activeEventCount?: number;
  registrationCount?: number;
  activeParticipants?: number;
  completionRate?: number;
}

interface StatsCardsProps {
  stats: StatsCardsValues;
  trends: AllTrends | null | undefined;
}

export function StatsCards({ stats, trends }: StatsCardsProps) {
  // Helper to create trend object with comparison text
  const getTrend = (trendData: MetricTrendData | null | undefined) => {
    if (!trendData) return undefined;
    return { ...trendData, comparisonText: "vs yesterday" };
  };

  const totalEventsTrend: MetricTrendWithComparison | undefined = getTrend(
    trends?.totalEvents,
  );
  const totalRegistrationsTrend: MetricTrendWithComparison | undefined =
    getTrend(trends?.totalRegistrations);
  const activeParticipantsTrend: MetricTrendWithComparison | undefined =
    getTrend(trends?.activeParticipants);
  const completionRateTrend: MetricTrendWithComparison | undefined = getTrend(
    trends?.completionRate,
  );
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
      <MetricCard
        title="Total Events"
        value={`${stats.eventCount || 0}`}
        icon={Calendar}
        iconBgColor="#EFF6FF"
        iconColor="#3B82F6"
        {...(totalEventsTrend ? { trend: totalEventsTrend } : {})}
        {...(!trends?.totalEvents ? { subtitle: "All scheduled events" } : {})}
        infoText="Total number of scheduled events including upcoming and completed"
        delay={0}
      />
      <MetricCard
        title="Active Events"
        value={`${stats.activeEventCount || 0}`}
        icon={Calendar}
        iconBgColor="#ECFDF5"
        iconColor="#10B981"
        subtitle="Currently live/upcoming"
        infoText="Number of events that are currently active or scheduled for the future"
        delay={20}
      />
      <MetricCard
        title="Total Registrations"
        value={`${stats.registrationCount || 0}`}
        icon={Users}
        iconBgColor="#D1FAE5"
        iconColor="#10B981"
        {...(totalRegistrationsTrend ? { trend: totalRegistrationsTrend } : {})}
        {...(!trends?.totalRegistrations
          ? { subtitle: "All registrations" }
          : {})}
        infoText="Total unique student registrations across all events"
        delay={40}
      />
      <MetricCard
        title="Active Participants"
        value={`${stats.activeParticipants || 0}`}
        icon={UserCheck}
        iconBgColor="#F5F3FF"
        iconColor="#8B5CF6"
        {...(activeParticipantsTrend ? { trend: activeParticipantsTrend } : {})}
        {...(!trends?.activeParticipants
          ? { subtitle: "Confirmed & attended" }
          : {})}
        infoText="Students who have checked in or participated in at least one event"
        delay={80}
      />
    </div>
  );
}
