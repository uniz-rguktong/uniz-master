'use client';

import { type RefObject } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ArrowLeft, Filter, Search, X, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { StepCrumb, SubPill } from './MissionFilterBits';
export type EventType = 'ALL' | 'BRANCHES' | 'CLUBS' | 'HHO';

type EventMeta = {
  label: string;
  icon: LucideIcon;
  color: string;
  border: string;
  bg: string;
  glow: string;
  image: string;
  desc: string;
  accent: string;
};

type Props = {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  selectedEvent: EventType;
  selectedSub: string;
  selectedCat: string;
  filterOpen: boolean;
  setFilterOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  filterStep: 1 | 2 | 3;
  setFilterStep: (v: 1 | 2 | 3) => void;
  hasFilter: boolean;
  filteredCount: number;
  needsStep3: boolean;
  step2Label: string;
  step3Label: string;
  EVENT_META: Record<Exclude<EventType, 'ALL'>, EventMeta>;
  SUB_OPTIONS: Record<Exclude<EventType, 'ALL'>, string[]>;
  EVENT_CATS: string[];
  DISPLAY: Record<string, string>;
  eventMeta: EventMeta | null;
  dropRef: RefObject<HTMLDivElement | null>;
  handleEventSelect: (ev: EventType) => void;
  handleSubSelect: (sub: string) => void;
  handleCatSelect: (cat: string) => void;
  clearFilters: () => void;
};

