'use client';

import { useEffect, useState } from 'react';

const LIME = '#A3FF12';

/* ─── CSS keyframes ────────────── */
const STYLES = `
@keyframes spin-slow {
    100% { transform: rotate(360deg); }
}
@keyframes pulse-bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(6px); }
}
.animate-spin-slow {
    animation: spin-slow 10s linear infinite;
}
.animate-pulse-bounce {
    animation: pulse-bounce 2s ease-in-out infinite;
}
`;

export default function ScrollIndicators() {
    const [progress, setProgress] = useState(0);

    /* Inject keyframes (no cursor override) */
    useEffect(() => {
        const tag = document.createElement('style');
        tag.textContent = STYLES;
        document.head.appendChild(tag);
        return () => { try { document.head.removeChild(tag); } catch (_) { } };
    }, []);

    /* Progress Listener */
    useEffect(() => {
        const onScroll = () => {
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            const prog = maxScroll > 0 ? Math.min(1, window.scrollY / maxScroll) : 0;
            setProgress(prog);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const pct = Math.round(progress * 100);

    return (
        <>
            {/* ━━━ LARGE COMPLETION TEXT (BOTTOM RIGHT) ━━━━━━━━━━━━━━━━━━━ */}
            <div className="fixed right-4 sm:right-8 bottom-4 sm:bottom-8 z-[2000] pointer-events-none flex flex-col items-end opacity-90 transition-all duration-300">
                <span
                    className="font-black tracking-tighter"
                    style={{
                        fontSize: 'clamp(3rem, 10vh, 12rem)', // Scalable bounds for mobile 
                        color: LIME,
                        lineHeight: 0.85
                    }}
                >
                    {pct < 10 ? `0${pct}` : pct}
                    <span style={{ fontSize: 'clamp(1.5rem, 5vh, 6rem)' }}>%</span>
                </span>
                <span
                    className="uppercase tracking-[0.4em] text-white/50 mt-2 sm:mt-3 mr-1 text-[8px] sm:text-[10px]"
                >
                    COMPLETED
                </span>
            </div>
        </>
    );
}
