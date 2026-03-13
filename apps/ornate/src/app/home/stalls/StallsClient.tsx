'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight, Star, Wallet, Sparkles, ExternalLink, MessageSquare, Home } from 'lucide-react';
import StallsFooter from '@/components/stalls/StallsFooter';
import { SectionHeader, VideoCarousel, EventReelsSection, VideoModal } from '@/components/ui/VideoSections';
import { StallPromoVideoData } from '@/lib/data/stalls';
import SectorHeader from '@/components/layout/SectorHeader';

const STALL_IMAGES: Record<string, string> = {
    food: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80',
    dessert: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80',
    cafe: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80',
    lifestyle: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&q=80',
};

const StallCard = memo(({ stall, idx, isMounted }: { stall: any, idx: number, isMounted: boolean }) => {
    const glow = stall.color;
    const imgSrc = STALL_IMAGES[stall.type] ?? STALL_IMAGES.food;
    const ratingFilled = Math.round(parseFloat(stall.rating));

    return (
        <Link href={`/home/stalls/${stall.id}`} className="block group">
            <div style={{ filter: `drop-shadow(0 0 10px ${glow}44)` }}>
                <motion.div
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    whileHover={{ y: -6 }}
                    transition={{ duration: 0.38, delay: idx * 0.04, ease: 'easeOut' }}
                    className="relative flex flex-col font-rajdhani overflow-hidden"
                    style={{
                        background: 'linear-gradient(155deg, #0a0a10 0%, #06060c 60%, #040408 100%)',
                        border: `1px solid ${glow}80`,
                    }}
                >
                    {/* ── Animated top glow bar ── */}
                    <div
                        className="absolute top-0 left-0 w-full h-[2px] z-20 opacity-40 group-hover:opacity-100 transition-opacity duration-500"
                        style={{ background: `linear-gradient(90deg, transparent 0%, ${glow} 40%, ${glow} 60%, transparent 100%)` }}
                    />

                    {/* ── Scanlines ── */}
                    <div
                        className="absolute inset-0 pointer-events-none z-10 opacity-30"
                        style={{
                            backgroundImage: `repeating-linear-gradient(0deg, ${glow}0d 0px, ${glow}0d 1px, transparent 1px, transparent 4px)`,
                        }}
                    />

                    {/* ── HUD corner marks ── */}
                    {/* TL */}
                    <div className="absolute top-0 left-0 w-5 h-5 z-20 pointer-events-none">
                        <div className="absolute top-0 left-0 w-5 h-[1.5px] opacity-50 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: glow }} />
                        <div className="absolute top-0 left-0 w-[1.5px] h-5 opacity-50 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: glow }} />
                    </div>
                    {/* TR */}
                    <div className="absolute top-0 right-0 w-5 h-5 z-20 pointer-events-none">
                        <div className="absolute top-0 right-0 w-5 h-[1.5px] opacity-50 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: glow }} />
                        <div className="absolute top-0 right-0 w-[1.5px] h-5 opacity-50 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: glow }} />
                    </div>
                    {/* BR */}
                    <div className="absolute bottom-0 right-0 w-5 h-5 z-20 pointer-events-none">
                        <div className="absolute bottom-0 right-0 w-5 h-[1.5px] opacity-50 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: glow }} />
                        <div className="absolute bottom-0 right-0 w-[1.5px] h-5 opacity-50 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: glow }} />
                    </div>
                    {/* BL */}
                    <div className="absolute bottom-0 left-0 w-5 h-5 z-20 pointer-events-none">
                        <div className="absolute bottom-0 left-0 w-5 h-[1.5px] opacity-50 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: glow }} />
                        <div className="absolute bottom-0 left-0 w-[1.5px] h-5 opacity-50 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: glow }} />
                    </div>

                    {/* ── IMAGE BANNER ── */}
                    <div className="relative w-full h-52 overflow-hidden shrink-0">
                        <div className="absolute inset-0" style={{ background: `linear-gradient(145deg, #040408 0%, ${glow}1a 100%)` }} />
                        {isMounted && (
                            <Image
                                src={imgSrc}
                                alt={stall.name}
                                fill
                                sizes="(max-width: 768px) 50vw, 25vw"
                                className="object-cover opacity-60 group-hover:opacity-85 group-hover:scale-105 transition-all duration-700"
                            />
                        )}
                        {/* Hard bottom fade */}
                        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#040408] via-[#040408]/70 to-transparent" />

                        {/* Type badge bottom-left */}
                        <div className="absolute bottom-3 left-4 z-10">
                            <div
                                className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-black tracking-[0.22em] uppercase backdrop-blur-sm"
                                style={{
                                    clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)',
                                    background: `${glow}18`,
                                    border: `1px solid ${glow}55`,
                                    color: glow,
                                    boxShadow: `0 0 10px ${glow}33`,
                                }}
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                {stall.type.toUpperCase()}
                            </div>
                        </div>

                        {/* Rating dots — bottom-right of image */}
                        <div className="absolute bottom-3 right-4 flex items-center gap-1 z-10">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="w-2.5 h-2.5 rounded-full transition-all duration-300"
                                    style={{
                                        background: i < ratingFilled ? glow : '#ffffff15',
                                        boxShadow: i < ratingFilled ? `0 0 4px ${glow}` : 'none',
                                    }}
                                />
                            ))}
                            <span className="text-[12px] font-black ml-1.5" style={{ color: glow }}>{stall.rating}</span>
                        </div>
                    </div>

                    {/* ── CARD BODY ── */}
                    <div className="flex flex-col px-5 pt-3 pb-1 gap-1 relative z-10">
                        {/* Stall name + number inline */}
                        <div className="flex items-center gap-2">
                            <h3
                                className="text-xl sm:text-2xl font-black tracking-wider uppercase leading-tight transition-colors duration-300"
                                style={{ color: glow }}
                            >
                                {stall.name} <span className="ml-1 opacity-60 text-sm">#{stall.no}</span>
                            </h3>
                        </div>

                        <p className="text-sm text-gray-300 leading-relaxed font-semibold line-clamp-2">
                            {stall.description}
                        </p>
                    </div>

                    {/* Data Readouts (Team, Price, Rating) */}
                    <div className="px-5 grid grid-cols-3 gap-2 sm:gap-3 py-2">
                        <div className="bg-[#121814] border border-white/5 p-2.5 flex flex-col">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Squad</span>
                            <span className="text-[var(--color-neon)] font-black text-sm tracking-wider" style={{ color: stall.color }}>T-{stall.team}</span>
                        </div>
                        <div className="bg-[#121814] border border-white/5 p-2.5 flex flex-col">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Budget</span>
                            <span className="text-white font-black text-sm tracking-wider">₹{stall.price}</span>
                        </div>
                        <div className="bg-[#121814] border border-white/5 p-2.5 flex flex-col">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Rating</span>
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-current" style={{ color: stall.color }} />
                                <span className="text-white font-black text-[15px] tracking-wider">{stall.rating}</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Action Area */}
                    <div className="px-5 pt-2 pb-3 sm:pb-4 h-10 sm:h-13 bg-gradient-to-t from-[#0D140F] to-transparent flex items-center justify-between z-10 mt-1">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                window.location.href = `/home/stalls/${stall.id}?panel=reviews`;
                            }}
                            className="flex items-center gap-2 group/review cursor-pointer"
                        >
                            <span className="text-xs font-black text-white/40 group-hover/review:text-white transition-colors uppercase tracking-[0.2em]">Add Review</span>
                            <div className="w-9 h-9 flex items-center justify-center bg-[#1A251E] border border-white/10 group-hover/review:bg-[var(--color-neon)] group-hover/review:text-black transition-all">
                                <MessageSquare className="w-4 h-4" />
                            </div>
                        </button>
                        <div className="flex items-center gap-2 group/btn">
                            <span className="text-xs font-black text-white/40 group-hover/btn:text-white transition-colors uppercase tracking-[0.2em]">View Details</span>
                            <div className="w-9 h-9 flex items-center justify-center bg-[#1A251E] border border-white/10 group-hover/btn:bg-[var(--color-neon)] group-hover/btn:text-black transition-all">
                                <ExternalLink className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    {/* ── Ambient inner glow on hover ── */}
                    <div
                        className="absolute inset-0 pointer-events-none z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{ background: `radial-gradient(ellipse at 50% 0%, ${glow}10 0%, transparent 70%)` }}
                    />
                </motion.div>
            </div>
        </Link>
    );
});

