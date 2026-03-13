'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, MapPin, Clock, Filter, Search, X, Users, Trophy, Swords, Activity, Wind, Zap, Target } from 'lucide-react';
import Link from 'next/link';

// ─── Data ────────────────────────────────────────────────────────────────────
export type MatchStatus = 'UPCOMING' | 'LIVE' | 'COMPLETED';

export interface Match {
    id: string;
    sport: string;
    teamA: string;
    teamB: string;
    venue: string;
    date: string;
    day: string;
    time: string;
    status: MatchStatus;
    category: 'BOYS' | 'GIRLS' | 'MIXED';
    round: string;
    icon?: React.ReactNode;
}

const STATUSES: MatchStatus[] = ['UPCOMING', 'LIVE', 'COMPLETED'];
const CATEGORIES = ['ALL', 'BOYS', 'GIRLS'];

const STATUS_CFG: Record<MatchStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
    UPCOMING: { label: 'UPCOMING', color: 'text-[var(--color-neon)]', bg: 'bg-[var(--color-neon)]/10', border: 'border-[var(--color-neon)]/30', dot: '#22d3ee' },
    LIVE: { label: '● LIVE', color: 'text-[var(--color-neon)]', bg: 'bg-[var(--color-neon)]/10', border: 'border-[var(--color-neon)]/30', dot: 'var(--color-neon)' },
    COMPLETED: { label: 'DONE', color: 'text-gray-500', bg: 'bg-white/5', border: 'border-white/10', dot: '#6b7280' },
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SportsScheduleClient({ matches }: { matches: Match[] }) {
    const [sport, setSport] = useState('ALL');
    const [status, setStatus] = useState('ALL');
    const [category, setCategory] = useState('ALL');
    const [search, setSearch] = useState('');

    // Derive sport list dynamically from DB data
    const sportNames = useMemo(() => ['ALL', ...Array.from(new Set(matches.map(m => m.sport)))], [matches]);

    const filtered = useMemo(() => matches.filter(m => {
        if (sport !== 'ALL' && m.sport !== sport) return false;
        if (status !== 'ALL' && m.status !== status) return false;
        if (category !== 'ALL' && m.category !== category) return false;
        const q = search.toLowerCase();
        if (q && !m.teamA.toLowerCase().includes(q) && !m.teamB.toLowerCase().includes(q) && !m.sport.toLowerCase().includes(q) && !m.venue.toLowerCase().includes(q)) return false;
        return true;
    }), [sport, status, category, search, matches]);

    const clearFilters = () => { setSport('ALL'); setStatus('ALL'); setCategory('ALL'); setSearch(''); };
    const hasFilter = sport !== 'ALL' || status !== 'ALL' || category !== 'ALL' || search !== '';

    return (
        <main className="min-h-screen bg-[#030308] text-white font-orbitron overflow-x-hidden">
            {/* Background grid */}
            <div className="fixed inset-0 opacity-[0.04] pointer-events-none z-0"
                style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '50px 50px' }} />
            {/* Amber glow */}
            <div className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-amber-400/5 blur-[180px] pointer-events-none z-0" />

            {/* ── HEADER ── */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/60 border-b border-amber-400/10 px-8 py-4 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/home/fest/sports#tactical-terminal"
                        className="group flex items-center gap-3 px-5 py-2 text-white/60 hover:text-amber-400 transition-all bg-white/5 border-l border-r border-amber-400/30 hover:bg-amber-400/10 hover:border-amber-400 [clip-path:polygon(12px_0,100%_0,calc(100%-12px)_100%,0_100%)]"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-black tracking-[0.3em] uppercase">Back to Sports</span>
                    </Link>
                    <div className="hidden md:flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-black tracking-[0.4em] text-amber-400 uppercase">Match Schedule</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold tracking-widest text-white/40 uppercase">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>LIVE UPDATES</span>
                </div>
            </header>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">

                {/* ── TITLE ── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
                    <p className="text-[10px] text-amber-400 tracking-[0.8em] font-black uppercase mb-3">Match Schedule</p>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tight text-white uppercase leading-none">
                        MATCH<br /><span className="text-amber-400">SCHEDULE</span>
                    </h1>
                    <div className="h-[2px] w-32 bg-gradient-to-r from-amber-400 to-transparent mt-4 opacity-60" />
                </motion.div>

                {/* ── FILTERS ── */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-10 space-y-4">
                    {/* Search */}
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                        <input
                            type="text"
                            placeholder="Search team, sport, venue…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 focus:border-amber-400/50 outline-none text-sm font-bold tracking-widest text-white/80 placeholder:text-gray-700 transition-all"
                            style={{ clipPath: 'polygon(8px 0, 100% 0, calc(100%-8px) 100%, 0 100%)' }}
                        />
                    </div>

                    <div className="flex flex-wrap gap-6">
                        {/* Sport filter */}
                        <div className="flex flex-col gap-2">
                            <span className="text-[9px] font-black tracking-[0.4em] text-white/50 uppercase flex items-center gap-1"><Filter className="w-3 h-3" /> Sport</span>
                            <div className="flex flex-wrap gap-2">
                                {sportNames.map(s => (
                                    <button key={s} onClick={() => setSport(s)}
                                        className={`px-3 py-1.5 text-[9px] font-black tracking-[0.25em] uppercase transition-all [clip-path:polygon(6px_0,100%_0,calc(100%-6px)_100%,0_100%)]
                                            ${sport === s ? 'bg-amber-400 text-black' : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white border border-white/10'}`}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Status filter */}
                        <div className="flex flex-col gap-2">
                            <span className="text-[9px] font-black tracking-[0.4em] text-white/50 uppercase">Status</span>
                            <div className="flex gap-2">
                                <button onClick={() => setStatus('ALL')}
                                    className={`px-3 py-1.5 text-[9px] font-black tracking-[0.25em] uppercase transition-all [clip-path:polygon(6px_0,100%_0,calc(100%-6px)_100%,0_100%)]
                                        ${status === 'ALL' ? 'bg-amber-400 text-black' : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white border border-white/10'}`}>
                                    ALL
                                </button>
                                {STATUSES.map(s => {
                                    const cfg = STATUS_CFG[s];
                                    return (
                                        <button key={s} onClick={() => setStatus(s)}
                                            className={`px-3 py-1.5 text-[9px] font-black tracking-[0.25em] uppercase transition-all [clip-path:polygon(6px_0,100%_0,calc(100%-6px)_100%,0_100%)]
                                                ${status === s ? `border ${cfg.border} ${cfg.color} ${cfg.bg}` : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white border border-white/10'}`}>
                                            {cfg.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>


                        {/* Category filter */}
                        <div className="flex flex-col gap-2">
                            <span className="text-[9px] font-black tracking-[0.4em] text-white/50 uppercase">Category</span>
                            <div className="flex gap-2">
                                {CATEGORIES.map(c => (
                                    <button key={c} onClick={() => setCategory(c)}
                                        className={`px-3 py-1.5 text-[9px] font-black tracking-[0.25em] uppercase transition-all [clip-path:polygon(6px_0,100%_0,calc(100%-6px)_100%,0_100%)]
                                            ${category === c ? 'bg-amber-400 text-black' : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white border border-white/10'}`}>
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Active filter summary */}
                    {hasFilter && (
                        <div className="flex items-center gap-3 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                            <span>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
                            <button onClick={clearFilters} className="flex items-center gap-1 text-amber-400 hover:text-white transition-colors">
                                <X className="w-3 h-3" /> Clear Filters
                            </button>
                        </div>
                    )}
                </motion.div>

                {/* ── MATCH GRID ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filtered.length === 0 ? (
                            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="col-span-full h-48 flex flex-col items-center justify-center gap-3 text-gray-700">
                                <Calendar className="w-12 h-12 opacity-20" />
                                <p className="text-sm font-black tracking-[0.4em] uppercase">No matches found</p>
                                <button onClick={clearFilters} className="text-[10px] text-amber-400 font-black tracking-widest uppercase hover:underline">Clear Filters</button>
                            </motion.div>
                        ) : filtered.map((m, i) => {
                            const cfg = STATUS_CFG[m.status as MatchStatus] || STATUS_CFG['UPCOMING'];
                            let IconComponent = Target;
                            if (m.sport === 'FOOTBALL') IconComponent = Swords;
                            else if (m.sport === 'BASKETBALL') IconComponent = Activity;
                            else if (m.sport === 'VOLLEYBALL' || m.sport === 'BADMINTON') IconComponent = Zap;
                            else if (m.sport === 'KABADDI') IconComponent = Wind;
                            else if (m.sport === 'ATHLETICS') IconComponent = Users;
                            return (
                                <motion.div key={m.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="group relative flex flex-col"
                                >
                                    {/* hover glow ring */}
                                    <div className="absolute -inset-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-[20px] pointer-events-none z-0 rounded-sm"
                                        style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(251,191,36,0.55) 0%, rgba(251,191,36,0.1) 60%, transparent 100%)' }} />

                                    <div className="relative z-10 flex flex-col bg-[linear-gradient(170deg,#0b0b12_0%,#101018_65%,#151114_100%)] border-[1.5px] border-amber-400/45 group-hover:border-amber-300/90 transition-all duration-300 overflow-hidden h-full shadow-[0_0_18px_rgba(251,191,36,0.14)] group-hover:shadow-[0_0_34px_rgba(251,191,36,0.25)]"
                                        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 24px), calc(100% - 24px) 100%, 0 100%)' }}>

                                        {/* Top glow bar */}
                                        <div className="absolute top-0 left-0 right-0 h-[2px]"
                                            style={{ background: `linear-gradient(90deg, transparent, ${cfg.dot}, transparent)`, opacity: m.status === 'LIVE' ? 1 : 0.65 }} />

                                        {/* Header */}
                                        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-amber-400">{m.icon || <IconComponent className="w-4 h-4" />}</span>
                                                <span className="text-xs font-black tracking-[0.3em] text-amber-400 uppercase">{m.sport}</span>
                                            </div>
                                            <span className={`text-[8px] font-black tracking-[0.25em] uppercase px-2.5 py-1 ${cfg.bg} ${cfg.color} border ${cfg.border} ${m.status === 'LIVE' ? 'animate-pulse' : ''}`}
                                                style={{ clipPath: 'polygon(5px 0, 100% 0, calc(100% - 5px) 100%, 0 100%)' }}>
                                                {cfg.label}
                                            </span>
                                        </div>

                                        {/* Teams */}
                                        <div className="flex items-center justify-between px-5 py-5 gap-3">
                                            <div className="flex-1 text-center">
                                                <div className="text-2xl font-black text-white tracking-widest uppercase group-hover:text-amber-400 transition-colors">{m.teamA}</div>
                                                <div className="text-[8px] text-white/40 tracking-[0.3em] font-bold uppercase mt-1">TEAM A</div>
                                            </div>
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-8 h-8 rounded-sm bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
                                                    <Swords className="w-4 h-4 text-amber-400" />
                                                </div>
                                                <span className="text-[8px] font-black text-white/20 tracking-widest">VS</span>
                                            </div>
                                            <div className="flex-1 text-center">
                                                <div className="text-2xl font-black text-white tracking-widest uppercase group-hover:text-amber-400 transition-colors">{m.teamB}</div>
                                                <div className="text-[8px] text-white/40 tracking-[0.3em] font-bold uppercase mt-1">TEAM B</div>
                                            </div>
                                        </div>

                                        {/* Meta */}
                                        <div className="grid grid-cols-2 gap-px border-t border-white/12 mt-auto">
                                            <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.06]">
                                                <Clock className="w-3 h-3 text-amber-400/60" />
                                                <div className="flex flex-col">
                                                    <span className="text-[7px] text-white/65 tracking-widest uppercase font-bold">Time & Day</span>
                                                    <span className="text-[11px] font-black text-white">{m.time} · {m.day}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.06]">
                                                <Calendar className="w-3 h-3 text-amber-400/60" />
                                                <div className="flex flex-col">
                                                    <span className="text-[7px] text-white/65 tracking-widest uppercase font-bold">Date</span>
                                                    <span className="text-[11px] font-black text-white">{m.date}</span>
                                                </div>
                                            </div>
                                            <div className="col-span-2 flex items-center gap-2 px-4 py-3 bg-white/[0.08] border-t border-white/12">
                                                <MapPin className="w-3 h-3 text-amber-400/60" />
                                                <div className="flex flex-col">
                                                    <span className="text-[7px] text-white/65 tracking-widest uppercase font-bold">Venue</span>
                                                    <span className="text-[10px] font-black text-white uppercase">{m.venue}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Round + Category badges */}
                                        <div className="flex items-center gap-2 px-4 py-3 border-t border-white/5">
                                            <span className="text-[8px] font-black tracking-[0.2em] uppercase text-amber-400/70 bg-amber-400/5 border border-amber-400/20 px-2 py-0.5"
                                                style={{ clipPath: 'polygon(4px 0, 100% 0, calc(100%-4px) 100%, 0 100%)' }}>
                                                {m.round}
                                            </span>
                                            <span className="text-[8px] font-black tracking-[0.2em] uppercase text-gray-500 bg-white/5 border border-white/10 px-2 py-0.5"
                                                style={{ clipPath: 'polygon(4px 0, 100% 0, calc(100%-4px) 100%, 0 100%)' }}>
                                                {m.category}
                                            </span>
                                        </div>

                                        {/* CTA hover overlay */}
                                        <div className="absolute inset-x-0 bottom-0 h-0 group-hover:h-10 flex items-center justify-center overflow-hidden transition-all duration-300 bg-amber-400 pointer-events-none">
                                            <span className="text-[9px] font-black tracking-[0.4em] uppercase text-black opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100">VIEW DETAILS</span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </main>
    );
}
