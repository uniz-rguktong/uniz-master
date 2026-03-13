'use client';

import { memo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import BaseMissionCard, { Mission } from '@/components/missions/MissionCard';
import { MorphingCardStack, type CardData } from '@/components/ui/morphing-card-stack';
import { ENERGY_REWARDS } from '@/lib/gamification-constants';

const CATEGORY_COLORS: Record<Mission['category'], string> = {
  BRANCHES: 'var(--color-neon)',
  CLUBS: '#22d3ee',
  HHO: '#fbbf24',
};

export const missionToCard = (m: Mission): CardData => ({
  id: m.id,
  title: m.title,
  description: m.description,
  color: CATEGORY_COLORS[m.category] ?? 'var(--color-neon)',
  date: m.eventDate,
  venue: m.venue,
  subCategory: m.subCategory,
  eventCategory: m.eventCategory,
  isTeam: m.isTeam,
  registered: m.registered,
  totalSlots: m.totalSlots,
  isPaid: m.isPaid,
  mission: m,
});

const MemoizedMissionCard = memo(BaseMissionCard);

const CAT_ACCENT: Record<string, string> = {
  BRANCHES: 'var(--color-neon)',
  CLUBS: '#22d3ee',
  HHO: '#fbbf24',
};

const MissionListRow = memo(({ mission, onClick }: { mission: Mission; onClick?: () => void }) => {
  const accent = CAT_ACCENT[mission.category] ?? 'var(--color-neon)';
  const fillPct = Math.min(100, Math.round((mission.registered / mission.totalSlots) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.2 }}
      className="group flex items-center gap-6 px-7 py-5 border border-white/5 hover:border-white/20 bg-white/2 hover:bg-white/5 transition-all duration-300 cursor-pointer backdrop-blur-sm relative overflow-hidden"
      style={{ borderLeft: `3px solid ${accent}` }}
      onClick={onClick}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `linear-gradient(90deg, ${accent}11 0%, transparent 40%)` }} />

      <div className="flex-1 min-w-0 z-10">
        <div className="flex items-center gap-3 mb-1">
          <p className="text-lg md:text-xl font-black tracking-tighter uppercase truncate transition-all group-hover:tracking-normal" style={{ color: accent, textShadow: `0 0 20px ${accent}33` }}>
            {mission.title}
          </p>
          {mission.isTeam && (
            <span className="flex-none px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 text-neon text-[8px] font-black tracking-widest uppercase rounded-sm">TEAM</span>
          )}
        </div>
        <div className="flex items-center gap-4 flex-wrap mt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent, boxShadow: `0 0 6px ${accent}` }} />
            <span className="text-[10px] text-white font-bold tracking-[0.2em] uppercase">{mission.subCategory}</span>
          </div>
          {mission.eventCategory && (
            <span className="text-[10px] text-gray-200 font-bold tracking-[0.2em] uppercase border-l border-white/20 pl-4">{mission.eventCategory}</span>
          )}
        </div>
      </div>

      <div className="flex-none hidden md:flex flex-col items-end gap-1 px-4 border-l border-white/5">
        <span className="text-[8px] text-gray-600 font-bold tracking-[0.3em] uppercase">Timeline</span>
        <span className="text-xs text-white font-black tracking-wider uppercase">{mission.eventDate}</span>
      </div>

      <div className="flex-none hidden lg:flex flex-col items-end gap-1 px-4 border-l border-white/5">
        <span className="text-[8px] text-gray-600 font-bold tracking-[0.3em] uppercase underline decoration-white/10 underline-offset-4">Allocation</span>
        <div className="flex items-center gap-3">
          <div className="w-24 h-1.5 bg-white/5 overflow-hidden rounded-full">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${fillPct}%`, backgroundColor: accent, boxShadow: `0 0 10px ${accent}bb` }} />
          </div>
          <span className="text-[10px] text-gray-400 font-bold font-mono">{String(mission.registered).padStart(2, '0')}/{String(mission.totalSlots).padStart(2, '0')}</span>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-none border-l border-white/5 pl-4 ml-2">
        <div className="flex flex-col items-end gap-1">
          <span className={`text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-sm ${mission.isPaid ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30' : 'bg-neon/10 text-neon border border-neon/30'}`}>
            {mission.isPaid ? 'PAID' : 'FREE'}
          </span>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[10px] font-black text-neon">WIN: {ENERGY_REWARDS.MISSION_FIRST}/{ENERGY_REWARDS.MISSION_SECOND}/{ENERGY_REWARDS.MISSION_THIRD} <span className="text-[8px] text-gray-600">XP</span></span>
            <span className="text-[10px] font-black text-amber-400">ATTEND: +{ENERGY_REWARDS.EVENT_ATTEND} <span className="text-[8px] text-gray-600">XP</span></span>
          </div>
        </div>
        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
          <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </motion.div>
  );
});
MissionListRow.displayName = 'MissionListRow';

