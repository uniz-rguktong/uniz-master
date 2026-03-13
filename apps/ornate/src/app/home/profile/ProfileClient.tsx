'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, LogOut } from 'lucide-react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ProfileCard from '@/components/profile/ProfileCard';
import ProfileFooter from '@/components/profile/ProfileFooter';
import SpaceshipNav from '@/components/ui/SpaceshipNav';
import SectorHeader from '@/components/layout/SectorHeader';
import ShareModal from '@/components/profile/ShareModal';
import type { getMyProfile } from '@/lib/actions/profile';

type ProfileData = Awaited<ReturnType<typeof getMyProfile>>;

// ─── Starfield canvas ───────────────────────────────────────────────────────
function StarField() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        let raf: number;
        const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        resize();
        window.addEventListener('resize', resize);

        const stars = Array.from({ length: 280 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 1.4 + 0.3,
            a: Math.random(),
            speed: Math.random() * 0.004 + 0.001,
            twinkle: Math.random() * Math.PI * 2,
        }));

        const loop = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            stars.forEach(s => {
                s.twinkle += s.speed;
                s.a = 0.3 + Math.sin(s.twinkle) * 0.5;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${Math.max(0, s.a)})`;
                ctx.fill();
            });
            raf = requestAnimationFrame(loop);
        };
        loop();
        return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
    }, []);
    return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
}

// ─── Floating particles ─────────────────────────────────────────────────────
function Particles() {
    const [particles, setParticles] = useState<{ left: string; top: string; color: string; duration: number; delay: number }[]>([]);

    useEffect(() => {
        const colors = ['#D6FF00', '#22d3ee', '#fbbf24'];
        setParticles(
            Array.from({ length: 20 }, (_, i) => ({
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                color: colors[i % 3],
                duration: 3 + Math.random() * 4,
                delay: Math.random() * 4,
            }))
        );
    }, []);

    return (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            {particles.map((p, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full"
                    style={{ left: p.left, top: p.top, backgroundColor: p.color, opacity: 0.4 }}
                    animate={{ y: [0, -30, 0], opacity: [0.2, 0.7, 0.2], scale: [1, 1.5, 1] }}
                    transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
                />
            ))}
        </div>
    );
}



export default function ProfileClient({ profile }: { profile: ProfileData }) {
    const mainRef = useRef<HTMLElement>(null);
    const { status } = useSession();
    const [mounted, setMounted] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isAuthenticated = mounted && status === 'authenticated';
    const router = useRouter();

    return (
        <>
            <style jsx global>{`
                .profile-scroll-container::-webkit-scrollbar { 
                    width: 5px; 
                }
                .profile-scroll-container::-webkit-scrollbar-track { 
                    background: transparent; 
                }
                .profile-scroll-container::-webkit-scrollbar-thumb { 
                    background: rgba(214, 255, 0, 0.1); 
                    border-radius: 20px;
                    border: 1px solid rgba(214, 255, 0, 0.05);
                    transition: all 0.3s ease;
                }
                .profile-scroll-container::-webkit-scrollbar-thumb:hover { 
                    background: rgba(214, 255, 0, 0.4); 
                    box-shadow: 0 0 10px rgba(214, 255, 0, 0.5);
                }
                /* For Firefox */
                .profile-scroll-container {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(214, 255, 0, 0.2) transparent;
                }
            `}</style>

            <SpaceshipNav accentColor="#D6FF00" scrollContainerRef={mainRef} />

            <main
                ref={mainRef}
                className="profile-scroll-container relative w-screen h-screen text-white overflow-x-hidden overflow-y-auto bg-[#030308] font-orbitron"
            >
                {/* Background elements removed */}

                {/* Global Scanline Overlay (Subtle) */}
                <div className="pointer-events-none fixed inset-0 z-100 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(255,255,255,0.1)_50%)] bg-size-[100%_4px]" />

                <SectorHeader
                    showTitle={false}
                    accentColor="#D6FF00"
                    hideProfile={true}
                    rightElement={
                        <div className="flex items-center gap-6">
                            <button 
                                onClick={() => setIsShareOpen(true)}
                                className="text-white/60 hover:text-[#D6FF00] transition-colors transform hover:scale-110 active:scale-95"
                                title="Share Profile"
                            >
                                <Share2 className="w-5 h-5" />
                            </button>
                            {isAuthenticated && (
                                <button
                                    onClick={() => signOut({ callbackUrl: '/home' })}
                                    className="group flex items-center gap-2 text-white/60 hover:text-red-400 transition-colors transform hover:scale-110 active:scale-95"
                                    title="Logout"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span className="text-xs font-bold tracking-[0.2em] uppercase hidden sm:inline">Logout</span>
                                </button>
                            )}
                        </div>
                    }
                />

                <div className="relative w-full min-h-screen flex flex-col items-center justify-start gap-10 px-0 pt-32 sm:pt-24 pb-10 z-20">

                    {/* Profile Content */}
                    <div className="w-full relative z-30">
                        <ProfileCard profile={profile} />
                    </div>

                </div>

                {/* The Huge Footer mimicking Landonorris */}
                <div className="relative z-10">
                    <ProfileFooter userName={profile?.name ?? undefined} />
                </div>

                <ShareModal 
                    isOpen={isShareOpen}
                    onClose={() => setIsShareOpen(false)}
                    shareUrl={mounted ? window.location.href : ''}
                    title={`Check out ${profile?.name || 'this'}'s Profile on ORNATE`}
                />
            </main>
        </>
    );
}

