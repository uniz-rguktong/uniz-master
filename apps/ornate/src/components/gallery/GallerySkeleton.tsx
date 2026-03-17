'use client';

import React from 'react';

export function AlbumCardSkeleton() {
  return (
    <div className="relative h-56 border border-white/10 bg-[#09090f] overflow-hidden">
      {/* Shimmer Overlay */}
      <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
      </div>

      {/* Top Accent Strip */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10" />

      {/* Image Area Skeleton */}
      <div className="h-40 bg-white/5" />

      {/* Content Area Skeleton */}
      <div className="p-4 space-y-2">
        <div className="w-3/4 h-3 bg-white/10 rounded" />
        <div className="w-1/4 h-2 bg-white/5 rounded" />
      </div>

      <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}

export function GallerySkeleton() {
  return (
    <main className="min-h-screen bg-[#030308] text-white font-orbitron overflow-hidden">
      {/* Background visual mimicry */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/5 blur-[200px] rounded-full" />
      </div>

      {/* Header Placeholder - mimicking SectorHeader + FilterBar */}
      <div className="sticky top-0 z-50 animate-pulse">
        <div className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-md" />
        <div className="h-16 border-b border-white/5 bg-black/20" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Hero Title Placeholder */}
        <div className="mb-8 sm:mb-12 animate-pulse">
          <div className="w-48 h-3 bg-white/10 rounded mb-3" />
          <div className="w-64 h-20 bg-white/5 rounded mb-4" />
          <div className="h-0.5 w-32 bg-white/20 mt-4" />
        </div>

        {/* Album Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <AlbumCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </main>
  );
}
