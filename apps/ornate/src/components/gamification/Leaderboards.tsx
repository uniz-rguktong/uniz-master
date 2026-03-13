'use client';

import { motion } from 'framer-motion';
import { Trophy, Crown, Star, Rocket, Shield, Globe } from 'lucide-react';

const LEVEL_COLORS = {
  EXPLORER:  { color: '#94a3b8', glow: '#64748b' },
  NAVIGATOR: { color: '#22d3ee', glow: '#0891b2' },
  COMMANDER: { color: '#a78bfa', glow: '#7c3aed' },
  GUARDIAN:  { color: '#f59e0b', glow: '#d97706' },
  LEGEND:    { color: '#D6FF00', glow: '#84cc16' },
};

const RANK_ICONS = [
  <Crown  key={0} className="w-4 h-4 text-[#D6FF00]" />,
  <Trophy key={1} className="w-4 h-4 text-gray-300" />,
  <Star   key={2} className="w-4 h-4 text-amber-500" />,
];

interface CadetEntry {
  rank: number;
  name: string;
  branch: string;
  stdid?: string;
  energy: number;
  level: { name: string; level: number };
  badgeCount?: number;
}

interface PlanetEntry {
  rank: number;
  branch: string;
  energy: number;
  cadets: number;
}

function LevelBadge({ levelName }: { levelName: string }) {
  const cfg = LEVEL_COLORS[levelName as keyof typeof LEVEL_COLORS] ?? LEVEL_COLORS.EXPLORER;
  return (
    <span
      className="text-[7px] font-black tracking-[0.15em] px-2 py-0.5 uppercase"
      style={{
        color: cfg.color,
        border: `1px solid ${cfg.color}40`,
        background: `${cfg.color}12`,
        clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)',
      }}
    >
      {levelName}
    </span>
  );
}

export function CadetLeaderboard({ cadets }: { cadets: CadetEntry[] }) {
  return (
    <div className="space-y-2">
      {cadets.length === 0 && (
        <div className="text-center py-16 text-white/30 text-sm tracking-widest uppercase">
          No cadets yet. Be the first to earn energy!
        </div>
      )}
      {cadets.map((c, idx) => (
        <motion.div
          key={c.rank}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="relative flex items-center gap-3 p-3 group cursor-default"
          style={{
            background: c.rank <= 3 ? 'rgba(214,255,0,0.04)' : 'rgba(255,255,255,0.02)',
            border: c.rank <= 3 ? '1px solid rgba(214,255,0,0.15)' : '1px solid rgba(255,255,255,0.06)',
            clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)',
          }}
        >
          {/* Rank glow for top 3 */}
          {c.rank <= 3 && (
            <div
              className="absolute left-0 top-0 bottom-0 w-[2px]"
              style={{ background: c.rank === 1 ? '#D6FF00' : c.rank === 2 ? '#e2e8f0' : '#f59e0b' }}
            />
          )}

          {/* Rank */}
          <div className="w-8 flex items-center justify-center shrink-0">
            {c.rank <= 3
              ? RANK_ICONS[c.rank - 1]
              : <span className="text-[10px] font-black text-white/30">#{c.rank}</span>
            }
          </div>

          {/* Avatar placeholder */}
          <div
            className="w-8 h-8 rounded flex items-center justify-center shrink-0 text-[10px] font-black"
            style={{
              background: 'rgba(214,255,0,0.08)',
              border: '1px solid rgba(214,255,0,0.15)',
              color: '#D6FF00',
            }}
          >
            {c.name.charAt(0).toUpperCase()}
          </div>

          {/* Name + level */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-white uppercase tracking-wider truncate">{c.name}</span>
              <LevelBadge levelName={c.level.name} />
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[8px] text-white/30 tracking-widest uppercase truncate">{c.branch}</span>
              {c.badgeCount !== undefined && c.badgeCount > 0 && (
                <span className="text-[8px] text-[#D6FF00]/50">{c.badgeCount} badges</span>
              )}
            </div>
          </div>

          {/* Energy */}
          <div className="flex flex-col items-end shrink-0">
            <span className="text-sm font-black text-[#D6FF00]">{c.energy.toLocaleString()}</span>
            <span className="text-[7px] text-white/30 tracking-widest uppercase">NEU</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function PlanetLeaderboard({ planets }: { planets: PlanetEntry[] }) {
  const max = planets[0]?.energy ?? 1;

  return (
    <div className="space-y-3">
      {planets.length === 0 && (
        <div className="text-center py-16 text-white/30 text-sm tracking-widest uppercase">
          No planet data yet.
        </div>
      )}
      {planets.map((p, idx) => (
        <motion.div
          key={p.branch}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.06 }}
          className="space-y-1"
        >
          <div className="flex items-center gap-3">
            <div className="w-6 flex items-center justify-center">
              {p.rank <= 3
                ? RANK_ICONS[p.rank - 1]
                : <span className="text-[9px] font-black text-white/30">#{p.rank}</span>
              }
            </div>
            <Globe className="w-3.5 h-3.5 text-[#D6FF00]/60 shrink-0" />
            <span className="text-[11px] font-black text-white uppercase tracking-wider flex-1 truncate">{p.branch}</span>
            <span className="text-[10px] font-black text-[#D6FF00] shrink-0">{p.energy.toLocaleString()} NEU</span>
            <span className="text-[9px] text-white/30 shrink-0">{p.cadets}c</span>
          </div>
          {/* Energy bar */}
          <div className="ml-9 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(p.energy / max) * 100}%` }}
              transition={{ duration: 1, delay: idx * 0.08, ease: 'easeOut' }}
              style={{ background: `linear-gradient(90deg, #D6FF00 0%, #84cc16 100%)` }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
