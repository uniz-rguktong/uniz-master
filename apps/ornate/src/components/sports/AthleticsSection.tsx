'use client';

import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Zap, Wind, Users, Target, ChevronRight, X, Trophy } from 'lucide-react';
import { type SportData } from '@/lib/data/sports';

export const AthleticsSection = memo(({ sports }: { sports: SportData[] }) => {
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [selectedGender, setSelectedGender] = useState<'MALE' | 'FEMALE'>('MALE');
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        let mounted = true;
        const checkMobile = () => {
            if (mounted) setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => {
            mounted = false;
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    // Filter sports for athletics and map to display format
    const athleticsEvents = sports
        .filter(s => {
            const n = s.name.toUpperCase();
            if (n.includes('THROWBALL')) return false;
            return n.includes('ATHLETIC') || n.includes('SPRINT') || n.includes('RUN') || n.includes('RACE') || n.includes('JUMP') || n.includes('THROW') || n.includes('RELAY') || n.includes('DASH') || n.includes('100M') || n.includes('200M') || n.includes('400M') || n.includes('800M') || n.includes('1500M') || n.includes('SHOT PUT') || n.includes('DISCUS') || n.includes('JAVELIN');
        })
        .filter(s => {
            if (selectedGender === 'MALE') return s.gender === 'MALE' || s.gender === 'MIXED';
            return s.gender === 'FEMALE' || s.gender === 'MIXED';
        })
        .map(s => {
            let IconComponent = Activity;
            const n = s.name.toUpperCase();
            if (n.includes('SPRINT') || n.includes('100M')) IconComponent = Zap;
            else if (n.includes('DASH')) IconComponent = Wind;
            else if (n.includes('RELAY')) IconComponent = Users;
            else if (n.includes('SHOT') || n.includes('THROW') || n.includes('JUMP')) IconComponent = Target;

            const rawPositions = s.winnerAnnouncement?.positions;
            let positions: any[] = [];
            const parseWinner = (val: any, pos: number) => {
                if (!val) return null;
                if (typeof val === 'string') return { position: pos, name: val, branch: 'N/A' };
                return {
                    position: pos,
                    name: val.name || val.studentName || val.playerName || 'Unknown',
                    branch: val.branch || val.dept || val.department || 'N/A'
                };
            };

            if (Array.isArray(rawPositions)) {
                positions = rawPositions.map((p, i) => parseWinner(p, p.position || i + 1));
            } else if (rawPositions && typeof rawPositions === 'object') {
                const rp = rawPositions as any;
                positions = [
                    parseWinner(rp.first || rp['1'] || rp['1st'], 1),
                    parseWinner(rp.second || rp['2'] || rp['2nd'], 2),
                    parseWinner(rp.third || rp['3'] || rp['3rd'], 3)
                ].filter(Boolean);
            }

            const winnersList = (positions.length > 0)
                ? [...positions]
                    .sort((a, b) => (Number(a.position) || 99) - (Number(b.position) || 99))
                    .slice(0, 3)
                    .map(w => `${w.name} (${w.branch})`)
                    .join(' | ')
                : null;

            const topWinner = (positions.length > 0)
                ? positions.find(w => Number(w.position) === 1)
                : null;

            return {
                title: n,
                venue: 'MAIN TRACK',
                record: topWinner ? `${topWinner.name} (${topWinner.branch})` : 'NOT ANNOUNCED',
                icon: <IconComponent className="w-6 h-6 text-amber-400" />,
                stats: winnersList || `NOT ANNOUNCED`,
                category: s.category,
                gender: s.gender,
                desc: s.description || (winnersList ? `Congratulations to the winners of the ${s.name} event.` : `Exciting competition in the ${s.name} event.`),
                image: s.bannerUrl || 'https://images.unsplash.com/photo-1517649763962-0c623066013b',
                winnerData: positions
            };
        });

    if (athleticsEvents.length === 0) return null;

    return (
        <section className="relative z-10 px-4 sm:px-10 pb-16 sm:pb-40">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex items-center gap-6 mb-12 sm:mb-16 px-6 sm:px-10 mt-12"
            >
                <div className="w-3 h-10 bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.4)]" />
                <div className="flex flex-col items-start">
                    <h2 className="text-4xl sm:text-5xl font-black tracking-[0.1em] text-white uppercase italic">
                        ATHLETICS <span className="text-amber-400">SHOWCASE</span>
                    </h2>
                    <p className="text-[10px] text-white/40 tracking-[0.3em] uppercase mt-1 font-bold">
                        Track & Field Protocol Analysis
                    </p>
                </div>
            </motion.div>
            {/* Category Buttons */}
            <div className="flex justify-center gap-4 mb-12 w-full px-4">
                <button
                    onClick={() => setSelectedGender('MALE')}
                    className={`px-8 py-3 rounded-full font-black tracking-widest uppercase transition-all duration-300 border ${selectedGender === 'MALE' ? 'bg-amber-400 text-[#050505] border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]' : 'bg-transparent text-white/60 border-white/20 hover:border-amber-400/50 hover:text-amber-400'}`}
                >
                    BOYS
                </button>
                <button
                    onClick={() => setSelectedGender('FEMALE')}
                    className={`px-8 py-3 rounded-full font-black tracking-widest uppercase transition-all duration-300 border ${selectedGender === 'FEMALE' ? 'bg-amber-400 text-[#050505] border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]' : 'bg-transparent text-white/60 border-white/20 hover:border-amber-400/50 hover:text-amber-400'}`}
                >
                    GIRLS
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-[1400px] w-full px-4 mx-auto">
                {athleticsEvents.map((event, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -10, scale: 1.05 }}
                        transition={{ delay: i * 0.1, duration: 0.6 }}
                        className="group relative perspective-1000 cursor-pointer min-h-[500px]"
                        onClick={() => setSelectedEvent(event)}
                    >
                        {/* Glow Behind */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 blur-[30px] opacity-10 group-hover:opacity-20 transition-opacity duration-700 z-0" />

                        {/* Cut corner border loop */}
                        <div className="absolute -inset-[1px] bg-[linear-gradient(45deg,#fbbf24,#f97316,#fbbf24)] bg-[length:400%_400%] animate-[gradient:5s_ease_infinite] z-0 opacity-15 group-hover:opacity-40 transition-opacity duration-500" />

                        <div className="relative h-full bg-[#050505] p-[2px] flex flex-col z-10 transition-all duration-500 shadow-[0_40px_80px_rgba(0,0,0,0.8)] flex-1 overflow-hidden">
                            <div className="relative h-full bg-[#0A0A10] flex flex-col flex-1">

                                {/* Top Image Cover */}
                                <div className="relative w-full h-[240px] overflow-hidden bg-[#0A0A15]">
                                    <img
                                        src={event.image}
                                        alt={event.title}
                                        className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-1000 saturate-[1.2]"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A10] via-transparent to-black/40" />

                                    {/* Record Ribbon */}
                                    <div className="absolute -right-16 top-10 rotate-45 bg-amber-400/90 px-24 py-1.5 shadow-[0_0_20px_rgba(251,191,36,0.3)] z-20">
                                        <span className="text-[10px] font-black text-black tracking-widest uppercase">{event.record}</span>
                                    </div>

                                    {/* Tactical Overlay */}
                                    <div className="absolute bottom-4 left-6 flex items-center gap-3">
                                        <div className="p-2.5 rounded-sm bg-black/60 backdrop-blur-md border border-amber-400/30 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                                            {event.icon}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[7px] text-amber-400/60 font-black tracking-[0.4em] uppercase">Venue</span>
                                            <span className="text-[10px] text-white font-black tracking-widest uppercase">{event.venue}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative p-8 flex flex-col flex-1 bg-gradient-to-b from-transparent to-white/[0.02]">
                                    {/* Background invisible icon */}
                                    <div className="absolute -bottom-10 -right-10 opacity-[0.01] group-hover:opacity-[0.02] transition-opacity duration-700 pointer-events-none transform scale-[10] z-0">
                                        {event.icon}
                                    </div>

                                    <div className="relative z-10 flex flex-col h-full uppercase font-black">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="flex gap-1">
                                                {[1, 2, 3].map(d => <div key={d} className="w-1 h-3 bg-amber-400/40 rounded-full" />)}
                                            </div>
                                            <span className="text-[7px] text-amber-400/60 tracking-[0.5em]">EVENT ACTIVE</span>
                                        </div>

                                        <h3 className="text-3xl font-black text-white tracking-tighter leading-[0.9] mb-4 group-hover:text-amber-400 transition-colors duration-500 italic uppercase font-orbitron">
                                            {event.title}
                                        </h3>

                                        <p className="text-[18px] text-white/60 leading-relaxed tracking-[0.15em] mb-6 flex-grow font-bold opacity-80 group-hover:opacity-100 transition-opacity normal-case line-clamp-2">
                                            {event.desc}
                                        </p>

                                        <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[7px] text-amber-400/80 tracking-[0.4em] font-black uppercase">{event.category}</span>
                                                    <span className="w-1 h-1 rounded-full bg-white/20" />
                                                    <span className="text-[7px] text-white/40 tracking-[0.4em] font-black uppercase">{event.gender}</span>
                                                </div>
                                                <span className="text-[10px] text-white tracking-[0.2em] font-black">{event.stats}</span>
                                            </div>
                                            <motion.div
                                                whileHover={{ x: 5 }}
                                                className="p-2 border border-amber-400/30 hover:bg-amber-400 hover:text-black transition-all"
                                                style={{ clipPath: 'polygon(30% 0, 100% 0, 100% 70%, 70% 100%, 0 100%, 0 30%)' }}
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </motion.div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {selectedEvent && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedEvent(null)}
                            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                        />

                        <motion.div
                            layoutId={`event-${selectedEvent.title}`}
                            initial={{ scale: 0.9, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 50 }}
                            className="relative w-full max-w-6xl max-h-[90vh] p-6 sm:p-10 bg-[#05050a] border border-white/10 rounded-2xl sm:rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,1)] overflow-y-auto no-scrollbar flex flex-col items-center"
                        >
                            {/* Space theme background */}
                            <div className="absolute inset-0 z-0 overflow-hidden rounded-[3rem] pointer-events-none">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-400/5 blur-[120px] rounded-full" />
                                <div className="absolute top-0 left-0 w-full h-full opacity-30"
                                    style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }}
                                />
                            </div>

                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="absolute top-4 right-4 sm:top-8 sm:right-8 p-3 bg-white/10 border border-white/20 rounded-full hover:bg-white/20 transition-all z-[110] text-white shadow-lg active:scale-95"
                                aria-label="Close"
                            >
                                <X size={20} className="sm:w-6 sm:h-6" />
                            </button>

                            <div className="relative z-10">
                                <div className="text-center mb-8 sm:mb-16 w-full">
                                    <span className="text-[10px] text-amber-400 tracking-[0.8em] font-black uppercase mb-3 block">Event Results · Final Standings</span>
                                    <h2 className="text-3xl sm:text-5xl font-black text-white italic tracking-tighter uppercase">{selectedEvent.title}</h2>
                                    <div className="flex items-center justify-center gap-4 mt-4 sm:mt-6">
                                        <div className="h-px w-12 bg-amber-400/20" />
                                        <span className="text-[10px] text-white/40 tracking-[0.4em] font-bold uppercase">{selectedEvent.venue}</span>
                                        <div className="h-px w-12 bg-amber-400/20" />
                                    </div>
                                </div>

                                {(() => {
                                    const winnerData = Array.isArray(selectedEvent.winnerData) ? selectedEvent.winnerData : [];
                                    const getWinner = (pos: number) => {
                                        const w = winnerData.find((w: any) => Number(w.position) === pos);
                                        return w ? `${w.name} (${w.branch})` : 'NOT ANNOUNCED';
                                    };

                                    return (
                                        <div className={`relative h-[300px] sm:h-[500px] mt-2 sm:mt-10 flex items-center justify-center origin-center w-full max-w-6xl mx-auto transition-all ${isMobile ? 'scale-[0.5] sm:scale-100' : 'scale-75'}`}>
                                            {/* 1st Place - CENTER TOP */}
                                            <motion.div
                                                initial={{ opacity: 0, scale: 1.2, y: 50 }}
                                                animate={{ opacity: 1, scale: 1.15, y: 0, x: 0 }}
                                                transition={{ delay: 0.6, type: "spring", stiffness: 100 }}
                                                className="absolute z-30 shadow-[0_30px_100px_rgba(0,0,0,0.8)]"
                                            >
                                                <WinnerCard
                                                    rank="1ST"
                                                    name={getWinner(1)}
                                                    color="#fbbf24"
                                                    tag="WINNER"
                                                    isMain
                                                />
                                            </motion.div>

                                            {/* 2nd Place - RIGHT FAN */}
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.8, x: 50 }}
                                                animate={{ opacity: 1, scale: 0.98, x: isMobile ? 130 : 220, rotate: 12, y: isMobile ? 30 : 40 }}
                                                transition={{ delay: 0.4, type: "spring", stiffness: 80, damping: 15 }}
                                                className="absolute z-20"
                                            >
                                                <WinnerCard
                                                    rank="2ND"
                                                    name={getWinner(2)}
                                                    color="#e2e8f0"
                                                    tag="SILVER"
                                                />
                                            </motion.div>

                                            {/* 3rd Place - LEFT FAN */}
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.8, x: -50 }}
                                                animate={{ opacity: 1, scale: 0.98, x: isMobile ? -130 : -220, rotate: -12, y: isMobile ? 30 : 40 }}
                                                transition={{ delay: 0.4, type: "spring", stiffness: 80, damping: 15 }}
                                                className="absolute z-10"
                                            >
                                                <WinnerCard
                                                    rank="3RD"
                                                    name={getWinner(3)}
                                                    color="#94a3b8"
                                                    tag="BRONZE"
                                                />
                                            </motion.div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .perspective-1000 {
                    perspective: 1000px;
                }
                .text-glow {
                    text-shadow: 0 0 15px rgba(251, 191, 36, 0.6);
                    color: #fbbf24 !important;
                }
            `}</style>
        </section >
    );
});

AthleticsSection.displayName = 'AthleticsSection';

function WinnerCard({ rank, name, color, tag, isMain }: any) {
    return (
        <div className={`relative group transition-all duration-700 w-full max-w-[370px] mx-auto`}>
            {/* Ambient Intense Background Glow */}
            <div className={`absolute -inset-10 blur-[100px] opacity-0 group-hover:opacity-40 transition-opacity duration-1000 animate-pulse`} style={{ backgroundColor: color }} />

            <div className={`absolute -inset-[3px] bg-white opacity-0 group-hover:opacity-100 z-0 transition-opacity duration-500`} style={{ clipPath: 'polygon(15% 0, 100% 0, 100% 85%, 85% 100%, 0 100%, 0 15%)', backgroundColor: color }} />

            <div
                className={`relative bg-[#05050A] p-[2px] flex flex-col items-center transition-all duration-500 shadow-[0_40px_80px_rgba(0,0,0,0.8)] z-10 ${isMain ? 'h-[400px] sm:h-[450px] w-full sm:w-[280px]' : 'h-[350px] sm:h-[400px] w-full sm:w-[260px]'}`}
                style={{ clipPath: 'polygon(15% 0, 100% 0, 100% 85%, 85% 100%, 0 100%, 0 15%)', boxShadow: isMain ? `0 20px 100px -20px ${color}30` : 'none' }}
            >
                <div className="relative h-full w-full bg-[#101018] p-6 sm:p-8 flex flex-col items-center overflow-hidden" style={{ clipPath: 'polygon(15% 0, 100% 0, 100% 85%, 85% 100%, 0 100%, 0 15%)' }}>
                    {/* Holographic Header Scanline */}
                    <div className="absolute top-0 left-0 right-0 h-[80px] bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />

                    {/* Rank Badge */}
                    <div
                        className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 relative group-hover:scale-110 transition-transform duration-500"
                        style={{ background: `linear-gradient(135deg, ${color}20, ${color}40)`, border: `1px solid ${color}40` }}
                    >
                        <div className="absolute inset-0 blur-xl opacity-50 rounded-3xl" style={{ backgroundColor: color }} />
                        <Trophy className="w-12 h-12 relative z-10" style={{ color }} />
                    </div>

                    {/* Main Details */}
                    <div className="text-center w-full">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-4">
                            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
                            <span className="text-[8px] font-black tracking-[0.3em] text-white/60 uppercase">{tag}</span>
                        </div>

                        <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-1 drop-shadow-lg font-orbitron">{rank}</h2>
                        <p className="text-xs font-bold text-white tracking-[0.2em] uppercase mb-6">{name}</p>

                        {/* Level Matrix */}
                        <div className="w-full mb-8 pt-6 border-t border-white/5 flex flex-col items-center">
                            <span className="text-[7px] text-white/30 tracking-widest block mb-2">POWER LEVEL</span>
                            <div className="flex gap-1.5 justify-center">
                                {[1, 2, 3, 4, 5, 6, 7].map(i => <div key={i} className={`w-1.5 h-4 rounded-full ${i <= 6 ? '' : 'opacity-20'}`} style={{ backgroundColor: color, boxShadow: i <= 6 ? `0 0 10px ${color}` : 'none' }} />)}
                            </div>
                        </div>

                        {/* Mission Gauge */}
                        <div className="w-full space-y-2 mb-8">
                            <div className="flex justify-between text-[7px] text-white/30 tracking-widest uppercase">
                                <span>Performance</span>
                                <span>98.4%</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-[2px]">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '98.4%' }}
                                    transition={{ duration: 2 }}
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer HUD (Inspired by reference image) */}
                    <div className="mt-auto w-full pt-6 border-t border-white/10 flex items-center justify-between">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-white/40 backdrop-blur-md">U{i}</div>
                            ))}
                        </div>

                        <div className="flex flex-col items-end">
                            <span className="text-[7px] text-white/20 tracking-widest uppercase mb-1">Team Lead</span>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400/20 to-transparent border border-white/20 p-1">
                                    <div className="w-full h-full rounded-full bg-white/10 flex items-center justify-center">
                                        <Activity size={12} className="text-white/40" />
                                    </div>
                                </div>
                                <span className="text-[10px] font-black text-white tracking-widest">UNIT-01</span>
                            </div>
                        </div>
                    </div>

                    {/* Animated Scanning Beam */}
                    <motion.div
                        animate={{ top: ['-10%', '110%'] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent z-30 pointer-events-none"
                    />
                </div>
            </div>
        </div>
    );
}
