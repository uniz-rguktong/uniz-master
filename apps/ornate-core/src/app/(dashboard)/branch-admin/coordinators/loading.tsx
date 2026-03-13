import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <div className="p-8 animate-pulse">
            {/* Header Skeleton */}
            <div className="mb-8">
                <div className="flex gap-2 mb-3">
                    <Skeleton width={200} height={16} />
                </div>
                <div className="flex justify-between mb-6">
                    <div className="space-y-2">
                        <Skeleton width={300} height={32} />
                        <Skeleton width={350} height={16} />
                    </div>
                    <Skeleton width={160} height={45} borderRadius={12} />
                </div>
            </div>

            {/* Search Bar Skeleton */}
            <div className="bg-[#F4F2F0] rounded-[18px] p-[10px] mb-6">
                <div className="bg-white rounded-[14px] p-4 border-b border-[#E5E7EB]">
                    <Skeleton width={400} height={40} className="rounded-[12px]" />
                </div>
            </div>

            {/* Table Skeleton */}
            <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
                <div className="bg-white rounded-[14px] overflow-hidden">
                    <div className="space-y-4 p-6">
                        {[...Array(5)].map((_: any, i: any) => (
                            <div key={i} className="flex justify-between items-center gap-4">
                                <Skeleton width="20%" height={24} />
                                <Skeleton width="30%" height={24} />
                                <Skeleton width="20%" height={24} />
                                <Skeleton width="10%" height={24} />
                                <Skeleton width="10%" height={24} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
