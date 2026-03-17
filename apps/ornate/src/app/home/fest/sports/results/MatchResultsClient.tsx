'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ClipboardList, Search, Filter, X, Trophy, Medal, Swords, Activity, Wind, Zap, Target, ChevronDown, ChevronUp, Star, Clock, Calendar } from 'lucide-react';
import SportsEmptyState from '@/components/sports/SportsEmptyState';
import Link from 'next/link';

// ─── Data ─────────────────────────────────────────────────────────────────────
export interface Result {
    id: string;
    sport: string;
    round: string;
    category: 'BOYS' | 'GIRLS' | 'MIXED';
    day: string;
    date: string;
    venue: string;
    first: { team: string; score: string };
    second: { team: string; score: string };
    third?: { team: string; score: string };
    icon?: React.ReactNode;
    glow?: string;
}

const SPORTS_FILTER = ['ALL', 'CRICKET', 'FOOTBALL', 'BASKETBALL', 'KABADDI', 'BADMINTON', 'ATHLETICS'];
const DAYS_FILTER = ['ALL', 'Day 1', 'Day 2', 'Day 3'];
const CATS_FILTER = ['ALL', 'BOYS', 'GIRLS', 'MIXED'];

// ─── Filter pill ──────────────────────────────────────────────────────────────
function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button onClick={onClick}
            className={`px-3 py-1.5 text-[9px] font-black tracking-[0.25em] uppercase transition-all border
                ${active
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-black border-transparent shadow-[0_0_12px_rgba(251,191,36,0.5)]'
                    : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-amber-300 border-white/10 hover:border-amber-400/30'
                }`}
            style={{ clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)' }}>
            {label}
        </button>
    );
}

