'use client';

import React, { useState, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Shield, Info } from 'lucide-react';

import { type SportData, type PromoVideoData, type MatchData } from '@/lib/data/sports';
import { type AlbumData } from '@/lib/data/gallery';

// UI Components
import { StandingsTable } from '@/components/ui/StandingsTable';
import { SectionHeader, VideoCarousel } from '@/components/ui/VideoSections';
import SportsFooter from '@/components/sports/SportsFooter';
import SectorHeader from '@/components/layout/SectorHeader';

// Extracted Components
import { StarField, Particles } from '@/components/sports/SportsBackground';
import { VideoModal } from '@/components/sports/VideoModal';
import { HighlightsSection, SportsPromoCardsCarousel } from '@/components/sports/HighlightsSection';
import { TacticalTerminal } from '@/components/sports/TacticalTerminal';
import { AthleticsSection } from '@/components/sports/AthleticsSection';
import { SportsGallerySection } from '@/components/sports/SportsGallerySection';

interface SportsProps {
    sports: SportData[];
    athleticsWinners: SportData[];
    boysStandings: any[];
    girlsStandings: any[];
    boysCategories: string[];
    girlsCategories: string[];
    promoVideos: PromoVideoData[];
    sportsAlbums: AlbumData[];
    todaysMatches: MatchData[];
}

