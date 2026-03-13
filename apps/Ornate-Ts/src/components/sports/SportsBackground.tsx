'use client';

import React, { useMemo, memo } from 'react';

export const Particles = memo(({ color }: { color: string }) => {
    const [mounted, setMounted] = React.useState(false);
    
    React.useEffect(() => {
        setMounted(true);
    }, []);

    const particles = useMemo(() => {
        if (!mounted) return [];
        return Array.from({ length: 15 }, () => ({
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            size: Math.random() * 3 + 1,
            duration: Math.random() * 15 + 10,
            delay: Math.random() * 5,
            drift: Math.random() * 100 - 50
        }));
    }, [mounted]);

    if (!mounted) return null;

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            {particles.map((p, i) => (
                <div
                    key={i}
                    className="absolute rounded-full opacity-30 animate-float"
                    style={{
                        left: p.left,
                        top: p.top,
                        width: p.size,
                        height: p.size,
                        backgroundColor: color,
                        boxShadow: `0 0 10px ${color}`,
                        animationDuration: `${p.duration}s`,
                        animationDelay: `${p.delay}s`,
                        // @ts-ignore
                        '--drift': `${p.drift}px`
                    } as React.CSSProperties}
                />
            ))}
            <style jsx>{`
                @keyframes float {
                    0% { transform: translate(0, 0); opacity: 0; }
                    20% { opacity: 0.3; }
                    80% { opacity: 0.3; }
                    100% { transform: translate(var(--drift), -200px); opacity: 0; }
                }
                .animate-float {
                    animation: float linear infinite;
                }
            `}</style>
        </div>
    );
});

Particles.displayName = 'Particles';

export const StarField = memo(() => {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const stars = useMemo(() => {
        if (!mounted) return [];
        return Array.from({ length: 100 }).map((_, i) => ({
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            delay: `${Math.random() * 5}s`,
            duration: `${Math.random() * 3 + 2}s`
        }));
    }, [mounted]);

    if (!mounted) return null;

    return (
        <div className="absolute inset-0 pointer-events-none z-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.1)_0%,transparent_70%)]" />
            <div className="star-container absolute inset-0">
                {stars.map((star, i) => (
                    <div
                        key={i}
                        className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-20"
                        style={{
                            left: star.left,
                            top: star.top,
                            animationDelay: star.delay,
                            animationDuration: star.duration
                        }}
                    />
                ))}
            </div>
            <style jsx>{`
                .star-container div {
                    animation: pulse 4s infinite ease-in-out;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 0.1; transform: scale(0.8); }
                    50% { opacity: 0.4; transform: scale(1.2); }
                }
            `}</style>
        </div>
    );
});

StarField.displayName = 'StarField';
