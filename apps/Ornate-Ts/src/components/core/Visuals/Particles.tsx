'use client';

import { memo } from 'react';

export const Particles = memo(({ count = 6 }: { count?: number }) => {
    const pData = [
        { left: '10%', top: '25%', color: 'var(--color-neon)', d: '6s', dl: '0s' },
        { left: '30%', top: '65%', color: '#22d3ee', d: '8s', dl: '1.5s' },
        { left: '50%', top: '40%', color: '#fbbf24', d: '7s', dl: '0.5s' },
        { left: '70%', top: '80%', color: 'var(--color-neon)', d: '9s', dl: '2s' },
        { left: '85%', top: '20%', color: '#22d3ee', d: '6.5s', dl: '1s' },
        { left: '20%', top: '90%', color: '#fbbf24', d: '7.5s', dl: '2.5s' },
    ].slice(0, count);

    return (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            <style jsx>{`
                @keyframes floatUp { 
                    0%, 100% { transform: translateY(0) scale(1); opacity: .1; } 
                    50% { transform: translateY(-40px) scale(1.6); opacity: .4; } 
                }
                .cp-part { position: absolute; width: 4px; height: 4px; border-radius: 50%; animation: floatUp var(--d) var(--dl) ease-in-out infinite; will-change: transform, opacity; }
            `}</style>
            {pData.map((p, i) => (
                <div
                    key={i}
                    className="cp-part"
                    style={{
                        left: p.left,
                        top: p.top,
                        background: p.color,
                        ['--d' as any]: p.d,
                        ['--dl' as any]: p.dl
                    }}
                />
            ))}
        </div>
    );
});

Particles.displayName = 'Particles';
