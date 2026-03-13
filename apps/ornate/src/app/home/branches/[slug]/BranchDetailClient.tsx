'use client';

import React, { useEffect, useRef, useState, useCallback, use, memo } from 'react';
import { motion, AnimatePresence, useScroll, useSpring, useTransform, useMotionValueEvent } from 'framer-motion';
import { ArrowLeft, Trophy, Zap, Star, X, Bell, Play, Medal, Camera, Calendar, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const CircularGallery = dynamic(() => import('@/components/ui/CircularGallery'), { ssr: false, loading: () => <div className="h-96 animate-pulse bg-white/5 rounded-lg" /> });
const DomeGallery = dynamic(() => import('@/components/ui/DomeGallery'), { ssr: false });
const ScrollMorphHero = dynamic(() => import('@/components/ui/scroll-morph-hero'), { ssr: false });
import { StandingsTable } from '@/components/ui/StandingsTable';
import BranchFooter from '@/components/branches/BranchFooter';
import SectorHeader from '@/components/layout/SectorHeader';
import { SectionHeader, VideoCarousel, EventReelsSection, VideoModal } from '@/components/ui/VideoSections';
import { addAlpha } from '@/lib/utils';

import MissionCard, { Mission } from '@/components/missions/MissionCard';
import { Awards } from '@/components/ui/award';
import type { BranchDetailData } from '@/lib/data/branch-detail';
import type { StandingRow } from '@/lib/data/sports';

const BRANCH_META_MAP: Record<string, { tagline: string; color: string; glow: string; category: string }> = {
    cse: { tagline: 'Planet of Code', color: '#ec4899', glow: 'rgba(236,72,153,0.5)', category: 'Branch' },
    ece: { tagline: 'Planet of Connectivity', color: '#8b5cf6', glow: 'rgba(139,92,246,0.5)', category: 'Branch' },
    eee: { tagline: 'Planet of Power', color: '#f97316', glow: 'rgba(249,115,22,0.5)', category: 'Branch' },
    mechanical: { tagline: 'Planet of Machines', color: '#eab308', glow: 'rgba(234,179,8,0.5)', category: 'Branch' },
    civil: { tagline: 'Planet of Builders', color: '#14b8a6', glow: 'rgba(20,184,166,0.5)', category: 'Branch' },
    hho: { tagline: 'Planet of Kindness', color: '#64748b', glow: 'rgba(100,116,139,0.5)', category: 'Branch' },
    artix: { tagline: 'Art Meets Innovation', color: '#9ca3af', glow: 'rgba(156,163,175,0.5)', category: 'Club' },
    kaladharani: { tagline: 'Culture in Motion', color: '#fcd34d', glow: 'rgba(252,211,77,0.5)', category: 'Club' },
    icro: { tagline: 'Capture the Universe', color: '#06b6d4', glow: 'rgba(6,182,212,0.5)', category: 'Club' },
    khelsaathi: { tagline: 'Play to Win', color: '#ef4444', glow: 'rgba(239,68,68,0.5)', category: 'Club' },
    pixelro: { tagline: 'Pixels & Beyond', color: '#d97706', glow: 'rgba(217,119,6,0.5)', category: 'Club' },
    sarvasrijana: { tagline: 'Create Together', color: '#22d3ee', glow: 'rgba(23,255,10,0.5)', category: 'Club' },
    techxcel: { tagline: 'Tech Accelerated', color: '#3b82f6', glow: 'rgba(59,130,246,0.5)', category: 'Club' },
};
// ─── Nav & Panels ─────────────────────────────────────────────────────────────

// ─── Spaceship Nav (scroll progress bar) ─────────────────────────────────────
const SpaceshipNav = memo(({ color }: { color: string }) => {
    const { scrollYProgress } = useScroll();
    const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });
    const width = useTransform(progress, [0, 1], ['0%', '100%']);

    return (
        <div className="fixed top-0 left-0 right-0 z-[150] pointer-events-none">
            <div className="relative h-[4px] w-full bg-white/5">
                <motion.div className="absolute inset-y-0 left-0 h-full rounded-r-full" style={{ width, background: `linear-gradient(90deg, ${addAlpha(color, '50')}, ${color})`, boxShadow: `0 0 12px ${addAlpha(color, '80')}` }} />
            </div>
        </div>
    );
});
SpaceshipNav.displayName = 'SpaceshipNav';

