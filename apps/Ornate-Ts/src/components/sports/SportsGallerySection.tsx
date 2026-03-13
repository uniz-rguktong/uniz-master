'use client';

import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { type AlbumData } from '@/lib/data/gallery';

// Heavy components – loaded lazily
const CircularGallery = dynamic(() => import('@/components/ui/CircularGallery'), { ssr: false, loading: () => <div className="h-96 animate-pulse bg-white/5 rounded-lg" /> });
const DomeGallery = dynamic(() => import('@/components/ui/DomeGallery'), { ssr: false });

export const SportsGallerySection = memo(({ sportsAlbums }: { sportsAlbums: AlbumData[] }) => {
    const [domeOpen, setDomeOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        const checkMobile = () => {
            if (mounted) setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => {
            mounted = false;
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    const galleryItems = sportsAlbums.map(album => ({
        image: album.coverImage || (album.images[0]?.url) || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80',
        text: album.title.toUpperCase(),
        id: album.id
    }));

    // Case-insensitive ID search to be safe with different ID formats
    const selectedAlbum = sportsAlbums.find(a =>
        String(a.id).toLowerCase() === String(selectedAlbumId || '').toLowerCase()
    );

    // Choose images from the selected album, or all sports albums as a fallback if no album is selected
    const albumImages = selectedAlbum
        ? (selectedAlbum.images || []).map(img => ({ src: img.url, alt: img.caption || '' }))
        : sportsAlbums.flatMap(a => (a.images || []).map(img => ({ src: img.url, alt: img.caption || '' })));

    const domeImages = albumImages
        .filter(img => img && img.src && img.src.trim() !== '');

    if (domeImages.length === 0) {
        domeImages.push({
            src: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80',
            alt: 'No Images Yet'
        });
    }

    const domeTitle = (selectedAlbum && selectedAlbum.title)
        ? selectedAlbum.title.toUpperCase()
        : 'ARENA CHRONICLES';

    const handleSelect = (item: { image: string; text: string; id?: string | number }) => {
        if (item && item.id) {
            setSelectedAlbumId(String(item.id));
        } else {
            setSelectedAlbumId(null);
        }
        setDomeOpen(true);
    };

    return (
        <section className="relative z-10 pb-0">
            <AnimatePresence>
                {domeOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-xl flex flex-col items-center justify-center"
                    >
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center pointer-events-none">
                            <p className="text-[10px] text-amber-400 font-black tracking-[0.6em] uppercase mb-1">Sports Gallery</p>
                            <h3 className="text-2xl font-black text-white tracking-widest uppercase">{domeTitle}</h3>
                        </div>
                        <button
                            onClick={() => setDomeOpen(false)}
                            className="absolute top-4 right-4 sm:top-8 sm:right-10 z-[210] p-3 sm:px-5 sm:py-3 rounded-full border border-white/20 text-white hover:text-amber-400 hover:border-amber-400 transition-all font-black uppercase backdrop-blur-md flex items-center justify-center cursor-pointer"
                        >
                            <span className="hidden sm:inline text-xs tracking-[0.3em]">✕ Close</span>
                            <X className="sm:hidden size-5" />
                        </button>
                        <div className="w-full h-full">
                            <DomeGallery
                                key={selectedAlbumId || 'arena-fallback'}
                                images={domeImages}
                                grayscale={false}
                                openedImageWidth="500px"
                                openedImageHeight="500px"
                                imageBorderRadius="20px"
                                openedImageBorderRadius="20px"
                                fit={0.52}
                                overlayBlurColor="#030308"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex items-center gap-6 mb-12 px-6 sm:px-10"
            >
                <div className="w-3 h-10 bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.4)]" />
                <div className="flex flex-col items-start">
                    <h2 className="text-4xl sm:text-5xl font-black tracking-[0.1em] text-white uppercase italic">
                        ARENA <span className="text-amber-400">CHRONICLES</span>
                    </h2>
                    <p className="text-[10px] text-white/40 tracking-[0.3em] uppercase mt-1 font-bold">
                        Galactic History & Record Archives
                    </p>
                </div>
            </motion.div>
            <div className="w-full h-[500px]">
                <CircularGallery
                    bend={isMobile ? 0 : 3}
                    textColor="#fbbf24"
                    font="bold 30px Orbitron"
                    borderRadius={0.05}
                    scrollSpeed={isMobile ? 1.5 : 2}
                    scrollEase={0.05}
                    autoScrollSpeed={isMobile ? -0.1 : 0.15}
                    items={galleryItems}
                    onSelect={handleSelect}
                />
            </div>
        </section>
    );
});

SportsGallerySection.displayName = 'SportsGallerySection';
