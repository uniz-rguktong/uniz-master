'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, ChevronDown, Filter, Search } from 'lucide-react';
import type { BranchOrClub } from '@/lib/data/branch-constants';

export type FilterType = 'ALL' | 'BRANCHES' | 'CLUBS' | 'SPORTS' | 'CULTURALS';

export const FILTER_TABS: { id: FilterType; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'BRANCHES', label: 'Branches' },
  { id: 'CLUBS', label: 'Clubs' },
  { id: 'SPORTS', label: 'Sports' },
  { id: 'CULTURALS', label: 'Culturals' },
];

export default function GalleryFilterBar({
  searchQuery,
  setSearchQuery,
  filter,
  setFilter,
  selectedBranch,
  setSelectedBranch,
  selectedClub,
  setSelectedClub,
  filterOpen,
  setFilterOpen,
  filterStep,
  setFilterStep,
  hasActiveFilters,
  branches,
  clubs,
}: {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  filter: FilterType;
  setFilter: (value: FilterType) => void;
  selectedBranch: string | null;
  setSelectedBranch: (value: string | null) => void;
  selectedClub: string | null;
  setSelectedClub: (value: string | null) => void;
  filterOpen: boolean;
  setFilterOpen: (value: boolean) => void;
  filterStep: 1 | 2;
  setFilterStep: (value: 1 | 2) => void;
  hasActiveFilters: boolean;
  branches: BranchOrClub[];
  clubs: BranchOrClub[];
}) {
  return (
    <div className="relative z-50 px-4 md:px-12 py-3 flex items-center gap-4 border-b border-white/5 bg-black/40 backdrop-blur-md">
      <div className="relative group flex-1 lg:flex-none lg:w-64 xl:w-80 shrink-0">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-neon transition-colors" />
        <input
          type="text"
          placeholder="SEARCH ARCHIVES..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-black/40 border border-gray-800 focus:border-neon/60 py-2.5 pl-11 pr-4 text-[10px] font-black tracking-widest text-white placeholder:text-gray-500 transition-all outline-none"
        />
      </div>

      <div className="hidden lg:flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 sm:pb-0 snap-x justify-start pr-4">
        {FILTER_TABS.map(tab => {
          const active = filter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setFilter(tab.id);
                setSelectedBranch(null);
                setSelectedClub(null);
              }}
              className={`px-4 py-2 text-[9px] font-black tracking-[0.25em] shrink-0 uppercase transition-all duration-200 snap-center -skew-x-12 ${active
                ? 'bg-neon/10 border-neon text-neon shadow-[0_0_15px_rgba(var(--color-neon-rgb,57,255,20),0.25)]'
                : 'bg-black/40 border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300'
                }`}
            >
              <span className="skew-x-12 block">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="relative shrink-0">
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className={`flex items-center gap-2 px-4 py-2 border text-[10px] font-black tracking-widest uppercase transition-all duration-200 rounded-sm ${filterOpen || hasActiveFilters
            ? 'bg-neon/10 border-neon text-neon shadow-[0_0_12px_rgba(var(--color-neon-rgb,57,255,20),0.25)]'
            : 'border-gray-800 text-gray-500 hover:border-gray-600 hover:text-white'
            }`}
        >
          <Filter className="w-3.5 h-3.5" />
          FILTER
          {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse" />}
          <ChevronDown className={`w-3 h-3 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {filterOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 top-[calc(100%+12px)] w-80 sm:w-96 bg-[#080808] border border-gray-800 shadow-[0_24px_80px_rgba(0,0,0,0.9)] z-200 overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-2 text-[9px] font-black tracking-widest uppercase">
                  <span className={filterStep === 1 ? 'text-neon' : 'text-gray-500'}>1. TYPE</span>
                  {(filter === 'BRANCHES' || filter === 'CLUBS') && (
                    <>
                      <span className="text-gray-700">/</span>
                      <span className={filterStep === 2 ? 'text-neon' : 'text-gray-500'}>2. SUB</span>
                    </>
                  )}
                </div>
                <button
                  onClick={() => {
                    setFilter('ALL');
                    setSelectedBranch(null);
                    setSelectedClub(null);
                    setFilterStep(1);
                    setFilterOpen(false);
                  }}
                  className="text-[8px] font-black text-gray-600 hover:text-white transition-colors uppercase"
                >
                  RESET
                </button>
              </div>

              <div className="p-4 overflow-y-auto max-h-[60vh]">
                {filterStep === 1 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {FILTER_TABS.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setFilter(tab.id);
                          if (tab.id === 'BRANCHES' || tab.id === 'CLUBS') setFilterStep(2);
                          else setFilterOpen(false);
                        }}
                        className={`p-3 border transition-all text-left ${filter === tab.id
                          ? 'border-neon/50 bg-neon/10'
                          : 'border-white/5 bg-white/5 hover:border-white/20'
                          }`}
                      >
                        <span className="text-[10px] font-black tracking-widest text-white uppercase">{tab.label}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <button onClick={() => setFilterStep(1)} className="flex items-center gap-1.5 text-[9px] font-black tracking-widest text-gray-500 hover:text-white uppercase transition-colors">
                      <ArrowLeft className="w-3 h-3" /> BACK TO TYPE
                    </button>
                    <div className="grid grid-cols-1 gap-1">
                      {(filter === 'BRANCHES' ? branches : clubs).map(item => {
                        const isSelected = filter === 'BRANCHES' ? selectedBranch === item.slug : selectedClub === item.slug;
                        return (
                          <button
                            key={item.slug}
                            onClick={() => {
                              if (filter === 'BRANCHES') setSelectedBranch(item.slug);
                              else setSelectedClub(item.slug);
                              setFilterOpen(false);
                            }}
                            className={`flex items-center justify-between px-4 py-3 border transition-all ${isSelected
                              ? 'border-neon/50 bg-neon/10 text-neon'
                              : 'border-white/5 bg-white/5 hover:border-white/20 text-gray-400'
                              }`}
                          >
                            <span className="text-[10px] font-black tracking-widest uppercase">{item.name}</span>
                            {isSelected && <Check className="w-3 h-3" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
