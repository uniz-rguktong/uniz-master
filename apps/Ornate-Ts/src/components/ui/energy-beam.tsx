'use client';

import React, { useEffect, useRef } from 'react';

interface EnergyBeamProps {
    projectId?: string;
    className?: string;
}

declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        UnicornStudio?: any;
    }
}

const EnergyBeam: React.FC<EnergyBeamProps> = ({
    projectId = "hRFfUymDGOHwtFe7evR2",
    className = "",
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const init = () => {
            if (window.UnicornStudio && containerRef.current) {
                window.UnicornStudio.init();
            }
        };

        // Already loaded (e.g. returned to this page) — call init directly
        if (window.UnicornStudio) {
            init();
            return;
        }

        // Script tag already in DOM but still loading — piggyback on its load event
        const existing = document.querySelector(
            'script[src*="unicornStudio"]'
        ) as HTMLScriptElement | null;
        if (existing) {
            existing.addEventListener('load', init);
            return () => existing.removeEventListener('load', init);
        }

        // Fresh load
        const script = document.createElement('script');
        script.src =
            'https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.5.2/dist/unicornStudio.umd.js';
        script.async = true;
        script.onload = init;
        document.head.appendChild(script);

        return () => {
            if (script.parentNode) script.parentNode.removeChild(script);
        };
    }, [projectId]);

    return (
        <div className={`relative w-full h-full  ${className}`}>
            <div
                ref={containerRef}
                data-us-project={projectId}
                className="w-full h-full"
            />
        </div>
    );
};

export default EnergyBeam;
