'use client';

import { Bookmark, BookmarkCheck, LayoutGrid, LayoutList, List } from 'lucide-react';

type Props = {
  viewMode: 'grid' | 'list' | 'stack';
  setViewMode: (mode: 'grid' | 'list' | 'stack') => void;
  myMissionsActive: boolean;
  toggleMyMissions: () => void;
  missionCount: number;
};

export default function MissionsTopBar({
  viewMode,
  setViewMode,
  myMissionsActive,
  toggleMyMissions,
  missionCount,
}: Props) {
  return (
    <div className="relative z-50 px-4 md:px-12 py-2 flex items-center gap-2 md:gap-3 bg-black/60 border-b border-white/4 overflow-x-auto scrollbar-hide">
      <div className="flex items-center border border-gray-800 overflow-hidden rounded-sm">
        <button id="view-grid-btn" onClick={() => setViewMode('grid')} title="Grid view" className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black tracking-widest uppercase transition-all duration-200 ${viewMode === 'grid' ? 'bg-neon/10 text-neon border-r border-neon/30' : 'text-gray-600 hover:text-gray-300 border-r border-gray-800'}`}><LayoutGrid className="w-3.5 h-3.5" /><span className="hidden sm:inline">Grid</span></button>
        <button id="view-list-btn" onClick={() => setViewMode('list')} title="List view" className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black tracking-widest uppercase transition-all duration-200 border-r ${viewMode === 'list' ? 'bg-neon/10 text-neon border-r border-neon/30' : 'text-gray-600 hover:text-gray-300 border-r border-gray-800'}`}><LayoutList className="w-3.5 h-3.5" /><span className="hidden sm:inline">List</span></button>
        <button id="view-stack-btn" onClick={() => setViewMode('stack')} title="Card stack view" className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black tracking-widest uppercase transition-all duration-200 ${viewMode === 'stack' ? 'bg-neon/10 text-neon' : 'text-gray-600 hover:text-gray-300'}`}><List className="w-3.5 h-3.5" /><span className="hidden sm:inline">Cards</span></button>
      </div>

      <div className="w-px h-5 bg-gray-800" />

      <button
        id="my-missions-btn"
        onClick={toggleMyMissions}
        className={`flex items-center gap-2 px-4 py-1.5 border text-[9px] font-black tracking-widest uppercase transition-all duration-200 rounded-sm ${myMissionsActive ? 'bg-amber-400/10 border-amber-400/50 text-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.2)]' : 'border-gray-800 text-gray-500 hover:border-amber-400/30 hover:text-amber-300'}`}
      >
        {myMissionsActive ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
        My Missions
        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black ${myMissionsActive ? 'bg-amber-400/20 text-amber-300' : 'bg-gray-800 text-gray-600'}`}>{missionCount}</span>
      </button>
    </div>
  );
}
