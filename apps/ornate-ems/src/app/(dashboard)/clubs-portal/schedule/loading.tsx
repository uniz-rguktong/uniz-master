import { Skeleton } from '@/components/ui/skeleton';

export default function ClubsScheduleLoading() {
    return (
        <div className="p-4 md:p-8 animate-pulse">
            <Skeleton width={240} height={32} borderRadius={8} className="mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                <Skeleton width="100%" height={96} borderRadius={14} />
                <Skeleton width="100%" height={96} borderRadius={14} />
                <Skeleton width="100%" height={96} borderRadius={14} />
                <Skeleton width="100%" height={96} borderRadius={14} />
            </div>
            <Skeleton width="100%" height={420} borderRadius={16} />
        </div>
    );
}
