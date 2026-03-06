'use client';
import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Award, Medal, Download } from 'lucide-react';
import { Skeleton, MetricCardSkeleton } from '@/components/ui/skeleton';

const results = [
  {
    id: 1,
    sport: 'Cricket',
    sportColor: '#3B82F6',
    championship: 'Inter-Department Cricket Championship',
    matchType: 'Semi-Final 1',
    date: '2025-11-22',
    team1: {
      name: 'CSE Thunder',
      score: '185/8',
      result: 'won'
    },
    team2: {
      name: 'EEE Lightning',
      score: '142/10',
      result: 'lost'
    },
    winner: 'CSE Thunder',
    margin: '43 runs',
    manOfTheMatch: 'Raj Kumar (CSE)'
  },
  {
    id: 2,
    sport: 'Basketball',
    sportColor: '#F59E0B',
    championship: 'Basketball League 2025',
    matchType: 'League Match',
    date: '2025-11-20',
    team1: {
      name: 'Hoop Masters',
      score: '78',
      result: 'won'
    },
    team2: {
      name: 'Court Kings',
      score: '72',
      result: 'lost'
    },
    winner: 'Hoop Masters',
    margin: '6 points',
    manOfTheMatch: 'Michael Jordan (III Year)'
  },
  {
    id: 3,
    sport: 'Volleyball',
    sportColor: '#EF4444',
    championship: 'Volleyball Tournament',
    matchType: 'Final',
    date: '2025-10-24',
    team1: {
      name: 'Ace Servers',
      score: '3',
      result: 'won'
    },
    team2: {
      name: 'Spike Kings',
      score: '1',
      result: 'lost'
    },
    winner: 'Ace Servers',
    margin: '3-1 sets',
    manOfTheMatch: 'Sarah Williams (II Year)'
  },
  {
    id: 4,
    sport: 'Football',
    sportColor: '#10B981',
    championship: 'Football Championship',
    matchType: 'Quarter-Final',
    date: '2025-11-18',
    team1: {
      name: 'Goal Crushers',
      score: '2',
      result: 'won'
    },
    team2: {
      name: 'Kick Masters',
      score: '1',
      result: 'lost'
    },
    winner: 'Goal Crushers',
    margin: '1 goal',
    manOfTheMatch: 'David Chen (IV Year)'
  }];


const leaderboards = [
  {
    sport: 'Cricket',
    sportColor: '#3B82F6',
    teams: [
      { rank: 1, name: 'CSE Thunder', played: 3, won: 3, lost: 0, points: 6 },
      { rank: 2, name: 'ECE Warriors', played: 3, won: 2, lost: 1, points: 4 },
      { rank: 3, name: 'Mech Strikers', played: 3, won: 1, lost: 2, points: 2 },
      { rank: 4, name: 'Civil Champions', played: 3, won: 0, lost: 3, points: 0 }]

  },
  {
    sport: 'Basketball',
    sportColor: '#F59E0B',
    teams: [
      { rank: 1, name: 'Hoop Masters', played: 5, won: 5, lost: 0, points: 10 },
      { rank: 2, name: 'Court Kings', played: 5, won: 3, lost: 2, points: 6 },
      { rank: 3, name: 'Slam Dunkers', played: 5, won: 2, lost: 3, points: 4 },
      { rank: 4, name: 'Net Warriors', played: 5, won: 0, lost: 5, points: 0 }]

  }];


