'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trophy, Zap, Users, Star, Activity, Sparkles, X, Search, ChevronLeft, ChevronRight, Share2, BrainCircuit, TrendingUp } from 'lucide-react';

export default function MsMrRguktPage() {
    const [mounted, setMounted] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [leaderPage, setLeaderPage] = useState(1);
    const [selectedParticipant, setSelectedParticipant] = useState<any>(null);
    const [isRegistered, setIsRegistered] = useState(false);

    const USER_STATS = {
        name: "YOU",
        dept: "COMM-OPS",
        votes: 128,
        rank: 42,
        trend: "UP"
    };

    const PARTICIPANTS = [
        { id: "P1", name: "Rahul Sharma", dept: "CSE", img: "https://i.pravatar.cc/150?u=rahul", comments: ["Best candidate!", "Go Rahul!"] },
        { id: "P2", name: "Ananya Patel", dept: "ECE", img: "https://i.pravatar.cc/150?u=ananya", comments: ["Stunning!", "Voting for you."] },
        { id: "P3", name: "Vikram Reddy", dept: "MECH", img: "https://i.pravatar.cc/150?u=vikram", comments: ["True leader."] },
        { id: "P4", name: "Sneha Kapoor", dept: "CIVIL", img: "https://i.pravatar.cc/150?u=sneha", comments: [] },
        { id: "P5", name: "Sameer Varma", dept: "CHEM", img: "https://i.pravatar.cc/150?u=sameer", comments: ["Great personality."] },
        { id: "P6", name: "Priya Singh", dept: "MME", img: "https://i.pravatar.cc/150?u=priya", comments: [] },
        { id: "P7", name: "Arun Kumar", dept: "CSE", img: "https://i.pravatar.cc/150?u=arun", comments: [] },
        { id: "P8", name: "Ishani Das", dept: "ECE", img: "https://i.pravatar.cc/150?u=ishani", comments: [] },
    ];

    const PAGEANT_LEADERS = [
        { rank: 1, name: "Ananya Patel", votes: 1240, dept: "ECE", img: "https://i.pravatar.cc/150?u=ananya", comments: ["Stunning!", "Voting for you."] },
        { rank: 2, name: "Rahul Sharma", votes: 1105, dept: "CSE", img: "https://i.pravatar.cc/150?u=rahul", comments: ["Best candidate!", "Go Rahul!"] },
        { rank: 3, name: "Vikram Reddy", votes: 890, dept: "MECH", img: "https://i.pravatar.cc/150?u=vikram", comments: ["True leader."] },
        { rank: 4, name: "Sneha Kapoor", votes: 750, dept: "CIVIL", img: "https://i.pravatar.cc/150?u=sneha", comments: [] },
        { rank: 5, name: "Sameer Varma", votes: 620, dept: "CHEM", img: "https://i.pravatar.cc/150?u=sameer", comments: ["Great personality."] },
        { rank: 6, name: "Priya Singh", votes: 540, dept: "MME", img: "https://i.pravatar.cc/150?u=priya", comments: [] },
        { rank: 7, name: "Arun Kumar", votes: 480, dept: "CSE", img: "https://i.pravatar.cc/150?u=arun", comments: [] },
        { rank: 8, name: "Ishani Das", votes: 410, dept: "ECE", img: "https://i.pravatar.cc/150?u=ishani", comments: [] },
        { rank: 9, name: "Kiran Rao", votes: 350, dept: "CSE", img: "https://i.pravatar.cc/150?u=kiran", comments: [] },
        { rank: 10, name: "Megha Jain", votes: 290, dept: "ECE", img: "https://i.pravatar.cc/150?u=megha", comments: [] },
    ];

    const filteredParticipants = PARTICIPANTS.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.dept.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <main className="relative min-h-screen bg-[#050508] font-orbitron text-white overflow-x-hidden pt-24 pb-12 selection:bg-[var(--color-neon)]/30">

            {/* Tactical Backdrop */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden text-[var(--color-neon)]">
                <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-[var(--color-neon)]/10 blur-[150px] rounded-full animate-pulse" />
                <motion.div
                    animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                    className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[var(--color-neon)]/10 blur-[180px] rounded-full"
                />
                <div className="absolute inset-0 bg-[#050508]/60 backdrop-blur-[20px]" />
            </div>

            {/* Navigation */}
            <nav className="fixed top-0 left-0 w-full p-8 z-50 flex justify-between items-start">
                <Link href="/home/fun" className="group flex items-center gap-3 text-white/70 hover:text-[#39FF14] transition-all pointer-events-auto bg-black/40 backdrop-blur-md px-6 py-3 border-l-2 border-r-2 border-[#39FF14]/30 hover:bg-[#39FF14]/10 hover:border-[#39FF14] shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-black tracking-[0.3em] text-xs uppercase text-[var(--color-neon)]">Back to Fun Planet</span>
                </Link>

                <div className="flex flex-col items-end gap-4">
                    <div className="bg-[var(--color-neon)]/5 border border-[var(--color-neon)]/20 px-8 py-3 rounded-full flex items-center gap-4 hidden sm:flex">
                        <div className="w-2 h-2 rounded-full bg-[var(--color-neon)] animate-pulse" />
                        <span className="text-[10px] font-black tracking-[0.4em] text-[var(--color-neon)] uppercase">Identity: Pageant_Uplink</span>
                    </div>

                    {/* USER STATS HUD - TOP RIGHT AFTER REGISTRATION */}
                    <AnimatePresence>
                        {isRegistered && (
                            <motion.div
                                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                className="bg-black/60 border border-[var(--color-neon)]/30 p-5 rounded-2xl backdrop-blur-2xl shadow-[0_0_50px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.15)] flex flex-col gap-4 min-w-[280px] pointer-events-auto"
                            >
                                <div className="flex items-center justify-between border-b border-[var(--color-neon)]/10 pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-[var(--color-neon)]/10 border border-[var(--color-neon)]/30 flex items-center justify-center">
                                            <Users className="w-5 h-5 text-[var(--color-neon)]" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-[var(--color-neon)] tracking-widest uppercase">Competitor_Status</span>
                                            <span className="text-sm font-black text-white italic tracking-widest">{USER_STATS.name}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[8px] font-black text-white/30 uppercase block">Node_ID</span>
                                        <span className="text-[10px] font-black text-[var(--color-neon)]">{USER_STATS.dept}_404</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 border border-white/5 p-3 rounded-xl flex flex-col">
                                        <span className="text-[8px] font-black text-white/30 uppercase mb-1">Total Votes</span>
                                        <div className="flex items-center gap-2">
                                            <Zap className="w-3 h-3 text-[var(--color-neon)]" />
                                            <span className="text-lg font-black text-white tabular-nums">{USER_STATS.votes}</span>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 border border-white/5 p-3 rounded-xl flex flex-col">
                                        <span className="text-[8px] font-black text-white/30 uppercase mb-1">Global Rank</span>
                                        <div className="flex items-center gap-2">
                                            <Star className="w-3 h-3 text-amber-400" />
                                            <span className="text-lg font-black text-white tabular-nums">#{USER_STATS.rank}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between bg-[var(--color-neon)]/5 p-2 rounded-lg border border-[var(--color-neon)]/10">
                                    <span className="text-[8px] font-black text-[var(--color-neon)] tracking-widest uppercase">Reputation_Trend</span>
                                    <div className="flex items-center gap-1.5">
                                        <TrendingUp className="w-3 h-3 text-[var(--color-neon)]" />
                                        <span className="text-[9px] font-black text-[var(--color-neon)]">+{USER_STATS.trend}_SIGNAL</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </nav>

            <div className="relative z-10 max-w-7xl mx-auto px-6 space-y-12">

                {/* 1. TITLE (Decreased size) */}
                <div className="text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[var(--color-neon)]/5 border border-[var(--color-neon)]/20 mb-5"
                    >
                        <Trophy className="w-3.5 h-3.5 text-[var(--color-neon)]" />
                        <span className="text-[9px] text-[var(--color-neon)] tracking-[0.3em] font-black uppercase italic">Major Sector Event</span>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-5xl md:text-7xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-[0_0_25px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.3)] mb-3"
                    >
                        MS/MR <span className="text-[var(--color-neon)]">RGUKT</span>
                    </motion.h1>
                    <p className="text-gray-500 font-bold tracking-[0.2em] uppercase text-[9px] opacity-60">Official University Pageant Terminal</p>
                </div>

                {/* 2. REGISTER BUTTON (Decreased size) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center"
                >
                    <div className="relative group w-full max-w-lg">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--color-neon)]/40 to-[var(--color-neon)]/0 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <button
                            onClick={() => setIsRegistered(true)}
                            disabled={isRegistered}
                            className={`relative w-full py-5 font-black uppercase tracking-[0.4em] transition-all text-xs rounded-xl flex items-center justify-center gap-4 group-hover:translate-y-[-1px] ${isRegistered ? 'bg-white/10 text-white/20 border border-white/10 cursor-not-allowed' : 'bg-[var(--color-neon)] text-black hover:bg-white shadow-[0_10px_30px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.3)]'}`}
                        >
                            {isRegistered ? (
                                <>
                                    <Activity className="w-5 h-5" />
                                    Competitior Uplink Synchronized
                                </>
                            ) : (
                                <>
                                    <Zap className="w-5 h-5" />
                                    Authorize Global Entry
                                </>
                            )}
                        </button>
                        <div className="mt-2.5 text-center text-[8px] text-[var(--color-neon)]/40 font-black tracking-[0.3em] uppercase italic">
                            {isRegistered ? 'Global identity verified. Ranking nodes are now tracking your reputation.' : 'Complete the uplink to enter the competition node'}
                        </div>
                    </div>
                </motion.div>

                {/* 3. PARTICIPANTS DETAILS (Decreased font) */}
                <section className="bg-black/60 border border-white/10 rounded-[2rem] p-6 space-y-6 relative overflow-hidden flex flex-col shadow-2xl backdrop-blur-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-[var(--color-neon)]" />
                            <h2 className="text-sm font-black tracking-[0.2em] text-white uppercase italic">Participant Registry</h2>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-neon)]/10 border border-[var(--color-neon)]/20">
                            <div className="w-1 h-1 rounded-full bg-[var(--color-neon)] animate-pulse" />
                            <span className="text-[9px] font-mono text-[var(--color-neon)] uppercase tracking-widest">Active</span>
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                            type="text"
                            placeholder="SEARCH CANDIDATE NODES..."
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg py-5 pl-14 pr-10 text-[10px] font-black tracking-[0.1em] text-white placeholder:text-white/20 focus:outline-none focus:border-[var(--color-neon)]/50 transition-colors uppercase"
                        />
                    </div>

                    <div className="h-[500px] overflow-y-auto custom-scrollbar-green pr-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredParticipants.map(p => (
                                <motion.div
                                    key={p.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    onClick={() => setSelectedParticipant(p)}
                                    className="flex flex-col p-5 bg-white/[0.03] border border-white/5 rounded-2xl hover:border-[var(--color-neon)]/30 hover:bg-white/[0.06] transition-all group/p cursor-pointer"
                                >
                                    <div className="flex items-center gap-5 mb-5">
                                        <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 relative shrink-0 group-hover/p:border-[var(--color-neon)]/50 transition-all">
                                            <Image
                                                src={p.img}
                                                alt={p.name}
                                                width={64}
                                                height={64}
                                                loading="lazy"
                                                className="w-full h-full object-cover group-hover/p:scale-110 transition-transform duration-700"
                                            />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-black text-white uppercase tracking-widest group-hover/p:text-[var(--color-neon)] transition-colors truncate">{p.name}</span>
                                            <span className="text-[9px] text-[var(--color-neon)] font-mono tracking-[0.2em] uppercase mt-1 opacity-70">NODE_{p.dept}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedParticipant(p);
                                        }}
                                        className="w-full py-3 border border-[var(--color-neon)]/20 text-[var(--color-neon)] text-[9px] font-black uppercase tracking-[0.2em] hover:bg-[var(--color-neon)] hover:text-black transition-all rounded-lg shadow-sm"
                                    >
                                        Inspect Uplink
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 4. LEADERBOARD (Decreased font) */}
                <section className="bg-black/80 border border-white/10 rounded-[2rem] p-8 space-y-8 relative overflow-hidden flex flex-col shadow-2xl backdrop-blur-3xl">
                    <div className="flex items-center gap-5">
                        <div className="w-1 h-10 bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)]" />
                        <div className="flex flex-col">
                            <h2 className="text-2xl font-black tracking-[0.2em] uppercase italic text-white leading-none">Live Standing</h2>
                            <span className="text-[9px] tracking-[0.4em] text-amber-400/60 uppercase font-black mt-2 italic text-xs">Holographic Signature Feed</span>
                        </div>
                    </div>

                    {/* 1. TOP 3 PODIUM / BAR CHART */}
                    <div className="flex items-end justify-center gap-1 sm:gap-6 mb-16 h-80 border-b border-white/5 pb-4">
                        {/* 3rd Place (Left) */}
                        {PAGEANT_LEADERS[2] && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                whileInView={{ height: '55%', opacity: 1 }}
                                onClick={() => setSelectedParticipant(PAGEANT_LEADERS[2])}
                                className="flex-1 max-w-[180px] bg-gradient-to-t from-[#CD7F32]/10 to-[#CD7F32]/30 border-t-4 border-[#CD7F32] rounded-t-[2rem] flex flex-col items-center justify-end p-4 relative group cursor-pointer"
                            >
                                <div className="absolute -top-16 flex flex-col items-center">
                                    <div className="w-14 h-14 rounded-full border-2 border-[#CD7F32] overflow-hidden">
                                        <Image src={PAGEANT_LEADERS[2].img} alt={PAGEANT_LEADERS[2].name} width={56} height={56} loading="lazy" className="w-full h-full object-cover" />
                                    </div>
                                    <span className="text-[10px] font-black text-[#CD7F32] uppercase mt-2">Rank 03</span>
                                </div>
                                <span className="text-xs font-black text-white uppercase truncate w-full text-center px-1 mb-1">{PAGEANT_LEADERS[2].name.split(' ')[0]}</span>
                                <span className="text-xl font-black text-[#CD7F32]">{PAGEANT_LEADERS[2].votes}</span>
                            </motion.div>
                        )}

                        {/* 1st Place (Middle) */}
                        {PAGEANT_LEADERS[0] && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                whileInView={{ height: '100%', opacity: 1 }}
                                onClick={() => setSelectedParticipant(PAGEANT_LEADERS[0])}
                                className="flex-1 max-w-[220px] bg-gradient-to-t from-amber-400/10 to-amber-400/40 border-t-4 border-amber-400 rounded-t-[2rem] flex flex-col items-center justify-end p-6 relative group cursor-pointer shadow-[0_0_50px_rgba(251,191,36,0.1)]"
                            >
                                <div className="absolute -top-20 flex flex-col items-center">
                                    <div className="w-20 h-20 rounded-full border-4 border-amber-400 overflow-hidden shadow-[0_0_30px_rgba(251,191,36,0.4)]">
                                        <Image src={PAGEANT_LEADERS[0].img} alt={PAGEANT_LEADERS[0].name} width={80} height={80} loading="lazy" className="w-full h-full object-cover" />
                                    </div>
                                    <Trophy className="w-6 h-6 text-amber-400 mt-2 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]" />
                                </div>
                                <span className="text-sm font-black text-white uppercase truncate w-full text-center px-1 mb-2 tracking-widest">{PAGEANT_LEADERS[0].name}</span>
                                <span className="text-4xl font-black text-amber-400 leading-none drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">{PAGEANT_LEADERS[0].votes}</span>
                                <span className="text-[9px] font-black text-amber-400/50 tracking-[0.5em] uppercase mb-4">Elite Sector Leader</span>
                            </motion.div>
                        )}

                        {/* 2nd Place (Right) */}
                        {PAGEANT_LEADERS[1] && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                whileInView={{ height: '75%', opacity: 1 }}
                                onClick={() => setSelectedParticipant(PAGEANT_LEADERS[1])}
                                className="flex-1 max-w-[180px] bg-gradient-to-t from-[#C0C0C0]/10 to-[#C0C0C0]/30 border-t-4 border-[#C0C0C0] rounded-t-[2rem] flex flex-col items-center justify-end p-4 relative group cursor-pointer"
                            >
                                <div className="absolute -top-16 flex flex-col items-center">
                                    <div className="w-16 h-16 rounded-full border-2 border-[#C0C0C0] overflow-hidden">
                                        <Image src={PAGEANT_LEADERS[1].img} alt={PAGEANT_LEADERS[1].name} width={64} height={64} loading="lazy" className="w-full h-full object-cover" />
                                    </div>
                                    <span className="text-[10px] font-black text-[#C0C0C0] uppercase mt-2">Rank 02</span>
                                </div>
                                <span className="text-xs font-black text-white uppercase truncate w-full text-center px-1 mb-1">{PAGEANT_LEADERS[1].name.split(' ')[0]}</span>
                                <span className="text-2xl font-black text-[#C0C0C0]">{PAGEANT_LEADERS[1].votes}</span>
                            </motion.div>
                        )}
                    </div>

                    {/* Remaining Leaders List */}
                    <div className="h-[450px] overflow-y-auto custom-scrollbar-green space-y-3 pr-3">
                        {PAGEANT_LEADERS.slice(3).map((l, i) => (
                            <motion.div
                                key={l.rank}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                onClick={() => setSelectedParticipant(l)}
                                className="relative p-6 bg-white/[0.02] border border-white/5 overflow-hidden group/rank hover:bg-white/[0.04] transition-all cursor-pointer flex items-center justify-between rounded-2x"
                                style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}
                            >
                                <div className="flex items-center gap-8 relative z-10">
                                    <div className="w-10 text-center">
                                        <span className="text-2xl font-black italic text-white/5 group-hover/rank:text-[var(--color-neon)]/20 transition-colors">
                                            {l.rank < 10 ? `0${l.rank}` : l.rank}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-5">
                                        <div className="w-10 h-10 rounded-lg border border-white/10 overflow-hidden shadow-lg">
                                            <Image src={l.img} alt={l.name} width={40} height={40} loading="lazy" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[13px] font-black text-white uppercase tracking-[0.1em] group-hover/rank:text-[var(--color-neon)] transition-colors">{l.name}</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-neon)]/40 animate-pulse" />
                                                <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black italic">NODE_{l.dept}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end relative z-10">
                                    <span className="text-3xl font-black text-[var(--color-neon)] tabular-nums tracking-tighter leading-none drop-shadow-[0_0_15px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.3)]">{l.votes}</span>
                                    <span className="text-[8px] text-white/20 uppercase tracking-[0.4em] font-black mt-2 italic">Reputation_Index</span>
                                </div>
                                <div className="absolute bottom-0 left-0 h-[3px] bg-gradient-to-r from-transparent via-[var(--color-neon)]/20 to-transparent w-0 group-hover/rank:w-full transition-all duration-1000" />
                            </motion.div>
                        ))}
                    </div>

                    <div className="text-center pt-5 opacity-20 border-t border-white/5 flex justify-center gap-10">
                        <span className="text-[9px] font-black tracking-[0.5em] uppercase italic">Real-Time Sector Refresh Active</span>
                        <span className="text-[9px] font-black tracking-[0.5em] uppercase italic">Nodes Verified</span>
                    </div>
                </section>

                <div className="text-center pt-10 pb-20">
                    <p className="text-gray-600 text-[9px] font-black tracking-[0.6em] uppercase mb-10 italic opacity-50">Identity verification protocols are subject to Ornate Sector authority</p>
                    <div className="flex justify-center gap-12">
                        <div className="flex flex-col items-center gap-5 group cursor-pointer opacity-30 hover:opacity-100 transition-all">
                            <div className="w-14 h-14 rounded-full border-2 border-white/10 flex items-center justify-center group-hover:border-[var(--color-neon)] group-hover:bg-[var(--color-neon)]/5 transition-all">
                                <Sparkles className="w-7 h-7 text-[var(--color-neon)]" />
                            </div>
                            <span className="text-[8px] font-black text-white tracking-[0.3em] uppercase">Rewards Hub</span>
                        </div>
                        <div className="flex flex-col items-center gap-5 group cursor-pointer opacity-30 hover:opacity-100 transition-all">
                            <div className="w-14 h-14 rounded-full border-2 border-white/10 flex items-center justify-center group-hover:border-[var(--color-neon)] group-hover:bg-[var(--color-neon)]/5 transition-all">
                                <Activity className="w-7 h-7 text-[var(--color-neon)]" />
                            </div>
                            <span className="text-[8px] font-black text-white tracking-[0.3em] uppercase">Sector Trace</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* PARTICIPANT INTERACTION MODAL */}
            <AnimatePresence>
                {selectedParticipant && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-xl"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="relative w-full max-w-2xl bg-black border border-[var(--color-neon)]/30 rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.2)]"
                        >
                            <button
                                onClick={() => setSelectedParticipant(null)}
                                className="absolute top-8 right-8 z-10 p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6 text-white/50" />
                            </button>

                            <div className="grid md:grid-cols-2 h-full">
                                {/* Left: Media Section */}
                                <div className="relative aspect-square md:aspect-auto h-full min-h-[300px] border-r border-white/10">
                                    <img
                                        src={selectedParticipant.img}
                                        alt={selectedParticipant.name}
                                        className="w-full h-full object-cover opacity-80"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                                    <div className="absolute bottom-6 left-6">
                                        {selectedParticipant.rank && selectedParticipant.rank <= 3 && (
                                            <div className="mb-2 inline-flex items-center gap-1.5 px-3 py-1 rounded bg-amber-400 text-black shadow-[0_0_20px_rgba(251,191,36,0.6)]">
                                                <Trophy className="w-3 h-3" />
                                                <span className="text-[9px] font-black uppercase tracking-tighter italic">Sector Paragon : Leading Winner</span>
                                            </div>
                                        )}
                                        <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">{selectedParticipant.name}</h3>
                                        <p className="text-[var(--color-neon)] font-mono text-[10px] tracking-widest mt-1">UPLINK_NODE_{selectedParticipant.dept}</p>
                                    </div>
                                </div>

                                {/* Right: Interaction Section */}
                                <div className="p-8 pt-20 flex flex-col h-full space-y-6">
                                    <div className="flex gap-4">
                                        <button className="flex-1 py-4 bg-[var(--color-neon)] text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-white transition-all shadow-[0_10px_30px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.3)] flex items-center justify-center gap-2 group/btn">
                                            <Zap className="w-4 h-4 group-hover:scale-110 transition-transform" /> Cast Vote
                                        </button>
                                        <button className="flex-1 py-4 border border-[var(--color-neon)]/40 text-[var(--color-neon)] font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-[var(--color-neon)] hover:text-black transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,209,255,0.15)] group/share">
                                            <Share2 className="w-4 h-4 group-hover:rotate-12 transition-transform" /> Share
                                        </button>
                                    </div>

                                    <div className="flex-1 flex flex-col min-h-0">
                                        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                                            <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] italic">Neural Feedback</h4>
                                            <button className="text-[9px] font-black text-[var(--color-neon)] uppercase tracking-widest hover:underline decoration-slice">
                                                View All ({selectedParticipant.comments?.length || 0})
                                            </button>
                                        </div>
                                        <div className="flex-1 overflow-y-auto custom-scrollbar-green pr-2 space-y-4 mb-4">
                                            {selectedParticipant.comments?.length > 0 ? (
                                                selectedParticipant.comments.map((c: string, i: number) => (
                                                    <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-xl">
                                                        <p className="text-xs text-white/70 italic leading-relaxed">"{c}"</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-12 text-center opacity-20 text-[var(--color-neon)]">
                                                    <BrainCircuit className="w-12 h-12 mb-4" />
                                                    <p className="text-[10px] font-black tracking-widest uppercase italic mt-4">No feedback nodes detected</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <textarea
                                                placeholder="Inject feedback into the node..."
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xs font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-[var(--color-neon)]/50 transition-colors resize-none h-24 uppercase"
                                            />
                                            <button className="w-full py-3 border border-[var(--color-neon)]/30 text-[var(--color-neon)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--color-neon)] hover:text-black transition-all rounded-xl">Inject Comment</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
