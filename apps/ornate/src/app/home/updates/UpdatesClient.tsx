'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import {
    Radio, Clock, Zap, Target, Mic2, Trophy, Wifi,
    ChevronRight, Activity, AlertCircle, Bell, Search,
    Filter, Share2, Bookmark, ExternalLink, Cpu, Hash,
    Database, Network, ShieldCheck
} from 'lucide-react';
import SectorHeader from '@/components/layout/SectorHeader';
import { initPushNotifications } from '@/utils/pushNotifications';
import UpdatesEmptyState from '@/components/updates/UpdatesEmptyState';

// ─── Data Types ──────────────────────────────────────────────────────────────
export type UpdateAnnouncement = {
    id: string | number;
    category: string;
    priority: string;
    title: string;
    time: string;
    desc: string;
    tag: string;
    icon?: any;
    color?: string;
};

const CATEGORY_CONFIG: Record<string, { color: string; icon: any; glow: string }> = {
    SPORTS: { color: '#fbbf24', icon: Trophy, glow: 'rgba(251, 191, 36, 0.4)' },
    CULTURAL: { color: '#22d3ee', icon: Mic2, glow: 'rgba(34, 211, 238, 0.4)' },
    SYSTEM: { color: '#a3e635', icon: Zap, glow: 'rgba(163, 230, 53, 0.4)' },
    ALL: { color: '#818cf8', icon: Bell, glow: 'rgba(129, 140, 248, 0.4)' },
};

const TAG_COLORS: Record<string, string> = {
    LIVE: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5',
    URGENT: 'text-rose-400 border-rose-400/20 bg-rose-400/5',
    NEW: 'text-sky-400 border-sky-400/20 bg-sky-400/5',
    RESULT: 'text-amber-400 border-amber-400/20 bg-amber-400/5',
    RESCHEDULED: 'text-orange-400 border-orange-400/20 bg-orange-400/5',
};

// ─── Background Components ──────────────────────────────────────────────────
function DataStream() {
    const streamOpacities = [0.22, 0.26, 0.3, 0.34, 0.28, 0.32, 0.24, 0.36];
    const streamDurations = [8, 9.5, 11, 12.5, 10, 13.5, 9, 14];

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-20">
            {Array.from({ length: 8 }).map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute h-px bg-gradient-to-r from-transparent via-[var(--color-neon)] to-transparent"
                    style={{
                        top: `${15 + i * 12}%`,
                        left: '-100%',
                        width: '50%',
                        opacity: streamOpacities[i]
                    }}
                    animate={{ left: ['100%', '-100%'] }}
                    transition={{
                        duration: streamDurations[i],
                        repeat: Infinity,
                        ease: 'linear',
                        delay: i * 2
                    }}
                />
            ))}
        </div>
    );
}

function StarField() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        let raf: number;
        const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        resize();
        window.addEventListener('resize', resize);
        const stars = Array.from({ length: 150 }, () => ({
            x: Math.random() * canvas.width, y: Math.random() * canvas.height,
            r: Math.random() * 1 + 0.2, twinkle: Math.random() * Math.PI * 2, speed: 0.005 + Math.random() * 0.01,
        }));
        const loop = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (const s of stars) {
                s.twinkle += s.speed;
                const a = 0.1 + Math.abs(Math.sin(s.twinkle)) * 0.6;
                ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fill();
            }
            raf = requestAnimationFrame(loop);
        };
        loop();
        return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
    }, []);
    return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
}

// ─── Shared UI Components ──────────────────────────────────────────────────
function SignalBars() {
    return (
        <div className="flex items-end gap-[3px] h-4">
            {[3, 5, 7, 9, 11].map((h, i) => (
                <motion.div
                    key={i}
                    className="w-1 rounded-sm bg-[var(--color-neon)]"
                    style={{ height: h }}
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
                />
            ))}
        </div>
    );
}

