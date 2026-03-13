'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Orbit, Users, Zap, Globe, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { memo } from 'react';

// ─── BACKGROUND EFFECTS ──────────────────────────────────────────────────────
const AtmosphericBackdrop = memo(() => (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#030308]">
        {/* Moving cosmic glow */}
        <motion.div
            animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.7, 0.3],
                x: ['-20%', '20%', '-20%'],
                y: ['-20%', '20%', '-20%']
            }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-gradient-to-r from-[var(--color-neon)]/20 via-[var(--color-neon)]/20 to-transparent blur-[150px] rounded-full mix-blend-screen"
        />
        <motion.div
            animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.2, 0.8, 0.2],
                x: ['20%', '-20%', '20%'],
                y: ['20%', '-20%', '20%']
            }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-[-20%] right-[-20%] w-[70%] h-[70%] bg-gradient-to-l from-[#FF00E5]/20 via-[var(--color-neon)]/20 to-transparent blur-[150px] rounded-full mix-blend-screen"
        />
    </div>
));
AtmosphericBackdrop.displayName = 'AtmosphericBackdrop';

// ─── EXPLORER CARD COMPONENT ─────────────────────────────────────────────────
const ExplorerCard = memo(({
    title,
    subtitle,
    icon: Icon,
    href,
    color,
    description,
    delay
}: {
    title: string;
    subtitle: string;
    icon: any;
    href: string;
    color: string;
    description: string;
    delay: number;
}) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, delay, type: "spring", stiffness: 100 }}
        className="group relative w-full max-w-[450px]"
    >
        <Link href={href} className="block relative z-10">
            {/* Outer Frame with Cut Corners */}
            <div
                className="relative p-[2px] overflow-hidden transition-all duration-500 group-hover:scale-[1.02]"
                style={{
                    background: `linear-gradient(135deg, ${color}50, transparent, ${color}20)`,
                    clipPath: 'polygon(15% 0, 100% 0, 100% 85%, 85% 100%, 0 100%, 0 15%)'
                }}
            >
                {/* Internal Body */}
                <div
                    className="relative bg-[#0A0D0B]/90 backdrop-blur-xl p-6 sm:p-10 flex flex-col items-center text-center gap-4 sm:gap-6"
                    style={{ clipPath: 'polygon(15% 0, 100% 0, 100% 85%, 85% 100%, 0 100%, 0 15%)' }}
                >
                    {/* Animated Glow Backlight */}
                    <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700 blur-[60px]"
                        style={{ background: color }}
                    />

                    {/* Icon Housing */}
                    <div className="relative">
                        <div className="absolute inset-0 blur-[20px] opacity-50 transition-all duration-500 group-hover:scale-150" style={{ backgroundColor: color }} />
                        <div className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-full border-2 flex items-center justify-center bg-black/40 shadow-2xl transition-transform duration-700 group-hover:rotate-[360deg]" style={{ borderColor: color }}>
                            <Icon className="w-8 h-8 sm:w-12 sm:h-12" style={{ color }} />
                        </div>
                    </div>

                    {/* Text Content */}
                    <div>
                        <span className="text-[10px] font-black tracking-[0.5em] uppercase opacity-60 mb-2 block" style={{ color }}>Sector Identification</span>
                        <h2 className="text-2xl sm:text-4xl font-black font-orbitron text-white tracking-tighter uppercase mb-2 group-hover:text-glow transition-all duration-300">
                            {title}
                        </h2>
                        <div className="h-[2px] w-12 mx-auto mb-4 bg-gradient-to-r from-transparent via-current to-transparent opacity-40" style={{ color }} />
                        <p className="text-gray-400 text-sm font-orbitron leading-relaxed max-w-xs">{description}</p>
                    </div>

                    {/* Technical Readout Button */}
                    <div
                        className="mt-2 sm:mt-6 px-6 sm:px-10 py-2 sm:py-3 border text-[10px] font-black tracking-[0.3em] uppercase transition-all duration-300 group-hover:bg-white group-hover:text-black"
                        style={{ borderColor: `${color}40`, color: color }}
                    >
                        Initialize Scan
                    </div>
                </div>
            </div>

            {/* Floating HUD Elements */}
            <div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 w-8 h-8 sm:w-12 sm:h-12 border-t-2 border-r-2 opacity-40 group-hover:opacity-100 transition-opacity" style={{ borderColor: color }} />
            <div className="absolute -bottom-2 -left-2 sm:-bottom-4 sm:-left-4 w-8 h-8 sm:w-12 sm:h-12 border-b-2 border-l-2 opacity-40 group-hover:opacity-100 transition-opacity" style={{ borderColor: color }} />
        </Link>
    </motion.div>
));
ExplorerCard.displayName = 'ExplorerCard';

