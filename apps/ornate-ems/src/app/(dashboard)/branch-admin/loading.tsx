import { MetricCardSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-8 animate-pulse">
      {/* Title Skeleton */}
      <div className="mb-8">
        <Skeleton width={250} height={32} className="mb-6" />

        {/* Metric Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>
      </div>

      {/* Charts Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <Skeleton height={340} borderRadius={16} />
        </div>
        <div>
          <Skeleton height={340} borderRadius={16} />
        </div>
      </div>

      {/* Table Section Skeleton */}
      <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
        <div className="bg-white rounded-[14px] border border-[#E5E7EB] overflow-hidden p-6 space-y-4">
          <Skeleton width="40%" height={24} />
          <div className="space-y-3">
            <Skeleton width="100%" height={40} />
            <Skeleton width="100%" height={40} />
            <Skeleton width="100%" height={40} />
            <Skeleton width="100%" height={40} />
          </div>
        </div>
      </div>
    </div>
  );
}
