'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, ChevronRight, X } from 'lucide-react';

// ─── Section Header ─────────────────────────────────────────────────────────────
export const SectionHeader = memo(({ color, label, title }: { color: string; label: string; title: string }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-4 sm:gap-6 mb-8 sm:mb-16 mt-4 sm:mt-0"
        >
            <div className="w-2 sm:w-3 h-8 sm:h-10 shrink-0 shadow-[0_0_15px_rgba(var(--color-neon-rgb,57,255,20),0.3)]" style={{ backgroundColor: color }} />
            <div className="flex flex-col items-start">
                <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white uppercase italic leading-none">
                    {title.split(' ').map((word, i) => (
                        <span key={i} className={i === title.split(' ').length - 1 ? '' : 'mr-2'}>
                            {i === title.split(' ').length - 1 ? <span style={{ color }}>{word}</span> : word}
                        </span>
                    ))}
                </h2>
                <p className="text-[8px] sm:text-[10px] font-black tracking-[0.4em] uppercase mt-2 opacity-50" style={{ color }}>
                    {label}
                </p>
            </div>
        </motion.div>
    );
});
SectionHeader.displayName = 'SectionHeader';

// ─── Video Carousel ────────────────────────────────────────────────────────────
export const VideoCarousel = memo(({ videos, color, onPlay, cardBorderWidth = 1, showSideAccents = false }: { videos: any[]; color: string; onPlay: (url: string) => void; cardBorderWidth?: number; showSideAccents?: boolean }) => {
    const [index, setIndex] = useState(0);
    const [direction, setDirection] = useState(0);

    const nextStep = () => {
        setDirection(1);
        setIndex((prev) => (prev + 1) % videos.length);
    };

    const prevStep = () => {
        setDirection(-1);
        setIndex((prev) => (prev - 1 + videos.length) % videos.length);
    };

    useEffect(() => {
        if (videos.length <= 1) return;
        const timer = setInterval(nextStep, 5000);
        return () => clearInterval(timer);
    }, [index, videos.length]);

    const variants = {
        enter: (direction: number) => ({ x: direction > 0 ? 1000 : -1000, opacity: 0, scale: 0.8, filter: 'blur(10px)' }),
        center: { zIndex: 1, x: 0, opacity: 1, scale: 1, filter: 'blur(0px)' },
        exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 1000 : -1000, opacity: 0, scale: 0.8, filter: 'blur(10px)' })
    };

    if (!videos || videos.length === 0) {
        return (
            <div className="w-full h-[300px] flex items-center justify-center border border-white/5 bg-white/[0.02] rounded-2xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">No promo videos available</p>
            </div>
        );
    }

    const v = videos[index];
    const glowColor = color.startsWith('var(')
        ? 'rgba(var(--color-neon-rgb, 57, 255, 20), 0.45)'
        : `${color}66`;

    return (
        <div className="relative w-full max-w-6xl mx-auto h-[400px] sm:h-[600px] flex items-center justify-center overflow-hidden">
            {/* Nav Arrows */}
            {videos.length > 1 && (
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 z-20">
                    <button onClick={prevStep} className="p-3 sm:p-4 rounded-full bg-black/40 border border-white/10 backdrop-blur-md hover:bg-white hover:text-black transition-all group scale-75 sm:scale-100">
                        <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-active:-translate-x-1" />
                    </button>
                    <button onClick={nextStep} className="p-3 sm:p-4 rounded-full bg-black/40 border border-white/10 backdrop-blur-md hover:bg-white hover:text-black transition-all group scale-75 sm:scale-100">
                        <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 rotate-180 transition-transform group-active:translate-x-1" />
                    </button>
                </div>
            )}

            <AnimatePresence initial={false} custom={direction}>
                <motion.div key={index} custom={direction} variants={variants} initial="enter" animate="center" exit="exit"
                    transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.4 }, scale: { duration: 0.4 } }}
                    className="absolute w-full h-full flex items-center justify-center will-change-transform">

                    <div className="relative w-full h-full group/card p-4">
                        <div className="absolute inset-0 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.4)]"
                            style={{
                                clipPath: index % 2 === 0 ? 'polygon(8% 0, 100% 0, 92% 100%, 0 100%)' : 'polygon(0 0, 92% 0, 100% 100%, 8% 100%)',
                                background: '#0a0a14',
                                border: `${cardBorderWidth}px solid ${color}`,
                            }}>

                            {showSideAccents && (
                                <>
                                    <div className="absolute left-0 top-[10%] bottom-[10%] w-[3px] z-30" style={{ background: `linear-gradient(to bottom, transparent, ${color}, transparent)` }} />
                                    <div className="absolute right-0 top-[10%] bottom-[10%] w-[3px] z-30" style={{ background: `linear-gradient(to bottom, transparent, ${color}, transparent)` }} />
                                </>
                            )}

                            {/* Mobile Layout */}
                            <div className="md:hidden relative w-full h-full flex flex-col">
                                <div className="relative h-[60%] w-full overflow-hidden">
                                    <img src={v.thumbnail || v.thumb} alt={v.title} className="w-full h-full object-cover opacity-60" />
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0a14] z-10" />
                                    <div
                                        onClick={() => onPlay(v.url)}
                                        className="absolute inset-0 flex items-center justify-center z-20 cursor-pointer">
                                        <div className="p-5 rounded-full border border-white/20 bg-white/5 backdrop-blur-md">
                                            <Play className="w-8 h-8 fill-current" style={{ color }} />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-white/[0.02] border-t border-white/5 relative z-20">
                                    <h3 className="text-xl sm:text-2xl font-black text-white italic uppercase tracking-tighter leading-tight mb-2">
                                        {v.title}
                                    </h3>
                                </div>
                            </div>

                            {/* Desktop Layout */}
                            <div className="hidden md:block relative w-full h-full">
                                <div className="absolute inset-0 z-0 overflow-hidden"
                                    style={{ clipPath: index % 2 === 0 ? 'polygon(0 0, 55% 0, 47% 100%, 0 100%)' : 'polygon(0 0, 55% 0, 63% 100%, 0 100%)' }}>
                                    <img src={v.thumbnail || v.thumb} alt={v.title} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover/card:scale-105 transition-transform duration-1000" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80" />
                                </div>
                                <div className="absolute inset-0 z-0 bg-white/[0.02]"
                                    style={{ clipPath: index % 2 === 0 ? 'polygon(55% 0, 100% 0, 100% 100%, 47% 100%)' : 'polygon(55% 0, 100% 0, 100% 100%, 63% 100%)' }} />

                                <div className="absolute inset-0 flex z-20">
                                    <div className="relative w-[50%] h-full flex items-center justify-center pointer-events-none">
                                        <div
                                            onClick={() => onPlay(v.url)}
                                            className="pointer-events-auto p-6 rounded-full border border-white/20 bg-white/5 backdrop-blur-md cursor-pointer hover:scale-110 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.1)]"
                                            style={{ boxShadow: `0 0 40px ${color}20` }}>
                                            <Play className="w-10 h-10 fill-current" style={{ color }} />
                                        </div>
                                    </div>
                                    <div className="relative flex-1 h-full flex flex-col items-center justify-center text-center px-12 pt-8 pointer-events-auto">
                                        <h3 className="text-4xl lg:text-5xl font-black text-white italic uppercase tracking-tighter leading-none mb-6">
                                            {v.title}
                                        </h3>
                                        <button
                                            onClick={() => onPlay(v.url)}
                                            className="px-10 py-4 rounded-sm border border-white/10 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-white hover:text-black transition-all">
                                            Watch Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Dedicated outline layer keeps border visible over all inner content */}
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                clipPath: index % 2 === 0 ? 'polygon(8% 0, 100% 0, 92% 100%, 0 100%)' : 'polygon(0 0, 92% 0, 100% 100%, 8% 100%)',
                                border: `${cardBorderWidth}px solid ${color}`,
                                boxShadow: `0 0 18px ${glowColor}`,
                            }}
                        />
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Indicators */}
            {videos.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                    {videos.map((_, i) => (
                        <button key={i} onClick={() => setIndex(i)}
                            className="h-1.5 rounded-full transition-all duration-500"
                            style={{
                                width: i === index ? '40px' : '10px',
                                backgroundColor: i === index ? color : 'rgba(255,255,255,0.1)',
                                boxShadow: i === index ? `0 0 15px ${color}` : 'none'
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
});
VideoCarousel.displayName = 'VideoCarousel';

// ─── Event Reels Section ──────────────────────────────────────────────────────
export const EventReelsSection = memo(({ videos, color, branchName, onPlay }: { videos: any[]; color: string; branchName: string; onPlay: (url: string) => void }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const isHoveringRef = useRef(false);

    const scrollCarousel = (direction: 'left' | 'right') => {
        const el = scrollRef.current;
        if (!el) return;
        const cardWidth = 436;
        const { scrollLeft, scrollWidth, clientWidth } = el;
        if (direction === 'right') {
            if (scrollLeft + clientWidth >= scrollWidth - 10) {
                el.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                el.scrollTo({ left: scrollLeft + cardWidth, behavior: 'smooth' });
            }
        } else {
            if (scrollLeft <= 10) {
                el.scrollTo({ left: scrollWidth, behavior: 'smooth' });
            } else {
                el.scrollTo({ left: scrollLeft - cardWidth, behavior: 'smooth' });
            }
        }
    };

    useEffect(() => {
        if (videos.length === 0) return;
        const interval = setInterval(() => {
            if (!isHoveringRef.current) {
                scrollCarousel('right');
            }
        }, 3500);
        return () => clearInterval(interval);
    }, [videos.length]);

    const displayItems = videos.length > 0 ? (videos.length < 5 ? [...videos, ...videos, ...videos] : [...videos, ...videos]) : [];

    return (
        <section className="relative z-10 px-0 pb-20">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="flex flex-col mb-8 sm:mb-12 px-6 sm:px-10">
                <div className="flex items-center gap-2 sm:gap-4 mb-2">
                    <div className="h-px w-8 sm:w-16 bg-gradient-to-r from-transparent to-[var(--color-neon)]/40" style={{ background: `linear-gradient(90deg, transparent, ${color}40)` }} />
                    <span className="text-[8px] sm:text-[10px] tracking-[0.4em] sm:tracking-[0.6em] font-black uppercase" style={{ color }}>Event Archive</span>
                </div>
                <div className="flex items-center justify-between w-full">
                    <h2 className="text-3xl sm:text-4xl font-black tracking-widest text-white uppercase drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]" style={{ textShadow: `0 0 20px ${color}40` }}>EVENT REELS</h2>
                    <div className="hidden sm:flex gap-2 sm:gap-3">
                        <button onClick={() => scrollCarousel('left')} className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white rotate-180" />
                        </button>
                        <button onClick={() => scrollCarousel('right')} className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </button>
                    </div>
                </div>
            </motion.div>

            <div className="relative group/carousel">
                <style>{`
                    .promo-scroll::-webkit-scrollbar { display: none; }
                    .promo-mask { mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent); }
                `}</style>
                <div ref={scrollRef} onMouseEnter={() => { isHoveringRef.current = true; }} onMouseLeave={() => { isHoveringRef.current = false; }} className="promo-scroll promo-mask flex gap-4 overflow-x-auto pb-6 pt-2 px-10 scroll-smooth" style={{ scrollbarWidth: 'none' }}>
                    {displayItems.map((video, i) => (
                        <div key={i} onClick={() => onPlay(video.url)} className="group flex-none w-[280px] sm:w-[420px] relative cursor-pointer will-change-transform">
                            <div className="relative flex h-[175px] overflow-hidden transition-all duration-300 group-hover:-translate-y-1" style={{ background: '#11111a', border: `1px solid ${color}30`, borderRadius: '8px' }}>
                                <div className="w-[6px] h-full flex-shrink-0" style={{ background: color }} />
                                <div className="flex flex-col justify-between py-5 pl-5 pr-3 flex-1 min-w-0">
                                    <div>
                                        <span className="inline-block text-[7px] font-black tracking-widest uppercase mb-1 px-2 py-0.5" style={{ background: color, color: '#000' }}>{branchName}</span>
                                        <h3 className="text-lg font-black text-white uppercase tracking-tight leading-tight line-clamp-2">{video.title}</h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-3 rounded-full" style={{ background: color }} />
                                        <p className="text-[10px] font-black text-white/40 tracking-widest uppercase">Active Feed</p>
                                    </div>
                                </div>
                                <div className="relative w-[120px] sm:w-[150px] overflow-hidden">
                                    <img src={video.thumbnail || video.thumb} alt={video.title} className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-all duration-700" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center border-2" style={{ background: `${color}20`, borderColor: color }}>
                                            <Play className="w-4 h-4 fill-current ml-0.5" style={{ color }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
});
EventReelsSection.displayName = 'EventReelsSection';

// ─── Video Modal ──────────────────────────────────────────────────────────────
export const VideoModal = ({ url, onClose }: { url: string; onClose: () => void }) => {
    const getYouTubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const youtubeId = getYouTubeId(url);
    const embedUrl = youtubeId
        ? `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&mute=1&rel=0&modestbranding=1`
        : url;
    const isDirectEmbeddable = /^https?:\/\//i.test(url);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-10">
            <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors z-[510] p-4">
                <X className="w-8 h-8" />
            </button>
            <div className="w-full max-w-6xl aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                {isDirectEmbeddable ? (
                    <iframe
                        src={embedUrl}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center px-6 text-center">
                        <div className="max-w-xl">
                            <p className="text-sm sm:text-base text-white/80 mb-4">This video cannot be embedded in the browser due to provider restrictions.</p>
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block px-5 py-2 border border-white/30 text-white text-xs font-black tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-all"
                            >
                                Open Video
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
