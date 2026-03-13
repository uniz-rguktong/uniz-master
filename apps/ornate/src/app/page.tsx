'use client';

import { useState, useEffect } from 'react';
import SceneOne from '@/components/scene/SceneOne';
import IntroAnimation from '@/components/scene/IntroAnimation';
import Header from '@/components/layout/Header';

export default function Home() {
    const [loading, setLoading] = useState(true);

    // Lock scroll while loading
    useEffect(() => {
        if (loading) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [loading]);

    // Auto-scroll starts once the intro animation completes

    return (
        <main className="min-h-[100dvh] bg-black">
            <Header />
            {loading && <IntroAnimation onComplete={() => setLoading(false)} />}
            <div className={`transition-opacity duration-1000 ${loading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <div className="relative z-10">
                    <SceneOne introComplete={!loading} />
                </div>
            </div>
        </main>
    );
}
