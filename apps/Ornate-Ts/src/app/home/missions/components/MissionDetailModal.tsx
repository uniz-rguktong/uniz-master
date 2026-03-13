'use client';

import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import Image from 'next/image';
import type { Mission } from '@/components/missions/MissionCard';
import { ENERGY_REWARDS } from '@/lib/gamification-constants';
import MissionRegister from './MissionRegister';

const MODAL_CAT_CFG: Record<string, { accent: string; label: string; scanColor: string; image: string }> = {
  BRANCHES: { accent: 'var(--color-neon)', label: 'Branches', scanColor: 'rgba(var(--color-neon-rgb, 57, 255, 20), 0.05)', image: '/images/events/branches.svg' },
  CLUBS: { accent: '#22d3ee', label: 'Clubs', scanColor: 'rgba(var(--color-neon-rgb, 57, 255, 20), 0.05)', image: '/images/events/clubs.svg' },
  HHO: { accent: '#fbbf24', label: 'HHo', scanColor: 'rgba(251,191,36,0.05)', image: '/images/events/hho.svg' },
};

const MODAL_DIFF_COLOR = null; // Removed difficulty colors

function MissionDetailModalImpl({
  mission,
  onClose,
  isRegisteredInitial,
  userProfile,
}: {
  mission: Mission;
  onClose: () => void;
  isRegisteredInitial: boolean;
  userProfile?: { id: string; name: string | null; stdid: string | null } | null;
}) {
  const cfg = MODAL_CAT_CFG[mission.category] ?? MODAL_CAT_CFG.BRANCHES;
  const fillPct = Math.min(100, Math.round((mission.registered / mission.totalSlots) * 100));
  const [registered, setRegistered] = useState(isRegisteredInitial);

  return (
    <motion.div
      key="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-500 flex items-center justify-end"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <motion.div
        key="modal-panel"
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="relative h-full w-full max-w-130 flex flex-col font-orbitron overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(160deg, #08080f 0%, #060610 50%, #040408 100%)',
          borderLeft: `1px solid ${cfg.accent}40`,
          boxShadow: `-10px 0 60px ${cfg.accent}18`,
        }}
      >
        <div className="absolute inset-0 pointer-events-none z-0 opacity-10"
          style={{ backgroundImage: `repeating-linear-gradient(0deg, ${cfg.scanColor} 0px, ${cfg.scanColor} 1px, transparent 1px, transparent 4px)` }} />

        <div className="absolute top-0 left-0 w-full h-0.5 z-10"
          style={{ background: `linear-gradient(90deg, transparent, ${cfg.accent}, transparent)` }} />

        <div className="relative w-full h-48 shrink-0 overflow-hidden">
          <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, #040408, ${cfg.accent}22)` }} />
          <Image
            src={cfg.image}
            alt={mission.category}
            fill
            sizes="520px"
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-[#06060f] to-transparent" />

          <button onClick={onClose}
            className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center border border-white/30 bg-black/80 backdrop-blur-sm hover:border-white hover:bg-white/10 text-white transition-all shadow-[0_0_12px_rgba(0,0,0,0.8)]">
            <X className="w-4 h-4" />
          </button>

          <div className="absolute bottom-4 left-5 flex items-center gap-2 z-10">
            <div className="flex items-center gap-1.5 px-3 py-1 backdrop-blur-sm text-[9px] font-black tracking-[0.3em] uppercase"
              style={{
                background: `${cfg.accent}18`, border: `1px solid ${cfg.accent}55`, color: cfg.accent,
                clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)',
              }}>
              {cfg.label}
            </div>

            {mission.isTeam && (
              <div className="flex items-center gap-1.5 px-3 py-1 backdrop-blur-sm text-[9px] font-black tracking-[0.3em] uppercase bg-purple-500/10 border border-purple-500/40 text-neon"
                style={{ clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)' }}>
                TEAM: {mission.teamSizeMin}{mission.teamSizeMax !== mission.teamSizeMin ? `-${mission.teamSizeMax}` : ''}
              </div>
            )}
            {mission.isPaid
              ? <div className="px-3 py-1 text-[9px] font-black tracking-[0.3em] uppercase bg-amber-400/10 border border-amber-400/40 text-amber-400" style={{ clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)' }}>PAID</div>
              : <div className="px-3 py-1 text-[9px] font-black tracking-[0.3em] uppercase bg-neon/10 border border-neon/40 text-neon" style={{ clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)' }}>FREE</div>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-6 relative z-10 custom-scrollbar">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-bold tracking-[0.3em] uppercase px-2.5 py-1 border"
              style={{
                color: cfg.accent, borderColor: `${cfg.accent}44`, background: `${cfg.accent}10`,
                clipPath: 'polygon(5px 0, 100% 0, calc(100% - 5px) 100%, 0 100%)',
              }}>
              {mission.subCategory}
            </span>
            {mission.eventCategory && (
              <span className="text-[9px] font-bold tracking-[0.3em] uppercase px-2.5 py-1 border"
                style={{
                  color: cfg.accent, borderColor: `${cfg.accent}33`, background: `${cfg.accent}08`,
                  clipPath: 'polygon(5px 0, 100% 0, calc(100% - 5px) 100%, 0 100%)',
                }}>
                {mission.eventCategory}
              </span>
            )}
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-tight"
              style={{ color: cfg.accent, textShadow: `0 0 30px ${cfg.accent}44` }}>
              {mission.title}
            </h2>
          </div>

          <p className="text-[15px] md:text-base text-gray-200 leading-relaxed font-apex tracking-wide">{mission.description}</p>

          <div className="grid grid-cols-2 gap-3">
            {(
              [
                { label: 'Event Date', value: mission.eventDate },
                { label: 'Day', value: mission.eventDay },
                { label: 'Venue', value: mission.venue },
                { label: 'Deadline', value: `T-${mission.deadline}` },
                { label: 'Slots', value: mission.slots },
                { label: 'Winner (1/2/3)', value: `${ENERGY_REWARDS.MISSION_FIRST}/${ENERGY_REWARDS.MISSION_SECOND}/${ENERGY_REWARDS.MISSION_THIRD} XP` },
                { label: 'Live Attendance', value: `+${ENERGY_REWARDS.EVENT_ATTEND} XP` },
              ]
            ).map((stat, idx) => {
              if (!stat) return null;
              return (
                <div key={stat.label || idx} className="px-4 py-3 border border-gray-800/60 bg-black/30">
                  <p className="text-[9px] text-gray-400 tracking-[0.35em] uppercase font-bold mb-1">{stat.label}</p>
                  <p className="text-sm font-black tracking-wide uppercase" style={{ color: (stat as any).color ?? '#fff' }}>{stat.value}</p>
                </div>
              );
            })}
          </div>

          <div className="space-y-2 pb-6">
            <div className="flex justify-between text-[9px] font-bold tracking-widest text-white uppercase">
              <span>Registration Status</span>
              <span style={{ color: cfg.accent }}>{mission.registered} / {mission.totalSlots} ({fillPct}%)</span>
            </div>
            <div className="w-full h-2 bg-white/5 overflow-hidden rounded-full">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${fillPct}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: cfg.accent, boxShadow: `0 0 8px ${cfg.accent}` }}
              />
            </div>
            {fillPct >= 90 && (
              <p className="text-[8px] text-red-400 font-black tracking-widest animate-pulse">⚠ ALMOST FULL - ACT FAST</p>
            )}

            {mission.coordinators && mission.coordinators.length > 0 && (
              <div className="mt-3 border border-white/10 bg-black/30 px-3 py-2.5">
                <p className="text-[8px] font-black tracking-[0.25em] uppercase mb-2" style={{ color: cfg.accent }}>
                  Event Coordinator
                </p>
                <div className="space-y-1.5">
                  {mission.coordinators.map((coordinator, idx) => (
                    <p key={`${coordinator.name}-${idx}`} className="text-[10px] text-white/90 font-bold tracking-wide">
                      {coordinator.name}
                      {coordinator.phone ? ` - ${coordinator.phone}` : ''}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          <MissionRegister
            mission={mission}
            accent={cfg.accent}
            registered={registered}
            setRegistered={setRegistered}
            userProfile={userProfile}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

const MissionDetailModal = memo(MissionDetailModalImpl);
MissionDetailModal.displayName = 'MissionDetailModal';

export default MissionDetailModal;