export default function PlanetViewPage() {
    return (
        <main className="min-h-screen bg-[#030308] font-orbitron text-white flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
            <AtmosphericBackdrop />

            {/* Back Navigation */}
            <nav className="fixed top-0 left-0 w-full p-4 sm:p-8 z-50 flex justify-start">
                <Link href="/home" className="group flex items-center gap-2 text-white/50 hover:text-[var(--color-neon)] transition-all bg-black/40 backdrop-blur-xl px-4 sm:px-6 py-2 sm:py-3 border border-white/10 rounded-full hover:border-[var(--color-neon)]/50">
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold tracking-[0.2em] text-[10px] uppercase">Abort View</span>
                </Link>
            </nav>

            {/* Header Section */}
            <div className="relative z-10 text-center mb-10 sm:mb-16 md:mb-20 mt-16 sm:mt-0">
                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    className="absolute -top-6 sm:-top-10 left-1/2 -translate-x-1/2 w-32 sm:w-48 h-[1px] bg-gradient-to-r from-transparent via-[var(--color-neon)] to-transparent"
                />
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl sm:text-6xl md:text-8xl font-black font-orbitron tracking-tighter uppercase leading-none mb-3 sm:mb-4"
                >
                    System <span className="text-[var(--color-neon)] text-glow font-orbitron">Explorer</span>
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-gray-500 font-mono tracking-[0.3em] sm:tracking-[0.6em] uppercase text-[10px] sm:text-xs"
                >
                    Planetary Coordinate Mapping Engaged
                </motion.p>
            </div>

            {/* Cards Container */}
            <div className="relative z-10 w-full max-w-6xl flex flex-col md:flex-row items-center justify-center gap-8 sm:gap-12 md:gap-20">
                <ExplorerCard
                    title="Branches"
                    subtitle="Academic Sectors"
                    icon={Orbit}
                    href="/home/branches"
                    color="var(--color-neon)"
                    description="Navigate through the core intellectual zones of the fest. Each branch represents a unique planetary ecosystem of engineering."
                    delay={0.4}
                />

                <ExplorerCard
                    title="Clubs"
                    subtitle="Cultural Hubs"
                    icon={Users}
                    href="/home/clubs"
                    color="#FF00E5"
                    description="Access the communal starships where arts, music, and lifestyle collide. Discover the creative collectives powering the sector."
                    delay={0.6}
                />
            </div>

            {/* Bottom HUD Details */}
            <div className="hidden sm:flex absolute bottom-6 sm:bottom-10 left-4 sm:left-10 gap-6 sm:gap-10 opacity-30 font-mono text-[10px]">
                <div className="flex flex-col">
                    <span className="text-[var(--color-neon)]">SCANNING...</span>
                    <span>COORD: 28.52° N, 77.24° E</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[var(--color-neon)]">SYSTEM RUNTIME</span>
                    <span>04:49:13.256</span>
                </div>
            </div>

            <div className="hidden sm:flex absolute bottom-6 sm:bottom-10 right-4 sm:right-10 flex-col items-end opacity-20">
                <Globe className="w-8 h-8 sm:w-12 sm:h-12 text-[var(--color-neon)] animate-spin-slow" />
                <span className="text-[10px] tracking-[0.3em] font-black uppercase mt-2 sm:mt-4">Full Planet View Mode</span>
            </div>
        </main>
    );
}

const spinSlowStyle = `
@keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
.animate-spin-slow {
    animation: spin-slow 20s linear infinite;
}
`;

if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = spinSlowStyle;
    document.head.appendChild(style);
}
