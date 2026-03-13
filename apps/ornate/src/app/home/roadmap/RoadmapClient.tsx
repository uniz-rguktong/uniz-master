'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Filter, Building2, Users, Zap, X } from 'lucide-react';
import SectorHeader from '@/components/layout/SectorHeader';

type MainFilter = 'all' | 'branches' | 'clubs' | 'hho';

const FILTER_META: Record<Exclude<MainFilter, 'all'>, { label: string; icon: React.ComponentType<{ className?: string }>; accent: string }> = {
    branches: { label: 'Branches', icon: Building2, accent: 'var(--color-neon)' },
    clubs: { label: 'Clubs', icon: Users, accent: '#22d3ee' },
    hho: { label: 'HHo', icon: Zap, accent: '#fbbf24' },
};

interface RoadmapEvent {
    id: string;
    title: string;
    timeStr: string;
    type: string | undefined;
    description: string;
    venue: string;
    origin: string;
    category: string;
    subCategory: string;
    day: number;
    targetDay?: number;
    date?: Date;
}

interface RoadmapClientProps {
    events: RoadmapEvent[];
}

export default function RoadmapClient({ events: EVENTS }: RoadmapClientProps) {
    const [currentTime, setCurrentTime] = useState<Date>(new Date());
    const [mounted, setMounted] = useState(false);
    const [activeDay, setActiveDay] = useState<number>(1);
    const timelineRef = useRef<HTMLDivElement>(null);

    const [mainFilter, setMainFilter] = useState<MainFilter>('all');
    const [subFilter, setSubFilter] = useState('all');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const filterDropdownRef = useRef<HTMLDivElement>(null);

    const subCategoryOptions = React.useMemo(() => {
        if (mainFilter === 'all') return [];

        return Array.from(
            new Set(
                EVENTS
                    .filter((ev) => ev.category === mainFilter)
                    .map((ev) => ev.subCategory)
                    .filter(Boolean)
            )
        ).sort();
    }, [EVENTS, mainFilter]);

    const hasActiveFilter = mainFilter !== 'all' || subFilter !== 'all';

    // Initialize events with exact Date objects grouped by time
    const groupedTimelineEvents = React.useMemo(() => {
        let filtered = EVENTS.filter(ev => ev.day === activeDay);
        if (mainFilter !== 'all') {
            filtered = filtered.filter(ev => ev.category === mainFilter);
            if (subFilter !== 'all') {
                filtered = filtered.filter(ev => ev.subCategory === subFilter);
            }
        }

        const baseDateStr = "2026-01-01T";
        const allEvents = filtered.map((ev) => {
            const dateTime = new Date(`${baseDateStr}${ev.timeStr}:00+05:30`);
            return { ...ev, date: dateTime };
        });

        // Add special pseudo planet nodes
        if (activeDay === 1) {
            allEvents.push({
                id: 'planet-day2', title: 'Day 2', timeStr: '23:59', type: 'Planet',
                description: 'Travel to next cycle.', category: 'overall', day: 1,
                targetDay: 2,
                date: new Date(`${baseDateStr}23:59:00+05:30`)
            } as any);
        } else if (activeDay === 2) {
            allEvents.push({
                id: 'planet-day3', title: 'Day 3', timeStr: '23:59', type: 'Planet',
                description: 'Travel to final cycle.', category: 'overall', day: 2,
                targetDay: 3,
                date: new Date(`${baseDateStr}23:59:00+05:30`)
            } as any);
            allEvents.unshift({
                id: 'planet-day1', title: 'Day 1', timeStr: '00:00', type: 'Planet',
                description: 'Return to previous cycle.', category: 'overall', day: 2,
                targetDay: 1,
                date: new Date(`${baseDateStr}00:00:00+05:30`)
            } as any);
        } else if (activeDay === 3) {
            allEvents.unshift({
                id: 'planet-day2', title: 'Day 2', timeStr: '00:00', type: 'Planet',
                description: 'Return to previous cycle.', category: 'overall', day: 3,
                targetDay: 2,
                date: new Date(`${baseDateStr}00:00:00+05:30`)
            } as any);
        }

        allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

        const grouped: { time: number, date: Date, events: typeof allEvents }[] = [];
        allEvents.forEach(ev => {
            const t = ev.date.getTime();
            let group = grouped.find(g => g.time === t);
            if (!group) {
                group = { time: t, date: ev.date, events: [] };
                grouped.push(group);
            }
            group.events.push(ev);
        });

        return grouped;
    }, [mainFilter, subFilter, activeDay]);

    // Calculate dynamic length based on number of distinct event nodes (e.g. 20vw per node)
    const dynamicWidthVW = Math.max(100, groupedTimelineEvents.length * 20);

    let progress = 0;
    // Hardcoded time simulation to elegantly demonstrate completed vs upcoming events on the timeline
    const nowTimeStr = "12:30:00";
    const nowTime = new Date(`2026-01-01T${nowTimeStr}+05:30`).getTime();

    if (groupedTimelineEvents.length > 0) {
        if (nowTime < groupedTimelineEvents[0].time) {
            progress = 0;
        } else if (nowTime >= groupedTimelineEvents[groupedTimelineEvents.length - 1].time) {
            progress = 1;
        } else {
            for (let i = 0; i < groupedTimelineEvents.length - 1; i++) {
                const group1 = groupedTimelineEvents[i];
                const group2 = groupedTimelineEvents[i + 1];
                if (nowTime >= group1.time && nowTime < group2.time) {
                    const timeWindow = group2.time - group1.time;
                    const timePassed = nowTime - group1.time;
                    const localProgress = timePassed / timeWindow;

                    const p1 = i / (groupedTimelineEvents.length - 1);
                    const p2 = (i + 1) / (groupedTimelineEvents.length - 1);
                    progress = p1 + localProgress * (p2 - p1);
                    break;
                }
            }
        }
    }

    useEffect(() => {
        // use a short timeout to bypass set-state-in-effect strict rules if they exist
        const initTimeout = setTimeout(() => {
            setMounted(true);
        }, 0);

        // We update current time every second to see the live clock updates
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => {
            clearInterval(interval);
            clearTimeout(initTimeout);
        };
    }, []);

    useEffect(() => {
        const onClickOutside = (event: MouseEvent) => {
            if (!filterDropdownRef.current) return;
            if (!filterDropdownRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false);
            }
        };

        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    // Track the continuous visual progress for deep calculations along the curve paths
    const visualProgress = useMotionValue(0);

    // Effect to continuously tween mathematical progress
    useEffect(() => {
        if (!mounted) {
            // Lock the initial visual state to 0 so the animation forces a journey from the start line on load
            visualProgress.set(0);
            return;
        }

        // This ensures Framer recalculates the 'getCurveY' during every exact frame of its journey
        animate(visualProgress, progress, { duration: 4, ease: "easeInOut" });
    }, [progress, mounted, visualProgress]);

    const getCurveY = React.useCallback((p: number) => {
        const wave1 = Math.sin(p * Math.PI * 2.5) * 90;
        const wave2 = Math.sin(p * Math.PI * 4.5) * 45;
        return Number((wave1 + wave2).toFixed(3));
    }, []);

    const getCurveRotation = React.useCallback((p: number) => {
        const h = 0.001;
        const y1 = getCurveY(p);
        const y2 = getCurveY(p + h);
        const dx = h * 2500;
        return Number((Math.atan2(y2 - y1, dx) * (180 / Math.PI)).toFixed(3));
    }, [getCurveY]);

    const pathPoints = 200;
    const pathD = React.useMemo(() => {
        return Array.from({ length: pathPoints }).map((_, i) => {
            const p = i / (pathPoints - 1);
            return `${i === 0 ? 'M' : 'L'} ${(p * 100).toFixed(3)} ${(300 + getCurveY(p)).toFixed(3)}`;
        }).join(' ');
    }, [pathPoints, getCurveY]);

    const shipLeft = useTransform(visualProgress, (p) => `calc(20vw + (100% - 40vw) * ${p})`);
    const shipTop = useTransform(visualProgress, (p) => `calc(50% + ${getCurveY(p)}px)`);
    const shipRotate = useTransform(visualProgress, (p) => `${getCurveRotation(p)}deg`);

    // --- MOBILE VERTICAL MATH ---
    const getCurveYMobile = React.useCallback((p: number) => {
        // Subtle snake-like curve
        const wave1 = Math.sin(p * Math.PI * 2.5) * 20;
        const wave2 = Math.sin(p * Math.PI * 4.5) * 10;
        return Number((wave1 + wave2).toFixed(3));
    }, []);

    const getCurveRotationMobile = React.useCallback((p: number) => {
        const h = 0.001;
        // Notice we swap dx, dy because we are moving vertically down the screen.
        // Y-axis progress is along the screen height (vertical).
        // X-axis perturbation is getCurveYMobile (horizontal).
        const dx = getCurveYMobile(p + h) - getCurveYMobile(p);
        const dy = h * 600;
        return Number((Math.atan2(dy, dx) * (180 / Math.PI)).toFixed(3));
    }, [getCurveYMobile]);

    const pathDMobile = React.useMemo(() => {
        return Array.from({ length: pathPoints }).map((_, i) => {
            const p = i / (pathPoints - 1);
            // Center X in the viewBox (width=600, center=300), Y goes 0 to 100 vertically
            return `${i === 0 ? 'M' : 'L'} ${(300 + getCurveYMobile(p)).toFixed(3)} ${(p * 100).toFixed(3)}`;
        }).join(' ');
    }, [pathPoints, getCurveYMobile]);

    const shipTopVertical = useTransform(visualProgress, (p) => `calc(10vh + (100% - 20vh) * ${p})`);
    const shipLeftVertical = useTransform(visualProgress, (p) => `calc(50% + ${getCurveYMobile(p)}px)`);
    const shipRotateVertical = useTransform(visualProgress, (p) => `${getCurveRotationMobile(p)}deg`);
    // ---------------------------

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const handleWheel = (e: React.WheelEvent) => {
        if (scrollContainerRef.current) {
            // If user is scrolling vertically, translate it to horizontal
            // Multiplied by 2 for faster scrolling effect
            if (e.deltaY !== 0) {
                scrollContainerRef.current.scrollLeft += e.deltaY * 3;
            }
        }
    };

    return (
        <main className="relative w-screen h-screen overflow-hidden bg-black font-orbitron text-white">
            {/* Overlay to give space a slight dark green vibe for the roadmap */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-linear-to-b from-[#0a0a0a]/70 via-[#051005]/60 to-[#0a0a0a]/70" />
            </div>

            {/* Top Header with Embedded Filters */}
            <SectorHeader
                title="EVENT ROADMAP"
                subtitle="Sector-Wide Operational Schedule"
                hideProfile={true}
                rightElement={
                    <div className="flex items-center gap-4 md:gap-6">
                        {/* 1. Current Filter Status */}
                        <div className="hidden lg:flex items-center gap-2 px-4 border-r border-white/10">
                            <div className="text-[10px] tracking-[0.22em] uppercase text-gray-500 font-bold">Active Filter</div>
                            <div className="px-3 py-1 border border-neon/25 bg-neon/5 text-[10px] font-bold tracking-widest uppercase text-neon">
                                {mainFilter === 'all' ? 'All Events' : FILTER_META[mainFilter].label}
                                {subFilter !== 'all' ? ` / ${subFilter}` : ''}
                            </div>
                        </div>

                        {/* 2. Filter Dropdown */}
                        <div ref={filterDropdownRef} className="relative">
                            <button
                                onClick={() => setIsFilterOpen((prev) => !prev)}
                                className={`p-2 rounded-full border transition-colors ${isFilterOpen || hasActiveFilter
                                    ? 'bg-neon/20 border-neon text-neon shadow-[0_0_15px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.4)]'
                                    : 'bg-black/50 border-neon/30 text-neon shadow-[0_0_10px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.2)] hover:bg-neon/20'
                                    }`}>
                                <Filter className="w-4 h-4" />
                            </button>

                            <AnimatePresence>
                                {isFilterOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.96 }}
                                        transition={{ duration: 0.18, ease: 'easeOut' }}
                                        className="absolute right-0 top-[calc(100%+10px)] w-[min(560px,calc(100vw-1.5rem))] bg-[#090909] border border-gray-800 z-[120] shadow-[0_24px_80px_rgba(0,0,0,0.9)]"
                                        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%)' }}
                                    >
                                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-black/60">
                                            <div className="text-[10px] tracking-[0.24em] uppercase text-gray-300 font-bold">Roadmap Filters</div>
                                            <button
                                                onClick={() => setIsFilterOpen(false)}
                                                className="p-1.5 rounded border border-gray-700 text-gray-500 hover:text-white hover:border-gray-500 transition-colors"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        <div className="p-4 space-y-4">
                                            <div>
                                                <p className="text-[9px] tracking-[0.3em] uppercase text-gray-500 mb-2 font-bold">Category</p>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setMainFilter('all');
                                                            setSubFilter('all');
                                                        }}
                                                        className={`px-3 py-2 border text-[10px] font-black tracking-widest uppercase transition-all ${mainFilter === 'all'
                                                            ? 'border-white/50 bg-white/10 text-white shadow-[0_0_10px_rgba(255,255,255,0.18)]'
                                                            : 'border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500'
                                                            }`}
                                                    >
                                                        All
                                                    </button>

                                                    {(Object.keys(FILTER_META) as Exclude<MainFilter, 'all'>[]).map((category) => {
                                                        const meta = FILTER_META[category];
                                                        const Icon = meta.icon;
                                                        const active = mainFilter === category;

                                                        return (
                                                            <button
                                                                key={category}
                                                                onClick={() => {
                                                                    setMainFilter(category);
                                                                    setSubFilter('all');
                                                                }}
                                                                className="px-3 py-2 border text-[10px] font-black tracking-widest uppercase transition-all flex items-center justify-center gap-1.5"
                                                                style={{
                                                                    borderColor: active ? meta.accent : 'rgb(55 65 81)',
                                                                    color: active ? meta.accent : 'rgb(156 163 175)',
                                                                    background: active ? `${meta.accent}1A` : 'rgba(0,0,0,0.2)',
                                                                    boxShadow: active ? `0 0 14px ${meta.accent}55` : 'none',
                                                                }}
                                                            >
                                                                <Icon className="w-3.5 h-3.5" />
                                                                {meta.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {mainFilter !== 'all' && (
                                                <div>
                                                    <p className="text-[9px] tracking-[0.3em] uppercase text-gray-500 mb-2 font-bold">Sub Category</p>
                                                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
                                                        <button
                                                            onClick={() => setSubFilter('all')}
                                                            className={`px-3 py-1.5 border text-[10px] font-bold tracking-[0.16em] uppercase transition-all flex items-center gap-1.5 ${subFilter === 'all'
                                                                ? 'border-[var(--color-neon)] text-[var(--color-neon)] bg-[var(--color-neon)]/10 shadow-[0_0_10px_rgba(var(--color-neon-rgb,57,255,20),0.25)]'
                                                                : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
                                                                }`}
                                                        >
                                                            <Filter className="w-3 h-3" />
                                                            All
                                                        </button>

                                                        {subCategoryOptions.map((sub) => {
                                                            const CurrentIcon = FILTER_META[mainFilter].icon;
                                                            const active = subFilter === sub;
                                                            return (
                                                                <button
                                                                    key={sub}
                                                                    onClick={() => setSubFilter(sub)}
                                                                    className={`px-3 py-1.5 border text-[10px] font-bold tracking-[0.16em] uppercase transition-all flex items-center gap-1.5 ${active
                                                                        ? 'border-[var(--color-neon)] text-[var(--color-neon)] bg-[var(--color-neon)]/10 shadow-[0_0_10px_rgba(var(--color-neon-rgb,57,255,20),0.25)]'
                                                                        : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
                                                                        }`}
                                                                >
                                                                    <CurrentIcon className="w-3 h-3" />
                                                                    {sub}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex justify-end gap-2 pt-1">
                                                <button
                                                    onClick={() => {
                                                        setMainFilter('all');
                                                        setSubFilter('all');
                                                    }}
                                                    className="px-3 py-1.5 border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white text-[10px] font-bold tracking-[0.14em] uppercase transition-colors"
                                                >
                                                    Reset
                                                </button>
                                                <button
                                                    onClick={() => setIsFilterOpen(false)}
                                                    className="px-3 py-1.5 border border-[var(--color-neon)]/50 text-[var(--color-neon)] bg-[var(--color-neon)]/10 hover:bg-[var(--color-neon)]/20 text-[10px] font-bold tracking-[0.14em] uppercase transition-colors"
                                                >
                                                    Apply
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                }
            />

            {/* Horizontal Timeline Container (Desktop only) */}
            <div
                ref={scrollContainerRef}
                onWheel={handleWheel}
                className="hidden md:flex absolute inset-0 z-10 items-center overflow-x-auto custom-scrollbar scroll-smooth"
            >
                <div
                    ref={timelineRef}
                    className="relative flex items-center px-[20vw] h-full transition-all duration-700 ease-in-out"
                    style={{ minWidth: `${dynamicWidthVW}vw` }}
                >
                    {/* S-Curve Track */}
                    <div className="absolute top-1/2 left-[20vw] right-[20vw] h-0 pointer-events-none z-0">
                        <svg className="absolute top-[-300px] left-0 w-full h-[600px] overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 600">
                            <defs>
                                <linearGradient id="trackGrad" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#004d00" />
                                    <stop offset="100%" stopColor="var(--color-neon)" />
                                </linearGradient>
                                <clipPath id="progressClip">
                                    <motion.rect x="0" y="0" height="600" initial={{ width: 0 }} animate={{ width: progress * 100 }} transition={{ duration: 2, ease: "easeOut" }} />
                                </clipPath>
                                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                    <feGaussianBlur stdDeviation="4" result="blur" />
                                    <feMerge>
                                        <feMergeNode in="blur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>
                            <path d={pathD} fill="none" stroke="#1f2937" strokeWidth="4" vectorEffect="non-scaling-stroke" />
                            <path d={pathD} fill="none" stroke="url(#trackGrad)" strokeWidth="6" vectorEffect="non-scaling-stroke" clipPath="url(#progressClip)" filter="url(#glow)" />
                        </svg>
                    </div>

                    {/* Events Nodes */}
                    {groupedTimelineEvents.map((group, index) => {
                        const eventProgress = groupedTimelineEvents.length > 1 ? index / (groupedTimelineEvents.length - 1) : 0;
                        const yOffset = getCurveY(eventProgress);
                        const isCompleted = nowTime > group.time;
                        const isNext = !isCompleted && (index === 0 || nowTime >= groupedTimelineEvents[index - 1].time);

                        return (
                            <div
                                key={`group-${group.time}`}
                                className="absolute z-10"
                                style={{
                                    left: mounted ? `calc(20vw + (100% - 40vw) * ${eventProgress})` : `calc(20vw + (100% - 40vw) * ${eventProgress})`,
                                    top: `calc(50% + ${yOffset}px)`
                                }}
                            >
                                {/* Base Node Status Indicator */}
                                <div className={`absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 bg-black flex items-center justify-center z-20
                  ${isCompleted ? 'border-[var(--color-neon)]/50 shadow-[0_0_10px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.5)] bg-[#002200]' : (isNext ? 'border-[var(--color-neon)] shadow-[0_0_15px_var(--color-neon)] animate-pulse' : 'border-gray-600')}
                `}>
                                    {isCompleted && <div className="w-2 h-2 rounded-full bg-[var(--color-neon)]/30" />}
                                    {isNext && <div className="w-2 h-2 rounded-full bg-[var(--color-neon)]" />}
                                </div>

                                {group.events.map((ev, gIndex) => {
                                    // Tree branch logic for concurrent events
                                    const isTop = index % 2 === 0;

                                    // Center if single, else fan out horizontally
                                    const totalAtNode = group.events.length;
                                    let xOffset = 0;

                                    if (totalAtNode > 1) {
                                        // Spread cards horizontally by 240px each
                                        const totalSpread = (totalAtNode - 1) * 240;
                                        xOffset = (gIndex * 240) - (totalSpread / 2);
                                    }

                                    const yDistance = isTop ? -80 : 80;
                                    const yCardPlacement = isTop ? 'bottom' : 'top';
                                    const absoluteYOffset = Math.abs(yDistance);

                                    return (
                                        <React.Fragment key={ev.id}>
                                            {ev.type === 'Planet' ? (
                                                <div
                                                    className="absolute z-[60]"
                                                    style={{ transform: 'translate(-50%, -50%)', marginLeft: `${xOffset}px`, width: '112px', height: '112px' }}
                                                >
                                                    <motion.div
                                                        initial={{ y: 0 }}
                                                        animate={{ y: [-10, 10, -10] }}
                                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                                        className="w-full h-full flex items-center justify-center cursor-pointer group"
                                                        onClick={() => {
                                                            setActiveDay((ev as any).targetDay);
                                                            visualProgress.set(0);
                                                            setTimeout(() => { if (scrollContainerRef.current) scrollContainerRef.current.scrollLeft = 0; }, 100);
                                                        }}
                                                    >
                                                        {/* Outer Hover Aura */}
                                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[var(--color-neon)]/0 rounded-full group-hover:bg-[var(--color-neon)]/20 blur-[40px] transition-all duration-700 pointer-events-none" />

                                                        {/* Planet Container */}
                                                        <div className="w-28 h-28 relative flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500 ease-out">
                                                            {/* Planetary Ring */}
                                                            <div className="absolute w-[180%] h-[180%] rounded-full border-y-2 border-x border-[var(--color-neon)]/30 border-t-[var(--color-neon)]/80 border-b-[var(--color-neon)]/80 transform rotate-[60deg] group-hover:rotate-[240deg] transition-all duration-[10s] ease-linear shadow-[0_0_20px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.5)] pointer-events-none z-20" />
                                                            <div className="absolute w-[160%] h-[160%] rounded-full border border-[var(--color-neon)]/20 transform -rotate-[45deg] group-hover:-rotate-[225deg] transition-all duration-[15s] ease-linear pointer-events-none z-20" />

                                                            {/* Planet Body */}
                                                            <div className="w-24 h-24 rounded-full shadow-[inset_-15px_-15px_30px_rgba(0,0,0,0.9),inset_5px_5px_15px_rgba(255,255,255,0.3),0_0_30px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.5)] overflow-hidden relative bg-black z-10 group-hover:shadow-[inset_-15px_-15px_30px_rgba(0,0,0,0.9),inset_5px_5px_15px_rgba(255,255,255,0.3),0_0_50px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.8)] transition-all duration-500">

                                                                {/* Atmospheric Glow */}
                                                                <div className="absolute inset-0 rounded-full shadow-[inset_0_0_20px_var(--color-neon)] opacity-70 z-10 pointer-events-none" />

                                                                {/* Surface Texture (Rotating) */}
                                                                <div className="absolute -inset-10 bg-[radial-gradient(circle_at_40%_40%,#a3ff99_0%,var(--color-neon)_30%,#003300_80%)] opacity-90"
                                                                    style={{ animation: 'spin 20s linear infinite' }}>
                                                                    {/* Tech/Grid Pattern overlaying the planet surface */}
                                                                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:6px_6px] mix-blend-overlay" />

                                                                    {/* "Craters" / Continents */}
                                                                    <div className="absolute top-6 left-8 w-12 h-8 bg-black/40 rounded-[40%_60%_70%_30%] blur-[2px]" />
                                                                    <div className="absolute bottom-8 right-12 w-16 h-10 bg-black/40 rounded-[60%_40%_30%_70%] blur-[2px]" />
                                                                    <div className="absolute top-16 right-6 w-8 h-6 bg-black/50 rounded-full blur-[1px]" />
                                                                </div>

                                                                {/* Planet Equator Scanline */}
                                                                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-[var(--color-neon)]/50 shadow-[0_0_10px_var(--color-neon)] transform -translate-y-1/2 z-20 group-hover:h-[2px] transition-all" />
                                                            </div>
                                                        </div>

                                                        {/* Interactive Label */}
                                                        <div className="absolute top-full mt-8 flex flex-col items-center opacity-80 group-hover:opacity-100 transition-opacity duration-300 w-max pointer-events-none">
                                                            <div className="px-6 py-2 border border-[var(--color-neon)]/50 bg-black/90 backdrop-blur-xl text-white font-black tracking-[0.3em] text-[12px] shadow-[0_0_20px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.5)] flex items-center gap-3 group-hover:border-[var(--color-neon)] group-hover:bg-[var(--color-neon)]/10 transition-colors pointer-events-auto"
                                                                style={{ clipPath: 'polygon(15px 0, 100% 0, calc(100% - 15px) 100%, 0 100%)' }}>
                                                                <span className="text-[var(--color-neon)] animate-pulse">●</span>
                                                                INITIATE DAY {(ev as any).targetDay}
                                                                <span className="text-[var(--color-neon)] animate-pulse">●</span>
                                                            </div>

                                                            {/* Subtitle */}
                                                            <div className="mt-3 text-[10px] text-[var(--color-neon)]/70 tracking-[0.2em] uppercase font-mono group-hover:text-[var(--color-neon)] transition-colors flex items-center gap-2">
                                                                <div className="w-4 h-[1px] bg-[var(--color-neon)]/50" />
                                                                {ev.description}
                                                                <div className="w-4 h-[1px] bg-[var(--color-neon)]/50" />
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                </div>
                                            ) : (
                                                <React.Fragment>
                                                    {/* Branch SVG Connector */}
                                                    <svg className="absolute top-0 left-0 overflow-visible pointer-events-none" style={{ zIndex: 0 }}>
                                                        <path
                                                            d={`M 0 0 Q 0 ${yDistance / 2} ${xOffset} ${yDistance}`}
                                                            fill="none"
                                                            stroke={isCompleted ? "rgba(var(--color-neon-rgb, 57, 255, 20), 0.3)" : isNext ? "rgba(var(--color-neon-rgb, 57, 255, 20), 0.8)" : "rgba(75,85,99,0.5)"}
                                                            strokeWidth="2"
                                                            strokeDasharray="4 4"
                                                            className={isNext ? "animate-pulse" : ""}
                                                        />
                                                        <circle cx={xOffset} cy={yDistance} r="3" fill={isCompleted ? "rgba(var(--color-neon-rgb, 57, 255, 20), 0.5)" : isNext ? "var(--color-neon)" : "#4b5563"} />
                                                    </svg>

                                                    { /* Holographic Mission Card */}
                                                    <div className={`absolute -translate-x-1/2 w-72 p-5 rounded-2xl border bg-black/40 backdrop-blur-xl transition-all duration-500 overflow-hidden group cursor-pointer
                            ${isCompleted ? 'shadow-[0_0_20px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.05)] border-[var(--color-neon)]/20 bg-black/60 opacity-80' : 'border-white/5 hover:bg-black/60'}
                            ${isNext ? `shadow-[0_0_40px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.3)] border-[var(--color-neon)]/80 bg-black/80 ${isTop ? '-translate-y-2' : 'translate-y-2'}` : ''}
                            ${isTop ? 'hover:-translate-y-2' : 'hover:translate-y-2'} hover:border-[var(--color-neon)]/50 hover:shadow-[0_0_20px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.15)]
                            `}
                                                        style={{
                                                            [yCardPlacement]: `${absoluteYOffset + 10}px`,
                                                            marginLeft: `${xOffset}px`,
                                                            zIndex: 10 + gIndex
                                                        }}
                                                        onClick={() => {
                                                            window.location.href = `/home/missions?id=${ev.id}`;
                                                        }}
                                                    >
                                                        {/* Holographic grid background */}
                                                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none rounded-2xl opacity-50"></div>

                                                        {/* Ambient Glow */}
                                                        {isNext && (
                                                            <div className="absolute -top-12 -right-12 w-32 h-32 bg-[var(--color-neon)] rounded-full blur-[50px] opacity-20 pointer-events-none group-hover:opacity-30 transition-opacity"></div>
                                                        )}

                                                        <div className="relative z-10 flex items-center justify-between mb-4">
                                                            <div className={`text-xs font-bold tracking-[0.2em] font-mono flex items-center gap-2 ${isCompleted ? 'text-[var(--color-neon)]/60' : isNext ? 'text-[var(--color-neon)]' : 'text-gray-400'}`}>
                                                                <span className={`w-2 h-2 rounded-full ${isNext ? 'bg-[var(--color-neon)] shadow-[0_0_5px_var(--color-neon)] animate-pulse' : isCompleted ? 'bg-[var(--color-neon)]/40' : 'bg-gray-500'}`}></span>
                                                                {ev.timeStr}
                                                            </div>
                                                            <div className={`text-[9px] px-3 py-1 rounded-full border-t border-b tracking-[0.2em] uppercase ${isCompleted ? 'border-[var(--color-neon)]/20 text-[var(--color-neon)]/50 bg-[var(--color-neon)]/5' : isNext ? 'border-[var(--color-neon)]/60 text-[var(--color-neon)] bg-[var(--color-neon)]/15' : 'border-transparent text-gray-500 bg-white/5'}`}>
                                                                {ev.type}
                                                            </div>
                                                        </div>

                                                        <div className={`relative z-10 text-lg font-bold tracking-widest uppercase mb-2 ${isNext ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : isCompleted ? 'text-gray-400' : 'text-gray-300 group-hover:text-white transition-colors'}`}>
                                                            {ev.title}
                                                        </div>

                                                        {/* Description removed as requested */}


                                                        {/* Added Details: Venue and Origin */}
                                                        <div className="relative z-10 flex flex-col gap-1 mt-3 pt-3 border-t border-white/5">
                                                            <div className="flex justify-between items-center text-[10px]">
                                                                <span className="text-gray-500 uppercase font-bold tracking-widest">Venue</span>
                                                                <span className="text-[var(--color-neon)] font-mono tracking-wider">{ev.venue}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-[10px]">
                                                                <span className="text-gray-500 uppercase font-bold tracking-widest">Origin</span>
                                                                <span className="text-white font-mono tracking-wider uppercase">{ev.origin}</span>
                                                            </div>
                                                        </div>

                                                        <div className="relative z-10 mt-4 text-[10px] text-[var(--color-neon)] tracking-[0.3em] uppercase flex items-center gap-3 opacity-80 group-hover:opacity-100 transition-opacity">
                                                            <span>Initiate Mission</span>
                                                            <div className="flex-1 h-[1px] bg-gradient-to-r from-[var(--color-neon)]/50 to-transparent"></div>
                                                        </div>
                                                    </div>
                                                </React.Fragment>
                                            )}
                                        </React.Fragment>
                                    );
                                })}

                            </div>
                        );
                    })}

                    {/* Dynamic Spaceship */}
                    <motion.div
                        className="absolute z-20 flex items-center justify-center pointer-events-none"
                        style={{
                            left: shipLeft,
                            top: shipTop,
                            rotate: shipRotate,
                            x: '-50%',
                            y: '-50%'
                        }}
                    >
                        {/* Engine trail */}
                        <div className="absolute right-[90%] w-32 h-6 bg-gradient-to-l from-[var(--color-neon)] via-blue-500 to-transparent opacity-80 blur-[8px] transform -translate-y-1/2 top-1/2 rounded-full animate-pulse" />

                        {/* Spaceship SVG Side View */}
                        <div className="relative w-24 h-12">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40" className="w-full h-full drop-shadow-[0_0_10px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.8)]">
                                <defs>
                                    <linearGradient id="shipGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#1a1a1a" />
                                        <stop offset="70%" stopColor="#333333" />
                                        <stop offset="100%" stopColor="#e6e6e6" />
                                    </linearGradient>
                                    <linearGradient id="cockpitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="var(--color-neon)" />
                                        <stop offset="100%" stopColor="#004d00" />
                                    </linearGradient>
                                </defs>

                                {/* Ship Body */}
                                <path d="M 10 20 Q 30 5, 80 15 Q 100 20, 80 25 Q 30 35, 10 20 Z" fill="url(#shipGrad)" stroke="var(--color-neon)" strokeWidth="1" />

                                {/* Cockpit Canopy */}
                                <path d="M 50 12 Q 65 10, 75 16 L 55 16 Z" fill="url(#cockpitGrad)" opacity="0.9" />

                                {/* Upper Wing/Fin */}
                                <path d="M 20 17 L 15 5 L 35 15 Z" fill="#222" stroke="var(--color-neon)" strokeWidth="0.5" />

                                {/* Lower Wing/Fin */}
                                <path d="M 20 23 L 15 35 L 35 25 Z" fill="#222" stroke="var(--color-neon)" strokeWidth="0.5" />

                                {/* Engine nozzle */}
                                <rect x="5" y="17" width="5" height="6" fill="#111" stroke="#555" strokeWidth="1" />

                                {/* Thruster Glow Details */}
                                <circle cx="8" cy="20" r="2" fill="#fff" />
                            </svg>

                        </div>
                    </motion.div>

                </div>
            </div >

            {/* Vertical Timeline Container (Mobile only) */}
            <div className="md:hidden absolute inset-0 z-10 flex flex-col items-center overflow-y-auto custom-scrollbar scroll-smooth pt-28 pb-32">
                <div
                    className="relative flex flex-col items-center w-full transition-all duration-700 ease-in-out"
                    style={{ minHeight: `${dynamicWidthVW * 1.5}vh` }}
                >
                    {/* S-Curve Track Vertical */}
                    <div className="absolute top-0 bottom-0 left-1/2 w-0 pointer-events-none z-0 transform -translate-x-1/2">
                        <svg className="absolute top-0 left-[-300px] w-[600px] h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 600 100">
                            <defs>
                                <linearGradient id="trackGradMobile" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#004d00" />
                                    <stop offset="100%" stopColor="var(--color-neon)" />
                                </linearGradient>
                                <clipPath id="progressClipMobile">
                                    <motion.rect x="0" y="0" width="600" initial={{ height: 0 }} animate={{ height: `${progress * 100}%` }} transition={{ duration: 2, ease: "easeOut" }} />
                                </clipPath>
                                <filter id="glowMobile" x="-20%" y="-20%" width="140%" height="140%">
                                    <feGaussianBlur stdDeviation="4" result="blur" />
                                    <feMerge>
                                        <feMergeNode in="blur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>
                            <path d={pathDMobile} fill="none" stroke="#1f2937" strokeWidth="4" vectorEffect="non-scaling-stroke" />
                            <path d={pathDMobile} fill="none" stroke="url(#trackGradMobile)" strokeWidth="6" vectorEffect="non-scaling-stroke" clipPath="url(#progressClipMobile)" filter="url(#glowMobile)" />
                        </svg>
                    </div>

                    {/* Events Nodes Vertical */}
                    {groupedTimelineEvents.map((group, index) => {
                        const eventProgress = groupedTimelineEvents.length > 1 ? index / (groupedTimelineEvents.length - 1) : 0;
                        const xOffset = getCurveYMobile(eventProgress);
                        const isCompleted = nowTime > group.time;
                        const isNext = !isCompleted && (index === 0 || nowTime >= groupedTimelineEvents[index - 1].time);

                        return (
                            <div
                                key={`mob-group-${group.time}`}
                                className="absolute z-10"
                                style={{
                                    top: mounted ? `calc(10vh + (100% - 20vh) * ${eventProgress})` : `calc(10vh + (100% - 20vh) * ${eventProgress})`,
                                    left: `calc(50% + ${xOffset}px)`
                                }}
                            >
                                {/* Base Node Status Indicator */}
                                <div className={`absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 bg-black flex items-center justify-center z-20
                  ${isCompleted ? 'border-[var(--color-neon)]/50 shadow-[0_0_10px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.5)] bg-[#002200]' : (isNext ? 'border-[var(--color-neon)] shadow-[0_0_15px_var(--color-neon)] animate-pulse' : 'border-gray-600')}
                `}>
                                    {isCompleted && <div className="w-2 h-2 rounded-full bg-[var(--color-neon)]/30" />}
                                    {isNext && <div className="w-2 h-2 rounded-full bg-[var(--color-neon)]" />}
                                </div>

                                {group.events.map((ev, gIndex) => {
                                    const isLeft = index % 2 === 0;
                                    const totalAtNode = group.events.length;
                                    let yEventOffset = 0;

                                    if (totalAtNode > 1) {
                                        const totalSpread = (totalAtNode - 1) * 200;
                                        yEventOffset = (gIndex * 200) - (totalSpread / 2);
                                    }

                                    // Hug the line very tightly to guarantee visibility of left side cards in mobile
                                    const xDistance = isLeft ? -35 : 35;
                                    const xCardPlacement = isLeft ? 'right' : 'left';
                                    const absoluteXOffset = Math.abs(xDistance);

                                    return (
                                        <React.Fragment key={`mob-${ev.id}`}>
                                            {ev.type === 'Planet' ? (
                                                <div
                                                    className="absolute z-[60]"
                                                    style={{ transform: 'translate(-50%, -50%)', marginTop: `${yEventOffset}px`, width: '100px', height: '100px' }}
                                                >
                                                    <motion.div
                                                        initial={{ x: 0 }}
                                                        animate={{ x: [-5, 5, -5] }}
                                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                                        className="w-full h-full flex items-center justify-center cursor-pointer group"
                                                        onClick={() => {
                                                            setActiveDay((ev as any).targetDay);
                                                            visualProgress.set(0);
                                                            setTimeout(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, 100);
                                                        }}
                                                    >
                                                        {/* Planet Container Mobile */}
                                                        <div className="w-20 h-20 relative flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500 ease-out">
                                                            <div className="absolute w-[180%] h-[180%] rounded-full border-y-2 border-x border-[var(--color-neon)]/30 border-t-[var(--color-neon)]/80 border-b-[var(--color-neon)]/80 transform rotate-[60deg] transition-all duration-[10s] ease-linear shadow-[0_0_20px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.5)] pointer-events-none z-20" />
                                                            <div className="w-16 h-16 rounded-full shadow-[inset_-10px_-10px_20px_rgba(0,0,0,0.9),inset_3px_3px_10px_rgba(255,255,255,0.3),0_0_20px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.5)] overflow-hidden relative bg-black z-10 transition-all duration-500">
                                                                <div className="absolute inset-0 rounded-full shadow-[inset_0_0_10px_var(--color-neon)] opacity-70 z-10 pointer-events-none" />
                                                                <div className="absolute -inset-10 bg-[radial-gradient(circle_at_40%_40%,#a3ff99_0%,var(--color-neon)_30%,#003300_80%)] opacity-90" style={{ animation: 'spin 20s linear infinite' }}>
                                                                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:4px_4px] mix-blend-overlay" />
                                                                </div>
                                                                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-[var(--color-neon)]/50 shadow-[0_0_10px_var(--color-neon)] transform -translate-y-1/2 z-20 transition-all" />
                                                            </div>
                                                        </div>

                                                        {/* Interactive Label Mobile */}
                                                        <div className="absolute top-full mt-4 flex flex-col items-center opacity-80 transition-opacity duration-300 w-max pointer-events-none">
                                                            <div className="px-4 py-1.5 border border-[var(--color-neon)]/50 bg-black/90 backdrop-blur-xl text-white font-black tracking-[0.2em] text-[10px] shadow-[0_0_10px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.5)] flex items-center gap-2 pointer-events-auto"
                                                                style={{ clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)' }}>
                                                                DAY {(ev as any).targetDay}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                </div>
                                            ) : (
                                                <React.Fragment>
                                                    {/* Branch SVG Connector Vertical */}
                                                    <svg className="absolute top-0 left-0 overflow-visible pointer-events-none" style={{ zIndex: 0 }}>
                                                        <path
                                                            d={`M 0 0 Q ${xDistance / 2} 0 ${xDistance} ${yEventOffset}`}
                                                            fill="none"
                                                            stroke={isCompleted ? "rgba(var(--color-neon-rgb, 57, 255, 20), 0.3)" : isNext ? "rgba(var(--color-neon-rgb, 57, 255, 20), 0.8)" : "rgba(75,85,99,0.5)"}
                                                            strokeWidth="2"
                                                            strokeDasharray="4 4"
                                                            className={isNext ? "animate-pulse" : ""}
                                                        />
                                                        <circle cx={xDistance} cy={yEventOffset} r="3" fill={isCompleted ? "rgba(var(--color-neon-rgb, 57, 255, 20), 0.5)" : isNext ? "var(--color-neon)" : "#4b5563"} />
                                                    </svg>

                                                    { /* Holographic Mission Card Vertical */}
                                                    <div className={`absolute -translate-y-1/2 w-40 p-3 rounded-xl border bg-black/40 backdrop-blur-xl transition-all duration-500 overflow-hidden group cursor-pointer
                            ${isCompleted ? 'shadow-[0_0_10px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.05)] border-[var(--color-neon)]/20 bg-black/60 opacity-80' : 'border-white/5 hover:bg-black/60'}
                            ${isNext ? `shadow-[0_0_20px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.3)] border-[var(--color-neon)]/80 bg-black/80 ${isLeft ? '-translate-x-2' : 'translate-x-2'}` : ''}
                            ${isLeft ? 'hover:-translate-x-2' : 'hover:translate-x-2'} hover:border-[var(--color-neon)]/50 hover:shadow-[0_0_10px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.15)]
                            `}
                                                        style={{
                                                            [xCardPlacement]: `${absoluteXOffset + 10}px`,
                                                            marginTop: `${yEventOffset}px`,
                                                            zIndex: 10 + gIndex
                                                        }}
                                                        onClick={() => {
                                                            window.location.href = `/home/missions?id=${ev.id}`;
                                                        }}
                                                    >
                                                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:8px_8px] pointer-events-none rounded-xl opacity-50"></div>
                                                        {isNext && (
                                                            <div className="absolute -top-6 -right-6 w-16 h-16 bg-[var(--color-neon)] rounded-full blur-[25px] opacity-20 pointer-events-none"></div>
                                                        )}

                                                        <div className="relative z-10 flex flex-col gap-1 mb-1">
                                                            <div className={`text-[8px] font-bold tracking-[0.2em] font-mono flex items-center gap-1.5 ${isCompleted ? 'text-[var(--color-neon)]/60' : isNext ? 'text-[var(--color-neon)]' : 'text-gray-400'}`}>
                                                                <span className={`w-1 h-1 rounded-full ${isNext ? 'bg-[var(--color-neon)] shadow-[0_0_4px_var(--color-neon)] animate-pulse' : isCompleted ? 'bg-[var(--color-neon)]/40' : 'bg-gray-500'}`}></span>
                                                                {ev.timeStr}
                                                            </div>
                                                            <div className={`text-[6px] self-start px-1.5 py-0.5 rounded-full border-t border-b tracking-[0.2em] uppercase ${isCompleted ? 'border-[var(--color-neon)]/20 text-[var(--color-neon)]/50 bg-[var(--color-neon)]/5' : isNext ? 'border-[var(--color-neon)]/60 text-[var(--color-neon)] bg-[var(--color-neon)]/15' : 'border-transparent text-gray-500 bg-white/5'}`}>
                                                                {ev.type}
                                                            </div>
                                                        </div>

                                                        <div className={`relative z-10 text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-0.5 leading-tight ${isNext ? 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]' : isCompleted ? 'text-gray-400' : 'text-gray-300'}`}>
                                                            {ev.title}
                                                        </div>

                                                        {/* Description removed as requested */}


                                                        {/* Mobile Details: Venue and Origin */}
                                                        <div className="relative z-10 flex flex-col gap-[2px] mt-2 pt-2 border-t border-white/5">
                                                            <div className="flex justify-between items-center text-[7px]">
                                                                <span className="text-gray-500 uppercase font-bold tracking-widest">Venue</span>
                                                                <span className="text-[var(--color-neon)] font-mono tracking-wider truncate max-w-[60px]">{ev.venue}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-[7px]">
                                                                <span className="text-gray-500 uppercase font-bold tracking-widest">Origin</span>
                                                                <span className="text-white font-mono tracking-wider uppercase truncate max-w-[60px]">{ev.origin}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </React.Fragment>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        );
                    })}

                    {/* Dynamic Spaceship Vertical */}
                    <motion.div
                        className="absolute z-20 flex items-center justify-center pointer-events-none"
                        style={{
                            top: shipTopVertical,
                            left: shipLeftVertical,
                            rotate: shipRotateVertical,
                            x: '-50%',
                            y: '-50%'
                        }}
                    >
                        {/* Engine trail Vertical */}
                        <div className="absolute right-[80%] w-20 h-4 bg-gradient-to-l from-[var(--color-neon)] via-blue-500 to-transparent opacity-80 blur-[6px] transform -translate-y-1/2 top-1/2 rounded-full animate-pulse" />

                        {/* Spaceship SVG Vertical */}
                        <div className="relative w-16 h-8">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40" className="w-full h-full drop-shadow-[0_0_10px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.8)]">
                                <defs>
                                    <linearGradient id="shipGradMob" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#1a1a1a" />
                                        <stop offset="70%" stopColor="#333333" />
                                        <stop offset="100%" stopColor="#e6e6e6" />
                                    </linearGradient>
                                    <linearGradient id="cockpitGradMob" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="var(--color-neon)" />
                                        <stop offset="100%" stopColor="#004d00" />
                                    </linearGradient>
                                </defs>
                                <path d="M 10 20 Q 30 5, 80 15 Q 100 20, 80 25 Q 30 35, 10 20 Z" fill="url(#shipGradMob)" stroke="var(--color-neon)" strokeWidth="1" />
                                <path d="M 50 12 Q 65 10, 75 16 L 55 16 Z" fill="url(#cockpitGradMob)" opacity="0.9" />
                                <path d="M 20 17 L 15 5 L 35 15 Z" fill="#222" stroke="var(--color-neon)" strokeWidth="0.5" />
                                <path d="M 20 23 L 15 35 L 35 25 Z" fill="#222" stroke="var(--color-neon)" strokeWidth="0.5" />
                                <rect x="5" y="17" width="5" height="6" fill="#111" stroke="#555" strokeWidth="1" />
                                <circle cx="8" cy="20" r="2" fill="#fff" />
                            </svg>
                        </div>
                    </motion.div>
                </div>
            </div >
            < div className="absolute bottom-10 right-10 pointer-events-none flex flex-col items-end gap-2 z-50" >
                {/* Top decorative bracket */}
                < div className="flex items-center gap-2 mb-1 opacity-70" >
                    <div className="text-[9px] text-[var(--color-neon)] tracking-[0.5em] font-mono uppercase">System Chrono</div>
                    <div className="h-[1px] w-16 bg-[var(--color-neon)]/50"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-neon)] animate-ping"></div>
                </div >

                <div className="flex items-center bg-[rgba(var(--color-neon-rgb,57,255,20),0.12)] backdrop-blur-2xl border border-[rgba(var(--color-neon-rgb,57,255,20),0.35)] p-3 shadow-[0_10px_40px_rgba(var(--color-neon-rgb,57,255,20),0.25)] relative overflow-hidden group"
                    style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}>

                    {/* Subtle scanline background */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none"></div>



                    {/* Time readout */}
                    <div className="flex flex-col z-10 relative">
                        {/* Time segments */}
                        <div className="flex items-baseline gap-1">
                            {mounted ? (
                                <>
                                    <div className="text-2xl font-black text-white tracking-wider font-mono drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]">
                                        {currentTime.toLocaleTimeString('en-US', { hour12: false, timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="text-sm font-bold text-[var(--color-neon)] tracking-wider font-mono pl-1">
                                        :{currentTime.getSeconds().toString().padStart(2, '0')}
                                    </div>
                                </>
                            ) : (
                                <div className="text-2xl font-black text-white tracking-wider font-mono drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]">
                                    00:00<span className="text-sm text-[var(--color-neon)] pl-1">:00</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3 mt-0.5">
                            <div className="flex gap-1.5">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-2 h-1 bg-[var(--color-neon)]/40 skew-x-[-30deg]"></div>
                                ))}
                            </div>
                            <div className="text-[8px] tracking-[0.4em] text-gray-500 font-bold uppercase leading-none mt-0.5">
                                T-Minus Zero
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom decorative bracket */}
                <div className="flex items-center gap-2 mt-1 opacity-50">
                    <div className="h-[2px] w-32 bg-gradient-to-r from-transparent to-[var(--color-neon)]/50"></div>
                    <div className="w-1.5 h-1.5 border border-[var(--color-neon)] rotate-45 bg-[var(--color-neon)]"></div>
                </div>
            </div >

        </main >
    );
}