const UpdatesPanel = memo(({ updates, color }: { updates: string[]; color: string }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative z-[100]">
            <motion.button whileHover={{ scale: 1.05 }} onClick={() => setOpen(v => !v)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 font-black text-[10px] tracking-widest uppercase backdrop-blur-md rounded-full"
                style={{ border: `1px solid ${addAlpha(color, '60')}`, color, background: addAlpha(color, '15') }}>
                <Bell className="w-3 h-3 animate-pulse" /> <span className="hidden sm:inline">Updates</span>
            </motion.button>
            <AnimatePresence>
                {open && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-0 top-12 w-80 rounded-2xl overflow-hidden shadow-2xl z-50 bg-[#08080f] will-change-transform"
                        style={{ border: `1px solid ${addAlpha(color, '40')}` }}>
                        <div className="p-4 border-b flex justify-between" style={{ borderColor: addAlpha(color, '20') }}>
                            <span className="text-xs font-black uppercase" style={{ color }}>Updates</span>
                            <button onClick={() => setOpen(false)}><X className="w-3 h-3" /></button>
                        </div>
                        <div className="p-3 flex flex-col gap-2">
                            {updates.map((u, i) => (
                                <div key={i} className="text-[10px] text-gray-400 p-2 rounded bg-white/5 border border-white/10">{u}</div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});
UpdatesPanel.displayName = 'UpdatesPanel';

// ─── Spaceship Scrollbar (replaces browser scrollbar) ─────────────────────────
const SCROLLBAR_SHIP_SIZE = 50; // px height of the ship SVG
const SCROLLBAR_PADDING = 16; // top/bottom padding inside the track

const SpaceshipSidebar = memo(({ color }: { color: string }) => {
    const { scrollYProgress } = useScroll();
    const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 28 });
    const [pct, setPct] = useState(0);
    const [trackPx, setTrackPx] = useState(0);
    const trackRef = useRef<HTMLDivElement>(null);

    useMotionValueEvent(smoothProgress, 'change', (v) => setPct(v));

    // Keep track of usable pixel height
    useEffect(() => {
        const measure = () => {
            setTrackPx(window.innerHeight - SCROLLBAR_PADDING * 2 - SCROLLBAR_SHIP_SIZE);
        };
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, []);

    // Click on track to scroll to that position
    const handleTrackClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const track = trackRef.current;
        if (!track) return;
        const rect = track.getBoundingClientRect();
        const clickY = e.clientY - rect.top - SCROLLBAR_PADDING;
        const usable = rect.height - SCROLLBAR_PADDING * 2 - SCROLLBAR_SHIP_SIZE;
        const ratio = Math.max(0, Math.min(1, clickY / usable));
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({ top: ratio * maxScroll, behavior: 'smooth' });
    }, []);

    // Dragging the ship to scroll
    const isDragging = useRef(false);
    const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        isDragging.current = true;

        const onMove = (ev: MouseEvent | TouchEvent) => {
            if (!isDragging.current || !trackRef.current) return;
            const clientY = 'touches' in ev ? ev.touches[0].clientY : ev.clientY;
            const rect = trackRef.current.getBoundingClientRect();
            const clickY = clientY - rect.top - SCROLLBAR_PADDING - SCROLLBAR_SHIP_SIZE / 2;
            const usable = rect.height - SCROLLBAR_PADDING * 2 - SCROLLBAR_SHIP_SIZE;
            const ratio = Math.max(0, Math.min(1, clickY / usable));
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            window.scrollTo({ top: ratio * maxScroll });
        };
        const onUp = () => {
            isDragging.current = false;
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('touchend', onUp);
        };
        window.addEventListener('mousemove', onMove, { passive: false });
        window.addEventListener('mouseup', onUp);
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('touchend', onUp);
    }, []);

    return (
        <div
            ref={trackRef}
            onClick={handleTrackClick}
            className="fixed right-0 top-0 h-screen z-[140] hidden lg:flex flex-col items-center cursor-pointer"
            style={{ width: '46px' }}
        >
            {/* Track background */}
            <div
                className="absolute right-[20px] w-[3px] rounded-full"
                style={{
                    top: `${SCROLLBAR_PADDING}px`,
                    bottom: `${SCROLLBAR_PADDING}px`,
                    background: `linear-gradient(to bottom, transparent, ${addAlpha(color, '25')}, ${addAlpha(color, '25')}, transparent)`,
                }}
            />

            {/* Progress glow trail behind the ship — capped at ship position */}
            <div
                className="absolute right-[20px] w-[3px] rounded-full overflow-hidden"
                style={{
                    top: `${SCROLLBAR_PADDING}px`,
                    height: `${pct * trackPx}px`,
                }}
            >
                <div
                    className="w-full h-full rounded-full"
                    style={{
                        background: `linear-gradient(to bottom, ${addAlpha(color, '40')}, ${color})`,
                        boxShadow: `0 0 6px ${addAlpha(color, '50')}`,
                    }}
                />
            </div>

            {/* Spaceship — positioned along the track */}
            <motion.div
                className="absolute pointer-events-auto cursor-grab active:cursor-grabbing"
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
                style={{
                    right: '-4px',
                    top: `${SCROLLBAR_PADDING + pct * trackPx}px`,
                }}
            >
                {/* Engine trail (above ship — exhaust goes up) */}
                <motion.div
                    className="absolute left-1/2 -translate-x-1/2 rounded-full"
                    style={{
                        width: '10px',
                        bottom: `${SCROLLBAR_SHIP_SIZE - 4}px`,
                        height: '40px',
                        background: `linear-gradient(to top, ${color}, transparent)`,
                        filter: `blur(4px)`,
                    }}
                    animate={{ opacity: [0.5, 0.9, 0.5], height: ['30px', '50px', '30px'] }}
                    transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* The same spaceship from the roadmap/schedule, rotated 90° so nose faces down */}
                <svg width="50" height="40" viewBox="0 0 100 40" fill="none"
                    style={{ filter: `drop-shadow(0 0 8px ${addAlpha(color, '80')})`, transform: 'rotate(90deg)', transformOrigin: 'center center' }}>
                    <defs>
                        <linearGradient id="sbShipGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#1a1a1a" />
                            <stop offset="70%" stopColor="#333333" />
                            <stop offset="100%" stopColor="#e6e6e6" />
                        </linearGradient>
                        <linearGradient id="sbCockpitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={color} />
                            <stop offset="100%" stopColor="#004d00" />
                        </linearGradient>
                    </defs>
                    {/* Ship Body */}
                    <path d="M 10 20 Q 30 5, 80 15 Q 100 20, 80 25 Q 30 35, 10 20 Z" fill="url(#sbShipGrad)" stroke={color} strokeWidth="1" />
                    {/* Cockpit Canopy */}
                    <path d="M 50 12 Q 65 10, 75 16 L 55 16 Z" fill="url(#sbCockpitGrad)" opacity="0.9" />
                    {/* Upper Wing/Fin */}
                    <path d="M 20 17 L 15 5 L 35 15 Z" fill="#222" stroke={color} strokeWidth="0.5" />
                    {/* Lower Wing/Fin */}
                    <path d="M 20 23 L 15 35 L 35 25 Z" fill="#222" stroke={color} strokeWidth="0.5" />
                    {/* Engine nozzle */}
                    <rect x="5" y="17" width="5" height="6" fill="#111" stroke="#555" strokeWidth="1" />
                    {/* Thruster Glow */}
                    <motion.circle
                        cx="8" cy="20" r="2.5" fill="white"
                        animate={{ opacity: [0.9, 0.3, 0.9], r: [2, 3.5, 2] }}
                        transition={{ duration: 0.4, repeat: Infinity }}
                    />
                </svg>
            </motion.div>

            {/* Percentage label near ship */}
            <motion.div
                className="absolute pointer-events-none"
                style={{
                    right: '42px',
                    top: `${SCROLLBAR_PADDING + pct * trackPx + 10}px`,
                }}
            >
                <span className="text-[10px] font-mono font-bold tracking-wider opacity-70" style={{ color }}>
                    {Math.round(pct * 100)}%
                </span>
            </motion.div>
        </div>
    );
});
SpaceshipSidebar.displayName = 'SpaceshipSidebar';


