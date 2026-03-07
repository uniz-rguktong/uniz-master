'use client';

import { useEffect, useRef } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AUTO_SCROLL_VH_PER_SEC } from '@/lib/sceneConstants';

/**
 * Starts a rAF-based auto-scroll once `enabled` becomes true.
 * Uses native scrollBy so Lenis can handle the lerp smoothing.
 * Automatically stops when the page reaches the bottom.
 */
export function useAutoScroll(enabled: boolean) {
    const requestRef = useRef<number | null>(null);

    useEffect(() => {
        if (!enabled) return;

        const timer = setTimeout(() => {
            ScrollTrigger.refresh();

            let lastTime = performance.now();

            const autoScroll = (time: number) => {
                const delta = (time - lastTime) / 1000;
                lastTime = time;

                if (delta > 0 && delta < 0.1) {
                    const speedPx = (window.innerHeight * AUTO_SCROLL_VH_PER_SEC) / 100;
                    window.scrollBy({ top: speedPx * delta, left: 0, behavior: 'auto' });
                }

                const atBottom =
                    window.scrollY + window.innerHeight >=
                    document.documentElement.scrollHeight - 5;

                if (!atBottom) {
                    requestRef.current = requestAnimationFrame(autoScroll);
                }
            };

            requestRef.current = requestAnimationFrame(autoScroll);
        }, 500);

        return () => {
            clearTimeout(timer);
            if (requestRef.current !== null) {
                cancelAnimationFrame(requestRef.current);
                requestRef.current = null;
            }
        };
    }, [enabled]);
}
