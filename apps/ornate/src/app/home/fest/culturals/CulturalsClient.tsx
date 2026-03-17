'use client';

import { useEffect, useRef, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, ArrowLeft, Mic2, Palette, Theater, Camera, Languages, Radio, Zap, ChevronRight, ChevronLeft, ChevronDown, Star, Rocket, Sparkles, Play } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const DomeGallery = dynamic(() => import('@/components/ui/DomeGallery'), { ssr: false });
const CircularGallery = dynamic(() => import('@/components/ui/CircularGallery'), { ssr: false });
const ScrollMorphHero = dynamic(() => import('@/components/ui/scroll-morph-hero'), { ssr: false });
import CulturalsFooter from '@/components/culturals/CulturalsFooter';
import { AlbumData, PromoVideoData } from '@/lib/data/gallery';
import { SectionHeader, VideoCarousel, EventReelsSection, VideoModal } from '@/components/ui/VideoSections';
import CulturalsEmptyState from '@/components/culturals/CulturalsEmptyState';

// ─── Starfield canvas (Optimized & Memoized) ───────────────────────────────
const StarField = memo(() => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        let raf: number;
        let lastFrame = 0;
        const FPS = 30;
        const INTERVAL = 1000 / FPS;
        const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        resize();
        window.addEventListener('resize', resize, { passive: true });

        const stars = Array.from({ length: 150 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 1.4 + 0.3,
            a: Math.random(),
            speed: Math.random() * 0.004 + 0.001,
            twinkle: Math.random() * Math.PI * 2,
        }));

        const loop = (ts: number) => {
            raf = requestAnimationFrame(loop);
            if (ts - lastFrame < INTERVAL) return;
            lastFrame = ts;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (const s of stars) {
                s.twinkle += s.speed;
                s.a = 0.3 + Math.sin(s.twinkle) * 0.5;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${Math.max(0, s.a)})`;
                ctx.fill();
            }
        };
        raf = requestAnimationFrame(loop);
        return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
    }, []);
    return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 opacity-40" />;
});
StarField.displayName = 'StarField';

// ─── Floating particles (CSS-only for Zero JS cost) ──────────────────────────
const Particles = memo(() => {
    return (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            <style>{`
                @keyframes floatUp { 0%,100%{transform:translateY(0) scale(1);opacity:.1} 50%{transform:translateY(-40px) scale(1.6);opacity:.4} }
                .cp { position:absolute; width:4px; height:4px; border-radius:50%; animation: floatUp var(--d) var(--dl) ease-in-out infinite; will-change: transform, opacity; }
            `}</style>
            {[
                { left: '8%', top: '20%', color: '#22d3ee', d: '5s', dl: '0s' },
                { left: '25%', top: '60%', color: 'var(--color-neon)', d: '7s', dl: '1.2s' },
                { left: '45%', top: '35%', color: '#fbbf24', d: '6s', dl: '0.4s' },
                { left: '62%', top: '75%', color: '#22d3ee', d: '8s', dl: '2s' },
                { left: '78%', top: '15%', color: 'var(--color-neon)', d: '5.5s', dl: '0.8s' },
                { left: '90%', top: '50%', color: '#fbbf24', d: '6.5s', dl: '1.5s' },
                { left: '15%', top: '85%', color: '#22d3ee', d: '7.5s', dl: '0.3s' },
                { left: '55%', top: '90%', color: 'var(--color-neon)', d: '5s', dl: '2.5s' },
            ].map((p, i) => (
                <div key={i} className="cp" style={{ left: p.left, top: p.top, background: p.color, ['--d' as any]: p.d, ['--dl' as any]: p.dl }} />
            ))}
        </div>
    );
});
Particles.displayName = 'Particles';


// ─── Case Accents ──────────────────────────────────────────────────────────
const HudLabel = memo(({ label, value, color = '#22d3ee' }: { label: string; value: string; color?: string }) => {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[7px] tracking-[0.4em] uppercase font-bold" style={{ color: color + '80' }}>{label}</span>
            <span className="text-[11px] font-black tracking-widest" style={{ color }}>{value}</span>
        </div>
    );
});
HudLabel.displayName = 'HudLabel';

// ─── Cultural Dome Gallery images per album ───────────────────────────────
const CULTURAL_GALLERY_IMAGES = [
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
    'https://images.unsplash.com/photo-1514525253344-991f70cd204d?w=800&q=80',
    'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80',
    'https://images.unsplash.com/photo-1459749411177-042180ce6742?w=800&q=80',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80',
    'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&q=80',
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80',
    'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80',
    'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&q=80',
    'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800&q=80',
    'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800&q=80',
    'https://images.unsplash.com/photo-1563841930606-67e2bce48b78?w=800&q=80',
];

const HighlightsSection = memo(({ events }: { events: any[] }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [galleryTitle, setGalleryTitle] = useState('');

    const highlights = events.filter(event => {
        const today = new Date();
        const eventDate = new Date(event.eventDate);
        return (
            eventDate.getDate() === today.getDate() &&
            eventDate.getMonth() === today.getMonth() &&
            eventDate.getFullYear() === today.getFullYear()
        );
    }).map(event => ({
        title: event.title,
        time: event.time || 'TBD',
        loc: event.venue || 'TBD',
        desc: event.description,
        tag: event.subCategory ? `${event.subCategory}` : 'CULTURAL',
        xp: event.exp
    }));

    // If no highlights today, show all events as highlights for now (or a message)
    const itemsToShow = highlights.length > 0 ? highlights : events.slice(0, 10).map(event => ({
        title: event.title,
        time: event.time || 'TBD',
        loc: event.venue || 'TBD',
        desc: event.description,
        tag: event.subCategory ? `${event.subCategory}` : 'CULTURAL',
        xp: event.exp
    }));

    let itemsToDisplay = [...itemsToShow];
    if (itemsToDisplay.length > 0 && itemsToDisplay.length < 6) {
        while (itemsToDisplay.length < 6) {
            itemsToDisplay = [...itemsToDisplay, ...itemsToShow];
        }
    }

    const displayItems = [...itemsToDisplay, ...itemsToDisplay];

    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer || isHovered) return;

        let animationFrameId: number;
        let lastTimestamp = 0;
        const speed = 0.8;

        const scroll = (timestamp: number) => {
            if (!lastTimestamp) lastTimestamp = timestamp;
            const delta = timestamp - lastTimestamp;
            lastTimestamp = timestamp;

            if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth / 2) {
                scrollContainer.scrollLeft = 0;
            } else {
                scrollContainer.scrollLeft += speed * (delta / 16.66);
            }
            animationFrameId = requestAnimationFrame(scroll);
        };

        animationFrameId = requestAnimationFrame(scroll);
        return () => cancelAnimationFrame(animationFrameId);
    }, [isHovered]);

    return (
        <section className="relative z-10 px-10 pb-32">
            <AnimatePresence>
                {galleryOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-xl flex flex-col items-center justify-center"
                    >
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center pointer-events-none">
                            <p className="text-[10px] text-[var(--color-neon)] font-black tracking-[0.6em] uppercase mb-1">Cultural Gallery</p>
                            <h3 className="text-2xl font-black text-white tracking-widest uppercase">{galleryTitle}</h3>
                        </div>
                        <button
                            onClick={() => setGalleryOpen(false)}
                            className="absolute top-8 right-10 z-[210] px-5 py-3 rounded-full border border-white/20 text-white hover:text-[var(--color-neon)] hover:border-[var(--color-neon)] transition-all text-xs font-black tracking-[0.3em] uppercase backdrop-blur-md"
                        >
                            Close
                        </button>
                        <div className="w-full h-full">
                            <DomeGallery
                                images={CULTURAL_GALLERY_IMAGES}
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
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="flex flex-col items-center mb-12"
            >
                <div className="flex items-center gap-4 mb-4">
                    <div className="h-px w-24 bg-gradient-to-r from-transparent to-[var(--color-neon)]/40" />
                    <span className="text-[10px] text-[var(--color-neon)] tracking-[0.6em] font-black uppercase">Event Overview</span>
                    <div className="h-px w-24 bg-gradient-to-l from-transparent to-[var(--color-neon)]/40" />
                </div>
                <h2 className="text-4xl font-black tracking-widest text-white uppercase drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">TODAY'S HIGHLIGHTS</h2>
                <p className="text-[9px] text-[var(--color-neon)]/40 tracking-[0.3em] font-bold mt-2 uppercase">Discover today's top performances</p>
            </motion.div>

            {events.length === 0 ? (
                <CulturalsEmptyState type="highlights" />
            ) : (
                <div className="relative group/scroll">
                    <style>{`
                        .c-hscroll::-webkit-scrollbar { height: 2px; }
                        .c-hscroll::-webkit-scrollbar-track { background: rgba(var(--color-neon-rgb, 57, 255, 20), 0.02); }
                        .c-hscroll::-webkit-scrollbar-thumb { background: rgba(var(--color-neon-rgb, 57, 255, 20), 0.2); border-radius: 10px; }
                        .mask-fade-edges { mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent); }
                    `}</style>
                    <div
                        ref={scrollRef}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        onTouchStart={() => setIsHovered(true)}
                        onTouchEnd={() => setIsHovered(false)}
                        className="c-hscroll flex gap-6 overflow-x-auto pb-12 pt-4 px-4 mask-fade-edges scroll-smooth"
                    >
                        {displayItems.map((item, i) => (
                            <div
                                key={i}
                                className="flex-none w-[320px] group relative will-change-transform"
                            >
                                <div
                                    className="relative flex flex-col p-6 h-full overflow-hidden transition-all duration-500 group-hover:shadow-[0_0_40px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.15)]"
                                    style={{
                                        background: 'rgba(15, 15, 30, 0.7)',
                                        border: '1.5px solid rgba(var(--color-neon-rgb, 57, 255, 20), 0.3)',
                                        clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)',
                                        backdropFilter: 'blur(16px)'
                                    }}
                                >
                                    <div className="absolute top-0 right-0 w-12 h-[1px] bg-[var(--color-neon)]/30" />
                                    <div className="absolute top-0 right-0 w-[1px] h-12 bg-[var(--color-neon)]/30" />

                                    <div className="flex items-start justify-between mb-6">
                                        <div>
                                            <span className="block text-[8px] text-white/45 tracking-[0.3em] font-black uppercase mb-1">Time</span>
                                            <span className="text-[11px] font-black text-[var(--color-neon)] tracking-[0.08em] uppercase">{item.time} HRS</span>
                                        </div>
                                        <div className="px-3 py-1 rounded-sm border border-[var(--color-neon)]/35 bg-[var(--color-neon)]/10 text-[8px] text-[#d9ff9a] font-black tracking-[0.2em] uppercase">
                                            {item.tag || 'CULTURAL'}
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-black text-white tracking-wide mb-5 uppercase leading-tight font-orbitron line-clamp-2">{item.title}</h3>

                                    <div className="flex items-center gap-2 mb-5 px-3 py-2 bg-white/[0.06] border border-white/12">
                                        <div className="w-1 h-4 bg-[var(--color-neon)]" />
                                        <div className="flex flex-col">
                                            <span className="text-[7px] text-white/45 font-black tracking-[0.24em] uppercase">Venue</span>
                                            <p className="text-[11px] text-white font-black tracking-[0.08em] uppercase">{item.loc}</p>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-white/10">
                                        <span className="block text-[8px] text-white/40 tracking-[0.24em] font-black uppercase mb-1">Description</span>
                                        <p className="text-[15px] text-white/88 leading-relaxed font-rajdhani line-clamp-3">
                                            {item.desc || 'Description will be updated soon.'}
                                        </p>
                                    </div>
                                </div>
                                <div className="absolute inset-0 border border-[var(--color-neon)]/0 group-hover:border-[var(--color-neon)]/20 transition-all duration-500 pointer-events-none" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)' }} />
                                <div className="absolute -inset-2 bg-[var(--color-neon)]/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
                            </div>
                        ))}
                    </div>

                    <div className="absolute left-0 top-0 bottom-12 w-24 bg-gradient-to-r from-[#030308] to-transparent pointer-events-none z-10 opacity-80" />
                    <div className="absolute right-0 top-0 bottom-12 w-24 bg-gradient-to-l from-[#030308] to-transparent pointer-events-none z-10 opacity-80" />
                </div>
            )}
        </section>
    );
});
HighlightsSection.displayName = 'HighlightsSection';


// ─── Roadmap Section ──────────────────────────────────────────────────────
const RoadmapSection = memo(() => {
    const phases = [
        {
            day: '01',
            title: 'DAY 01',
            date: 'MARCH 27',
            color: 'var(--color-neon)',
            img: '/images/fest/day1.png',
            events: [
                { name: 'Inauguration of All Branches', time: '10:00', loc: 'Main Stage', xp: 300 },
                { name: 'Flashmob', time: '16:00', loc: 'Open Arena', xp: 200 },
                { name: 'Cultural Night', time: '21:00', loc: 'Galaxy Hall', xp: 500 }
            ],
            label: 'Day 1',
            planetGlow: 'radial-gradient(circle, var(--color-neon) 0%, transparent 70%)'
        },
        {
            day: '02',
            title: 'DAY 02',
            date: 'MARCH 28',
            color: '#22d3ee',
            img: '/images/fest/day2.png',
            events: [
                { name: 'Fun Events', time: '10:00', loc: 'Event Zone', xp: 250 },
                { name: 'Kolatam', time: '16:00', loc: 'Cultural Stage', xp: 300 },
                { name: 'Cultural Night', time: '21:00', loc: 'Galaxy Hall', xp: 500 }
            ],
            label: 'Day 2',
            planetGlow: 'radial-gradient(circle, #22d3ee 0%, transparent 70%)'
        },
        {
            day: '03',
            title: 'DAY 03',
            date: 'MARCH 29',
            color: '#a3e635',
            img: '/images/fest/day3.png',
            events: [
                { name: 'Fun Events', time: '10:00', loc: 'Event Zone', xp: 250 },
                { name: 'Certifications', time: '18:00', loc: 'Seminar Hall', xp: 200 },
                { name: 'Cultural Night', time: '21:00', loc: 'Galaxy Hall', xp: 600 }
            ],
            label: 'Day 3',
            planetGlow: 'radial-gradient(circle, #a3e635 0%, transparent 70%)'
        }
    ];

    // Live clock — updates every minute so completion status stays accurate
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60_000);
        return () => clearInterval(timer);
    }, []);

    // Map phase index to the actual calendar date (adjust year/month as needed)
    const phaseDates = [
        new Date(2026, 2, 27), // March 27 2026 — Day 1
        new Date(2026, 2, 28), // March 28 2026 — Day 2
        new Date(2026, 2, 29), // March 29 2026 — Day 3
    ];

    // Returns true if the given event on the given phase date has already passed
    const isEventCompleted = (phaseIdx: number, eventTime: string): boolean => {
        const [hh, mm] = eventTime.split(':').map(Number);
        const eventDateTime = new Date(phaseDates[phaseIdx]);
        eventDateTime.setHours(hh, mm, 0, 0);
        return now >= eventDateTime;
    };

    const isPhaseStarted = (phaseIdx: number): boolean => {
        const firstTime = phases[phaseIdx].events[0].time;
        return isEventCompleted(phaseIdx, firstTime);
    };

    return (
        <section className="relative z-10 px-10 pb-40">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex flex-col items-center mb-24"
            >
                <div className="flex items-center gap-4 mb-4">
                    <div className="h-px w-24 bg-gradient-to-r from-transparent to-[var(--color-neon)]/40" />
                    <span className="text-[10px] text-[var(--color-neon)] tracking-[0.6em] font-black uppercase">Event Roadmap</span>
                    <div className="h-px w-24 bg-gradient-to-l from-transparent to-[var(--color-neon)]/40" />
                </div>
                <h2 className="text-3xl sm:text-5xl font-black tracking-[0.15em] text-white uppercase drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] text-center">EVENT SCHEDULE</h2>
            </motion.div>

            <div className="max-w-7xl mx-auto relative px-4">
                {/* Vertical Mission Path */}
                <div className="absolute left-[31px] md:left-[84px] top-0 bottom-0 w-[2px] border-l-2 border-dotted border-[var(--color-neon)]/40 z-0 shadow-[0_0_20px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.2)]" />

                <div className="flex flex-col gap-20 md:gap-40 relative">
                    {phases.map((phase, i) => {
                        const phaseStarted = isPhaseStarted(i);

                        return (
                            <div key={i} className="relative">
                                <motion.div
                                    initial={{ opacity: 0, x: -50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    transition={{ duration: 0.8, delay: i * 0.1 }}
                                    className="flex flex-row items-start gap-6 md:gap-12 relative"
                                >
                                    {/* Mission Bridge: Portal to Grid */}
                                    <div
                                        className="absolute left-[62px] md:left-[140px] w-[20px] md:w-[54px] h-[2px] top-[32px] md:top-[85px] z-10"
                                        style={{
                                            background: phaseStarted ? phase.color : 'rgba(255,255,255,0.1)',
                                            boxShadow: phaseStarted ? `0 0 15px ${phase.color}` : 'none'
                                        }}
                                    />

                                    {/* Left Side: Day Portal */}
                                    <div className="relative flex-none w-[64px] h-[64px] md:w-[170px] md:h-[170px] flex items-center justify-center sticky top-24 md:top-24 mt-0 md:mt-0 z-20">
                                        <div className="absolute inset-0 border border-white/18 rounded-full scale-110 animate-[spin_25s_linear_infinite]" />
                                        <div className="absolute inset-0 border border-white/12 rounded-full scale-125 rotate-45 animate-[spin_35s_linear_infinite_reverse]" />
                                        <div className="w-14 h-14 md:w-32 md:h-32 rounded-full flex items-center justify-center relative overflow-hidden group/portal shadow-[0_0_45px_rgba(0,0,0,0.7)] z-10 bg-black" style={{ border: `3px solid ${phase.color}`, boxShadow: `0 0 28px ${phase.color}66` }}>
                                            <Image src={phase.img} alt={phase.label} fill className="object-cover brightness-110 contrast-125 saturate-125 transition-transform duration-1000 group-hover/portal:scale-110" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                        </div>
                                        <div className="absolute -bottom-7 md:-bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 md:px-4.5 py-1 md:py-1.5 flex items-center gap-1.5 md:gap-2 z-10 rounded-sm" style={{ background: 'rgba(8,10,16,0.92)', border: `1.5px solid ${phase.color}99`, boxShadow: `0 0 14px ${phase.color}33` }}>
                                            <div className="w-1.5 md:w-2 h-1.5 md:h-2 rounded-full animate-pulse" style={{ background: phase.color }} />
                                            <span className="text-[7px] md:text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: phase.color, textShadow: `0 0 8px ${phase.color}66` }}>{phase.label}</span>
                                        </div>
                                    </div>

                                    {/* Right Side: Event Grid */}
                                    <div className="flex-1 w-full min-w-0 pr-2">
                                        <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-4 md:mb-8 text-left">
                                            <h3 className="text-2xl md:text-4xl font-black text-white tracking-widest uppercase">{phase.title}</h3>
                                            <div className="hidden md:block h-[2px] flex-1 bg-gradient-to-r from-white/20 to-transparent" />
                                            <span className="text-[9px] md:text-sm font-black text-[var(--color-neon)] tracking-[0.2em]">{phase.date}</span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                                            {/* Background Sequential Path (Desktop horizontal, mobile vertical) */}
                                            <div className="hidden md:block absolute top-[110px] left-0 right-0 h-[1px] bg-white/5 z-0" />
                                            <div className="md:hidden absolute top-[16px] bottom-0 left-[16px] w-[1px] bg-white/5 z-0" />

                                            {phase.events.map((event, idx) => {
                                                const isCompleted = isEventCompleted(i, event.time);

                                                return (
                                                    <div key={idx} className="relative z-10 pl-8 md:pl-0">
                                                        {/* Desktop Horizontal Line Connector */}
                                                        {idx > 0 && (
                                                            <div
                                                                className="hidden md:block absolute top-[110px] -left-[24px] w-6 h-[2px] z-10 transition-all duration-1000"
                                                                style={{
                                                                    background: isCompleted ? phase.color : 'rgba(255,255,255,0.1)',
                                                                    boxShadow: isCompleted ? `0 0 10px ${phase.color}` : 'none'
                                                                }}
                                                            />
                                                        )}
                                                        {/* Mobile Vertical Line Connector */}
                                                        {idx > 0 && (
                                                            <div
                                                                className="md:hidden absolute -top-[24px] left-[16px] w-[2px] h-6 z-10 transition-all duration-1000"
                                                                style={{
                                                                    background: isCompleted ? phase.color : 'rgba(255,255,255,0.1)',
                                                                    boxShadow: isCompleted ? `0 0 10px ${phase.color}` : 'none'
                                                                }}
                                                            />
                                                        )}
                                                        {/* Mobile Horizon Link to Card */}
                                                        <div
                                                            className="md:hidden absolute top-[16px] left-[16px] w-[16px] h-[2px] z-10 transition-all duration-1000"
                                                            style={{
                                                                background: isCompleted ? phase.color : 'rgba(255,255,255,0.1)',
                                                                boxShadow: isCompleted ? `0 0 10px ${phase.color}` : 'none'
                                                            }}
                                                        />

                                                        <motion.div
                                                            initial={{ opacity: 0, y: 20 }}
                                                            whileInView={{ opacity: 1, y: 0 }}
                                                            viewport={{ once: true }}
                                                            transition={{ delay: idx * 0.1 }}
                                                            className={`relative p-6 group overflow-hidden z-20 transition-all duration-300 cursor-default`}
                                                            style={{
                                                                background: isCompleted ? 'rgba(var(--color-neon-rgb, 57, 255, 20), 0.05)' : 'rgba(5, 5, 15, 0.4)',
                                                                border: `1px solid ${isCompleted ? phase.color : 'rgba(255,255,255,0.1)'}`,
                                                                clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)',
                                                                backdropFilter: 'blur(10px)'
                                                            }}
                                                        >
                                                            {!isCompleted && (
                                                                <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-neon)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                            )}
                                                            {isCompleted && (
                                                                <div className="absolute -right-3 -top-3 rotate-12 z-20">
                                                                    <div className="px-3 py-1 border-2 border-green-500/50 bg-green-500/20 text-[var(--color-neon)] text-[7px] font-black tracking-widest uppercase rounded-sm backdrop-blur-md">
                                                                        COMPLETED
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <div className="flex justify-between items-start mb-6">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[8px] font-black tracking-[0.3em] text-white/40 uppercase mb-1">Time</span>
                                                                    <span className="text-[14px] font-black tracking-widest text-[var(--color-neon)]">{event.time} HRS</span>
                                                                </div>
                                                                <div className={`p-2 rounded-sm border ${isCompleted ? 'border-green-500/30 bg-green-500/5' : 'border-white/5 bg-white/5'}`}>
                                                                    <Zap className={`w-3.5 h-3.5 ${isCompleted ? 'text-[var(--color-neon)]' : 'text-gray-600'}`} />
                                                                </div>
                                                            </div>

                                                            <h4 className="text-[12px] font-black text-white tracking-widest mb-4 uppercase group-hover:text-[var(--color-neon)] transition-colors h-8 overflow-hidden font-orbitron">{event.name}</h4>

                                                            <div className="flex items-center gap-3 mb-6 bg-white/5 p-2 border border-white/5">
                                                                <div className="w-1 h-4" style={{ background: phase.color }} />
                                                                <div className="flex flex-col">
                                                                    <span className="text-[7px] font-black tracking-widest text-white/30 uppercase">Location</span>
                                                                    <span className="text-[9px] text-gray-300 font-bold tracking-widest uppercase">{event.loc}</span>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center justify-end opacity-60">
                                                                <div className="text-[8px] font-black tracking-[0.2em]" style={{ color: isCompleted ? '#22c55e' : '#64748b' }}>
                                                                    {isCompleted ? '[ SYNCED ]' : '[ AWAITING ]'}
                                                                </div>
                                                            </div>

                                                            {/* Progress Bar */}
                                                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
                                                                <motion.div
                                                                    className="h-full bg-[var(--color-neon)] shadow-[0_0_15px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.8)]"
                                                                    initial={{ width: 0 }}
                                                                    whileInView={{ width: isCompleted ? '100%' : '0%' }}
                                                                    transition={{ duration: 1.2, ease: "easeOut" }}
                                                                />
                                                            </div>
                                                        </motion.div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        );
                    })}

                    {/* Grand Finale */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative mt-8 md:mt-12 overflow-hidden group min-h-[220px] md:min-h-[300px] ml-0 md:ml-[182px]"
                        style={{
                            background: 'rgba(20, 10, 5, 0.4)',
                            border: '1px solid #fb923c44',
                            clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)',
                            backdropFilter: 'blur(15px)'
                        }}
                    >
                        <div className="absolute inset-0 overflow-hidden">
                            <Image src="/images/fest/finale.png" alt="Grand Finale" fill className="object-cover opacity-20 group-hover:opacity-40 transition-opacity duration-1000" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#030308] via-transparent to-[#030308] opacity-60" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#fb923c11_0%,transparent_70%)]" />

                        <div className="relative z-10 flex flex-col items-center text-center p-8 md:p-12">
                            <span className="text-[10px] md:text-xs font-black tracking-[0.4em] md:tracking-[0.8em] text-[#fb923c] mb-2 md:mb-3 uppercase">Grand Finale</span>
                            <h3 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-[0.1em] md:tracking-[0.2em] text-white mb-6 md:mb-8 drop-shadow-[0_0_20px_#fb923c44]">SUPERNOVA NIGHT</h3>

                            <div className="flex flex-wrap justify-center gap-3 md:gap-8 gap-y-3 md:gap-y-4">
                                {['CELEBRITY DJ', 'PRIZE CEREMONY', 'MEGA CABARET', 'ILLUMINATION SHOW'].map(ev => (
                                    <div key={ev} className="flex items-center gap-1.5 md:gap-3 px-4 md:px-5 py-2 md:py-2 border border-[#fb923c22] bg-[#fb923c08] backdrop-blur-md">
                                        <Zap className="w-3 md:w-3.5 h-3 md:h-3.5 text-[#fb923c]" />
                                        <span className="text-[9px] md:text-[10px] font-black tracking-[0.2em] md:tracking-[0.3em] text-white/80 uppercase">{ev}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            <style>{`
                .bg-dotted-line {
                    background-image: radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px);
                    background-size: 1px 12px;
                }
            `}</style>
        </section>
    );
});
RoadmapSection.displayName = 'RoadmapSection';

// ─── Gallery Section ────────────────────────────────────────────────────────
const GallerySection = memo(({ images }: { images: string[] }) => {
    return (
        <section className="relative z-10 py-40 overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(251,146,60,0.1)_0%,transparent_70%)] pointer-events-none" />
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-[#fb923c11] blur-[150px] rounded-full opacity-20" />
            <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-[#22d3ee11] blur-[150px] rounded-full opacity-20" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="flex flex-col items-center mb-10 sm:mb-16 px-6 sm:px-10 text-center"
            >
                <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
                    <div className="h-px w-12 sm:w-24 bg-gradient-to-r from-transparent to-[#fb923c44]" />
                    <span className="text-[8px] sm:text-[10px] text-[#fb923c] tracking-[0.4em] sm:tracking-[0.6em] font-black uppercase">Photo Gallery</span>
                    <div className="h-px w-12 sm:w-24 bg-gradient-to-l from-transparent to-[#fb923c44]" />
                </div>
                <h2 className="text-3xl sm:text-5xl font-black tracking-widest text-white uppercase drop-shadow-[0_0_20px_rgba(251,146,60,0.2)]">EVENT CAPTURES</h2>
                <p className="text-[8px] sm:text-[9px] text-gray-500 tracking-[0.2em] sm:tracking-[0.3em] font-bold mt-2 uppercase">Explore our event highlights</p>
            </motion.div>

            <div className="h-[600px] w-full relative">
                {images.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <CulturalsEmptyState type="gallery" />
                    </div>
                ) : (
                    <DomeGallery
                        fit={0.8}
                        minRadius={500}
                        maxVerticalRotationDeg={15}
                        segments={32}
                        dragDampening={1.5}
                        grayscale={false}
                        overlayBlurColor="#030308"
                        openedImageWidth="500px"
                        openedImageHeight="500px"
                        images={images}
                    />
                )}
            </div>

            {/* Glowing Scanlines overlay for the gallery */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-[12]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, #fb923c 0px, #fb923c 1px, transparent 1px, transparent 4px)' }} />
        </section>
    );
});
GallerySection.displayName = 'GallerySection';

const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const PromoStreamsCarousel = memo(({ videos, color, onPlay }: { videos: PromoVideoData[]; color: string; onPlay: (url: string) => void }) => {
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
                    .promo-live-scroll::-webkit-scrollbar { display: none; }
                    .promo-live-mask { mask-image: linear-gradient(to right, transparent, black 6%, black 94%, transparent); }
                `}</style>
                <div
                    ref={scrollRef}
                    onMouseEnter={() => { isHoveringRef.current = true; }}
                    onMouseLeave={() => { isHoveringRef.current = false; }}
                    className="promo-live-scroll promo-live-mask flex gap-4 sm:gap-6 overflow-x-auto pb-2 pt-1 px-1 sm:px-0 scroll-smooth"
                    style={{ scrollbarWidth: 'none' }}
                >
                    {displayItems.map((video, i) => {
                        const youtubeId = getYouTubeId(video.url);
                        return (
                            <div key={`${video.url}-${i}`} className="group flex-none w-[300px] sm:w-[410px]">
                                <div className="relative overflow-hidden rounded-md border-2 sm:border-[2.5px] shadow-[0_0_30px_rgba(0,0,0,0.4)]" style={{ borderColor: color, background: '#0a0a14' }}>
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
                                            <img src={video.thumbnail || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80'} alt={video.title} className="w-full h-full object-cover opacity-80" />
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
PromoStreamsCarousel.displayName = 'PromoStreamsCarousel';

// ─── Main Page Component ────────────────────────────────────────────────────
export default function CulturalsClient({
    events,
    albums,
    promoVideos,
    allImages,
    logos,
    registeredEventIds = [],
    userProfile = null
}: {
    events: any[],
    albums: AlbumData[],
    promoVideos: PromoVideoData[],
    allImages: string[],
    logos: string[],
    registeredEventIds?: string[],
    userProfile?: { id: string; name: string | null; stdid: string | null; branch: string | null; currentYear: string | null } | null
}) {
    const [playingVideo, setPlayingVideo] = useState<string | null>(null);

    const promoHighlights = promoVideos?.filter(v => v.category?.toUpperCase() === 'PROMO') || [];
    const eventReels = promoVideos?.filter(v => v.category?.toUpperCase() === 'VIDEO') || [];

    const handlePlay = (url: string) => setPlayingVideo(url);
    return (
        <main className="fest-scroll relative min-h-screen bg-[#030308] text-white font-orbitron overflow-x-hidden" style={{ overflowY: 'auto', height: '100vh' }}>
            <StarField />
            <Particles />

            {/* Scanning Scanlines Overlay */}
            <div
                className="fixed inset-0 pointer-events-none z-[1] opacity-[0.08]"
                style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(var(--color-neon-rgb, 57, 255, 20), 0.1) 0px, rgba(var(--color-neon-rgb, 57, 255, 20), 0.1) 1px, transparent 1px, transparent 3px)' }}
            />

            {/* Hero Section */}
            <section className="relative h-screen flex flex-col items-center justify-center z-10">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(var(--color-neon-rgb, 57, 255, 20), 0.08)_0%,transparent_70%)] pointer-events-none" />


                {/* HUD Elements (Sticky/Fixed) */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="fixed top-6 sm:top-8 left-4 sm:left-8 z-50">
                    <Link href="/home/fest" className="group flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 border border-[var(--color-neon)]/30 text-white hover:bg-[var(--color-neon)]/10 transition-all duration-300 backdrop-blur-md bg-black/20" style={{ clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)' }}>
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                        <span className="hidden sm:inline text-[9px] font-black tracking-[0.3em] uppercase">Back to Hub</span>
                    </Link>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="fixed top-6 sm:top-8 right-4 sm:right-8 z-50 flex items-center gap-2 sm:gap-6">
                    <div className="hidden sm:block">
                        <HudLabel label="Event" value="CULTURAL" color="#22d3ee" />
                    </div>
                    <div className="hidden sm:block w-px h-8 bg-white/10" />
                    <div className="hidden sm:block">
                        <HudLabel label="Stage" value="ALPHA-7" color="#22d3ee" />
                    </div>
                    <div className="hidden sm:block w-px h-8 bg-white/10" />
                    <div className="flex flex-col gap-1 items-end">
                        <Radio className="w-3 h-3 text-[var(--color-neon)] animate-pulse" />
                        <span className="text-[8px] font-bold text-[var(--color-neon)]/60 tracking-widest uppercase">Live Now</span>
                    </div>
                </motion.div>

                {/* Main Content */}
                <div className="relative z-20 flex flex-col items-center text-center px-10">
                    <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, type: 'spring' }} className="w-16 h-16 rounded-full flex items-center justify-center border border-[var(--color-neon)]/40 bg-[var(--color-neon)]/5 mb-6 relative">
                        <Music className="w-7 h-7 text-[var(--color-neon)]" />
                        <div className="absolute inset-0 rounded-full border border-[var(--color-neon)]/20 animate-ping opacity-20" />
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-6">
                        <h1 className="text-5xl sm:text-[6rem] font-black tracking-[-0.02em] uppercase leading-none text-white drop-shadow-[0_0_30px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.4)]">CULTURAL<br /><span style={{ color: '#22d3ee' }}>RESONANCE</span></h1>
                        <div className="h-[2px] w-32 sm:w-48 bg-gradient-to-r from-transparent via-[var(--color-neon)] to-transparent mx-auto mt-4 opacity-70" />
                    </motion.div>

                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-[10px] sm:text-lg text-gray-400 tracking-[0.2em] sm:tracking-[0.3em] font-bold uppercase max-w-2xl mb-8 sm:mb-12">A professional showcase of human creativity. Bringing music, dance, and arts to the center stage.</motion.p>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="flex flex-wrap justify-center gap-3 sm:gap-6">
                        {[{ icon: <Mic2 className="w-3 sm:w-3.5 h-3 sm:h-3.5" />, label: 'MUSIC' }, { icon: <Theater className="w-3 sm:w-3.5 h-3 sm:h-3.5" />, label: 'DANCE' }, { icon: <Palette className="w-3 sm:w-3.5 h-3 sm:h-3.5" />, label: 'ARTS' }, { icon: <Theater className="w-3 sm:w-3.5 h-3 sm:h-3.5" />, label: 'DRAMA' }].map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-1.5 sm:py-2 bg-[var(--color-neon)]/5 border border-[var(--color-neon)]/20 rounded-sm">
                                <span className="text-[var(--color-neon)]">{item.icon}</span>
                                <span className="text-[8px] sm:text-[9px] font-black tracking-[0.2em] text-white/70">{item.label}</span>
                            </div>
                        ))}
                    </motion.div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="absolute bottom-[-168px] flex flex-col items-center gap-3">
                        <span className="text-[11px] sm:text-xs text-[#c9f7ff] tracking-[0.34em] uppercase font-black drop-shadow-[0_0_10px_rgba(34,211,238,0.45)]">
                            Scroll Down
                        </span>
                        <motion.div
                            role="button"
                            tabIndex={0}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => document.getElementById('cultural-highlights')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    document.getElementById('cultural-highlights')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                            }}
                            className="relative w-11 h-11 rounded-full border border-[#fbbf24]/55 text-[#fbbf24] shadow-[0_0_18px_rgba(251,191,36,0.2)] flex items-center justify-center cursor-pointer"
                            aria-label="Scroll to highlights"
                        >
                            <motion.div
                                animate={{ y: [0, 6, 0] }}
                                transition={{ repeat: Infinity, duration: 1.3, ease: 'easeInOut' }}
                            >
                                <ChevronDown className="w-5 h-5" />
                            </motion.div>
                            <div className="pointer-events-none absolute -inset-1 rounded-full border border-[#fbbf24]/25 animate-pulse" />
                        </motion.div>
                        <div className="w-[1px] h-10 bg-gradient-to-b from-[#fbbf24]/90 to-transparent" />
                    </motion.div>
                </div>
            </section>

            {/* Sections */}
            <div id="cultural-highlights" className="pt-14 sm:pt-20">
                <HighlightsSection events={events} />
            </div>

            <AnimatePresence>
                {playingVideo && (
                    <VideoModal url={playingVideo} onClose={() => setPlayingVideo(null)} />
                )}
            </AnimatePresence>

            <section className="py-12 sm:py-24 px-4 sm:px-10 bg-[#030308] relative overflow-hidden z-10">
                <div className="max-w-7xl mx-auto relative z-10">
                    <SectionHeader color="var(--color-neon)" label="Cinematic" title="FEATURED PROMOS" />
                    {promoHighlights.length > 0 ? (
                        <>
                            <VideoCarousel videos={promoHighlights} color="var(--color-neon)" onPlay={handlePlay} cardBorderWidth={4} showSideAccents={true} />
                            <PromoStreamsCarousel videos={promoHighlights} color="var(--color-neon)" onPlay={handlePlay} />
                        </>
                    ) : (
                        <CulturalsEmptyState type="promos" />
                    )}
                </div>
            </section>

            {eventReels.length > 0 && (
                <div className="bg-[#030308]">
                    <EventReelsSection
                        videos={eventReels}
                        color="var(--color-neon)"
                        branchName="CULTURALS"
                        onPlay={handlePlay}
                    />
                </div>
            )}
            <RoadmapSection />

            {/* Cultural Circular Gallery */}
            <CulturalsGallerySection albums={albums} />

            <GallerySection images={allImages} />
            <CulturalsFooter />
        </main>
    );
}

