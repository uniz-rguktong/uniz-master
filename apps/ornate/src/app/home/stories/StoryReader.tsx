'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronLeft, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

export interface StoryPage {
    title: string;
    content: string;
    image?: string;
}

export interface StoryData {
    id: string;
    title: string;
    subtitle: string;
    chapter: string;
    totalPages: number;
    accentColor: string;
    glowColor: string;
    pages: StoryPage[];
}

interface StoryReaderProps {
    story: StoryData;
}

export default function StoryReader({ story }: StoryReaderProps) {
    const [currentPage, setCurrentPage] = useState(0);
    const router = useRouter();

    const nextPage = useCallback(() => {
        if (currentPage < story.pages.length - 1) {
            setCurrentPage((prev) => prev + 1);
        }
    }, [currentPage, story.pages.length]);

    const prevPage = useCallback(() => {
        if (currentPage > 0) {
            setCurrentPage((prev) => prev - 1);
        }
    }, [currentPage]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') nextPage();
            if (e.key === 'ArrowLeft') prevPage();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nextPage, prevPage]);

    const ch = story.pages[currentPage];
    const progress = ((currentPage + 1) / story.pages.length) * 100;

    return (
        <main className="fixed inset-0 bg-[#020402] text-white overflow-hidden font-orbitron select-none">
            {/* ── Background Grid & Environment ── */}
            <div className="absolute inset-0 pointer-events-none">
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `radial-gradient(${story.accentColor} 1px, transparent 1px)`,
                        backgroundSize: '40px 40px'
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020402]/50 to-[#020402]" />

                {/* Ambient Glows */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[150px] opacity-20" style={{ background: story.accentColor }} />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[150px] opacity-10" style={{ background: story.glowColor }} />
            </div>

            {/* ── Top HUD ── */}
            <header className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-4 sm:px-8 z-50">
                <div className="flex items-center gap-3 sm:gap-6">
                    <button
                        onClick={() => router.push('/home/stories')}
                        className="group flex items-center gap-2 text-[8px] sm:text-[10px] font-bold tracking-[0.2em] text-white/40 hover:text-white transition-colors"
                    >
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md border border-white/10 flex items-center justify-center group-hover:border-white/30">
                            <ArrowLeft className="w-3 h-3" />
                        </div>
                        <span className="hidden sm:inline">ARCHIVE_LOG</span>
                        <span className="sm:hidden">BACK</span>
                    </button>
                    <div className="h-4 w-px bg-white/10" />
                    <Link
                        href="/home"
                        className="group flex items-center gap-2 text-[8px] sm:text-[10px] font-bold tracking-[0.3em] text-white/20 hover:text-[var(--color-neon)] transition-all"
                    >
                        <span className="group-hover:translate-x-1 transition-transform hidden sm:inline">TO DASHBOARD</span>
                        <span className="group-hover:translate-x-1 transition-transform sm:hidden">HOME</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-white/10 group-hover:bg-[var(--color-neon)] group-hover:shadow-[0_0_8px_var(--color-neon)] transition-all" />
                    </Link>
                </div>

                <div className="flex items-center gap-3 sm:gap-5">
                    <div className="flex flex-col items-end gap-0.5">
                        <span className="text-[8px] sm:text-[10px] font-bold tracking-[0.2em] text-white/60 uppercase">
                            Chapter {(currentPage + 1).toString().padStart(2, '0')}
                        </span>
                        <span className="text-[6px] sm:text-[7px] font-bold tracking-[0.2em] sm:tracking-[0.4em] text-white/20 uppercase font-mono">
                            STATUS :: SYNCRONIZED
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 h-4">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className="w-1 h-full"
                                initial={false}
                                animate={{
                                    backgroundColor: i <= (currentPage % 3) ? story.accentColor : 'rgba(255,255,255,0.1)',
                                    opacity: i <= (currentPage % 3) ? [0.4, 1, 0.4] : 0.2
                                }}
                                transition={{ repeat: Infinity, duration: 2, delay: i * 0.2 }}
                            />
                        ))}
                    </div>
                </div>
            </header>

            {/* ── Main Content Body ── */}
            <div className="relative h-full flex items-center justify-center px-4 sm:px-12">

                {/* Prev Navigation - Desktop */}
                {currentPage > 0 && (
                    <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={prevPage}
                        className="hidden sm:block absolute left-12 top-1/2 -translate-y-1/2 z-50 p-4 rounded-full text-white/40 hover:text-white transition-all cursor-pointer group"
                    >
                        <ChevronLeft className="w-12 h-12 group-hover:-translate-x-1 transition-transform" strokeWidth={1} />
                    </motion.button>
                )}

                {/* Next Navigation - Desktop */}
                {currentPage < story.pages.length - 1 && (
                    <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={nextPage}
                        className="hidden sm:block absolute right-12 top-1/2 -translate-y-1/2 z-50 p-4 rounded-full transition-all cursor-pointer group"
                        style={{ color: story.accentColor }}
                    >
                        <ChevronRight className="w-12 h-12 group-hover:translate-x-1 transition-transform" strokeWidth={1} />
                    </motion.button>
                )}

                {/* Mobile Pagination Navigation */}
                <div className="sm:hidden absolute bottom-[4.5rem] left-1/2 -translate-x-1/2 flex items-center gap-2 z-50 p-1 rounded-full bg-[#0A0C0A]/95 backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
                    <button
                        onClick={prevPage}
                        className={`p-2 rounded-full transition-all active:scale-95 flex items-center justify-center ${currentPage === 0 ? 'opacity-20 pointer-events-none' : 'text-white/60 active:bg-white/10'}`}
                    >
                        <ChevronLeft className="w-6 h-6" strokeWidth={2} />
                    </button>
                    <div className="w-px h-5 bg-white/10 mx-1" />
                    <button
                        onClick={nextPage}
                        className={`p-2 rounded-full transition-all active:scale-95 flex items-center justify-center ${currentPage === story.pages.length - 1 ? 'opacity-20 pointer-events-none text-white' : 'active:bg-white/10'}`}
                        style={{ color: currentPage === story.pages.length - 1 ? undefined : story.accentColor }}
                    >
                        <ChevronRight className="w-6 h-6" strokeWidth={2} />
                    </button>
                </div>

                {/* ── The Story Card ── */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentPage}
                        initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="relative w-full mt-8 sm:mt-0 max-w-5xl h-[84vh] sm:h-auto sm:aspect-[16/9] sm:max-h-[72vh] rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden flex flex-col sm:flex-row shadow-2xl group/card"
                    >
                        {/* Card Frame & Grid */}
                        <div className="absolute inset-0 bg-[#0A0C0A]/95 backdrop-blur-3xl" />
                        <div
                            className="absolute inset-0 opacity-[0.03] pointer-events-none"
                            style={{ backgroundImage: 'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}
                        />


                        {/* Left Panel: Branding / Title */}
                        <div className="relative w-full sm:w-[55%] h-auto sm:h-full flex flex-col justify-end sm:justify-between p-6 sm:p-10 border-b sm:border-b-0 sm:border-r border-white/5 shrink-0 bg-[#0A0C0A]/60 sm:bg-transparent">
                            <div className="space-y-2 sm:space-y-6">
                                <span className="text-[8px] sm:text-[10px] font-black tracking-[0.4em] text-white/20 uppercase block font-mono">
                                    ARCHIVE RECORD
                                </span>

                                <div className="space-y-0">
                                    <h1 className="text-3xl sm:text-4xl font-black text-white leading-[1.1] uppercase">
                                        {ch.title.split(' ')[0]}
                                    </h1>
                                    <h2 className="text-3xl sm:text-4xl font-black leading-[1.1] uppercase" style={{ color: story.accentColor }}>
                                        {ch.title.split(' ').slice(1).join(' ')}
                                    </h2>
                                </div>

                                {ch.image && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 bg-black/40 group-hover/card:border-white/20 transition-colors shadow-2xl"
                                    >
                                        <Image 
                                            src={ch.image} 
                                            alt={ch.title} 
                                            fill 
                                            className="object-cover transition-transform duration-700 group-hover/card:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    </motion.div>
                                )}

                                {/* Decorative indicators removed per user request */}
                            </div>

                            <div className="hidden sm:block space-y-2 opacity-30 font-mono">
                                {/* Removed HUD Labels per user request */}
                            </div>
                        </div>

                        {/* Right Panel: Content */}
                        <div className="relative flex-1 p-6 sm:p-20 overflow-y-auto custom-scrollbar flex flex-col">
                            <div className="relative my-0 sm:my-auto mx-auto w-full max-w-2xl">
                                <div className="space-y-6 sm:space-y-12 sm:py-12 py-2">
                                    {ch.content.split('\n\n').map((para, i) => {
                                        const isEnhancedReadability = ['OrnateStory', 'PingoStory', 'EnergyGuide'].includes(story.id);
                                        return (
                                            <p
                                                key={i}
                                                className={`text-white/85 sm:text-white/70 text-[15px] sm:text-xl leading-[1.8] sm:leading-relaxed tracking-wide text-justify sm:text-left drop-shadow-md sm:drop-shadow-none ${
                                                    isEnhancedReadability 
                                                    ? 'font-sans opacity-90 sm:opacity-85 sm:tracking-normal sm:font-medium' 
                                                    : 'font-sans sm:font-orbitron sm:tracking-tight'
                                                }`}
                                            >
                                                {para.trim()}
                                            </p>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Tactical HUD ID inside content */}
                            <div className="absolute bottom-8 right-12 text-[8px] font-bold tracking-[0.2em] text-white/5 pointer-events-none font-mono">
                                GUID::PROTOCOL.{80 + currentPage}
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* ── Footer HUD ── */}
            <footer className="absolute bottom-0 left-0 right-0 h-16 sm:h-20 px-4 sm:px-10 flex flex-col justify-end pb-4 sm:pb-8 z-50">
                <div className="flex items-end justify-between mb-4">
                    <div className="w-[40px] sm:w-[100px]" /> {/* Spacer to maintain alignment */}

                    <div className="text-center flex-1 sm:flex-none">
                        <span className="text-[8px] sm:text-[9px] font-black tracking-[0.2em] sm:tracking-[0.4em] text-white/20 uppercase">
                            <span className="hidden sm:inline">ARCHIVE SYNC GRID ACTIVE / / </span>
                            000-{(currentPage + 1).toString().padStart(2, '0')}
                        </span>
                    </div>

                    <div className="w-[40px] sm:w-[100px] text-right">
                        <span className="text-[10px] sm:text-[12px] font-black tabular-nums" style={{ color: story.accentColor }}>
                            {Math.round(progress)}%
                        </span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-[2px] w-full bg-white/5 relative overflow-hidden">
                    <motion.div
                        className="absolute h-full left-0 top-0"
                        style={{ background: story.accentColor }}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                    {/* Tick Marks */}
                    <div className="absolute inset-0 flex justify-between pointer-events-none">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="w-px h-full bg-white/10" />
                        ))}
                    </div>
                </div>
            </footer>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255,255,255,0.15);
                }
            `}</style>
        </main>
    );
}
