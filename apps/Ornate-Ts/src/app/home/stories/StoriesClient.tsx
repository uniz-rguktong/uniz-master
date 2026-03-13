'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

// ─── Book Definitions ──────────────────────────────────────────────────────────
const BOOKS = [
    {
        id: 'PingoStory',
        title: 'My Story',
        author: 'Your Journey',
        chapter: 'Chapter 01',
        pages: '∞',
        description: 'A personal chronicle of your path through the Ornate Universe. Every mission you take, every event you join — written here.',
        spineColor: '#39FF14',
        spineGlow: 'rgba(57, 255, 20, 0.5)',
        coverStart: '#020A02',
        coverEnd: '#051405',
        accentColor: '#39FF14',
        symbol: (
            <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10" aria-hidden="true">
                <circle cx="20" cy="13" r="7" stroke="#39FF14" strokeWidth="2" fill="rgba(57,255,20,0.1)" />
                <path d="M8 34c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="#39FF14" strokeWidth="2" strokeLinecap="round" fill="none" />
                <circle cx="20" cy="13" r="2" fill="#39FF14" opacity="0.7" />
            </svg>
        ),
        badge: 'PERSONAL',
    },
    {
        id: 'EnergyGuide',
        title: 'Energy Guide',
        author: 'Cadet Orientation',
        chapter: 'Mastery',
        pages: '64',
        description: 'Master the principles of Neon Energy. Learn how to earn NEU, increase your rank, and power your branch planet.',
        spineColor: '#00D1FF',
        spineGlow: 'rgba(0, 209, 255, 0.4)',
        coverStart: '#00080F',
        coverEnd: '#00141F',
        accentColor: '#00D1FF',
        symbol: (
            <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10" aria-hidden="true">
                <path d="M20 8v24M12 16l8-8 8 8" stroke="#00D1FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 24l8 8 8-8" stroke="#00D1FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
                <circle cx="20" cy="20" r="15" stroke="#00D1FF" strokeWidth="1" strokeDasharray="3 4" opacity="0.2" />
            </svg>
        ),
        badge: 'GUIDE',
    },
    {
        id: 'OrnateStory',
        title: 'Ornate Story',
        author: 'The Grand Narrative',
        chapter: 'Prologue',
        pages: '888',
        description: 'The full saga of the Ornate Universe — its genesis from RGUKT Ongole, its founding legends, and the future it is building.',
        spineColor: '#BD00FF',
        spineGlow: 'rgba(189, 0, 255, 0.4)',
        coverStart: '#08000F',
        coverEnd: '#14001F',
        accentColor: '#BD00FF',
        symbol: (
            <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10" aria-hidden="true">
                <path d="M20 4l2.5 8h8.5l-6.8 5 2.5 8L20 20l-6.7 5 2.5-8L9 12h8.5z" stroke="#BD00FF" strokeWidth="1.5" fill="rgba(189,0,255,0.15)" strokeLinejoin="round" />
                <circle cx="20" cy="20" r="16" stroke="#BD00FF" strokeWidth="1" strokeDasharray="3 4" opacity="0.4" />
            </svg>
        ),
        badge: 'SAGA',
    },
] as const;

// ─── Floating Particles ────────────────────────────────────────────────────────
function FloatingParticles() {
    const particles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 0.5,
        delay: Math.random() * 8,
        duration: Math.random() * 6 + 6,
    }));

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className="absolute rounded-full bg-[var(--color-neon)]"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: p.size,
                        height: p.size,
                        opacity: 0.1,
                    }}
                    animate={{
                        opacity: [0.05, 0.2, 0.05],
                        y: [0, -40, 0],
                    }}
                    transition={{
                        repeat: Infinity,
                        duration: p.duration,
                        delay: p.delay,
                        ease: 'easeInOut',
                    }}
                />
            ))}
        </div>
    );
}

