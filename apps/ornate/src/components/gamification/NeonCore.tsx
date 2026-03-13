'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import Link from 'next/link';

interface NeonCoreProps {
  totalEnergy: number;
  totalCadets?: number;
  topCadets?: { rank: number; name: string; branch: string; energy: number }[];
  compact?: boolean;
  showLink?: boolean;
}

function useCountUp(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
      else setCount(target);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return count;
}

// Determine core intensity from energy
function getCoreIntensity(energy: number) {
  if (energy >= 100000) return 'peak';
  if (energy >= 50000) return 'high';
  if (energy >= 10000) return 'medium';
  return 'low';
}

export default function NeonCore({ totalEnergy, totalCadets = 0, topCadets = [], compact = false, showLink = true }: NeonCoreProps) {
  const intensity = getCoreIntensity(totalEnergy);
  const displayCount = useCountUp(totalEnergy);

  const glowConfig = {
    low:    { orb: '#1a3a00', ring: '#4a7c00', outer: '#D6FF00', speed: '4s', scale: 0.7 },
    medium: { orb: '#2d5800', ring: '#6aaa00', outer: '#D6FF00', speed: '3s', scale: 0.85 },
    high:   { orb: '#4a8800', ring: '#a3e635', outer: '#D6FF00', speed: '2s', scale: 1.0  },
    peak:   { orb: '#6aba00', ring: '#d4ff00', outer: '#ffffff', speed: '1.5s', scale: 1.15 },
  }[intensity];

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col items-center gap-1.5 pointer-events-auto"
      >
        {/* Mini orb */}
        <div className="relative flex items-center justify-center">
          <div
            className="w-8 h-8 rounded-full animate-pulse"
            style={{
              background: `radial-gradient(circle, ${glowConfig.ring} 0%, ${glowConfig.orb} 60%, transparent 100%)`,
              boxShadow: `0 0 20px ${glowConfig.outer}80, 0 0 40px ${glowConfig.outer}30`,
              animationDuration: glowConfig.speed,
            }}
          />
          <Zap className="absolute w-4 h-4 text-[#D6FF00]" />
        </div>
        {showLink ? (
          <Link
            href="/home/cadet-hub"
            className="flex items-center gap-1 px-3 py-1 bg-[#D6FF00]/10 border border-[#D6FF00]/30 hover:bg-[#D6FF00]/20 transition-all"
            style={{ clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)' }}
          >
            <span className="text-[9px] font-black tracking-[0.25em] text-[#D6FF00] uppercase">
              {displayCount.toLocaleString()} NEU
            </span>
          </Link>
        ) : (
          <span className="text-[9px] font-black tracking-[0.25em] text-[#D6FF00] uppercase">
            {displayCount.toLocaleString()} NEU
          </span>
        )}
        <span className="text-[7px] text-white/30 tracking-widest uppercase font-bold">NEON CORE</span>
      </motion.div>
    );
  }

  // Full display
  return (
    <div className="flex flex-col items-center gap-8 w-full">
      {/* Core orb */}
      <div className="relative flex items-center justify-center select-none">
        {/* Outer ripple rings */}
        {[1, 2, 3].map((ring) => (
          <motion.div
            key={ring}
            className="absolute rounded-full border border-[#D6FF00]/20"
            style={{ width: `${120 + ring * 48}px`, height: `${120 + ring * 48}px` }}
            animate={{
              scale: [1, 1.08, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: parseFloat(glowConfig.speed),
              repeat: Infinity,
              delay: ring * 0.4,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Main orb */}
        <motion.div
          className="relative w-32 h-32 rounded-full flex items-center justify-center"
          animate={{ scale: [1, glowConfig.scale + 0.05, 1] }}
          transition={{ duration: parseFloat(glowConfig.speed), repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background: `radial-gradient(circle at 35% 35%, #ffffff20 0%, ${glowConfig.ring} 30%, ${glowConfig.orb} 65%, #00000060 100%)`,
            boxShadow: `0 0 40px ${glowConfig.outer}60, 0 0 80px ${glowConfig.outer}30, 0 0 120px ${glowConfig.outer}15, inset 0 0 30px ${glowConfig.ring}40`,
          }}
        >
          {/* Inner glow dot */}
          <motion.div
            className="w-8 h-8 rounded-full"
            style={{ background: `radial-gradient(circle, #ffffff 0%, ${glowConfig.ring} 50%, transparent 100%)` }}
            animate={{ opacity: [0.6, 1, 0.6], scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>

        {/* Energy icon overlay */}
        <div className="absolute flex flex-col items-center">
          <Zap className="w-10 h-10 text-[#D6FF00] drop-shadow-[0_0_10px_rgba(214,255,0,0.8)]" />
        </div>
      </div>

      {/* Counter */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-baseline gap-2">
          <span
            className="text-5xl sm:text-6xl font-black text-[#D6FF00] font-orbitron drop-shadow-[0_0_15px_currentColor]"
            style={{ textShadow: `0 0 30px ${glowConfig.outer}80` }}
          >
            {displayCount.toLocaleString()}
          </span>
          <span className="text-xl sm:text-2xl font-black text-[#D6FF00]/80 tracking-widest uppercase drop-shadow-[0_0_8px_currentColor]">NEU</span>
        </div>
        <p className="text-xs sm:text-sm text-white/60 tracking-[0.4em] uppercase font-bold mt-1 drop-shadow-md">Total Neon Energy Generated</p>
        {totalCadets > 0 && (
          <p className="text-[10px] sm:text-xs text-white/50 tracking-widest font-semibold mt-1">
            by <span className="text-[#D6FF00]/90 font-black drop-shadow-[0_0_5px_currentColor]">{totalCadets.toLocaleString()}</span> active cadets
          </p>
        )}
      </div>

      {/* Intensity badge */}
      <div
        className="px-6 py-2 mt-2"
        style={{
          border: `1px solid ${glowConfig.outer}60`,
          background: `${glowConfig.outer}15`,
          clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)',
          boxShadow: `0 0 15px ${glowConfig.outer}40`
        }}
      >
        <span className="text-[10px] sm:text-xs font-black tracking-[0.3em] uppercase drop-shadow-[0_0_8px_currentColor]" style={{ color: glowConfig.outer }}>
          {intensity === 'peak' ? 'UNIVERSE AT PEAK POWER' :
           intensity === 'high' ? 'HIGH ENERGY STATE' :
           intensity === 'medium' ? 'ENERGY BUILDING' : 'CORE AWAKENING'}
        </span>
      </div>

      {/* Top cadets sneak peek */}
      {topCadets.length > 0 && (
        <div className="w-full max-w-sm space-y-2.5 mt-4">
          <p className="text-xs text-white/50 font-bold tracking-[0.3em] uppercase text-center mb-4 drop-shadow-sm">Core Commanders</p>
          {topCadets.map((c, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3" style={{ background: 'rgba(214,255,0,0.06)', border: '1px solid rgba(214,255,0,0.2)', boxShadow: '0 0 10px rgba(214,255,0,0.05)' }}>
              <span className="text-xs font-black text-[#D6FF00]/80 w-5 text-right drop-shadow-[0_0_5px_currentColor]">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-black text-white uppercase truncate drop-shadow-md">{c.name}</p>
                <p className="text-[10px] sm:text-xs text-white/50 tracking-widest truncate mt-0.5">{c.branch}</p>
              </div>
              <span className="text-xs sm:text-sm font-black text-[#D6FF00] shrink-0 drop-shadow-[0_0_8px_currentColor]">{c.energy.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
