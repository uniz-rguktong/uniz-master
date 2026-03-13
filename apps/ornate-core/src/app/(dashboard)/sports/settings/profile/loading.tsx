import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <div className="p-4 md:p-8 space-y-6 animate-pulse">
            {/* Header */}
            <div className="space-y-2">
                <Skeleton width="30%" height={32} borderRadius={8} />
                <Skeleton width="50%" height={20} borderRadius={6} />
            </div>

            {/* Profile Section Skeleton */}
            <div className="bg-[#F4F2F0] rounded-[24px] p-3">
                <div className="bg-white rounded-[18px] border border-[#E5E7EB] p-8">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        <Skeleton width={120} height={120} borderRadius="50%" />
                        <div className="flex-1 space-y-4 w-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Skeleton width="40%" height={16} />
                                    <Skeleton width="100%" height={42} borderRadius={8} />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton width="40%" height={16} />
                                    <Skeleton width="100%" height={42} borderRadius={8} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Skeleton width="20%" height={16} />
                                <Skeleton width="100%" height={80} borderRadius={8} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
