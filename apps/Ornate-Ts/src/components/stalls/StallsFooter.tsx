import React from 'react';
import Link from 'next/link';
import GlobalFooterLinks from '../ui/GlobalFooterLinks';

export default function StallsFooter() {
    return (
        <footer className="w-full border-t border-white/10 bg-black/40 backdrop-blur-md pt-16 pb-8 px-4 sm:px-12 relative z-10 mt-20">
            {/* Top Glow Bar */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--color-neon)]/50 to-transparent" />

            <GlobalFooterLinks />

            <div className="mt-12 pt-10 border-t border-white/5 items-center text-center relative z-20">
                <div className="flex flex-col items-center gap-2 mb-8">
                    <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/30">Ornate 2K26 Galactic Stalls</p>
                    <h4 className="text-[13px] font-black tracking-[0.2em] uppercase text-[var(--color-neon)]">RGUKT IIIT ONGOLE</h4>
                    <p className="text-[9px] font-bold text-gray-500 tracking-[0.15em] uppercase px-4 max-w-sm mx-auto">IIIT ONGOLE, PRAKASAM DISTRICT, AP - 523225</p>
                </div>
                
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] font-bold tracking-[0.3em] text-gray-600 uppercase">
                    <p className="text-center md:text-left">&copy; 2026 ORNATE GALACTIC COMMAND. ALL OVERRIDES SECURED.</p>
                    <div className="flex gap-4">
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacy Directive</Link>
                        <Link href="/terms" className="hover:text-white transition-colors">Terms of Operations</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