function LaurelWreath({ color }: { color: string }) {
    return (
        <svg viewBox="-20 -10 140 120" className="absolute w-[120%] h-[120%] -left-[10%] -top-[10%] pointer-events-none opacity-60 group-hover:opacity-100 transition-all duration-700 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" style={{ filter: `drop-shadow(0 0 12px ${color}40)` }}>
            {/* Left Side Group - Widened Angle */}
            <g transform="rotate(-30 50 100) translate(5, 5)">
                {/* Independent left curved stem */}
                <path d="M40 85 C 20 75, 10 40, 20 15" stroke={color} fill="none" strokeWidth="1" strokeLinecap="round" opacity="0.8" />

                {/* Left Leaves outline */}
                {[
                    { x: 34, y: 78, r1: -60, r2: 0 }, { x: 26, y: 68, r1: -50, r2: 10 }, { x: 19, y: 55, r1: -40, r2: 20 },
                    { x: 16, y: 42, r1: -20, r2: 40 }, { x: 17, y: 30, r1: 0, r2: 60 }, { x: 20, y: 15, r1: 20, r2: 80 }
                ].map((p, i) => (
                    <g key={`l-${i}`} transform={`translate(${p.x},${p.y})`}>
                        <path d="M0 0 Q 5 -5, 0 -13 Q -5 -5, 0 0" fill="none" stroke={color} strokeWidth="1.5" transform={`rotate(${p.r1}) scale(0.6)`} />
                        <path d="M0 0 Q 5 -5, 0 -13 Q -5 -5, 0 0" fill="none" stroke={color} strokeWidth="1.5" transform={`rotate(${p.r2}) scale(0.6)`} />
                    </g>
                ))}
            </g>

            {/* Right Side Group - Widened Angle */}
            <g transform="rotate(30 50 100) translate(-5, 5)">
                {/* Independent right curved stem */}
                <path d="M60 85 C 80 75, 90 40, 80 15" stroke={color} fill="none" strokeWidth="1" strokeLinecap="round" opacity="0.8" />

                {/* Right Leaves outline */}
                {[
                    { x: 66, y: 78, r1: 60, r2: 0 }, { x: 74, y: 68, r1: 50, r2: -10 }, { x: 81, y: 55, r1: 40, r2: -20 },
                    { x: 84, y: 42, r1: 20, r2: -40 }, { x: 83, y: 30, r1: 0, r2: -60 }, { x: 80, y: 15, r1: -20, r2: -80 }
                ].map((p, i) => (
                    <g key={`r-${i}`} transform={`translate(${p.x},${p.y})`}>
                        <path d="M0 0 Q 5 -5, 0 -13 Q -5 -5, 0 0" fill="none" stroke={color} strokeWidth="1.5" transform={`rotate(${p.r1}) scale(0.6)`} />
                        <path d="M0 0 Q 5 -5, 0 -13 Q -5 -5, 0 0" fill="none" stroke={color} strokeWidth="1.5" transform={`rotate(${p.r2}) scale(0.6)`} />
                    </g>
                ))}
            </g>
        </svg>
    );
}

