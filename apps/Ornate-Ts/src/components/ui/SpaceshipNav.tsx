'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface SpaceshipNavProps {
    accentColor?: string;
    scrollContainerRef?: React.RefObject<HTMLElement | null>;
    manualProgress?: number; // 0 to 1
}

export default function SpaceshipNav({ accentColor = 'var(--color-neon)', scrollContainerRef, manualProgress }: SpaceshipNavProps) {
    const [progress, setProgress] = useState(0);
    const [atEnd, setAtEnd] = useState(false);

    useEffect(() => {
        if (manualProgress !== undefined) {
            setProgress(manualProgress);
            setAtEnd(manualProgress > 0.97);
            return;
        }

        const getContainer = () =>
            scrollContainerRef?.current ?? document.documentElement;

        const handleScroll = () => {
            const el = getContainer();
            const scrollTop = el === document.documentElement ? window.scrollY : el.scrollTop;
            const scrollHeight = el.scrollHeight - el.clientHeight;
            const p = scrollHeight > 0 ? Math.min(scrollTop / scrollHeight, 1) : 0;
            setProgress(p);
            setAtEnd(p > 0.97);
        };

        const target = scrollContainerRef?.current ?? window;
        target.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => target.removeEventListener('scroll', handleScroll);
    }, [scrollContainerRef, manualProgress]);

    return (
        <div className="fixed top-0 left-0 right-0 z-[150] pointer-events-none">
            {/* Track bar */}
            <div className="relative h-[3px] w-full bg-white/5">
                {/* Progress fill */}
                <motion.div
                    className="absolute inset-y-0 left-0 h-full"
                    style={{
                        width: `${progress * 100}%`,
                        background: `linear-gradient(90deg, ${accentColor}40, ${accentColor})`,
                        boxShadow: `0 0 12px ${accentColor}80`,
                    }}
                />

                {/* Spaceship icon */}
                <motion.div
                    className="absolute top-1/2 -translate-y-1/2"
                    style={{ left: `calc(${progress * 100}% - 28px)` }}
                >
                    <div className="relative flex items-center justify-center" style={{ filter: `drop-shadow(0 0 8px ${accentColor})` }}>
                        {/* Simple SVG spaceship */}
                        <svg width="56" height="28" viewBox="0 0 56 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {/* Body */}
                            <path d="M4 14 L30 4 L50 14 L30 24 Z" fill={accentColor + '30'} stroke={accentColor} strokeWidth="1.5" />
                            {/* Cockpit */}
                            <ellipse cx="38" cy="14" rx="8" ry="5" fill={accentColor + '50'} stroke={accentColor} strokeWidth="1" />
                            {/* Engine boost */}
                            <path d="M4 14 L-6 10 M4 14 L-6 18" stroke={accentColor} strokeWidth="1" opacity="0.6" />
                            {/* Engine flame */}
                            <motion.path
                                d="M4 14 L-10 12 L-6 14 L-10 16 Z"
                                fill={accentColor}
                                animate={{ scaleX: [1, 1.4, 0.8, 1.2, 1], opacity: [0.9, 0.6, 1, 0.7, 0.9] }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                            />
                        </svg>

                        {/* Exhaust particles */}
                        {[...Array(3)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute rounded-full"
                                style={{
                                    width: 3 - i,
                                    height: 3 - i,
                                    backgroundColor: accentColor,
                                    right: 52 + i * 6,
                                    top: '50%',
                                    translateY: '-50%',
                                }}
                                animate={{ opacity: [0.8, 0, 0.8], scaleX: [1, 2, 1] }}
                                transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.1 }}
                            />
                        ))}
                    </div>
                </motion.div>

            </div>
        </div>
    );
}
