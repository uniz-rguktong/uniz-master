import { MatchScheduleSkeleton } from '@/components/sports/SportsSkeletons';

export default function SportsScheduleLoading() {
  return (
    <main className="min-h-screen bg-[#030308] text-white font-orbitron overflow-hidden">
      {/* Background Visuals */}
      <div className="fixed inset-0 opacity-[0.04] pointer-events-none z-0"
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '50px 50px' }} />
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-amber-400/5 blur-[180px] pointer-events-none z-0" />

      {/* Header Placeholder */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/60 border-b border-amber-400/10 px-8 py-4 flex items-center justify-between animate-pulse">
        <div className="w-48 h-10 bg-white/5 rounded" style={{ clipPath: 'polygon(12px 0, 100% 0, calc(100%-12px) 100%, 0 100%)' }} />
        <div className="w-32 h-4 bg-white/5 rounded" />
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Title Placeholder */}
        <div className="mb-12 animate-pulse">
          <div className="w-32 h-3 bg-amber-400/20 rounded mb-3" />
          <div className="w-64 h-24 bg-white/10 rounded mb-4" />
          <div className="h-[2px] w-32 bg-amber-400/20" />
        </div>

        {/* Filters Placeholder */}
        <div className="mb-10 space-y-6 animate-pulse">
           <div className="w-full max-w-md h-12 bg-white/5 rounded" style={{ clipPath: 'polygon(8px 0, 100% 0, calc(100%-8px) 100%, 0 100%)' }} />
           <div className="flex gap-10">
              <div className="space-y-2">
                 <div className="w-20 h-2 bg-white/10 rounded" />
                 <div className="flex gap-2">
                    {Array.from({ length: 4 }).map((_, i) => <div key={i} className="w-16 h-8 bg-white/5 rounded" />)}
                 </div>
              </div>
              <div className="space-y-2">
                 <div className="w-20 h-2 bg-white/10 rounded" />
                 <div className="flex gap-2">
                    {Array.from({ length: 3 }).map((_, i) => <div key={i} className="w-16 h-8 bg-white/5 rounded" />)}
                 </div>
              </div>
           </div>
        </div>

        {/* Match Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <MatchScheduleSkeleton key={i} />
          ))}
        </div>
      </div>
    </main>
  );
}
