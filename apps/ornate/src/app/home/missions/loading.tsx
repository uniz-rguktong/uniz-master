import MissionSkeleton from '@/components/missions/MissionSkeleton';

export default function MissionsLoading() {
  return (
    <main className="relative w-screen h-screen text-white overflow-hidden bg-[#020205] font-orbitron flex flex-col">
      {/* Background visual mimicry */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(10,12,20,1)_0%,rgba(2,2,5,1)_100%)]" />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-size-[100%_4px]" />
      </div>

      {/* Header Placeholder */}
      <div className="h-16 border-b border-white/5 flex items-center px-8 relative z-10 animate-pulse">
        <div className="w-48 h-6 bg-white/10 rounded" />
      </div>

      {/* Top Bar Placeholder */}
      <div className="h-20 border-b border-white/5 flex items-center justify-between px-8 relative z-10 animate-pulse">
        <div className="flex gap-4">
           <div className="w-32 h-10 bg-white/5 rounded" />
           <div className="w-32 h-10 bg-white/5 rounded" />
        </div>
        <div className="flex gap-4">
           <div className="w-10 h-10 bg-white/5 rounded-full" />
           <div className="w-10 h-10 bg-white/5 rounded-full" />
        </div>
      </div>

      {/* Filter Bar Placeholder */}
      <div className="h-16 bg-white/2 border-b border-white/5 flex items-center px-8 relative z-10 animate-pulse">
        <div className="w-full max-w-md h-10 bg-white/5 rounded" />
      </div>

      {/* Missions Grid Skeleton */}
      <div className="flex-1 overflow-y-auto px-6 sm:px-8 md:px-12 py-4 md:py-10 scrollbar-hide relative z-10">
        <div className="mb-6 w-32 h-4 bg-white/10 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pb-20">
          {Array.from({ length: 6 }).map((_, i) => (
            <MissionSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Footer Placeholder */}
      <div className="h-10 border-t border-white/5 flex items-center px-8 relative z-10 animate-pulse">
         <div className="w-24 h-3 bg-white/5 rounded" />
         <div className="flex-1" />
         <div className="w-48 h-3 bg-white/5 rounded" />
      </div>
    </main>
  );
}
