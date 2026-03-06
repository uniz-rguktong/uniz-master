'use client';
import { useState, useEffect } from 'react';
import { Trophy, Calendar, MapPin, Users, Play, CheckCircle, Clock, ChevronRight, Info } from 'lucide-react';
import { Skeleton, MetricCardSkeleton } from '@/components/ui/skeleton';

import { getSports } from '@/actions/sportGetters';
import { getUpcomingMatches, getMatches } from '@/actions/fixtureActions';

interface LeaderboardPageProps {
  onNavigate?: (path: string, options?: Record<string, unknown>) => void;
}

export function LeaderboardPage({ onNavigate }: LeaderboardPageProps = {}) {
  const [championships, setChampionships] = useState<any[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    const [sportsRes, matchesRes] = await Promise.all([
      getSports(),
      getUpcomingMatches(6)
    ]);

    if (sportsRes.success) {
      // Transform sports to championship structure
      const transformed = await Promise.all((sportsRes.sports || []).map(async (s) => {
        // Fetch matches for this sport to get stats if possible
        const mRes = await getMatches(s.name, 'Boys'); // Just boys for stats or aggregate?
        // Let's stick to basics for now to avoid too many calls
        const matches = mRes.success ? ((mRes.data || []) as any[]) : [];
        const completed = matches.filter((m: any) => m.status === 'completed').length;

        // Basic team stats calculation for the sidebar in the card
        const teamsMap: Record<string, any> = {};
        matches.forEach((m: any) => {
          if (m.status === 'completed' && m.winner) {
            if (!teamsMap[m.winner]) teamsMap[m.winner] = { name: m.winner, wins: 0, losses: 0, points: 0 };
            teamsMap[m.winner].wins += 1;
            teamsMap[m.winner].points += 2; // Simple 2 points per win

            const loser = m.winner === m.team1Name ? m.team2Name : m.team1Name;
            if (loser && loser !== 'TBD' && !loser.includes('Winner')) {
              if (!teamsMap[loser]) teamsMap[loser] = { name: loser, wins: 0, losses: 0, points: 0 };
              teamsMap[loser].losses += 1;
            }
          }
        });

        return {
          id: s.id,
          name: s.name,
          sport: s.name,
          sportColor: '#3B82F6', // Default or map from category
          format: 'Knockout',
          startDate: s.date,
          endDate: s.date,
          status: s.status?.toLowerCase() || 'upcoming',
          venue: s.venue,
          totalTeams: s.capacity || 0,
          matchesCompleted: completed,
          matchesTotal: matches.length || 0,
          currentRound: s.status === 'Ongoing' ? 'Live Tournament' : (s.status === 'Completed' ? 'Tournament Ended' : 'Pre-Tournament'),
          teams: Object.values(teamsMap).sort((a: any, b: any) => b.points - a.points).slice(0, 4)
        };
      }));
      setChampionships(transformed);
    }

    if (matchesRes.success) {
      setUpcomingMatches(((matchesRes.data || []) as any[]).map((m: any) => ({
        id: m.id,
        championship: `${m.sport} ${m.gender}`,
        sport: m.sport,
        sportColor: '#3B82F6',
        team1: m.team1Name || 'TBD',
        team2: m.team2Name || 'TBD',
        date: m.date || 'TBD',
        time: m.time || 'TBD',
        venue: m.venue || 'TBD',
        round: m.round
      })));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const statuses = ['All', 'ongoing', 'upcoming', 'completed'];

  const filteredChampionships = championships.filter((champ: any) =>
    filterStatus === 'All' || champ.status === filterStatus
  );

  const stats = {
    total: championships.length,
    ongoing: championships.filter((c: any) => c.status === 'ongoing').length,
    upcoming: championships.filter((c: any) => c.status === 'upcoming').length,
    completed: championships.filter((c: any) => c.status === 'completed').length
  };

  const getStatusIcon = (status: any) => {
    switch (status) {
      case 'ongoing':
        return <Play className="w-4 h-4" />;
      case 'upcoming':
        return <Clock className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: any) => {
    switch (status) {
      case 'ongoing':
        return { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' };
      case 'upcoming':
        return { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' };
      case 'completed':
        return { bg: '#D1FAE5', text: '#065F46', dot: '#10B981' };
      default:
        return { bg: '#F3F4F6', text: '#1F2937', dot: '#6B7280' };
    }
  };

  return (
    <div className="p-4 md:p-8 animate-page-entrance">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 text-sm text-[#6B7280] mb-3">
          <span>Dashboard</span>
          <ChevronRight className="w-3 h-3" />
          <span>Sports</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#1A1A1A] font-medium">Championship Tracking</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-[32px] font-bold text-[#1A1A1A] tracking-tight mb-2">Championship Tracking</h1>
            <p className="text-sm md:text-base text-[#6B7280]">Monitor tournament progress and department standings in real-time</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#6B7280] bg-[#F7F8FA] px-3 py-1.5 rounded-full border border-[#E5E7EB]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live Updates
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {isLoading ? (
            [...Array(4)].map((_: any, i: any) => <MetricCardSkeleton key={i} />)
          ) : (
            <>
              <div className="bg-[#F4F2F0] rounded-[20px] p-2 animate-card-entrance" style={{ animationDelay: '100ms' }}>
                <div className="bg-white rounded-[16px] p-5 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                      <Trophy className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Total Championships</div>
                      <div className="text-2xl font-bold text-[#1A1A1A]">{stats.total}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#F4F2F0] rounded-[20px] p-2 animate-card-entrance" style={{ animationDelay: '200ms' }}>
                <div className="bg-white rounded-[16px] p-5 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                      <Play className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Ongoing Events</div>
                      <div className="text-2xl font-bold text-[#3B82F6]">{stats.ongoing}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#F4F2F0] rounded-[20px] p-2 animate-card-entrance" style={{ animationDelay: '300ms' }}>
                <div className="bg-white rounded-[16px] p-5 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                      <Clock className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Starting Soon</div>
                      <div className="text-2xl font-bold text-[#F59E0B]">{stats.upcoming}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#F4F2F0] rounded-[20px] p-2 animate-card-entrance" style={{ animationDelay: '400ms' }}>
                <div className="bg-white rounded-[16px] p-5 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Completed</div>
                      <div className="text-2xl font-bold text-[#10B981]">{stats.completed}</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {statuses.map((status: any) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap capitalize ${filterStatus === status ?
                'bg-[#1A1A1A] text-white shadow-lg' :
                'bg-white border border-[#E5E7EB] text-[#6B7280] hover:border-[#10B981] hover:text-[#10B981]'
                }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Matches Section */}
      {(filterStatus === 'All' || filterStatus === 'ongoing') && (
        <div className="bg-[#F4F2F0] rounded-[24px] mb-10 p-2 pt-6">
          <div className="flex items-center justify-between px-4 mb-4">
            <h2 className="text-xs font-bold text-[#6B7280] uppercase tracking-[0.2em]">Featured Match Schedule</h2>
            <button className="text-[#3B82F6] hover:text-[#2563EB] text-xs font-bold flex items-center gap-1">
              View All Matches <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-white bg-opacity-40 backdrop-blur-md rounded-[20px] p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                [...Array(3)].map((_: any, i: any) => <Skeleton key={i} height={180} className="rounded-2xl" />)
              ) : (
                upcomingMatches.map((match: any) => (
                  <div
                    key={match.id}
                    className="bg-white rounded-[20px] p-5 border border-[#E5E7EB] hover:shadow-xl hover:-translate-y-1 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-5">
                      <span
                        className="px-3 py-1 rounded-full text-[10px] font-bold text-white tracking-widest uppercase"
                        style={{ backgroundColor: match.sportColor }}
                      >
                        {match.sport}
                      </span>
                      <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider bg-gray-50 px-2 py-1 rounded-md">{match.round}</span>
                    </div>

                    <div className="flex items-center justify-between gap-4 mb-6">
                      <div className="flex-1 text-center">
                        <div className="text-sm font-bold text-[#1A1A1A] line-clamp-1">{match.team1}</div>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-[#1A1A1A] text-white text-[10px] font-bold italic">VS</div>
                      <div className="flex-1 text-center">
                        <div className="text-sm font-bold text-[#1A1A1A] line-clamp-1">{match.team2}</div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#F3F4F6] flex flex-wrap items-center gap-y-2 justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#6B7280]">
                          <Calendar className="w-3 h-3 text-indigo-500" />
                          <span>{new Date(match.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#6B7280]">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>{match.time}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#6B7280]">
                        <MapPin className="w-3 h-3 text-rose-500" />
                        <span className="line-clamp-1 max-w-[100px]">{match.venue}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Championships List */}
      <div className="space-y-8">
        {isLoading ? (
          [...Array(2)].map((_: any, i: any) => <Skeleton key={i} height={350} className="rounded-[24px]" />)
        ) : (
          filteredChampionships.map((championship: any) => (
            <div
              key={championship.id}
              className="rounded-[28px] p-2 overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500"
              style={{
                background: `linear-gradient(135deg, ${championship.sportColor}15 0%, ${championship.sportColor}25 100%)`
              }}
            >
              {/* Inner Layout Wrapper */}
              <div className="flex flex-col lg:flex-row gap-6 p-4 md:p-6 lg:p-8">

                {/* Left Side: Info & Progress */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span
                      className="px-4 py-1 rounded-full text-[10px] font-bold tracking-[0.2em] text-white uppercase shadow-sm"
                      style={{ backgroundColor: championship.sportColor }}
                    >
                      {championship.sport}
                    </span>
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold capitalize shadow-sm"
                      style={{
                        backgroundColor: getStatusColor(championship.status).bg,
                        color: getStatusColor(championship.status).text
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getStatusColor(championship.status).dot }} />
                      {championship.status}
                    </span>
                    <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider bg-white bg-opacity-60 px-3 py-1 rounded-full border border-white/40">
                      {championship.format}
                    </span>
                  </div>

                  <h3 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] mb-4 leading-tight">{championship.name}</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <Calendar className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Tournament Dates</div>
                        <div className="text-sm font-bold text-[#1A1A1A]">
                          {new Date(championship.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          {' - '}
                          {new Date(championship.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <MapPin className="w-5 h-5 text-rose-500" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Venue Location</div>
                        <div className="text-sm font-bold text-[#1A1A1A]">{championship.venue}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <Users className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Participants</div>
                        <div className="text-sm font-bold text-[#1A1A1A]">{championship.totalTeams} Department Teams</div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Progress */}
                  <div className="bg-white bg-opacity-50 rounded-2xl p-5 border border-white/50 backdrop-blur-sm shadow-sm mb-4 lg:mb-0">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-[10px] font-bold text-[#6B7280] uppercase mb-1">Overall Progress</div>
                        <div className="text-lg font-bold text-[#1A1A1A]">{championship.currentRound}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-[#6B7280] uppercase mb-1">Matches Done</div>
                        <div className="text-lg font-bold text-[#1A1A1A]">{championship.matchesCompleted} / {championship.matchesTotal}</div>
                      </div>
                    </div>
                    <div className="h-4 bg-white rounded-full overflow-hidden border border-[#E5E7EB] shadow-inner p-1">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end px-2"
                        style={{
                          width: `${(championship.matchesCompleted / championship.matchesTotal) * 100}%`,
                          backgroundColor: championship.sportColor
                        }}
                      >
                        <span className="text-[8px] font-bold text-white">{Math.round((championship.matchesCompleted / championship.matchesTotal) * 100)}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Standings Card */}
                <div className="w-full lg:w-[380px] shrink-0">
                  <div className="bg-white rounded-[24px] shadow-xl overflow-hidden border border-[#E5E7EB]">
                    <div className="px-6 py-5 border-b border-[#F3F4F6] flex items-center justify-between bg-[#F9FAFB]">
                      <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">Standings</h4>
                      <Info className="w-4 h-4 text-[#9CA3AF] cursor-pointer" />
                    </div>
                    <div className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-gray-50/50">
                              <th className="py-3 px-4 text-[9px] font-bold text-[#9CA3AF] uppercase">Team</th>
                              <th className="py-3 px-4 text-[9px] font-bold text-[#9CA3AF] uppercase text-center">W</th>
                              <th className="py-3 px-4 text-[9px] font-bold text-[#9CA3AF] uppercase text-center">Pts</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {championship.teams.map((team: any, index: any) => (
                              <tr key={index} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3">
                                    {championship.status === 'completed' && team.position === 1 ? (
                                      <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                                        <Trophy className="w-3 h-3 text-amber-600" />
                                      </div>
                                    ) : (
                                      <span className="text-[10px] font-bold text-[#9CA3AF] w-4">{index + 1}</span>
                                    )}
                                    <span className="text-xs font-bold text-[#1A1A1A] group-hover:text-[#10B981] transition-colors">{team.name}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-xs font-bold text-[#10B981] text-center">{team.wins}</td>
                                <td className="py-3 px-4 text-xs font-bold text-[#1A1A1A] text-center">{team.points}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="p-4 bg-gray-50">
                        <button
                          onClick={() => onNavigate && onNavigate('championship-bracket')}
                          className="w-full py-3 bg-[#1A1A1A] text-white rounded-xl text-xs font-extrabold uppercase tracking-widest hover:bg-[#333333] transition-all transform active:scale-95 shadow-lg flex items-center justify-center gap-2"
                        >
                          View Full Bracket
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isLoading && (
        <div className="mt-12 text-center text-[#6B7280]">
          <Skeleton width={200} height={20} className="mx-auto" />
        </div>
      )}
    </div>
  );
}
