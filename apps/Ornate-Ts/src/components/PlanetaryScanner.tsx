'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { addAlpha } from '@/lib/utils';
import { PLANETS, Planet } from './planetary-system/planets';
export { PLANETS };
import { ScannerBackground, ScannerSweepBeam } from './planetary-system/ScannerComponents';

interface PlanetaryScannerProps {
    onSelectPlanet: (p: Planet) => void;
    selectedPlanetId: string | null;
    activeTab?: string;
}

export default function PlanetaryScanner({ onSelectPlanet, selectedPlanetId, activeTab = 'clubs' }: PlanetaryScannerProps) {
    const [sweepAngle, setSweepAngle] = useState(0);
    const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);
    const [scanned, setScanned] = useState(false);
    const [revealedCount, setRevealedCount] = useState(0);
    const startTimeRef = useRef<number | null>(null);
    const rafRef = useRef<number | null>(null);
    const SWEEP_DURATION = 4000;

    useEffect(() => {
        const tick = (timestamp: number) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp;
            const elapsed = (timestamp - startTimeRef.current) % SWEEP_DURATION;
            setSweepAngle((elapsed / SWEEP_DURATION) * 360);
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, []);

    const CENTER = 160;
    const ORBIT_R = 108;
    const TRAIL_DEG = 38;

    const displayPlanets = PLANETS.filter(p => p.category === 'global' || p.category === activeTab);

    useEffect(() => {
        setScanned(true);
        setRevealedCount(0);
        const total = displayPlanets.length;
        let count = 0;
        const interval = setInterval(() => {
            count += 1;
            setRevealedCount(count);
            if (count >= total) clearInterval(interval);
        }, 350);
        return () => clearInterval(interval);
    }, [activeTab, displayPlanets.length]);

    const planetsWithPos = displayPlanets.map((planet: Planet) => {
        const isSun = planet.id === 'sun';
        let x = CENTER, y = CENTER, angleCW = 0;

        if (!isSun) {
            const orbitingPlanets = displayPlanets.filter((p: Planet) => p.id !== 'sun');
            const orbitIndex = orbitingPlanets.findIndex((p: Planet) => p.id === planet.id);
            const N = orbitingPlanets.length;
            angleCW = (orbitIndex / N) * 360;
            const mathAngle = (orbitIndex / N) * 2 * Math.PI - Math.PI / 2;
            x = CENTER + ORBIT_R * Math.cos(mathAngle);
            y = CENTER + ORBIT_R * Math.sin(mathAngle);
        }

        const diff = isSun ? 360 : (sweepAngle - angleCW + 360) % 360;
        const glowIntensity = isSun ? 0 : (diff < TRAIL_DEG ? 1 - diff / TRAIL_DEG : 0);

        return { ...planet, x, y, angleCW, glowIntensity, isSun, isSelected: selectedPlanetId === planet.id };
    });

    return (
        <div className="relative w-full aspect-square max-w-[180px] z-50 pointer-events-auto origin-center">
            <ScannerBackground />
            <ScannerSweepBeam sweepAngle={sweepAngle} />

            <div className="absolute inset-[6px] rounded-full overflow-hidden pointer-events-none">
                <div className="relative w-full h-full">
                    {planetsWithPos.map((planet: any, planetIndex: number) => {
                        const { glowIntensity, isSun, isSelected, x, y } = planet;
                        if (!scanned || planetIndex >= revealedCount) return null;

                        const SIZE = 320;
                        const halfSize = isSun ? 28 : 19;

                        return (
                            <motion.div key={planet.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
                                {!isSun && glowIntensity > 0.05 && (
                                    <div className="absolute rounded-full pointer-events-none" style={{
                                        left: `${((x - halfSize - 6) / SIZE) * 100}%`,
                                        top: `${((y - halfSize - 6) / SIZE) * 100}%`,
                                        width: `${(((halfSize * 2) + 12) / SIZE) * 100}%`, height: `${(((halfSize * 2) + 12) / SIZE) * 100}%`,
                                        border: `1.5px solid ${planet.color}`,
                                        boxShadow: `0 0 ${Math.round(glowIntensity * 18)}px ${planet.color}, 0 0 ${Math.round(glowIntensity * 30)}px ${addAlpha(planet.color, '40')}`,
                                        opacity: glowIntensity,
                                    }} />
                                )}

                                <motion.button
                                    onClick={() => onSelectPlanet(planet)}
                                    onMouseEnter={() => setHoveredPlanet(planet.id)}
                                    onMouseLeave={() => setHoveredPlanet(null)}
                                    className="absolute flex items-center justify-center pointer-events-auto"
                                    style={{
                                        left: isSun ? '50%' : `${((x - halfSize) / SIZE) * 100}%`,
                                        top: isSun ? '50%' : `${((y - halfSize) / SIZE) * 100}%`,
                                        width: `${((halfSize * 2) / SIZE) * 100}%`, height: `${((halfSize * 2) / SIZE) * 100}%`,
                                        transform: isSun ? `translate(-50%, -50%) ${isSelected ? 'scale(1.3)' : hoveredPlanet === planet.id ? 'scale(1.18)' : 'scale(1)'}` : `${isSelected ? 'scale(1.3)' : hoveredPlanet === planet.id ? 'scale(1.18)' : 'scale(1)'}`,
                                        borderRadius: '50%', zIndex: isSun ? 40 : (isSelected ? 50 : 20),
                                        border: isSun ? 'none' : `1.5px solid ${isSelected ? planet.color : addAlpha(planet.color, '60')}`,
                                        backgroundColor: isSun ? 'transparent' : 'rgba(0,4,0,0.88)',
                                        boxShadow: isSelected ? `0 0 14px ${planet.color}, 0 0 4px ${planet.color}` : (glowIntensity > 0.1 ? `0 0 ${Math.round(glowIntensity * 12)}px ${planet.color}` : 'none'),
                                        transition: 'transform 0.2s ease, box-shadow 0.15s ease',
                                    }}
                                >
                                    {isSun ? <Image src={planet.texture} alt={planet.name} fill className="object-contain" sizes="56px" /> : <div className="w-full h-full rounded-full overflow-hidden" style={{ backgroundImage: `url(${planet.texture})`, backgroundSize: 'cover' }} />}
                                    {!isSun && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-1 h-1 rounded-full" style={{ backgroundColor: planet.color, boxShadow: `0 0 4px ${planet.color}`, opacity: isSelected ? 1 : 0.6 }} /></div>}
                                </motion.button>
                            </motion.div>
                        );
                    })}
                </div>

                <div className="absolute pointer-events-none" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                    <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 2.5, repeat: Infinity }} className="w-2 h-2 rounded-full bg-[var(--color-neon)]" style={{ boxShadow: '0 0 8px var(--color-neon)' }} />
                </div>
            </div>

            <div className="absolute inset-0 pointer-events-none z-[60]">
                {planetsWithPos.map((planet: any) => {
                    if ((hoveredPlanet !== planet.id && selectedPlanetId !== planet.id) || planet.id === 'sun') return null;
                    return (
                        <AnimatePresence key={planet.id}>
                            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="absolute" style={{ left: `${(planet.x / 320) * 100}%`, top: `${((planet.y + 19 + 6) / 320) * 100}%`, transform: 'translateX(-50%)' }}>
                                <div className="px-2.5 py-1 text-[11px] font-black tracking-[0.2em] uppercase whitespace-nowrap bg-black/90 border" style={{ color: '#fff', borderColor: planet.color, backgroundColor: addAlpha(planet.color, 'f0'), boxShadow: `0 0 15px ${addAlpha(planet.color, 'aa')}`, clipPath: 'polygon(5px 0%, 100% 0%, calc(100% - 5px) 100%, 0% 100%)' }}>
                                    {planet.name}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    );
                })}
            </div>

            {[
                { top: 0, left: 0, border: 'border-t-2 border-l-2', tr: '-translate-x-1 -translate-y-1' },
                { top: 0, right: 0, border: 'border-t-2 border-r-2', tr: 'translate-x-1 -translate-y-1' },
                { bottom: 0, left: 0, border: 'border-b-2 border-l-2', tr: '-translate-x-1 translate-y-1' },
                { bottom: 0, right: 0, border: 'border-b-2 border-r-2', tr: 'translate-x-1 translate-y-1' },
            ].map((c, i) => <div key={i} className={`absolute w-5 h-5 ${c.border} border-[var(--color-neon)]/60 ${c.tr}`} style={{ top: c.top, left: c.left, bottom: c.bottom, right: c.right }} />)}
        </div>
    );
}
