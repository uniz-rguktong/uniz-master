'use client';

import { ReactLenis } from 'lenis/react';

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
    return (
        <ReactLenis root options={{
            lerp: 0.015, // Ultra-soft easing for extreme smoothness
            wheelMultiplier: 0.6, // Slightly slower scroll wheel movement
            smoothWheel: true,
            syncTouch: true, // synchronize scroll animations correctly on touch surfaces
        }}>
            {children}
        </ReactLenis>
    );
}
