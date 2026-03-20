'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trophy, Sparkles, Zap, Activity, LayoutGrid, X, Users, BrainCircuit, Mic, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import MissionsFooter from '@/components/missions/MissionsFooter';
import SectorHeader from '@/components/layout/SectorHeader';

export default function FunPlanetPage() {
    const [mounted, setMounted] = useState(false);
    const [bubbles] = useState(() =>
        Array.from({ length: 15 }, () => ({
            initialX: Math.random() * 100 + "%",
            initialY: Math.random() * 100 + "%",
            animateX1: (Math.random() * 100) + "%",
            animateX2: (Math.random() * 100) + "%",
            animateY1: (Math.random() * 100) + "%",
            animateY2: (Math.random() * 100) + "%",
            duration: 15 + Math.random() * 20,
            width: 20 + Math.random() * 60 + "px",
            height: 20 + Math.random() * 60 + "px"
        }))
    );
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    const GAMES = {
        social: [
            { name: "Ms/Mr RGUKT", players: "4.2k", score: "Ultra", image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&q=80", path: "#" }
        ]
    };



    if (!mounted) return null;

    return (
        <main className="relative min-h-screen bg-[#050508] font-orbitron text-white overflow-x-hidden pt-0 pb-12 selection:bg-[#FF00E5]/30">

            {/* Global Background Particles & Nebula */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-[#FF00E5]/10 blur-[150px] rounded-full animate-pulse" />
                <motion.div
                    animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                    className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[var(--color-neon)]/10 blur-[180px] rounded-full"
                />

                {/* Floating Bubbles */}
                {bubbles.map((bubble, i) => (
                    <motion.div
                        key={i}
                        initial={{ x: bubble.initialX, y: bubble.initialY, opacity: 0 }}
                        animate={{
                            x: [bubble.animateX1, bubble.animateX2],
                            y: [bubble.animateY1, bubble.animateY2],
                            opacity: [0.1, 0.4, 0.1],
                            scale: [1, 1.5, 1]
                        }}
                        transition={{ duration: bubble.duration, repeat: Infinity, ease: "linear" }}
                        className="absolute rounded-full border border-white/10"
                        style={{
                            width: bubble.width,
                            height: bubble.height,
                            background: `radial-gradient(circle at 30% 30%, rgba(255,0,229,0.1), transparent)`
                        }}
                    />
                ))}
                <div className="absolute inset-0 bg-[#050508]/60 backdrop-blur-[20px]" />
            </div>

            {/* Top Navigation HUD */}
            <SectorHeader
                accentColor="#FF00E5"
                showTitle={false}
            />

            <div className="relative z-10 max-w-7xl mx-auto px-6 space-y-32">

                {/* SECTION 1: HERO */}
                <section className="text-center pt-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="flex items-center justify-center gap-4 mb-6">
                            <span className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#FF00E5]" />
                            <span className="text-[#FF00E5] text-sm font-black tracking-[0.6em] uppercase flex items-center gap-2">
                                <Sparkles className="w-4 h-4" /> Entertainment Module
                            </span>
                            <span className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#FF00E5]" />
                        </div>
                        <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter uppercase leading-[0.9] drop-shadow-2xl text-transparent bg-clip-text bg-gradient-to-r from-[#FF00E5] via-[var(--color-neon)] to-white mb-6">
                            Fun Planet
                        </h1>
                        <p className="max-w-2xl mx-auto text-gray-400 font-medium text-lg leading-relaxed tracking-wide mb-10">
                            Quick campus-friendly games: social face-offs, fast AI mini-games, and voice challenges you can play with friends.
                        </p>

                        <div className="flex justify-center mt-12 mb-8 relative z-50">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5, duration: 0.8 }}
                                className="w-full max-w-4xl"
                            >
                                <Link href="/home/fun/cosmos" className="group block relative h-[380px] sm:h-[450px] w-full rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden border border-white/10 hover:border-[#FF00E5]/50 transition-all duration-700 shadow-2xl">
                                    {/* Main Image Layer */}
                                    <Image
                                        src="https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1400&q=80"
                                        alt="Cosmos Universe"
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-[3s] ease-linear"
                                    />
                                    
                                    {/* Overlays */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#050510] via-[#050510]/60 to-transparent" />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />

                                    {/* Animated Grains/Particles for 'Cosmic' feel */}
                                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] pointer-events-none" />

                                    {/* Card Content Header */}
                                    <div className="absolute top-4 left-4 sm:top-8 sm:left-8 flex flex-wrap items-center gap-3 sm:gap-4">
                                        <div className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-[#FF00E5]/20 backdrop-blur-md border border-[#FF00E5]/30">
                                            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[#FF00E5]">Open World</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 sm:gap-2 text-white/60 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md">
                                            <Activity className="w-2.5 h-2.5 sm:w-3 h-3 text-[var(--color-neon)]" />
                                            <span>2.4k Exploring</span>
                                        </div>
                                    </div>

                                    {/* Central Titles */}
                                    <div className="absolute inset-x-0 bottom-0 p-5 sm:p-10 flex flex-col items-center text-center">
                                        <motion.div
                                            animate={{ opacity: [0.7, 1, 0.7] }}
                                            transition={{ duration: 3, repeat: Infinity }}
                                            className="text-[var(--color-neon)] text-[9px] sm:text-xs font-black tracking-[0.4em] sm:tracking-[0.5em] uppercase mb-2 sm:mb-4"
                                        >
                                            Mission: Explore the Void
                                        </motion.div>
                                        <h2 className="text-3xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter text-white mb-4 sm:mb-6 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                                            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#FF00E5] to-[var(--color-neon)] text-glow">Cosmos</span>
                                        </h2>
                                        
                                        <div className="flex items-center gap-3 sm:gap-6 mb-6 sm:mb-8 transition-all duration-500 md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
                                            <div className="text-center">
                                                <div className="text-white text-xs sm:text-xl font-bold italic line-clamp-1 lowercase whitespace-nowrap">infinite</div>
                                                <div className="text-gray-500 text-[7px] sm:text-[9px] font-black uppercase tracking-widest">Scale</div>
                                            </div>
                                            <div className="w-[1px] h-6 sm:h-8 bg-white/10" />
                                            <div className="text-center">
                                                <div className="text-white text-xs sm:text-xl font-bold italic line-clamp-1 lowercase whitespace-nowrap">Unknown</div>
                                                <div className="text-gray-500 text-[7px] sm:text-[9px] font-black uppercase tracking-widest">Danger</div>
                                            </div>
                                             <div className="w-[1px] h-6 sm:h-8 bg-white/10" />
                                            <div className="text-center">
                                                <div className="text-white text-xs sm:text-xl font-bold italic line-clamp-1 lowercase whitespace-nowrap">Mastery</div>
                                                <div className="text-gray-500 text-[7px] sm:text-[9px] font-black uppercase tracking-widest">Reward</div>
                                            </div>
                                        </div>

                                        <div className="relative inline-flex items-center justify-center px-6 py-3 sm:px-10 sm:py-4 font-black text-white uppercase tracking-widest bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl group-hover:bg-[#FF00E5] group-hover:border-[#FF00E5] group-hover:shadow-[0_0_30px_rgba(255,0,229,0.5)] transition-all duration-300">
                                            <span className="relative z-10 flex items-center gap-2 sm:gap-3 text-[10px] sm:text-sm">
                                                <Zap className="w-4 h-4 sm:w-5 h-5 fill-current" />
                                                ENTER UNIVERSE
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Hover Corner Decoration */}
                                    <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-bl from-[#FF00E5]/20 to-transparent shadow-inner opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                </Link>
                            </motion.div>
                        </div>
                    </motion.div>
                </section>

                {/* SECTION 2: FEATURED GAMES CAROUSEL */}
                <section>
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-2 h-8 bg-[var(--color-neon)]" />
                            <h2 className="text-3xl font-black uppercase tracking-widest text-white">Featured <span className="text-[var(--color-neon)]">Event</span></h2>
                        </div>
                    </div>

                    <div
                        className="flex overflow-x-auto snap-x snap-mandatory gap-8 pb-4 [&::-webkit-scrollbar]:hidden"
                        style={{ scrollbarWidth: 'none' }}
                    >
                        <div
                            onClick={() => toast.info('System Update: This sector is currently under construction. Ms/Mr RGUKT is coming soon!', {
                                description: 'Stay tuned for the official uplink.',
                                icon: <BrainCircuit className="w-5 h-5 text-neon" />,
                            })}
                            className="relative h-[28rem] w-full rounded-[2.5rem] overflow-hidden group cursor-pointer border border-[var(--color-neon)]/30 hover:border-[var(--color-neon)] transition-all duration-700 shadow-[0_0_50px_rgba(57,255,20,0.08)]"
                        >
                            {/* Main Banner Image */}
                            <Image
                                src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1400&q=80"
                                alt="Ms/Mr RGUKT"
                                fill
                                className="object-cover opacity-50 group-hover:scale-105 group-hover:opacity-75 transition-all duration-1000"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#050510] via-[#050510]/60 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-r from-[#050510]/60 via-transparent to-transparent" />

                            {/* Top badge */}
                            <div className="absolute top-8 left-8">
                                <span className="text-[10px] font-black tracking-[0.4em] text-[var(--color-neon)] bg-[var(--color-neon)]/10 px-4 py-1.5 rounded-full uppercase border border-[var(--color-neon)]/30 mb-3 inline-block">Mega Event Sector</span>
                            </div>

                            {/* Participant preview strip — top right */}
                            <div className="absolute top-8 right-8 flex flex-col items-end gap-3 z-10">
                                <div className="flex -space-x-3">
                                    {[
                                        { src: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&q=80', name: 'Rahul' },
                                        { src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80', name: 'Ananya' },
                                        { src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80', name: 'Vikram' },
                                        { src: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&q=80', name: 'Sneha' },
                                    ].map((p, i) => (
                                        <div
                                            key={i}
                                            className="w-12 h-12 rounded-full border-2 border-[var(--color-neon)]/60 overflow-hidden shadow-[0_0_12px_rgba(57,255,20,0.3)] transition-transform hover:scale-110 hover:z-10 relative"
                                            style={{ zIndex: 4 - i }}
                                        >
                                            <Image src={p.src} alt={p.name} width={48} height={48} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                    <div className="w-12 h-12 rounded-full border-2 border-[var(--color-neon)] bg-[var(--color-neon)] flex items-center justify-center text-black font-black text-xs shadow-[0_0_15px_rgba(57,255,20,0.5)]">+4k</div>
                                </div>
                                <span className="text-[9px] font-black text-[var(--color-neon)]/60 tracking-[0.3em] uppercase bg-black/50 px-2 py-1 rounded backdrop-blur-md">Participants Registered</span>
                            </div>

                            {/* Bottom info */}
                            <div className="absolute bottom-0 left-0 p-10 w-full">
                                <div className="flex justify-between items-end">
                                    <div className="space-y-2">
                                        <h3 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white italic">Mr/Ms <span className="text-[var(--color-neon)] opacity-50">RGUKT</span></h3>
                                        <p className="text-[var(--color-neon)]/40 font-bold tracking-[0.2em] text-sm uppercase italic">Transmission Incoming: Coming Soon</p>
                                        <div className="flex items-center gap-1 pt-1">
                                            {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 fill-[var(--color-neon)] text-[var(--color-neon)]" />)}
                                            <span className="text-[var(--color-neon)] text-xs font-black ml-1">5.0</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-4">
                                        <button className="bg-white/10 text-white/40 px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs border border-white/10 cursor-not-allowed">Coming Soon</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>



            </div>

            <MissionsFooter />
        </main >
    );
}
