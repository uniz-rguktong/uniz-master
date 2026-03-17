import { MatchResultSkeleton } from '@/components/sports/SportsSkeletons';

export default function SportsResultsLoading() {
  return (
    <main className="min-h-screen bg-[#060509] text-white font-orbitron overflow-hidden">
      {/* Background Visuals */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/3 w-[700px] h-[700px] bg-amber-500/4 blur-[220px] rounded-full" />
        <div className="absolute inset-0 opacity-[0.035]"
             style={{ backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, rgba(255,255,255,0.5) 1px, transparent 0)', backgroundSize: '48px 48px' }} />
      </div>

      {/* Header Placeholder */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-black/65 border-b border-amber-400/12 px-8 py-4 flex items-center justify-between animate-pulse">
        <div className="w-48 h-10 bg-amber-400/10 rounded" style={{ clipPath: 'polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)' }} />
        <div className="w-32 h-4 bg-white/5 rounded" />
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-14">
        {/* Hero Title Placeholder */}
        <div className="mb-14 animate-pulse">
           <div className="w-48 h-3 bg-amber-400/20 rounded mb-4" />
           <div className="w-[80%] h-40 bg-white/5 rounded mb-4" />
           <div className="w-40 h-[2px] bg-amber-400/30 rounded-full" />
           <div className="mt-6 w-48 h-8 bg-amber-400/10 rounded" style={{ clipPath: 'polygon(8px 0, 100% 0, calc(100%-8px) 100%, 0 100%)' }} />
        </div>

        {/* Filters Placeholder */}
        <div className="mb-12 p-6 space-y-8 bg-white/[0.025] animate-pulse"
             style={{ clipPath: 'polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 18px 100%, 0 calc(100% - 18px))' }}>
           <div className="w-full max-w-lg h-12 bg-white/5 rounded" style={{ clipPath: 'polygon(6px 0, 100% 0, calc(100%-6px) 100%, 0 100%)' }} />
           <div className="flex flex-wrap gap-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-3">
                   <div className="w-16 h-2 bg-white/10 rounded" />
                   <div className="flex gap-2">
                      {Array.from({ length: 4 }).map((_, j) => <div key={j} className="w-14 h-7 bg-white/5 rounded" />)}
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Results Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <MatchResultSkeleton key={i} />
          ))}
        </div>
      </div>
    </main>
  );
}
