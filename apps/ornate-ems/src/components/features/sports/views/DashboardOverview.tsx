'use client';
"use client";
import { useState, useEffect } from 'react';
import { Trophy, Users, CheckCircle2, Calendar, Target, Activity, Zap } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { MetricCard } from '@/components/MetricCard';
import { MetricCardSkeleton, Skeleton } from '@/components/ui/skeleton';
import { ChampionshipStandings } from '../components/ChampionshipStandings';
import { UpcomingMatches } from '../components/UpcomingMatches';
import { getSportsDashboardStats } from '@/actions/sportGetters';

interface DashboardUser {
  id?: string;
  name?: string;
}

interface DashboardStats {
  totalSports: number;
  totalRegistrations: number;
  matchesCompleted: number;
  totalMatches: number;
  activeTournaments: number;
  categoryBreakdown?: Array<{ label: string; value: number }>;
}

interface DashboardStanding {
  branch: string;
  name: string;
  points: number;
  color: string;
  rank: number;
}

interface DashboardMatch {
  id: string;
  sport: string;
  gender: string;
  round: string;
  team1Name?: string;
  team2Name?: string;
  date?: string;
  time?: string;
  venue?: string;
}

interface DashboardOverviewProps {
  user?: DashboardUser;
}

export function DashboardOverview({ user }: DashboardOverviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalSports: 0,
    totalRegistrations: 0,
    matchesCompleted: 0,
    totalMatches: 0,
    activeTournaments: 0,
    categoryBreakdown: []
  });

  const [standings, setStandings] = useState<DashboardStanding[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<DashboardMatch[]>([]);
  const [isStandingsLoading, setIsStandingsLoading] = useState(true);
  const [isMatchesLoading, setIsMatchesLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      // setIsLoading(true); // default true on mount
      const res = await getSportsDashboardStats();
      if (res.success) {
        setStats(res.stats as any);
      } else {
        console.error('Failed to fetch dashboard stats', res.error);
      }
      setIsLoading(false);
    }

    async function fetchStandings() {
      setIsStandingsLoading(true);
      const { getOverallBranchStandings } = await import('@/actions/fixtureActions');
      const res = await getOverallBranchStandings();
      if (res.success) {
        setStandings(res.data as any);
      }
      setIsStandingsLoading(false);
    }

    async function fetchUpcoming() {
      setIsMatchesLoading(true);
      const { getUpcomingMatches } = await import('@/actions/fixtureActions');
      const res = await getUpcomingMatches(5);
      if (res.success) {
        setUpcomingMatches((res.data || []) as any);
      }
      setIsMatchesLoading(false);
    }

    fetchStats();
    fetchStandings();
    fetchUpcoming();
  }, []);

  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const userBranch = session?.user?.branch;

  const title = (userRole === 'BRANCH_SPORTS_ADMIN' && userBranch)
    ? `${userBranch.toUpperCase()} Sport Dashboard Overview`
    : "Sports Dashboard Overview";

  return (
    <div className="p-4 md:p-8 animate-page-entrance">
      {/* Header */}
      <div className="mb-0">
        <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
          <span>Dashboard</span>
          <span className="text-[#9CA3AF]">›</span>
          <span className="text-[#1A1A1A] font-medium">Overview</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-xl md:text-[28px] font-semibold text-[#1A1A1A] mb-1.5 md:mb-2">{title}</h1>
            <p className="text-xs md:text-sm text-[#6B7280] font-medium md:font-normal max-w-2xl">Central command for sports tournaments, activity, and branch performance tracking.</p>
          </div>
        </div>
      </div>

      {/* Section 1: Key Metrics Cards */}
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
              title="Total Sports"
              value={stats.totalSports.toString()}
              icon={Trophy}
              iconBgColor="#EFF6FF"
              iconColor="#3B82F6"
              infoText="Total sports competitions currently active or scheduled"
              delay={0}
            />
            <MetricCard
              title="Total Registrations"
              value={stats.totalRegistrations.toString()}
              icon={Users}
              iconBgColor="#D1FAE5"
              iconColor="#10B981"
              infoText="Total team registrations across all categories and branches"
              delay={40}
            />
            <MetricCard
              title="Matches Conducted"
              value={`${stats.matchesCompleted}/${stats.totalMatches}`}
              icon={CheckCircle2}
              iconBgColor="#F5F3FF"
              iconColor="#8B5CF6"
              infoText="Number of matches played out of total scheduled"
              delay={80}
            />
            <MetricCard
              title="Active Tournaments"
              value={stats.activeTournaments.toString()}
              icon={Zap}
              iconBgColor="#FEF3C7"
              iconColor="#F59E0B"
              infoText="Number of ongoing tournaments today"
              delay={120}
            />
          </>
        )}
      </div>

      {/* Section 2: Championship */}
      <div className="mb-10">
        <div className="animate-card-entrance" style={{ animationDelay: '160ms' }}>
          <ChampionshipStandings data={standings} isLoading={isStandingsLoading} />
        </div>
      </div>

      {/* Section 3: Timeline (Full Width) */}
      <div className="mb-10 animate-card-entrance" style={{ animationDelay: '240ms' }}>
        <UpcomingMatches data={upcomingMatches} isLoading={isMatchesLoading} />
      </div>


    </div >
  );
}
