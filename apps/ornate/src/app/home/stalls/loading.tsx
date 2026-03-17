import StallSkeleton from '@/components/stalls/StallSkeleton';

export default function StallsLoading() {
  return (
    <main className="relative min-h-screen bg-[#030308] font-orbitron text-white overflow-hidden pt-0 pb-12">
      {/* Background visual mimicry */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-[var(--color-neon)]/10 blur-[150px] rounded-full" />
        <div className="absolute inset-0 bg-[#030308]/60 backdrop-blur-[20px]" />
      </div>

      {/* Header Placeholder */}
      <div className="h-16 border-b border-white/5 flex items-center px-8 relative z-10 animate-pulse">
        <div className="w-48 h-6 bg-white/10 rounded" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Title Section Placeholder */}
        <div className="mt-24 text-center mb-24 relative animate-pulse">
          <div className="mx-auto w-[60%] h-24 md:h-32 bg-white/10 rounded mb-6" />
          <div className="w-48 h-4 bg-white/5 rounded mx-auto" />
        </div>

        {/* Stalls Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-24">
          {Array.from({ length: 6 }).map((_, i) => (
            <StallSkeleton key={i} />
          ))}
        </div>
      </div>
    </main>
  );
}
