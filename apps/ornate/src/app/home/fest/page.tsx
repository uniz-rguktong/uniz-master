'use client';

import { useEffect, useState, memo } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ArrowLeft, Zap, Star } from 'lucide-react';
import Link from 'next/link';
import { StarField } from '@/components/core/Visuals/StarField';
import { Particles } from '@/components/core/Visuals/Particles';

// ─── HUD Label ──────────────────────────────────────────────────────────────
const HudLabel = memo(({ label, value, color = 'var(--color-neon)' }: { label: string; value: string; color?: string }) => {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[7px] tracking-[0.4em] uppercase font-bold" style={{ color: color + '80' }}>{label}</span>
            <span className="text-[11px] font-black tracking-widest uppercase" style={{ color }}>{value}</span>
        </div>
    );
});
HudLabel.displayName = 'HudLabel';

// Isolated Signal Component to avoid full page re-renders
const SignalStatus = memo(() => {
    const [tick, setTick] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setTick((t: number) => t + 1), 1000);
        return () => clearInterval(id);
    }, []);
    return <HudLabel label="Signal" value={`${tick % 2 === 0 ? '●' : '○'} LIVE`} color="#fbbf24" />;
});
SignalStatus.displayName = 'SignalStatus';

// ─── Category Card ──────────────────────────────────────────────────────────
type CardProps = {
    href: string;
    title: string;
    tagline: string;
    accent: string;
    scanColor: string;
    image: string;
    badge: string;
    events: string[];
    description: string;
    delay: number;
    descFont?: string;
};

const FestCard = memo(({ href, title, tagline, accent, scanColor, image, badge, events, description, delay, descFont }: CardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay, ease: 'easeOut' }}
            className="group flex-1 min-w-0 will-change-transform relative"
        >
            <div
                className="absolute -inset-2 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-[40px] pointer-events-none z-0 rounded-lg"
                style={{ background: `radial-gradient(ellipse at 50% 80%, ${accent}70 0%, ${accent}20 55%, transparent 100%)` }}
            />

            <Link href={href} className="block h-full relative z-10">
                <div
                    className="relative flex flex-col h-full overflow-hidden cursor-pointer transition-all duration-500 group-hover:shadow-[0_0_50px_rgba(0,0,0,0.6)]"
                    style={{
                        background: `linear-gradient(160deg, #070710 0%, #0a0a1a 50%, ${accent}08 100%)`,
                        border: `1px solid ${accent}60`,
                        clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 40px), calc(100% - 40px) 100%, 0 100%)',
                    }}
                >
                    <div
                        className="absolute top-0 left-0 w-full h-[3px] z-20 opacity-70 group-hover:opacity-100 transition-opacity duration-500 will-change-opacity"
                        style={{ background: `linear-gradient(90deg, transparent, ${accent}, ${accent}, transparent)` }}
                    />

                    <div
                        className="absolute inset-0 pointer-events-none z-[1] opacity-30"
                        style={{ backgroundImage: `repeating-linear-gradient(0deg, ${scanColor} 0px, ${scanColor} 1px, transparent 1px, transparent 5px)` }}
                    />

                    <div className="absolute top-0 left-0 w-10 h-10 z-30 pointer-events-none">
                        <div className="absolute top-0 left-0 w-10 h-[2px]" style={{ backgroundColor: accent }} />
                        <div className="absolute top-0 left-0 w-[2px] h-10" style={{ backgroundColor: accent }} />
                    </div>
                    <div className="absolute top-0 right-0 w-10 h-10 z-30 pointer-events-none">
                        <div className="absolute top-0 right-0 w-10 h-[2px]" style={{ backgroundColor: accent }} />
                        <div className="absolute top-0 right-0 w-[2px] h-10" style={{ backgroundColor: accent }} />
                    </div>
                    <div className="absolute bottom-0 left-0 w-10 h-10 z-30 pointer-events-none">
                        <div className="absolute bottom-0 left-0 w-10 h-[2px]" style={{ backgroundColor: accent }} />
                        <div className="absolute bottom-0 left-0 w-[2px] h-10" style={{ backgroundColor: accent }} />
                    </div>

                    <div className="relative flex flex-col flex-1 px-8 pt-7 pb-8 gap-6 z-10">
                        <div className="relative h-64 flex flex-col items-start justify-end mb-2">
                            <div className="absolute inset-0 opacity-40 group-hover:opacity-70 transition-all duration-700 z-0 overflow-hidden rounded-lg">
                                <img
                                    src={image}
                                    alt=""
                                    className="w-full h-full object-cover scale-110 group-hover:scale-125 transition-transform duration-1000 group-hover:saturate-150"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#070710] via-transparent to-transparent" />
                            </div>
                            <h2
                                className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-wider uppercase leading-none mb-2 group-hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all duration-300 relative z-10 font-astra"
                                style={{ color: accent, textShadow: `0 0 30px ${accent}50` }}
                            >
                                {title}
                            </h2>
                            <p className="text-[9px] sm:text-xs text-gray-400 tracking-[0.2em] sm:tracking-[0.35em] uppercase font-bold relative z-10">{tagline}</p>
                        </div>

                        <p className={`text-sm sm:text-base text-gray-200 leading-relaxed tracking-normal opacity-95 ${descFont || ''}`}>{description}</p>

                        <div className="grid grid-cols-3 gap-1.5 py-1.5 px-1.5 bg-white/10 border border-white/15 rounded-sm">
                            <div className="flex flex-col px-2 sm:px-3 py-2 sm:py-3 bg-black/55 border border-white/10">
                                <span className="text-[9px] sm:text-[10px] text-gray-200 tracking-[0.14em] uppercase mb-1 font-bold">Duration</span>
                                <span className="text-sm sm:text-base font-black" style={{ color: accent }}>3 Days</span>
                            </div>
                            <div className="flex flex-col px-2 sm:px-3 py-2 sm:py-3 bg-black/55 border border-white/10">
                                <span className="text-[9px] sm:text-[10px] text-gray-200 tracking-[0.14em] uppercase mb-1 font-bold">Events</span>
                                <span className="text-sm sm:text-base font-black" style={{ color: accent }}>{events.length} Events</span>
                            </div>
                            <div className="flex flex-col px-2 sm:px-3 py-2 sm:py-3 bg-black/55 border border-white/10">
                                <span className="text-[9px] sm:text-[10px] text-gray-200 tracking-[0.14em] uppercase mb-1 font-bold">Section</span>
                                <span className="text-sm sm:text-base font-black" style={{ color: accent }}>{badge}</span>
                            </div>
                        </div>

                        <div
                            className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 mt-auto transition-all duration-300"
                            style={{
                                background: `linear-gradient(90deg, ${accent}15, ${accent}05)`,
                                border: `1px solid ${accent}40`,
                                clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)',
                            }}
                        >
                            <span className="text-[10px] sm:text-xs font-black tracking-[0.2em] sm:tracking-[0.35em] uppercase" style={{ color: accent }}>
                                EXPLORE {title}
                            </span>
                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-300" style={{ color: accent }} />
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
});
FestCard.displayName = 'FestCard';

