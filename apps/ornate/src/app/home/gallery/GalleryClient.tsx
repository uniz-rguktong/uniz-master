'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import SectorHeader from '@/components/layout/SectorHeader';
import type { AlbumData, PromoVideoData } from '@/lib/data/gallery';
import { BRANCHES, CLUBS } from '@/lib/data/branch-constants';
import GalleryFilterBar, { type FilterType } from './components/GalleryFilterBar';
import GalleryAlbumGrid from './components/GalleryAlbumGrid';
import GalleryAlbumViewer from './components/GalleryAlbumViewer';
import GalleryEmptyState from '@/components/gallery/GalleryEmptyState';
import { AlbumCardSkeleton } from '@/components/gallery/GallerySkeleton';
import { useEffect } from 'react';

export interface GalleryClientProps {
  categorizedAlbums: {
    all: AlbumData[];
    branches: AlbumData[];
    sports: AlbumData[];
    culturals: AlbumData[];
    clubs: AlbumData[];
  };
  promoVideos: PromoVideoData[];
}

function extractAlbumImageUrls(images: Array<{ url: string } | string> | undefined | null): string[] {
  if (!Array.isArray(images)) return [];
  return images
    .map((img) => (typeof img === 'string' ? img : img?.url))
    .filter((url): url is string => typeof url === 'string' && url.length > 0);
}

export default function GalleryClient({ categorizedAlbums, promoVideos }: GalleryClientProps) {
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedClub, setSelectedClub] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterStep, setFilterStep] = useState<1 | 2>(1);
  const [viewingAlbum, setViewingAlbum] = useState<{ title: string; images: string[] } | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const allAlbums = categorizedAlbums.all;
  const hasActiveFilters = filter !== 'ALL' || selectedBranch !== null || selectedClub !== null;
  const isSearching = searchQuery.trim().length > 0;

  const filteredAlbums = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return allAlbums.filter((album) => {
      const matchesQuery = query === ''
        || album.title.toLowerCase().includes(query)
        || album.tags.some(tag => tag.toLowerCase().includes(query))
        || (album.creator.name?.toLowerCase().includes(query) ?? false);

      let matchesCategory = true;

      if (filter === 'BRANCHES') {
        matchesCategory = categorizedAlbums.branches.some(a => a.id === album.id);
        if (selectedBranch) {
          const slug = selectedBranch.toLowerCase();
          matchesCategory = matchesCategory && (
            album.creator.branch?.toLowerCase() === slug
            || album.tags.some(t => t.toLowerCase().includes(slug))
          );
        }
      }

      if (filter === 'CLUBS') {
        matchesCategory = categorizedAlbums.clubs.some(a => a.id === album.id);
        if (selectedClub) {
          const slug = selectedClub.toLowerCase();
          matchesCategory = matchesCategory && (
            album.creator.clubId?.toLowerCase() === slug
            || album.tags.some(t => t.toLowerCase().includes(slug))
          );
        }
      }

      if (filter === 'SPORTS') {
        matchesCategory = categorizedAlbums.sports.some(a => a.id === album.id);
      }

      if (filter === 'CULTURALS') {
        matchesCategory = categorizedAlbums.culturals.some(a => a.id === album.id);
      }

      return matchesQuery && (filter === 'ALL' || matchesCategory);
    });
  }, [allAlbums, categorizedAlbums, filter, searchQuery, selectedBranch, selectedClub]);

  const albumCards = useMemo(() => {
    return filteredAlbums.map((album) => {
      const color = filter === 'SPORTS' ? '#f59e0b' : filter === 'CULTURALS' ? '#ec4899' : 'var(--color-neon)';
      return {
        id: album.id,
        title: album.title,
        coverImage: album.coverImage || (album.images[0]?.url ?? '/placeholder.jpg'),
        count: album.images.length,
        color,
      };
    });
  }, [filteredAlbums, filter]);

  const openAlbumViewer = (albumId: string) => {
    const album = allAlbums.find(a => a.id === albumId);
    if (!album) return;

    const images = extractAlbumImageUrls(album.images);
    const safeImages = images.length > 0
      ? images
      : (album.coverImage ? [album.coverImage] : []);

    if (safeImages.length === 0) return;

    setViewingAlbum({
      title: album.title || 'Untitled Album',
      images: safeImages,
    });
  };

  return (
    <main className="min-h-screen bg-[#030308] text-white font-orbitron overflow-x-hidden">
      <AnimatePresence>
        {viewingAlbum && <GalleryAlbumViewer album={viewingAlbum} onClose={() => setViewingAlbum(null)} />}
      </AnimatePresence>

      <div className="sticky top-0 z-50">
        <SectorHeader showTitle={false} />
        <GalleryFilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filter={filter}
          setFilter={setFilter}
          selectedBranch={selectedBranch}
          setSelectedBranch={setSelectedBranch}
          selectedClub={selectedClub}
          setSelectedClub={setSelectedClub}
          filterOpen={filterOpen}
          setFilterOpen={setFilterOpen}
          filterStep={filterStep}
          setFilterStep={setFilterStep}
          hasActiveFilters={hasActiveFilters}
          branches={BRANCHES}
          clubs={CLUBS}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 sm:mb-12">
          <p className="text-[10px] text-neon tracking-[0.8em] font-black uppercase mb-3">
            {isSearching || hasActiveFilters ? `Results Found: ${filteredAlbums.length}` : `Event Gallery (${promoVideos.length} videos)`}
          </p>
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tight text-white uppercase leading-none">
            {isSearching ? 'SEARCH' : 'PHOTO'}<br />
            <span className="text-neon">{isSearching || hasActiveFilters ? 'DIRECTIVES' : 'GALLERY'}</span>
          </h1>
          <div className="h-0.5 w-32 bg-linear-to-r from-neon to-transparent mt-4 opacity-60" />
        </motion.div>

        {allAlbums.length === 0 ? (
          <GalleryEmptyState type="empty" />
        ) : albumCards.length === 0 ? (
          <GalleryEmptyState type="search" onReset={() => {
            setSearchQuery('');
            setFilter('ALL');
            setSelectedBranch(null);
            setSelectedClub(null);
          }} />
        ) : (
          <GalleryAlbumGrid 
            albums={albumCards} 
            onOpen={openAlbumViewer} 
            isMounted={isMounted}
          />
        )}
      </div>
    </main>
  );
}
