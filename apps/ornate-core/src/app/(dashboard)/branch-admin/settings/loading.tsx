import { Skeleton } from '@/components/ui/skeleton';

export default function BranchSettingsLoading() {
    return (
        <div className="p-4 md:p-8 animate-pulse">
            <Skeleton width={220} height={32} borderRadius={8} className="mb-6" />
            <Skeleton width="100%" height={520} borderRadius={16} />
        </div>
    );
}