export function SportsResultsPage() {
  const [filterSport, setFilterSport] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const sports = ['All', 'Cricket', 'Basketball', 'Football', 'Volleyball'];

  const filteredResults = results.filter((result: any) =>
    filterSport === 'All' || result.sport === filterSport
  );

  return (
    <div className="p-8 animate-page-entrance">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
          <span>Dashboard</span>
          <span>›</span>
          <span>Sports</span>
          <span>›</span>
          <span className="text-[#1A1A1A] font-medium">Results & Leaderboard</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[28px] font-semibold text-[#1A1A1A] mb-2">Results & Leaderboard</h1>
            <p className="text-sm text-[#6B7280]">View match results and championship standings</p>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#1A1A1A] hover:bg-[#F7F8FA] transition-colors">
            <Download className="w-4 h-4" />
            Download Report
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {isLoading ? (
            [...Array(4)].map((_: any, i: any) => <MetricCardSkeleton key={i} />)
          ) : (
            <>
              <div className="animate-card-entrance" style={{ animationDelay: '40ms' }}>
                <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#DBEAFE] rounded-lg flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-[#3B82F6]" />
                    </div>
                    <div>
                      <div className="text-sm text-[#6B7280]">Matches Played</div>
                      <div className="text-2xl font-semibold text-[#1A1A1A]">{results.length}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="animate-card-entrance" style={{ animationDelay: '80ms' }}>
                <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#D1FAE5] rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-[#10B981]" />
                    </div>
                    <div>
                      <div className="text-sm text-[#6B7280]">Championships</div>
                      <div className="text-2xl font-semibold text-[#1A1A1A]">4</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="animate-card-entrance" style={{ animationDelay: '120ms' }}>
                <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#FEF3C7] rounded-lg flex items-center justify-center">
                      <Award className="w-5 h-5 text-[#F59E0B]" />
                    </div>
                    <div>
                      <div className="text-sm text-[#6B7280]">Total Teams</div>
                      <div className="text-2xl font-semibold text-[#1A1A1A]">24</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="animate-card-entrance" style={{ animationDelay: '160ms' }}>
                <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#F5F3FF] rounded-lg flex items-center justify-center">
                      <Medal className="w-5 h-5 text-[#8B5CF6]" />
                    </div>
                    <div>
                      <div className="text-sm text-[#6B7280]">Active Players</div>
                      <div className="text-2xl font-semibold text-[#1A1A1A]">180+</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          {sports.map((sport: any) =>
            <button
              key={sport}
              onClick={() => setFilterSport(sport)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterSport === sport ?
                'bg-[#1A1A1A] text-white' :
                'bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F7F8FA]'}`
              }>

              {sport}
            </button>
          )}
        </div>
      </div>

      {/* Recent Results */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">Recent Match Results</h2>
        <div className="space-y-4">
          {isLoading ? (
            [...Array(3)].map((_: any, i: any) => (
              <div key={i} className="bg-white rounded-xl border border-[#E5E7EB] p-6 space-y-4 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton width={80} height={24} borderRadius={12} />
                    <Skeleton width={200} height={20} />
                  </div>
                  <Skeleton width={100} height={16} />
                </div>
                <div className="flex items-center justify-center gap-12 py-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton width="60%" height={24} className="mx-auto" />
                    <Skeleton width="40%" height={32} className="mx-auto" />
                  </div>
                  <Skeleton width={40} height={40} />
                  <div className="flex-1 space-y-2">
                    <Skeleton width="60%" height={24} className="mx-auto" />
                    <Skeleton width="40%" height={32} className="mx-auto" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            filteredResults.map((result: any, index: any) => (
              <div
                key={result.id}
                className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden hover:shadow-md transition-all animate-card-entrance"
                style={{ animationDelay: `${index * 100 + 200}ms` }}
              >
                {/* Header */}
                <div
                  className="px-6 py-3 flex items-center justify-between"
                  style={{ backgroundColor: `${result.sportColor}15` }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: result.sportColor }}
                    >
                      {result.sport}
                    </span>
                    <span className="text-sm font-semibold text-[#1A1A1A]">{result.championship}</span>
                    <span className="text-sm text-[#6B7280]">•</span>
                    <span className="text-sm text-[#6B7280]">{result.matchType}</span>
                  </div>
                  <div className="text-sm text-[#6B7280]">
                    {new Date(result.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </div>

                {/* Match Score */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    {/* Team 1 */}
                    <div className={`flex-1 text-center py-4 px-6 rounded-lg ${result.team1.result === 'won' ? 'bg-[#D1FAE5]' : 'bg-[#F7F8FA]'}`}>
                      <div className={`text-lg font-bold mb-2 ${result.team1.result === 'won' ? 'text-[#065F46]' : 'text-[#6B7280]'}`}>
                        {result.team1.name}
                      </div>
                      <div className={`text-3xl font-bold ${result.team1.result === 'won' ? 'text-[#10B981]' : 'text-[#1A1A1A]'}`}>
                        {result.team1.score}
                      </div>
                      {result.team1.result === 'won' && (
                        <div className="mt-2 text-center">
                          <Trophy className="w-5 h-5 text-[#10B981] mx-auto" />
                        </div>
                      )}
                    </div>

                    <div className="px-6 text-2xl font-bold text-[#6B7280]">VS</div>

                    {/* Team 2 */}
                    <div className={`flex-1 text-center py-4 px-6 rounded-lg ${result.team2.result === 'won' ? 'bg-[#D1FAE5]' : 'bg-[#F7F8FA]'}`}>
                      <div className={`text-lg font-bold mb-2 ${result.team2.result === 'won' ? 'text-[#065F46]' : 'text-[#6B7280]'}`}>
                        {result.team2.name}
                      </div>
                      <div className={`text-3xl font-bold ${result.team2.result === 'won' ? 'text-[#10B981]' : 'text-[#1A1A1A]'}`}>
                        {result.team2.score}
                      </div>
                      {result.team2.result === 'won' && (
                        <div className="mt-2 text-center">
                          <Trophy className="w-5 h-5 text-[#10B981] mx-auto" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Match Details */}
                  <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
                    <div>
                      <div className="text-sm text-[#6B7280] mb-1">Winner</div>
                      <div className="text-base font-bold text-[#10B981]">{result.winner}</div>
                    </div>
                    <div>
                      <div className="text-sm text-[#6B7280] mb-1">Margin</div>
                      <div className="text-base font-semibold text-[#1A1A1A]">{result.margin}</div>
                    </div>
                    <div>
                      <div className="text-sm text-[#6B7280] mb-1">Man of the Match</div>
                      <div className="text-base font-semibold text-[#1A1A1A] flex items-center gap-2">
                        <Award className="w-4 h-4 text-[#F59E0B]" />
                        {result.manOfTheMatch}
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-[#F7F8FA] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#1A1A1A] transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Leaderboards */}
      <div className="pb-8">
        <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">Championship Leaderboards</h2>
        <div className="grid grid-cols-2 gap-6">
          {isLoading ? (
            [...Array(2)].map((_: any, i: any) => (
              <div key={i} className="bg-white rounded-xl border border-[#E5E7EB] p-6 space-y-4 animate-pulse">
                <Skeleton width="100%" height={300} borderRadius={12} />
              </div>
            ))
          ) : (
            leaderboards.map((leaderboard: any, index: any) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden animate-card-entrance"
                style={{ animationDelay: `${index * 100 + 400}ms` }}
              >
                {/* Header */}
                <div
                  className="px-6 py-4 flex items-center justify-between"
                  style={{ backgroundColor: `${leaderboard.sportColor}15` }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: leaderboard.sportColor }}
                    >
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-base font-bold text-[#1A1A1A]">{leaderboard.sport} Championship</h3>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#E5E7EB] bg-[#F7F8FA]">
                        <th className="text-left py-3 px-6 text-xs font-semibold text-[#6B7280]">RANK</th>
                        <th className="text-left py-3 px-6 text-xs font-semibold text-[#6B7280]">TEAM</th>
                        <th className="text-left py-3 px-6 text-xs font-semibold text-[#6B7280]">P</th>
                        <th className="text-left py-3 px-6 text-xs font-semibold text-[#6B7280]">W</th>
                        <th className="text-left py-3 px-6 text-xs font-semibold text-[#6B7280]">L</th>
                        <th className="text-left py-3 px-6 text-xs font-semibold text-[#6B7280]">PTS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.teams.map((team: any) => (
                        <tr
                          key={team.rank}
                          className={`border-b border-[#E5E7EB] ${team.rank === 1 ? 'bg-[#FEF3C7] bg-opacity-30' : ''}`}
                        >
                          <td className="py-3 px-6">
                            {team.rank === 1 ? (
                              <div className="flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-[#F59E0B]" />
                                <span className="font-bold text-[#F59E0B]">{team.rank}</span>
                              </div>
                            ) : (
                              <span className="font-semibold text-[#6B7280]">{team.rank}</span>
                            )}
                          </td>
                          <td className="py-3 px-6 font-semibold text-[#1A1A1A]">{team.name}</td>
                          <td className="py-3 px-6 text-[#6B7280]">{team.played}</td>
                          <td className="py-3 px-6 text-[#10B981] font-semibold">{team.won}</td>
                          <td className="py-3 px-6 text-[#EF4444] font-semibold">{team.lost}</td>
                          <td className="py-3 px-6 font-bold text-[#1A1A1A]">{team.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>);

}