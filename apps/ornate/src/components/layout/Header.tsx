'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLenis } from 'lenis/react';
import gsap from 'gsap';

import { useSession } from 'next-auth/react';

export default function Header() {
    const { status } = useSession();
    const isAuthenticated = status === 'authenticated';
    const [scrolled, setScrolled] = useState(false);
    const [isHidden, setIsHidden] = useState(false);
    const router = useRouter();

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
        if (isAuthenticated) {
            router.push('/home');
            return;
        }
        router.push(`/login?mode=${mode}`);
    };

    return (
        <>
            <header
                className={`fixed top-0 inset-x-0 z-[100] transition-all duration-700 ease-in-out
                    ${scrolled ? 'pt-3 sm:pt-4' : 'pt-4 sm:pt-8'}
                    ${isHidden ? '-translate-y-full opacity-0 pointer-events-none' : ''}`}
            >
                {/* ─── MOBILE HEADER (< md) ──────────────────────────────── */}
                <div className={`md:hidden mx-3 rounded-2xl transition-all duration-500 ${scrolled ? 'bg-[#030308]/40 backdrop-blur-lg shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-white/10' : 'bg-[#030308]/10 backdrop-blur-sm border border-transparent'}`}>
                    {/*
                     * Single unified floating pill on mobile.
                     * Left: RGUKT logo  |  Center: Ornate logo + name  |  Right: CTA
                     */}
                    <div className="flex items-center justify-between px-3 py-2 relative">

                        {/* Left — RGUKT */}
                        <Link
                            href="/"
                            aria-label="RGUKT Home"
                            className="flex items-center gap-2 flex-shrink-0"
                        >
                            <Image
                                src="/assets/rgukt_logo.png"
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
                            className="flex items-center gap-1.5 group absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                        >
                            <Image
                                id="header-logo-mobile"
                                src="/assets/Ornate_LOGO.svg"
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
                            className="group relative flex-shrink-0 flex items-center justify-center px-5 py-[6px] rounded-full overflow-hidden cursor-pointer shadow-[0_0_12px_rgba(0,240,255,0.3)] hover:shadow-[0_0_25px_rgba(0,240,255,0.7)] transition-shadow duration-500"
                        >
                            {/* Vibrant Neon Gradient Background */}
                            <div className="absolute inset-0 bg-gradient-to-r from-[#00F0FF] via-[#7000FF] to-[#00F0FF] bg-[length:200%_auto] animate-[pulse_3s_ease-in-out_infinite]" />

                            {/* Inner Dark Pill (Fades out on hover) */}
                            <div className="absolute inset-[1.5px] rounded-full bg-[#030308] group-hover:bg-black/10 transition-colors duration-500 z-0" />

                            {/* Sweeping Light Effect */}
                            <div className="absolute top-0 bottom-0 left-[-150%] w-[100%] bg-gradient-to-r from-transparent via-white/40 to-transparent transform skew-x-[-30deg] group-hover:translate-x-[300%] transition-transform duration-1000 ease-in-out z-10" />

                            <span className="relative z-20 text-[#00F0FF] group-hover:text-white font-black text-[10px] uppercase tracking-[0.2em] whitespace-nowrap drop-shadow-[0_0_8px_rgba(0,240,255,0.8)] transition-colors duration-500">
                                JOIN
                            </span>
                        </button>
                    </div>
                </div>

                {/* ─── DESKTOP HEADER (≥ md) ─────────────────────────────── */}
                <div className="hidden md:flex max-w-[95rem] mx-auto px-4 sm:px-8 relative items-center justify-center min-h-[60px]">

                    {/* Left Brand */}
                    <Link href="/" className="absolute top-1/2 left-6 md:left-8 -translate-y-1/2 flex items-center gap-3 group overflow-hidden">
                        <Image
                            src="/assets/rgukt_logo.png"
                            alt="RGUKT Logo"
                            width={28}
                            height={28}
                            priority
                            className="opacity-90 group-hover:opacity-100 transition-all duration-300 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                        />
                        <div className="hidden md:block">
                            <span className="text-white font-black text-lg md:text-xl tracking-[0.2em] uppercase">
                                Rgukt'Ong
                            </span>
                        </div>
                    </Link>

                    {/* Center Ornate Section */}
                    <nav className="flex items-center justify-center backdrop-blur-md bg-black/5 rounded-full px-4 md:px-6 py-2 border border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.3)] relative">
                        <Link href="/" className="flex items-center gap-2 md:gap-3 group">
                            <Image
                                id="header-logo"
                                src="/assets/Ornate_LOGO.svg"
                                alt="Ornate Logo"
                                width={28}
                                height={28}
                                priority
                                className="opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                            />
                            <span className="text-white font-black text-lg md:text-xl tracking-[0.3em] uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                                ORNATE
                            </span>
                        </Link>
                    </nav>

                    {/* Call to Actions */}
                    <div className="absolute top-1/2 right-4 md:right-8 -translate-y-1/2 flex items-center gap-4 md:gap-6">
                        <button
                            onClick={() => triggerWarp('register')}
                            className="group relative px-6 md:px-8 py-2 md:py-3 rounded-full overflow-hidden transition-all duration-500 cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.2)] hover:shadow-[0_0_30px_rgba(0,240,255,0.6)]"
                        >
                            {/* Animated Neon Gradient Border */}
                            <div className="absolute inset-0 bg-gradient-to-r from-[#00F0FF] via-[#7000FF] to-[#00F0FF] bg-[length:200%_auto] animate-[pulse_2s_linear_infinite]" />

                            {/* Inner Dark Pill (Fades on hover) */}
                            <div className="absolute inset-[1.5px] rounded-full bg-[#030308] group-hover:bg-black/20 transition-all duration-500 z-0" />

                            {/* High-Speed Shimmer Effect */}
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out z-10" />

                            <div className="relative z-20 flex items-center gap-2">
                                <span className="text-[#00F0FF] group-hover:text-white font-black text-[11px] md:text-[13px] uppercase tracking-[0.25em] drop-shadow-[0_0_8px_rgba(0,240,255,0.8)] transition-all duration-500">
                                    Join
                                    <span className="hidden sm:inline"> Mission</span>
                                </span>
                                {/* Small Radar Pulse Dot */}
                                <div className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] group-hover:bg-white animate-ping" />
                            </div>
                        </button>
                    </div>

                </div>
            </header>
        </>
    );
}
