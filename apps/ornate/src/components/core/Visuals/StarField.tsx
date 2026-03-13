'use client';

import { memo, useEffect, useRef } from 'react';

export const StarField = memo(() => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        let raf: number;
        let lastFrame = 0;
        const FPS = 30;
        const INTERVAL = 1000 / FPS;

        const resize = () => {
            if (!canvas) return;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize, { passive: true });

        const stars = Array.from({ length: 150 }, () => ({
            x: Math.random() * (canvas?.width || 1920),
            y: Math.random() * (canvas?.height || 1080),
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
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 opacity-40" />;
});

StarField.displayName = 'StarField';
