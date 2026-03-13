'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import Link from 'next/link';
import { Rocket, Calendar, Store, Music, Globe, Zap, LayoutGrid, ChevronLeft, Home as HomeIcon, Info, Heart, Image as ImageIcon, User, Code, Phone, Shield } from 'lucide-react';

/* ─────────── Config ─────────── */
const PANEL_W = 90;     // px — decreased width for mobile efficiency (was 125)
const SWIPE_OPEN_PX = 15;    // px — horizontal drag to trigger open
const SWIPE_CLOSE_PX = 50;    // px — panel drag rightward to close
const AUTO_SLEEP_MS = 10000; // ms — auto-close after inactivity
const SIDEBAR_ACCENT = '#00f3ff'; // Fixed cyan color for the sidebar edge

const NAV_ITEMS = [
    { label: 'MISSIONS', href: '/home/missions', icon: Rocket, color: '#22d3ee' },
    { label: 'SCHEDULE', href: '/home/roadmap', icon: Calendar, color: '#a78bfa' },
    { label: 'STALLS', href: '/home/stalls', icon: Store, color: '#fb923c' },
    { label: 'FEST', href: '/home/fest', icon: Music, color: '#f472b6' },
    { label: 'FULL PLANETS VIEW', href: '/home/planet-view', icon: Globe, color: '#60a5fa' },
];

