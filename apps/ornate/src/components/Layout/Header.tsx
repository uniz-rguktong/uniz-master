'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLenis } from 'lenis/react';
import gsap from 'gsap';
import SplitText from '@/components/UI/SplitText';
import { getAssetUrl } from '@/lib/assets';

export default function Header() {
    const [scrolled, setScrolled] = useState(false);
    const [isWarping, setIsWarping] = useState(false);
    const [isHidden, setIsHidden] = useState(false);
    const lenis = useLenis();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        const handleWormholeStart = () => setIsHidden(true);

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('wormhole-start', handleWormholeStart);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('wormhole-start', handleWormholeStart);
        };
    }, []);

    const triggerWarp = (mode: 'login' | 'register') => {
        if (!lenis || isWarping) return;

        setIsWarping(true);
        window.dispatchEvent(new CustomEvent('auth-mode', { detail: { mode } }));
        window.dispatchEvent(new Event('warp-start'));

        // Phase 1: Screen Blinds with Flash
        gsap.to('.warp-flash', {
            opacity: 1,
            duration: 0.6,
            ease: 'power4.in',
            onComplete: () => {
                // Phase 2: Instant Teleport while blinded
                lenis.scrollTo('bottom', { immediate: true });

                // Phase 3: Fade out hyperdrive flash revealing the End Form
                gsap.to('.warp-flash', {
                    opacity: 0,
                    duration: 1.2,
                    ease: 'power2.out',
                    delay: 0.1,
                    onComplete: () => {
                        setIsWarping(false);
                        window.dispatchEvent(new Event('warp-end'));
                    },
                });
            },
        });
    };

    return (
        <>
            {/* The Cinematic Warp Flash Overlay */}
            <div
                className="warp-flash fixed inset-0 bg-white z-[999] pointer-events-none mix-blend-screen"
                style={{ opacity: 0, display: isWarping ? 'block' : 'none' }}
            />

            <header
                className={`fixed top-0 inset-x-0 z-[100] transition-all duration-700 ease-in-out
                    ${scrolled ? 'pt-3 sm:pt-4' : 'pt-4 sm:pt-8'}
                    ${isHidden ? '-translate-y-full opacity-0 pointer-events-none' : ''}`}
            >
                {/* ─── MOBILE HEADER (< md) ──────────────────────────────── */}
                <div className="md:hidden mx-3">
                    {/*
                     * Single unified floating pill on mobile.
                     * Left: RGUKT logo  |  Center: Ornate logo + name  |  Right: CTA
                     */}
                    <div className="flex items-center justify-between backdrop-blur-xl bg-black/50 rounded-full px-3 py-2 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">

                        {/* Left — RGUKT */}
                        <Link
                            href="/"
                            aria-label="RGUKT Home"
                            className="flex items-center gap-2 flex-shrink-0"
                        >
                            <Image
                                src={getAssetUrl('/assets/RguktLogo.svg')}
                                alt="RGUKT Logo"
                                width={24}
                                height={24}
                                priority
                                className="opacity-80"
                            />
                        </Link>

                        {/* Center — Ornate brand */}
                        <Link
                            href="/"
                            className="flex items-center gap-1.5 group absolute left-1/2 -translate-x-1/2"
                        >
                            <Image
                                id="header-logo-mobile"
                                src={getAssetUrl('/assets/Ornate_LOGO.svg')}
                                alt="Ornate Logo"
                                width={22}
                                height={22}
                                priority
                                className="opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                            />
                            <span className="text-white font-black text-sm tracking-[0.25em] uppercase">
                                ORNATE
                            </span>
                        </Link>

                        {/* Right — Join Mission CTA */}
                        <button
                            onClick={() => triggerWarp('register')}
                            aria-label="Join Mission"
                            className="flex-shrink-0 flex items-center justify-center px-3 py-1.5 rounded-full overflow-hidden
                                border border-[#A3FF12]/50 hover:border-[#A3FF12]
                                bg-[#A3FF12]/10 hover:bg-[#A3FF12]/20
                                shadow-[0_0_12px_rgba(163,255,18,0.2)] hover:shadow-[0_0_20px_rgba(163,255,18,0.4)]
                                transition-all duration-300 cursor-pointer"
                        >
                            <span className="text-[#A3FF12] text-[9px] font-black uppercase tracking-[0.15em] whitespace-nowrap">
                                Join
                            </span>
                        </button>
                    </div>
                </div>

                {/* ─── DESKTOP HEADER (≥ md) ─────────────────────────────── */}
                <div className="hidden md:flex max-w-[95rem] mx-auto px-4 sm:px-8 relative items-center justify-center">

                    {/* Left Brand */}
                    <Link href="/" className="absolute left-6 md:left-8 flex items-center gap-3 group overflow-hidden">
                        <Image
                            src={getAssetUrl('/assets/RguktLogo.svg')}
                            alt="RGUKT Logo"
                            width={28}
                            height={28}
                            priority
                            className="opacity-90 group-hover:opacity-100 transition-all duration-300 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                        />
                        <div className="hidden md:block">
                            <SplitText
                                text="RGUKTong"
                                className="text-white font-black text-lg md:text-xl tracking-[0.3em] uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] mt-0.5"
                                delay={40}
                                duration={1.2}
                                ease="power4.out"
                                splitType="chars"
                                from={{ opacity: 0, y: 40, rotationX: -90 }}
                                to={{ opacity: 1, y: 0, rotationX: 0 }}
                                tag="span"
                                textAlign="left"
                            />
                        </div>
                    </Link>

                    {/* Center Ornate Section */}
                    <nav className="flex items-center justify-center backdrop-blur-md bg-black/5 rounded-full px-4 md:px-6 py-2 border border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.3)] relative">
                        <Link href="/" className="flex items-center gap-2 md:gap-3 group">
                            <Image
                                id="header-logo"
                                src={getAssetUrl('/assets/Ornate_LOGO.svg')}
                                alt="Ornate Logo"
                                width={28}
                                height={28}
                                priority
                                className="opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                            />
                            <span className="text-white font-black text-lg md:text-xl tracking-[0.3em] uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] mt-0.5">
                                ORNATE
                            </span>
                        </Link>
                    </nav>

                    {/* Call to Actions */}
                    <div className="absolute right-4 md:right-8 flex items-center gap-4 md:gap-6">
                        <button
                            onClick={() => triggerWarp('register')}
                            className="group relative px-4 md:px-6 py-2 md:py-2.5 rounded-full bg-transparent overflow-hidden border border-white/20 hover:border-white/60 transition-all duration-500 shadow-[0_0_10px_rgba(255,255,255,0.0)] hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] cursor-pointer"
                        >
                            <div className="absolute inset-0 bg-white/10 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out" />
                            <span className="relative text-[9px] md:text-[11px] uppercase text-white font-extrabold tracking-[0.1em] md:tracking-[0.2em]">
                                Join
                                <span className="hidden sm:inline"> Mission</span>
                            </span>
                        </button>
                    </div>

                </div>
            </header>
        </>
    );
}
