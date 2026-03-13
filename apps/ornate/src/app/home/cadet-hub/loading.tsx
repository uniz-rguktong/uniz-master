export default function CadetHubLoading() {
    return (
        <div className="min-h-screen bg-[#020205] text-white font-orbitron px-4 md:px-8 py-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="h-12 w-72 rounded-md bg-[var(--color-neon)]/10 border border-[var(--color-neon)]/30 animate-pulse" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-28 rounded-lg bg-white/5 border border-white/10 animate-pulse" />
                    ))}
                </div>

                <div className="h-96 rounded-lg bg-white/5 border border-white/10 animate-pulse" />
            </div>
        </div>
    );
}
