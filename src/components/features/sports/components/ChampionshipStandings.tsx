import Link from 'next/link';
import { InfoTooltip } from '@/components/InfoTooltip';
import { Skeleton } from '@/components/ui/skeleton';

interface StandingItem {
  branch: string;
  name: string;
  points: number;
  color: string;
  rank: number;
}

interface ChampionshipStandingsProps {
  data?: StandingItem[];
  isLoading: boolean;
}

export function ChampionshipStandings({ data, isLoading }: ChampionshipStandingsProps) {
  const standings = data || [];

  const totalPoints = standings.reduce((sum: any, item: any) => sum + item.points, 0);
  const maxPoints = Math.max(...standings.map((s: any) => s.points), 0);

  return (
    <div className="bg-[#F4F2F0] rounded-[24px] p-[10px] h-full flex flex-col">
      <div className="flex items-center justify-between mt-[10px] mb-[16px] px-[12px] h-8">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-[#7A7772] tracking-[0.05em] uppercase opacity-80">
            CHAMPIONSHIP STANDINGS
          </h3>
          <InfoTooltip text="Overall points leaderboard based on branch performance across all sports." />
        </div>
        <Link href="/sports/points-table" className="text-sm font-bold text-[#10B981] hover:underline uppercase tracking-wider">
          View Leaderboard
        </Link>
      </div>

      <div className="bg-white rounded-[18px] border border-[#E5E7EB] p-6 md:p-8 shadow-sm flex-1 flex flex-col">
        {isLoading ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton width={120} height={12} />
              <Skeleton width={80} height={32} />
              <Skeleton width={100} height={10} />
            </div>
            <div className="space-y-5 pt-4">
              {[1, 2, 3, 4, 5].map((i: any) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton width={100} height={12} />
                    <Skeleton width={40} height={12} />
                  </div>
                  <Skeleton height={8} className="rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Stats Summary */}
            <div className="mb-8">
              <div className="text-[11px] font-bold text-[#7A7772] tracking-wider uppercase mb-1.5">OVERALL PERFORMANCE</div>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl md:text-[32px] font-bold text-[#1A1A1A] tracking-tight">
                  {totalPoints.toLocaleString()}
                </div>
                <span className="text-xs font-semibold text-[#6B7280]">Total Points Dist.</span>
              </div>
              <div className="text-[11px] text-[#9CA3AF] mt-0.5">2024-25 Season Standings</div>
            </div>

            {/* Standings List */}
            <div className="space-y-5">
              {standings.map((item: any, index: any) => {
                const percentageOfMax = maxPoints > 0 ? (item.points / maxPoints) * 100 : 0;
                const percentageOfTotal = totalPoints > 0 ? ((item.points / totalPoints) * 100).toFixed(1) : 0;

                return (
                  <div key={item.branch} className="group cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs font-bold text-[#1A1A1A]">
                          {item.name} ({item.branch})
                        </span>
                      </div>
                      <span className="text-xs font-bold text-[#1A1A1A]">{item.points} pts</span>
                    </div>
                    <div className="relative h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out group-hover:opacity-80"
                        style={{
                          backgroundColor: item.color,
                          width: `${percentageOfMax}%`
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[10px] text-[#9CA3AF] font-medium">
                        {percentageOfTotal}% of total share
                      </span>
                      <div className="flex items-center gap-1">
                        <span className={`text-[10px] font-bold ${index === 0 ? 'text-[#F59E0B]' :
                          index === 1 ? 'text-[#94A3B8]' :
                            index === 2 ? 'text-[#B45309]' : 'text-[#9CA3AF]'
                          }`}>
                          RANK #{item.rank}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