// ─── Book Component ────────────────────────────────────────────────────────────
function Book({ book, index }: { book: typeof BOOKS[number]; index: number }) {
    const router = useRouter();

    return (
        <motion.div
            initial={{ opacity: 0, y: 60, rotateX: 15 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: index * 0.15 + 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="group relative cursor-pointer"
            style={{ perspective: '800px' }}
            onClick={() => router.push(`/home/stories/${book.id}`)}
        >
            {/* Shelf shadow beneath book */}
            <motion.div
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full blur-2xl"
                style={{
                    width: '80%',
                    height: 20,
                    background: book.spineGlow,
                    opacity: 0.3,
                }}
                animate={{ opacity: [0.2, 0.4, 0.2], scaleX: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 3, delay: index * 0.4 }}
            />

            {/* Book 3D container */}
            <motion.div
                className="relative"
                whileHover={{ y: -16, rotateY: -8, scale: 1.03 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* ── Book Spine (left side) ── */}
                <div
                    className="absolute left-0 top-0 bottom-0 w-7 rounded-l-sm flex flex-col items-center justify-center gap-1"
                    style={{
                        background: `linear-gradient(180deg, ${book.spineColor}22 0%, ${book.spineColor}66 50%, ${book.spineColor}22 100%)`,
                        borderRight: `1px solid ${book.spineColor}44`,
                    }}
                >
                    <div
                        className="w-[2px] h-full absolute left-1"
                        style={{ background: `linear-gradient(180deg, transparent, ${book.spineColor}, transparent)`, opacity: 0.4 }}
                    />
                </div>

                {/* ── Book Cover ── */}
                <div
                    className="relative ml-7 overflow-hidden rounded-r-lg"
                    style={{
                        background: `linear-gradient(145deg, ${book.coverStart} 0%, ${book.coverEnd} 100%)`,
                        border: `1px solid ${book.spineColor}30`,
                        boxShadow: `0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px ${book.spineColor}15, inset 0 1px 0 rgba(255,255,255,0.03)`,
                        minHeight: '380px',
                    }}
                >
                    {/* Top glow band */}
                    <motion.div
                        className="absolute top-0 left-0 right-0 h-[2px] opacity-70 group-hover:opacity-100 transition-opacity"
                        style={{ background: `linear-gradient(90deg, transparent, ${book.spineColor}, transparent)` }}
                        animate={{ opacity: [0.3, 0.7, 0.3] }}
                        transition={{ repeat: Infinity, duration: 2.5, delay: index * 0.5 }}
                    />

                    {/* Subtle page texture */}
                    <div
                        className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{
                            backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 18px)',
                        }}
                    />

                    {/* Cover ambient glow */}
                    <motion.div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                        style={{
                            background: `radial-gradient(ellipse at 50% 30%, ${book.spineColor}15 0%, transparent 70%)`,
                        }}
                    />

                    <div className="relative p-6 flex flex-col h-full min-h-[380px]">
                        {/* Badge */}
                        <div className="flex justify-between items-start mb-6">
                            <span
                                className="text-[9px] font-bold tracking-[0.25em] px-2.5 py-1 rounded-sm"
                                style={{
                                    color: book.accentColor,
                                    background: `${book.spineColor}10`,
                                    border: `1px solid ${book.spineColor}40`,
                                }}
                            >
                                {book.badge}
                            </span>
                            <span
                                className="text-[9px] font-bold tracking-[0.15em] font-mono"
                                style={{ color: `${book.accentColor}60` }}
                            >
                                {book.chapter}
                            </span>
                        </div>

                        {/* Symbol / icon center */}
                        <div className="flex justify-center mb-5">
                            {book.symbol}
                        </div>

                        {/* Ornamental divider */}
                        <div className="flex items-center gap-2 mb-5">
                            <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${book.spineColor}30)` }} />
                            <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: book.accentColor, boxShadow: `0 0 8px ${book.accentColor}` }} />
                            <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${book.spineColor}30)` }} />
                        </div>

                        {/* Title block */}
                        <div className="text-center mb-4">
                            <h2
                                className="text-xl font-bold tracking-wider mb-1 leading-tight uppercase italic"
                                style={{
                                    color: 'white',
                                    textShadow: `0 0 10px ${book.spineGlow}`,
                                    fontFamily: 'var(--font-orbitron)',
                                }}
                            >
                                {book.title}
                            </h2>
                            <p className="text-[10px] tracking-[0.3em] uppercase font-bold" style={{ color: book.accentColor }}>
                                {book.author}
                            </p>
                        </div>

                        {/* Description */}
                        <p className="text-[13px] text-white/40 leading-relaxed text-center flex-1 font-rajdhani">
                            {book.description}
                        </p>

                        {/* Bottom metadata */}
                        <div className="mt-5 pt-4 flex items-center justify-between"
                            style={{ borderTop: `1px solid ${book.spineColor}15` }}
                        >
                            <span className="text-[9px] text-white/20 tracking-widest uppercase font-bold">
                                Sector Archives
                            </span>
                            {/* Read CTA */}
                            <motion.div
                                className="flex items-center gap-1.5 text-[10px] font-black tracking-[0.2em] uppercase italic"
                                style={{ color: book.accentColor }}
                                animate={{ opacity: [0.6, 1, 0.6] }}
                                transition={{ repeat: Infinity, duration: 1.5, delay: index * 0.3 }}
                            >
                                Initialize
                                <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5" aria-hidden="true">
                                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* Hover glow bloom */}
                <motion.div
                    className="absolute inset-0 rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: `0 0 40px ${book.spineGlow}` }}
                />
            </motion.div>
        </motion.div>
    );
}

