import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Anchor, Trophy, Theater, Target, Joystick, Home, Map, GitBranch, Users, Sparkles, Mic2 } from 'lucide-react';
import GlobalFooterLinks from '../ui/GlobalFooterLinks';

export default function CulturalsFooter() {
    return (
        <footer className="relative w-full overflow-hidden font-orbitron pt-40 pb-16 bg-[#010103] mt-20">
            {/* Background Stage Lighting Effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 flex justify-center items-end opacity-70">
                {/* Stage Floor Glow */}
                <div className="absolute bottom-0 w-full h-[30%] bg-[#22d3ee]/20 blur-[120px]" />

                {/* Spotlights mapping out from stage */}
                <div className="absolute bottom-[-10%] w-[1px] h-[150%] bg-[#22d3ee] shadow-[0_0_80px_30px_#22d3ee] opacity-30 rotate-[35deg] origin-bottom blur-lg" />
                <div className="absolute bottom-[-10%] w-[1px] h-[150%] bg-[#b539ff] shadow-[0_0_80px_30px_#b539ff] opacity-30 -rotate-[35deg] origin-bottom blur-lg" />

                <div className="absolute bottom-[-20%] w-[2px] h-[200%] bg-white shadow-[0_0_100px_40px_white] opacity-20 rotate-[15deg] origin-bottom blur-xl" />
                <div className="absolute bottom-[-20%] w-[2px] h-[200%] bg-white shadow-[0_0_100px_40px_white] opacity-20 -rotate-[15deg] origin-bottom blur-xl" />

                {/* Laser Accents */}
                <div className="absolute bottom-0 left-[20%] w-[1px] h-full bg-[var(--color-neon)] shadow-[0_0_20px_2px_var(--color-neon)] opacity-40 rotate-[50deg] origin-bottom" />
                <div className="absolute bottom-0 right-[20%] w-[1px] h-full bg-[#fbbf24] shadow-[0_0_20px_2px_#fbbf24] opacity-40 -rotate-[50deg] origin-bottom" />
            </div>

            {/* Fog Overlay */}
            <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#020204] via-[#020204]/80 to-transparent pointer-events-none" />

            {/* Stage Structure Base */}
            <div className="absolute bottom-0 w-full flex justify-center z-0">
                <div className="w-[120%] h-32 bg-[#050510] border-t-4 border-[#22d3ee]/30 rounded-[100%] absolute -bottom-16 opacity-80 shadow-[0_-20px_80px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.3)]">
                    <div className="w-full h-full relative overflow-hidden rounded-[100%]">
                        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#22d3ee] to-transparent shadow-[0_0_20px_#22d3ee]" />
                        <div className="absolute inset-0 opacity-[0.1]" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #22d3ee 0px, transparent 1px, transparent 40px)' }} />
                    </div>
                </div>
            </div>

            {/* Foreground Content */}
            <div className="relative z-20 max-w-[1400px] mx-auto px-6 lg:px-10 flex flex-col items-center">

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center mb-12 text-center"
                >
                    <div className="w-16 h-16 rounded-full flex items-center justify-center border border-[var(--color-neon)]/40 bg-[var(--color-neon)]/10 mb-4 shadow-[0_0_30px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.4)] backdrop-blur-md">
                        <Mic2 className="w-6 h-6 text-[var(--color-neon)]" />
                    </div>
                    <span className="text-[12px] text-[var(--color-neon)] tracking-[0.8em] font-black uppercase drop-shadow-[0_0_10px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.8)]">STAGE CLEAR</span>
                    <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-widest mt-2 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">DIRECTORIES</h2>
                </motion.div>

                {/* Grid Links suspended above the stage */}
                <div className="w-full flex flex-wrap justify-center gap-6 mb-20 relative">

                    {/* The suspending wires */}
                    <div className="absolute top-[-80px] left-0 w-full h-[80px] flex justify-center gap-12 sm:gap-24 opacity-20 pointer-events-none">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="w-px h-full bg-gradient-to-b from-transparent to-white/50" />
                        ))}
                    </div>
                    <div className="w-full relative z-10 max-w-[1400px] mb-12">
                        <GlobalFooterLinks />
                    </div>
                </div>

                <div className="w-full pt-12 border-t border-white/10 flex flex-col items-center text-center gap-6 relative z-20">
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/30">Ornate 2K26 Galactic Culturals</p>
                        <h4 className="text-[13px] font-black tracking-[0.2em] uppercase text-[var(--color-neon)]">RGUKT IIIT ONGOLE</h4>
                        <p className="text-[9px] font-bold text-gray-500 tracking-[0.15em] uppercase">IIIT ONGOLE, PRAKASAM DISTRICT, AP - 523225</p>
                    </div>

                    <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] font-bold tracking-[0.3em] uppercase text-gray-500">
                        <p>&copy; 2026 ORNATE GALACTIC CULTURALS. SOUND ON.</p>
                        <div className="flex items-center gap-8">
                            <span className="flex items-center gap-2">
                                <Sparkles className="w-3 h-3 text-[var(--color-neon)]" /> STAGE ALPHA
                            </span>
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-neon)] animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
