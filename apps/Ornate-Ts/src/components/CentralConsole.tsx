'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { PLANETS } from './planetary-system/planets';
import { PlanetHologramSphere, HologramLightBeam } from './planetary-system/CentralConsoleComponents';

export default function CentralConsole({ planetId, isHoloActive, onToggleHolo }: { planetId: string | null, isHoloActive: boolean, onToggleHolo: () => void }) {
    const [isHovered, setIsHovered] = useState(false);
    const [statsByPlanet, setStatsByPlanet] = useState<Record<string, { events: number; registrations: number }>>({});

    const planet = PLANETS.find(p => p.id === planetId);
    const primaryColor = planet ? planet.color : '#4b5563';

    useEffect(() => {
        let cancelled = false;
        const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
        const fetchStats = async () => {
            try {
                for (let attempt = 0; attempt < 3; attempt += 1) {
                    const response = await fetch('/api/home/hologram-stats');
                    if (response.ok) {
                        const data = await response.json();
                        if (cancelled) return;
                        if (data?.ok && data?.stats) setStatsByPlanet(data.stats);
                        return;
                    }
                    if (attempt < 2) await sleep(300 * (attempt + 1));
                }
            } catch { /* Fail silently */ }
        };
        fetchStats();
        return () => { cancelled = true; };
    }, []);

    const activeStats = planet ? statsByPlanet[planet.id] : undefined;
    const maxRegistrations = useMemo(() => {
        const values = Object.values(statsByPlanet).map((s) => s.registrations || 0);
        return values.length > 0 ? Math.max(...values, 1) : 1;
    }, [statsByPlanet]);
    
    const registrationFill = activeStats
        ? Math.max(8, Math.min(100, Math.round((activeStats.registrations / maxRegistrations) * 100)))
        : 8;

    return (
        <div className="absolute bottom-[30%] left-1/2 -translate-x-[51%] w-[60%] h-[150%] z-40 pointer-events-none flex flex-col items-center justify-end perspective-[1200px]">
            <AnimatePresence>
                {(isHoloActive && planet) && (
                    <motion.div
                        className="relative w-full h-full flex flex-col items-center justify-end"
                        initial={{ opacity: 0, filter: 'blur(20px)' }}
                        animate={{ opacity: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, filter: 'blur(20px)' }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                    >
                        <HologramLightBeam color={planet.glow} />
                        
                        <PlanetHologramSphere planet={planet} isHovered={isHovered} setIsHovered={setIsHovered} />

                        {/* TOOLTIPS */}
                        <AnimatePresence>
                            {isHovered && (
                                <>
                                    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className="absolute right-full top-[35%] -translate-y-1/2 mr-3 z-50 pointer-events-none flex items-center">
                                        <div className="bg-black/90 backdrop-blur-md border flex flex-col" style={{ borderColor: planet.color + '50', boxShadow: `0 0 24px ${planet.glow}60`, clipPath: 'polygon(0 0, 100% 0, 100% 80%, 88% 100%, 0 100%)' }}>
                                            <div className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: planet.color + '20', borderBottom: `1px solid ${planet.color}30` }}>
                                                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: planet.color, boxShadow: `0 0 6px ${planet.color}` }} />
                                                <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white">{planet.name}{planet.category === 'branches' ? ' Branch' : ''}</span>
                                            </div>
                                            <div className="px-3 py-2.5 flex flex-col gap-0.5 min-w-[140px]">
                                                <span className="text-[8px] font-bold tracking-[0.2em] uppercase" style={{ color: planet.color }}>Active Events</span>
                                                <span className="text-[26px] font-black font-mono leading-none text-white">{activeStats ? activeStats.events : '--'}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center flex-shrink-0"><div className="w-5 h-px" style={{ background: `linear-gradient(to right, ${planet.color}90, ${planet.color}20)` }} /><div className="w-2 h-2 rounded-full" style={{ backgroundColor: planet.color, boxShadow: `0 0 8px ${planet.color}` }} /></div>
                                    </motion.div>

                                    <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ delay: 0.07 }} className="absolute left-full top-[62%] -translate-y-1/2 ml-3 z-50 pointer-events-none flex items-center">
                                        <div className="flex items-center flex-shrink-0"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: planet.color, boxShadow: `0 0 8px ${planet.color}` }} /><div className="w-5 h-px" style={{ background: `linear-gradient(to left, ${planet.color}90, ${planet.color}20)` }} /></div>
                                        <div className="bg-black/90 backdrop-blur-md border flex flex-col" style={{ borderColor: planet.color + '50', boxShadow: `0 0 24px ${planet.glow}60`, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 12% 100%, 0 80%)' }}>
                                            <div className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: planet.color + '20', borderBottom: `1px solid ${planet.color}30` }}>
                                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: planet.color, opacity: 0.7 }} />
                                                <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white">Registrations</span>
                                            </div>
                                            <div className="px-3 py-2.5 flex flex-col gap-1.5 min-w-[140px]">
                                                <span className="text-[26px] font-black font-mono leading-none text-white">{activeStats ? activeStats.registrations.toLocaleString() : '--'}</span>
                                                <div className="w-full h-[3px] rounded-full overflow-hidden" style={{ backgroundColor: planet.color + '25' }}><motion.div className="h-full rounded-full" style={{ backgroundColor: planet.color, boxShadow: `0 0 6px ${planet.color}` }} initial={{ width: '0%' }} animate={{ width: `${registrationFill}%` }} transition={{ duration: 0.9 }} /></div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>

                        {/* ENTER BUTTON */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="absolute bottom-[-50px] sm:bottom-10 flex flex-col items-center gap-2 z-40 pointer-events-auto">
                            <Link href={planet.href || '/'} className="group relative flex items-center gap-3 px-7 py-3 font-black text-xs tracking-[0.3em] uppercase transition-all duration-300 overflow-hidden" style={{ border: `1px solid ${planet.color}70`, color: '#ffffff', boxShadow: `0 0 20px ${planet.glow}40`, }}>
                                <div className="absolute inset-0 bg-black/70" />
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `linear-gradient(90deg, ${planet.color}22, ${planet.color}12)` }} />
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 overflow-hidden pointer-events-none"><motion.div className="absolute left-0 top-0 w-full h-[1px]" style={{ backgroundColor: planet.color, boxShadow: `0 0 8px ${planet.color}` }} animate={{ y: [0, 44, 0] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }} /></div>
                                <div className="absolute left-0 top-0 w-[3px] h-full" style={{ background: `linear-gradient(to bottom, ${planet.color}, ${planet.color}30)` }} />
                                <span className="relative z-10 text-[11px] font-black tracking-[0.35em] text-white">ENTER {planet.name}</span>
                                <motion.span className="relative z-10 text-base leading-none" style={{ color: planet.color }} animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.1 }}>→</motion.span>
                            </Link>
                            <div className="flex items-center gap-2 mt-4 sm:mt-2"><div className="w-10 sm:w-12 h-px" style={{ backgroundColor: planet.color + '60' }} /><span className="whitespace-nowrap text-[11px] sm:text-[12px] tracking-[0.25em] uppercase font-bold text-white/70">Click to explore</span><div className="w-10 sm:w-12 h-px" style={{ backgroundColor: planet.color + '60' }} /></div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* TOGGLE SWITCH */}
            <div className="hidden sm:block absolute bottom-[-15px] left-1/2 -translate-x-1/2 z-50 pointer-events-auto filter drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]">
                <button onClick={onToggleHolo} className="relative group w-[150px] h-10 rounded-[50%] flex flex-col items-center justify-center transition-all active:scale-95 duration-200 bg-[#1A1A1A] hover:bg-[#252525] border-[2px] cursor-pointer" style={{ borderColor: isHoloActive ? primaryColor : '#4b5563', boxShadow: isHoloActive ? `0 0 12px ${primaryColor}, inset 0 0 8px ${primaryColor}` : 'none' }}>
                    <div className="relative z-10 flex items-center justify-center gap-3">
                        <div className={`w-2 h-2 rounded-full transition-all duration-300 ${isHoloActive ? '' : 'bg-red-900'}`} style={{ backgroundColor: isHoloActive ? primaryColor : undefined, boxShadow: isHoloActive ? `0 0 8px ${primaryColor}` : undefined }} />
                        <span className="text-[10px] font-bold tracking-widest transition-colors duration-300" style={{ color: isHoloActive ? primaryColor : '#4b5563', textShadow: isHoloActive ? `0 0 5px ${primaryColor}` : 'none' }}>{isHoloActive ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE'}</span>
                    </div>
                </button>
            </div>
        </div>
    );
}
