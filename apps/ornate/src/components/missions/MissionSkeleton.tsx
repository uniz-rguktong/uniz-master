'use client';

import React from 'react';

export default function MissionSkeleton() {
  return (
    <div className="group relative flex flex-col font-orbitron overflow-hidden h-[450px]"
      style={{
        background: 'linear-gradient(160deg, #0a0a0f 0%, #070710 60%, #050508 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 30px), calc(100% - 30px) 100%, 0 100%)',
      }}
    >
      {/* Skeleton Shimmer Overlay */}
      <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
      </div>

      {/* Image Area Skeleton */}
      <div className="relative w-full h-36 bg-white/5 shrink-0 overflow-hidden">
        <div className="absolute bottom-3 left-4 w-24 h-6 bg-white/10 rounded" 
             style={{ clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)' }} />
      </div>

      {/* Body Area Skeleton */}
      <div className="flex flex-col flex-1 px-5 pt-3 pb-4 gap-3">
        {/* Tags */}
        <div className="flex items-center gap-1.5">
          <div className="w-12 h-4 bg-white/5 border border-white/10 rounded-sm" />
          <div className="w-16 h-4 bg-white/5 border border-white/10 rounded-sm" />
          <div className="w-14 h-4 bg-white/5 border border-white/10 rounded-sm" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <div className="w-full h-5 bg-white/10 rounded" />
          <div className="w-4/5 h-5 bg-white/10 rounded" />
        </div>

        <div className="flex-1" />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-px bg-white/5 border border-white/5">
          <div className="flex flex-col gap-2 px-3 py-2 bg-black/40">
            <div className="w-8 h-2 bg-white/5 rounded" />
            <div className="w-16 h-3 bg-white/10 rounded" />
          </div>
          <div className="flex flex-col gap-2 px-3 py-2 bg-black/40">
            <div className="w-8 h-2 bg-white/5 rounded" />
            <div className="w-20 h-3 bg-white/10 rounded" />
          </div>
        </div>

        {/* Registration Bar */}
        <div className="space-y-2">
           <div className="flex justify-between items-center">
             <div className="w-20 h-2 bg-white/5 rounded" />
             <div className="w-8 h-3 bg-white/10 rounded" />
           </div>
           <div className="flex gap-[2px] h-2">
             {Array.from({ length: 20 }).map((_, i) => (
               <div key={i} className="flex-1 h-full bg-white/5" />
             ))}
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

export function MissionListSkeleton() {
  return (
    <div className="flex items-center gap-6 px-7 py-5 border border-white/5 bg-white/2 backdrop-blur-sm relative overflow-hidden h-[100px]"
      style={{ borderLeft: '3px solid rgba(255, 255, 255, 0.1)' }}
    >
      <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="w-64 h-5 bg-white/10 rounded mb-2" />
        <div className="flex gap-4">
           <div className="w-24 h-3 bg-white/5 rounded" />
           <div className="w-20 h-3 bg-white/5 rounded" />
        </div>
      </div>

      <div className="flex-none hidden md:flex flex-col items-end gap-2 px-4 border-l border-white/5">
        <div className="w-8 h-2 bg-white/5 rounded" />
        <div className="w-20 h-3 bg-white/10 rounded" />
      </div>

      <div className="flex items-center gap-4 flex-none border-l border-white/5 pl-4 ml-2">
         <div className="flex flex-col items-end gap-1">
            <div className="w-12 h-4 bg-white/10 rounded" />
            <div className="w-24 h-2 bg-white/5 rounded" />
         </div>
         <div className="w-8 h-8 rounded-full bg-white/5" />
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
