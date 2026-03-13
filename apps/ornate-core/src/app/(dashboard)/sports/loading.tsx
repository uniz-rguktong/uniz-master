
import { MetricCardSkeleton, Skeleton } from '@/components/ui/skeleton';

export default function SportsPortalLoading() {
    return (
        <div className="p-4 md:p-8 animate-pulse">
            <div className="mb-8">
                <Skeleton width={250} height={32} borderRadius={8} className="mb-6" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                    <MetricCardSkeleton />
                    <MetricCardSkeleton />
                    <MetricCardSkeleton />
                    <MetricCardSkeleton />
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2">
                    <Skeleton width="100%" height={340} borderRadius={16} className="" />
                </div>
                <div>
                    <Skeleton width="100%" height={340} borderRadius={16} className="" />
                </div>
            </div>
        </div>
    );
}
