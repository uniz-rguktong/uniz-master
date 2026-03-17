'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trophy, Sparkles, Share2, Zap, Activity, LayoutGrid, X, Target, Users, BrainCircuit, Mic, Star } from 'lucide-react';
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
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Link href="/home/fun/cosmos" className="group relative inline-flex items-center justify-center px-10 py-5 font-black text-white uppercase tracking-widest bg-gradient-to-r from-[var(--color-neon)]/20 to-[#FF00E5]/20 border border-[var(--color-neon)] rounded-full shadow-[0_0_30px_rgba(0,209,255,0.5)] hover:shadow-[0_0_50px_rgba(255,0,229,0.8)] hover:border-[#FF00E5] transition-all duration-500 hover:scale-105">
                                    <span className="absolute inset-0 w-full h-full rounded-full bg-gradient-to-r from-[var(--color-neon)]/30 via-[#FF00E5]/30 to-[var(--color-neon)]/30 opacity-50 group-hover:opacity-100 transition-opacity animate-pulse blur-sm"></span>
                                    <Star className="w-6 h-6 mr-4 text-white group-hover:animate-spin relative z-10" />
                                    <span className="relative z-10 text-lg tracking-[0.2em]">CLICK TO EXPERIENCE THE REAL UNIVERSE</span>

                                    {/* Particle effects for glow */}
                                    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[var(--color-neon)] to-[#FF00E5] blur-xl opacity-20 group-hover:opacity-60 transition-opacity rounded-full"></div>
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
                                    <h3 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white italic">MS/MR <span className="text-[var(--color-neon)] opacity-50">RGUKT</span></h3>
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


                {/* SECTION 6: WIDGETS & CHALLENGES */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 pb-20">
                    <div className="col-span-1 lg:col-span-2 flex flex-col gap-12">
                        <div className="flex-1 bg-gradient-to-br from-[var(--color-neon)]/10 to-transparent border border-[var(--color-neon)]/30 rounded-[3.5rem] p-12 flex flex-col md:flex-row items-center justify-between group hover:border-[var(--color-neon)]/60 transition-all duration-700 shadow-2xl">
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <Target className="w-8 h-8 text-[var(--color-neon)]" />
                                    <span className="text-sm font-black text-[var(--color-neon)] uppercase tracking-[0.6em] italic">Active Mission Sector</span>
                                </div>
                                <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white italic">Weekly <span className="text-[var(--color-neon)]">Challenges</span></h3>
                                <p className="text-gray-400 text-base max-w-lg leading-relaxed font-medium">Complete 5 AI-based minigames this week to unlock the exclusive "Neural Hacker" badge and bonus Social Score for the global rankings.</p>
                            </div>
                            <div className="w-48 h-48 rounded-full border-8 border-[var(--color-neon)]/10 flex items-center justify-center relative mt-8 md:mt-0">
                                <svg className="absolute inset-0 w-full h-full -rotate-90">
                                    <circle cx="96" cy="96" r="88" fill="none" stroke="var(--color-neon)" strokeWidth="8" strokeDasharray="552" strokeDashoffset="193" />
                                </svg>
                                <div className="text-center">
                                    <span className="text-5xl font-black text-white block">65%</span>
                                    <span className="text-[10px] text-[var(--color-neon)] font-black tracking-widest uppercase">Sync Progress</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="bg-white/[0.03] border border-white/10 rounded-[3rem] p-12 relative overflow-hidden group cursor-pointer hover:bg-white/[0.05] hover:border-[var(--color-neon)]/50 transition-all duration-700">
                                <Sparkles className="w-12 h-12 text-[var(--color-neon)] mb-6 group-hover:scale-110 transition-transform" />
                                <h3 className="text-2xl font-black uppercase tracking-widest text-white mb-4 italic">Submit Game Idea</h3>
                                <p className="text-gray-500 text-sm tracking-wide leading-relaxed font-medium">Have a fun game idea? Share it with the team and help shape the next event.</p>
                            </div>

                            <div className="bg-[#FF00E5]/5 border border-[#FF00E5]/20 rounded-[3rem] p-12 relative overflow-hidden flex flex-col justify-center items-center text-center group cursor-pointer hover:border-[#FF00E5]/60 transition-all duration-700">
                                <Share2 className="w-16 h-16 text-[#FF00E5] mb-6 group-hover:scale-110 transition-transform duration-500" />
                                <h3 className="text-2xl font-black uppercase tracking-widest text-white mb-4 italic">Share Your Scores</h3>
                                <p className="text-[#FF00E5]/80 text-sm tracking-wide font-black uppercase italic">Share your scores and earn 500 Social XP</p>
                            </div>
                        </div>
                    </div>
                </section>

            </div>

            <MissionsFooter />
        </main >
    );
}
