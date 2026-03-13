import { Skeleton } from '@/components/ui/skeleton';

export default function BranchSupportLoading() {
    return (
        <div className="p-4 md:p-8 animate-pulse">
            <Skeleton width={220} height={32} borderRadius={8} className="mb-6" />
            <div className="space-y-4">
                <Skeleton width="100%" height={150} borderRadius={14} />
                <Skeleton width="100%" height={150} borderRadius={14} />
                <Skeleton width="100%" height={150} borderRadius={14} />
            </div>
        </div>
    );
}
