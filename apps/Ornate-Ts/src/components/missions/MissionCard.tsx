'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Users, Building2, MapPin, Calendar, Users2, ChevronRight, CreditCard, Unlock } from 'lucide-react';
import { addAlpha } from '@/lib/utils';

export type Mission = {
    id: string;
    title: string;
    description: string;
    category: 'BRANCHES' | 'CLUBS' | 'HHO';
    subCategory: string;
    eventCategory?: string;
    exp: number;
    deadline: string;
    slots: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
    isPaid: boolean;
    eventDate: string;
    eventDay: string;
    venue: string;
    registered: number;
    totalSlots: number;
    isTeam?: boolean;
    teamSizeMin?: number;
    teamSizeMax?: number;
    coordinators?: { name: string; phone: string | null }[];
};

const DIFF_CFG = null; // Removed difficulty config

export default function MissionCard({ mission, themeColor, onClick, isRegistered }: { mission: Mission; themeColor?: string; onClick?: () => void; isRegistered?: boolean }) {
    const CAT_CFG: Record<string, any> = {
        BRANCHES: { icon: <Building2 className="w-4 h-4" />, label: 'Branches', color: 'text-[var(--color-neon)]', bg: 'bg-[var(--color-neon)]/10', border: 'border-[var(--color-neon)]/40', glow: 'var(--color-neon)', image: '/images/events/branches.svg', scanColor: 'rgba(var(--color-neon-rgb, 57, 255, 20), 0.07)' },
        CLUBS: { icon: <Users className="w-4 h-4" />, label: 'Clubs', color: 'text-[var(--color-neon)]', bg: 'bg-[var(--color-neon)]/10', border: 'border-[var(--color-neon)]/40', glow: '#22d3ee', image: '/images/events/clubs.svg', scanColor: 'rgba(var(--color-neon-rgb, 57, 255, 20), 0.07)' },
        HHO: { icon: <Zap className="w-4 h-4" />, label: 'HHo', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/40', glow: '#fbbf24', image: '/images/events/hho.svg', scanColor: 'rgba(251,191,36,0.07)' },
    };

    const defaultCfg = CAT_CFG[mission.category] || CAT_CFG.EASY;
    const fillPct = Math.min(100, Math.round((mission.registered / mission.totalSlots) * 100));
    const subLabel = mission.subCategory.charAt(0) + mission.subCategory.slice(1).toLowerCase();

    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const glow = themeColor || defaultCfg.glow;
    const scanColor = themeColor ? addAlpha(themeColor, '11') : defaultCfg.scanColor;
    const isCustom = !!themeColor;

    if (!isMounted) {
        return <div className="h-[280px] w-full rounded-md bg-black/50 animate-pulse border border-white/5" />;
    }

    return (
        <div
            className="group cursor-pointer"
            style={{ filter: `drop-shadow(0 0 8px ${addAlpha(glow, '55')})` }}
            onClick={onClick}
        >
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="relative flex flex-col font-orbitron overflow-hidden"
                style={{
                    background: 'linear-gradient(160deg, #0a0a0f 0%, #070710 60%, #050508 100%)',
                    border: `1px solid ${addAlpha(glow, '90')}`,
                    clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 30px), calc(100% - 30px) 100%, 0 100%)',
                }}
            >
                {/* ── Animated top glow bar ── */}
                <div
                    className="absolute top-0 left-0 w-full h-[2px] z-20 transition-opacity duration-500 opacity-40 group-hover:opacity-100"
                    style={{ background: `linear-gradient(90deg, transparent 0%, ${glow} 40%, ${glow} 60%, transparent 100%)` }}
                />

                {/* ── Scanlines overlay ── */}
                <div
                    className="absolute inset-0 pointer-events-none z-10 opacity-[0.4]"
                    style={{
                        backgroundImage: `repeating-linear-gradient(0deg, ${scanColor} 0px, ${scanColor} 1px, transparent 1px, transparent 4px)`,
                    }}
                />

                {/* ── HUD corner marks ── */}
                {/* TL */}
                <div className="absolute top-0 left-0 w-5 h-5 z-20 pointer-events-none">
                    <div className="absolute top-0 left-0 w-5 h-[1.5px] opacity-60 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: glow }} />
                    <div className="absolute top-0 left-0 w-[1.5px] h-5 opacity-60 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: glow }} />
                </div>
                {/* BL */}
                <div className="absolute bottom-0 left-0 w-5 h-5 z-20 pointer-events-none">
                    <div className="absolute bottom-0 left-0 w-5 h-[1.5px] opacity-60 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: glow }} />
                    <div className="absolute bottom-0 left-0 w-[1.5px] h-5 opacity-60 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: glow }} />
                </div>
                {/* TR */}
                <div className="absolute top-0 right-0 w-5 h-5 z-20 pointer-events-none">
                    <div className="absolute top-0 right-0 w-5 h-[1.5px] opacity-60 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: glow }} />
                    <div className="absolute top-0 right-0 w-[1.5px] h-5 opacity-60 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: glow }} />
                </div>

                {/* ── Free / Paid badge — top-right corner ── */}
                <div className="absolute top-2.5 right-3 z-20">
                    <div
                        className={`flex items-center gap-1 px-2.5 py-1 text-[8px] font-black tracking-[0.25em] uppercase backdrop-blur-sm ${mission.isPaid
                            ? 'bg-amber-400/15 border border-amber-400/50 text-amber-400'
                            : 'bg-[var(--color-neon)]/10 border border-[var(--color-neon)]/40 text-[var(--color-neon)]'
                            }`}
                        style={{
                            clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)',
                            boxShadow: mission.isPaid ? '0 0 10px rgba(251,191,36,0.25)' : '0 0 10px rgba(var(--color-neon-rgb, 57, 255, 20), 0.2)',
                        }}
                    >
                        {mission.isPaid
                            ? <><CreditCard className="w-2.5 h-2.5" /> PAID</>
                            : <><Unlock className="w-2.5 h-2.5" /> FREE</>
                        }
                    </div>
                </div>

                {/* ── EVENT IMAGE BANNER ── */}
                <div className="relative w-full h-36 overflow-hidden shrink-0" suppressHydrationWarning>
                    <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, #040408 0%, ${addAlpha(glow, '22')} 100%)` }} />
                    <img
                        src={defaultCfg.image}
                        alt={mission.category}
                        className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:opacity-95 group-hover:scale-105 transition-all duration-700"
                    />
                    {/* Hard bottom fade */}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#060608] via-[#060608]/70 to-transparent" />

                    {/* Category badge over image */}
                    <div className="absolute bottom-3 left-4 flex items-center gap-2 z-10">
                        <div
                            className={`flex items-center gap-1.5 border px-2.5 py-1 backdrop-blur-sm ${isCustom ? '' : defaultCfg.bg} ${isCustom ? '' : defaultCfg.border}`}
                            style={{
                                clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)',
                                boxShadow: `0 0 12px ${addAlpha(glow, '44')}`,
                                ...(isCustom ? { backgroundColor: addAlpha(glow, '1a'), borderColor: addAlpha(glow, '66') } : {})
                            }}
                        >
                            <span className={isCustom ? '' : defaultCfg.color} style={isCustom ? { color: glow } : {}}>{defaultCfg.icon}</span>
                            <span className={`text-[9px] font-black tracking-[0.25em] uppercase ${isCustom ? '' : defaultCfg.color}`} style={isCustom ? { color: glow } : {}}>{defaultCfg.label}</span>
                        </div>
                    </div>

                </div>

                {/* ── CARD BODY ── */}
                <div className="flex flex-col flex-1 px-5 pt-3 pb-4 gap-3 relative z-10">

                    {/* Sub · Category breadcrumb — flat tags, no arrow */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                            className="text-[8px] font-bold tracking-[0.2em] text-white bg-white/5 border border-white/20 px-2 py-0.5 uppercase"
                            style={{ clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)' }}
                        >
                            {subLabel}
                        </span>
                        {mission.eventCategory && (
                            <span
                                className={`text-[8px] font-bold tracking-[0.2em] uppercase px-2 py-0.5 border ${isCustom ? '' : `${defaultCfg.bg} ${defaultCfg.color} ${defaultCfg.border}`}`}
                                style={{
                                    clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)',
                                    ...(isCustom ? { backgroundColor: addAlpha(glow, '1a'), color: glow, borderColor: addAlpha(glow, '66') } : {})
                                }}
                            >
                                {mission.eventCategory.charAt(0) + mission.eventCategory.slice(1).toLowerCase()}
                            </span>
                        )}
                        <span
                            className={`text-[8px] font-bold tracking-[0.2em] uppercase px-2 py-0.5 border ${mission.isTeam ? 'border-indigo-400/40 text-indigo-400 bg-indigo-400/5' : 'border-slate-400/40 text-slate-400 bg-slate-400/5'}`}
                            style={{ clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)' }}
                        >
                            {mission.isTeam ? `TEAM (${mission.teamSizeMin}${mission.teamSizeMax !== mission.teamSizeMin ? `-${mission.teamSizeMax}` : ''})` : 'SOLO'}
                        </span>
                    </div>

                    {/* Title */}
                    <h3
                        className={`text-base font-black tracking-wider uppercase leading-snug line-clamp-2 transition-colors duration-300 ${isCustom ? '' : defaultCfg.color}`}
                        style={{
                            textShadow: `0 0 20px ${addAlpha(glow, '00')}`,
                            filter: `drop-shadow(0 0 8px ${addAlpha(glow, 'aa')})`,
                            transition: 'text-shadow 0.3s, filter 0.3s',
                            ...(isCustom ? { color: glow } : {})
                        }}
                    >
                        {mission.title}
                    </h3>

                    <div className="flex-1" />
                    {/* ── HUD STATS GRID ── */}
                    <div
                        className="grid grid-cols-2 gap-px mt-1"
                        style={{ border: `1px solid ${addAlpha(glow, '18')}`, background: addAlpha(glow, '08') }}
                    >
                        {/* Date */}
                        <div className="flex flex-col gap-1 px-3 py-2 bg-black/40">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <Calendar className="w-3 h-3 text-white/60" />
                                <span className="text-[7.5px] text-white/60 tracking-[0.35em] uppercase font-bold">Date</span>
                            </div>
                            <span className="text-xs font-black text-white tracking-wide">{mission.eventDate}</span>
                            <span className={`text-[10px] font-bold tracking-widest ${isCustom ? '' : defaultCfg.color}`} style={isCustom ? { color: glow } : {}}>{mission.eventDay}</span>
                        </div>

                        {/* Venue */}
                        <div className="flex flex-col gap-1 px-3 py-2 bg-black/40">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <MapPin className="w-3 h-3 text-white/60" />
                                <span className="text-[7.5px] text-white/60 tracking-[0.35em] uppercase font-bold">Venue</span>
                            </div>
                            <span className="text-xs font-black text-white tracking-wide leading-snug line-clamp-2">{mission.venue}</span>
                        </div>
                    </div>

                    {/* ── REGISTRATION BAR ── */}
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <Users2 className="w-2.5 h-2.5 text-gray-700" />
                                <span className="text-[6.5px] text-white tracking-[0.35em] uppercase font-bold">Registered</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className={`text-[10px] font-black ${isCustom ? '' : defaultCfg.color}`} style={isCustom ? { color: glow } : {}}>{mission.registered}</span>
                                <span className="text-[9px] text-white font-bold">/ {mission.totalSlots}</span>
                                {fillPct >= 90 && (
                                    <span className="text-[7px] text-red-400 font-black tracking-widest animate-pulse ml-1">ALMOST FULL</span>
                                )}
                            </div>
                        </div>

                        {/* Segmented progress bar — HUD style */}
                        <div className="flex gap-[2px] h-2">
                            {Array.from({ length: 20 }).map((_, i) => {
                                const threshold = ((i + 1) / 20) * 100;
                                const filled = fillPct >= threshold;
                                return (
                                    <div
                                        key={i}
                                        className="flex-1 h-full transition-all duration-300"
                                        style={{
                                            background: filled ? glow : addAlpha('#ffffff', '08'),
                                            boxShadow: filled ? `0 0 4px ${addAlpha(glow, '80')}` : 'none',
                                            opacity: filled ? (0.4 + (i / 20) * 0.6) : 1,
                                        }}
                                    />
                                );
                            })}
                        </div>
                        <span className="text-[7.5px] text-white tracking-widest font-bold">{fillPct}% CAPACITY FILLED</span>
                    </div>
                </div>

                {/* ── HOVER CTA SLIDE-UP ── */}
                <div
                    className="absolute inset-x-0 bottom-0 flex items-center justify-between px-5 py-3-5 h-12 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-30"
                    style={{
                        background: `linear-gradient(90deg, ${addAlpha(glow, 'ee')}, ${addAlpha(glow, 'cc')})`,
                        clipPath: 'polygon(0 10px, 10px 0, 100% 0, 100% 100%, 0 100%)',
                    }}
                >
                    <span className="text-sm font-black tracking-[0.3em] uppercase text-black ml-1 pt-0.5">{isRegistered ? 'REGISTERED' : 'INITIATE MISSION'}</span>
                    <div className="flex items-center gap-1 text-black">
                        <ChevronRight className="w-5 h-5 mr-1" />
                    </div>
                </div>

                {/* ── Ambient inner glow on hover ── */}
                <div
                    className="absolute inset-0 pointer-events-none z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `radial-gradient(ellipse at 50% 0%, ${addAlpha(glow, '0d')} 0%, transparent 70%)` }}
                />
            </motion.div>
        </div>
    );
}