export default function MissionsFilterBar(props: Props) {
  const {
    searchQuery, setSearchQuery,
    selectedEvent, selectedSub, selectedCat,
    filterOpen, setFilterOpen, filterStep, setFilterStep,
    hasFilter, filteredCount, needsStep3, step2Label, step3Label,
    EVENT_META, SUB_OPTIONS, EVENT_CATS, DISPLAY, eventMeta, dropRef,
    handleEventSelect, handleSubSelect, handleCatSelect, clearFilters,
  } = props;
  return (
    <div className="relative z-50 px-4 md:px-12 py-3 flex items-center gap-3 border-b border-white/5 bg-black/40 backdrop-blur-sm">
      <div className="relative group flex-1 lg:flex-none lg:w-64 xl:w-72 shrink-0">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-neon transition-colors" />
        <input
          type="text"
          suppressHydrationWarning
          placeholder="SEARCH DIRECTIVES..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-black/50 border border-gray-800 focus:border-neon/60 py-2.5 pl-11 pr-4 text-xs font-bold tracking-widest text-white placeholder:text-gray-400 transition-all outline-none"
        />
      </div>

      <div className="hidden lg:block w-px h-7 bg-gray-800 shrink-0" />

      <div className="hidden lg:flex items-center gap-2 overflow-x-auto scrollbar-hide shrink-0 lg:flex-1">
        <button
          onClick={() => { handleEventSelect('ALL'); }}
          suppressHydrationWarning
          className={`group relative px-6 py-2 text-[10px] font-black tracking-widest uppercase transition-all duration-200 border shrink-0 overflow-hidden -skew-x-12 ${selectedEvent === 'ALL'
            ? 'bg-white/10 border-white/40 text-white shadow-[0_0_10px_rgba(255,255,255,0.2)]'
            : 'bg-black/40 border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300'}`}
        >
          <div className="skew-x-12 flex items-center justify-center">All</div>
        </button>

        {(Object.keys(EVENT_META) as Exclude<EventType, 'ALL'>[]).map(ev => {
          const meta = EVENT_META[ev];
          const active = selectedEvent === ev;
          const Icon = meta.icon;

          return (
            <button
              key={ev}
              suppressHydrationWarning
              onClick={() => { handleEventSelect(ev); }}
              className={`group relative px-6 py-2 text-[10px] font-black tracking-widest uppercase transition-all duration-200 border shrink-0 overflow-hidden -skew-x-12 ${active
                ? `${meta.bg} ${meta.border} ${meta.color} ${meta.glow}`
                : 'bg-black/40 border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300'}`}
            >
              <div className="skew-x-12 flex items-center gap-1.5 justify-center">
                <Icon className="w-3.5 h-3.5 hidden sm:block" />
                {meta.label}
              </div>
            </button>
          );
        })}
      </div>

      <div className="w-px h-7 bg-gray-800 shrink-0 hidden lg:block" />

      <div ref={dropRef} className="relative shrink-0">
        <button
          onClick={() => { setFilterOpen(v => !v); setFilterStep(selectedEvent === 'ALL' ? 1 : selectedSub === 'ALL' ? 2 : needsStep3 ? 3 : 1); }}
          suppressHydrationWarning
          className={`flex items-center gap-2 px-4 py-2 border text-[10px] font-black tracking-widest uppercase transition-all duration-200 rounded-sm ${filterOpen || hasFilter
            ? 'bg-neon/10 border-neon/60 text-neon shadow-[0_0_12px_rgba(var(--color-neon-rgb,57,255,20),0.25)]'
            : 'border-gray-800 text-gray-500 hover:border-neon/40 hover:text-neon'}`}>
          <Filter className="w-3.5 h-3.5" />
          Filter
          {hasFilter && <span className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse" />}
        </button>

        <AnimatePresence>
          {filterOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute right-0 top-[calc(100%+10px)] w-[min(500px,calc(100vw-2rem))] bg-[#080808] border border-gray-800 shadow-[0_24px_80px_rgba(0,0,0,0.9)] z-200 overflow-hidden will-change-transform" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%)' }}
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800/80 bg-black/70">
                <div className="flex items-center gap-2 text-[9px] font-black tracking-[0.25em] uppercase">
                  <StepCrumb step={1} active={filterStep === 1} done={filterStep > 1} label="Event" color="text-[var(--color-neon)]" />
                  {selectedEvent !== 'ALL' && (
                    <>
                      <ChevronRight className="w-3 h-3 text-gray-700" />
                      <StepCrumb step={2} active={filterStep === 2} done={filterStep > 2} label={step2Label} color={eventMeta?.color || 'text-gray-400'} />
                    </>
                  )}
                  {needsStep3 && selectedSub !== 'ALL' && (
                    <>
                      <ChevronRight className="w-3 h-3 text-gray-700" />
                      <StepCrumb step={3} active={filterStep === 3} done={false} label={step3Label} color="text-[var(--color-neon)]" />
                    </>
                  )}
                </div>
                <button onClick={() => setFilterOpen(false)} className="text-gray-600 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <AnimatePresence mode="wait">
                {filterStep === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 14 }} transition={{ duration: 0.18 }} className="p-5">
                    <p className="text-[9px] text-gray-600 tracking-[0.35em] uppercase mb-4 font-bold">Select an event type</p>
                    <div className="grid grid-cols-3 gap-3">
                      {(Object.keys(EVENT_META) as Exclude<EventType, 'ALL'>[]).map(ev => {
                        const meta = EVENT_META[ev];
                        const Icon = meta.icon;
                        const active = selectedEvent === ev;
                        return (
                          <button
                            key={ev}
                            onClick={() => handleEventSelect(ev)}
                            className="group relative flex flex-col overflow-hidden text-left transition-all duration-300"
                            style={{
                              background: 'linear-gradient(160deg, #0a0a0f 0%, #070710 60%, #050508 100%)',
                              border: `1px solid ${active ? meta.accent + 'cc' : meta.accent + '55'}`,
                              clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)',
                              filter: `drop-shadow(0 0 ${active ? '10px' : '4px'} ${meta.accent}${active ? '66' : '33'})`,
                            }}
                          >
                            <div className={`absolute top-0 left-0 w-full h-0.5 z-20 transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-30 group-hover:opacity-80'}`}
                              style={{ background: `linear-gradient(90deg, transparent, ${meta.accent}, transparent)` }} />
                            <div className="absolute inset-0 pointer-events-none z-10 opacity-30"
                              style={{ backgroundImage: `repeating-linear-gradient(0deg, ${meta.accent}08 0px, ${meta.accent}08 1px, transparent 1px, transparent 4px)` }} />

                            <div className="absolute top-0 left-0 w-3 h-3 z-20 pointer-events-none">
                              <div className="absolute top-0 left-0 w-3 h-px opacity-70" style={{ backgroundColor: meta.accent }} />
                              <div className="absolute top-0 left-0 w-px h-3 opacity-70" style={{ backgroundColor: meta.accent }} />
                            </div>
                            <div className="absolute top-0 right-0 w-3 h-3 z-20 pointer-events-none">
                              <div className="absolute top-0 right-0 w-3 h-px opacity-70" style={{ backgroundColor: meta.accent }} />
                              <div className="absolute top-0 right-0 w-px h-3 opacity-70" style={{ backgroundColor: meta.accent }} />
                            </div>
                            <div className="absolute bottom-0 left-0 w-3 h-3 z-20 pointer-events-none">
                              <div className="absolute bottom-0 left-0 w-3 h-px opacity-70" style={{ backgroundColor: meta.accent }} />
                              <div className="absolute bottom-0 left-0 w-px h-3 opacity-70" style={{ backgroundColor: meta.accent }} />
                            </div>

                            <div className="relative w-full h-20 overflow-hidden shrink-0">
                              <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, #040408, ${meta.accent}18)` }} />
                              <Image
                                src={meta.image}
                                alt={meta.label}
                                fill
                                sizes="140px"
                                className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-95 group-hover:scale-105 transition-all duration-500"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                              <div className="absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-[#060608] to-transparent" />
                              <div className="absolute bottom-2 left-2.5 flex items-center gap-1.5 px-2 py-0.5 backdrop-blur-sm"
                                style={{ background: `${meta.accent}18`, border: `1px solid ${meta.accent}55`, clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)' }}>
                                <Icon className="w-3 h-3" style={{ color: meta.accent }} />
                                <span className="text-[8px] font-black tracking-[0.2em] uppercase" style={{ color: meta.accent }}>{meta.label}</span>
                              </div>
                              {active && (
                                <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at 50% 50%, ${meta.accent}, transparent 70%)` }} />
                              )}
                            </div>

                            <div className="flex flex-col gap-1.5 px-3 py-2.5 relative z-10">
                              <span className="text-[8px] text-gray-600 tracking-wider leading-relaxed">{meta.desc}</span>
                              <div className="flex items-center gap-1 text-[7px] font-black tracking-[0.25em] uppercase transition-colors duration-200"
                                style={{ color: active ? meta.accent : '#4b5563' }}>
                                {active ? '✓ SELECTED' : 'SELECT'} <ChevronRight className="w-2.5 h-2.5" />
                              </div>
                            </div>

                            {!active && (
                              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center py-1.5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-30"
                                style={{ background: `linear-gradient(90deg, ${meta.accent}dd, ${meta.accent}bb)`, clipPath: 'polygon(0 6px, 6px 0, 100% 0, 100% 100%, 0 100%)' }}>
                                <span className="text-[7px] font-black tracking-[0.3em] uppercase text-black">SELECT EVENT</span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {filterStep === 2 && selectedEvent !== 'ALL' && (
                  <motion.div key="s2" initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.18 }} className="p-5">
                    <button onClick={() => setFilterStep(1)}
                      className="flex items-center gap-1.5 text-[9px] text-gray-500 hover:text-white font-bold tracking-widest uppercase mb-4 transition-colors">
                      <ArrowLeft className="w-3 h-3" /> Back
                    </button>
                    <p className="text-[9px] text-gray-600 tracking-[0.35em] uppercase mb-4 font-bold">
                      {selectedEvent === 'BRANCHES' ? 'Select department' : selectedEvent === 'CLUBS' ? 'Select club' : 'Select category'}
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      <SubPill label="All" active={selectedSub === 'ALL'} onClick={() => handleSubSelect('ALL')} color="" />
                      {SUB_OPTIONS[selectedEvent].map(sub => {
                        const meta = EVENT_META[selectedEvent];
                        const active = selectedSub === sub;
                        return (
                          <button
                            key={sub}
                            onClick={() => handleSubSelect(sub)}
                            style={{ clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)' }}
                            className={`flex items-center gap-1.5 px-5 py-2 text-[10px] font-black tracking-widest uppercase border transition-all duration-200 ${active
                              ? `${meta.bg} ${meta.border} ${meta.color} ${meta.glow}`
                              : 'border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300'}`}
                          >
                            {DISPLAY[sub] || sub}
                            {needsStep3 && <ChevronRight className="w-2.5 h-2.5 opacity-50" />}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {filterStep === 3 && needsStep3 && selectedSub !== 'ALL' && (
                  <motion.div key="s3" initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.18 }} className="p-5">
                    <button onClick={() => setFilterStep(2)}
                      className="flex items-center gap-1.5 text-[9px] text-gray-500 hover:text-white font-bold tracking-widest uppercase mb-1 transition-colors">
                      <ArrowLeft className="w-3 h-3" /> Back
                    </button>
                    <div className={`flex items-center gap-1.5 text-[9px] font-black tracking-widest uppercase mb-4 ${eventMeta?.color}`}>
                      <span className="text-gray-600">{eventMeta?.label}</span>
                      <ChevronRight className="w-3 h-3 text-gray-700" />
                      <span>{DISPLAY[selectedSub] || selectedSub}</span>
                      <ChevronRight className="w-3 h-3 text-gray-700" />
                      <span className="text-gray-500">?</span>
                    </div>
                    <p className="text-[9px] text-gray-600 tracking-[0.35em] uppercase mb-4 font-bold">Select category</p>
                    <div className="flex flex-wrap gap-2.5">
                      <SubPill label="All" active={selectedCat === 'ALL'} onClick={() => handleCatSelect('ALL')} color="" />
                      {EVENT_CATS.map(cat => {
                        const active = selectedCat === cat;
                        return (
                          <button
                            key={cat}
                            onClick={() => handleCatSelect(cat)}
                            style={{ clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)' }}
                            className={`px-5 py-2 text-[10px] font-black tracking-widest uppercase border transition-all duration-200 ${active
                              ? 'bg-neon/10 border-neon text-neon shadow-[0_0_12px_rgba(192,132,252,0.3)]'
                              : 'border-gray-800 text-gray-500 hover:border-neon/40 hover:text-purple-300'}`}
                          >
                            {DISPLAY[cat] || cat}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="px-5 py-2.5 border-t border-gray-800/60 bg-black/50 flex items-center justify-between">
                <span className="text-[8px] text-white tracking-widest uppercase font-bold">
                  {filteredCount} directive{filteredCount !== 1 ? 's' : ''} found
                </span>
                {hasFilter && (
                  <button onClick={clearFilters} className="text-[8px] text-red-500/70 hover:text-red-400 font-bold tracking-widest uppercase transition-colors">
                    Clear All
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