const CULTURALS_GALLERY_ITEMS = [
    { image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80', text: 'COSMIC BEATS' },
    { image: 'https://images.unsplash.com/photo-1514525253344-991f70cd204d?w=800&q=80', text: 'DIGITAL CANVAS' },
    { image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80', text: 'NEBULA DRAMA' },
    { image: 'https://images.unsplash.com/photo-1459749411177-042180ce6742?w=800&q=80', text: 'ORBITAL OPERA' },
    { image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80', text: 'SOLAR DANCE' },
    { image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&q=80', text: 'ASTRO BEATS' },
    { image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80', text: 'ZENITH CHOIR' },
    { image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80', text: 'VOID CINEMA' },
];

const CulturalsGallerySection = memo(({ albums }: { albums: AlbumData[] }) => {
    const [domeOpen, setDomeOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [selectedAlbum, setSelectedAlbum] = useState<AlbumData | null>(null);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize(); // Init on mount
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const baseItems = albums.length > 0 ? albums.map(a => ({
        image: a.coverImage || (a.images && a.images.length > 0 ? a.images[0].url : "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80"),
        text: a.title,
        album: a
    })) : CULTURALS_GALLERY_ITEMS;

    let galleryItems = [...baseItems];
    if (galleryItems.length > 0 && galleryItems.length < 6) {
        while (galleryItems.length < 6) {
            galleryItems = [...galleryItems, ...baseItems];
        }
    }

    return (
        <section className="relative z-10 pb-0">
            {/* DomeGallery Modal on card click */}
            <AnimatePresence>
                {domeOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-xl flex flex-col items-center justify-center"
                    >
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center pointer-events-none">
                            <p className="text-[10px] text-[var(--color-neon)] font-black tracking-[0.6em] uppercase mb-1">Cultural Gallery</p>
                            <h3 className="text-2xl font-black text-white tracking-widest uppercase">{selectedAlbum?.title || 'CAPTURED MOMENTS'}</h3>
                        </div>
                        <button
                            onClick={() => setDomeOpen(false)}
                            className="absolute top-8 right-10 z-[210] px-5 py-3 rounded-full border border-white/20 text-white hover:text-[var(--color-neon)] hover:border-[var(--color-neon)] transition-all text-xs font-black tracking-[0.3em] uppercase"
                        >✕ Close</button>
                        <div className="w-full h-full">
                            <DomeGallery
                                images={selectedAlbum ? selectedAlbum.images.map(img => img.url) : galleryItems.map(i => i.image)}
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
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex flex-col items-center pt-20 pb-12 px-6 text-center"
            >
                <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
                    <div className="h-px w-12 sm:w-24 bg-gradient-to-r from-transparent to-[var(--color-neon)]/40" />
                    <span className="text-[8px] sm:text-[10px] text-[var(--color-neon)] tracking-[0.4em] sm:tracking-[0.6em] font-black uppercase">Cultural Gallery</span>
                    <div className="h-px w-12 sm:w-24 bg-gradient-to-l from-transparent to-[var(--color-neon)]/40" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-widest text-white uppercase drop-shadow-[0_0_20px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.3)] italic">CAPTURED MOMENTS</h2>
                <p className="text-[8px] sm:text-[10px] text-gray-500 tracking-[0.2em] sm:tracking-[0.3em] uppercase mt-3 font-bold">Click a card to expand • View our gallery</p>
            </motion.div>
            <div className="w-full h-[500px]">
                {albums.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                        <CulturalsEmptyState type="gallery" />
                    </div>
                ) : (
                    <CircularGallery
                        bend={isMobile ? 0 : 3}
                        textColor="#22d3ee"
                        font="bold 30px Orbitron"
                        borderRadius={0.05}
                        scrollSpeed={isMobile ? 1.5 : 2}
                        scrollEase={0.05}
                        autoScrollSpeed={isMobile ? -0.1 : 0.15}
                        items={galleryItems}
                        onSelect={(item: any) => {
                            setSelectedAlbum(item.album || null);
                            setDomeOpen(true);
                        }}
                    />
                )}
            </div>
        </section>
    );
});
CulturalsGallerySection.displayName = 'CulturalsGallerySection';