// ─── Update Card ─────────────────────────────────────────────────────────────
function UpdateCard({ update, index }: { update: UpdateAnnouncement; index: number }) {
    const [expanded, setExpanded] = useState(false);
    const config = CATEGORY_CONFIG[update.category] || CATEGORY_CONFIG.SYSTEM;
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.5 }}
            layout
            className="group relative"
        >
            <div
                className="relative overflow-hidden p-[1px] transition-all duration-300 transform hover:-translate-y-1"
                style={{
                    clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)',
                }}
            >
                {/* Neon Border Gradient */}
                <div
                    className="absolute inset-0 opacity-10 group-hover:opacity-30 transition-opacity"
                    style={{ background: `linear-gradient(135deg, ${config.color}, transparent 50%, ${config.color})` }}
                />

                <div
                    onClick={() => setExpanded(!expanded)}
                    className="relative p-6 bg-[#0a0a12]/80 backdrop-blur-xl border border-white/5 cursor-pointer group-hover:bg-[#0a0a12]/90"
                    style={{ clipPath: 'inherit' }}
                >
                    {/* ID Badge */}
                    <div className="absolute top-4 right-6 flex items-center gap-1.5 opacity-20 group-hover:opacity-40 transition-opacity">
                        <Hash className="w-2.5 h-2.5" />
                        <span className="text-[8px] font-black tracking-[0.2em]">{update.id}</span>
                    </div>

                    <div className="flex items-start gap-6">
                        {/* Icon Container */}
                        <div className="flex-none">
                            <div
                                className="w-14 h-14 flex items-center justify-center border rounded-lg transition-transform duration-500 group-hover:rotate-[360deg]"
                                style={{
                                    borderColor: `${config.color}30`,
                                    background: `${config.color}08`,
                                    boxShadow: `inset 0 0 15px ${config.color}10`
                                }}
                            >
                                <Icon className="w-6 h-6" style={{ color: config.color }} />
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            {/* Metadata Header */}
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                <span className="text-[10px] font-black tracking-[0.3em] uppercase" style={{ color: config.color }}>
                                    {update.category}
                                </span>
                                <div className="w-px h-3 bg-white/10" />
                                <span className={`text-[8px] font-black tracking-[0.2em] px-2.5 py-0.5 border rounded-full uppercase ${TAG_COLORS[update.tag] || 'text-white/40 border-white/10'}`}>
                                    {update.tag}
                                </span>
                                <div className="ml-auto flex items-center gap-1.5 text-white/30">
                                    <Clock className="w-3 h-3" />
                                    <span className="text-[9px] font-bold tracking-widest uppercase">{update.time}</span>
                                </div>
                            </div>

                            {/* Title */}
                            <h3 className="text-xl font-black text-white tracking-wide uppercase group-hover:text-white/80 transition-colors">
                                {update.title}
                            </h3>

                            {/* Collapsed Description Snippet */}
                            <AnimatePresence initial={false}>
                                {!expanded && (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-white/40 text-xs mt-2 line-clamp-1 italic"
                                    >
                                        {update.desc}
                                    </motion.p>
                                )}
                            </AnimatePresence>

                            {/* Expanded Description */}
                            <AnimatePresence>
                                {expanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <p className="text-gray-400 text-sm leading-relaxed mt-4 pt-4 border-t border-white/5">
                                            {update.desc}
                                        </p>
                                        <div className="flex gap-4 mt-6">
                                            <button className="flex items-center gap-2 text-[10px] font-bold text-white/30 hover:text-[var(--color-neon)] transition-colors uppercase tracking-[0.2em]">
                                                <Share2 className="w-3 h-3" /> Share
                                            </button>
                                            <button className="flex items-center gap-2 text-[10px] font-bold text-white/30 hover:text-[var(--color-neon)] transition-colors uppercase tracking-[0.2em]">
                                                <Bookmark className="w-3 h-3" /> Archive
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Main Client Page ────────────────────────────────────────────────────────
export default function UpdatesClient({ announcements }: { announcements: UpdateAnnouncement[] }) {
    const { data: session, status } = useSession();
    const [filter, setFilter] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>('unsupported');
    const [isEnablingPush, setIsEnablingPush] = useState(false);
    const [pushMessage, setPushMessage] = useState<string>('');

    useEffect(() => {
        if (typeof window === 'undefined' || !("Notification" in window)) {
            setPermissionState('unsupported');
            return;
        }

        setPermissionState(Notification.permission);
    }, []);

    const enableNotifications = async () => {
        if (typeof window === 'undefined' || !("Notification" in window)) {
            setPushMessage('This browser does not support notifications.');
            return;
        }

        if (status !== 'authenticated' || !session?.user?.email) {
            setPushMessage('Sign in to enable notification updates.');
            return;
        }

        setIsEnablingPush(true);
        setPushMessage('');

        try {
            let permission = Notification.permission;
            if (permission === 'default') {
                permission = await Notification.requestPermission();
            }

            setPermissionState(permission);

            if (permission !== 'granted') {
                if (permission === 'denied') {
                    setPushMessage('Notifications are blocked for this site. Reset browser site permission to Allow.');
                } else {
                    setPushMessage('Notification prompt was dismissed. Click again and choose Allow.');
                }
                return;
            }

            const result = await initPushNotifications(session.user.email);
            if (result.subscribed) {
                setPushMessage('Notifications enabled successfully.');
            } else {
                setPushMessage(result.reason || 'Unable to enable notifications right now.');
            }
        } catch (error: unknown) {
            setPushMessage(error instanceof Error ? error.message : 'Failed to enable notifications.');
        } finally {
            setIsEnablingPush(false);
        }
    };

    const filtered = useMemo(() => {
        return announcements.filter(u => {
            const matchesFilter = filter === 'ALL' || u.category === filter;
            const matchesSearch = u.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.desc.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesFilter && matchesSearch;
        });
    }, [announcements, filter, searchQuery]);

    const permissionLabel = permissionState === 'granted'
        ? 'Granted'
        : permissionState === 'denied'
            ? 'Blocked'
            : permissionState === 'default'
                ? 'Not Set'
                : 'Unsupported';

    return (
        <main className="min-h-screen bg-[#030308] text-white font-orbitron selection:bg-[var(--color-neon)] selection:text-black">
            <StarField />
            <DataStream />

            {/* Global Glitch Scanline */}
            <div className="fixed inset-0 pointer-events-none z-50 opacity-10 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]" />

            <SectorHeader
                title="COMMAND FEED"
                subtitle="Sector 7G RELAY ACTIVE"
                rightElement={
                    <div className="flex items-center gap-8 pl-8 border-l border-white/10">
                        <div className="flex items-center gap-3">
                            <Radio className="w-4 h-4 text-[var(--color-neon)] animate-pulse" />
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-white tracking-[0.4em] uppercase leading-none">Transmission</span>
                                <span className="text-[7px] font-bold text-[var(--color-neon)] tracking-widest uppercase mt-1">Status: Stable</span>
                            </div>
                        </div>
                        <SignalBars />
                    </div>
                }
            />

            <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 pt-20 pb-32">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-12 items-start">

                    {/* Left Column: Content */}
                    <div className="space-y-12">
                        {/* Hero Section */}
                        <motion.section
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="relative"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-px w-20 bg-gradient-to-r from-transparent to-[var(--color-neon)]" />
                                <span className="text-[10px] font-black text-[var(--color-neon)] tracking-[0.6em] uppercase">SYSTEM BROADCAST</span>
                            </div>
                            <h1 className="text-6xl sm:text-8xl font-black leading-[0.9] uppercase tracking-tighter">
                                MISSION<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/50 to-white/10 group-hover:from-[var(--color-neon)]">UPDATES</span>
                            </h1>
                            <div className="mt-8 flex items-center gap-6">
                                <div className="flex flex-col">
                                    <span className="text-2xl font-black text-[var(--color-neon)]">{announcements.length}</span>
                                    <span className="text-[8px] font-bold text-white/30 tracking-[0.4em] uppercase">DATA PACKETS</span>
                                </div>
                                <div className="w-px h-10 bg-white/10" />
                                <div className="flex flex-col">
                                    <span className="text-2xl font-black text-[#22d3ee]">{announcements.filter(a => a.tag === 'LIVE').length}</span>
                                    <span className="text-[8px] font-bold text-white/30 tracking-[0.4em] uppercase">ACTIVE LINKS</span>
                                </div>
                                <div className="ml-auto flex flex-col items-end gap-2">
                                    <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-lg">
                                        <Activity className="w-4 h-4 text-emerald-400" />
                                        <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400">All Sectors Green</span>
                                    </div>
                                    <button
                                        onClick={enableNotifications}
                                        disabled={isEnablingPush || permissionState === 'unsupported'}
                                        className="px-4 py-2 border border-[#22d3ee]/40 bg-[#22d3ee]/10 text-[#22d3ee] text-[9px] font-black tracking-[0.25em] uppercase rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#22d3ee]/20"
                                    >
                                        {isEnablingPush ? 'Enabling...' : permissionState === 'granted' ? 'Resync Notifications' : 'Enable Notifications'}
                                    </button>
                                    <span className="text-[9px] tracking-wide text-white/60 max-w-[220px] text-right">
                                        Browser permission: {permissionLabel}
                                    </span>
                                    {permissionState === 'denied' && (
                                        <span className="text-[9px] tracking-wide text-rose-300/80 max-w-[240px] text-right">
                                            Open browser site settings for this URL and set Notifications to Allow.
                                        </span>
                                    )}
                                    {pushMessage && (
                                        <span className="text-[9px] tracking-wide text-white/60 max-w-[220px] text-right">{pushMessage}</span>
                                    )}
                                </div>
                            </div>
                        </motion.section>

                        {/* Search & Filter Bar */}
                        <div className="flex flex-col sm:flex-row gap-6 p-2 bg-white/[0.03] border border-white/5 backdrop-blur-md rounded-2xl">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-[var(--color-neon)] transition-colors" />
                                <input
                                    type="text"
                                    placeholder="SEARCH FREQUENCY..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-14 bg-transparent pl-14 pr-6 text-xs font-bold tracking-widest text-white placeholder-white/20 focus:outline-none"
                                />
                            </div>
                            <div className="flex gap-1 p-1 bg-black/40 rounded-xl overflow-x-auto no-scrollbar">
                                {['ALL', 'SPORTS', 'CULTURAL', 'SYSTEM'].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setFilter(cat)}
                                        className={`px-6 py-3 text-[9px] font-black tracking-[0.3em] uppercase rounded-lg transition-all ${filter === cat
                                                ? 'bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]'
                                                : 'text-white/30 hover:text-white/60 hover:bg-white/5'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Feed List */}
                        <div className="space-y-6">
                            <AnimatePresence mode="popLayout" initial={false}>
                                {filtered.length > 0 ? (
                                    filtered.map((u, i) => (
                                        <UpdateCard key={u.id} update={u} index={i} />
                                    ))
                                ) : (
                                    <div className="py-20">
                                        <UpdatesEmptyState 
                                            onReset={() => {
                                                setFilter('ALL');
                                                setSearchQuery('');
                                            }} 
                                        />
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Right Column: Sidebar */}
                    <aside className="sticky top-32 space-y-8 hidden lg:block">
                        {/* Empty Space filler for Layout if needed later */}
                    </aside>
                </div>
            </div>

            {/* Sticky Mobile Filter Trigger */}
            <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 lg:hidden text-center">
                <button className="px-8 py-4 bg-white text-black font-black text-[10px] tracking-[0.4em] uppercase rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-3 active:scale-95 transition-transform">
                    <Filter className="w-4 h-4" />
                    Filters
                </button>
            </div>
        </main>
    );
}