export const AutoScrollRow = memo(({ missions, speed = 0.6, onCardClick, registeredIds }: { missions: Mission[]; speed?: number; onCardClick?: (m: Mission) => void; registeredIds?: Set<string> }) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const pausedRef = useRef(false);
  const dragRef = useRef({ dragging: false, startX: 0, startScroll: 0 });
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const tick = () => {
      if (!pausedRef.current && el) {
        el.scrollLeft += speed;
        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollLeft = 0;
        }
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [speed]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = rowRef.current;
    if (!el) return;
    dragRef.current = { dragging: true, startX: e.clientX, startScroll: el.scrollLeft };
    pausedRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    el.style.cursor = 'grabbing';
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.dragging) return;
    const el = rowRef.current;
    if (!el) return;
    const dx = e.clientX - dragRef.current.startX;
    el.scrollLeft = dragRef.current.startScroll - dx;
    if (el.scrollLeft >= el.scrollWidth / 2) el.scrollLeft -= el.scrollWidth / 2;
    if (el.scrollLeft < 0) el.scrollLeft += el.scrollWidth / 2;
  };

  const handlePointerUp = () => {
    dragRef.current.dragging = false;
    if (rowRef.current) rowRef.current.style.cursor = 'grab';
    resumeTimerRef.current = setTimeout(() => { pausedRef.current = false; }, 2000);
  };

  const doubled = [...missions, ...missions];

  return (
    <div
      ref={rowRef}
      className="flex gap-3 md:gap-6 overflow-x-auto pb-3 scrollbar-hide select-none -mx-6 sm:-mx-8 md:mx-0 px-6 sm:px-8 md:px-0"
      style={{ scrollBehavior: 'auto', cursor: 'grab' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {doubled.map((m, i) => (
        <div
          key={`${m.id}-${i}`}
          className="flex-none w-65 sm:w-[320px] md:w-95"
          onClick={(e) => {
            const dx = Math.abs(e.clientX - dragRef.current.startX);
            if (dx < 10) onCardClick?.(m);
          }}
        >
          <MemoizedMissionCard mission={m} isRegistered={registeredIds?.has(m.id)} />
        </div>
      ))}
    </div>
  );
});
AutoScrollRow.displayName = 'AutoScrollRow';

export const MissionCardsView = ({
  missions,
  allMissions,
  viewMode,
  onSelect,
  registeredIds,
}: {
  missions: Mission[];
  allMissions: Mission[];
  viewMode: 'grid' | 'list' | 'stack';
  onSelect: (mission: Mission) => void;
  registeredIds: Set<string>;
}) => {
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pb-20 max-w-sm sm:max-w-none mx-auto sm:mx-0">
        <AnimatePresence mode="popLayout">
          {missions.map(m => (
            <MemoizedMissionCard 
              key={m.id} 
              mission={m} 
              onClick={() => onSelect(m)} 
              isRegistered={registeredIds.has(m.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    );
  }

  if (viewMode === 'stack') {
    return (
      <div className="pb-20 flex justify-center">
        <MorphingCardStack
          cards={missions.map(missionToCard)}
          onCardClick={c => {
            const found = allMissions.find(m => m.id === c.id);
            if (found) onSelect(found);
          }}
          className="w-full max-w-xl"
          autoSwipeIntervalMs={5000}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 pb-20">
      {missions.map(m => (
        <MissionListRow key={m.id} mission={m} onClick={() => onSelect(m)} />
      ))}
    </div>
  );
};
