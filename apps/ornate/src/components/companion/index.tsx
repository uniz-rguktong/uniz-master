'use client';

import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ChevronLeft, ChevronRight, Menu, X, Target, Calendar, Orbit, Gamepad2, User, Star, Home } from 'lucide-react';
import { pingoSpeak } from '@/lib/pingoSpeak';
import { BOREDOM_PROMPTS, PAGE_INFO, BoredomPrompt } from './constants';
import { StoryHubPanel } from './StoryHubPanel';
import { GreetingBubble } from './GreetingBubble';

export default function CompanionBot() {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [showPanel, setShowPanel] = useState(false);
    const [showRadialMenu, setShowRadialMenu] = useState(false);
    const [showGreeting, setShowGreeting] = useState(false);
    const [greetingText, setGreetingText] = useState("Welcome Cadet");
    const [displayedText, setDisplayedText] = useState("");
    const [showBoredPrompt, setShowBoredPrompt] = useState(false);
    const [activePrompt, setActivePrompt] = useState<BoredomPrompt | null>(null);
    const [pingoSide, setPingoSide] = useState<'left' | 'right'>('left');
    const [isMessagesEnabled, setIsMessagesEnabled] = useState(true);
    
    // Position constraint state for docking
    const [isDocked, setIsDocked] = useState(false);
    const [constraints, setConstraints] = useState({ left: -2000, right: 2000, top: -2000, bottom: 2000 });
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    
    // Voice settings state 
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [spokenPages, setSpokenPages] = useState<Set<string>>(() => {
        if (typeof window !== 'undefined') {
            const saved = sessionStorage.getItem('pingo_spoken_pages');
            if (saved) {
                try {
                    return new Set(JSON.parse(saved));
                } catch (e) {
                    console.error('Failed to parse pingo_spoken_pages', e);
                }
            }
        }
        return new Set();
    });

    const botRef = useRef<HTMLDivElement>(null);
    const dragStartPos = useRef<{ x: number; y: number } | null>(null);
    const router = useRouter();
    const pathname = usePathname();
    const { data: session, status } = useSession();

    const markAsSpoken = (pageKey: string) => {
        setSpokenPages(prev => {
            const next = new Set(prev).add(pageKey);
            sessionStorage.setItem('pingo_spoken_pages', JSON.stringify(Array.from(next)));
            return next;
        });
    };

    useEffect(() => {
        const updateConstraints = () => {
            if (botRef.current) {
                const ww = window.innerWidth;
                const wh = window.innerHeight;
                const bw = botRef.current.offsetWidth || 100;
                const bh = botRef.current.offsetHeight || 100;

                const zeroLeft = ww * 0.1;
                const zeroTop = wh - (wh * 0.29) - bh;

                const minVisX = bw * 0.35;
                const minVisY = bh * 0.35;

                setConstraints({
                    left: -zeroLeft - bw + minVisX,
                    right: ww - zeroLeft - minVisX,
                    top: -zeroTop,
                    bottom: wh - zeroTop - bh
                });
            }
        };
        const t = setTimeout(updateConstraints, 100);
        window.addEventListener('resize', updateConstraints);
        return () => {
            clearTimeout(t);
            window.removeEventListener('resize', updateConstraints);
        };
    }, []);

    const performDock = () => {
        if (!botRef.current) return;
        const ww = window.innerWidth;
        const bw = botRef.current.offsetWidth || 100;
        const zeroLeft = ww * 0.1;
        const minVisX = bw * 0.35;
        
        if (pingoSide === 'left') {
            animate(x, -zeroLeft - bw + minVisX, { type: 'spring', damping: 20, stiffness: 100 });
        } else {
            animate(x, ww - zeroLeft - minVisX, { type: 'spring', damping: 20, stiffness: 100 });
        }
        setIsDocked(true);
        setShowPanel(false);
        setShowGreeting(false);
    };

    const performUndock = () => {
        if (!botRef.current) return;
        const bw = botRef.current.offsetWidth || 100;
        const moveAmount = bw * 0.65;
        if (pingoSide === 'left') {
            const targetX = Math.max(x.get() + moveAmount, constraints.left + moveAmount);
            animate(x, targetX, { type: 'spring', damping: 20, stiffness: 100 });
        } else {
            const targetX = Math.min(x.get() - moveAmount, constraints.right - moveAmount);
            animate(x, targetX, { type: 'spring', damping: 20, stiffness: 100 });
        }
        setIsDocked(false);
    };

    useEffect(() => {
        const savedVoice = localStorage.getItem('pingoVoiceEnabled');
        if (savedVoice !== null) {
            setIsVoiceEnabled(savedVoice === 'true');
        }
        const savedMessages = localStorage.getItem('pingoMessagesEnabled');
        if (savedMessages !== null) {
            setIsMessagesEnabled(savedMessages === 'true');
        }
        setHasLoaded(true);
    }, []);

    useEffect(() => {
        if (hasLoaded) {
            localStorage.setItem('pingoVoiceEnabled', isVoiceEnabled.toString());
            localStorage.setItem('pingoMessagesEnabled', isMessagesEnabled.toString());
            if (!isVoiceEnabled && typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        }
    }, [isVoiceEnabled, isMessagesEnabled, hasLoaded]);

    const hideGreetingOnly = () => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setShowGreeting(false);
    };

    useEffect(() => {
        if (status === 'unauthenticated') {
            sessionStorage.removeItem('pingo_spoken_pages');
            setSpokenPages(new Set());
        }
    }, [status]);

    const displayName = session?.user?.name ? session.user.name.split(' ')[0] : null;

    const speakMessage = (text: string) => {
        if (hasLoaded && isVoiceEnabled) {
            pingoSpeak(text);
        }
    };

    useEffect(() => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.getVoices();
        }
        const timer = setTimeout(() => setIsLoaded(true), 1500);

        const handleSidebarMove = () => {
            if (window.innerWidth < 640) {
                setPingoSide('right');
                setIsDocked(true);
                setShowPanel(false);
                setShowGreeting(false);
                
                if (botRef.current) {
                    const ww = window.innerWidth;
                    const bw = botRef.current.offsetWidth || 100;
                    const zeroLeft = ww * 0.1;
                    const minVisX = bw * 0.35;
                    animate(x, ww - zeroLeft - minVisX, { type: 'spring', damping: 20, stiffness: 100 });
                }
            }
        };

        window.addEventListener('open-ornate-sidebar', handleSidebarMove);
        window.addEventListener('toggle-ornate-sidebar', handleSidebarMove);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('open-ornate-sidebar', handleSidebarMove);
            window.removeEventListener('toggle-ornate-sidebar', handleSidebarMove);
        };
    }, []);

    useEffect(() => {
        if (!hasLoaded || !isMessagesEnabled) return;
        
        const pageKey = pathname || 'default';
        if (spokenPages.has(pageKey)) return;
        
        let currentGreeting = "Found our way! I'm ready to walk (or slide, since I'm a penguin).";

        if (pathname === '/login') {
            currentGreeting = "Hi friend! I'm Pingo. Sign in so we can start our space journey!";
        } 
        else if (pathname && PAGE_INFO[pathname]) {
            currentGreeting = PAGE_INFO[pathname];
        } 
        else if (pathname && pathname !== '/' && pathname !== '/home') {
            const pathParts = pathname.split('/').filter(Boolean);
            const lastPart = pathParts[pathParts.length - 1];
            const formattedName = lastPart.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
            
            if (pathname.includes('/branches/')) {
                currentGreeting = `Whoa! The ${formattedName} area is looking sharp. Let's see what's inside!`;
            } else if (pathname.includes('/stories/')) {
                currentGreeting = `Time to read: ${formattedName}. I hope it's a good one!`;
            } else {
                currentGreeting = `Walking into the ${formattedName} area. It looks exciting!`;
            }
        } 
        else {
            const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
            if (!hasSeenWelcome) {
                currentGreeting = displayName 
                    ? `Hi ${displayName}! I'm Pingo, your new space buddy! I'll be your guide here. Ready for an adventure? Why don't you start by making your spaceship look cool? You can change its color in your Profile!`
                    : "Hi there! I'm Pingo, your new space buddy! I'll be your guide here in the Ornate galaxy. Want to start by making your spaceship look cool? You can pick your favorite color in your Profile!";
                localStorage.setItem('hasSeenWelcome', 'true');
            } else {
                currentGreeting = displayName 
                    ? `Welcome back, ${displayName}! I've been keepin' the ship clean for ya. Want to check your space rank or maybe change the ship's color again in your Profile?`
                    : "Welcome back, friend! Our spaceship is fueled up and ready! Want to change your ship's color or see what's new in the galaxy?";
            }
        }

        setGreetingText(currentGreeting);
        setShowGreeting(true);
        speakMessage(currentGreeting);
        markAsSpoken(pageKey);

        const hideTimer = setTimeout(() => setShowGreeting(false), 8000);
        return () => clearTimeout(hideTimer);
    }, [pathname, hasLoaded, status]);

    useEffect(() => {
        if (!showGreeting) {
            setDisplayedText("");
            return;
        }
        setDisplayedText("");
        let i = 0;
        const speed = 15;
        const interval = setInterval(() => {
            setDisplayedText(greetingText.slice(0, i + 1));
            i++;
            if (i >= greetingText.length) clearInterval(interval);
        }, speed);
        return () => clearInterval(interval);
    }, [showGreeting, greetingText]);

    useEffect(() => {
        if (!showPanel) return;
        const handler = (e: MouseEvent) => {
            const panel = document.getElementById('story-hub-panel');
            const bot = document.getElementById('companion-bot-pingo');
            if (!panel?.contains(e.target as Node) && !bot?.contains(e.target as Node)) {
                setShowPanel(false);
            }
        };
        window.addEventListener('mousedown', handler);
        return () => window.removeEventListener('mousedown', handler);
    }, [showPanel]);

    useEffect(() => {
        if (!isLoaded || showGreeting || showPanel || !isMessagesEnabled) return;
        if (pathname !== '/' && pathname !== '/home') return;

        const timer = setTimeout(() => {
            const randomPrompt = BOREDOM_PROMPTS[Math.floor(Math.random() * BOREDOM_PROMPTS.length)];
            setActivePrompt(randomPrompt);
            setGreetingText(randomPrompt.question);
            setShowGreeting(true);
            setShowBoredPrompt(true);
            speakMessage(randomPrompt.question);
        }, 25000);

        return () => clearTimeout(timer);
    }, [isLoaded, pathname, showGreeting, showPanel]);

    const handleYesClick = (e: React.MouseEvent) => {
        if (!activePrompt) return;
        e.stopPropagation();
        setShowBoredPrompt(false);

        const responseMsg = activePrompt.response;
        setGreetingText(responseMsg);
        speakMessage(responseMsg);

        if (activePrompt.story) {
            setTimeout(() => {
                setGreetingText(activePrompt.story!);
                speakMessage(activePrompt.story!);
                setTimeout(() => setShowGreeting(false), Math.min(activePrompt.story!.length * 80, 15000));
            }, 3000);
            return;
        }

        if (activePrompt.route) {
            setTimeout(() => {
                setShowGreeting(false);
                router.push(activePrompt.route!);
            }, 3500);
        }
    };

    const handleBotClick = () => {
        if (isDragging) return;
        setShowPanel((prev) => !prev);
        setShowRadialMenu(false);
        setShowGreeting(false);
    };

    const MENU_ITEMS = [
        { name: 'Missions', icon: Target, href: '/home/missions' },
        { name: 'Home', icon: Home, href: '/home' },
        { name: 'Fest', icon: Star, href: '/home/fest' },
        { name: 'Planets', icon: Orbit, href: '/home/planet-view' },
        { name: 'Fun', icon: Gamepad2, href: '/home/fun' },
        { name: 'Hub', icon: User, href: '/home/cadet-hub' },
    ];

    if (pathname === '/') return null;

    return (
        <AnimatePresence>
            {isLoaded && (
                <motion.div
                    id="companion-bot-pingo"
                    ref={botRef}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', damping: 15 }}
                    drag
                    dragMomentum={false}
                    onDragStart={(_e, info) => {
                        setIsDragging(true);
                        setIsDocked(false);
                        setShowRadialMenu(false);
                        dragStartPos.current = { x: info.point.x, y: info.point.y };
                    }}
                    onDrag={(_e, info) => setPingoSide(info.point.x > window.innerWidth / 2 ? 'right' : 'left')}
                    onDragEnd={(_e, info) => {
                        setIsDragging(false);
                        setPingoSide(info.point.x > window.innerWidth / 2 ? 'right' : 'left');
                        if (dragStartPos.current) {
                            const dx = Math.abs(info.point.x - dragStartPos.current.x);
                            const dy = Math.abs(info.point.y - dragStartPos.current.y);
                            if (dx < 5 && dy < 5) {
                                setShowRadialMenu((prev) => !prev);
                                setShowGreeting(false);
                            }
                        }
                        dragStartPos.current = null;
                    }}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    className="fixed z-[9999] cursor-grab active:cursor-grabbing pointer-events-auto"
                    style={{
                        x, y,
                        width: 'clamp(80px, 12vw, 140px)',
                        height: 'clamp(80px, 12vw, 140px)',
                        left: '10vw',
                        bottom: '29vh',
                    }}
                    dragConstraints={constraints}
                >
                    <AnimatePresence>
                        {showPanel && !isDragging && (
                            <StoryHubPanel 
                                onClose={() => setShowPanel(false)} 
                                botRef={botRef} 
                                isVoiceEnabled={isVoiceEnabled}
                                setIsVoiceEnabled={setIsVoiceEnabled}
                                isMessagesEnabled={isMessagesEnabled}
                                setIsMessagesEnabled={setIsMessagesEnabled}
                            />
                        )}
                    </AnimatePresence>

                    <motion.div
                        className="w-full h-full relative"
                        onClick={handleBotClick}
                        animate={isDragging ? { y: 0, rotate: 0, scale: 1.1 } : { y: [0, -10, 0], rotate: [0, 3, -3, 0], scale: 1 }}
                        transition={{
                            y: { repeat: Infinity, duration: 4, ease: 'easeInOut' },
                            rotate: { repeat: Infinity, duration: 5, ease: 'easeInOut' },
                            scale: { duration: 0.2 },
                        }}
                    >
                        <motion.div
                            className="absolute inset-0 rounded-full blur-3xl pointer-events-none opacity-40"
                            animate={{
                                backgroundColor: isDragging ? '#22d3ee' : showPanel ? '#60a5fa' : '#a3ff12',
                                scale: isHovering || isDragging || showPanel ? [1, 1.3, 1] : [1, 1.1, 1],
                            }}
                            transition={{ repeat: Infinity, duration: 3 }}
                        />

                        <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none">
                            <div className="w-full h-full border border-dashed border-[var(--color-neon)]/30 rounded-full animate-[spin_12s_linear_infinite]" />
                            <div className="absolute w-[80%] h-[80%] border border-[var(--color-neon)]/20 rounded-full animate-[spin_18s_linear_infinite_reverse]" />
                        </div>

                        <AnimatePresence>
                            {showPanel && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="absolute inset-[-6px] rounded-full pointer-events-none"
                                    style={{
                                        border: '2px solid rgba(96,165,250,0.5)',
                                        boxShadow: '0 0 18px rgba(96,165,250,0.35), inset 0 0 18px rgba(96,165,250,0.1)',
                                    }}
                                />
                            )}
                        </AnimatePresence>

                        <img src="/assets/Pingo_Bot.png" alt="Pingo Companion" draggable={false} className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_20px_rgba(163,255,18,0.5)] select-none pointer-events-none" />

                        {/* Toggle Dock Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (isDocked) performUndock();
                                else performDock();
                            }}
                            className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/60 border border-[var(--color-neon)]/50 flex flex-col items-center justify-center hover:bg-black/90 hover:scale-110 transition-all z-50 text-[var(--color-neon)] select-none"
                            style={{
                                left: pingoSide === 'right' ? '-12px' : 'auto',
                                right: pingoSide === 'left' ? '-12px' : 'auto',
                            }}
                        >
                            {pingoSide === 'left' ? (
                                isDocked ? <ChevronRight className="w-4 h-4 ml-0.5" /> : <ChevronLeft className="w-4 h-4 mr-0.5" />
                            ) : (
                                isDocked ? <ChevronLeft className="w-4 h-4 mr-0.5" /> : <ChevronRight className="w-4 h-4 ml-0.5" />
                            )}
                        </button>

                        {/* Top Menu Button Toggle for Pingo */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (isDragging) return;
                                setShowRadialMenu(!showRadialMenu);
                                setShowGreeting(false);
                                setShowPanel(false);
                            }}
                            className={`absolute left-1/2 -translate-x-1/2 rounded-full flex items-center justify-center transition-all z-[60] select-none shadow-[0_0_10px_rgba(0,0,0,0.5)] ${
                                showRadialMenu 
                                ? '-top-4 sm:-top-6 lg:-top-8 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-black/95 border-2 border-rose-500/80 text-rose-400 hover:bg-zinc-950 hover:border-rose-400 hover:text-rose-400 hover:scale-110 hover:shadow-[0_0_20px_#f43f5e80]' 
                                : '-top-3 sm:-top-5 lg:-top-6 w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-black/80 border border-[var(--color-neon)]/50 text-[var(--color-neon)] hover:bg-black hover:scale-110'
                            }`}
                        >
                            {showRadialMenu ? <X className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 stroke-[3]" /> : <Menu className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />}
                        </button>

                        {/* Circular Action Menu */}
                        <AnimatePresence>
                            {showRadialMenu && !isDragging && (
                                <motion.div 
                                    className="absolute top-1/2 left-1/2 w-0 h-0 pointer-events-none z-[60]"
                                >
                                    {MENU_ITEMS.map((item, index) => {
                                        // create a circular menu using polar coordinates
                                        const angle = (index * (360 / MENU_ITEMS.length)) - 90;
                                        // compact radius around pingo on mobile, larger on desktop to prevent overlaps
                                        const radius = typeof window !== 'undefined' && window.innerWidth >= 1024 ? 135 : 80; 
                                        const xPos = Math.cos(angle * (Math.PI / 180)) * radius;
                                        const yPos = Math.sin(angle * (Math.PI / 180)) * radius;

                                        return (
                                            <motion.button
                                                key={item.name}
                                                initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                                                animate={{ opacity: 1, x: xPos, y: yPos, scale: 1 }}
                                                exit={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                                                whileHover={{ 
                                                    scale: 1.15, 
                                                    backgroundColor: 'var(--color-neon)',
                                                    color: '#000000',
                                                    boxShadow: '0 0 25px var(--color-neon)',
                                                }}
                                                transition={{ 
                                                    type: 'spring', 
                                                    damping: 15, 
                                                    stiffness: 300, 
                                                    delay: index * 0.04,
                                                    layout: { duration: 0.2 }
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowRadialMenu(false);
                                                    router.push(item.href);
                                                }}
                                                className="absolute w-10 h-10 sm:w-12 sm:h-12 lg:w-[68px] lg:h-[68px] -ml-5 -mt-5 sm:-ml-6 sm:-mt-6 lg:-ml-[34px] lg:-mt-[34px] rounded-full bg-black/90 border border-[var(--color-neon)]/50 flex flex-col items-center justify-center text-[var(--color-neon)] transition-colors duration-300 pointer-events-auto overflow-hidden"
                                                title={item.name}
                                                style={{ boxShadow: '0 0 10px rgba(0,255,202,0.1)' }}
                                            >
                                                <item.icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 mb-0.5 lg:mb-1 shrink-0" />
                                                <span className="text-[6px] sm:text-[7px] lg:text-[8px] font-black uppercase tracking-[0.05em] lg:tracking-[0.1em] opacity-90 leading-none text-center px-1 w-full truncate">{item.name}</span>
                                            </motion.button>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="absolute -bottom-[5%] left-0 w-full h-[20%] z-0 flex justify-around px-[15%] pointer-events-none">
                            {[0, 1].map((i) => (
                                <div key={i} className="relative w-[15%] h-full">
                                    <motion.div
                                        animate={{ height: ['60%', '100%', '75%', '90%', '60%'], opacity: [0.6, 1, 0.7, 0.9, 0.6], scaleX: [1, 1.2, 0.9, 1.1, 1] }}
                                        transition={{ repeat: Infinity, duration: 0.15, delay: i * 0.1, ease: 'easeInOut' }}
                                        className="absolute top-0 left-1/2 -translate-x-1/2 w-full bg-gradient-to-t from-transparent via-[var(--color-neon)]/60 to-[var(--color-neon)] blur-[2px] rounded-b-full shadow-[0_8px_15px_var(--color-neon)]"
                                        style={{ transformOrigin: 'top' }}
                                    />
                                    <motion.div
                                        animate={{ scale: [1, 1.4, 1.1, 1.3, 1], opacity: [0.1, 0.3, 0.2, 0.3, 0.1] }}
                                        transition={{ repeat: Infinity, duration: 0.3, delay: i * 0.1, ease: 'linear' }}
                                        className="absolute top-0 left-1/2 -translate-x-1/2 w-[250%] h-[150%] bg-[var(--color-neon)]/10 blur-xl rounded-full"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className={`absolute top-[18%] right-[18%] w-[10%] h-[10%] rounded-full shadow-[0_0_12px_#a3ff12] animate-pulse z-20 border border-white/40 ${isDragging ? 'bg-cyan-400' : showPanel ? 'bg-blue-400' : 'bg-[var(--color-neon)]'}`} />
                    </motion.div>

                    <AnimatePresence>
                        {showGreeting && !isDragging && !showPanel && (
                            <GreetingBubble 
                                pingoSide={pingoSide}
                                displayedText={displayedText}
                                showBoredPrompt={showBoredPrompt}
                                handleYesClick={handleYesClick}
                                isVoiceEnabled={isVoiceEnabled}
                                setIsVoiceEnabled={setIsVoiceEnabled}
                                onMinimize={hideGreetingOnly}
                            />
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
