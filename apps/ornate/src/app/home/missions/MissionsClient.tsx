'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  BookmarkCheck,
  ChevronRight,
  LayoutGrid,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import SectorHeader from '@/components/layout/SectorHeader';
import MissionsFooter from '@/components/missions/MissionsFooter';
import type { Mission } from '@/components/missions/MissionCard';
import { addAlpha } from '@/lib/utils';
import MissionsFilterBar, { type EventType } from './components/MissionsFilterBar';
import { AutoScrollRow, MissionCardsView } from './components/MissionCard';
import MissionDetailModal from './components/MissionDetailModal';
import { DISPLAY, EVENT_META } from './components/missionsConfig';
import { MissionsSectionHeader, TerminalDataNodes } from './components/MissionsVisuals';
import MissionsTopBar from './components/MissionsTopBar';
import MissionsEmptyState from '@/components/missions/MissionsEmptyState';

export default function MissionsClient({
  missions: MISSIONS,
  registeredEventIds = [],
  userProfile,
  initialMissionId = null,
}: {
  missions: Mission[];
  registeredEventIds?: string[];
  userProfile?: { id: string; name: string | null; stdid: string | null; branch: string | null; currentYear: string | null } | null;
  initialMissionId?: string | null;
}) {
  const BRANCH_SUBS = useMemo(() => Array.from(new Set(MISSIONS.filter(m => m.category === 'BRANCHES').map(m => m.subCategory))).sort(), [MISSIONS]);
  const CLUB_SUBS = useMemo(() => Array.from(new Set(MISSIONS.filter(m => m.category === 'CLUBS').map(m => m.subCategory))).sort(), [MISSIONS]);
  const HHO_SUBS = useMemo(() => Array.from(new Set(MISSIONS.filter(m => m.category === 'HHO').map(m => m.subCategory))).sort(), [MISSIONS]);
  const EVENT_CATS = useMemo(() => Array.from(new Set(MISSIONS.map(m => m.eventCategory).filter((c): c is string => !!c))).sort(), [MISSIONS]);

  const SUB_OPTIONS: Record<Exclude<EventType, 'ALL'>, string[]> = {
    BRANCHES: BRANCH_SUBS,
    CLUBS: CLUB_SUBS,
    HHO: HHO_SUBS,
  };

  const [selectedEvent, setSelectedEvent] = useState<EventType>('ALL');
  const [selectedSub, setSelectedSub] = useState('ALL');
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterStep, setFilterStep] = useState<1 | 2 | 3>(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'stack'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return 'stack';
    return 'grid';
  });
  const [myMissionsActive, setMyMissionsActive] = useState(false);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);

  const MY_MISSION_IDS = useMemo(() => new Set(registeredEventIds), [registeredEventIds]);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const routeMissionId = initialMissionId ?? (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('id') : null);
    if (!routeMissionId) return;
    const mission = MISSIONS.find(m => m.id === routeMissionId);
    if (!mission) return;

    const timeout = setTimeout(() => setSelectedMission(mission), 0);
    return () => clearTimeout(timeout);
  }, [initialMissionId, MISSIONS]);

  const handleEventSelect = (ev: EventType) => {
    setSelectedEvent(ev);
    setSelectedSub('ALL');
    setSelectedCat('ALL');
    if (ev === 'ALL') {
      setFilterOpen(false);
      setFilterStep(1);
    } else {
      setFilterStep(2);
    }
  };

  const handleSubSelect = (sub: string) => {
    setSelectedSub(sub);
    setSelectedCat('ALL');
    if (selectedEvent === 'HHO') {
      setFilterOpen(false);
      setFilterStep(1);
    } else {
      setFilterStep(3);
    }
  };

  const handleCatSelect = (cat: string) => {
    setSelectedCat(cat);
    setFilterOpen(false);
    setFilterStep(1);
  };

  const clearFilters = () => {
    setSelectedEvent('ALL');
    setSelectedSub('ALL');
    setSelectedCat('ALL');
    setFilterStep(1);
    setFilterOpen(false);
  };

  const filteredMissions = useMemo(() => {
    return MISSIONS.filter(m => {
      const matchEvent = selectedEvent === 'ALL' || m.category === selectedEvent;
      const matchSub = selectedSub === 'ALL' || m.subCategory === selectedSub;
      const matchCat = selectedCat === 'ALL' || (m.category === 'HHO' ? m.subCategory === selectedCat : m.eventCategory === selectedCat);
      const q = searchQuery.toLowerCase();
      const matchQuery = m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q);
      return matchEvent && matchSub && matchCat && matchQuery;
    });
  }, [MISSIONS, selectedEvent, selectedSub, selectedCat, searchQuery]);

  const myMissions = useMemo(() => MISSIONS.filter(m => MY_MISSION_IDS.has(m.id)), [MISSIONS, MY_MISSION_IDS]);
  const trending = useMemo(() => [...MISSIONS].sort((a, b) => b.registered - a.registered).slice(0, 6), [MISSIONS]);
  const newMissions = useMemo(() => {
    const trendingIds = new Set(trending.map(m => m.id));
    return [...MISSIONS].reverse().filter(m => !trendingIds.has(m.id)).slice(0, 6);
  }, [MISSIONS, trending]);

  const hasActiveSearch = searchQuery.trim().length > 0;
  const hasFilter = selectedEvent !== 'ALL' || selectedSub !== 'ALL' || selectedCat !== 'ALL' || hasActiveSearch;
  const eventMeta = selectedEvent !== 'ALL' ? EVENT_META[selectedEvent] : null;
  const needsStep3 = selectedEvent === 'BRANCHES' || selectedEvent === 'CLUBS';
  const step2Label = selectedEvent === 'BRANCHES' ? 'Department' : selectedEvent === 'CLUBS' ? 'Club' : 'Category';
  const step3Label = 'Category';
  const accentColor = eventMeta?.accent || 'var(--color-neon)';
  const crumb = [
    selectedEvent !== 'ALL' && eventMeta?.label,
    selectedSub !== 'ALL' && (DISPLAY[selectedSub] || selectedSub),
    selectedCat !== 'ALL' && (DISPLAY[selectedCat] || selectedCat),
  ].filter(Boolean) as string[];

  return (
    <main suppressHydrationWarning className="relative w-screen h-screen text-white overflow-hidden bg-[#020205] font-orbitron flex flex-col">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(10,12,20,1)_0%,rgba(2,2,5,1)_100%)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vh] opacity-10 blur-[120px] transition-all duration-1000 animate-[ambient-pulse_12s_infinite]" style={{ background: `radial-gradient(circle, ${accentColor} 0%, transparent 60%)` }} />
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: `linear-gradient(${addAlpha(accentColor, '22')} 1px, transparent 1px), linear-gradient(90deg, ${addAlpha(accentColor, '22')} 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />
        <div className="absolute top-0 left-0 w-full h-[30vh] pointer-events-none animate-[scanning_10s_linear_infinite]" style={{ background: `linear-gradient(to bottom, transparent, ${addAlpha(accentColor, '11')} 50%, transparent)`, boxShadow: `0 0 40px ${addAlpha(accentColor, '08')}` }} />
        <div className="absolute inset-0 z-10 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-size-[100%_4px]" />
        <TerminalDataNodes accentColor={accentColor} />
      </div>

      <SectorHeader title="MISSION CONTROL" userProfile={userProfile} />

      <MissionsTopBar
        viewMode={viewMode}
        setViewMode={setViewMode}
        myMissionsActive={myMissionsActive}
        toggleMyMissions={() => setMyMissionsActive(v => !v)}
        missionCount={MY_MISSION_IDS.size}
      />

      <MissionsFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedEvent={selectedEvent}
        selectedSub={selectedSub}
        selectedCat={selectedCat}
        filterOpen={filterOpen}
        setFilterOpen={setFilterOpen}
        filterStep={filterStep}
        setFilterStep={setFilterStep}
        hasFilter={hasFilter}
        filteredCount={filteredMissions.length}
        needsStep3={needsStep3}
        step2Label={step2Label}
        step3Label={step3Label}
        EVENT_META={EVENT_META}
        SUB_OPTIONS={SUB_OPTIONS}
        EVENT_CATS={EVENT_CATS}
        DISPLAY={DISPLAY}
        eventMeta={eventMeta}
        dropRef={dropRef}
        handleEventSelect={handleEventSelect}
        handleSubSelect={handleSubSelect}
        handleCatSelect={handleCatSelect}
        clearFilters={clearFilters}
      />

      <div className="flex-1 overflow-y-auto px-6 sm:px-8 md:px-12 py-4 md:py-10 scrollbar-hide relative z-10">
        {myMissionsActive ? (
          <>
            <div className="mb-6 flex items-center gap-2 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
              <BookmarkCheck className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400">My Missions</span>
              <span className="text-gray-700 ml-1">- {MY_MISSION_IDS.size} saved</span>
            </div>
            {myMissions.length > 0 ? (
              <MissionCardsView missions={myMissions} allMissions={MISSIONS} viewMode={viewMode} onSelect={setSelectedMission} registeredIds={MY_MISSION_IDS} />
            ) : (
              <MissionsEmptyState type="saved" onReset={() => setMyMissionsActive(false)} />
            )}
          </>
        ) : hasFilter ? (
          <>
            <div className="mb-6 flex items-center gap-2 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
              <span>Showing:</span>
              {crumb.map((c, i) => (
                <span key={i} className={`flex items-center gap-1.5 ${i === 0 && eventMeta ? eventMeta.color : i === 2 ? 'text-neon' : 'text-white'}`}>
                  {i > 0 && <ChevronRight className="w-3 h-3 text-gray-700" />} {c}
                </span>
              ))}
              <span className="text-gray-700 ml-1">- {filteredMissions.length} result{filteredMissions.length !== 1 ? 's' : ''}</span>
            </div>
            {filteredMissions.length > 0 ? (
              <MissionCardsView missions={filteredMissions} allMissions={MISSIONS} viewMode={viewMode} onSelect={setSelectedMission} registeredIds={MY_MISSION_IDS} />
            ) : (
              <MissionsEmptyState type="search" onReset={clearFilters} />
            )}
          </>
        ) : (
          <div className="space-y-8 md:space-y-14 pb-20">
            {viewMode === 'grid' && (
              <>
                <section>
                  <MissionsSectionHeader icon={TrendingUp} label="Trending" count={trending.length} color="text-[#ff4500]" glow="shadow-[0_0_10px_rgba(255,69,0,0.3)]" />
                  {trending.length > 0 ? (
                    <AutoScrollRow missions={trending} speed={0.5} onCardClick={setSelectedMission} registeredIds={MY_MISSION_IDS} />
                  ) : (
                    <MissionsEmptyState type="trending" />
                  )}
                </section>
                <section>
                  <MissionsSectionHeader icon={Sparkles} label="New" count={newMissions.length} color="text-neon" glow="shadow-[0_0_10px_rgba(var(--color-neon-rgb,57,255,20),0.3)]" />
                  {newMissions.length > 0 ? (
                    <AutoScrollRow missions={newMissions} speed={0.4} onCardClick={setSelectedMission} registeredIds={MY_MISSION_IDS} />
                  ) : (
                    <MissionsEmptyState type="new" />
                  )}
                </section>
              </>
            )}

            <section>
              <MissionsSectionHeader icon={LayoutGrid} label="All Missions" count={MISSIONS.length} color="text-gray-400" glow="" />
              {MISSIONS.length > 0 ? (
                <MissionCardsView missions={MISSIONS} allMissions={MISSIONS} viewMode={viewMode} onSelect={setSelectedMission} registeredIds={MY_MISSION_IDS} />
              ) : (
                <MissionsEmptyState type="all" />
              )}
            </section>
          </div>
        )}

        <MissionsFooter />
      </div>

      <div className="h-10 bg-neon/5 border-t border-neon/10 px-4 md:px-12 flex items-center justify-between text-[10px] font-bold tracking-[0.3em] text-gray-600 relative z-50 shrink-0">
        <span className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-neon animate-pulse" />
          <span className="hidden sm:inline">LIVE MISSION STREAM ACTIVE</span>
          <span className="sm:hidden">LIVE</span>
        </span>
        <span className="hidden md:block">ENCRYPTION: AES-256-QUANTUM</span>
        <div className="flex gap-4 md:gap-8">
          <span className="hidden sm:inline">SECTOR: REGION-12-ONGOLE</span>
          <span className="text-neon">TERMINAL SECURE</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {selectedMission && (
          <MissionDetailModal
            mission={selectedMission}
            isRegisteredInitial={MY_MISSION_IDS.has(selectedMission.id)}
            userProfile={userProfile}
            onClose={() => setSelectedMission(null)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
