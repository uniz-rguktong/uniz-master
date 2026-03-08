'use client';

import { ReactLenis } from 'lenis/react';

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
    // Detect touch device to avoid syncTouch on mobile.
    // syncTouch: true on mobile causes Lenis to intercept touch events, which
    // can inadvertently focus input elements during scroll and trigger the keyboard.
    const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

    return (
        <ReactLenis root options={{
            lerp: 0.015, // Ultra-soft easing for extreme smoothness
            wheelMultiplier: 0.6, // Slightly slower scroll wheel movement
            smoothWheel: true,
            syncTouch: false, // Disabled: causes keyboard pop-up on mobile by focusing inputs during touch scroll
            prevent: (node) => {
                // Prevent Lenis from intercepting scroll inside input, textarea, select elements
                return node.tagName === 'INPUT' || node.tagName === 'TEXTAREA' || node.tagName === 'SELECT';
            },
        }}>
            {children}
        </ReactLenis>
    );
}
