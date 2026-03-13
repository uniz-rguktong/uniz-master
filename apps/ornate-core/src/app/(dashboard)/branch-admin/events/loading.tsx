import { Skeleton } from '@/components/ui/skeleton';

export default function EventsLoading() {
    return (
        <div className="flex h-full animate-pulse">
            <div className="flex-1 overflow-y-auto">
                <div className="p-4 md:p-8 bg-white">
                    {/* Header Skeleton */}
                    <div className="mb-6">
                        <div className="flex gap-2 mb-3">
                            <Skeleton width={300} height={16} />
                        </div>
                        <div className="flex justify-between mb-6">
                            <Skeleton width={200} height={32} />
                        </div>
                        {/* Search Bar Skeleton */}
                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                            <Skeleton width="100%" height={45} className="md:max-w-md" />
                            <div className="flex gap-3">
                                <Skeleton width={120} height={45} />
                                <Skeleton width={120} height={45} />
                            </div>
                        </div>
                    </div>

                    {/* Grid Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_: any, i: any) => (
                            <div key={i} className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
                                <Skeleton height={160} className="w-full" />
                                <div className="p-5 space-y-3">
                                    <Skeleton width="40%" height={16} />
                                    <Skeleton width="80%" height={24} />
                                    <Skeleton width="100%" height={14} />
                                    <div className="flex justify-between pt-2">
                                        <Skeleton width="30%" height={20} />
                                        <Skeleton width="20%" height={20} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
