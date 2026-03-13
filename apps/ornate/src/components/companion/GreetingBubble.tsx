'use client';

import { motion } from 'framer-motion';
import { Volume2, VolumeX, Minus } from 'lucide-react';

interface GreetingBubbleProps {
    pingoSide: 'left' | 'right';
    displayedText: string;
    showBoredPrompt: boolean;
    handleYesClick: (e: React.MouseEvent) => void;
    isVoiceEnabled: boolean;
    setIsVoiceEnabled: (val: boolean) => void;
    onMinimize: () => void;
}

export function GreetingBubble({
    pingoSide,
    displayedText,
    showBoredPrompt,
    handleYesClick,
    isVoiceEnabled,
    setIsVoiceEnabled,
    onMinimize
}: GreetingBubbleProps) {
    return (
        <motion.div
            key={pingoSide}
            initial={{ opacity: 0, scale: 0.78, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.82, y: 10 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="absolute pointer-events-none flex flex-col"
            style={{
                zIndex: 10000,
                bottom: 'calc(100% + 15px)',
                ...(pingoSide === 'right'
                    ? { right: -20, transformOrigin: 'bottom right' }
                    : { left: -20, transformOrigin: 'bottom left' }
                ),
            }}
        >
            {/* ── Outer bloom diffuse glow ── */}
            <motion.div
                className="absolute pointer-events-none"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
                style={{
                    inset: '-12px',
                    borderRadius: '28px',
                    boxShadow: '0 0 35px 12px rgba(0,229,255,0.25), 0 0 65px 20px rgba(0,229,255,0.12)',
                }}
            />

            {/* ── Main Bubble Shell ── */}
            <motion.div
                className="relative overflow-hidden pointer-events-auto"
                style={{
                    width: 'clamp(160px, 60vw, 280px)',
                    padding: 'clamp(10px, 2vw, 14px) clamp(14px, 3vw, 20px) clamp(12px, 2.5vw, 16px)',
                    background: 'linear-gradient(160deg, rgb(2,12,20) 0%, rgb(1,5,10) 100%)',
                    border: '1.5px solid rgba(0,229,255,0.8)',
                    borderRadius: '16px',
                }}
                animate={{
                    boxShadow: [
                        '0 0 8px rgba(0,229,255,0.65), 0 0 16px rgba(0,229,255,0.30), inset 0 0 14px rgba(0,229,255,0.15)',
                        '0 0 14px rgba(0,229,255,0.90), 0 0 28px rgba(0,229,255,0.50), inset 0 0 22px rgba(0,229,255,0.25)',
                        '0 0 8px rgba(0,229,255,0.65), 0 0 16px rgba(0,229,255,0.30), inset 0 0 14px rgba(0,229,255,0.15)',
                    ],
                }}
                transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}
            >
                {/* ── Scan lines ── */}
                <div
                    className="absolute inset-0 pointer-events-none mix-blend-screen opacity-100"
                    style={{
                        backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,229,255,0.06) 0px, rgba(0,229,255,0.06) 1px, transparent 1px, transparent 4px)',
                    }}
                />

                {/* ── Sweeping horizontal light streak ── */}
                <motion.div
                    className="absolute left-0 right-0 h-[2px] pointer-events-none mix-blend-screen"
                    style={{
                        background: 'linear-gradient(90deg, transparent 0%, rgba(0,229,255,0.50) 35%, rgba(255,255,255,0.9) 50%, rgba(0,229,255,0.50) 65%, transparent 100%)',
                        boxShadow: '0 0 8px rgba(255,255,255,0.5)',
                    }}
                    animate={{ top: ['15%', '80%', '15%'], opacity: [0.35, 1, 0.35] }}
                    transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
                />

                {/* ── HUD Actions Corner ── */}
                <div className="absolute top-[6px] right-[10px] flex items-center gap-1.5 z-20 pointer-events-auto">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsVoiceEnabled(!isVoiceEnabled); }}
                        className="p-1 hover:bg-white/10 rounded transition-colors group"
                        title={isVoiceEnabled ? "Mute" : "Unmute"}
                    >
                        {isVoiceEnabled ? (
                            <Volume2 className="w-3 h-3 text-[var(--color-neon)]" />
                        ) : (
                            <VolumeX className="w-3 h-3 text-white/40 group-hover:text-amber-400" />
                        )}
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onMinimize(); }}
                        className="p-1 hover:bg-white/10 rounded transition-colors group"
                        title="Minimize"
                    >
                        <Minus className="w-3 h-3 text-white/40 group-hover:text-[var(--color-neon)]" />
                    </button>
                </div>

                {/* ── HUD corner dashes – top-left ── */}
                <div className="absolute top-[8px] left-[12px] flex items-center gap-[4px] pointer-events-none">
                    <div className="h-[2px] w-5" style={{ background: 'rgba(0,229,255,0.8)', boxShadow: '0 0 4px rgba(0,229,255,0.5)' }} />
                    <div className="h-[2px] w-2" style={{ background: 'rgba(0,229,255,0.5)' }} />
                </div>
                {/* ── HUD corner dashes – top-right ── */}
                <div className="absolute top-[8px] right-[12px] opacity-0 flex items-center gap-[4px] pointer-events-none">
                    <div className="h-[2px] w-2" style={{ background: 'rgba(0,229,255,0.5)' }} />
                    <div className="h-[2px] w-5" style={{ background: 'rgba(0,229,255,0.8)', boxShadow: '0 0 4px rgba(0,229,255,0.5)' }} />
                </div>
                {/* ── HUD corner dashes – bottom-right ── */}
                <div className="absolute bottom-[8px] right-[12px] flex items-center gap-[4px] pointer-events-none">
                    <div className="h-[2px] w-2" style={{ background: 'rgba(0,229,255,0.4)' }} />
                    <div className="h-[2px] w-3" style={{ background: 'rgba(0,229,255,0.6)' }} />
                </div>

                {/* ── Sparkle / star particles ── */}
                {[
                    { top: '20%', left: '15%', size: 3, delay: 0.0 },
                    { top: '60%', right: '18%', size: 2.5, delay: 0.8 },
                    { top: '35%', right: '35%', size: 2, delay: 1.5 },
                    { top: '75%', left: '30%', size: 2.5, delay: 2.2 },
                ].map((sp, i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full pointer-events-none"
                        style={{
                            width: sp.size, height: sp.size,
                            background: 'white',
                            top: sp.top,
                            ...((('left' in sp) ? { left: sp.left } : { right: sp.right }) as any),
                            boxShadow: '0 0 6px 1px rgba(0,229,255,0.9)',
                        }}
                        animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2.8, delay: sp.delay, ease: 'easeInOut' }}
                    />
                ))}

                {/* ── Inner top-edge highlight (glass depth) ── */}
                <div
                    className="absolute top-0 left-4 right-4 h-px pointer-events-none"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)' }}
                />

                {/* ── Content ── */}
                <div className="relative z-10 flex flex-col items-center">
                    {/* Speaker label */}
                    <div className="flex items-center gap-1.5 mb-2 self-start pl-1">
                        <motion.div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: '#00e5ff', boxShadow: '0 0 8px #00e5ff' }}
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ repeat: Infinity, duration: 1.2 }}
                        />
                        <span
                            className="text-[9px] sm:text-[10px] font-black tracking-[0.28em] uppercase font-apex"
                            style={{ color: '#00e5ff', textShadow: '0 0 4px rgba(0,229,255,0.5)' }}
                        >
                            PINGO
                        </span>
                    </div>
                    {/* Message */}
                    <motion.p
                        className="text-[11px] sm:text-[13px] font-black tracking-[0.18em] sm:tracking-[0.22em] leading-snug uppercase px-2 text-left"
                        style={{ color: 'rgba(255,255,255,0.95)', textShadow: '0 0 8px rgba(0,229,255,0.4)', wordBreak: 'break-word', whiteSpace: 'normal' }}
                    >
                        {displayedText}
                    </motion.p>

                    {showBoredPrompt && (
                        <motion.button
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(0,229,255,0.5)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleYesClick}
                            className="mt-4 px-6 py-1.5 rounded-full border border-[var(--color-neon)] bg-[var(--color-neon)]/10 text-[var(--color-neon)] text-[9px] sm:text-[10px] font-black tracking-[0.3em] uppercase transition-all"
                        >
                            Yes
                        </motion.button>
                    )}
                </div>
            </motion.div>

            {/* ── Seamless CSS Tail ── */}
            <div
                className="absolute pointer-events-none"
                style={{
                    bottom: '-7px',
                    ...(pingoSide === 'right' ? { right: '28px' } : { left: '28px' }),
                    width: '14px',
                    height: '14px',
                    background: 'rgb(1,5,10)',
                    borderBottom: '1.5px solid rgba(0,229,255,0.8)',
                    borderRight: '1.5px solid rgba(0,229,255,0.8)',
                    transform: 'rotate(45deg)',
                    zIndex: 10,
                    boxShadow: '4px 4px 6px -2px rgba(0,229,255,0.2)',
                    borderRadius: '0 0 2px 0'
                }}
            />

            {/* ── Surface / ground reflection ── */}
            <motion.div
                className="absolute pointer-events-none"
                style={{
                    height: '2px',
                    width: '120px',
                    bottom: '-28px',
                    background: 'linear-gradient(90deg, transparent 0%, rgba(0,229,255,0.6) 40%, rgba(255,255,255,0.8) 50%, rgba(0,229,255,0.6) 60%, transparent 100%)',
                    boxShadow: '0 0 12px rgba(0,229,255,0.8)',
                    ...(pingoSide === 'right' ? { right: '0' } : { left: '0' }),
                }}
                animate={{ opacity: [0.2, 0.7, 0.2], scaleX: [0.8, 1.1, 0.8] }}
                transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
            />
        </motion.div>
    );
}
