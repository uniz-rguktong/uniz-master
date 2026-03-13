'use client';

import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import dynamic from 'next/dynamic';
import { type AlbumData } from '@/lib/data/gallery';
import { type PromoVideoData, type MatchData } from '@/lib/data/sports';

const DomeGallery = dynamic(() => import('@/components/ui/DomeGallery'), { ssr: false });

interface HighlightsProps {
    liveScores?: any[];
    todaysMatches?: MatchData[];
    sportsAlbums?: AlbumData[];
}

export const HighlightsSection = memo(({ liveScores, todaysMatches, sportsAlbums = [] }: HighlightsProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [galleryTitle, setGalleryTitle] = useState('');

    // Compute unique days from matches
    const allDays = useMemo(() => {
        const daysRaw = (todaysMatches || [])
            .map(m => m.date)
            .filter(Boolean)
            .map(d => {
                const date = new Date(d!);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            });
        const uniqueDays = Array.from(new Set(daysRaw));
        return uniqueDays.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    }, [todaysMatches]);

    const initialDay = useMemo(() => {
        if (allDays.length > 0) return allDays[0];
        return null;
    }, [allDays]);

    const [selectedDay, setSelectedDay] = useState<string | null>(null);

    // Initial sync
    useEffect(() => {
        if (!selectedDay && initialDay) {
            setSelectedDay(initialDay);
        }
    }, [initialDay, selectedDay]);

    // Convert live scores to highlight format
    const liveItems = (liveScores || []).map(s => ({
        title: `${s.team1} vs ${s.team2}`,
        time: s.status === 'LIVE' ? 'LIVE' : 'RECENT',
        loc: s.venue || 'ARENA',
        desc: `${s.sport}: ${s.round} - Score: ${s.score1 ?? 0} : ${s.score2 ?? 0}`,
        tag: 'LIVE FEED',
        xp: 1000
    }));

    // Filter and Convert today's matches to highlight format based on selected day
    const todayItems = (todaysMatches || [])
        .filter(m => {
            if (!m.date) return false;
            const dateStr = new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            return selectedDay ? dateStr === selectedDay : true;
        })
        .map(m => {
            return {
                title: `${m.team1Name} vs ${m.team2Name}`,
                time: m.time || 'TBD',
                loc: m.venue || 'TBD',
                desc: `${m.sportName} - ${m.round}`,
                tag: `${m.sportName || 'SPORT'} SLOT`,
                xp: 300,
                id: m.id,
            };
        });

    const coreItems = todayItems;

    const displayItems = [...liveItems, ...coreItems, ...liveItems, ...coreItems];

    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer || isHovered) return;
        let animationFrameId: number;
        const scroll = () => {
            if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth / 2) {
                scrollContainer.scrollLeft = 0;
            } else { scrollContainer.scrollLeft += 0.8; }
            animationFrameId = requestAnimationFrame(scroll);
        };
        animationFrameId = requestAnimationFrame(scroll);
        return () => cancelAnimationFrame(animationFrameId);
    }, [isHovered, displayItems.length]);

    return (
        <section className="relative z-10 px-4 sm:px-10 pb-12 sm:pb-20">
            {/* DomeGallery Modal */}
            <AnimatePresence>
                {galleryOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-xl flex flex-col items-center justify-center"
                    >
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center pointer-events-none">
                            <p className="text-[10px] text-amber-400 font-black tracking-[0.6em] uppercase mb-1">Sports Gallery</p>
                            <h3 className="text-2xl font-black text-white tracking-widest uppercase">{galleryTitle}</h3>
                        </div>
                        <button
                            onClick={() => setGalleryOpen(false)}
                            className="absolute top-4 right-4 sm:top-8 sm:right-10 z-[210] p-3 sm:px-5 sm:py-3 rounded-full border border-white/20 text-white hover:text-amber-400 hover:border-amber-400 transition-all font-black uppercase backdrop-blur-md flex items-center justify-center cursor-pointer"
                        >
                            <span className="hidden sm:inline text-xs tracking-[0.3em]">Close</span>
                            <X className="sm:hidden size-5" />
                        </button>
                        <div className="w-full h-full">
                            <DomeGallery
                                images={sportsAlbums.length > 0 ? sportsAlbums.flatMap(a => a.images.map(img => img.url)) : []}
                                grayscale={false}
                                openedImageWidth="500px"
                                openedImageHeight="500px"
                                imageBorderRadius="20px"
                                openedImageBorderRadius="20px"
                                fit={0.52}
                                overlayBlurColor="#030308"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex flex-col items-start mb-8 sm:mb-12 px-6 sm:px-10"
            >
                <div className="flex items-center gap-6 mb-6">
                    <div className="w-3 h-10 bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.4)]" />
                    <div className="flex flex-col items-start">
                        <h2 className="text-4xl sm:text-5xl font-black tracking-[0.1em] text-white uppercase italic leading-none">
                            MATCH <span className="text-amber-400">HIGHLIGHTS</span>
                        </h2>
                        <p className="text-[10px] text-white/40 tracking-[0.4em] uppercase mt-2 font-black">
                            Active Sports Schedule & Live Protocol
                        </p>
                    </div>
                </div>

                {allDays.length > 0 && (
                    <div className="flex flex-wrap items-center gap-3">
                        {allDays.map(day => (
                            <button
                                key={day}
                                onClick={() => setSelectedDay(day)}
                                className={`px-4 py-2 rounded border text-[10px] sm:text-xs font-black tracking-widest uppercase transition-all duration-300 ${
                                    selectedDay === day
                                        ? 'bg-amber-400/20 border-amber-400 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white hover:border-white/30'
                                }`}
                            >
                                {day}
                            </button>
                        ))}
                    </div>
                )}
            </motion.div>

            <div className="relative group/scroll px-4">
                <style>{`
                    .custom-h-scroll::-webkit-scrollbar { height: 2px; }
                    .custom-h-scroll::-webkit-scrollbar-track { background: rgba(251,191,36, 0.02); }
                    .custom-h-scroll::-webkit-scrollbar-thumb { background: rgba(251,191,36, 0.2); border-radius: 10px; }
                    .mask-fade-edges { mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent); }
                `}</style>
                <div ref={scrollRef} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}
                    className="custom-h-scroll flex gap-6 overflow-x-auto pb-8 pt-4 mask-fade-edges scroll-smooth"
                >
                    {displayItems.map((item, i) => (
                        <div
                            key={i}
                            className="flex-none w-[280px] group relative"
                        >
                            <div className="relative flex flex-col p-6 h-full overflow-hidden transition-all duration-500 group-hover:shadow-[0_0_40px_rgba(251,191,36,0.15)]"
                                style={{ background: 'rgba(15, 15, 30, 0.7)', border: '1.5px solid rgba(251,191,36, 0.3)', clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)', backdropFilter: 'blur(16px)' }}
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <span className="block text-[8px] text-white/45 tracking-[0.3em] font-black uppercase mb-1">Time</span>
                                        <span className="text-[11px] font-black text-amber-400 tracking-[0.08em] uppercase">{item.time} HRS</span>
                                    </div>

                                </div>

                                <h3 className="text-lg font-black text-white tracking-wide mb-5 uppercase leading-tight font-orbitron line-clamp-2">{item.title}</h3>

                                <div className="flex items-center gap-2 mb-5 px-3 py-2 bg-white/[0.06] border border-white/12">
                                    <div className="w-1 h-4 bg-amber-400" />
                                    <div className="flex flex-col">
                                        <span className="text-[7px] text-white/45 font-black tracking-[0.24em] uppercase">Venue</span>
                                        <span className="text-[11px] text-white font-black tracking-[0.08em] uppercase">{item.loc}</span>
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

HighlightsSection.displayName = 'HighlightsSection';

const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

export const SportsPromoCardsCarousel = memo(({ videos, color, onPlay }: { videos: PromoVideoData[]; color: string; onPlay: (url: string) => void }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const isHoveringRef = useRef(false);

    const scrollCarousel = (direction: 'left' | 'right') => {
        const el = scrollRef.current;
        if (!el) return;
        const cardWidth = window.innerWidth < 640 ? 308 : 420;
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
        if (videos.length <= 1) return;
        const interval = setInterval(() => {
            if (!isHoveringRef.current) {
                scrollCarousel('right');
            }
        }, 4200);
        return () => clearInterval(interval);
    }, [videos.length]);

    const displayItems = videos.length > 0 ? (videos.length < 4 ? [...videos, ...videos] : [...videos]) : [];

    return (
        <section className="relative z-10 mt-10">
            <div className="flex items-center justify-between px-2 sm:px-0 mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-[2px]" style={{ background: color }} />
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.35em]" style={{ color }}>MORE PROMO FEEDS</span>
                </div>
                {videos.length > 1 && (
                    <div className="hidden sm:flex gap-2">
                        <button onClick={() => scrollCarousel('left')} className="w-10 h-10 rounded-md border border-white/20 bg-black/30 flex items-center justify-center hover:bg-white/10 transition-all">
                            <ChevronLeft className="w-4 h-4 text-white" />
                        </button>
                        <button onClick={() => scrollCarousel('right')} className="w-10 h-10 rounded-md border border-white/20 bg-black/30 flex items-center justify-center hover:bg-white/10 transition-all">
                            <ChevronRight className="w-4 h-4 text-white" />
                        </button>
                    </div>
                )}
            </div>

            <div className="relative">
                <style>{`
                    .sports-promo-scroll::-webkit-scrollbar { display: none; }
                    .sports-promo-mask { mask-image: linear-gradient(to right, transparent, black 6%, black 94%, transparent); }
                `}</style>
                <div
                    ref={scrollRef}
                    onMouseEnter={() => { isHoveringRef.current = true; }}
                    onMouseLeave={() => { isHoveringRef.current = false; }}
                    className="sports-promo-scroll sports-promo-mask flex gap-4 sm:gap-6 overflow-x-auto pb-2 pt-1 px-1 sm:px-0 scroll-smooth"
                    style={{ scrollbarWidth: 'none' }}
                >
                    {displayItems.map((video, i) => {
                        const youtubeId = getYouTubeId(video.url);
                        return (
                            <div key={`${video.url}-${i}`} className="group flex-none w-[300px] sm:w-[410px]">
                                <div className="relative overflow-hidden rounded-md border-[2.5px] shadow-[0_0_30px_rgba(0,0,0,0.4)]" style={{ borderColor: color, background: '#0a0a14' }}>
                                    <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
                                    <div className="absolute left-0 top-[10%] bottom-[10%] w-[3px] z-20" style={{ background: `linear-gradient(to bottom, transparent, ${color}, transparent)` }} />
                                    <div className="absolute right-0 top-[10%] bottom-[10%] w-[3px] z-20" style={{ background: `linear-gradient(to bottom, transparent, ${color}, transparent)` }} />
                                    <div className="aspect-video relative">
                                        {youtubeId ? (
                                            <iframe
                                                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=0&modestbranding=1&rel=0`}
                                                className="w-full h-full"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                title={video.title}
                                            />
                                        ) : (
                                            <img src={video.thumbnail || 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200&q=80'} alt={video.title} className="w-full h-full object-cover opacity-80" />
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-t border-white/10 bg-black/40">
                                        <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.18em] text-white line-clamp-1">{video.title}</h3>
                                        <button
                                            onClick={() => onPlay(video.url)}
                                            className="text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 border border-white/25 hover:bg-white hover:text-black transition-all"
                                        >
                                            Play Audio
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
});

SportsPromoCardsCarousel.displayName = 'SportsPromoCardsCarousel';
