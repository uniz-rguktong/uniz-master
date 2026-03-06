import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <div className="p-4 md:p-8 space-y-6 animate-pulse">
            {/* Header */}
            <div className="space-y-2">
                <Skeleton width="30%" height={32} borderRadius={8} />
                <Skeleton width="50%" height={20} borderRadius={6} />
            </div>

            {/* Content Area */}
            <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
                <div className="bg-white rounded-[14px] border border-[#E5E7EB] overflow-hidden p-6">
                    <div className="space-y-4">
                        <Skeleton width="100%" height={48} borderRadius={8} />
                        <Skeleton width="100%" height={48} borderRadius={8} />
                        <Skeleton width="100%" height={48} borderRadius={8} />
                        <Skeleton width="100%" height={48} borderRadius={8} />
                        <Skeleton width="80%" height={48} borderRadius={8} />
                    </div>
                </div>
            </div>
        </div>
    );
}
