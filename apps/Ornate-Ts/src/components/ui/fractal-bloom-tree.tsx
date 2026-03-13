"use client";

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, GitBranch } from 'lucide-react';

// Fractal Bloom Canvas Component
const FractalBloomCanvas = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        const mouse = { x: window.innerWidth / 2, y: window.innerHeight };
        let currentDepth = 0;
        const maxDepth = 9;

        // Planet-inspired color palette: trunk → tips
        const planetColors = [
            '#FDB813', // Sun — golden yellow   (depth 0)
            '#FF8C42', // Jupiter — amber orange (depth 1)
            '#FF4D4D', // Mars — crimson red     (depth 2)
            '#E040FB', // cosmic magenta         (depth 3)
            '#8B5CF6', // violet nebula          (depth 4)
            '#3B82F6', // Neptune — deep blue    (depth 5)
            '#06B6D4', // Uranus — cyan          (depth 6)
            '#10B981', // emerald green          (depth 7)
            '#39FF14', // neon lime tips         (depth 8-9)
        ];

        const getDepthColors = (depth: number): [string, string] => {
            const idx = Math.min(Math.floor((depth / maxDepth) * (planetColors.length - 1)), planetColors.length - 2);
            return [planetColors[idx], planetColors[idx + 1]];
        };

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = canvas.parentElement?.clientHeight ?? window.innerHeight;
        };

        const drawBranch = (x: number, y: number, angle: number, length: number, depth: number) => {
            if (depth > currentDepth) return;

            const endX = x + Math.cos(angle) * length;
            const endY = y + Math.sin(angle) * length;

            const [c1, c2] = getDepthColors(depth);
            const grad = ctx.createLinearGradient(x, y, endX, endY);
            const opacity = Math.max(0.15, 1 - depth / maxDepth);
            grad.addColorStop(0, c1 + Math.round(opacity * 255).toString(16).padStart(2, '0'));
            grad.addColorStop(1, c2 + Math.round(opacity * 0.75 * 255).toString(16).padStart(2, '0'));

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(endX, endY);
            ctx.strokeStyle = grad;
            ctx.lineWidth = Math.max(0.4, (maxDepth - depth) * 0.35);
            ctx.shadowBlur = depth > 5 ? 6 : 0;
            ctx.shadowColor = c2;
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Glowing bloom dots at leaf tips
            if (depth >= maxDepth - 1 && depth <= currentDepth) {
                const tipColor = planetColors[planetColors.length - 1];
                const bloomColors = ['#39FF14', '#06B6D4', '#E040FB', '#FF4D4D', '#FDB813'];
                const bc = bloomColors[Math.floor(Math.random() * bloomColors.length)];
                ctx.beginPath();
                ctx.arc(endX, endY, 1.8, 0, Math.PI * 2);
                ctx.fillStyle = bc;
                ctx.shadowColor = bc;
                ctx.shadowBlur = 12;
                ctx.fill();
                ctx.shadowBlur = 0;
                void tipColor; // suppress unused warning
            }

            const distToMouse = Math.hypot(endX - mouse.x, endY - mouse.y);
            const mouseEffect = Math.max(0, 1 - distToMouse / (canvas.height / 2));
            const angleOffset = (Math.PI / 8) * mouseEffect;

            drawBranch(endX, endY, angle - Math.PI / 10 - angleOffset, length * 0.8, depth + 1);
            drawBranch(endX, endY, angle + Math.PI / 10 + angleOffset, length * 0.8, depth + 1);
        };

        const animate = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const startX = canvas.width / 2;
            const startY = canvas.height;
            const startLength = canvas.height / 5;

            drawBranch(startX, startY, -Math.PI / 2, startLength, 0);

            if (currentDepth < maxDepth) {
                currentDepth += 0.03;
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        const handleMouseMove = (event: MouseEvent) => {
            mouse.x = event.clientX;
            mouse.y = event.clientY;
        };

        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('mousemove', handleMouseMove);

        resizeCanvas();
        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 z-0 w-full h-full bg-black" style={{ mixBlendMode: 'normal' }} />;
};

// The main hero component
const FractalBloomHero = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fadeUpVariants: any = {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.2 + 1.5,
                duration: 0.8,
                ease: 'easeInOut',
            },
        }),
    };

    return (
        <div className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-black">
            <FractalBloomCanvas />

            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
            {/* Left side black fade */}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent z-10 pointer-events-none" />
            {/* Right side black fade */}
            <div className="absolute inset-0 bg-gradient-to-l from-black via-transparent to-transparent z-10 pointer-events-none" />
            {/* Top black fade */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-transparent z-10 pointer-events-none" />

            {/* Overlay HTML Content */}
            <div className="relative z-20 text-center p-6">
                <motion.div
                    custom={0}
                    variants={fadeUpVariants}
                    initial="hidden"
                    animate="visible"
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-500/10 border border-slate-500/20 mb-6 backdrop-blur-sm"
                >
                    <GitBranch className="h-4 w-4 text-slate-300" />
                    <span className="text-sm font-medium text-gray-200">Ornate 2026 · RGUKT</span>
                </motion.div>

                <motion.h1
                    custom={1}
                    variants={fadeUpVariants}
                    initial="hidden"
                    animate="visible"
                    className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400"
                >
                    Our Sponsors
                </motion.h1>

                <motion.p
                    custom={2}
                    variants={fadeUpVariants}
                    initial="hidden"
                    animate="visible"
                    className="max-w-2xl mx-auto text-lg text-gray-400 mb-10"
                >
                    The visionaries who power the Ornate universe — fueling innovation, creativity, and the next generation of talent.
                </motion.p>

                <motion.div
                    custom={3}
                    variants={fadeUpVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <button
                        onClick={() => window.scrollBy({ top: window.innerHeight, behavior: 'smooth' })}
                        className="px-8 py-4 bg-white text-black font-semibold rounded-lg shadow-lg hover:bg-gray-200 transition-colors duration-300 flex items-center gap-2 mx-auto"
                    >
                        Meet the Sponsors
                        <ArrowRight className="h-5 w-5" />
                    </button>
                </motion.div>
            </div>
        </div>
    );
};

export default FractalBloomHero;
