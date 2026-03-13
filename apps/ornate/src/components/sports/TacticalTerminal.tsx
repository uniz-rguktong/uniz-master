'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Calendar, BarChart3 } from 'lucide-react';
import DisplayCards from '@/components/ui/display-cards';

export const TacticalTerminal = memo(() => {
    const sportsCards = [
        {
            title: "MATCH RESULTS",
            description: "Final scores & verified match outcomes.",
            icon: <ClipboardList className="size-8" />,
            date: "RESULTS · LIVE",
            accentColor: "#22d3ee",
            className: "[grid-area:stack] -translate-x-32 -translate-y-12 sm:-translate-x-64 sm:-translate-y-40 hover:-translate-y-20 sm:hover:-translate-y-48 hover:z-50 transition-all duration-700 sm:grayscale sm:opacity-50 sm:hover:grayscale-0 sm:hover:opacity-100",
            image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e",
            link: "/home/fest/sports/results"
        },
        {
            title: "MATCH SCHEDULE",
            description: "Upcoming fixtures & venue allocations.",
            icon: <Calendar className="size-8" />,
            date: "SCHEDULE · UPDATED",
            accentColor: "var(--color-neon)",
            className: "[grid-area:stack] scale-100 hover:-translate-y-4 sm:hover:-translate-y-16 hover:z-50 transition-all duration-700 sm:grayscale sm:opacity-50 sm:hover:grayscale-0 sm:hover:opacity-100",
            image: "https://images.unsplash.com/photo-1504450758481-7338eba7524a",
            link: "/home/fest/sports/schedule"
        },
        {
            title: "POLLS & BRACKETS",
            description: "Predictions & active play-off brackets.",
            icon: <BarChart3 className="size-8" />,
            date: "POLL · OPEN",
            accentColor: "#fbbf24",
            className: "[grid-area:stack] translate-x-32 translate-y-12 sm:translate-x-64 sm:translate-y-40 sm:scale-110 hover:translate-y-20 sm:hover:translate-y-48 hover:z-50 transition-all duration-700 sm:grayscale-0 sm:opacity-100 sm:z-10",
            image: "https://images.unsplash.com/photo-1517649763962-0c623066013b",
            link: "/home/fest/sports/fixtures"
        }
    ];

    return (
        <section id="tactical-terminal" className="relative z-10 py-60 overflow-visible min-h-[140vh] flex flex-col items-center justify-center bg-[#050510]">
            {/* 1. Global Section Glow (Section-Wide Atmospheric Layer) */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-full w-full pointer-events-none z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1)_0%,transparent_70%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.03)_0%,transparent_50%)] animate-pulse" />
            </div>

            {/* --- Advanced Space Atmosphere Layers --- */}

            {/* 1. Base Grid Layer */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
                    backgroundSize: '60px 60px'
                }}
            />

            {/* 2. Deep Nebula Glows (Non-interactive large globs) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Central Core Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[800px] bg-blue-600/10 blur-[200px] rounded-full opacity-40 animate-pulse" style={{ animationDuration: '8s' }} />

                {/* Accent Color Nebulae */}
                <div className="absolute top-0 right-[-10%] w-[600px] h-[600px] bg-amber-500/10 blur-[150px] rounded-full opacity-30" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-emerald-500/10 blur-[150px] rounded-full opacity-30" />
                <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[var(--color-neon)]/10 blur-[180px] rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s', animationDuration: '6s' }} />
            </div>

            {/* 3. Horizontal Light Streaks (Cinematic feel) */}
            <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent blur-sm pointer-events-none" />
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[var(--color-neon)]/10 to-transparent pointer-events-none" />

            <div className="max-w-6xl mx-auto flex flex-col items-center px-4 sm:px-10 relative z-10">
                {/* Section Heading */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center mb-24 sm:mb-48 text-center"
                >
                    <div className="flex items-center gap-4 sm:gap-6 mb-4 sm:mb-6">
                        <div className="h-px w-16 sm:w-32 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
                        <span className="text-[8px] sm:text-[10px] text-amber-400 tracking-[0.8em] font-black uppercase opacity-60">
                            Quick Links
                        </span>
                        <div className="h-px w-16 sm:w-32 bg-gradient-to-l from-transparent via-amber-400/50 to-transparent" />
                    </div>
                    <h2 className="text-4xl sm:text-7xl font-black tracking-tight text-white uppercase leading-none drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                        MATCH <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20">SCHEDULE</span> <br />
                        <span className="text-amber-400 font-outline-2">&</span> RESULTS
                    </h2>

                    <div className="flex items-center gap-3 mt-10">
                        <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        <span className="text-[10px] font-bold text-white/40 tracking-[0.4em] uppercase">LIVE UPDATES</span>
                    </div>

                    <div className="h-1 w-64 bg-white/5 mt-12 rounded-full overflow-hidden relative">
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                            className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-amber-400 to-transparent"
                        />
                    </div>
                </motion.div>

                <div className="relative py-10 sm:py-20 w-full flex justify-center items-center h-[500px] sm:h-[600px] mt-10 sm:mt-0">
                    {/* The Scale-up Container for the whole stack */}
                    <div className="scale-[0.45] sm:scale-[1.2] transition-transform duration-1000 mt-0">
                        <DisplayCards cards={sportsCards} />
                    </div>

                    {/* Floating HUD Decoration around cards */}
                    <div className="absolute -inset-40 border-2 border-dashed border-white/5 rounded-full pointer-events-none opacity-20 scale-150 animate-[spin_60s_linear_infinite]" />
                </div>
            </div>

            {/* CSS for custom outline text if needed */}
            <style jsx>{`
                .font-outline-2 {
                    -webkit-text-stroke: 1px rgba(251, 191, 36, 0.5);
                    color: transparent;
                }
            `}</style>
        </section>
    );
});

TacticalTerminal.displayName = 'TacticalTerminal';
