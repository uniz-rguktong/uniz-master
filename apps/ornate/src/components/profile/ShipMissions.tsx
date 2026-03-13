'use client';

import { motion } from 'framer-motion';
import { ClipboardList, ChevronRight } from 'lucide-react';

export default function ShipMissions() {
    return (
        <div className="flex flex-col gap-4 p-6 border border-[var(--color-neon)]/30 bg-black/40 backdrop-blur-md rounded-xl font-orbitron h-full relative overflow-hidden">
            {/* Header Section */}
            <div className="flex justify-between items-start z-10">
                <div className="flex items-center gap-3">
                    <div className="p-1 border border-[var(--color-neon)]/50">
                        <ClipboardList className="w-4 h-4 text-[var(--color-neon)]" />
                    </div>
                    <h3 className="text-lg font-black tracking-[0.2em] text-white uppercase italic">MY MISSIONS</h3>
                </div>

                <div className="flex flex-col items-end border border-[var(--color-neon)]/30 bg-black/60 px-4 py-1">
                    <span className="text-2xl font-black text-[var(--color-neon)] leading-none">06</span>
                    <span className="text-[7px] text-gray-400 font-bold uppercase tracking-widest text-center mt-0.5">MISSION<br />REGISTERED</span>
                </div>
            </div>

            {/* Ship Hologram Area */}
            <div className="relative flex-1 flex flex-col items-center justify-center py-8">
                {/* Hologram Effects */}
                <div className="absolute inset-x-0 bottom-20 h-40 bg-gradient-to-t from-[var(--color-neon)]/20 via-[var(--color-neon)]/5 to-transparent blur-xl pointer-events-none" />

                <motion.div
                    animate={{
                        y: [0, -10, 0],
                        opacity: [0.8, 1, 0.8]
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="relative z-10 w-full aspect-video flex items-center justify-center"
                >
                    <img
                        src="/assets/ornate_falcon.png"
                        alt="Ship Hologram"
                        className="w-full h-full object-contain mix-blend-screen drop-shadow-[0_0_20px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.5)]"
                    />

                    {/* Scanlines on ship */}
                    <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(var(--color-neon-rgb, 57, 255, 20), 0.05)_50%)] bg-[size:100%_4px] pointer-events-none rounded-lg" />
                </motion.div>

                {/* Base Platform */}
                <div className="relative w-48 h-12 mt-4">
                    <div className="absolute inset-0 border-t border-[var(--color-neon)]/40 rotate-1 rounded-[50%]" />
                    <div className="absolute inset-1 border-t border-[var(--color-neon)]/20 -rotate-1 rounded-[50%]" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 bg-[var(--color-neon)]/40 blur-sm rounded-full" />
                </div>
            </div>

            {/* Footer Label */}
            <div className="relative z-10 flex flex-col items-center gap-4 mt-auto">
                <div className="px-6 py-1 border border-[var(--color-neon)]/50 bg-black/40 backdrop-blur-sm">
                    <span className="text-[10px] font-black tracking-[0.3em] text-white uppercase italic">ORNATE FALCON-01</span>
                </div>

                <div className="flex gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className={`w-4 h-4 rounded-full border border-white/20 ${i < 3 ? 'bg-[var(--color-neon)] shadow-[0_0_8px_var(--color-neon)]' : i === 3 ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]'}`}
                        />
                    ))}
                </div>
            </div>

            {/* Decorative Brackets/Corners as seen in image */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[var(--color-neon)]/50" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[var(--color-neon)]/50" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[var(--color-neon)]/50" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[var(--color-neon)]/50" />
        </div>
    );
}
