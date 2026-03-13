export default function StallsLoading() {
    return (
        <div className="min-h-screen bg-[#030308] flex items-center justify-center">
            <div className="text-center space-y-4">
                <div className="w-16 h-16 border-2 border-[var(--color-neon)] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-[var(--color-neon)]/60 font-[family-name:var(--font-orbitron)] tracking-widest animate-pulse">
                    ACCESSING STALL REGISTRY...
                </p>
            </div>
        </div>
    );
}