export default function SmartEdgeSidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const [panelTopPct, setPanelTopPct] = useState(15); // % from top — draggable
    const swipeRatio = useMotionValue(0);  // Motion Value for high-perf tracking

    // Derived transformations to avoid React re-renders
    const swipeOpacity = useTransform(swipeRatio, [0, 0.1, 1], [0.45, 1, 1]);
    const swipeScaleY = useTransform(swipeRatio, [0, 1], [1, 1.4]);
    const swipeScaleX = useTransform(swipeRatio, [0, 1], [1, 2.5]);
    const swipeBlur = useTransform(swipeRatio, [0, 0.1, 1], [0.5, 0, 0]);
    const bloomOpacity = useTransform(swipeRatio, [0, 0.1], [0.1, 0]);

    const autoCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const swipeStartX = useRef<number | null>(null);
    const swipeStartY = useRef<number | null>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const panelDragStartY = useRef<number | null>(null);
    const panelDragStartTop = useRef<number>(15);

    /* ── Auto-sleep ─────────────────────────────────────────── */
    const scheduleAutoSleep = useCallback(() => {
        if (autoCloseRef.current) clearTimeout(autoCloseRef.current);
        autoCloseRef.current = setTimeout(() => setIsOpen(false), AUTO_SLEEP_MS);
    }, []);

    const openPanel = useCallback(() => {
        setIsOpen(true);
        swipeRatio.set(0);
        scheduleAutoSleep();
    }, [scheduleAutoSleep]);

    const closePanel = useCallback(() => {
        setIsOpen(false);
        swipeRatio.set(0);
        if (autoCloseRef.current) clearTimeout(autoCloseRef.current);
    }, []);

    useEffect(() => () => {
        if (autoCloseRef.current) clearTimeout(autoCloseRef.current);
    }, []);

    /* ── Trigger Strip — Swipe Gesture ──────────────────────── */
    const onTriggerPointerDown = (e: React.PointerEvent) => {
        if (isOpen) return;
        swipeStartX.current = e.clientX;
        swipeStartY.current = e.clientY;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    };

    const onTriggerPointerMove = (e: React.PointerEvent) => {
        if (swipeStartX.current === null || isOpen) return;
        const dx = swipeStartX.current - e.clientX; // positive = inward swipe
        const ratio = Math.min(Math.max(dx / SWIPE_OPEN_PX, 0), 1);
        swipeRatio.set(ratio);
        if (dx >= SWIPE_OPEN_PX) {
            swipeStartX.current = null;
            openPanel();
        }
    };

    const onTriggerPointerUp = () => {
        swipeStartX.current = null;
        swipeRatio.set(0);
    };

    /* ── Panel — vertical drag to reposition ─────────────────── */
    const onPanelPointerDown = (e: React.PointerEvent) => {
        panelDragStartY.current = e.clientY;
        panelDragStartTop.current = panelTopPct;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    };

    const onPanelPointerMove = (e: React.PointerEvent) => {
        if (panelDragStartY.current === null) return;
        const dy = e.clientY - panelDragStartY.current;
        const newPct = panelDragStartTop.current + (dy / window.innerHeight) * 100;
        setPanelTopPct(Math.min(Math.max(newPct, 5), 85));
    };

    const onPanelPointerUp = () => {
        panelDragStartY.current = null;
        scheduleAutoSleep();
    };

    return (
        /* Only on mobile */
        <div className="fixed inset-y-0 right-0 z-[9990] md:hidden pointer-events-none">

            {/* ── Backdrop ─────────────────────────────────────── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        onClick={closePanel}
                        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto"
                    />
                )}
            </AnimatePresence>

            {/* ── Sleeping trigger strip (right edge) ─────────── */}
            {!isOpen && (
                <div
                    className="absolute right-0 top-0 h-full w-28 pointer-events-none flex items-start justify-end pt-[20vh]"
                >
                    {/* The glowing trigger line */}
                    <div
                        className="relative flex flex-col items-end justify-center pointer-events-auto cursor-pointer w-28 h-[180px]"
                        style={{ touchAction: 'none' }}
                        onPointerDown={onTriggerPointerDown}
                        onPointerMove={onTriggerPointerMove}
                        onPointerUp={onTriggerPointerUp}
                        onPointerLeave={onTriggerPointerUp}
                        onClick={openPanel}
                    >
                        {/* The Nav Line with integrated dots - Attached to edge */}
                        <div className="relative h-4/5 w-1 mr-0">
                            <motion.div
                                className="rounded-l-full w-full h-full"
                                style={{
                                    background: `linear-gradient(to bottom, transparent, ${SIDEBAR_ACCENT} 40%, ${SIDEBAR_ACCENT} 60%, transparent)`,
                                    boxShadow: `-2px 0 16px 2px ${SIDEBAR_ACCENT}`,
                                    opacity: swipeOpacity,
                                    scaleY: swipeScaleY,
                                    scaleX: swipeScaleX,
                                    filter: swipeBlur,
                                }}
                            />
                            {/* Attached Nodes - Fixed at edge */}
                            {[0, 1].map(j => (
                                <motion.div
                                    key={j}
                                    className={`absolute ${j === 0 ? 'top-0' : 'bottom-0'} right-0 w-2.5 h-2.5 rounded-full z-10 translate-x-1/2`}
                                    style={{ backgroundColor: SIDEBAR_ACCENT, boxShadow: `0 0 10px ${SIDEBAR_ACCENT}` }}
                                    animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.1, 0.9] }}
                                    transition={{ duration: 2, repeat: Infinity, delay: j * 0.5 }}
                                />
                            ))}
                        </div>

                        {/* Always visible swipe hint arrow - Tucked behind the line */}
                        <motion.div
                            animate={{ x: [0, -3, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40"
                        >
                            <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 opacity-90" style={{ color: SIDEBAR_ACCENT, filter: `drop-shadow(0 0 10px ${SIDEBAR_ACCENT})` }} />
                        </motion.div>
                    </div>
                </div>
            )}

            {/* ── Expanded Dock Panel ───────────────────────────── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={panelRef}
                        key="panel"
                        initial={{ x: PANEL_W + 20, opacity: 0.5 }}
                        animate={{ x: isOpen ? 0 : useTransform(swipeRatio, [0, 1], [PANEL_W, 0]).get(), opacity: 1 }}
                        exit={{ x: PANEL_W + 20, opacity: 0.5, transition: { type: 'spring', stiffness: 400, damping: 35 } }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}

                        /* Horizontal drag → close if swiped far right */
                        drag="x"
                        dragConstraints={{ left: 0, right: PANEL_W }}
                        dragElastic={{ left: 0, right: 0.15 }}
                        dragMomentum={false}
                        onDragEnd={(_, info) => {
                            if (info.offset.x > SWIPE_CLOSE_PX || info.velocity.x > 400) closePanel();
                        }}

                        className="absolute right-0 pointer-events-auto"
                        style={{
                            top: `${panelTopPct}%`,
                            transform: 'translateY(-50%)',
                            width: PANEL_W,
                            zIndex: 9991,
                            touchAction: 'pan-x',
                        }}
                    >
                        {/* Glass panel */}
                        <div className="relative h-full flex flex-col rounded-l-2xl overflow-hidden bg-black/70 backdrop-blur-2xl border-l border-t border-b"
                            style={{
                                borderColor: `${SIDEBAR_ACCENT}33`,
                                boxShadow: `-12px 0 40px rgba(0,0,0,0.6), inset 0 0 1px ${SIDEBAR_ACCENT}14`
                            }}
                        >
                            {/* Top edge glow */}
                            <div className="absolute left-0 top-0 w-[2px] h-full pointer-events-none"
                                style={{ background: `linear-gradient(to bottom, transparent, ${SIDEBAR_ACCENT}99, transparent)` }}
                            />

                            {/* Drag handle — vertical repositioning */}
                            <div
                                className="flex justify-center pt-2 pb-1 cursor-ns-resize"
                                style={{ touchAction: 'none' }}
                                onPointerDown={onPanelPointerDown}
                                onPointerMove={onPanelPointerMove}
                                onPointerUp={onPanelPointerUp}
                                onPointerLeave={onPanelPointerUp}
                            >
                                <div className="w-6 h-1 rounded-full bg-white/10" />
                            </div>

                            {/* Nav Items Scrollable Container */}
                            <div className="flex-1 overflow-y-auto no-scrollbar pb-6 mt-4" onClick={scheduleAutoSleep}>
                                <nav className="flex flex-col items-center gap-4 px-1">
                                    <AnimatePresence>
                                        {NAV_ITEMS.map((item, i) => {
                                            const Icon = item.icon;
                                            return (
                                                <motion.div
                                                    key={item.href}
                                                    initial={{ opacity: 0, scale: 0.5, x: 20 }}
                                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                                    exit={{ opacity: 0, scale: 0.5, x: 20 }}
                                                    transition={{ delay: i * 0.03, type: 'spring', stiffness: 400, damping: 28 }}
                                                >
                                                    <Link href={item.href} onClick={closePanel} className="group flex flex-col items-center gap-1 outline-none">
                                                        <motion.div
                                                            whileTap={{ scale: 0.85 }}
                                                            className="w-[38px] h-[38px] sm:w-[46px] sm:h-[46px] rounded-full flex items-center justify-center relative transition-all duration-150"
                                                            style={{ background: `${item.color}12`, border: `1px solid ${item.color}35`, boxShadow: `0 0 0px ${item.color}` }}
                                                            whileHover={{ boxShadow: `0 0 12px ${item.color}60` }}
                                                        >
                                                            <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: item.color }} />
                                                            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border border-black" style={{ background: item.color, opacity: 0.7 }} />
                                                        </motion.div>
                                                        <span className="text-[8px] font-black tracking-wider text-center leading-tight mt-0.5 max-w-[100px]" style={{ color: `${item.color}80` }}>{item.label}</span>
                                                    </Link>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </nav>
                            </div>

                            {/* Footer hint */}
                            <div className="mt-auto pb-2 flex flex-col items-center gap-1">
                                <div className="flex gap-1 items-center opacity-20">
                                    {[8, 12, 8].map((w, i) => (
                                        <div key={i} className="h-[1.5px] rounded-full bg-white" style={{ width: w }} />
                                    ))}
                                </div>
                                <span className="text-[5px] text-white/20 tracking-widest font-black uppercase">swipe → close</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