// ─── Shelf Plank ──────────────────────────────────────────────────────────────
function ShelfPlank() {
    return (
        <div className="relative w-full mt-10 mb-4" style={{ height: '24px' }}>
            {/* Main plank */}
            <div
                className="absolute inset-0 rounded-sm"
                style={{
                    background: 'linear-gradient(180deg, rgba(10,15,10,0.95) 0%, rgba(5,8,5,0.98) 60%, rgba(2,4,2,0.9) 100%)',
                    border: '1px solid var(--color-neon-dark)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.05)',
                }}
            />
            {/* Glow strip on top edge */}
            <div
                className="absolute top-0 left-[2%] right-[2%] h-[2px]"
                style={{ background: 'linear-gradient(90deg, transparent, var(--color-neon) 50%, transparent)', opacity: 0.4 }}
            />
            {/* HUD tick marks */}
            {Array.from({ length: 16 }).map((_, i) => (
                <div
                    key={i}
                    className="absolute top-1/2 -translate-y-1/2 w-[1px]"
                    style={{
                        left: `${5 + i * 6}%`,
                        height: i % 4 === 0 ? 10 : 5,
                        background: 'var(--color-neon)',
                        opacity: i % 4 === 0 ? 0.3 : 0.1,
                    }}
                />
            ))}
        </div>
    );
}