function TrophyStatue({ color, glow }: { color: string, glow: string }) {
    return (
        <div className="relative w-80 h-[500px] flex items-center justify-center">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="relative z-10 w-full h-full flex items-center justify-center">
                <svg viewBox="0 0 200 400" className="w-full h-full drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                    <circle cx="100" cy="80" r="15" stroke={color} fill="none" strokeWidth="2" />
                    <path d="M100 95 L100 240 M85 110 L115 110" stroke={color} strokeWidth="2" />
                    <path d="M100 130 L30 50 L100 260 L170 50 Z" stroke={color} strokeWidth="1.5" fill={addAlpha(color, '10')} />
                    <path d="M100 130 L10 100 L100 260 L190 100 Z" stroke={color} strokeWidth="1" fill={addAlpha(color, '05')} />
                    <path d="M70 300 L130 300 L140 340 L60 340 Z" stroke={color} strokeWidth="2" fill="none" />
                </svg>
            </motion.div>
            <div className="absolute inset-x-0 bottom-20 h-40 bg-gradient-to-t from-black via-black/80 to-transparent z-20" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] blur-[100px] opacity-20 pointer-events-none rounded-full" style={{ background: color }} />
        </div>
    );
}

const AccoladeCard = memo(({ item, color }: { item: any, color: string }) => {
    const accentColor = color;

    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="group relative flex flex-col items-center justify-center text-center p-4 w-full md:w-72 h-48 sm:h-[18rem] mx-auto transition-all duration-500 will-change-transform">
            <Awards
                variant="award"
                title={item.status}
                subtitle={item.title}
                description={item.organization}
                recipient={item.student}
                color={accentColor}
            />
        </motion.div>
    );
});
AccoladeCard.displayName = 'AccoladeCard';

