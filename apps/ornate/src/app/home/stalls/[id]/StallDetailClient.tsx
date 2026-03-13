'use client';

import { ArrowLeft, Clock, MapPin, Star, ChevronRight, CheckCircle, Tag, HandCoins, X, UtensilsCrossed, MessageSquare, Send, User, Phone } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import QRCode from 'react-qr-code';

export default function StallDetailClient({
    stall: stallData,
    initialPanel,
}: {
    stall: any;
    initialPanel?: string;
}) {
    const [showMenu, setShowMenu] = useState(false);
    const [showReviews, setShowReviews] = useState(false);
    const [newReviewText, setNewReviewText] = useState('');
    const [newReviewRating, setNewReviewRating] = useState(5);
    const [mounted, setMounted] = useState(false);
    const menuScrollRef = useRef<HTMLDivElement | null>(null);
    const reviewStorageKey = `stall-reviews:${stallData.id}`;

    const defaultReviews = [
        { id: 1, user: 'Alex Nova', rating: 5, comment: 'Best nebula burgers in the quadrant!', time: '2h ago' },
        { id: 2, user: 'Sarah Zen', rating: 4, comment: 'Solar pop was a bit too fizzy but good.', time: '5h ago' },
    ];

    const [reviews, setReviews] = useState(defaultReviews);

    useEffect(() => {
        setMounted(true);
        try {
            const raw = window.localStorage.getItem(reviewStorageKey);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
                setReviews(parsed);
            }
        } catch (err) {
            console.error('[STALL_REVIEWS][LOAD]', err);
        }
    }, [reviewStorageKey]);

    useEffect(() => {
        if (!initialPanel) return;
        if (initialPanel === 'reviews') {
            setShowReviews(true);
            setShowMenu(false);
            return;
        }
        if (initialPanel === 'menu') {
            setShowMenu(true);
            setShowReviews(false);
        }
    }, [initialPanel]);

    useEffect(() => {
        if (!showMenu) return;
        requestAnimationFrame(() => {
            menuScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
        });
    }, [showMenu]);

    const handleAddReview = () => {
        const comment = newReviewText.trim();
        if (!comment) return;

        const next = [
            { id: Date.now(), user: 'Guest Pilot', rating: newReviewRating, comment, time: 'Just now' },
            ...reviews,
        ];

        setReviews(next);
        try {
            window.localStorage.setItem(reviewStorageKey, JSON.stringify(next));
        } catch (err) {
            console.error('[STALL_REVIEWS][SAVE]', err);
        }
        setNewReviewText('');
        setNewReviewRating(5);
    };

    const toggleMenu = () => {
        setShowMenu(!showMenu);
        setShowReviews(false);
    };

    const toggleReviews = () => {
        setShowReviews(!showReviews);
        setShowMenu(false);
    };

    const ratingValue = Number.parseFloat(String(stallData.rating ?? '4.8'));
    const safeRating = Number.isFinite(ratingValue) ? Math.max(0, Math.min(5, ratingValue)) : 4.8;
    const reviewsAverage = reviews.length
        ? reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length
        : safeRating;
    const displayRating = Math.max(0, Math.min(5, reviewsAverage));
    const signalBars = Math.max(1, Math.min(5, Math.round(displayRating)));
    const stallSlug = String(stallData.name || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '')
        .trim();
    const defaultQrValue = `https://instagram.com/explore/tags/${stallSlug || 'ornatefest'}/`;

    let parsedMenu: any[] = [];
    try {
        if (typeof stallData.menuItems === 'string') {
            parsedMenu = JSON.parse(stallData.menuItems);
        } else if (Array.isArray(stallData.menuItems)) {
            parsedMenu = stallData.menuItems;
        }
    } catch (e) {
        console.error("Failed to parse menu items:", e);
    }

    let dynamicFullMenu: any[] = [];
    let dynamicItems: any[] = [];

    if (parsedMenu && parsedMenu.length > 0) {
        // Check if it's already in the category format with nested items
        if (parsedMenu[0].category && Array.isArray(parsedMenu[0].items)) {
            dynamicFullMenu = parsedMenu;
            dynamicItems = parsedMenu[0].items.slice(0, 3);
        } else {
             // Assume it's a flat array of items (e.g. {name, price, desc})
             dynamicFullMenu = [{ category: 'Main Menu', items: parsedMenu }];
             dynamicItems = parsedMenu.slice(0, 3);
        }
    }

    const stall = {
        name: stallData.name,
        no: stallData.no,
        team: stallData.team,
        price: stallData.price,
        color: stallData.color,
        rating: displayRating.toFixed(1),
        description: stallData.description,
        items: dynamicItems,
        fullMenu: dynamicFullMenu,
        hours: '10 AM - 6 PM',
        location: 'Ground Floor, Main Block',
        mustTry: stallData.name,
        managerTeam: stallData.team,
        managerName: `${stallData.name} Ops Desk`,
        qrLabel: String(stallData.qrLabel || stallData.qrTargetUrl || 'Instagram Page'),
        qrTarget: String(stallData.qrTargetUrl || defaultQrValue),
        qrCodeImage: stallData.qrCodeUrl || null,
        supportPhone: stallData.phone || '+91 91234 56789',
        paymentStatus: 'UPI VERIFIED',
    };

    return (
        <main className="relative min-h-screen bg-[#030308] font-orbitron text-white flex flex-col items-center justify-center py-6 sm:py-20 px-6 overflow-y-auto overflow-x-hidden">

            {/* Atmospheric Backdrop */}
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

                {/* Floating Bubbles Layer */}
                {mounted && [...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{
                            x: Math.random() * 100 + "%",
                            y: Math.random() * 100 + "%",
                            opacity: 0,
                            scale: 0.5
                        }}
                        animate={{
                            x: [
                                (Math.random() * 100) + "%",
                                (Math.random() * 100) + "%",
                                (Math.random() * 100) + "%"
                            ],
                            y: [
                                (Math.random() * 100) + "%",
                                (Math.random() * 100) + "%",
                                (Math.random() * 100) + "%"
                            ],
                            opacity: [0.1, 0.2, 0.1],
                            scale: [1, 1.3, 1]
                        }}
                        transition={{
                            duration: 25 + Math.random() * 15,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        className="absolute rounded-full border border-white/5"
                        style={{
                            width: 60 + Math.random() * 120 + "px",
                            height: 60 + Math.random() * 120 + "px",
                            background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.03), transparent)`
                        }}
                    />
                ))}

                {/* Deep background color layer with blur */}
                <div className="absolute inset-0 bg-[#030308]/40 backdrop-blur-[40px]" />
            </div>

            {/* Nav */}
            <nav className="fixed top-0 left-0 w-full p-3 sm:p-6 z-50 flex justify-between items-center pointer-events-none">
                <Link href="/home/stalls" className="group flex items-center gap-2 sm:gap-3 text-white/60 hover:text-[var(--color-neon)] transition-all pointer-events-auto bg-white/5 backdrop-blur-md px-3 sm:px-6 py-2 sm:py-2.5 border-l border-r border-[var(--color-neon)]/30 hover:bg-[var(--color-neon)]/10 hover:border-[var(--color-neon)] [clip-path:polygon(10px_0,100%_0,calc(100%-10px)_100%,0_100%)] sm:[clip-path:polygon(15px_0,100%_0,calc(100%-15px)_100%,0_100%)]">
                    <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-black tracking-[0.2em] sm:tracking-[0.3em] text-[10px] sm:text-xs uppercase">
                        <span className="hidden sm:inline">Back to Stalls</span>
                        <span className="sm:hidden">Back</span>
                    </span>
                </Link>
            </nav>

            <style>{`
                .custom-panel-scroll {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(var(--color-neon-rgb, 57, 255, 20), 0.5) rgba(0, 0, 0, 0.2);
                }
                .custom-panel-scroll::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-panel-scroll::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 8px;
                    margin-top: 4px;
                    margin-bottom: 4px;
                }
                .custom-panel-scroll::-webkit-scrollbar-thumb {
                    background: rgba(var(--color-neon-rgb, 57, 255, 20), 0.5);
                    border-radius: 8px;
                }
                .custom-panel-scroll::-webkit-scrollbar-thumb:hover {
                    background: var(--color-neon);
                    box-shadow: 0 0 10px var(--color-neon);
                }
            `}</style>

            {/* Wrapper for side-by-side layout */}
            <div className="relative z-10 w-full flex flex-col lg:flex-row items-center lg:items-center justify-center gap-12 lg:gap-14 max-w-[1500px] px-8">

                {/* Main Cyber-Stall Card */}
                <motion.div
                    layout
                    className="relative w-full max-w-[850px] flex flex-col items-center perspective-1000 group/stall"
                >

                    {/* Smoke stack at the top left */}
                    <div className="absolute -top-14 left-16 w-12 h-16 z-0 flex flex-col items-center">
                        <div className="w-6 h-10 bg-gradient-to-t from-[#1A3022] to-[#0A1A0F] border-x border-t border-[var(--color-neon)]/20 rounded-t-sm" />
                        <motion.div
                            animate={{ y: [-10, -30], opacity: [0, 0.5, 0], scale: [1, 1.5] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                            className="w-4 h-4 bg-white/10 rounded-full blur-md"
                        />
                    </div>

                    {/* ── TOP HEADER / ROOF ── */}
                    <div className="relative w-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)]">
                        {/* Metallic Roof Structure */}
                        <div
                            className="w-full bg-[#1A1A1A] border-4 border-[#2A2A2A] shadow-[inset_0_2px_10px_rgba(255,255,255,0.1)] relative z-20 flex flex-col items-center justify-center p-2 bg-[linear-gradient(135deg,#121212_0%,#242424_100%)]"
                            style={{ clipPath: 'polygon(5% 0, 95% 0, 100% 100%, 0 100%)', height: '110px' }}
                        >
                            {/* THE SIGNBOARD */}
                            <div className="relative w-[85%] h-[75%] border-2 border-[var(--color-neon)] bg-[#0A1A0F] shadow-[0_0_25px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.4),_inset_0_0_15px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.2)] flex items-center justify-center overflow-hidden">
                                <h1 className="text-xl md:text-2xl lg:text-4xl font-black text-[#A3FF12] tracking-wider uppercase drop-shadow-[0_0_15px_rgba(163,255,18,0.8)] text-center px-6 md:pr-24 leading-tight max-w-full">
                                    {stall.name}
                                </h1>

                                <div className="absolute right-2.5 md:right-3 top-1/2 -translate-y-1/2 z-30 w-11 h-11 md:w-14 md:h-14 flex items-center justify-center rounded-[2px] border border-[var(--color-neon)]/80 bg-[linear-gradient(145deg,rgba(8,20,14,0.92),rgba(6,14,10,0.75))] shadow-[0_0_18px_rgba(var(--color-neon-rgb,57,255,20),0.35),inset_0_0_14px_rgba(var(--color-neon-rgb,57,255,20),0.14)] pointer-events-none overflow-hidden">
                                    <div className="absolute inset-0 opacity-35" style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(163,255,18,0.1) 0px, rgba(163,255,18,0.1) 1px, transparent 1px, transparent 4px)' }} />
                                    <div className="absolute top-1 left-1 w-1.5 h-1.5 border-t border-l border-[var(--color-neon)]/80" />
                                    <div className="absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r border-[var(--color-neon)]/80" />
                                    <span className="relative text-xl md:text-2xl font-black text-[#A3FF12] leading-none tracking-tight drop-shadow-[0_0_8px_rgba(163,255,18,0.85)]">#{stall.no}</span>
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* Awning (The striped shop front) */}
                    <div className="relative z-10 w-[96%] mx-auto h-12 bg-[repeating-linear-gradient(90deg,#1b251e,#1b251e_30px,#283c2f_30px,#283c2f_60px)] border-b-8 border-[#080B09] shadow-2xl flex items-end justify-around px-12 border-x border-t border-white/5">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="w-3 h-3 rounded-full bg-[#FFF5C3] shadow-[0_0_20px_5px_rgba(255,245,195,0.6)] translate-y-2 animate-pulse" style={{ animationDelay: `${i * 0.5}s` }} />
                        ))}
                    </div>

                    {/* ── MIDDLE: THE SHOP FRONT ── */}
                    <div className="relative w-[92%] bg-[#121A15] border-x-[6px] border-[#080B09] p-4 flex flex-col items-center shadow-[inset_0_0_60px_rgba(0,0,0,0.9)] min-h-[450px]">

                        {/* Interior Screen Display */}
                        <div className="relative w-full bg-[#080E0A] border-2 border-[#1A3A22] shadow-[inset_0_0_30px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.1),_0_0_20px_rgba(0,0,0,0.8)] p-8 font-mono">
                            <div className="flex flex-col gap-3">
                                {stall.items.length > 0 ? (
                                    stall.items.map((item: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between group/item cursor-default">
                                            <span className="text-sm md:text-base font-bold tracking-tight text-gray-400 group-hover/item:text-white transition-colors">{item.name || item.itemName || item.title || item.item || 'Unnamed Item'}</span>
                                            <div className="flex-1 mx-4 border-b-2 border-dotted border-[var(--color-neon)]/60 opacity-80 relative top-1 group-hover/item:opacity-100 group-hover/item:border-[var(--color-neon)] transition-all" />
                                            <span className="text-[#A3FF12] font-black text-lg md:text-xl drop-shadow-[0_0:8px_rgba(163,255,18,0.4)]">
                                                ₹{String(item.price || item.itemPrice || item.cost || item.amount || '0').replace(/^₹\s*/, '')}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-4 text-center opacity-70 font-rajdhani text-sm tracking-widest text-[var(--color-neon)] uppercase">
                                        No menu available
                                    </div>
                                )}
                            </div>

                            {/* Sector Description Block */}
                            <div className="mt-8 border-l-2 border-[var(--color-neon)]/30 bg-white/5 p-5 font-rajdhani">
                                <span className="text-[var(--color-neon)] font-black text-xs md:text-sm tracking-[0.22em] uppercase block mb-2.5">About this Stall:</span>
                                <p className="text-gray-300 text-base md:text-lg leading-relaxed font-semibold">
                                    {stall.description}
                                </p>
                            </div>

                            {/* Interactive Main Button */}
                            {stall.fullMenu.length > 0 && (
                                <motion.button
                                    onClick={toggleMenu}
                                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(var(--color-neon-rgb, 57, 255, 20), 0.15)' }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`mt-6 w-full border-2 py-3 flex items-center justify-center gap-3 text-sm font-black tracking-[0.2em] uppercase transition-all ${showMenu ? 'bg-[rgba(var(--color-neon-rgb,57,255,20),0.18)] text-[var(--color-neon)] border-[var(--color-neon)] shadow-[0_0_18px_rgba(var(--color-neon-rgb,57,255,20),0.25)]' : 'bg-[#0E1711] text-[var(--color-neon)] border-[#1A3A22] hover:border-[var(--color-neon)]/50'}`}
                                >
                                    {showMenu ? (
                                        <>CLOSE MENU <X className="w-5 h-5" /></>
                                    ) : (
                                        <>VIEW FULL MENU <ChevronRight className="w-6 h-6" /></>
                                    )}
                                </motion.button>
                            )}
                        </div>

                        {/* Industrial details on the sides */}
                        <div className="absolute left-[-15px] top-1/4 w-12 h-24 bg-[#0A0E0C] border-r border-[var(--color-neon)]/10 shadow-lg flex flex-col justify-around p-2">
                            <div className="w-full h-1 bg-[var(--color-neon)]/20 rounded-full" />
                            <div className="w-full h-1 bg-[var(--color-neon)]/20 rounded-full animate-pulse" />
                            <div className="w-full h-1 bg-[var(--color-neon)]/20 rounded-full" />
                        </div>
                    </div>

                    {/* ── LOWER BASE: RIG DETAILS ── */}
                    <div className="relative w-full bg-[#111A16] border-4 border-[#080B09] shadow-[inset_0_2px_20px_rgba(255,255,255,0.05),_0_30px_60px_rgba(0,0,0,0.9)] p-4 sm:p-5 lg:p-6 z-20">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-8">
                            {/* Status & Location Section */}
                            <div className="space-y-4 lg:space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="flex items-center gap-3 text-gray-300 font-mono text-sm leading-none bg-black/35 p-3.5 border border-white/10 rounded-sm">
                                        <Clock className="w-5 h-5 text-[var(--color-neon)]" />
                                        <span>{stall.hours}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-300 font-mono text-sm leading-none bg-black/35 p-3.5 border border-white/10 rounded-sm">
                                        <MapPin className="w-5 h-5 text-[#FF4500]" />
                                        <span>{stall.location}</span>
                                    </div>
                                </div>

                                <div className="p-4 bg-black/40 border border-white/10 rounded-sm">
                                    <div className="flex items-center gap-2 mb-2.5">
                                        <Star className="w-4 h-4 text-[#A3FF12] fill-[#A3FF12]" />
                                        <span className="text-xs uppercase font-bold text-gray-500 tracking-[0.18em]">Recommended Experience</span>
                                    </div>
                                    <p className="text-[var(--color-neon)] font-black text-2xl uppercase tracking-[0.14em]">{stall.mustTry}</p>
                                </div>
                            </div>

                            {/* Verification & Action Section */}
                            <div className="space-y-4 lg:space-y-5">
                                <div className="flex items-center justify-between bg-[#1A3A22]/20 border border-[var(--color-neon)]/30 p-4 sm:p-5 rounded-sm shadow-[inset_0_0_10px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.1)]">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-[var(--color-neon)]/65 font-black uppercase tracking-[0.2em]">Signal Strength</span>
                                        <div className="flex gap-1.5 mt-1.5">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <div key={i} className={`w-1.5 h-4 rounded-full ${i <= signalBars ? 'bg-[var(--color-neon)] shadow-[0_0_8px_rgba(var(--color-neon-rgb,57,255,20),0.6)]' : 'bg-[var(--color-neon)]/20'}`} />
                                            ))}
                                        </div>
                                    </div>
                                    <div
                                        onClick={toggleReviews}
                                        className="flex flex-col items-end cursor-pointer group/rev min-w-[122px]"
                                    >
                                        <span className="text-[11px] text-[#A3FF12] font-black uppercase leading-none group-hover/rev:text-white transition-colors">{stall.rating} Rating</span>
                                        <span className="text-[9px] text-gray-500 font-mono mt-1 uppercase border-b border-dashed border-transparent group-hover/rev:border-[var(--color-neon)] group-hover/rev:text-[var(--color-neon)] transition-all">
                                            {reviews.length} REVIEWS
                                        </span>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowReviews(true);
                                                setShowMenu(false);
                                            }}
                                            className="mt-1.5 text-[9px] text-[var(--color-neon)]/75 hover:text-[var(--color-neon)] font-mono uppercase tracking-[0.16em] border-b border-dashed border-[var(--color-neon)]/35 hover:border-[var(--color-neon)] transition-colors"
                                        >
                                            View All Reviews
                                        </button>
                                    </div>
                                </div>

                                <motion.button
                                    onClick={toggleReviews}
                                    whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(var(--color-neon-rgb, 57, 255, 20), 0.5)' }}
                                    className="w-full bg-[var(--color-neon)] text-black py-3.5 font-black tracking-[0.24em] uppercase transition-all flex justify-center items-center gap-3 shadow-[0_0_20px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.2)]"
                                >
                                    <MessageSquare className="w-6 h-6" /> {showReviews ? 'CLOSE REVIEWS' : 'ADD REVIEW'}
                                </motion.button>
                            </div>
                        </div>

                        {/* Footer Info Area */}
                        <div className="mt-8 border-t border-[#1A3022] pt-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                            <div className="flex items-center gap-4 bg-[#1A3A22]/35 border border-[var(--color-neon)]/20 p-3.5 rounded-sm">
                                <a
                                    href={stall.qrTarget}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label={`Open ${stall.qrLabel}`}
                                    className="w-14 h-14 bg-white p-1.5 shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-black/10 shrink-0 relative overflow-hidden flex items-center justify-center"
                                >
                                    {stall.qrCodeImage ? (
                                        <img src={stall.qrCodeImage} alt="QR Code" className="w-full h-full object-cover" />
                                    ) : (
                                        <QRCode value={stall.qrTarget} size={44} style={{ width: '100%', height: '100%' }} />
                                    )}
                                </a>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-white font-mono text-[10px] uppercase tracking-widest">Managed by {stall.managerTeam}</span>
                                    <span className="text-[#FCD34D] font-bold font-mono text-xs mt-1 uppercase">QR TARGET: {stall.qrLabel}</span>
                                </div>
                            </div>

                            <div className="bg-[#1A3A22]/50 border-2 border-[var(--color-neon)]/20 p-3 px-5 flex items-center gap-3 rounded-sm">
                                <Phone className="w-6 h-6 text-[var(--color-neon)]" />
                                <div className="flex flex-col">
                                    <span className="text-[var(--color-neon)] text-[10px] font-black tracking-[0.3em] uppercase">DIRECT LINK</span>
                                    <span className="text-white text-sm font-bold uppercase tracking-widest">{stall.supportPhone}</span>
                                </div>
                            </div>

                            <div className="bg-[#1A3A22]/50 border-2 border-[var(--color-neon)]/20 p-3 px-5 flex items-center gap-3 rounded-sm">
                                <HandCoins className="w-6 h-6 text-[var(--color-neon)]" />
                                <div className="flex flex-col">
                                    <span className="text-[var(--color-neon)] text-[10px] font-black tracking-[0.3em] uppercase">Status</span>
                                    <span className="text-white text-sm font-bold uppercase tracking-widest">{stall.paymentStatus}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ── SIDE HOLOGRAPHIC PANELS ── */}
                <div className="relative w-full lg:w-auto flex flex-col gap-6 lg:self-stretch">
                    {/* Mobile backdrop */}
                    <AnimatePresence>
                        {(showMenu || showReviews) && (
                            <motion.div
                                key="backdrop"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/70 z-[198] lg:hidden"
                                onClick={() => { setShowMenu(false); setShowReviews(false); }}
                            />
                        )}
                    </AnimatePresence>

                    {/* Menu Panel */}
                    <AnimatePresence>
                        {showMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: '100%' }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: '100%' }}
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                className="fixed bottom-0 left-0 right-0 z-[199] lg:static lg:z-auto lg:relative w-full lg:min-w-[600px] lg:max-w-[750px] h-[82vh] lg:h-full bg-[#0A1A0F]/95 backdrop-blur-3xl border-t-2 lg:border-2 border-[var(--color-neon)]/35 overflow-hidden shadow-[0_0_100px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.25)] flex flex-col lg:rounded-3xl rounded-t-3xl"
                            >
                                {/* Ambient HUD layers */}
                                <div className="pointer-events-none absolute inset-0 z-0">
                                    <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[var(--color-neon)]/10 blur-3xl" />
                                    <div className="absolute -bottom-28 -right-24 w-80 h-80 rounded-full bg-[var(--color-neon)]/8 blur-3xl" />
                                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(163,255,18,0.08) 0px, rgba(163,255,18,0.08) 1px, transparent 1px, transparent 5px)' }} />
                                </div>

                                {/* Corner HUD markers */}
                                <div className="pointer-events-none absolute top-3 left-3 w-5 h-5 border-t border-l border-[var(--color-neon)]/60 z-20" />
                                <div className="pointer-events-none absolute top-3 right-3 w-5 h-5 border-t border-r border-[var(--color-neon)]/60 z-20" />
                                <div className="pointer-events-none absolute bottom-3 left-3 w-5 h-5 border-b border-l border-[var(--color-neon)]/45 z-20" />
                                <div className="pointer-events-none absolute bottom-3 right-3 w-5 h-5 border-b border-r border-[var(--color-neon)]/45 z-20" />

                                <div className="p-4 lg:p-7 border-b border-[var(--color-neon)]/20 bg-gradient-to-b from-[var(--color-neon)]/10 to-transparent">
                                    <div className="flex justify-between items-center mb-2">
                                        <UtensilsCrossed className="w-6 h-6 lg:w-8 lg:h-8 text-[var(--color-neon)]" />
                                        <button
                                            type="button"
                                            aria-label="Close menu"
                                            onClick={() => setShowMenu(false)}
                                            className="w-9 h-9 lg:w-10 lg:h-10 flex items-center justify-center rounded-sm border border-[var(--color-neon)]/25 bg-black/30 text-[var(--color-neon)]/70 hover:text-[var(--color-neon)] hover:border-[var(--color-neon)]/60 hover:bg-[var(--color-neon)]/10 transition-colors"
                                        >
                                            <X className="w-5 h-5 lg:w-6 lg:h-6" />
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="min-w-0">
                                            <h2 className="text-3xl lg:text-5xl font-black text-white tracking-tight uppercase leading-none">FULL <span className="text-[var(--color-neon)]">MENU</span></h2>
                                            <p className="text-[11px] font-mono text-[var(--color-neon)]/80 uppercase tracking-[0.2em] mt-2">Curated catalog • Live pricing</p>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-center gap-1.5 bg-[var(--color-neon)]/12 px-3 py-1.5 border border-[var(--color-neon)]/35 rounded-xl shadow-[inset_0_0_14px_rgba(var(--color-neon-rgb,57,255,20),0.15)]">
                                                <Star className="w-4 h-4 text-[#A3FF12] fill-[#A3FF12]" />
                                                <span className="text-lg lg:text-2xl font-black text-[var(--color-neon)]">{stall.rating}</span>
                                            </div>
                                            <span className="text-[8px] font-mono text-[var(--color-neon)]/45 mt-1 mr-1 uppercase">Reputation Index</span>
                                        </div>
                                    </div>
                                </div>

                                <div ref={menuScrollRef} className="relative z-10 flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 lg:space-y-5 custom-panel-scroll">
                                    {stall.fullMenu.map((cat: any, i: number) => (
                                        <div key={i} className="space-y-3 lg:space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-[2px] w-8 bg-[var(--color-neon)]/55" />
                                                <h3 className="text-[var(--color-neon)] font-black tracking-[0.32em] text-xs uppercase italic">{cat.category}</h3>
                                            </div>
                                            <div className="space-y-2 lg:space-y-2.5">
                                                {cat.items.map((item: any, j: number) => (
                                                    <div key={j} className="group cursor-default px-3 py-3 lg:px-4 lg:py-3.5 bg-[#07150f]/45 border border-transparent hover:border-[var(--color-neon)]/20 hover:bg-[#0b2116]/45 rounded-xl transition-colors">
                                                        <div className="flex items-baseline">
                                                            <span className="text-base lg:text-2xl font-black tracking-tight text-white group-hover:text-[var(--color-neon)] transition-colors uppercase">{item.name || item.itemName || item.title || item.item || 'Unnamed Item'}</span>
                                                            <span className="flex-1 mx-3 border-b-2 border-dotted border-[var(--color-neon)]/70 opacity-90 group-hover:opacity-100 transition-opacity" />
                                                            <span className="text-[#A3FF12] font-black text-base lg:text-2xl drop-shadow-[0_0_10px_rgba(163,255,18,0.3)]">₹{String(item.price || item.itemPrice || item.cost || item.amount || '0').replace(/^₹\s*/, '')}</span>
                                                        </div>
                                                        {(item.desc || item.description) && (
                                                            <p className="mt-2 text-xs lg:text-sm text-white/50 font-semibold tracking-wide leading-relaxed line-clamp-2">{item.desc || item.description}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Reviews Panel */}
                    <AnimatePresence>
                        {showReviews && (
                            <motion.div
                                initial={{ opacity: 0, y: '100%' }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: '100%' }}
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                className="fixed bottom-0 left-0 right-0 z-[199] lg:static lg:z-auto lg:relative w-full lg:min-w-[600px] lg:max-w-[750px] h-[82dvh] lg:h-full bg-[#0A1A0F]/95 backdrop-blur-3xl border-t-2 lg:border-2 border-[var(--color-neon)]/30 overflow-hidden shadow-[0_0_100px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.25)] flex flex-col lg:rounded-3xl rounded-t-3xl"
                            >
                                <div className="shrink-0 p-4 lg:p-8 border-b border-[var(--color-neon)]/20 flex justify-between items-center bg-gradient-to-b from-[var(--color-neon)]/10 to-transparent">
                                    <div className="flex flex-col">
                                        <h2 className="text-xl lg:text-3xl font-black text-white uppercase tracking-tighter">DATA <span className="text-[var(--color-neon)]">FEEDBACK</span></h2>
                                        <p className="text-[10px] font-mono text-[var(--color-neon)]/60 uppercase tracking-[0.3em] mt-1">Transmission encrypted</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1 bg-[var(--color-neon)]/10 px-3 py-1.5 border border-[var(--color-neon)]/20 rounded-lg">
                                            <Star className="w-4 h-4 text-[#A3FF12] fill-[#A3FF12]" />
                                            <span className="text-base lg:text-lg font-black text-[var(--color-neon)]">{stall.rating}</span>
                                        </div>
                                        <button onClick={() => setShowReviews(false)} className="text-[var(--color-neon)]/60 hover:text-[var(--color-neon)] hover:bg-white/5 p-2 rounded-full transition-colors">
                                            <X className="w-6 h-6 lg:w-8 lg:h-8" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-3 custom-panel-scroll">
                                    {reviews.map((rev) => (
                                        <div key={rev.id} className="p-4 lg:p-6 bg-black/40 border border-white/5 space-y-3 hover:border-[var(--color-neon)]/30 transition-all rounded-xl">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-[var(--color-neon)]/10 border border-[var(--color-neon)]/20 flex items-center justify-center">
                                                        <User className="w-4 h-4 lg:w-5 lg:h-5 text-[var(--color-neon)]" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm lg:text-base font-black text-white uppercase tracking-wider">{rev.user}</span>
                                                        <span className="text-[10px] font-mono text-gray-500">{rev.time}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 bg-[var(--color-neon)]/5 px-2.5 py-1 rounded-lg border border-[var(--color-neon)]/10">
                                                    <Star className="w-3.5 h-3.5 text-[#A3FF12] fill-[#A3FF12]" />
                                                    <span className="text-base lg:text-xl font-black text-[var(--color-neon)]">{rev.rating}.0</span>
                                                </div>
                                            </div>
                                            <p className="text-gray-300 text-sm italic leading-relaxed">"{rev.comment}"</p>
                                        </div>
                                    ))}

                                    {/* Write review inline — mobile only */}
                                    <div className="lg:hidden pt-2 pb-4">
                                        <p className="text-[10px] font-mono text-[var(--color-neon)]/60 uppercase tracking-[0.3em] mb-2">Write a Review</p>
                                        <div className="flex items-center gap-2 mb-2.5">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={`mobile-star-${star}`}
                                                    type="button"
                                                    onClick={() => setNewReviewRating(star)}
                                                    className="w-7 h-7 rounded-sm border border-[var(--color-neon)]/30 bg-black/30 flex items-center justify-center"
                                                    aria-label={`Set rating ${star}`}
                                                >
                                                    <Star className={`w-4 h-4 ${star <= newReviewRating ? 'text-[#A3FF12] fill-[#A3FF12]' : 'text-[var(--color-neon)]/35'}`} />
                                                </button>
                                            ))}
                                            <span className="ml-1 text-[10px] font-mono text-[var(--color-neon)]/75 uppercase tracking-[0.14em]">{newReviewRating}.0</span>
                                        </div>
                                        <div className="relative flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={newReviewText}
                                                onChange={(e) => setNewReviewText(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddReview()}
                                                placeholder="Share your experience..."
                                                className="w-full bg-black border-2 border-[var(--color-neon)]/40 focus:border-[var(--color-neon)] py-3 flex-1 px-4 text-sm text-white focus:outline-none transition-colors placeholder:text-gray-500 rounded-sm"
                                            />
                                            <button onClick={handleAddReview} className="w-12 h-12 bg-[var(--color-neon)] text-black flex items-center justify-center shadow-[0_0_20px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.5)] hover:shadow-[0_0_30px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.7)] transition-all shrink-0 rounded-sm">
                                                <Send className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Write review pinned footer — desktop only */}
                                <div className="hidden lg:block shrink-0 p-6 bg-[#071510] border-t-2 border-[var(--color-neon)]/50">
                                    <p className="text-[10px] font-mono text-[var(--color-neon)]/60 uppercase tracking-[0.3em] mb-2">Write a Review</p>
                                    <div className="flex items-center gap-2 mb-2.5">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={`desktop-star-${star}`}
                                                type="button"
                                                onClick={() => setNewReviewRating(star)}
                                                className="w-8 h-8 rounded-sm border border-[var(--color-neon)]/30 bg-black/30 flex items-center justify-center"
                                                aria-label={`Set rating ${star}`}
                                            >
                                                <Star className={`w-4 h-4 ${star <= newReviewRating ? 'text-[#A3FF12] fill-[#A3FF12]' : 'text-[var(--color-neon)]/35'}`} />
                                            </button>
                                        ))}
                                        <span className="ml-1 text-[10px] font-mono text-[var(--color-neon)]/75 uppercase tracking-[0.14em]">{newReviewRating}.0</span>
                                    </div>
                                    <div className="relative flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={newReviewText}
                                            onChange={(e) => setNewReviewText(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddReview()}
                                            placeholder="Share your experience..."
                                            className="w-full bg-black border-2 border-[var(--color-neon)]/40 focus:border-[var(--color-neon)] py-3 flex-1 px-4 text-sm text-white focus:outline-none transition-colors placeholder:text-gray-500 rounded-sm"
                                        />
                                        <button onClick={handleAddReview} className="w-12 h-12 bg-[var(--color-neon)] text-black flex items-center justify-center shadow-[0_0_20px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.5)] hover:shadow-[0_0_30px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.7)] transition-all shrink-0 rounded-sm">
                                            <Send className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Ground Glow Shadow */}
            <div className="absolute -bottom-16 w-full h-8 bg-[var(--color-neon)] blur-[60px] opacity-20 pointer-events-none" />
        </main>
    );
}
