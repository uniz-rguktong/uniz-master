'use client';

import { useEffect, useRef, useState, memo } from 'react';
import { Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import SectorHeader from '@/components/layout/SectorHeader';

/* ─── Animated Star Field (Canvas-based for performance) ─── */
const StarField = memo(() => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        resize();
        window.addEventListener('resize', resize);

        const stars = Array.from({ length: 300 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 1.5 + 0.2,
            speed: Math.random() * 0.2 + 0.05,
            flicker: Math.random() * Math.PI * 2,
        }));

        let animId: number;
        const draw = (t: number) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            stars.forEach(s => {
                const alpha = 0.3 + 0.5 * Math.sin(t * 0.001 * s.speed + s.flicker);
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${alpha})`;
                ctx.fill();
            });
            animId = requestAnimationFrame(draw);
        };
        animId = requestAnimationFrame(draw);
        return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
    }, []);
    return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />;
});
StarField.displayName = 'StarField';

export default function SponsorsPage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // 5 empty slots for sponsors
    const slots = [1, 2, 3, 4, 5];

    return (
        <div className="fixed inset-0 w-screen h-screen bg-[#050814] font-orbitron text-white overflow-hidden select-none flex flex-col items-center">

            {/* ── Background Elements ── */}
            {mounted && <StarField />}
            
            {/* Deep space radial gradients */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,100,255,0.05)_0%,transparent_60%,rgba(0,0,0,0.8)_100%)] z-[1] pointer-events-none" />
            <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-[radial-gradient(circle,rgba(200,150,50,0.1)_0%,transparent_70%)] z-[1] pointer-events-none blur-3xl" />
            
            {/* Planets graphics from the background (CSS simulated or images if available, using CSS here) */}
            <div className="absolute top-[5%] -right-[5%] w-64 h-64 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(200,255,100,0.4),rgba(0,50,0,0.8)_70%)] blur-[2px] opacity-40 mix-blend-screen pointer-events-none" style={{ boxShadow: '-20px 20px 60px rgba(100,255,50,0.2)' }} />
            <div className="absolute -bottom-[20%] -left-[10%] w-96 h-96 rounded-full bg-[radial-gradient(circle_at_30%_10%,rgba(100,200,255,0.3),rgba(0,20,50,0.9)_80%)] blur-[1px] opacity-60 mix-blend-screen pointer-events-none" style={{ boxShadow: '20px -20px 80px rgba(50,150,255,0.2)' }} />

            {/* ── Header ── */}
            <div className="w-full z-50">
                <SectorHeader
                    showTitle={false}
                    rightElement={
                        <div className="flex items-center gap-2 px-3 py-1 border border-neon/30 bg-neon/10 rounded-full">
                            <Zap className="w-3 h-3 text-neon animate-pulse" />
                            <span className="text-[9px] font-black tracking-widest text-neon">POWERING ORNATE&apos;26</span>
                        </div>
                    }
                />
            </div>

            {/* ── Main Content ── */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-6xl px-4 sm:px-8 mt-[-5vh]">
                
                {/* Title Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="text-center w-full mb-8"
                >
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 md:gap-5 mb-5 mt-4">
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-wider text-white" style={{ textShadow: '0 4px 10px rgba(255,255,255,0.3)' }}>
                            SPONSORS
                        </h1>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-wider text-[#FCDA59]" style={{ textShadow: '0 0 20px rgba(252,218,89,0.5), 0 4px 10px rgba(0,0,0,0.5)' }}>
                            COMING SOON
                        </h1>
                    </div>
                    
                    {/* Horizontal Line with Glowing Dots */}
                    <div className="relative w-full max-w-4xl mx-auto h-[2px] mb-8 bg-gradient-to-r from-[rgba(77,168,218,0.1)] via-[#4da8da] to-[rgba(77,168,218,0.1)] shadow-[0_0_15px_#4da8da]">
                        <div className="absolute left-[10%] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#4da8da] shadow-[0_0_8px_#fff]" />
                        <div className="absolute right-[10%] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#4da8da] shadow-[0_0_8px_#fff]" />
                    </div>

                    <div className="space-y-1 sm:space-y-2 mt-2">
                        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-[#e0e0e0] font-sans font-light tracking-wide drop-shadow-md">
                            We are in the process of confirming sponsorship partners.
                        </p>
                        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-[#e0e0e0] font-sans font-light tracking-wide drop-shadow-md">
                            Updates will be published here shortly.
                        </p>
                    </div>
                </motion.div>

                {/* Mystery Boxes */}
                <motion.div 
                    className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 md:gap-6 lg:gap-8 w-full px-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.5 }}
                >
                    {slots.map((slot, i) => (
                        <motion.div
                            key={slot}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.6 + i * 0.1, type: "spring" }}
                            className="relative flex flex-col items-center justify-center bg-[rgba(20,40,70,0.1)] backdrop-blur-md rounded border border-[#4da8da]/40 hover:bg-[rgba(20,40,70,0.3)] transition-all duration-300 group"
                            style={{
                                width: 'clamp(70px, 14vw, 130px)',
                                height: 'clamp(70px, 14vw, 130px)',
                                boxShadow: 'inset 0 0 20px rgba(77,168,218,0.05), 0 0 10px rgba(77,168,218,0.1)'
                            }}
                        >
                            {/* Inner subtle border */}
                            <div className="absolute inset-1.5 border border-[#4da8da]/20 rounded-sm opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
                            
                            <motion.span 
                                className="text-4xl sm:text-5xl md:text-6xl font-black text-white"
                                animate={{ opacity: [0.7, 1, 0.7] }}
                                transition={{ duration: 3, repeat: Infinity, delay: i * 0.4 }}
                                style={{ textShadow: '0 2px 10px rgba(255,255,255,0.4), 0 0 20px rgba(255,255,255,0.2)' }}
                            >
                                ?
                            </motion.span>
                            
                            {/* Subtle corner light accents */}
                            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/40 group-hover:border-white transition-colors" />
                            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/40 group-hover:border-white transition-colors" />
                            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/40 group-hover:border-white transition-colors" />
                            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/40 group-hover:border-white transition-colors" />
                        </motion.div>
                    ))}
                </motion.div>
                
            </div>
            
            {/* ── Scanline effect ── */}
            <div className="absolute inset-0 z-[2] pointer-events-none opacity-[0.02]"
                style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)' }}
            />
        </div>
    );
}
