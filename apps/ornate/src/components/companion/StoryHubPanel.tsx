'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Volume2, VolumeX, Minus, X, MessageSquare, MessageSquareOff } from 'lucide-react';
import { STORY_CARDS } from './constants';

interface StoryHubPanelProps {
    onClose: () => void;
    botRef: React.RefObject<HTMLDivElement | null>;
    isVoiceEnabled: boolean;
    setIsVoiceEnabled: (val: boolean) => void;
    isMessagesEnabled: boolean;
    setIsMessagesEnabled: (val: boolean) => void;
}

export function StoryHubPanel({
    onClose,
    isVoiceEnabled,
    setIsVoiceEnabled,
    isMessagesEnabled,
    setIsMessagesEnabled
}: StoryHubPanelProps) {
    const router = useRouter();

    const handleOpenStory = (id: string) => {
        onClose();
        const route = id === 'ornate-story' ? '/home/stories/OrnateStory' : id === 'energy-guide' ? '/home/stories/EnergyGuide' : '/home/stories/PingoStory';
        router.push(route);
    };

    return (
        <motion.div
            id="story-hub-panel"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-[calc(100%+16px)] left-1/2 pointer-events-auto"
            style={{ transform: 'translateX(-50%)', width: 'clamp(260px, 70vw, 300px)', zIndex: 10001 }}
            onPointerDown={(e) => e.stopPropagation()}
        >
            {/* Panel Shell */}
            <div style={{
                background: 'linear-gradient(160deg, rgba(8,12,8,0.98) 0%, rgba(4,6,4,0.99) 100%)',
                backdropFilter: 'blur(28px) saturate(180%)',
                border: '1px solid var(--color-neon)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 20px rgba(57,255,20,0.15), inset 0 1px 0 rgba(255,255,255,0.06)',
                borderRadius: '20px',
                overflow: 'hidden',
            }}>
                {/* Top glow bar */}
                <div className="absolute top-0 left-0 right-0 h-[1px]"
                    style={{ background: 'linear-gradient(90deg, transparent, var(--color-neon) 40%, var(--color-neon-dark) 70%, transparent)' }} />

                <div className="relative p-3">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                            <motion.div
                                className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden"
                                style={{ border: '1.5px solid var(--color-neon)', boxShadow: '0 0 10px rgba(57,255,20,0.3)', background: 'rgba(0,0,0,0.4)' }}
                                animate={{ boxShadow: ['0 0 8px rgba(57,255,20,0.2)', '0 0 18px rgba(57,255,20,0.5)', '0 0 8px rgba(57,255,20,0.2)'] }}
                                transition={{ repeat: Infinity, duration: 2.5 }}
                            >
                                <img src="/assets/Pingo_Bot.png" alt="Pingo" className="w-full h-full object-contain" draggable={false} />
                            </motion.div>
                            <div>
                                <motion.p className="text-[9px] font-semibold tracking-[0.25em] uppercase mb-0.5"
                                    style={{ color: 'var(--color-neon)' }}
                                    animate={{ opacity: [0.6, 1, 0.6] }}
                                    transition={{ repeat: Infinity, duration: 3 }}>
                                    Your Guide
                                </motion.p>
                                <h2 className="text-[14px] font-black text-white leading-tight tracking-[0.3em] uppercase"
                                    style={{ textShadow: '0 0 8px rgba(57,255,20,0.4)' }}>PINGO</h2>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            {/* Toggle Messages */}
                            <button
                                aria-label={isMessagesEnabled ? "Turn Off Greetings" : "Enable Greetings"}
                                onClick={() => setIsMessagesEnabled(!isMessagesEnabled)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200 flex-shrink-0 mt-0.5 group"
                                style={{ 
                                    background: isMessagesEnabled ? 'rgba(57,255,20,0.1)' : 'rgba(255,255,255,0.05)', 
                                    border: `1px solid ${isMessagesEnabled ? 'rgba(57,255,20,0.3)' : 'rgba(255,255,255,0.08)'}` 
                                }}
                            >
                                {isMessagesEnabled ? (
                                    <MessageSquare className="w-3.5 h-3.5 text-[var(--color-neon)] drop-shadow-[0_0_8px_var(--color-neon)]" />
                                ) : (
                                    <MessageSquareOff className="w-3.5 h-3.5 text-white/40 group-hover:text-amber-400 group-hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                                )}
                            </button>

                            {/* Toggle Voice */}
                            <button
                                aria-label={isVoiceEnabled ? "Mute Voice" : "Enable Voice"}
                                onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200 flex-shrink-0 mt-0.5 group"
                                style={{ 
                                    background: isVoiceEnabled ? 'rgba(57,255,20,0.1)' : 'rgba(255,255,255,0.05)', 
                                    border: `1px solid ${isVoiceEnabled ? 'rgba(57,255,20,0.3)' : 'rgba(255,255,255,0.08)'}` 
                                }}
                            >
                                {isVoiceEnabled ? (
                                    <Volume2 className="w-3.5 h-3.5 text-[var(--color-neon)] drop-shadow-[0_0_8px_var(--color-neon)]" />
                                ) : (
                                    <VolumeX className="w-3.5 h-3.5 text-white/40 group-hover:text-amber-400 group-hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                                )}
                            </button>
                            <button
                                onClick={onClose}
                                aria-label="Minimize"
                                className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200 flex-shrink-0 mt-0.5 group"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                            >
                                <Minus className="w-3.5 h-3.5 text-white/40 group-hover:text-[var(--color-neon)] group-hover:drop-shadow-[0_0_8px_var(--color-neon)]" />
                            </button>
                        </div>
                    </div>

                    {/* Separator */}
                    <div className="mb-3 h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--color-neon) 50%, transparent)' }} />

                    <motion.div key="story-list"
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <p className="text-[9px] font-bold tracking-[0.25em] uppercase mb-2"
                            style={{ color: 'rgba(163,255,18,0.7)' }}>Archives of Ornate</p>
                        {STORY_CARDS.map((card) => (
                            <motion.button
                                key={card.id}
                                id={`story-card-${card.id}`}
                                whileHover={{ scale: 1.02, boxShadow: `0 4px 24px ${card.glow}` }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => handleOpenStory(card.id)}
                                className="w-full text-left rounded-lg overflow-hidden mb-1.5 cursor-pointer"
                                style={{ background: 'linear-gradient(135deg, rgba(163,255,18,0.06) 0%, rgba(163,255,18,0.02) 100%)', border: `1px solid ${card.borderGlow}` }}
                            >
                                <div className="flex items-center gap-2 px-2.5 py-1.5">
                                    <div className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center"
                                        style={{ backgroundColor: 'rgba(163,255,18,0.1)', color: card.color }}>
                                        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor" opacity="0.6" />
                                            <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="currentColor" opacity="0.9" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0 flex items-center">
                                        <p className="text-[12px] font-bold text-white/90 leading-tight">{card.title}</p>
                                    </div>
                                    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 flex-shrink-0" style={{ color: card.color }}>
                                        <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </motion.button>
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* Connector Stem */}
            <div className="flex justify-center mt-1 pointer-events-none">
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 14, opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="w-[1px]"
                    style={{ background: 'linear-gradient(to bottom, var(--color-neon), transparent)' }}
                />
            </div>
        </motion.div>
    );
}
