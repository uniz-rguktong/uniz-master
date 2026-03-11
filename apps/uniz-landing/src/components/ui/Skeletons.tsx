export const SkeletonBox = ({ className = "" }: { className?: string }) => (
    <div className={`bg-slate-200 animate-pulse rounded-xl ${className}`} />
);

export const AnnouncementSkeleton = () => (
    <div className="flex gap-8 items-center overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBox key={i} className="h-4 w-64 flex-shrink-0 bg-white/20" />
        ))}
    </div>
);

export const NotificationSkeleton = () => (
    <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 border border-slate-100 rounded-2xl space-y-2">
                <SkeletonBox className="h-4 w-3/4" />
                <SkeletonBox className="h-3 w-1/4" />
            </div>
        ))}
    </div>
);

export const FacultySkeleton = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
                <SkeletonBox className="w-20 h-20 rounded-full" />
                <SkeletonBox className="h-3 w-24" />
                <SkeletonBox className="h-2 w-16" />
            </div>
        ))}
    </div>
);
