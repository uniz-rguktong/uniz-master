'use client';

import { useEffect, useState } from 'react';
export default function MissionControl() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="min-h-screen bg-slate-50" />;

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100/50 overflow-hidden relative flex flex-col items-center justify-center py-20">
            {/* Header Removed for Immersive Mode */}

            {/* --- Technical Light Background --- */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-400/10 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-400/10 rounded-full blur-[100px] animate-pulse [animation-delay:2s]" />

                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
                        backgroundSize: '40px 40px'
                    }}
                />
                <div className="absolute inset-0 bg-scanlines pointer-events-none opacity-[0.02]" />
            </div>

            <div className="relative z-10 w-full max-w-[90vw] sm:max-w-4xl mx-auto px-4 text-center">

                <div className="space-y-6 md:space-y-10 animate-fade-in">
                    {/* Status Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/5 border border-blue-600/10 text-[9px] md:text-xs font-mono text-blue-600 tracking-[0.15em] uppercase font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        System: Priority Alpha
                    </div>

                    {/* Hero Heading */}
                    <div className="relative py-4 md:py-8">
                        <h1 className="text-5xl sm:text-7xl md:text-9xl font-black tracking-tighter bg-gradient-to-b from-slate-950 to-slate-500 bg-clip-text text-transparent italic leading-[0.9] mb-2">
                            COMING <br className="sm:hidden" /> VERY SOON
                        </h1>
                        <div className="hidden sm:block absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-600/10 to-transparent" />
                    </div>

                    {/* Hype Content */}
                    <div className="space-y-4 md:space-y-8 px-2">
                        <p className="text-xs sm:text-base md:text-lg text-slate-500 font-bold font-mono tracking-widest uppercase leading-snug">
                            We are <span className="text-slate-950 underline decoration-blue-500/40 decoration-2 underline-offset-4">rewriting The history</span> of RGUKT.
                        </p>

                        <p className="text-sm sm:text-lg md:text-2xl text-slate-600 font-medium leading-relaxed font-mono tracking-tight uppercase">
                            Are you ready to witness <span className="text-blue-600 font-extrabold drop-shadow-[0_2px_8px_rgba(37,99,235,0.2)] block sm:inline mt-1 sm:mt-0">RGUKT ONGOLE?</span>
                            <br className="hidden md:block" />
                            <span className="text-slate-400 text-[10px] sm:text-xs md:text-base"> as the brightest star & greatest power source in the Universe!!</span>
                        </p>
                    </div>

                    {/* Action/Loading Section */}
                    <div className="pt-8 md:pt-12 flex flex-col items-center gap-6">
                        <div className="flex gap-2">
                            {[0, 1, 2].map((i) => (
                                <div
                                    key={i}
                                    className="w-1.5 h-1.5 rounded-full bg-blue-600/20 animate-bounce"
                                    style={{ animationDelay: `${i * 0.2}s` }}
                                />
                            ))}
                        </div>
                        <div className="px-5 py-2 rounded-lg bg-white/60 backdrop-blur-sm border border-slate-200 shadow-sm text-[8px] sm:text-[10px] font-mono text-slate-400 tracking-[0.3em] uppercase font-bold">
                            Decryption Active
                        </div>
                    </div>
                </div>

                {/* Responsive Footer */}
                <div className="fixed bottom-6 sm:bottom-10 left-0 w-full px-6 sm:px-12 flex flex-col sm:flex-row justify-between items-center gap-4 text-[8px] sm:text-[10px] font-mono">
                    <div className="flex gap-6 text-slate-400">
                        <div className="flex flex-col sm:items-start items-center">
                            <span className="opacity-50 uppercase tracking-tighter">Core</span>
                            <span className="text-slate-900 font-bold tracking-tight">ORNATE-LITE</span>
                        </div>
                        <div className="flex flex-col sm:items-start items-center">
                            <span className="opacity-50 uppercase tracking-tighter">Link</span>
                            <span className="text-blue-600 font-bold flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                                SECURE
                            </span>
                        </div>
                    </div>
                    <div className="text-slate-300 uppercase tracking-[0.3em] text-center sm:text-right">
                        &copy; 2026 ORNATE EXPEDITIONARY FORCE
                    </div>
                </div>
            </div>

            <style jsx>{`
                .bg-scanlines {
                    background: linear-gradient(
                        to bottom,
                        transparent 45%,
                        rgba(0, 0, 0, 0.03) 50%,
                        transparent 55%
                    );
                    background-size: 100% 4px;
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </main>
    );
}
