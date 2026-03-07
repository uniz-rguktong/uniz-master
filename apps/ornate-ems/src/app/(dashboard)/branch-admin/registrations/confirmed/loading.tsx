import { Skeleton, MetricCardSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="p-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="flex gap-2 mb-3">
          <Skeleton width={200} height={16} />
        </div>
        <div className="flex justify-between mb-6">
          <div className="space-y-2">
            <Skeleton width={250} height={32} />
            <Skeleton width={300} height={16} />
          </div>
          <div className="flex gap-3">
            <Skeleton width={120} height={40} />
          </div>
        </div>

        {/* Metrics Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="bg-[#F4F2F0] rounded-[18px] p-[10px] mb-6">
        <div className="bg-white rounded-[14px] p-5">
          <Skeleton width="100%" height={45} />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-[#F4F2F0] rounded-[18px] mb-8 p-2.5 pt-6">
        <div className="bg-white rounded-[12px] border border-[#E5E7EB] overflow-hidden p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_: any, i: any) => (
              <div key={i} className="flex gap-4">
                <Skeleton width="100%" height={40} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
