import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Anchor, Trophy, Theater, Target, Joystick, Home, Map, GitBranch, Users, Activity } from 'lucide-react';
import GlobalFooterLinks from '../ui/GlobalFooterLinks';

export default function SportsFooter() {
    return (
        <footer className="relative w-full overflow-hidden font-orbitron pt-40 pb-16 bg-[#030308] mt-20 border-t border-amber-400/20">
            {/* Stadium Lights Effect */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                {/* Massive Stadium floodlights from top corners */}
                <div className="absolute top-[-50%] left-[-10%] w-[60%] h-[200%] bg-white/5 shadow-[0_0_100px_30px_rgba(255,255,255,0.2)] rotate-[35deg] origin-top blur-2xl mix-blend-screen" />
                <div className="absolute top-[-50%] right-[-10%] w-[60%] h-[200%] bg-amber-400/5 shadow-[0_0_100px_30px_rgba(251,191,36,0.1)] -rotate-[35deg] origin-top blur-2xl mix-blend-screen" />

                {/* Pitch Grid / Track Lines */}
                <div className="absolute bottom-0 w-full h-[60%] opacity-20" style={{
                    backgroundImage: 'repeating-linear-gradient(90deg, transparent 0, transparent 40px, rgba(251,191,36,0.1) 40px, rgba(251,191,36,0.1) 45px)'
                }} />

                {/* Curved stadium track outline at bottom */}
                <div className="absolute -bottom-[20%] left-1/2 -translate-x-1/2 w-[150%] h-[60%] border-t-4 border-amber-400/40 rounded-[100%] opacity-60 shadow-[0_-10px_40px_rgba(251,191,36,0.2)]" />
                <div className="absolute -bottom-[15%] left-1/2 -translate-x-1/2 w-[140%] h-[50%] border-t-2 border-white/20 rounded-[100%] opacity-40 shadow-[0_-5px_20px_rgba(255,255,255,0.1)]" />
                <div className="absolute -bottom-[10%] left-1/2 -translate-x-1/2 w-[130%] h-[40%] border-t-2 border-amber-400/10 rounded-[100%] opacity-30" />
            </div>

            {/* Fog Overlay */}
            <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#020204] via-[#020204]/80 to-transparent pointer-events-none" />

            {/* Content Container */}
            <div className="relative z-20 max-w-[1400px] mx-auto px-6 lg:px-10 flex flex-col items-center">

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center mb-16 text-center"
                >
                    <div className="w-20 h-20 rounded-xl flex items-center justify-center border-2 border-amber-400/40 bg-amber-400/10 mb-6 shadow-[0_0_40px_rgba(251,191,36,0.3)] backdrop-blur-md transform rotate-45 group hover:rotate-0 transition-transform duration-700">
                        <Trophy className="w-8 h-8 text-amber-400 -rotate-45 group-hover:rotate-0 transition-transform duration-700" />
                    </div>
                    <span className="text-[14px] text-amber-400 tracking-[0.8em] font-black uppercase drop-shadow-[0_0_10px_rgba(251,191,36,0.8)] shadow-amber-400/20">ARENA COMM-LINK</span>
                    <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-widest mt-2 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">GLOBAL <span className="text-amber-400">NAV</span></h2>
                </motion.div>

                {/* Tactic Board Navigation Links */}
                <div className="w-full mb-24 relative z-10 max-w-[1400px]">
                    <GlobalFooterLinks />
                </div>

                {/* Bottom Stats/Info Bar */}
                <div className="w-full pt-12 border-t border-amber-400/20 flex flex-col items-center text-center gap-6 relative z-20">
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/30">Ornate 2K26 Galactic Sports</p>
                        <h4 className="text-[13px] font-black tracking-[0.2em] uppercase text-amber-400">RGUKT IIIT ONGOLE</h4>
                        <p className="text-[9px] font-bold text-gray-500 tracking-[0.15em] uppercase">IIIT ONGOLE, PRAKASAM DISTRICT, AP - 523225</p>
                    </div>

                    <div className="w-full pt-6 flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] font-bold tracking-[0.3em] uppercase text-white/40">
                        <p>&copy; 2026 ORNATE GALACTIC SPORTS. FIELD SECURED.</p>
                        <div className="flex gap-4 items-center">
                            <div className="px-3 py-1 bg-amber-400/10 border border-amber-400/30 text-amber-400 rounded-sm">
                                ARENA STATUS: LIVE
                            </div>
                            <div className="flex items-center gap-2 text-amber-400">
                                <span className="w-2 h-2 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,1)] rounded-full animate-pulse" />
                                NETWORK HEALTH
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
