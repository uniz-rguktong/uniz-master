'use client';

import React from 'react';

export function MatchScheduleSkeleton() {
  return (
    <div className="relative flex flex-col h-[320px] bg-[linear-gradient(170deg,#0b0b12_0%,#101018_65%,#151114_100%)] border-[1.5px] border-amber-400/20 overflow-hidden"
      style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 24px), calc(100% - 24px) 100%, 0 100%)' }}
    >
      {/* Shimmer Overlay */}
      <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
      </div>

      {/* Header Skeleton */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/5 animate-pulse">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-amber-400/10" />
          <div className="w-20 h-3 bg-amber-400/20 rounded" />
        </div>
        <div className="w-16 h-5 bg-amber-400/10" style={{ clipPath: 'polygon(5px 0, 100% 0, calc(100% - 5px) 100%, 0 100%)' }} />
      </div>

      {/* Teams Skeleton */}
      <div className="flex items-center justify-between px-5 py-5 gap-3 animate-pulse">
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="w-24 h-6 bg-white/10 rounded" />
          <div className="w-12 h-2 bg-white/5 rounded" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-8 h-8 rounded-sm bg-amber-400/10 border border-amber-400/20" />
          <div className="w-6 h-2 bg-white/5 rounded" />
        </div>
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="w-24 h-6 bg-white/10 rounded" />
          <div className="w-12 h-2 bg-white/5 rounded" />
        </div>
      </div>

      {/* Meta Grid Skeleton */}
      <div className="grid grid-cols-2 gap-px border-t border-white/12 mt-auto animate-pulse">
        <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.06]">
          <div className="w-3 h-3 bg-amber-400/20 rounded-full" />
          <div className="space-y-1">
             <div className="w-12 h-2 bg-white/5 rounded" />
             <div className="w-20 h-3 bg-white/10 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.06]">
          <div className="w-3 h-3 bg-amber-400/20 rounded-full" />
          <div className="space-y-1">
             <div className="w-12 h-2 bg-white/5 rounded" />
             <div className="w-20 h-3 bg-white/10 rounded" />
          </div>
        </div>
        <div className="col-span-2 flex items-center gap-2 px-4 py-3 bg-white/[0.08] border-t border-white/12">
          <div className="w-3 h-3 bg-amber-400/20 rounded-full" />
          <div className="space-y-1">
             <div className="w-12 h-2 bg-white/5 rounded" />
             <div className="w-32 h-3 bg-white/10 rounded" />
          </div>
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

export function MatchResultSkeleton() {
  return (
    <div className="relative flex flex-col h-[340px] bg-[#0e0b14] border border-amber-400/20 overflow-hidden"
      style={{ clipPath: 'polygon(0 0, calc(100% - 28px) 0, 100% 28px, 100% 100%, 0 100%)' }}
    >
      {/* Shimmer Overlay */}
      <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.06] animate-pulse">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-amber-400/10 border border-amber-400/20 rounded-sm" />
          <div className="w-20 h-3 bg-amber-400/20 rounded" />
        </div>
        <div className="flex gap-2">
           <div className="w-14 h-5 bg-amber-400/10 rounded" />
           <div className="w-14 h-5 bg-white/5 rounded" />
        </div>
      </div>

      {/* Versus Panel */}
      <div className="flex items-stretch gap-0 px-5 py-5 animate-pulse">
        <div className="flex-1 flex flex-col items-center gap-3">
          <div className="w-11 h-11 bg-amber-400/20 border border-amber-400/30 rounded-sm" />
          <div className="w-10 h-2 bg-amber-400/10 rounded" />
          <div className="w-28 h-8 bg-white/10 rounded" />
          <div className="w-8 h-3 bg-amber-400/20 rounded" />
        </div>
        <div className="flex flex-col items-center justify-center px-5 gap-1.5 opacity-20">
           <div className="w-px h-6 bg-white" />
           <div className="w-4 h-4 bg-white rounded-full" />
           <div className="w-px h-6 bg-white" />
        </div>
        <div className="flex-1 flex flex-col items-center gap-3">
          <div className="w-11 h-11 bg-white/5 border border-white/15 rounded-sm" />
          <div className="w-10 h-2 bg-white/5 rounded" />
          <div className="w-28 h-8 bg-white/5 rounded" />
          <div className="w-8 h-3 bg-white/5 rounded" />
        </div>
      </div>

      {/* Meta Strip */}
      <div className="grid grid-cols-3 border-t border-white/[0.06] mt-auto animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col px-4 py-2.5 border-r border-white/[0.06] last:border-0 bg-white/[0.02]">
            <div className="w-8 h-2 bg-amber-400/10 rounded mb-1" />
            <div className="w-16 h-3 bg-white/10 rounded" />
          </div>
        ))}
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
