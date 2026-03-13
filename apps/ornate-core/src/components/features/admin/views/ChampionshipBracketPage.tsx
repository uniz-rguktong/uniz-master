'use client';
import { useState, useEffect } from 'react';
import { Trophy, Calendar, Users, Award, ChevronRight, Info, MapPin, Clock } from 'lucide-react';
import { Skeleton, MetricCardSkeleton } from '@/components/ui/skeleton';

const bracketData = {
  championship: 'Inter-Department Cricket Championship 2025',
  sport: 'Cricket',
  sportColor: '#3B82F6',
  format: 'Single Elimination',
  startDate: '2025-11-25',
  endDate: '2025-11-28',
  totalTeams: 8,

  rounds: [
    {
      name: 'Quarter Finals',
      matches: [
        {
          id: 1,
          team1: { name: 'CSE Thunder', score: '185/8', won: true },
          team2: { name: 'EEE Lightning', score: '142/10', won: false },
          date: '2025-11-25',
          time: '10:00 AM',
          status: 'completed'
        },
        {
          id: 2,
          team1: { name: 'ECE Warriors', score: '168/6', won: true },
          team2: { name: 'IT Strikers', score: '165/9', won: false },
          date: '2025-11-25',
          time: '2:30 PM',
          status: 'completed'
        },
        {
          id: 3,
          team1: { name: 'Mech Strikers', score: '195/7', won: true },
          team2: { name: 'Aero Eagles', score: '178/10', won: false },
          date: '2025-11-26',
          time: '10:00 AM',
          status: 'completed'
        },
        {
          id: 4,
          team1: { name: 'Civil Champions', score: '156/8', won: true },
          team2: { name: 'Chemical Kings', score: '152/9', won: false },
          date: '2025-11-26',
          time: '2:30 PM',
          status: 'completed'
        }]

    },
    {
      name: 'Semi Finals',
      matches: [
        {
          id: 5,
          team1: { name: 'CSE Thunder', score: null, won: null },
          team2: { name: 'ECE Warriors', score: null, won: null },
          date: '2025-11-27',
          time: '10:00 AM',
          status: 'scheduled'
        },
        {
          id: 6,
          team1: { name: 'Mech Strikers', score: null, won: null },
          team2: { name: 'Civil Champions', score: null, won: null },
          date: '2025-11-27',
          time: '2:30 PM',
          status: 'scheduled'
        }]

    },
    {
      name: 'Final',
      matches: [
        {
          id: 7,
          team1: { name: 'TBD', score: null, won: null },
          team2: { name: 'TBD', score: null, won: null },
          date: '2025-11-28',
          time: '3:00 PM',
          status: 'pending'
        }]

    }]

};