export default function SportsClient({
    sports,
    athleticsWinners,
    boysStandings,
    girlsStandings,
    boysCategories,
    girlsCategories,
    promoVideos,
    sportsAlbums,
    todaysMatches,
}: SportsProps) {
    const liveScores = useMemo(
        () =>
            todaysMatches
                .filter((match) => match.status === 'LIVE' || match.status === 'COMPLETED')
                .sort((a, b) => {
                    const aUpdated = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
                    const bUpdated = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
                    if (aUpdated !== bUpdated) return bUpdated - aUpdated;

                    const aFallback = new Date(`${a.date ?? ''} ${a.time ?? '00:00'}`).getTime() || 0;
                    const bFallback = new Date(`${b.date ?? ''} ${b.time ?? '00:00'}`).getTime() || 0;
                    return bFallback - aFallback;
                })
                .slice(0, 20)
                .map((match) => ({
                    id: match.id,
                    sport: match.sportName,
                    round: match.round,
                    team1: match.team1Name,
                    team2: match.team2Name,
                    score1: match.score1,
                    score2: match.score2,
                    status: match.status,
                    winner: match.winner,
                    venue: match.venue,
                })),
        [todaysMatches]
    );
    const [activeStanding, setActiveStanding] = useState<'BOYS' | 'GIRLS'>('BOYS');
    const [videoModal, setVideoModal] = useState({ isOpen: false, url: '' });
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handlePlayVideo = (url: string) => {
        setVideoModal({ isOpen: true, url });
    };

    return (
        <div className="min-h-screen bg-[#030308] text-white relative font-sans selection:bg-amber-400 selection:text-black">
            {/* --- CORE ATMOSPHERE --- */}
            <StarField />
            <Particles color="#fbbf24" />

            <SectorHeader 
                title="SPORTS ARENA"
                subtitle="Battle of the Branches Protocol"
                accentColor="#fbbf24"
                links={[]}
            />

            {/* --- HERO SECTION --- */}
            <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=1600&q=80"
                        alt="Hero Background"
                        className="w-full h-full object-cover opacity-40 saturate-[1.2]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#030308] via-transparent to-[#030308]" />
                </div>

                <div className="relative z-10 flex flex-col items-center text-center px-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1 }}
                        className="flex flex-col items-center"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-px w-20 bg-gradient-to-r from-transparent to-amber-400" />
                            <span className="text-[12px] text-amber-400 tracking-[1em] font-black uppercase italic drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">Ornate 2K26</span>
                            <div className="h-px w-20 bg-gradient-to-l from-transparent to-amber-400" />
                        </div>

                        <h1 className="text-7xl sm:text-[10rem] md:text-[14rem] font-black tracking-tighter italic uppercase leading-[0.75] mb-8 drop-shadow-[0_0_50px_rgba(255,255,255,0.15)]">
                            SPORTS <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/10">ARENA</span>
                        </h1>

                        <div className="flex flex-wrap items-center justify-center gap-8 mt-4">
                            <div className="flex items-center gap-4 px-8 py-4 bg-white/5 border border-white/10 rounded-sm backdrop-blur-xl relative group cursor-pointer overflow-hidden">
                                <div className="absolute inset-0 bg-amber-400/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                <Shield className="w-6 h-6 text-amber-400 relative z-10" />
                                <span className="text-[12px] font-black tracking-[0.4em] uppercase relative z-10">ARENA PROTOCOL</span>
                            </div>
                            <div className="flex items-center gap-4 px-8 py-4 bg-amber-400 text-black rounded-sm shadow-[0_20px_50px_rgba(251,191,36,0.4)] relative group cursor-pointer overflow-hidden">
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                <Trophy className="w-6 h-6 relative z-10" />
                                <span className="text-[12px] font-black tracking-[0.4em] uppercase relative z-10">BATTLE STATS</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Ambient Scanners */}
                <div className="absolute inset-0 pointer-events-none">
                    <motion.div
                        animate={{ y: ['-100%', '200%'] }}
                        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                        className="h-[2px] w-full bg-gradient-to-r from-transparent via-amber-400/20 to-transparent blur-sm"
                    />
                </div>
            </section>

            {/* --- LIVE HIGHLIGHTS --- */}
            <HighlightsSection
                liveScores={liveScores}
                todaysMatches={todaysMatches}
                sportsAlbums={sportsAlbums}
            />

            {/* --- PROMO FEATURED SECTION --- */}
            <section className="px-4 sm:px-10 pb-24">
                <SectionHeader 
                    title="FEATURED PROMOS" 
                    label="ARENA FEEDS" 
                    color="#fbbf24"
                />
                <VideoCarousel 
                    videos={promoVideos} 
                    color="#fbbf24" 
                    onPlay={handlePlayVideo}
                />
                
                <div className="mt-16">
                    <SportsPromoCardsCarousel
                        videos={promoVideos}
                        color="#fbbf24"
                        onPlay={handlePlayVideo}
                    />
                </div>
            </section>

            {/* --- CHAMPIONSHIP TRACKING SECTION --- */}
            <section id="arena-standings" className="relative z-10 py-12 sm:py-24 px-4 sm:px-10 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent">
                <div className="max-w-7xl mx-auto space-y-24">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="flex items-center gap-6"
                    >
                        <div className="w-3 h-10 bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.4)]" />
                        <div className="flex flex-col items-start">
                            <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-white uppercase italic leading-none">
                                CHAMPIONSHIP <span className="text-amber-400">TRACKING</span>
                            </h2>
                            <p className="text-[10px] text-white/40 tracking-[0.6em] font-black uppercase mt-2">
                                Live Point Matrix Sync
                            </p>
                        </div>
                    </motion.div>

                    {/* Tab Navigation */}
                    <div className="flex items-center gap-4 bg-white/5 p-1.5 rounded-xl border border-white/10 w-fit mx-auto sm:mx-0">
                        <button
                            onClick={() => setActiveStanding('BOYS')}
                            className={`px-8 py-3 rounded-lg text-xs font-black tracking-widest uppercase transition-all ${
                                activeStanding === 'BOYS' 
                                ? 'bg-amber-400 text-black shadow-[0_0_20px_rgba(251,191,36,0.4)]' 
                                : 'text-white/40 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            BOYS DIVISION
                        </button>
                        <button
                            onClick={() => setActiveStanding('GIRLS')}
                            className={`px-8 py-3 rounded-lg text-xs font-black tracking-widest uppercase transition-all ${
                                activeStanding === 'GIRLS' 
                                ? 'bg-amber-400 text-black shadow-[0_0_20px_rgba(251,191,36,0.4)]' 
                                : 'text-white/40 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            GIRLS DIVISION
                        </button>
                    </div>

                    <AnimatePresence mode="wait">
                        {activeStanding === 'BOYS' ? (
                            <motion.div
                                key="boys"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.4 }}
                                className="relative group overflow-hidden rounded-2xl border border-white/5 bg-[#050510]/40 backdrop-blur-3xl p-6 sm:p-10 shadow-2xl"
                            >
                                <div className="absolute top-0 right-0 p-6 opacity-20 pointer-events-none font-mono text-[10px] text-amber-400">
                                     MATRIX_SEC_01 // MALE_DIV
                                </div>
                                <StandingsTable
                                    title="BOYS CHAMPIONSHIP"
                                    subtitle="Matrix Results"
                                    data={boysStandings}
                                    categories={boysCategories}
                                    accentColor="#fbbf24"
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="girls"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.4 }}
                                className="relative group overflow-hidden rounded-2xl border border-white/5 bg-[#050510]/40 backdrop-blur-3xl p-6 sm:p-10 shadow-2xl"
                            >
                                <div className="absolute top-0 right-0 p-6 opacity-20 pointer-events-none font-mono text-[10px] text-amber-400">
                                     MATRIX_SEC_02 // FEMALE_DIV
                                </div>
                                <StandingsTable
                                    title="GIRLS CHAMPIONSHIP"
                                    subtitle="Matrix Results"
                                    data={girlsStandings}
                                    categories={girlsCategories}
                                    accentColor="#fbbf24"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-10 opacity-60">
                        <div className="flex items-center gap-6 px-10 py-6 bg-white/[0.02] border border-white/5 rounded-2xl w-full sm:w-auto">
                            <Info className="w-10 h-10 text-amber-400/40" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase mb-1">Update Protocol</span>
                                <p className="text-[11px] text-white/50 tracking-wider font-bold">Points are synchronized in real-time following match verification by tactical officers.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- TACTICAL TERMINAL (QUICK LINKS) --- */}
            <TacticalTerminal />

            {/* --- ATHLETICS SHOWCASE --- */}
            <AthleticsSection sports={athleticsWinners} />

            {/* --- ARENA CHRONICLES (GALLERY) --- */}
            <SportsGallerySection sportsAlbums={sportsAlbums} />

            {/* --- FOOTER --- */}
            <SportsFooter />

            {/* Video Modal */}
            <VideoModal
                isOpen={videoModal.isOpen}
                videoUrl={videoModal.url}
                onClose={() => setVideoModal({ isOpen: false, url: '' })}
            />

            {/* Custom Styles */}
            <style jsx global>{`
                .fest-scroll::-webkit-scrollbar {
                    height: 4px;
                    width: 4px;
                }
                .fest-scroll::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.02);
                }
                .fest-scroll::-webkit-scrollbar-thumb {
                    background: rgba(251, 191, 36, 0.3);
                    border-radius: 10px;
                }
                .fest-scroll::-webkit-scrollbar-thumb:hover {
                    background: rgba(251, 191, 36, 0.5);
                }
                @font-face {
                    font-family: 'Orbitron';
                    src: url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap');
                }
                .font-orbitron {
                    font-family: 'Orbitron', sans-serif;
                }
            `}</style>
        </div>
    );
}
