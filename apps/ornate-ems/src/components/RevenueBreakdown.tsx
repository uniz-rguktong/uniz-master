import { Sparkles } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';
import { Skeleton } from '@/components/ui/skeleton';

interface RevenueBreakdownItem {
  category: string;
  value: number;
  color: string;
}

interface RevenueBreakdownProps {
  data?: RevenueBreakdownItem[] | undefined;
  isLoading?: boolean;
}

export function RevenueBreakdown({ data, isLoading = false }: RevenueBreakdownProps) {
  const categoryData = data || [];
  const totalRegistrations = categoryData.reduce((sum: any, cat: any) => sum + cat.value, 0);
  const maxValue = categoryData.length > 0 ? Math.max(...categoryData.map((d: any) => d.value)) : 1;

  return (
    <div className="bg-[#F4F2F0] rounded-[18px] p-[10px] h-full flex flex-col">
      <div className="flex items-center justify-between mt-[10px] mb-[16px] px-[12px]">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-[#7A7772] tracking-[0.05em] uppercase opacity-80">
            Registrations by Category
          </h3>
          <InfoTooltip text="Distribution of student registrations across different event categories." />
        </div>
        {/* Placeholder for alignment with Trend component button */}
        <div className="w-8 h-8 pointer-events-none"></div>
      </div>

      <div className="bg-white rounded-[16px] p-4 md:p-8 shadow-sm flex-1 flex flex-col min-h-[400px] md:min-h-[500px]">
        {isLoading ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton width={120} height={12} />
              <Skeleton width={80} height={32} />
              <Skeleton width={100} height={10} />
            </div>
            <div className="space-y-4 pt-4">
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
            {/* Stats */}
            <div className="flex flex-wrap items-start justify-between mb-6 md:mb-[32px]">
              <div>
                <div className="text-xs font-bold text-[#7A7772] tracking-wider uppercase mb-1.5">Category Breakdown</div>
                <div className="text-[24px] md:text-[32px] font-bold text-[#1F1F1F] tracking-tight">{totalRegistrations.toLocaleString()}</div>
                <div className="text-[11px] text-[#9CA3AF] mt-0.5">Based on current database data</div>
              </div>
            </div>

            {/* Category List with Bars */}
            <div className="space-y-4">
              {categoryData.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center text-[#9CA3AF] h-32">
                  <p className="text-sm">No data available.</p>
                </div>
              ) : (
                categoryData.map((data: any) => {
                  const percentage = maxValue > 0 ? (data.value / maxValue * 100) : 0;
                  const totalPercentage = totalRegistrations > 0
                    ? (data.value / totalRegistrations * 100).toFixed(1)
                    : '0.0';

                  return (
                    <div key={data.category} className="group cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: data.color }}>
                          </div>
                          <span className="text-xs font-medium text-[#1A1A1A]">{data.category}</span>
                        </div>
                        <span className="text-xs font-semibold text-[#1A1A1A]">{data.value}</span>
                      </div>
                      <div className="relative h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full transition-all group-hover:opacity-80"
                          style={{
                            backgroundColor: data.color,
                            width: `${percentage}%`
                          }}>
                        </div>
                      </div>
                      <div className="text-[10px] text-[#9CA3AF] mt-1">{totalPercentage}% of total</div>
                    </div>
                  );
                }))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}