const HallOfFameSection = memo(({ data, color }: { data: any[], color: string }) => {
    const leftAccolades = data ? data.filter(d => d.addedBySuperAdmin).slice(0, 4) : []; // Super Admin (Overall)
    const rightAccolades = data ? data.filter(d => !d.addedBySuperAdmin).slice(0, 4) : []; // Branch Admin

    return (
        <section className="relative py-12 sm:py-24 px-4 sm:px-10 overflow-hidden bg-[#030308]">
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 50%, ${addAlpha(color, '40')} 0%, transparent 70%)` }} />

            <div className="max-w-[1500px] mx-auto flex flex-col items-center">
                <div className="flex flex-row items-center justify-center w-full gap-2 sm:gap-8 overflow-visible transform scale-[0.45] sm:scale-100 origin-center">
                    {/* Left Column (Overall Best Added By Super Admin) */}
                    <div className="flex-1 flex flex-col gap-y-12 sm:gap-y-16 items-center">
                        {leftAccolades.map((item) => (
                            <AccoladeCard key={item.id} item={item} color={color} />
                        ))}
                    </div>

                    {/* Center Piece */}
                    <div className="flex flex-col items-center justify-center z-10 mx-2 sm:mx-4 shrink-0">
                        <TrophyStatue color={color} glow={color} />
                        <div className="text-center -mt-16 sm:-mt-20 relative z-50">
                            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-5xl sm:text-6xl lg:text-7xl font-black text-white italic uppercase tracking-tighter leading-none mb-2 drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]">
                                BEST OUTGOING <br /> <span style={{ color }}>STUDENTS</span>
                            </motion.h2>
                            <p className="text-[10px] sm:text-[11px] tracking-[0.5em] sm:tracking-[1em] text-gray-400 uppercase font-black">2K26 Academic Ceremony</p>
                        </div>
                    </div>

                    {/* Right Column (Branch Best Added By Branch Admin) */}
                    <div className="flex-1 flex flex-col gap-y-12 sm:gap-y-16 items-center">
                        {rightAccolades.map((item) => (
                            <AccoladeCard key={item.id} item={item} color={color} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
});
HallOfFameSection.displayName = 'HallOfFameSection';

const WinnersSection = memo(({ events, color, allWinners }: { events: Mission[], color: string, allWinners: any[] }) => {
    const EVENT_CATS = ['ALL', 'TECHNICAL', 'CULTURAL', 'SPORTS', 'FUN', 'WORKSHOPS', 'HACKATHONS', 'GAMING'];
    const [selectedCat, setSelectedCat] = useState('ALL');
    const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

    const filteredEvents = events.filter(e => selectedCat === 'ALL' || e.eventCategory === selectedCat);

    return (
        <section className="py-12 sm:py-24 px-4 sm:px-10 bg-[#030308]/50 border-y border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-20" style={{ background: `radial-gradient(circle at 50% 10%, ${addAlpha(color, '20')} 0%, transparent 60%)` }} />

            <div className="max-w-7xl mx-auto relative z-10">
                <SectionHeader color={color} label="Results" title="EVENT WINNERS" />

                {/* Category Filters */}
                <div className="flex flex-wrap gap-3 mb-12 justify-center">
                    {EVENT_CATS.map(cat => (
                        <button
                            key={cat}
                            onClick={() => { setSelectedCat(cat); setExpandedEvent(null); }}
                            className={`px-5 py-2.5 text-[10px] font-black tracking-widest uppercase border transition-all duration-300 rounded-sm ${selectedCat === cat ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'border-gray-800/80 text-gray-500 hover:border-gray-600 hover:text-gray-300'}`}
                            style={selectedCat === cat ? { borderColor: color, color: color } : {}}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Event Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence mode="popLayout">
                        {filteredEvents.map((event, index) => {
                            const isExpanded = expandedEvent === event.id;
                            // Look up real winners from DB
                            const winnerRecord = allWinners?.find(w => w.eventId === event.id);
                            const positions = winnerRecord?.positions as Record<string, any> | null | undefined;
                            const PLACE_ICONS = ['🥇', '🥈', '🥉'];
                            const PLACE_LABELS = ['1st Place', '2nd Place', '3rd Place'];
                            const hasWinner = !!winnerRecord && !!positions;
                            const displayWinners = hasWinner
                                ? Object.entries(positions)
                                    .sort(([a], [b]) => Number(a) - Number(b))
                                    .slice(0, 3)
                                    .map(([pos, val], i) => ({
                                        icon: PLACE_ICONS[i] || '🏅',
                                        prize: PLACE_LABELS[i] || `${pos} Place`,
                                        team: typeof val === 'string' ? val : (val?.name || val?.team || JSON.stringify(val)),
                                    }))
                                : [];

                            return (
                                <motion.div
                                    key={event.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.4 }}
                                    onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                                    className={`relative group border rounded-2xl bg-[#08080c] overflow-hidden transition-all duration-500 cursor-pointer will-change-transform ${isExpanded ? 'border-transparent shadow-[0_0_30px_rgba(0,0,0,0.5)]' : 'border-white/5 hover:border-white/20'}`}
                                    style={isExpanded ? { boxShadow: `0 0 20px ${addAlpha(color, '30')}, inset 0 0 20px ${addAlpha(color, '10')}`, borderColor: addAlpha(color, '50') } : {}}
                                >
                                    {/* Top Accent Bar */}
                                    <div className={`absolute top-0 left-0 w-full h-1 transition-opacity ${isExpanded ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'}`} style={{ backgroundColor: color }} />

                                    {/* Background Icon */}
                                    <div className="absolute top-4 right-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none">
                                        <Trophy className="w-24 h-24" style={{ color }} />
                                    </div>

                                    <div className="p-8 relative z-10 min-h-[220px] flex flex-col justify-center">
                                        <AnimatePresence mode="wait">
                                            {!isExpanded ? (
                                                <motion.div
                                                    key="front"
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="flex flex-col items-center text-center py-6"
                                                >
                                                    <span className="text-[9px] font-black uppercase tracking-[0.3em] px-3 py-1 bg-white/5 rounded inline-block mb-4" style={{ color }}>{event.eventCategory}</span>
                                                    <h4 className="text-2xl font-black uppercase tracking-widest text-white mb-6 leading-tight group-hover:text-glow transition-all px-4">{event.title}</h4>

                                                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500 group-hover:text-white transition-colors">
                                                        <Trophy className="w-3.5 h-3.5" style={{ color }} />
                                                        <span>Click to View Winners</span>
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="back"
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="flex flex-col h-full"
                                                >
                                                    {/* Event Header Mini */}
                                                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                                                        <h4 className="text-sm font-black uppercase tracking-widest text-white/50">{event.title}</h4>
                                                        <button
                                                            className="text-gray-500 hover:text-white transition-colors p-1"
                                                            onClick={(e) => { e.stopPropagation(); setExpandedEvent(null); }}
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>

                                                    {/* Winners List */}
                                                    {hasWinner ? (
                                                        <div className="flex flex-col gap-3">
                                                            {displayWinners.map((w, i) => (
                                                                <motion.div
                                                                    initial={{ opacity: 0, x: -10 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    transition={{ delay: i * 0.1 }}
                                                                    key={i}
                                                                    className="flex items-center gap-4 bg-black p-3.5 rounded-xl border border-white/5 group/winner hover:bg-white/[0.02] transition-colors"
                                                                >
                                                                    <span className="text-3xl drop-shadow-md group-hover/winner:scale-110 transition-transform">{w.icon}</span>
                                                                    <div className="flex-1">
                                                                        <p className="text-sm font-black tracking-widest uppercase text-gray-200">{w.team}</p>
                                                                        <p className="text-[8px] tracking-[0.2em] font-bold text-gray-500 uppercase mt-0.5" style={{ color: i === 0 ? color : '' }}>{w.prize}</p>
                                                                    </div>
                                                                </motion.div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
                                                            <span className="text-3xl">⏳</span>
                                                            <p className="text-[10px] font-black tracking-widest uppercase text-gray-500">Not Announced Yet</p>
                                                            <p className="text-[8px] text-gray-700 tracking-widest uppercase">Results will appear once published</p>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Ambient Glow */}
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 bg-gradient-to-t from-transparent blur-3xl opacity-0 transition-opacity duration-700 pointer-events-none" style={{ backgroundImage: `radial-gradient(circle, ${color} 0%, transparent 70%)`, opacity: isExpanded ? 0.3 : 0 }} />
                                    {/* Hover Ambient Glow */}
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 bg-gradient-to-t from-transparent blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none" style={{ backgroundImage: `radial-gradient(circle, ${color} 0%, transparent 70%)` }} />
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {filteredEvents.length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center p-12 py-32 border border-dashed border-gray-800 rounded-2xl bg-white/[0.01]">
                        <Trophy className="w-12 h-12 text-gray-800 mb-4" />
                        <p className="text-gray-500 text-[10px] font-black tracking-[0.4em] uppercase">No events found in this category</p>
                    </motion.div>
                )}
            </div>
        </section>
    );
});
WinnersSection.displayName = 'WinnersSection';

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BranchDetailClient({
    data,
    boysStandings = [],
    boysCategories = [],
    girlsStandings = [],
    girlsCategories = []
}: {
    data: BranchDetailData,
    boysStandings?: StandingRow[],
    boysCategories?: string[],
    girlsStandings?: StandingRow[],
    girlsCategories?: string[]
}) {
    const slug = data.slug.toLowerCase();
    const meta = BRANCH_META_MAP[slug] || { tagline: 'Explore · Innovate · Excel', color: 'var(--color-neon)', glow: 'rgba(var(--color-neon-rgb, 57, 255, 20), 0.5)', category: 'Branch / Club' };
    const { color, glow, category, tagline } = meta;
    const [domeOpen, setDomeOpen] = useState(false);
    const [fullGalleryOpen, setFullGalleryOpen] = useState(false);
    const [selectedAlbum, setSelectedAlbum] = useState<number | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [eventFilter, setEventFilter] = useState<string>('ALL');
    const [playingVideo, setPlayingVideo] = useState<string | null>(null);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Unlock orientation so detail page shows in normal (portrait) view
    useEffect(() => {
        if (screen.orientation && typeof screen.orientation.unlock === 'function') {
            screen.orientation.unlock();
        }
    }, []);

    return (
        <>
            <style jsx global>{`
                html, body { overflow-y: auto !important; overflow-x: hidden !important; }
                html::-webkit-scrollbar, body::-webkit-scrollbar { width: 0 !important; display: none !important; }
                html, body { -ms-overflow-style: none !important; scrollbar-width: none !important; }
                * { scrollbar-width: none; -ms-overflow-style: none; }
                *::-webkit-scrollbar { display: none; width: 0; }
            `}</style>

            <SpaceshipNav color={color} />
            <SpaceshipSidebar color={color} />

            <AnimatePresence>
                {domeOpen && (
                    <div className="fixed inset-0 z-[200] bg-black">
                        <button onClick={() => { setDomeOpen(false); setSelectedAlbum(null); }} className="absolute top-4 sm:top-8 right-4 sm:right-8 z-[210] text-white font-black uppercase text-xs p-4 flex items-center justify-center">
                            <X className="w-5 h-5 sm:hidden" />
                            <span className="hidden sm:inline">✕ Close</span>
                        </button>
                        <DomeGallery
                            images={selectedAlbum !== null && data.albums[selectedAlbum]
                                ? data.albums[selectedAlbum].images
                                : data.gallery
                            }
                            grayscale={false}
                            fit={0.52}
                            overlayBlurColor="#030308"
                        />
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {fullGalleryOpen && (
                    <div className="fixed inset-0 z-[200] bg-black">
                        <button onClick={() => setFullGalleryOpen(false)} className="absolute top-4 sm:top-8 right-4 sm:right-8 z-[210] text-white font-black uppercase text-xs z-50 p-4 flex items-center justify-center">
                            <X className="w-5 h-5 sm:hidden" />
                            <span className="hidden sm:inline">✕ Close</span>
                        </button>
                        <ScrollMorphHero albums={data.albums} />
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {playingVideo && (
                    <VideoModal url={playingVideo} onClose={() => setPlayingVideo(null)} />
                )}
            </AnimatePresence>


            <main className="bg-[#030308] text-white selection:bg-white/10 overflow-x-clip">
                {/* Bg effects */}
                <div className="fixed inset-0 pointer-events-none opacity-20" style={{ background: `radial-gradient(circle at 50% 30%, ${addAlpha(color, '40')} 0%, transparent 70%)` }} />

                <SectorHeader
                    title={`${data.name} HUB`}
                    subtitle={`${category} Operational Sector`}
                    accentColor={color}
                    rightElement={<UpdatesPanel updates={data.updates} color={color} />}
                />

                {/* 1. HERO */}
                <section className="relative h-screen min-h-[600px] flex flex-col items-center justify-center p-6 sm:p-10 text-center">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }} className="mt-8 px-4 w-full">
                        <p className="text-[8px] sm:text-[10px] tracking-[0.5em] sm:tracking-[1em] uppercase mb-3 sm:mb-4 opacity-50 font-black">WELCOME TO</p>
                        <h1 className="text-[10vw] sm:text-7xl md:text-[8rem] lg:text-[10rem] font-black uppercase leading-none mb-4 sm:mb-6 mx-auto whitespace-nowrap max-w-[95vw] overflow-visible" style={{ color, textShadow: `0 0 50px ${color}40` }}>{data.name}</h1>
                        <p className="text-xs sm:text-xl md:text-2xl font-black tracking-[0.15em] sm:tracking-[0.3em] text-gray-400 uppercase leading-snug">{tagline}</p>
                        <p className="mt-6 sm:mt-8 max-w-xl mx-auto text-gray-500 text-xs sm:text-sm leading-relaxed">{data.description}</p>
                    </motion.div>

                    <div className="absolute bottom-10 animate-bounce text-gray-700 uppercase text-[8px] tracking-[0.5em] font-black">Scroll Down</div>
                </section>

                {/* 2. VIDEOS (Holographic Carousel) */}
                {data.videos && data.videos.filter(v => v.category?.toUpperCase() === 'PROMO').length > 0 && (
                    <section className="py-12 sm:py-24 px-4 sm:px-10 bg-[#030308] relative overflow-hidden z-10">
                        <div className="max-w-7xl mx-auto relative z-10">
                            <SectionHeader color={color} label="Cinematic" title="FEATURED PROMOS" />
                            <VideoCarousel videos={data.videos.filter(v => v.category?.toUpperCase() === 'PROMO')} color={color} onPlay={setPlayingVideo} />
                        </div>
                    </section>
                )}

                {/* 2.1 EVENT REELS */}
                {data.videos && data.videos.filter(v => v.category?.toUpperCase() === 'VIDEO').length > 0 && (
                    <div className="bg-[#030308] relative z-10">
                        <EventReelsSection videos={data.videos.filter(v => v.category?.toUpperCase() === 'VIDEO')} color={color} branchName={data.name} onPlay={setPlayingVideo} />
                    </div>
                )}

                {/* 3. EVENTS (Holographic Missions) */}
                <section className="py-12 sm:py-24 px-4 sm:px-10 bg-[#030308]">
                    <div className="max-w-7xl mx-auto">
                        <SectionHeader color={color} label="Schedule" title="ALL MISSIONS" />

                        {/* ── Filter Bar ── */}
                        {(() => {
                            const events = data.events as Mission[];
                            const days = Array.from(new Set(events.map(e => e.eventDay))).sort();
                            const cats = Array.from(new Set(events.map(e => e.eventCategory).filter(Boolean)));
                            const hasPaid = events.some(e => e.isPaid);

                            const groups: { label: string; value: string }[][] = [
                                [{ label: 'ALL', value: 'ALL' }],
                                days.map(d => ({ label: d, value: d })),
                                cats.map(c => ({ label: c!, value: c! })),
                                ...(hasPaid ? [[{ label: 'FREE', value: 'FREE' }, { label: 'PAID', value: 'PAID' }]] : []),
                            ];

                            const filteredEvents = events.filter(e => {
                                if (eventFilter === 'ALL') return true;
                                if (eventFilter === 'FREE') return !e.isPaid;
                                if (eventFilter === 'PAID') return e.isPaid;
                                if (days.includes(eventFilter)) return e.eventDay === eventFilter;
                                if (cats.includes(eventFilter)) return e.eventCategory === eventFilter;
                                return true;
                            });

                            return (
                                <>
                                    {/* Filter pills — scroll horizontal on mobile, wrap on desktop */}
                                    <div className="mb-8 sm:mb-10">
                                        {/* Mobile: single horizontal scroll row */}
                                        <div className="flex sm:hidden gap-2 overflow-x-auto pb-2 no-scrollbar">
                                            {groups.flat().map(({ label, value }) => {
                                                const active = eventFilter === value;
                                                return (
                                                    <button
                                                        key={value}
                                                        onClick={() => setEventFilter(value)}
                                                        className="shrink-0 px-3 py-1.5 text-[9px] font-black tracking-[0.25em] uppercase transition-all duration-200"
                                                        style={{
                                                            background: active ? color : addAlpha(color, '10'),
                                                            border: `1px solid ${active ? color : addAlpha(color, '30')}`,
                                                            color: active ? '#000' : color,
                                                            boxShadow: active ? `0 0 14px ${addAlpha(color, '55')}` : 'none',
                                                        }}
                                                    >
                                                        {label}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Desktop: grouped with separators */}
                                        <div className="hidden sm:flex items-center gap-1 flex-wrap">
                                            {groups.map((group, gi) => (
                                                <React.Fragment key={gi}>
                                                    {gi > 0 && (
                                                        <div className="w-px h-5 mx-2" style={{ background: `${color}30` }} />
                                                    )}
                                                    {group.map(({ label, value }) => {
                                                        const active = eventFilter === value;
                                                        return (
                                                            <button
                                                                key={value}
                                                                onClick={() => setEventFilter(value)}
                                                                className="px-4 py-1.5 text-[9px] font-black tracking-[0.25em] uppercase transition-all duration-200 hover:-translate-y-0.5"
                                                                style={{
                                                                    background: active ? color : addAlpha(color, '10'),
                                                                    border: `1px solid ${active ? color : addAlpha(color, '30')}`,
                                                                    color: active ? '#000' : color,
                                                                    boxShadow: active ? `0 0 16px ${addAlpha(color, '55')}` : 'none',
                                                                    clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)',
                                                                }}
                                                            >
                                                                {label}
                                                            </button>
                                                        );
                                                    })}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Count badge */}
                                    <p className="text-[9px] font-black tracking-[0.4em] uppercase mb-6 flex items-center gap-2" style={{ color }}>
                                        <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: color }} />
                                        {filteredEvents.length} MISSION{filteredEvents.length !== 1 ? 'S' : ''} FOUND
                                    </p>

                                    {/* Events grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {filteredEvents.length > 0 ? filteredEvents.map((mission) => (
                                            <MissionCard key={mission.id} mission={mission} themeColor={color} />
                                        )) : (
                                            <div className="col-span-full flex flex-col items-center justify-center py-24 border border-dashed border-gray-800 bg-white/[0.01]">
                                                <Trophy className="w-10 h-10 text-gray-800 mb-4" />
                                                <p className="text-gray-600 text-[10px] font-black tracking-[0.4em] uppercase">No events match this filter</p>
                                                <button onClick={() => setEventFilter('ALL')} className="mt-4 text-[9px] font-black tracking-widest uppercase px-4 py-1.5" style={{ color, border: `1px solid ${color}40` }}>Clear Filter</button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </section>

                {/* 4. HALL OF FAME (Main Section) */}
                <HallOfFameSection data={(data as any).hallOfFame} color={color} />

                {/* 5. WINNERS */}
                <WinnersSection events={data.events as Mission[]} color={color} allWinners={data.winners} />

                {/* 6. CHAMPIONSHIP */}
                {category === 'Branch' && (boysStandings.length > 0 || girlsStandings.length > 0) && (
                    <section className="py-12 sm:py-24 px-4 sm:px-10">
                        <div className="max-w-7xl mx-auto space-y-16">
                            <SectionHeader color={color} label="Leaderboard" title="CHAMPIONSHIP" />

                            {/* Boys Standings */}
                            {boysStandings.length > 0 && (
                                <div className="relative">
                                    <StandingsTable
                                        title="BOYS CHAMPIONSHIP"
                                        subtitle="Points per department across all sports"
                                        accentColor={color}
                                        data={boysStandings}
                                        categories={boysCategories}
                                    />
                                </div>
                            )}

                            {/* Girls Standings */}
                            {girlsStandings.length > 0 && (
                                <div className="relative">
                                    <StandingsTable
                                        title="GIRLS CHAMPIONSHIP"
                                        subtitle="Points per department across all sports"
                                        accentColor={color}
                                        data={girlsStandings}
                                        categories={girlsCategories}
                                    />
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* 7. GALLERY */}
                <section className="py-12 sm:py-24 px-4 overflow-hidden">
                    <SectionHeader color={color} label="Visual Archive" title="GALLERY" />
                    <div className="h-[500px] w-full">
                        <CircularGallery
                            bend={isMobile ? 0 : 3}
                            textColor={color}
                            borderRadius={0.05}
                            scrollSpeed={isMobile ? 1.5 : 2}
                            scrollEase={0.05}
                            autoScrollSpeed={isMobile ? -0.1 : 0.15}
                            items={data.albums.length > 0
                                ? data.albums.map((album, i) => ({
                                    image: album.coverImage || (album.images && album.images.length > 0 ? album.images[0] : '/placeholder.jpg'),
                                    text: album.title,
                                    index: i
                                }))
                                : data.gallery.map((img, i) => ({
                                    image: img,
                                    text: `Moment ${i + 1}`,
                                    index: i
                                }))
                            }
                            onSelect={(item) => {
                                if (data.albums.length > 0) {
                                    setSelectedAlbum(item.index as number);
                                }
                                setDomeOpen(true);
                            }}
                        />
                    </div>
                    <div className="text-center mt-12">
                        <button onClick={() => setFullGalleryOpen(true)} className="px-12 py-5 font-black uppercase tracking-widest text-sm rounded-full transition-all hover:scale-105" style={{ background: color, color: '#000' }}>Open Full Gallery</button>
                    </div>
                </section>

                {/* 8. FOOTER */}
                <BranchFooter slug={slug} data={data} />
            </main>
        </>
    );
}
