'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UpdatesTicker({ accentColor = '#fbbf24' }: { accentColor?: string }) {
    const [updates, setUpdates] = useState<any[]>([]);

    useEffect(() => {
        // Fetch active announcements
        fetch('/api/scores')
            .then(res => {
                if (!res.ok) return [];
                return res.json().catch(() => []);
            })
            .then(data => {
                if (data && data.length > 0) {
                    setUpdates(data);
                }
            })
            .catch(err => console.error("Failed to fetch updates for ticker", err));
    }, []);

    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (updates.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % updates.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [updates.length]);

    if (updates.length === 0) return null;

    return (
        <div className="flex items-center gap-3 overflow-hidden" style={{ minWidth: '200px', maxWidth: '300px' }}>
            <span className="text-[7px] font-black tracking-[0.4em] uppercase" style={{ color: accentColor }}>LIVE</span>
            <div className="relative flex-1 h-[20px] overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="absolute inset-0 flex items-center"
                    >
                        <span className="text-[10px] sm:text-xs font-bold text-white truncate w-full tracking-widest font-orbitron uppercase">
                            {updates[currentIndex].team1} <span style={{ color: accentColor }}>{updates[currentIndex].score1 ?? 0}</span> - <span style={{ color: accentColor }}>{updates[currentIndex].score2 ?? 0}</span> {updates[currentIndex].team2}
                        </span>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
