'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Trophy, MapPin, Calendar } from 'lucide-react';
import { InfoTooltip } from '@/components/InfoTooltip';
import { Skeleton } from '@/components/ui/skeleton';

interface UpcomingMatchItem {
  id: string;
  sport: string;
  gender: string;
  round: string;
  team1Name?: string;
  team1Id?: string;
  team2Name?: string;
  team2Id?: string;
  date?: string;
  time?: string;
  venue?: string;
}

interface UpcomingMatchesProps {
  data?: UpcomingMatchItem[];
  isLoading: boolean;
}

export function UpcomingMatches({ data, isLoading }: UpcomingMatchesProps) {
  const [activeFilter, setActiveFilter] = useState('All');

  const matches = (data || []).map((m: any) => ({
    sport: m.sport,
    category: m.gender,
    round: m.round,
    team1: m.team1Name || 'TBD',
    team1Id: m.team1Id,
    team2: m.team2Name || 'TBD',
    team2Id: m.team2Id,
    date: m.date ? new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD',
    time: m.time || 'TBD',
    venue: m.venue || 'TBD',
    isToday: m.date ? new Date(m.date).toDateString() === new Date().toDateString() : false
  }));

  const filteredMatches = activeFilter === 'Today'
    ? matches.filter(m => m.isToday)
    : matches;

  return (
    <div className="bg-[#F4F2F0] rounded-[24px] p-[10px] h-full flex flex-col">
      <div className="flex items-center justify-between mt-[10px] mb-[16px] px-[12px]">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-[#7A7772] tracking-[0.05em] uppercase opacity-80">
            UPCOMING TOURNAMENT MATCHES
          </h3>
          <InfoTooltip text="Chronological list of all upcoming tournament matches across different sports and categories." />
        </div>
        <div className="flex gap-2">
          {['All', 'Today'].map((filter: any) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all uppercase tracking-wider ${activeFilter === filter ? 'bg-[#1A1A1A] text-white shadow-sm' : 'bg-white/50 text-[#6B7280] hover:bg-white'
                }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[18px] border border-[#E5E7EB] p-5 md:p-8 shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="space-y-4 overflow-y-auto pr-1">
          {isLoading ? (
            [1, 2, 3].map((i: any) => (
              <div key={i} className="p-4 rounded-2xl border border-[#E5E7EB] bg-gray-50/50 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-14 w-full rounded-xl" />
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))
          ) : filteredMatches.length > 0 ? (
            filteredMatches.map((match: any, index: any) => (
              <div key={index} className="p-4 rounded-2xl border border-[#E5E7EB] hover:border-[#10B981] transition-all group cursor-pointer bg-gray-50/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center`}>
                      <Trophy className="w-4 h-4 text-[#1A1A1A]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1A1A1A]">{match.sport} ({match.category})</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-bold uppercase tracking-wider">
                        {match.round}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-white rounded-xl p-3 border border-gray-100 shadow-sm mb-3">
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-[10px] mb-1">
                      {match.team1.substring(0, 2)}
                    </div>
                    <span className="text-xs font-bold text-[#1A1A1A]">{match.team1}</span>
                  </div>
                  <div className="flex flex-col items-center px-4">
                    <span className="text-[10px] font-bold text-[#9CA3AF]">VS</span>
                  </div>
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-[10px] mb-1">
                      {match.team2.substring(0, 2)}
                    </div>
                    <span className="text-xs font-bold text-[#1A1A1A]">{match.team2}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[#6B7280]">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-xs font-semibold">{match.date} • {match.time}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span className="text-xs font-semibold">{match.venue}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-[#9CA3AF]">
              <Calendar className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-sm font-medium">No matches scheduled for {activeFilter.toLowerCase()}</p>
            </div>
          )}
        </div>

        <Link href="/sports/match-schedule" className="w-full mt-6 py-3 border border-[#E5E7EB] rounded-xl text-sm font-bold text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#1A1A1A] transition-all uppercase tracking-wider text-center">
          View All Schedule
        </Link>
      </div>
    </div>
  );
}
