import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, Map, GitBranch, Users, Anchor, Theater, Target, Joystick, Gamepad2, ArrowLeft } from 'lucide-react';

const FOOTER_LINKS = [
    { label: 'Base Camp', href: '/home', icon: Home, color: 'var(--color-neon)' },
    { label: 'Event Hub', href: '/home/fest', icon: Map, color: '#22d3ee' },
    { label: 'Branches', href: '/home/branches', icon: GitBranch, color: 'var(--color-neon)' },
    { label: 'Clubs', href: '/home/clubs', icon: Users, color: '#a855f7' },
    { label: 'HHO', href: '/home/branches/hho', icon: Anchor, color: '#fbbf24' },
    { label: 'Culturals', href: '/home/fest/culturals', icon: Theater, color: '#f87171' },
    { label: 'Sports', href: '/home/fest/sports', icon: Target, color: '#FF9E00' },
    { label: 'Fun', href: '/home/fun', icon: Joystick, color: '#FF00E5' }
];

export default function FunFooter() {
    return (
        <footer className="relative w-full bg-[#050508] border-t-2 border-[#FF00E5]/20 pt-24 pb-12 overflow-hidden mt-32">
            {/* Global Background Particles & Nebula for Footer */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] bg-[#FF00E5]/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute top-[10%] right-[10%] w-[40%] h-[40%] bg-[var(--color-neon)]/10 blur-[150px] rounded-full" />

                {/* Grid Overlay for Arcade Feel */}
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: `linear-gradient(to right, rgba(255,0,229,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,209,255,0.1) 1px, transparent 1px)`,
                        backgroundSize: '40px 40px',
                        transform: 'perspective(500px) rotateX(60deg) translateY(100px) scale(2.5)',
                        transformOrigin: 'bottom'
                    }}
                />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col items-center">
                {/* Branding / Headline */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16 flex flex-col items-center"
                >
                    <div className="relative mb-6 group cursor-pointer">
                        <div className="absolute inset-0 bg-[#FF00E5] blur-xl opacity-40 group-hover:opacity-70 transition-opacity rounded-full animate-pulse" />
                        <Gamepad2 className="w-16 h-16 text-[var(--color-neon)] relative z-10 drop-shadow-[0_0_15px_rgba(0,209,255,0.8)]" />
                    </div>

                    <h2 className="text-4xl md:text-5xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#FF00E5] to-[var(--color-neon)] drop-shadow-lg mb-2">
                        Game Over?
                    </h2>
                    <p className="text-gray-400 font-black uppercase tracking-[0.5em] text-xs">
                        Insert Coin to Explore More Sectors
                    </p>
                </motion.div>

                {/* Symmetrical Navigation Matrix - Joypad themed */}
                <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-20">
                    {FOOTER_LINKS.map((link, idx) => (
                        <Link
                            key={idx}
                            href={link.href}
                            className="group relative flex flex-col items-center justify-center p-6 bg-black/60 backdrop-blur-xl rounded-3xl border-b-4 border-r-4 border-white/5 hover:border-[#FF00E5] hover:-translate-y-2 hover:-translate-x-1 transition-all duration-300 active:translate-y-0 active:translate-x-0 active:border-b-0 active:border-r-0 active:mt-[4px] active:mr-[4px]"
                        >
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-3xl" style={{ backgroundColor: link.color }} />

                            <div className="relative p-4 rounded-full bg-white/5 mb-3 group-hover:scale-110 transition-transform duration-300 border border-white/10 group-hover:border-transparent group-hover:bg-black/50" style={{ boxShadow: `inset 0 0 10px rgba(255,255,255,0.05)` }}>
                                <link.icon className="w-6 h-6" style={{ color: link.color }} />
                            </div>
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 group-hover:text-white transition-colors drop-shadow-md">
                                {link.label}
                            </span>
                        </Link>
                    ))}
                </div>

                {/* Bottom Bar */}
                <div className="w-full pt-8 border-t-2 border-white/10 border-dashed flex flex-col md:flex-row items-center justify-between text-[11px] font-black tracking-[0.3em] uppercase text-gray-600 gap-6">
                    <p className="hover:text-[var(--color-neon)] transition-colors cursor-crosshair">© 2026 FUN_PLANET_OPERATIONS</p>

                    <Link href="/home" className="flex items-center gap-2 group hover:text-[#FF00E5] transition-colors bg-white/5 px-6 py-2 rounded-full border border-white/10 hover:border-[#FF00E5]/50">
                        <ArrowLeft className="w-3 h-3 group-hover:-translate-x-2 transition-transform" />
                        Return to Base Camp
                    </Link>

                    <p className="hover:text-[#FF00E5] transition-colors cursor-crosshair">CREDITS: 98</p>
                </div>
            </div>
        </footer>
    );
}