// ─── Result Card ─────────────────────────────────────────────────────────────
function ResultCard({ result, index }: { result: Result; index: number }) {
    const [expanded, setExpanded] = useState(false);

    let IconComponent = Target;
    if (result.sport === 'FOOTBALL') IconComponent = Swords;
    else if (result.sport === 'BASKETBALL') IconComponent = Activity;
    else if (result.sport === 'VOLLEYBALL' || result.sport === 'BADMINTON') IconComponent = Zap;
    else if (result.sport === 'KABADDI') IconComponent = Wind;

    const g = result.glow || '#f97316';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.05, duration: 0.45, ease: 'easeOut' }}
            className="group relative"
        >
            {/* ── outer drop glow: hidden → visible on hover ── */}
            <div
                className="absolute -inset-[3px] rounded-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-[18px] pointer-events-none z-0"
                style={{ background: `radial-gradient(ellipse at 50% 50%, ${g}80 0%, ${g}20 60%, transparent 100%)` }}
            />

            {/* card body */}
            <div
                className="relative z-10 flex flex-col overflow-hidden transition-all duration-400 group-hover:border-opacity-80"
                style={{
                    background: `linear-gradient(150deg, #0e0b14 0%, #0a0810 55%, ${g}0a 100%)`,
                    border: `1px solid ${g}35`,
                    clipPath: 'polygon(0 0, calc(100% - 28px) 0, 100% 28px, 100% 100%, 0 100%)',
                    boxShadow: `inset 0 1px 0 ${g}30, 0 0 0 0 ${g}`,
                    transition: 'border-color 0.4s, box-shadow 0.4s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = `${g}90`)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = `${g}35`)}
            >
                {/* top accent line  */}
                <div className="absolute top-0 left-0 w-3/4 h-[1.5px] pointer-events-none"
                    style={{ background: `linear-gradient(90deg, ${g}, transparent)` }} />
                {/* corner gem */}
                <div className="absolute top-0 right-0 w-7 h-7 pointer-events-none"
                    style={{ background: `linear-gradient(225deg, ${g}60 0%, transparent 70%)` }} />

                {/* ── HEADER ── */}
                <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-sm" style={{ background: `${g}18`, border: `1px solid ${g}40`, color: g }}>
                            {result.icon || <IconComponent className="w-4 h-4" />}
                        </div>
                        <span className="text-[11px] font-black tracking-[0.35em] uppercase" style={{ color: g }}>{result.sport}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[7.5px] font-black tracking-[0.25em] uppercase px-2.5 py-1 border"
                            style={{ color: g, background: `${g}12`, borderColor: `${g}40`, clipPath: 'polygon(5px 0, 100% 0, calc(100% - 5px) 100%, 0 100%)' }}>
                            {result.round}
                        </span>
                        <span className="text-[7.5px] font-black tracking-[0.2em] uppercase px-2 py-1 bg-white/5 text-gray-500 border border-white/10"
                            style={{ clipPath: 'polygon(4px 0, 100% 0, calc(100%-4px) 100%, 0 100%)' }}>
                            {result.category}
                        </span>
                    </div>
                </div>

                {/* ── VERSUS PANEL ── */}
                <div className="flex items-stretch gap-0 px-5 py-5">
                    {/* 1st */}
                    <div className="flex-1 flex flex-col items-center gap-2 relative">
                        {/* shimmer on winner cell */}
                        <motion.div
                            animate={{ x: ['-130%', '200%'] }}
                            transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 5, ease: 'linear' }}
                            className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/6 to-transparent pointer-events-none"
                        />
                        <div className="w-11 h-11 flex items-center justify-center rounded-sm shadow-lg"
                            style={{ background: `linear-gradient(135deg, ${g}25, ${g}40)`, border: `1px solid ${g}60`, boxShadow: `0 0 18px ${g}50` }}>
                            <Trophy className="w-5 h-5" style={{ color: g }} />
                        </div>
                        <span className="text-[7px] font-black tracking-[0.5em] uppercase" style={{ color: `${g}90` }}>Champion</span>
                        <span className="text-[28px] font-black tracking-widest uppercase leading-none text-white group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-all">{result.first.team}</span>
                        <span className="font-mono text-[11px] font-bold" style={{ color: g }}>{result.first.score}</span>
                    </div>

                    {/* divider */}
                    <div className="flex flex-col items-center justify-center px-5 gap-1.5">
                        <div className="w-px h-6" style={{ background: `linear-gradient(to bottom, ${g}40, transparent)` }} />
                        <Swords className="w-4 h-4 text-white/10" />
                        <div className="w-px h-6 bg-white/5" />
                    </div>

                    {/* 2nd */}
                    <div className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-11 h-11 flex items-center justify-center rounded-sm bg-white/5 border border-white/15">
                            <Medal className="w-5 h-5 text-gray-500" />
                        </div>
                        <span className="text-[7px] font-black tracking-[0.5em] text-gray-600 uppercase">Runner-Up</span>
                        <span className="text-[28px] font-black tracking-widest uppercase leading-none text-white/45">{result.second.team}</span>
                        <span className="font-mono text-[11px] font-bold text-gray-600">{result.second.score}</span>
                    </div>
                </div>

                {/* ── META STRIP ── */}
                <div className="grid grid-cols-3 border-t border-white/[0.06]">
                    {[
                        { label: 'Date', value: `${result.date} · ${result.day}` },
                        { label: 'Venue', value: result.venue },
                        { label: 'Category', value: result.category },
                    ].map(({ label, value }) => (
                        <div key={label} className="flex flex-col px-4 py-2.5 border-r border-white/[0.06] last:border-0"
                            style={{ background: `${g}04` }}>
                            <span className="text-[6.5px] font-bold tracking-widest uppercase" style={{ color: `${g}60` }}>{label}</span>
                            <span className="text-[10px] font-black text-white/75">{value}</span>
                        </div>
                    ))}
                </div>

                {/* ── EXPANDABLE 3RD ── */}
                {result.third && (
                    <button
                        onClick={() => setExpanded(e => !e)}
                        className="flex items-center justify-center gap-2 py-2.5 border-t border-white/[0.06] text-[8px] font-black tracking-[0.3em] uppercase transition-colors"
                        style={{ color: expanded ? g : '#4b5563' }}
                        onMouseEnter={e => (e.currentTarget.style.color = g)}
                        onMouseLeave={e => (e.currentTarget.style.color = expanded ? g : '#4b5563')}
                    >
                        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {expanded ? 'Hide Bronze' : '🥉 Bronze Medal'}
                    </button>
                )}

                <AnimatePresence>
                    {result.third && expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-white/[0.06] overflow-hidden"
                        >
                            <div className="flex items-center gap-4 px-5 py-4" style={{ background: '#fb923c08' }}>
                                <div className="w-9 h-9 flex items-center justify-center rounded-sm bg-orange-700/15 border border-orange-700/40">
                                    <Medal className="w-4 h-4 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-[7px] font-black tracking-[0.5em] text-orange-700/60 uppercase">3rd Place</p>
                                    <p className="text-lg font-black text-orange-600 uppercase tracking-widest">{result.third.team}</p>
                                    <p className="text-[10px] font-mono text-orange-900">{result.third.score}</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MatchResultsClient({ results: RESULTS }: { results: Result[] }) {
    const [sport, setSport] = useState('ALL');
    const [day, setDay] = useState('ALL');
    const [category, setCategory] = useState('ALL');
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => RESULTS.filter(r => {
        if (sport !== 'ALL' && r.sport !== sport) return false;
        if (day !== 'ALL' && r.day !== day) return false;
        if (category !== 'ALL' && r.category !== category) return false;
        const q = search.toLowerCase();
        if (q && !r.sport.toLowerCase().includes(q) && !r.first.team.toLowerCase().includes(q)
            && !r.second.team.toLowerCase().includes(q) && !r.venue.toLowerCase().includes(q)) return false;
        return true;
    }), [sport, day, category, search, RESULTS]);

    const clearFilters = () => { setSport('ALL'); setDay('ALL'); setCategory('ALL'); setSearch(''); };
    const hasFilter = sport !== 'ALL' || day !== 'ALL' || category !== 'ALL' || search !== '';

    return (
        <main className="min-h-screen bg-[#060509] text-white font-orbitron overflow-x-hidden">

            {/* ── deep gold atmosphere ── */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-1/3 w-[700px] h-[700px] bg-amber-500/4 blur-[220px] rounded-full" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-orange-600/5 blur-[200px] rounded-full" />
                <div className="absolute inset-0 opacity-[0.035]"
                    style={{ backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, rgba(255,255,255,0.5) 1px, transparent 0)', backgroundSize: '48px 48px' }} />
            </div>

            {/* ── HEADER ── */}
            <header className="sticky top-0 z-50 backdrop-blur-2xl bg-black/65 border-b border-amber-400/12 px-8 py-4 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/home/fest/sports#tactical-terminal"
                        className="group flex items-center gap-3 px-5 py-2 text-white/50 hover:text-amber-400 transition-all bg-amber-400/5 border border-amber-400/25 hover:bg-amber-400/10 hover:border-amber-400/70 hover:shadow-[0_0_14px_rgba(251,191,36,0.3)]"
                        style={{ clipPath: 'polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)' }}
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-black tracking-[0.35em] uppercase">Back to Sports</span>
                    </Link>
                    <div className="hidden md:flex items-center gap-2 text-amber-400">
                        <Trophy className="w-4 h-4" />
                        <span className="text-[11px] font-black tracking-[0.5em] uppercase">Hall of Records</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-black tracking-[0.4em] text-gray-600 uppercase">
                    <ClipboardList className="w-4 h-4 text-amber-400/50" />
                    Archive Synced
                </div>
            </header>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-14">

                {/* ── HERO TITLE ── */}
                <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} className="mb-14 relative">
                    <p className="text-[10px] font-black tracking-[1em] text-amber-400/50 uppercase mb-4">Ornate &apos;26 // Final Scores</p>
                    <h1 className="text-7xl md:text-9xl font-black uppercase leading-none tracking-tighter">
                        <span className="text-white/90">MATCH</span><br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500"
                            style={{ filter: 'drop-shadow(0 0 40px rgba(251,191,36,0.35))' }}>
                            RESULTS
                        </span>
                    </h1>
                    {/* animated underline */}
                    <motion.div
                        initial={{ width: 0 }} animate={{ width: '10rem' }}
                        transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
                        className="h-[2px] mt-4 rounded-full"
                        style={{ background: 'linear-gradient(90deg, #fbbf24, #f97316, transparent)' }}
                    />
                    {/* total badge */}
                    <div className="flex items-center gap-2 mt-6 w-fit px-4 py-2 border border-amber-400/25 bg-amber-400/6"
                        style={{ clipPath: 'polygon(8px 0, 100% 0, calc(100%-8px) 100%, 0 100%)' }}>
                        <Star className="w-3 h-3 text-amber-400" />
                        <span className="text-[9px] font-black tracking-[0.5em] text-amber-400/80 uppercase">{RESULTS.length} matches recorded</span>
                    </div>
                </motion.div>

                {/* ── FILTERS ── */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                    className="mb-12 p-6 space-y-5 border border-amber-400/12 bg-white/[0.025] backdrop-blur-md"
                    style={{ clipPath: 'polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 18px 100%, 0 calc(100% - 18px))' }}>

                    {/* search */}
                    <div className="relative max-w-lg">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700" />
                        <input type="text" placeholder="Search team, sport, venue…"
                            value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/8 focus:border-amber-400/50 outline-none text-sm font-bold tracking-widest text-white/80 placeholder:text-gray-700 transition-all"
                            style={{ clipPath: 'polygon(6px 0, 100% 0, calc(100%-6px) 100%, 0 100%)' }}
                        />
                    </div>

                    <div className="flex flex-wrap gap-6">
                        {[
                            { label: 'Sport', opts: SPORTS_FILTER, val: sport, set: setSport },
                            { label: 'Day', opts: DAYS_FILTER, val: day, set: setDay },
                            { label: 'Category', opts: CATS_FILTER, val: category, set: setCategory },
                        ].map(({ label, opts, val, set }) => (
                            <div key={label} className="flex flex-col gap-2">
                                <span className="text-[8px] font-black tracking-[0.5em] text-gray-600 uppercase flex items-center gap-1.5">
                                    <Filter className="w-3 h-3" />{label}
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {opts.map(o => <Pill key={o} label={o} active={val === o} onClick={() => set(o)} />)}
                                </div>
                            </div>
                        ))}
                    </div>

                    {hasFilter && (
                        <div className="flex items-center gap-3 text-[10px] font-bold tracking-widest text-gray-500 uppercase pt-3 border-t border-white/5">
                            <span className="text-amber-400">{filtered.length}</span>&nbsp;match{filtered.length !== 1 ? 'es' : ''} found
                            <button onClick={clearFilters} className="flex items-center gap-1 text-white/30 hover:text-amber-400 transition-colors ml-2">
                                <X className="w-3 h-3" /> Reset
                            </button>
                        </div>
                    )}
                </motion.div>

                {/* ── GRID ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filtered.length === 0 ? (
                            <div className="col-span-full">
                                <SportsEmptyState type="results" onReset={clearFilters} />
                            </div>
                        ) : filtered.map((r, i) => <ResultCard key={r.id} result={r} index={i} />)}
                    </AnimatePresence>
                </div>
            </div>
        </main>
    );
}
