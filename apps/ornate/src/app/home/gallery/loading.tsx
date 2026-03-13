export default function GalleryLoading() {
    return (
        <div className="min-h-screen bg-[#030308] text-white font-orbitron px-4 md:px-8 py-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="h-10 w-52 rounded-md bg-blue-500/10 border border-blue-400/30 animate-pulse" />
                <div className="h-12 rounded-md bg-white/5 border border-white/10 animate-pulse" />

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="aspect-square rounded-lg bg-white/5 border border-white/10 animate-pulse" />
                    ))}
                </div>
            </div>
        </div>
    );
}
