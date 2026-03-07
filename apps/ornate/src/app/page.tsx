'use client';

import { useState } from 'react';
import SceneOne from '@/components/Scene/SceneOne';
import IntroAnimation from '@/components/Scene/IntroAnimation';
import Header from '@/components/Layout/Header';

export default function Home() {
  const [loading, setLoading] = useState(true);

  // Auto-scroll starts once the intro animation completes

  return (
    <main className="min-h-[100dvh] bg-black">
      <Header />
      {loading && <IntroAnimation onComplete={() => setLoading(false)} />}
      <div className={`transition-all duration-1000 ${loading ? 'h-[100dvh] overflow-hidden' : ''}`}>
        <div className="relative z-10">
          <SceneOne introComplete={!loading} />
        </div>
      </div>
    </main>
  );
}
