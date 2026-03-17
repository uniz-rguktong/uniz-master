'use client';

import React from 'react';

export default function StallSkeleton() {
  return (
    <div className="relative flex flex-col font-orbitron overflow-hidden h-[500px]"
      style={{
        background: 'linear-gradient(155deg, #0a0a10 0%, #06060c 60%, #040408 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Skeleton Shimmer Overlay */}
      <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
      </div>

      {/* Image Area Skeleton */}
      <div className="relative w-full h-52 bg-white/5 shrink-0 overflow-hidden">
        {/* Type Badge */}
        <div className="absolute bottom-3 left-4 w-24 h-6 bg-white/10" 
             style={{ clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)' }} />
        {/* Rating Dots */}
        <div className="absolute bottom-3 right-4 flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-2.5 h-2.5 rounded-full bg-white/10" />
          ))}
        </div>
      </div>

      {/* Body Area Skeleton */}
      <div className="flex flex-col px-5 pt-3 pb-1 gap-2">
        {/* Title */}
        <div className="w-3/4 h-7 bg-white/10 rounded mb-1" />
        {/* Description */}
        <div className="space-y-2">
          <div className="w-full h-4 bg-white/5 rounded" />
          <div className="w-5/6 h-4 bg-white/5 rounded" />
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="px-5 grid grid-cols-3 gap-2 py-2 mt-auto">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-[#121814] border border-white/5 p-2.5 flex flex-col gap-2">
            <div className="w-8 h-2 bg-white/5 rounded" />
            <div className="w-12 h-4 bg-white/10 rounded" />
          </div>
        ))}
      </div>

      {/* Bottom Action Area Skeleton */}
      <div className="px-5 pt-2 pb-4 flex items-center justify-between mt-1">
        <div className="flex items-center gap-2">
          <div className="w-20 h-3 bg-white/5 rounded" />
          <div className="w-9 h-9 bg-white/5 border border-white/10" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-20 h-3 bg-white/5 rounded" />
          <div className="w-9 h-9 bg-white/5 border border-white/10" />
        </div>
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