// ─── Main Stories Client ───────────────────────────────────────────────────────
export default function StoriesClient() {
    return (
        <div className="min-h-screen relative overflow-hidden" style={{ background: '#020402' }}>
            {/* Deep space background gradient */}
            <div
                className="fixed inset-0 pointer-events-none z-0"
                style={{
                    background: `radial-gradient(circle at 50% 0%, rgba(57, 255, 20, 0.08) 0%, transparent 70%), 
                                radial-gradient(circle at 100% 100%, rgba(57, 255, 20, 0.03) 0%, transparent 40%)`,
                }}
            />

            <FloatingParticles />

            <div className="relative z-10 min-h-screen flex flex-col">
                {/* ── Header ── */}
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="px-6 pt-10 pb-4"
                >
                    {/* Back to home */}
                    <Link
                        href="/home"
                        className="inline-flex items-center gap-3 text-[11px] font-black tracking-[0.3em] uppercase text-white/40 hover:text-[var(--color-neon)] transition-all mb-12 group"
                    >
                        <div className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center group-hover:border-[var(--color-neon)]/50 group-hover:bg-[var(--color-neon)]/5 transition-all">
                            <ChevronLeft className="w-4 h-4" />
                        </div>
                        Back to Dashboard
                    </Link>

                    <div className="max-w-5xl mx-auto text-center">
                        {/* Label */}
                        <motion.div
                            className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-[var(--color-neon)]/20 bg-[var(--color-neon)]/5 mb-6"
                            animate={{ borderColor: ['rgba(57,255,20,0.1)', 'rgba(57,255,20,0.4)', 'rgba(57,255,20,0.1)'] }}
                            transition={{ repeat: Infinity, duration: 4 }}
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-neon)] shadow-[0_0_8px_var(--color-neon)]" />
                            <span className="text-[10px] font-black tracking-[0.4em] uppercase text-white font-apex">
                                The Ornate Archives
                            </span>
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-neon)] shadow-[0_0_8px_var(--color-neon)]" />
                        </motion.div>

                        <h1
                            className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-[0.15em] text-white mb-6 uppercase italic font-apex"
                            style={{
                                textShadow: '0 0 30px rgba(57, 255, 20, 0.2)',
                                WebkitTextStroke: '1px rgba(255,255,255,0.05)'
                            }}
                        >
                            Story <span className="text-[var(--color-neon)]">Vault</span>
                        </h1>

                        <p className="text-white/40 text-[13px] tracking-[0.1em] max-w-xl mx-auto leading-relaxed font-rajdhani">
                            Accessing localized neural records. Three primary data nodes detected within the Ornate Grid. Select a chronicle to initialize playback.
                        </p>

                        {/* HUD Elements */}
                        <div className="flex items-center justify-center gap-6 mt-10">
                            <div className="h-[1px] flex-1 max-w-[120px]" style={{ background: 'linear-gradient(to right, transparent, var(--color-neon))', opacity: 0.2 }} />
                            <div className="flex gap-2">
                                {[0, 1, 2, 3, 4].map((i) => (
                                    <div key={i} className={`w-1 h-3 border border-[var(--color-neon)]/40 ${i === 2 ? 'bg-[var(--color-neon)]' : ''}`} />
                                ))}
                            </div>
                            <div className="h-[1px] flex-1 max-w-[120px]" style={{ background: 'linear-gradient(to left, transparent, var(--color-neon))', opacity: 0.2 }} />
                        </div>
                    </div>
                </motion.header>

                {/* ── Library Vault ── */}
                <main className="flex-1 flex flex-col justify-center px-6 py-12">
                    <div className="max-w-6xl mx-auto w-full">
                        {/* Vault frame */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className="relative rounded-[2rem] p-10 pb-4"
                            style={{
                                background: 'rgba(5, 8, 5, 0.7)',
                                backdropFilter: 'blur(32px)',
                                border: '1px solid rgba(57, 255, 20, 0.15)',
                                boxShadow: '0 40px 100px rgba(0,0,0,0.9), inset 0 0 40px rgba(57, 255, 20, 0.05)',
                            }}
                        >
                            {/* Corner HUD Bracket Labels */}
                            <div className="absolute top-6 left-6 text-[8px] font-bold tracking-[0.3em] text-[var(--color-neon)]/40 font-mono">
                                [ L-SEC-ALPHA ]
                            </div>
                            <div className="absolute top-6 right-6 text-[8px] font-bold tracking-[0.3em] text-[var(--color-neon)]/40 font-mono text-right">
                                SYSTEM :: ON
                            </div>

                            {/* Section label */}
                            <div className="flex items-center gap-4 mb-12">
                                <div className="h-[1px] flex-1" style={{ background: 'linear-gradient(to right, var(--color-neon), transparent)', opacity: 0.1 }} />
                                <span className="text-[10px] font-black tracking-[0.5em] uppercase text-white/20">
                                    Active Chronicles Found
                                </span>
                                <div className="h-[1px] flex-1" style={{ background: 'linear-gradient(to left, var(--color-neon), transparent)', opacity: 0.1 }} />
                            </div>

                            {/* Book grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 place-items-center">
                                {BOOKS.map((book, i) => (
                                    <Book key={book.id} book={book} index={i} />
                                ))}
                            </div>

                            {/* Shelf plank below books */}
                            <ShelfPlank />

                            {/* Bottom info bar */}
                            <div className="mt-8 flex justify-between items-center text-[8px] font-bold tracking-[0.4em] uppercase text-white/10 px-4">
                                <span>Record Auth :: RGUKT-O</span>
                                <span>Ver 2.0.4 - Deep Space Grid</span>
                                <span>Node Status :: Sync</span>
                            </div>
                        </motion.div>
                    </div>
                </main>
            </div>
        </div>
    );
}
