import { Skeleton } from "@/components/ui/skeleton";
import { MetricCardSkeleton } from "@/components/ui/skeleton";

export function MetricsSectionSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
        </div>
    );
}

export function ChartsSectionSkeleton() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
                <Skeleton height={340} borderRadius={16} />
            </div>
            <div>
                <Skeleton height={340} borderRadius={16} />
            </div>
        </div>
    );
}

export function TransactionsSectionSkeleton() {
    return (
        <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
            <div className="bg-white rounded-[14px] border border-[#E5E7EB] overflow-hidden p-6 space-y-4">
                <Skeleton width="40%" height={24} />
                <div className="space-y-3">
                    <Skeleton width="100%" height={40} />
                    <Skeleton width="100%" height={40} />
                    <Skeleton width="100%" height={40} />
                </div>
            </div>
        </div>
    );
}