export default function FestPage() {
    return (
        <main className="fest-scroll relative min-h-screen bg-[#030308] text-white font-orbitron overflow-x-hidden" style={{ overflowY: 'auto', height: '100vh' }}>
            <StarField />
            <Particles />

            <div
                className="fixed inset-0 pointer-events-none z-[1] opacity-[0.06]"
                style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 3px)' }}
            />

            <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden z-10">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(var(--color-neon-rgb, 57, 255, 20), 0.06)_0%,transparent_60%)] pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_60%,rgba(var(--color-neon-rgb, 57, 255, 20), 0.04)_0%,transparent_50%)] pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(251,191,36,0.03)_0%,transparent_50%)] pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="absolute top-6 sm:top-8 left-4 sm:left-8 z-30"
                >
                    <Link
                        href="/home"
                        className="group flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 text-white hover:text-[var(--color-neon)] transition-colors duration-300"
                        style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(8px)', clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)' }}
                    >
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                        <span className="hidden sm:inline text-[9px] font-black tracking-[0.3em] uppercase">Back to Base</span>
                    </Link>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="absolute top-6 sm:top-8 right-4 sm:right-8 z-30 flex items-center gap-2 sm:gap-4"
                >
                    <div className="hidden sm:block">
                        <HudLabel label="Sector" value="ORNATE-26" color="var(--color-neon)" />
                    </div>
                    <div className="hidden sm:block w-px h-8 bg-white/10" />
                    <div className="hidden sm:block">
                        <HudLabel label="Status" value="ACTIVE" color="#22d3ee" />
                    </div>
                    <div className="hidden sm:block w-px h-8 bg-white/10" />
                    <SignalStatus />
                </motion.div>

                <div className="absolute top-4 left-4 w-10 h-10 border-t border-l border-[var(--color-neon)]/30 pointer-events-none z-20" />
                <div className="absolute top-4 right-4 w-10 h-10 border-t border-r border-[var(--color-neon)]/30 pointer-events-none z-20" />
                <div className="absolute bottom-4 left-4 w-10 h-10 border-b border-l border-[var(--color-neon)]/30 pointer-events-none z-20" />
                <div className="absolute bottom-4 right-4 w-10 h-10 border-b border-r border-[var(--color-neon)]/30 pointer-events-none z-20" />

                <div className="relative z-20 flex flex-col items-center text-center px-8 max-w-5xl">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex items-center gap-3 mb-8"
                    >
                        <div className="h-px w-16 bg-gradient-to-r from-transparent to-[var(--color-neon)]/60" />
                        <span className="text-[9px] text-[var(--color-neon)]/60 tracking-[0.5em] uppercase font-black flex items-center gap-2">
                            <Zap className="w-3 h-3" /> Ornate 2K26 Presents
                        </span>
                        <div className="h-px w-16 bg-gradient-to-l from-transparent to-[var(--color-neon)]/60" />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4, duration: 0.7, ease: 'easeOut' }}
                        className="relative mb-4"
                    >
                        <h1
                            className="text-5xl sm:text-[5rem] lg:text-[7rem] font-black tracking-[0.1em] uppercase leading-none"
                            style={{ color: 'var(--color-neon)', textShadow: '0 0 60px rgba(var(--color-neon-rgb, 57, 255, 20), 0.4), 0 0 120px rgba(var(--color-neon-rgb, 57, 255, 20), 0.15)' }}
                        >
                            THE FEST
                        </h1>
                        <div
                            className="absolute inset-x-0 top-1/2 h-[1px] pointer-events-none animate-pulse"
                            style={{ background: 'linear-gradient(90deg, transparent, rgba(var(--color-neon-rgb, 57, 255, 20), 0.3), transparent)', animationDuration: '3s' }}
                        />
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="text-lg text-gray-500 tracking-[0.4em] uppercase font-bold mb-3"
                    >
                        A Fest Beyond Earth
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="flex items-center gap-6 mb-14"
                    >
                        {['MAR 27', 'MAR 28', 'MAR 29'].map((d, i) => (
                            <div key={d} className="flex items-center gap-3">
                                {i > 0 && <div className="w-6 h-px bg-white/10" />}
                                <span
                                    className="text-[10px] font-black tracking-[0.3em] px-3 py-1.5"
                                    style={{
                                        color: i === 0 ? 'var(--color-neon)' : i === 1 ? '#22d3ee' : '#fbbf24',
                                        border: `1px solid ${i === 0 ? 'var(--color-neon)' : i === 1 ? '#22d3ee' : '#fbbf24'}40`,
                                        background: `${i === 0 ? 'var(--color-neon)' : i === 1 ? '#22d3ee' : '#fbbf24'}10`,
                                        clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)',
                                    }}
                                >
                                    DAY {i + 1} · {d}
                                </span>
                            </div>
                        ))}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="flex flex-col items-center gap-2"
                    >
                        <span className="text-[8px] text-gray-700 tracking-[0.4em] uppercase">Choose Your Zone</span>
                        <motion.div
                            animate={{ y: [0, 6, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                            className="w-4 h-4 border-b-2 border-r-2 border-[var(--color-neon)]/30 rotate-45"
                        />
                    </motion.div>
                </div>
            </section>

            <section className="relative z-10 px-10 pb-20 -mt-24">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-4 mb-8"
                >
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                    <div className="flex items-center gap-2">
                        <Star className="w-3 h-3 text-[var(--color-neon)]/60" />
                        <span className="text-[8px] text-gray-600 tracking-[0.5em] uppercase font-black">Select Your Sector</span>
                        <Star className="w-3 h-3 text-[var(--color-neon)]/60" />
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
                </motion.div>

                <div className="flex flex-col md:flex-row gap-8 max-w-7xl mx-auto px-4">
                    <FestCard
                        href="/home/fest/culturals"
                        title="CULTURALS"
                        tagline="Art · Music · Drama · Dance"
                        accent="#22d3ee"
                        scanColor="rgba(var(--color-neon-rgb, 57, 255, 20), 0.06)"
                        image="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80"
                        badge="Cultural Wing"
                        events={['Dance', 'Music', 'Drama', 'Fine Arts', 'Fashion', 'Literary']}
                        description="Take part in music, dance, drama, and art events. This zone is for creativity, performances, and team showcases."
                        delay={0.2}
                        descFont="font-rajdhani"
                    />
                    <FestCard
                        href="/home/fest/sports"
                        title="SPORTS"
                        tagline="Compete · Conquer · Champion"
                        accent="#fbbf24"
                        scanColor="rgba(251,191,36,0.06)"
                        image="https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=1200&q=80"
                        badge="Sports Wing"
                        events={['Cricket', 'Football', 'Basketball', 'Badminton', 'Chess', 'Athletics']}
                        description="Join competitive games and athletic challenges. This zone is for players who want to compete, improve, and win as a team."
                        delay={0.4}
                        descFont="font-rajdhani"
                    />
                </div>
            </section>
        </main>
    );
}
