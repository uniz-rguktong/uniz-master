import { Skeleton } from '@/components/ui/skeleton';

export default function ClubsContentLoading() {
    return (
        <div className="p-4 md:p-8 animate-pulse">
            <div className="mb-8">
                <Skeleton width={260} height={32} borderRadius={8} className="mb-2" />
                <Skeleton width={420} height={16} borderRadius={6} />
            </div>
            <div className="space-y-4">
                <Skeleton width="100%" height={120} borderRadius={16} />
                <Skeleton width="100%" height={360} borderRadius={16} />
            </div>
        </div>
    );
}