export function ChampionshipBracketPage() {
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  return (
    <div className="p-4 md:p-8 animate-page-entrance">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 text-sm text-[#6B7280] mb-4">
          <span>Dashboard</span>
          <ChevronRight className="w-3 h-3" />
          <span>Sports</span>
          <ChevronRight className="w-3 h-3" />
          <span>Championship Tracking</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#1A1A1A] font-medium">Tournament Bracket</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <h1 className="text-xl md:text-[28px] font-black text-[#1A1A1A] tracking-tight">{bracketData.championship}</h1>
              <span
                className="px-4 py-1 rounded-full text-[10px] font-black tracking-widest text-white uppercase shadow-sm shrink-0"
                style={{ backgroundColor: bracketData.sportColor }}>
                {bracketData.sport}
              </span>
            </div>
            <p className="text-sm md:text-base text-[#6B7280] font-medium">
              {bracketData.format} • {new Date(bracketData.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(bracketData.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-black text-[#6B7280] bg-[#F7F8FA] px-4 py-2 rounded-full border border-[#E5E7EB] uppercase tracking-wider shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Bracket Visualization
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {isLoading ? (
            [...Array(4)].map((_: any, i: any) => <MetricCardSkeleton key={i} />)
          ) : (
            <>
              <div className="bg-[#F4F2F0] rounded-[20px] p-2">
                <div className="bg-white rounded-[16px] p-5 shadow-sm border border-transparent hover:border-indigo-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                      <Users className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-[#6B7280] uppercase tracking-wider mb-1">Total Teams</div>
                      <div className="text-2xl font-black text-[#1A1A1A]">{bracketData.totalTeams}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#F4F2F0] rounded-[20px] p-2">
                <div className="bg-white rounded-[16px] p-5 shadow-sm border border-transparent hover:border-emerald-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                      <Trophy className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-[#6B7280] uppercase tracking-wider mb-1">Matches Done</div>
                      <div className="text-2xl font-black text-[#10B981]">4/7</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#F4F2F0] rounded-[20px] p-2">
                <div className="bg-white rounded-[16px] p-5 shadow-sm border border-transparent hover:border-amber-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                      <Calendar className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-[#6B7280] uppercase tracking-wider mb-1">Current Phase</div>
                      <div className="text-lg font-black text-[#1A1A1A] truncate">Semi Finals</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#F4F2F0] rounded-[20px] p-2">
                <div className="bg-white rounded-[16px] p-5 shadow-sm border border-transparent hover:border-rose-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center shrink-0">
                      <Award className="w-6 h-6 text-rose-600" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-[#6B7280] uppercase tracking-wider mb-1">Champion</div>
                      <div className="text-lg font-black text-rose-500">TBD</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tournament Bracket Visualization Area */}
      <div className="relative mb-12">
        {/* Mobile Swipe Hint */}
        <div className="flex lg:hidden items-center justify-center gap-2 mb-4 text-[#6B7280] animate-pulse">
          <Info className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Swipe horizontally to view full bracket</span>
        </div>

        <div className="bg-[#F4F2F0] rounded-[32px] p-2 md:p-4">
          <div className="bg-white rounded-[28px] border border-[#E5E7EB] p-6 md:p-12 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            {isLoading ? (
              <div className="min-w-[1200px] h-[500px] flex items-center justify-center">
                <Skeleton width="100%" height="100%" className="rounded-2xl" />
              </div>
            ) : (
              <div className="min-w-[1000px] lg:min-w-full">
                <div className="flex gap-12 justify-between items-start">
                  {bracketData.rounds.map((round: any, roundIndex: any) => (
                    <div key={roundIndex} className="flex-1 flex flex-col">
                      {/* Round Header */}
                      <div className="text-center mb-10">
                        <div className="inline-block px-8 py-2.5 bg-[#1A1A1A] text-white rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-xl">
                          {round.name}
                        </div>
                      </div>

                      {/* Matches Container */}
                      <div className="flex flex-col justify-around grow space-y-12">
                        {round.matches.map((match: any, matchIndex: any) => (
                          <div
                            key={match.id}
                            className="relative"
                          >
                            <div
                              className={`group relative bg-white border-2 rounded-[24px] overflow-hidden transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl ${match.status === 'completed' ? 'border-[#10B981]' :
                                match.status === 'scheduled' ? 'border-[#3B82F6]' :
                                  'border-[#E5E7EB]'
                                }`}
                              onClick={() => setSelectedMatch(match.id)}
                            >
                              {/* Match ID & Status Badge */}
                              <div className="px-5 py-2.5 bg-[#F9FAFB] border-b border-[#E5E7EB] flex items-center justify-between">
                                <span className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-wider">
                                  Match #{match.id}
                                </span>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${match.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                                  match.status === 'scheduled' ? 'bg-blue-50 text-blue-600' :
                                    'bg-gray-50 text-gray-500'
                                  }`}>
                                  {match.status}
                                </span>
                              </div>

                              {/* Team 1 */}
                              <div className={`px-5 py-4 border-b border-[#F3F4F6] flex items-center justify-between group/team transition-colors ${match.team1.won ? 'bg-emerald-50/50' : 'bg-white'
                                }`}>
                                <div className="flex items-center gap-3">
                                  {match.team1.won && <Trophy className="w-4 h-4 text-[#10B981] shrink-0" />}
                                  <span className={`text-sm font-black transition-colors ${match.team1.won ? 'text-emerald-700' : 'text-[#1A1A1A]'
                                    }`}>
                                    {match.team1.name}
                                  </span>
                                </div>
                                {match.team1.score && (
                                  <span className={`text-sm font-black ${match.team1.won ? 'text-emerald-600' : 'text-[#9CA3AF]'}`}>
                                    {match.team1.score}
                                  </span>
                                )}
                              </div>

                              {/* Team 2 */}
                              <div className={`px-5 py-4 flex items-center justify-between group/team transition-colors ${match.team2.won ? 'bg-emerald-50/50' : 'bg-white'
                                }`}>
                                <div className="flex items-center gap-3">
                                  {match.team2.won && <Trophy className="w-4 h-4 text-[#10B981] shrink-0" />}
                                  <span className={`text-sm font-black transition-colors ${match.team2.won ? 'text-emerald-700' : 'text-[#1A1A1A]'
                                    }`}>
                                    {match.team2.name}
                                  </span>
                                </div>
                                {match.team2.score && (
                                  <span className={`text-sm font-black ${match.team2.won ? 'text-emerald-600' : 'text-[#9CA3AF]'}`}>
                                    {match.team2.score}
                                  </span>
                                )}
                              </div>

                              {/* Match Footer */}
                              {match.date && (
                                <div className="px-5 py-2.5 bg-gray-50/50 border-t border-[#F3F4F6] flex items-center justify-between">
                                  <div className="flex items-center gap-3 text-[10px] font-bold text-[#6B7280]">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3 text-indigo-400" />
                                      {new Date(match.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-amber-400" />
                                      {match.time}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Corrected Connector Lines */}
                            {roundIndex < bracketData.rounds.length - 1 && (
                              <div className="absolute top-1/2 -right-12 w-12 h-0.5 bg-[#E5E7EB] z-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Ultimate Champion Section */}
                  <div className="flex items-center justify-center shrink-0">
                    <div className="w-56 mt-20">
                      <div className="text-center mb-8">
                        <div className="inline-block px-10 py-3 bg-linear-to-r from-amber-400 via-orange-500 to-rose-600 text-white rounded-full text-xs font-black uppercase tracking-[0.3em] shadow-2xl animate-pulse">
                          🏆 Champion
                        </div>
                      </div>
                      <div className="relative group">
                        <div className="absolute -inset-1 bg-linear-to-r from-amber-400 to-rose-500 rounded-[32px] blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-white bg-opacity-90 backdrop-blur-xl border-4 border-amber-200 rounded-[28px] p-8 text-center ring-1 ring-amber-100/50 shadow-2xl">
                          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-amber-100 border-2 border-white">
                            <Trophy className="w-10 h-10 text-amber-500 animate-bounce" />
                          </div>
                          <div className="text-lg font-black text-[#1A1A1A] leading-tight mb-2 tracking-tight">TO BE DECIDED</div>
                          <div className="text-[10px] font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full inline-block">
                            Final on Nov 28
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend & Summary */}
      <div className="bg-[#F4F2F0] rounded-[24px] p-2">
        <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="w-full lg:w-auto">
              <h3 className="text-xs font-black text-[#1A1A1A] uppercase tracking-[0.2em] mb-4">Bracket Legend</h3>
              <div className="flex flex-wrap items-center gap-y-4 gap-x-8">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-emerald-50 border-2 border-[#10B981] rounded-lg"></div>
                  <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Completed</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-blue-50 border-2 border-[#3B82F6] rounded-lg"></div>
                  <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Scheduled</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-white border-2 border-[#E5E7EB] rounded-lg"></div>
                  <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Pending</span>
                </div>
                <div className="flex items-center gap-3">
                  <Trophy className="w-4 h-4 text-[#10B981]" />
                  <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Winner</span>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-auto flex items-center gap-4 bg-gray-50 px-6 py-4 rounded-2xl border border-dashed border-gray-200">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Info className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-wider">Live Tracking</div>
                <div className="text-xs font-medium text-[#6B7280]">Scores update automatically after each session</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}