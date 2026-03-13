'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Trophy, Shield, Cpu, Zap, Filter, Users, SearchX, Activity, ZoomIn, ZoomOut } from 'lucide-react';
import Link from 'next/link';
import type { SportData, MatchData } from '@/lib/data/sports';

// ─── Constants ───────────────────────────────────────────────────────────────
const CARD_H = 128;
const CARD_W = 290;
const LABEL_H = 60;
const CONNECTOR_W = 96;
const NEON = '#39ff14';

const CATEGORY_MAP: Record<string, string> = { Boys: 'MALE', Girls: 'FEMALE' };
const ROUND_KEYWORDS = ['QUALIFIER', 'GROUP', 'PRE', 'ROUND 1', 'ROUND 2', 'ROUND 3', 'QUARTER', 'SEMI', 'FINAL', 'CHAMPIONSHIP'];

function getRoundOrder(name: string): number {
    const u = name.toUpperCase();
    for (let i = 0; i < ROUND_KEYWORDS.length; i++) {
        if (u.includes(ROUND_KEYWORDS[i])) return i;
    }
    return 99;
}

// ─── Match Card ───────────────────────────────────────────────────────────────
function MatchCard({ m }: { m: MatchData }) {
    const status = m.status === 'COMPLETED' ? 'FINISHED' : m.status === 'LIVE' ? 'LIVE' : 'UPCOMING';
    const date = m.date ? new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD';
    const time = m.time || 'TBD';

    const teams = [
        { name: m.team1Name || 'TBD', score: m.score1, isWinner: m.winner === 'TEAM1', Icon: Shield },
        { name: m.team2Name || 'TBD', score: m.score2, isWinner: m.winner === 'TEAM2', Icon: Cpu },
    ];

    return (
        <div className="relative group" style={{ width: CARD_W }}>
            <motion.div
                whileHover={{ y: -2, scale: 1.015 }}
                transition={{ duration: 0.18 }}
                className={`bg-[#0a0a0f]/95 border rounded-xl overflow-hidden backdrop-blur-md transition-all duration-300 ${status === 'LIVE' ? 'border-amber-400/60 shadow-[0_0_20px_rgba(251,191,36,0.15)]'
                    : 'border-white/10 group-hover:border-[#39ff14]/30 group-hover:shadow-[0_0_12px_rgba(57,255,20,0.08)]'
                    }`}
            >
                <div className="p-4 space-y-3.5">
                    {teams.map((t, idx) => (
                        <div key={idx} className={`flex items-center justify-between gap-2 ${idx === 0 ? 'pb-3.5 border-b border-white/5' : ''}`}>
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border ${t.isWinner ? 'border-[#39ff14]/40 bg-[#39ff14]/10 text-[#39ff14]' : 'border-white/10 bg-white/5 text-white/30'}`}>
                                    <t.Icon size={14} />
                                </div>
                                <span className={`text-sm font-black tracking-wide truncate ${t.isWinner ? 'text-white' : 'text-white/45'}`}>{t.name}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {t.score && <span className="text-sm font-bold text-white/70">{t.score}</span>}
                                {t.isWinner && (
                                    <span className="flex items-center gap-1 px-2 py-1 bg-[#39ff14]/10 border border-[#39ff14]/30 rounded text-[8px] font-black text-[#39ff14] tracking-wider uppercase whitespace-nowrap">
                                        <Zap size={8} /> WINNER
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <div className={`h-px w-full ${status === 'LIVE' ? 'bg-amber-400 animate-pulse' : status === 'FINISHED' ? 'bg-[#39ff14]/20' : 'bg-white/5'}`} />
                {/* Date & Time footer */}
                <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/8 bg-white/[0.02]">
                    <span className="text-[9px] font-black tracking-widest text-white/70 uppercase">{date}</span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span className="text-[9px] font-black tracking-widest text-[#39ff14]/70 uppercase">{time}</span>
                </div>
            </motion.div>
        </div>
    );
}


// ─── Champion Card ────────────────────────────────────────────────────────────
function ChampionCard({ teamName, isTBD = false }: { teamName: string; isTBD?: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative group shrink-0 self-center"
            style={{ width: CARD_W }}
        >
            {!isTBD && <div className="absolute -inset-6 bg-[#39ff14]/5 blur-3xl opacity-60 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />}
            <div className={`relative p-6 border-2 bg-[#050510]/95 backdrop-blur-2xl rounded-2xl flex flex-col items-center text-center ${isTBD
                ? 'border-white/10 shadow-none'
                : 'border-[#39ff14]/35 shadow-[0_0_60px_rgba(57,255,20,0.08)]'
                }`}>
                {/* Trophy */}
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-4 ${isTBD
                    ? 'bg-white/5 border border-white/10'
                    : 'bg-[#39ff14] shadow-[0_0_35px_rgba(57,255,20,0.5)]'
                    }`}>
                    <Trophy className={isTBD ? 'text-white/20 w-8 h-8' : 'text-black w-8 h-8'} />
                </div>
                <p className={`text-[8px] font-black tracking-[0.5em] uppercase mb-1 ${isTBD ? 'text-white/20' : 'text-[#39ff14]'
                    }`}>Branch Kings</p>
                {isTBD ? (
                    <>
                        <h2 className="text-2xl font-black text-white/20 italic tracking-tighter uppercase mb-2">???</h2>
                        <p className="text-[9px] font-bold text-white/30 tracking-widest uppercase mb-4">To Be Determined</p>
                    </>
                ) : (
                    <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-5 truncate max-w-[240px] drop-shadow-[0_0_15px_rgba(57,255,20,0.3)]">{teamName}</h2>
                )}
                <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border ${isTBD
                    ? 'bg-white/5 border-white/10'
                    : 'bg-[#39ff14]/10 border-[#39ff14]/30'
                    }`}>
                    <Trophy className={`w-3 h-3 ${isTBD ? 'text-white/20' : 'text-[#39ff14]'}`} />
                    <span className={`text-[7px] font-black tracking-widest uppercase whitespace-nowrap ${isTBD ? 'text-white/20' : 'text-[#39ff14]'
                        }`}>
                        {isTBD ? 'Awaiting Result' : 'Tournament Champion'}
                    </span>
                </div>
                {/* Corner bezels */}
                {['top-2.5 left-2.5 border-t-2 border-l-2 rounded-tl', 'top-2.5 right-2.5 border-t-2 border-r-2 rounded-tr', 'bottom-2.5 left-2.5 border-b-2 border-l-2 rounded-bl', 'bottom-2.5 right-2.5 border-b-2 border-r-2 rounded-br'].map((cls, i) => (
                    <div key={i} className={`absolute w-3 h-3 ${cls} ${isTBD ? 'border-white/10' : 'border-[#39ff14]/40'}`} />
                ))}
            </div>
        </motion.div>
    );
}

// ─── Bracket SVG Connector ────────────────────────────────────────────────────
function BracketConnector({ leftYs, rightYs, h, w, isDashed = false }: {
    leftYs: number[]; rightYs: number[]; h: number; w: number; isDashed?: boolean;
}) {
    if (!leftYs.length || !rightYs.length) return <div style={{ width: w, height: h }} />;

    const midX = w / 2;
    const nL = leftYs.length;
    const nR = rightYs.length;
    const paths: string[] = [];

    for (let r = 0; r < nR; r++) {
        const lStart = Math.floor(r * nL / nR);
        const lEnd = Math.max(lStart, Math.floor((r + 1) * nL / nR) - 1);
        const yr = rightYs[r];

        if (lStart === lEnd) {
            const yl = leftYs[lStart];
            if (Math.abs(yl - yr) < 2) {
                paths.push(`M 0 ${yl} H ${w}`);
            } else {
                paths.push(`M 0 ${yl} H ${midX} V ${yr} H ${w}`);
            }
        } else {
            const ylTop = leftYs[lStart];
            const ylBot = leftYs[lEnd];
            const midY = (ylTop + ylBot) / 2;
            for (let l = lStart; l <= lEnd; l++) {
                paths.push(`M 0 ${leftYs[l]} H ${midX}`);
            }
            paths.push(`M ${midX} ${ylTop} V ${ylBot}`);
            paths.push(`M ${midX} ${midY} V ${yr} H ${w}`);
        }
    }

    return (
        <svg width={w} height={h} className="shrink-0" style={{ overflow: 'visible' }}>
            {paths.map((d, i) => (
                <path key={i} d={d} stroke={`${NEON}55`} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeDasharray={isDashed ? '5 4' : undefined} />
            ))}
        </svg>
    );
}

// ─── Round Label ──────────────────────────────────────────────────────────────
function RoundLabel({ name }: { name: string }) {
    const u = name.toUpperCase();
    const isFinal = u.includes('FINAL') || u.includes('CHAMPIONSHIP');
    const isQual = u.includes('QUALIFIER') || u.includes('GROUP') || u.includes('PRE');
    return (
        <div className={`inline-flex px-5 py-2 rounded-full border text-[10px] font-black tracking-[0.5em] uppercase whitespace-nowrap shadow-sm ${isFinal
                ? 'border-amber-400/70 text-amber-300 bg-amber-400/10 shadow-[0_0_20px_rgba(251,191,36,0.2)]'
                : isQual
                    ? 'border-[#39ff14]/70 text-[#39ff14] bg-[#39ff14]/10 shadow-[0_0_15px_rgba(57,255,20,0.15)]'
                    : 'border-white/30 text-white/70 bg-white/5'
            }`}>
            {name}
        </div>
    );
}

// ─── Bracket View ─────────────────────────────────────────────────────────────
function BracketView({ rounds, zoom }: { rounds: { id: string; name: string; matches: MatchData[] }[]; zoom: number }) {
    const maxN = Math.max(...rounds.map(r => r.matches.length), 1);
    const BRACKET_H = Math.max(maxN * 200, 500);

    const getCenterYs = (n: number): number[] => {
        const sp = BRACKET_H / n;
        return Array.from({ length: n }, (_, k) => sp / 2 + k * sp);
    };

    const finalRound = [...rounds].reverse().find(r => r.name.toUpperCase().includes('FINAL') || r.name.toUpperCase().includes('CHAMPIONSHIP'));
    let finalWinner = '';
    if (finalRound) {
        const fm = finalRound.matches.find(m => m.status === 'COMPLETED' && m.winner);
        if (fm) finalWinner = fm.winner === 'TEAM1' ? (fm.team1Name || '') : fm.winner === 'TEAM2' ? (fm.team2Name || '') : '';
    }

    return (
        <div className="flex items-start min-w-max px-10 py-8 gap-0" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
            {rounds.map((round, idx) => {
                const n = round.matches.length;
                const sp = BRACKET_H / n;
                const centerYs = getCenterYs(n);
                const cardTopYs = centerYs.map(cy => cy - CARD_H / 2);

                const nextRound = rounds[idx + 1];
                const nextCenterYs = nextRound ? getCenterYs(nextRound.matches.length) : [];

                return (
                    <React.Fragment key={round.id}>
                        {/* Round column */}
                        <div className="flex flex-col shrink-0" style={{ width: CARD_W }}>
                            {/* Label */}
                            <div className="flex items-center justify-center" style={{ height: LABEL_H }}>
                                <RoundLabel name={round.name} />
                            </div>
                            {/* Cards */}
                            <div className="relative shrink-0" style={{ height: BRACKET_H }}>
                                {round.matches.map((m, mIdx) => (
                                    <div key={m.id} className="absolute left-0" style={{ top: cardTopYs[mIdx] }}>
                                        <MatchCard m={m} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Connector to next round */}
                        {nextRound && (
                            <div className="flex flex-col shrink-0" style={{ width: CONNECTOR_W }}>
                                <div style={{ height: LABEL_H }} />
                                <BracketConnector
                                    leftYs={centerYs}
                                    rightYs={nextCenterYs}
                                    h={BRACKET_H}
                                    w={CONNECTOR_W}
                                />
                            </div>
                        )}
                    </React.Fragment>
                );
            })}

            {/* Champion connector + card — always shown (TBD when no winner) */}
            {rounds.length > 0 && (
                <>
                    <div className="flex flex-col shrink-0" style={{ width: CONNECTOR_W }}>
                        <div style={{ height: LABEL_H }} />
                        <svg width={CONNECTOR_W} height={BRACKET_H} className="shrink-0">
                            <line
                                x1={0} y1={BRACKET_H / 2}
                                x2={CONNECTOR_W} y2={BRACKET_H / 2}
                                stroke={finalWinner ? `${NEON}80` : 'rgba(255,255,255,0.1)'}
                                strokeWidth="1.5"
                                strokeDasharray="5 4"
                            />
                            <circle cx={CONNECTOR_W} cy={BRACKET_H / 2} r={3} fill={finalWinner ? NEON : 'rgba(255,255,255,0.15)'} />
                        </svg>
                    </div>
                    <div className="flex flex-col shrink-0" style={{ width: CARD_W }}>
                        <div style={{ height: LABEL_H }} />
                        <div className="relative flex items-center justify-center" style={{ height: BRACKET_H }}>
                            <ChampionCard teamName={finalWinner || 'TBD'} isTBD={!finalWinner} />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function FixturesClient({ sportsData }: { sportsData: SportData[] }) {
    const [zoom, setZoom] = useState(1);
    const [selectedSport, setSelectedSport] = useState(() => sportsData[0]?.name ?? '');
    const [selectedCategory, setSelectedCategory] = useState('Boys');
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        let active = true;
        setIsSyncing(true);
        const t = setTimeout(() => {
            if (active) setIsSyncing(false);
        }, 400);
        return () => {
            active = false;
            clearTimeout(t);
        };
    }, [selectedSport, selectedCategory]);

    const activeSport = useMemo(() => {
        const cat = CATEGORY_MAP[selectedCategory] || 'MALE';
        return sportsData.find(s =>
            s.name.toUpperCase() === selectedSport.toUpperCase() &&
            (s.gender.toUpperCase() === cat || s.gender.toUpperCase() === (cat === 'MALE' ? 'BOYS' : 'GIRLS'))
        );
    }, [selectedSport, selectedCategory, sportsData]);

    const rounds = useMemo(() => {
        if (!activeSport?.matches.length) return [];
        const groups: Record<string, MatchData[]> = {};
        for (const m of activeSport.matches) {
            const r = m.round || 'Round 1';
            if (!groups[r]) groups[r] = [];
            groups[r].push(m);
        }
        return Object.keys(groups).map(r => ({ id: r, name: r, matches: groups[r] }))
            .sort((a, b) => getRoundOrder(a.name) - getRoundOrder(b.name));
    }, [activeSport]);

    const sportNames = Array.from(new Set(sportsData.map(s => s.name)))
        .filter(name => name.toUpperCase() !== 'ATHLETICS')
        .sort();
    const categories = ['Boys', 'Girls'] as const;

    return (
        <main className="min-h-screen bg-[#030308] text-white font-orbitron flex flex-col relative">
            {/* Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(57,255,20,0.04)_0%,transparent_60%)]" />
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
            </div>

            {/* Header */}
            <header className="relative z-20 flex flex-col border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0">
                {/* Top row */}
                <div className="flex items-center justify-between px-4 sm:px-8 py-3 border-b border-white/5">
                    <div className="flex items-center gap-3 sm:gap-5">
                        <Link href="/home/fest/sports#tactical-terminal" className="p-2 border border-white/10 hover:border-white/25 transition-all rounded-lg bg-white/5 group">
                            <ChevronLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
                        </Link>
                        <div>
                            <p className="text-[8px] font-black tracking-[0.35em] text-[#39ff14] uppercase">Tournament Bracket</p>
                            <h1 className="text-base sm:text-lg font-black italic tracking-tight uppercase">Polls & Fixtures</h1>
                        </div>
                    </div>

                    {/* Zoom */}
                    <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                        <button onClick={() => setZoom(z => Math.max(0.4, +(z - 0.1).toFixed(1)))} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
                            <ZoomOut size={14} />
                        </button>
                        <span className="text-[9px] font-black tracking-widest min-w-[3ch] text-center text-white/50">{Math.round(zoom * 100)}%</span>
                        <button onClick={() => setZoom(z => Math.min(1.5, +(z + 0.1).toFixed(1)))} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
                            <ZoomIn size={14} />
                        </button>
                    </div>
                </div>

                {/* Filter row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 sm:px-8 py-3 bg-white/[0.015]">
                    {/* Sports filter */}
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="flex items-center gap-1.5 text-white/30 shrink-0">
                            <Filter size={10} />
                            <span className="text-[9px] font-black tracking-widest uppercase hidden sm:block">Sport</span>
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide flex-1">
                            {sportNames.map(name => (
                                <button
                                    key={name}
                                    onClick={() => setSelectedSport(name)}
                                    className={`relative shrink-0 px-3 py-1.5 rounded-lg border text-[9px] font-black tracking-widest uppercase transition-all duration-200 cursor-pointer ${selectedSport === name
                                        ? 'bg-[#39ff14]/15 border-[#39ff14]/70 text-[#39ff14]'
                                        : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'
                                        }`}
                                >
                                    {name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="hidden sm:block w-px h-5 bg-white/10 shrink-0" />

                    {/* Category filter */}
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1.5 text-white/30">
                            <Users size={10} />
                            <span className="text-[9px] font-black tracking-widest uppercase">Division</span>
                        </div>
                        <div className="flex p-0.5 bg-white/5 border border-white/10 rounded-xl">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase transition-all duration-200 cursor-pointer ${selectedCategory === cat
                                        ? 'bg-[#39ff14] text-black shadow-[0_0_15px_rgba(57,255,20,0.4)]'
                                        : 'text-white/40 hover:text-white/60'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            {/* Bracket content */}
            <div className="flex-1 relative overflow-auto z-10" style={{ minHeight: 'calc(100vh - 120px)' }}>
                <style>{`
                    ::-webkit-scrollbar { width: 6px; height: 6px; }
                    ::-webkit-scrollbar-track { background: #030308; }
                    ::-webkit-scrollbar-thumb { background: rgba(57,255,20,0.25); border-radius: 999px; }
                    ::-webkit-scrollbar-thumb:hover { background: rgba(57,255,20,0.5); }
                    .scrollbar-hide::-webkit-scrollbar { display: none; }
                `}</style>

                <AnimatePresence mode="wait">
                    {isSyncing ? (
                        <motion.div key="sync" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center bg-[#030308]/70 backdrop-blur-sm z-20">
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                                className="w-10 h-10 border-2 border-t-[#39ff14] border-r-transparent border-b-transparent border-l-transparent rounded-full mb-4" />
                            <span className="text-[9px] font-black tracking-[0.5em] text-[#39ff14] uppercase animate-pulse">Loading bracket</span>
                        </motion.div>
                    ) : rounds.length === 0 ? (
                        <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                            <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                <SearchX className="w-8 h-8 text-white/20" />
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-black tracking-[0.5em] text-white/40 uppercase">No Fixtures Found</p>
                                <p className="text-[8px] text-white/20 tracking-widest uppercase mt-2">No matches scheduled for {selectedSport} ({selectedCategory})</p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="bracket" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}>
                            <BracketView rounds={rounds} zoom={zoom} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer */}
            <footer className="relative z-20 flex items-center justify-between px-6 py-4 border-t border-white/5 bg-black/40 backdrop-blur-xl">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#39ff14]/50 animate-pulse" />
                    <span className="text-[8px] font-bold text-white/30 tracking-widest uppercase">{sportsData.length} Sports · {rounds.reduce((a, r) => a + r.matches.length, 0)} Matches</span>
                </div>
                <span className="text-[8px] font-black tracking-[0.6em] text-white/10 uppercase italic">ORNATE 2K26 · BRACKET GRID</span>
            </footer>
        </main>
    );
}