StallCard.displayName = "StallCard";

export default function StallsClient({ stalls: STALLS, promoVideos = [] }: { stalls: any[], promoVideos?: StallPromoVideoData[] }) {
    const [mounted, setMounted] = useState(false);
    const [bubbles, setBubbles] = useState<any[]>([]);
    const [playingVideo, setPlayingVideo] = useState<string | null>(null);

    const promoHighlights = promoVideos?.filter(v => v.category?.toUpperCase() === 'PROMO') || [];
    const eventReels = promoVideos?.filter(v => v.category?.toUpperCase() === 'VIDEO') || [];

    const handlePlay = (url: string) => setPlayingVideo(url);

    useEffect(() => {
        setMounted(true);
        const newBubbles = [...Array(8)].map((_, i) => ({
            id: i,
            x: Math.random() * 100 + "%",
            y: Math.random() * 100 + "%",
            size: 50 + Math.random() * 150 + "px",
            duration: 20 + Math.random() * 20,
            targetX: [(Math.random() * 100) + "%", (Math.random() * 100) + "%", (Math.random() * 100) + "%"],
            targetY: [(Math.random() * 100) + "%", (Math.random() * 100) + "%", (Math.random() * 100) + "%"]
        }));
        setBubbles(newBubbles);
    }, []);

    return (
        <main className="relative min-h-screen bg-[#030308] font-orbitron text-white overflow-x-hidden pt-0 pb-12 selection:bg-[var(--color-neon)]/30">

            {/* Enhanced Atmospheric Backdrop */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                {/* primary deep space glow */}
                <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-[var(--color-neon)]/10 blur-[150px] rounded-full animate-pulse" />

                {/* secondary drifting nebula */}
                <motion.div
                    animate={{
                        x: [0, 50, 0],
                        y: [0, 30, 0],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                    className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[var(--color-neon)]/10 blur-[180px] rounded-full"
                />

                {/* tertiary accent glow */}
                <motion.div
                    animate={{
                        x: [0, -40, 0],
                        y: [0, -60, 0],
                        opacity: [0.05, 0.15, 0.05]
                    }}
                    transition={{ repeat: Infinity, duration: 18, ease: "easeInOut" }}
                    className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-[#A3FF12]/5 blur-[120px] rounded-full"
                />

                {/* Floating Bubbles Layer */}
                {mounted && bubbles.map((bubble) => (
                    <motion.div
                        key={bubble.id}
                        initial={{
                            x: bubble.x,
                            y: bubble.y,
                            opacity: 0,
                            scale: 0.5
                        }}
                        animate={{
                            x: bubble.targetX,
                            y: bubble.targetY,
                            opacity: [0.1, 0.3, 0.1],
                            scale: [1, 1.2, 1]
                        }}
                        transition={{
                            duration: bubble.duration,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        className="absolute rounded-full border border-white/10 will-change-transform"
                        style={{
                            width: bubble.size,
                            height: bubble.size,
                            background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.05), transparent)`
                        }}
                    />
                ))}

                {/* Deep background color layer */}
                <div className="absolute inset-0 bg-[#030308]/60 backdrop-blur-[20px]" />
            </div>

            <SectorHeader 
                showTitle={false}
            />

            <div className="relative z-10 max-w-7xl mx-auto px-6 space-y-32">

            <div className="mt-24 text-center mb-24 relative">
                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-[var(--color-neon)] to-transparent"
                />
                <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter uppercase leading-[0.9] drop-shadow-2xl text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-neon)] via-[#BDFF00] to-white mb-6">
                    EVENT STALLS
                </h1>
                <p className="mt-6 text-gray-500 font-mono tracking-[0.5em] uppercase text-xs flex items-center justify-center gap-4">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-neon)] animate-pulse" />
                    EVENT STALLS REGISTRY
                    <span className="w-2 h-2 rounded-full bg-[var(--color-neon)] animate-pulse" />
                </p>
            </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-24 relative z-10">
                    {STALLS.map((stall, idx) => (
                        <StallCard key={stall.id} stall={stall} idx={idx} isMounted={mounted} />
                    ))}
                </div>

            <AnimatePresence>
                {playingVideo && (
                    <VideoModal url={playingVideo} onClose={() => setPlayingVideo(null)} />
                )}
            </AnimatePresence>



            {eventReels.length > 0 && (
                <div className="w-full relative z-10">
                    <EventReelsSection
                        videos={eventReels}
                        color="#BDFF00"
                        branchName="STALLS"
                        onPlay={handlePlay}
                    />
                </div>
            )}

            {/* The Huge Stall Footer */}

            </div>

            <StallsFooter />
        </main >
    );
}
