import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Home, Map, GitBranch, Users, Anchor, Theater, Target, Joystick } from 'lucide-react';
import GlobalFooterLinks from '../ui/GlobalFooterLinks';

export default function BranchFooter({ slug, data }: { slug: string; data: any }) {
    // Map branches to their respective planet background textures from branches.css
    const PLANET_MAP: Record<string, string> = {
        cse: '/assets/CSE.webp',
        ece: '/assets/ECE.webp',
        eee: '/assets/EEE.webp',
        mechanical: '/assets/Mechanical.webp',
        civil: '/assets/civil.webp',
        hho: '/assets/sarvasrijana.webp',
        icro: '/assets/ICRO.webp',
        khelsaathi: '/assets/Khelsaathi.webp',
        pixelro: '/assets/PixelRo.webp',
        techxcel: '/assets/TechXcel.webp',
        artix: '/assets/artix.webp',
        kaladharani: '/assets/kaladharani.webp',
        sarvasrijana: '/assets/sarvasrijana.webp',
    };

    // If it's a club, default to HHO or CSE textures as fallback
    const image = PLANET_MAP[slug] || '/assets/CSE.webp';
    const accentColor = data.color || 'var(--color-neon)';

    return (
        <footer className="relative w-full overflow-hidden bg-[#030308] border-t border-white/5 pt-32 pb-16 mt-20" style={{ minHeight: '600px' }}>
            {/* Embedded planet CSS animation */}
            <style jsx>{`
                @keyframes planet-spin {
                    from { background-position-y: 0px; }
                    to { background-position-y: -1000px; }
                }
                .footer-planet {
                    position: absolute;
                    left: 50%;
                    transform: translateX(-50%);
                    bottom: -800px;
                    width: 1200px;
                    height: 1200px;
                    border-radius: 600px;
                    background-color: black;
                    background-image: url('${image}');
                    background-size: 1140px 910px !important;
                    animation: planet-spin 60s infinite linear;
                    z-index: 0;
                    box-shadow: 0 -20px 100px rgba(255, 255, 255, 0.1);
                }
                .footer-planet-overlay {
                    position: absolute;
                    left: 50%;
                    transform: translateX(-50%);
                    bottom: -800px;
                    width: 1200px;
                    height: 1200px;
                    border-radius: 600px;
                    z-index: 1;
                    box-shadow: 0px -400px 600px 100px rgb(3, 3, 8) inset;
                    pointer-events: none;
                }
            `}</style>

            {/* Planet Background */}
            <div className="footer-planet" />
            <div className="footer-planet-overlay" />

            {/* Atmospheric space fog to blend planet into black bg */}
            <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#030308]/40 via-[#030308]/80 to-[#030308] pointer-events-none" />

            <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-10 flex flex-col items-center">
                {/* Header branding */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h3 className="text-4xl md:text-5xl font-black uppercase mb-2 tracking-widest drop-shadow-md">
                        THANKS FOR VISITING
                    </h3>
                    <p className="text-white/50 uppercase tracking-[0.5em] text-[10px] font-bold">
                        Sector Navigation · {data.category}
                    </p>
                </motion.div>

                {/* Symmetrical Navigation Matrix */}
                <div className="w-full mb-24 max-w-[1400px] mx-auto">
                    <GlobalFooterLinks />
                </div>

                {/* Bottom Bar - Extended with Campus Location Details */}
                <div className="w-full pt-12 border-t border-white/10 flex flex-col items-center text-center gap-6 relative z-20">
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-[11px] font-black tracking-[0.4em] uppercase text-white/40">Ornate 2K26 Galactic Edition</p>
                        <h4 className="text-[14px] font-black tracking-[0.2em] uppercase text-[var(--color-neon)]">RGUKT IIIT ONGOLE</h4>
                        <p className="text-[10px] font-bold text-gray-500 tracking-[0.15em] uppercase">IIIT ONGOLE, PRAKASAM DISTRICT, AP - 523225</p>
                    </div>

                    <Link href={data.category === 'Branch' ? `/home/branches#${slug === 'mechanical' ? 'mech' : slug}` : `/home/clubs#${slug}`} className="flex items-center gap-2 group hover:text-white transition-colors text-[10px] font-black tracking-widest uppercase text-white/30">
                        <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                        Return to {data.category === 'Branch' ? 'Branches' : 'Clubs'}
                    </Link>
                </div>
            </div>
        </footer >
    );
}
