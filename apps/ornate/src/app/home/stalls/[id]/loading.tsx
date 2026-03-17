export default function StallDetailLoading() {
  return (
    <main className="relative min-h-screen bg-[#030308] font-orbitron text-white flex flex-col items-center justify-center py-6 sm:py-20 px-6 overflow-hidden">
      {/* Background visual mimicry */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-[var(--color-neon)]/10 blur-[150px] rounded-full" />
        <div className="absolute inset-0 bg-[#030308]/40 backdrop-blur-[40px]" />
      </div>

      {/* Nav Placeholder */}
      <nav className="fixed top-0 left-0 w-full p-6 z-50 animate-pulse">
        <div className="w-40 h-10 bg-white/10 rounded" style={{ clipPath: 'polygon(15px 0, 100% 0, calc(100%-15px) 100%, 0 100%)' }} />
      </nav>

      <div className="relative z-10 w-full flex flex-col items-center justify-center max-w-[1500px] px-8">
        {/* Stall Detail Card Skeleton */}
        <div className="relative w-full max-w-[850px] flex flex-col items-center animate-pulse">
          {/* Roof */}
          <div className="w-full bg-[#1A1A1A] border-4 border-[#2A2A2A] h-[110px]" 
               style={{ clipPath: 'polygon(5% 0, 95% 0, 100% 100%, 0 100%)' }}>
            <div className="w-[85%] h-[75%] mx-auto mt-3 bg-white/5 border-2 border-white/10" />
          </div>

          {/* Awning */}
          <div className="w-[96%] h-12 bg-white/5 border-b-8 border-[#080B09] flex justify-around items-end px-12">
            {[1, 2, 3, 4].map(i => <div key={i} className="w-3 h-3 rounded-full bg-white/10 translate-y-2" />)}
          </div>

          {/* Shop Front */}
          <div className="w-[92%] bg-[#121A15] border-x-[6px] border-[#080B09] p-8 min-h-[450px]">
            <div className="bg-[#080E0A] border-2 border-[#1A3A22] p-8 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="w-32 h-4 bg-white/5 rounded" />
                  <div className="flex-1 mx-4 border-b-2 border-dotted border-white/5" />
                  <div className="w-12 h-6 bg-white/10 rounded" />
                </div>
              ))}
              <div className="mt-8 border-l-2 border-white/10 bg-white/5 p-5 space-y-2">
                <div className="w-24 h-3 bg-white/10 rounded" />
                <div className="w-full h-4 bg-white/5 rounded" />
                <div className="w-4/5 h-4 bg-white/5 rounded" />
              </div>
              <div className="mt-6 w-full h-12 bg-white/5 border-2 border-white/10" />
            </div>
          </div>

          {/* Base */}
          <div className="w-full bg-[#111A16] border-4 border-[#080B09] p-6 space-y-5">
             <div className="grid grid-cols-2 gap-5">
                <div className="space-y-3">
                   <div className="w-full h-12 bg-white/5 rounded" />
                   <div className="w-full h-24 bg-white/5 rounded" />
                </div>
                <div className="space-y-3">
                   <div className="w-full h-16 bg-white/5 rounded" />
                   <div className="w-full h-12 bg-white/10 rounded" />
                </div>
             </div>
          </div>
        </div>
      </div>
    </main>
  );
}
