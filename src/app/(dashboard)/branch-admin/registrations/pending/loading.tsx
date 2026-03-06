import { Skeleton, MetricCardSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <div className="p-8 animate-pulse">
            {/* Header Skeleton */}
            <div className="mb-8">
                <div className="flex gap-2 mb-3">
                    <Skeleton width={200} height={16} />
                </div>
                <div className="mb-6">
                    <Skeleton width={250} height={32} className="mb-2" />
                    <Skeleton width={300} height={16} />
                </div>

                {/* Metrics Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <MetricCardSkeleton />
                    <MetricCardSkeleton />
                    <MetricCardSkeleton />
                    <MetricCardSkeleton />
                </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="bg-[#F4F2F0] rounded-[18px] p-[10px] mb-6">
                <div className="bg-white rounded-[14px] p-2 flex gap-2">
                    <Skeleton width="50%" height={45} />
                    <Skeleton width="50%" height={45} />
                </div>
            </div>

            {/* List Skeleton */}
            <div className="space-y-4">
                {[...Array(3)].map((_: any, i: any) => (
                    <div key={i} className="bg-[#F4F2F0] rounded-[16px] p-4 text-center">
                        <Skeleton width="100%" height={200} borderRadius={16} />
                    </div>
                ))}
            </div>
        </div>
    );
}
