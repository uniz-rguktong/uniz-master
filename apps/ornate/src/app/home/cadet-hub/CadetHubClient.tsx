'use client';

import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft, Zap, Users, Trophy, Globe, BarChart3, Award,
  Rocket, Target, Shield, Star, ChevronRight, Clock,
  TrendingUp, Radio, Cpu, Satellite, Crown, Flame,
  CheckCircle2, Circle, Lock, AlertTriangle, Calendar, RefreshCw
} from 'lucide-react';
import SpaceshipNav from '@/components/ui/SpaceshipNav';
import SectorHeader from '@/components/layout/SectorHeader';
import { CADET_LEVELS, getCadetLevel, DEFAULT_BADGES, ENERGY_REWARDS } from '@/lib/gamification-constants';
import type { CadetHubProfile, LeaderboardCadet, NeonStats, PlanetLeaderboardEntry } from '@/types/gamification';

const NeonCore = dynamic(() => import('@/components/gamification/NeonCore'), { ssr: false });
const StarField = dynamic(() => import('@/components/ui/StarField'), { ssr: false });

// ─── Types ───────────────────────────────────────────────────────────────────
interface CadetHubClientProps {
  neonStats: NeonStats;
  leaderboard: LeaderboardCadet[];
  planets: PlanetLeaderboardEntry[];
  myProfile: CadetHubProfile | null;
}

// ─── Helper Components ────────────────────────────────────────────────────────
function SectionHeader({ subtitle, title, icon: Icon }: { subtitle: string; title: string; icon: LucideIcon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="flex flex-col items-center mb-10 md:mb-14"
    >
      <div className="flex items-center gap-4 mb-3">
        <div className="h-px w-16 sm:w-24 bg-gradient-to-r from-transparent to-[#D6FF00]/40" />
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-[#D6FF00]/60" />
          <span className="text-[9px] sm:text-[10px] text-[#D6FF00] tracking-[0.5em] font-black uppercase">{subtitle}</span>
        </div>
        <div className="h-px w-16 sm:w-24 bg-gradient-to-l from-transparent to-[#D6FF00]/40" />
      </div>
      <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-wider sm:tracking-widest text-white uppercase drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]">
        {title}
      </h2>
    </motion.div>
  );
}

function GlassCard({ children, className = '', glowColor = '#D6FF00', style = {} }: { children: React.ReactNode; className?: string; glowColor?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: 'rgba(8,8,18,0.85)',
        border: `1px solid ${glowColor}22`,
        backdropFilter: 'blur(20px)',
        boxShadow: `0 0 30px ${glowColor}08, inset 0 1px 0 ${glowColor}10`,
        ...style,
      }}
    >
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t border-l opacity-60" style={{ borderColor: glowColor }} />
      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r opacity-60" style={{ borderColor: glowColor }} />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l opacity-60" style={{ borderColor: glowColor }} />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r opacity-60" style={{ borderColor: glowColor }} />
      {children}
    </div>
  );
}

const LEVEL_COLORS: Record<string, string> = {
  Explorer: '#94a3b8',
  Navigator: '#22d3ee',
  Commander: '#a78bfa',
  Guardian: '#f59e0b',
  Legend: '#D6FF00',
};

const LEVEL_ICONS: Record<string, LucideIcon> = {
  Explorer: Rocket,
  Navigator: Satellite,
  Commander: Shield,
  Guardian: Crown,
  Legend: Star,
};

const REASON_LABELS: Record<string, string> = {
  REGISTRATION_BONUS: 'Registered Account',
  PROFILE_COMPLETE: 'Completed Profile',
  AVATAR_UPLOAD: 'Uploaded Avatar',
  EVENT_REGISTER: 'Event Registration',
  EVENT_ATTEND: 'Attended Event',
  MISSION_PARTICIPATE: 'Mission Participation',
  MISSION_THIRD: '3rd Place – Mission',
  MISSION_SECOND: '2nd Place – Mission',
  MISSION_FIRST: '1st Place – Mission',
  SPORT_REGISTER: 'Sports Registration',
  SPORT_PARTICIPATE: 'Sports Participation',
  SPORT_THIRD: '3rd Place – Sports',
  SPORT_SECOND: '2nd Place – Sports',
  SPORT_FIRST: '1st Place – Sports',
  WEBSITE_ACTIVITY: 'Platform Activity',
  GAME_SCORE: 'Game Score',
  BADGE_UNLOCK: 'Badge Unlocked',
  SOCIAL_SHARE: 'Social Share',
  INVITE_FRIEND: 'Friend Invited',
  ADMIN_GRANT: 'Admin Grant',
};

const BADGE_ICONS: Record<string, LucideIcon> = {
  Rocket, Globe: Globe, Trophy, Star, Code2: Cpu, Zap, Crown, Share2: Radio,
};

type CadetHubTab = 'overview' | 'missions' | 'badges' | 'leaderboard';

const PLANET_NAMES: Record<string, string> = {
  'CSE': 'Cyberion', 'ECE': 'Volteris', 'EEE': 'Amperia', 'MECH': 'Thermox',
  'CIVIL': 'Terravix', 'MME': 'Metalyx', 'Chemical': 'Chemora', 'Unknown': 'Nebula',
};

function getPlanetName(branch: string) {
  return PLANET_NAMES[branch] || branch || 'Unknown Planet';
}

// Removed static missions.

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CadetHubClient({ neonStats, leaderboard, planets, myProfile }: CadetHubClientProps) {
  const [showAllLeaderboard, setShowAllLeaderboard] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [profile, setProfile] = useState<CadetHubClientProps['myProfile']>(myProfile);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadProfile = async () => {
      try {
        const res = await fetch('/api/me/gamification', { cache: 'no-store' });
        if (!res.ok) return;

        const data = await res.json() as { ok: boolean; profile: CadetHubClientProps['myProfile'] };
        if (isActive && data?.ok) {
          setProfile(data.profile ?? null);
        }
      } catch {
        // Keep default null profile state if request fails.
      }
    };

    loadProfile();

    return () => {
      isActive = false;
    };
  }, []);

  const forceSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await fetch('/api/me/gamification', { method: 'POST', cache: 'no-store' });
      if (res.ok) {
        const data = await res.json() as { ok: boolean; profile: CadetHubClientProps['myProfile'] };
        if (data?.ok) setProfile(data.profile ?? null);
      }
    } catch {
      // ignore
    } finally {
      setIsSyncing(false);
    }
  };

  const [activeTab, setActiveTab] = useState<CadetHubTab>('overview');

  const cadetLevel = profile ? getCadetLevel(profile.totalEnergy) : CADET_LEVELS[0];
  const levelColor = LEVEL_COLORS[cadetLevel.name] ?? '#D6FF00';
  const LevelIcon = LEVEL_ICONS[cadetLevel.name] ?? Rocket;
  const energy = profile?.totalEnergy ?? 0;
  const nextLevel = CADET_LEVELS.find(l => l.level === cadetLevel.level + 1);
  const levelProgress = nextLevel
    ? Math.min(100, Math.round(((energy - cadetLevel.min) / (nextLevel.min - cadetLevel.min)) * 100))
    : 100;

  // Find my planet from leaderboard
  const myPlanetData = planets.length > 0 && leaderboard.length > 0
    ? planets.find(p => leaderboard.find(c => c.stdid && profile)?.branch === p.branch) ?? null
    : null;

  const isLoggedIn = !!profile;

  return (
    <>
      <SpaceshipNav accentColor="#D6FF00" scrollContainerRef={mainRef} />

      <main
        ref={mainRef}
        className="relative w-screen h-screen overflow-x-hidden overflow-y-auto bg-[#030308] text-white font-orbitron"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#D6FF0030 transparent' }}
      >
        {/* Starfield BG (Client-side only to avoid hydration mismatch) */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -20%, #D6FF0008 0%, transparent 60%)' }} />
          <StarField />
        </div>

        {/* Scanline */}
        <div className="pointer-events-none fixed inset-0 z-[100] opacity-[0.02] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(255,255,255,0.1)_50%)] bg-size-[100%_4px]" />

        <SectorHeader 
            showTitle={false}
            accentColor="#D6FF00"
        />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12 pt-16 pb-32">

          {/* ─── Hub Title ─── */}
          <div className="flex flex-col items-center justify-center text-center mb-24 md:mb-32 relative">
            <motion.div
              initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.8, ease: "circOut" }}
              className="relative"
            >
              <div className="flex items-center justify-center gap-3 mb-6">
                <span className="h-[1px] w-12 bg-gradient-to-r from-transparent via-[#D6FF00] to-transparent opacity-50" />
                <span className="text-[#D6FF00] font-mono text-[10px] sm:text-xs tracking-[0.4em] uppercase flex items-center gap-2 font-black">
                   Your Digital Command Center
                </span>
                <span className="h-[1px] w-12 bg-gradient-to-l from-transparent via-[#D6FF00] to-transparent opacity-50" />
              </div>
              <h1 className="text-6xl sm:text-8xl md:text-[9rem] font-black tracking-tighter uppercase leading-[0.85] text-white italic drop-shadow-[0_0_40px_rgba(214,255,0,0.15)] flex flex-col sm:flex-row items-center justify-center gap-x-6">
                CADET <span className="text-[#D6FF00] drop-shadow-[0_0_20px_#D6FF0030]">HUB</span>
              </h1>
              <p className="mt-8 text-white/50 font-medium text-sm sm:text-lg tracking-wide max-w-2xl mx-auto leading-relaxed">
                Welcome to your personal hub within the ORNATE universe. 
                <br className="hidden sm:block" />
                Track your achievements, compete with fellow cadets, and watch your impact grow.
              </p>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-10 flex items-center justify-center"
              >
                <div className="w-px h-16 bg-gradient-to-b from-[#D6FF00] to-transparent opacity-30" />
              </motion.div>
            </motion.div>
          </div>

          {/* ═══════════════════════════════════════════════════════
              SECTION 1 — HERO (Profile + Neon Core)
          ═══════════════════════════════════════════════════════ */}
          <section className="mb-32 md:mb-48">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

              {/* Neon Core Orb */}
              <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}
                className="flex justify-center">
                <NeonCore totalEnergy={neonStats.totalEnergy} totalCadets={neonStats.totalCadets} topCadets={neonStats.topCadets} />
              </motion.div>

              {/* Cadet Identity & Energy Meter */}
              <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.15 }}
                className="flex flex-col gap-4">

                {/* Identity Card */}
                <GlassCard glowColor={levelColor} className="p-6">
                  <div className="flex items-start gap-5">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${levelColor}20, ${levelColor}08)`, border: `2px solid ${levelColor}40`, boxShadow: `0 0 20px ${levelColor}30` }}>
                        <LevelIcon className="w-10 h-10" style={{ color: levelColor }} />
                      </div>
                      {/* Pulse ring */}
                      <div className="absolute inset-0 rounded-full animate-ping opacity-20"
                        style={{ border: `2px solid ${levelColor}`, animationDuration: '2s' }} />
                      {/* Level badge */}
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black"
                        style={{ background: levelColor, color: '#030308' }}>
                        L{cadetLevel.level}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {isLoggedIn ? (
                        <>
                          <p className="text-[10px] sm:text-xs text-white/50 tracking-[0.4em] uppercase mb-1 font-bold">CADET OPERATIVE</p>
                          <h1 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-wide truncate drop-shadow-lg">
                            {profile?.name || 'CADET'}
                          </h1>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Globe className="w-4 h-4" style={{ color: levelColor }} />
                            <span className="text-xs text-white/60 tracking-widest font-semibold uppercase">
                              {getPlanetName(profile?.branch ?? 'Unknown')}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-4">
                            <div className="px-4 py-1.5 text-xs font-black tracking-widest uppercase rounded-sm drop-shadow-[0_0_8px_currentColor]"
                              style={{ background: `${levelColor}20`, border: `1px solid ${levelColor}50`, color: levelColor }}>
                              {cadetLevel.name}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold drop-shadow-[0_0_8px_currentColor]" style={{ color: levelColor }}>
                              <Zap className="w-4 h-4" /> {energy.toLocaleString()} NEU
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-[10px] sm:text-xs text-white/50 tracking-[0.4em] uppercase mb-1 font-bold">UNIDENTIFIED</p>
                          <h1 className="text-2xl sm:text-4xl font-black text-white/40 uppercase tracking-wide drop-shadow-md">ANONYMOUS CADET</h1>
                          <p className="text-xs text-white/50 mt-2.5 tracking-wider font-medium">
                            <Link href="/home/profile" className="text-[#D6FF00] hover:underline font-bold drop-shadow-[0_0_5px_currentColor]">Sign in</Link> to view your cadet profile
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </GlassCard>

                {/* Energy Contribution Meter */}
                <GlassCard glowColor={levelColor} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <Zap className="w-5 h-5 drop-shadow-[0_0_8px_currentColor]" style={{ color: levelColor }} />
                      <span className="text-xs sm:text-sm font-black tracking-[0.3em] uppercase text-white/80 drop-shadow-md">NEON ENERGY CONTRIBUTION</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {nextLevel && (
                        <span className="text-[10px] sm:text-xs text-white/50 tracking-widest uppercase font-semibold">Next: {nextLevel.name}</span>
                      )}
                      {isLoggedIn && (
                        <button
                          onClick={forceSync}
                          disabled={isSyncing}
                          title="Sync energy now"
                          className="flex items-center gap-1 px-2 py-1 text-[9px] font-black tracking-widest uppercase transition-all disabled:opacity-40"
                          style={{ background: `${levelColor}15`, border: `1px solid ${levelColor}40`, color: levelColor }}
                        >
                          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                          {isSyncing ? 'SYNCING' : 'SYNC'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Big energy display */}
                  <div className="text-center mb-6 mt-2">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 1, delay: 0.3 }}
                      className="text-6xl sm:text-7xl font-black drop-shadow-[0_0_20px_currentColor]" style={{ color: levelColor }}
                    >
                      {energy.toLocaleString()}
                    </motion.div>
                    <div className="text-xs sm:text-sm text-white/40 tracking-[0.4em] uppercase mt-2 font-bold drop-shadow-md">NEON ENERGY UNITS</div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] sm:text-xs text-white/50 tracking-widest font-semibold">
                      <span className="drop-shadow-sm">{cadetLevel.name} · {energy} NEU</span>
                      <span className="drop-shadow-sm">{nextLevel ? `${nextLevel.min} NEU → ${nextLevel.name}` : 'MAXIMUM LEVEL'}</span>
                    </div>
                    <div className="relative h-4 bg-white/10 overflow-hidden"
                      style={{ clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)' }}>
                      <motion.div
                        className="absolute inset-y-0 left-0 h-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${levelProgress}%` }}
                        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
                        style={{ background: `linear-gradient(90deg, ${levelColor}50, ${levelColor})`, boxShadow: `0 0 15px ${levelColor}` }}
                      />
                      {/* Shimmer */}
                      <motion.div
                        className="absolute inset-y-0 w-12 opacity-50"
                        animate={{ left: ['-10%', '110%'] }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                        style={{ background: `linear-gradient(90deg, transparent, white, transparent)` }}
                      />
                    </div>
                    <div className="text-center text-[10px] sm:text-xs font-black tracking-[0.2em] mt-1.5 drop-shadow-[0_0_8px_currentColor]" style={{ color: levelColor }}>
                      {levelProgress}% TO {nextLevel?.name ?? 'MAXED'}
                    </div>
                  </div>

                  {/* Level ladder mini */}
                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/10">
                    {CADET_LEVELS.map((l) => {
                      const col = LEVEL_COLORS[l.name];
                      const isActive = l.level === cadetLevel.level;
                      const isUnlocked = l.level <= cadetLevel.level;
                      return (
                        <div key={l.name} className="flex flex-col items-center gap-1.5 flex-1 px-0.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-[#0d0d15]"
                            style={{
                              border: `1.5px solid ${isActive ? col : isUnlocked ? `${col}40` : 'rgba(255,255,255,0.08)'}`,
                              boxShadow: isActive ? `0 0 15px ${col}40` : 'none',
                            }}>
                            {isUnlocked
                              ? <CheckCircle2 className="w-4 h-4" style={{ color: col }} />
                              : <Lock className="w-3 h-3 text-white/10" />
                            }
                          </div>
                          <span className="text-[7px] sm:text-[9px] font-black tracking-wider sm:tracking-widest uppercase transition-colors text-center" 
                            style={{ color: isActive ? col : isUnlocked ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)' }}>
                            {l.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </GlassCard>

                {/* Quick Global Stats */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Global Rank', value: profile?.rank ? `#${profile.rank}` : '—', icon: Trophy, color: '#f59e0b' },
                    { label: 'Total Cadets', value: neonStats.totalCadets.toLocaleString(), icon: Users, color: '#22d3ee' },
                    { label: 'Badges Earned', value: profile?.badgeIds?.length ?? 0, icon: Award, color: '#a78bfa' },
                  ].map(stat => (
                    <GlassCard key={stat.label} glowColor={stat.color} className="p-3.5 text-center">
                      <stat.icon className="w-5 h-5 mx-auto mb-1.5" style={{ color: stat.color }} />
                      <div className="text-xl font-black text-white mb-0.5">{stat.value}</div>
                      <div className="text-[10px] text-white/70 tracking-[0.2em] font-black uppercase drop-shadow-sm">{stat.label}</div>
                    </GlassCard>
                  ))}
                </div>
              </motion.div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════
              TAB NAV
          ═══════════════════════════════════════════════════════ */}
          <div className="flex gap-1 mb-14 p-1 overflow-x-auto" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {([
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'missions', label: 'Missions', icon: Target },
              { id: 'badges', label: 'Badges', icon: Award },
              { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
            ] as Array<{ id: CadetHubTab; label: string; icon: LucideIcon }>).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-[9px] sm:text-[10px] font-black tracking-[0.3em] uppercase transition-all whitespace-nowrap"
                style={{
                  background: activeTab === tab.id ? '#D6FF00' : 'transparent',
                  color: activeTab === tab.id ? '#030308' : 'rgba(255,255,255,0.4)',
                }}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ═══════════════════════════════════════════════════════
              TAB: OVERVIEW
          ═══════════════════════════════════════════════════════ */}
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-20">

                {/* Energy Timeline */}
                <section>
                  <SectionHeader subtitle="Activity Log" title="ENERGY TIMELINE" icon={Clock} />
                  <div className="max-w-3xl mx-auto">
                    <GlassCard className="p-6 sm:p-8">
                      {!isLoggedIn ? (
                        <div className="text-center py-10">
                          <AlertTriangle className="w-8 h-8 text-yellow-500/50 mx-auto mb-3" />
                          <p className="text-white/30 text-xs tracking-widest">
                            <Link href="/home/profile" className="text-[#D6FF00]">Sign in</Link> to view your energy history
                          </p>
                        </div>
                      ) : profile?.transactions?.length === 0 ? (
                        <div className="text-center py-10">
                          <Zap className="w-8 h-8 text-[#D6FF00]/20 mx-auto mb-3" />
                          <p className="text-white/20 text-xs tracking-widest uppercase">No transactions yet. Start earning energy!</p>
                        </div>
                      ) : (
                        <div className="relative">
                          {/* Timeline line */}
                          <div className="absolute left-5 top-0 bottom-0 w-px" style={{ background: 'linear-gradient(to bottom, #D6FF0040, transparent)' }} />

                          <div className="space-y-4">
                            {(profile?.transactions ?? []).map((tx, i) => (
                              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                                className="flex items-start gap-4 pl-12 relative">
                                {/* Node */}
                                <div className="absolute left-3 top-1 w-4 h-4 rounded-full flex items-center justify-center"
                                  style={{ background: '#D6FF0020', border: '1px solid #D6FF0060' }}>
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#D6FF00]" />
                                </div>
                                <div className="flex-1 flex items-center justify-between p-4"
                                  style={{ background: 'rgba(214,255,0,0.06)', border: '1px solid rgba(214,255,0,0.15)', boxShadow: '0 0 10px rgba(214,255,0,0.05)' }}>
                                  <div>
                                    <p className="text-sm sm:text-base font-black text-white uppercase tracking-wider drop-shadow-md">{REASON_LABELS[tx.reason] ?? tx.reason}</p>
                                    {tx.description && (
                                      <p className="text-[10px] sm:text-xs text-[#D6FF00]/60 tracking-wide font-semibold mt-1 normal-case">{tx.description}</p>
                                    )}
                                    <p className="text-[9px] sm:text-[10px] text-white/40 mt-1.5 uppercase tracking-widest font-bold">
                                      {isMounted ? new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '...'}
                                    </p>
                                  </div>
                                  <div className="shrink-0 ml-4 text-xl font-black drop-shadow-[0_0_8px_currentColor]" style={{ color: '#D6FF00' }}>
                                    +{tx.amount}
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </GlassCard>
                  </div>
                </section>

                {/* Planet Rankings */}
                <section>
                  <SectionHeader subtitle="Branch Competition" title="PLANET RANKINGS" icon={Globe} />
                  <div className="max-w-3xl mx-auto space-y-3">
                    {planets.length === 0 ? (
                      <GlassCard className="p-8 text-center">
                        <p className="text-white/20 text-xs tracking-widest uppercase">No planet data yet. Earn energy to put your planet on the map!</p>
                      </GlassCard>
                    ) : planets.slice(0, 8).map((planet, i) => {
                      const maxE = planets[0]?.energy || 1;
                      const pct = Math.round((planet.energy / maxE) * 100);
                      const colors = ['#D6FF00', '#22d3ee', '#a78bfa', '#f59e0b', '#f43f5e', '#34d399', '#fb923c', '#94a3b8'];
                      const col = colors[i % colors.length];
                      return (
                        <motion.div key={planet.branch} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                          <GlassCard glowColor={col} className="p-4 sm:p-5">
                            <div className="flex items-center gap-5 sm:gap-6">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 flex items-center justify-center font-black text-base sm:text-lg rounded-sm drop-shadow-[0_0_5px_currentColor]"
                                style={{ background: `${col}15`, border: `1px solid ${col}40`, color: col }}>
                                #{planet.rank}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                                  <div>
                                    <span className="text-sm sm:text-base font-black text-white uppercase tracking-wider drop-shadow-md">{getPlanetName(planet.branch)}</span>
                                    <span className="text-[10px] sm:text-xs text-white/50 font-bold ml-2 tracking-widest">{planet.branch}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black drop-shadow-[0_0_8px_currentColor] mt-1 sm:mt-0" style={{ color: col }}>
                                    <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {planet.energy.toLocaleString()} NEU
                                  </div>
                                </div>
                                <div className="h-1.5 bg-white/10 overflow-hidden"
                                  style={{ clipPath: 'polygon(2px 0, 100% 0, calc(100% - 2px) 100%, 0 100%)' }}>
                                  <motion.div
                                    className="h-full"
                                    initial={{ width: 0 }}
                                    whileInView={{ width: `${pct}%` }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 1, delay: i * 0.08 }}
                                    style={{ background: col, boxShadow: `0 0 10px ${col}80` }}
                                  />
                                </div>
                              </div>
                              <div className="text-[10px] sm:text-xs text-white/50 tracking-widest font-bold uppercase shrink-0 text-right">
                                {planet.cadets.toLocaleString()} <span className="hidden sm:inline">cadets</span>
                              </div>
                            </div>
                          </GlassCard>
                        </motion.div>
                      );
                    })}
                  </div>
                </section>

              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════════
                TAB: MISSIONS
            ═══════════════════════════════════════════════════════ */}
            {activeTab === 'missions' && (
              <motion.div key="missions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-20">

                {/* Registered Events */}
                <section>
                  <SectionHeader subtitle="Your History" title="REGISTERED EVENTS" icon={Calendar} />
                  {(profile?.recentMissions ?? []).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {profile?.recentMissions.map((mission, i) => {
                        const isAttended = mission.status === 'ATTENDED';
                        const cardColor = isAttended ? '#D6FF00' : '#22d3ee';
                        return (
                          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                            <GlassCard glowColor={cardColor} className="p-5 flex flex-col h-full group">
                              <div className="flex items-start justify-between mb-4">
                                <div className="w-10 h-10 flex items-center justify-center rounded-sm"
                                  style={{ background: `${cardColor}15`, border: `1px solid ${cardColor}30` }}>
                                  <Calendar className="w-5 h-5" style={{ color: cardColor }} />
                                </div>
                                <span className="text-[9px] sm:text-[10px] px-2.5 py-1 font-black tracking-widest rounded-sm"
                                  style={{ background: `${cardColor}15`, color: cardColor, border: `1px solid ${cardColor}40` }}>
                                  {mission.category}
                                </span>
                              </div>
                              <h3 className="text-base font-black text-white uppercase tracking-wider mb-2 drop-shadow-md">{mission.title}</h3>
                              <p className="text-xs text-white/40 font-semibold tracking-wider mb-6">
                                {isMounted ? new Date(mission.date).toLocaleDateString() : '...'}
                              </p>
                              
                              <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
                                <div className="flex items-center gap-1.5 text-xs font-black" style={{ color: cardColor }}>
                                  <Zap className="w-4 h-4" /> {mission.energy > 0 ? `+${mission.energy} NEU` : '0 NEU'}
                                </div>
                                <div className="text-[10px] font-black tracking-widest uppercase" style={{ color: cardColor }}>
                                  {mission.status}
                                </div>
                              </div>
                            </GlassCard>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-20 text-center border border-white/5 rounded-lg bg-white/[0.02]">
                      <Calendar className="w-12 h-12 text-white/20 mx-auto mb-4" />
                      <h3 className="text-lg font-black text-white/60 tracking-widest uppercase">No Events Found</h3>
                      <p className="text-sm text-white/30 tracking-wider mt-2">Check back later when you register for events.</p>
                    </div>
                  )}
                </section>

                {/* Cadet Stats Panel */}
                <section>
                  <SectionHeader subtitle="Performance" title="CADET STATS" icon={TrendingUp} />
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-w-4xl mx-auto">
                    {[
                      { label: 'Missions', value: isLoggedIn ? (profile?.stats.missions ?? 0) : 0, color: '#D6FF00', icon: Target },
                      { label: 'Events', value: isLoggedIn ? (profile?.stats.events ?? 0) : 0, color: '#22d3ee', icon: Star },
                      { label: 'Games Played', value: isLoggedIn ? (profile?.stats.gamesPlayed ?? 0) : 0, color: '#a78bfa', icon: Cpu },
                      { label: 'Badges', value: profile?.badgeIds?.length ?? 0, color: '#f59e0b', icon: Award },
                      { label: 'Energy', value: `${energy} NEU`, color: levelColor, icon: Zap },
                    ].map((stat, i) => (
                      <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}>
                        <GlassCard glowColor={stat.color} className="p-4 text-center">
                          {/* Circular stat widget */}
                          <div className="relative w-14 h-14 mx-auto mb-3">
                            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                              <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                              <circle cx="28" cy="28" r="22" fill="none" stroke={stat.color} strokeWidth="3"
                                strokeDasharray={`${2 * Math.PI * 22}`}
                                strokeDashoffset={`${2 * Math.PI * 22 * 0.7}`}
                                strokeLinecap="round" opacity="0.6" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                            </div>
                          </div>
                          <div className="text-lg sm:text-xl font-black text-white drop-shadow-md">{stat.value}</div>
                          <div className="text-[9px] sm:text-[10px] text-white/50 tracking-[0.2em] font-bold uppercase mt-1 drop-shadow-sm">{stat.label}</div>
                        </GlassCard>
                      </motion.div>
                    ))}
                  </div>
                </section>

              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════════
                TAB: BADGES
            ═══════════════════════════════════════════════════════ */}
            {activeTab === 'badges' && (
              <motion.div key="badges" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <SectionHeader subtitle="Collectibles" title="ACHIEVEMENT BADGES" icon={Award} />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {DEFAULT_BADGES.map((badge, i) => {
                    const isEarned = profile?.badgeIds?.includes(badge.id) ?? false;
                    const catColors: Record<string, string> = {
                      mission: '#D6FF00', website: '#22d3ee', sports: '#f59e0b',
                      energy: '#a78bfa', special: '#f43f5e', social: '#34d399',
                    };
                    const col = catColors[badge.category] ?? '#D6FF00';
                    const BadgeIcon = BADGE_ICONS[badge.icon] ?? Star;

                    return (
                      <motion.div key={badge.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}>
                        <GlassCard glowColor={isEarned ? col : 'rgba(255,255,255,0.1)'} className="p-6 md:p-8 text-center relative group min-h-[220px] flex flex-col items-center justify-center">
                          {!isEarned && (
                            <div className="absolute inset-0 bg-black/60 flex items-end justify-center pb-4 z-10 backdrop-blur-[2px] rounded-[inherit] transition-all group-hover:bg-black/40">
                              <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] md:text-xs font-black tracking-widest uppercase"
                                style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)', borderRadius: '6px' }}>
                                <Lock className="w-3 h-3 md:w-4 md:h-4" /> LOCKED
                              </div>
                            </div>
                          )}

                          {/* Glow bg */}
                          {isEarned && (
                            <div className="absolute inset-0 opacity-15" style={{ background: `radial-gradient(circle, #FFD700, transparent 70%)` }} />
                          )}

                          {/* Icon */}
                          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full mx-auto mb-5 flex items-center justify-center relative transition-transform group-hover:scale-105"
                            style={{
                              background: isEarned ? `${col}20` : 'rgba(255,255,255,0.03)',
                              border: `2px solid ${isEarned ? col : 'rgba(255,255,255,0.08)'}`,
                              boxShadow: isEarned ? `0 0 25px ${col}50` : 'none',
                            }}>
                            <BadgeIcon className="w-8 h-8 md:w-10 md:h-10 transition-colors" style={{ color: isEarned ? col : 'rgba(255,255,255,0.2)' }} />
                          </div>

                          <h3 className="text-sm md:text-base font-black uppercase tracking-wider mb-2"
                            style={{ color: isEarned ? col : 'rgba(255,255,255,0.3)', textShadow: isEarned ? `0 0 10px ${col}80` : 'none' }}>
                            {badge.name}
                          </h3>
                          <p className="text-xs md:text-sm text-white/40 leading-relaxed font-semibold">{badge.description}</p>
                          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs md:text-sm font-black"
                            style={{ color: isEarned ? col : 'rgba(255,255,255,0.2)' }}>
                            <Zap className="w-3 h-3 md:w-4 md:h-4" /> +{badge.bonusEnergy} NEU
                          </div>

                          {isEarned && (
                            <div className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center shadow-[0_0_15px_currentColor]"
                              style={{ background: col, color: col }}>
                              <CheckCircle2 className="w-4 h-4 text-black" />
                            </div>
                          )}
                        </GlassCard>
                      </motion.div>
                    );
                  })}
                </div>

                <p className="text-center text-[9px] text-white/20 tracking-widest mt-8 uppercase">
                  {isLoggedIn
                    ? `You have earned ${profile?.badgeIds?.length ?? 0} of ${DEFAULT_BADGES.length} badges`
                    : 'Sign in and earn energy to unlock badges. Each badge awards bonus NEU.'}
                </p>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════════
                TAB: LEADERBOARD
            ═══════════════════════════════════════════════════════ */}
            {activeTab === 'leaderboard' && (
              <motion.div key="leaderboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative">

                {/* ── CINEMATIC HEADER ── */}
                <div className="relative text-center mb-16 overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse 60% 80% at 50% 0%, rgba(255,215,0,0.07), transparent 70%)' }} />
                  <div className="absolute top-1/2 left-0 right-0 h-px pointer-events-none"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.3) 20%, rgba(255,215,0,0.3) 80%, transparent)' }} />
                  <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    <p className="text-[9px] tracking-[0.6em] text-white/30 uppercase mb-3">Season 01 · Live Rankings</p>
                    <h2 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight"
                      style={{ background: 'linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.5) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      LEADERBOARD
                    </h2>
                    <p className="text-[10px] tracking-[0.4em] uppercase mt-2" style={{ color: '#FFD700', opacity: 0.6 }}>
                      ◆ TOP {leaderboard.length} CADETS RANKED ◆
                    </p>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="flex justify-center gap-8 mt-6">
                    {[
                      { label: 'TOTAL CADETS', value: neonStats.totalCadets },
                      { label: 'ENERGY POOL', value: `${(neonStats.totalEnergy / 1000).toFixed(1)}K` },
                      { label: 'RANKED', value: leaderboard.length },
                    ].map(s => (
                      <div key={s.label} className="flex flex-col items-center gap-1">
                        <span className="text-base sm:text-xl font-black text-white">{s.value}</span>
                        <span className="text-[7px] tracking-[0.3em] text-white/25 uppercase">{s.label}</span>
                      </div>
                    ))}
                  </motion.div>
                </div>

                {/* ── MY RANK BANNER ── */}
                {profile?.rank && (
                  <motion.div initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }} className="max-w-4xl mx-auto mb-12">
                    <div className="relative overflow-hidden" style={{
                      background: `linear-gradient(135deg, ${levelColor}12, ${levelColor}04)`,
                      border: `1px solid ${levelColor}40`,
                      boxShadow: `0 0 40px ${levelColor}15, inset 0 1px 0 ${levelColor}20`,
                    }}>
                      {['top-0 left-0 border-t border-l', 'top-0 right-0 border-t border-r', 'bottom-0 left-0 border-b border-l', 'bottom-0 right-0 border-b border-r'].map((cls, i) => (
                        <div key={i} className={`absolute w-3 h-3 ${cls}`} style={{ borderColor: levelColor }} />
                      ))}
                      <motion.div className="absolute inset-y-0 w-[2px] pointer-events-none"
                        style={{ background: `linear-gradient(to bottom, transparent, ${levelColor}, transparent)` }}
                        animate={{ left: ['-1%', '101%'] }} transition={{ repeat: Infinity, duration: 4, ease: 'linear' }} />
                      <div className="flex items-center gap-5 px-6 py-4">
                        <div className="relative shrink-0">
                          <div className="w-14 h-14 flex items-center justify-center font-black text-lg"
                            style={{
                              background: `conic-gradient(from 0deg, ${levelColor}40, ${levelColor}10, ${levelColor}40)`,
                              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                              color: levelColor,
                            }}>
                            #{profile.rank}
                          </div>
                          <motion.div className="absolute inset-0"
                            style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', border: `1px solid ${levelColor}`, opacity: 0.3 }}
                            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 sm:mb-3">
                            <span className="text-base sm:text-lg font-black text-white uppercase tracking-wider drop-shadow-lg">YOUR CURRENT RANK</span>
                            <span className="text-[9px] sm:text-[10px] px-2.5 py-1 rounded font-black tracking-[0.3em] animate-pulse"
                              style={{ background: `${levelColor}25`, color: levelColor, border: `1px solid ${levelColor}50`, textShadow: `0 0 10px ${levelColor}` }}>● LIVE</span>
                          </div>
                          <div className="relative h-2.5 sm:h-3 bg-white/10 overflow-hidden" style={{ clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)' }}>
                            <motion.div className="absolute inset-y-0 left-0 h-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.max(5, 100 - (profile.rank / neonStats.totalCadets * 100))}%` }}
                              transition={{ duration: 2, ease: 'easeOut' }}
                              style={{ background: `linear-gradient(90deg, ${levelColor}60, ${levelColor})`, boxShadow: `0 0 15px ${levelColor}` }} />
                            <motion.div className="absolute inset-y-0 w-8 opacity-60"
                              animate={{ left: ['-10%', '110%'] }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                              style={{ background: 'linear-gradient(90deg, transparent, white, transparent)' }} />
                          </div>
                          <div className="flex justify-between mt-2 pt-1 font-semibold">
                            <span className="text-xs text-white/70 drop-shadow-md">Top {Math.round(100 - (profile.rank / neonStats.totalCadets * 100))}% of cadets</span>
                            <span className="text-xs font-black tracking-widest uppercase drop-shadow-[0_0_8px_currentColor]" style={{ color: levelColor }}>{cadetLevel.name}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 flex flex-col justify-center">
                          <div className="text-3xl sm:text-4xl font-black drop-shadow-[0_0_15px_currentColor]" style={{ color: levelColor }}>{energy.toLocaleString()}</div>
                          <div className="text-[10px] sm:text-xs font-bold tracking-[0.3em] text-white/70 uppercase mt-1">Neon Energy</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ══ EPIC TOP 3 PODIUM ══ */}
                {leaderboard.length >= 3 && (() => {
                  const GOLD = '#FFD700';
                  const SILVER = '#C0C0C0';
                  const BRONZE = '#CD7F32';
                  const podiumData = [
                    { cadet: leaderboard[1], color: SILVER, rank: 2, height: 'h-32 sm:h-44', delay: 0.2,  medal: '🥈', labelSize: 'text-base sm:text-lg',          avatarSize: 'w-20 h-20 sm:w-24 sm:h-24',   borderW: 3, label: 'SILVER' },
                    { cadet: leaderboard[0], color: GOLD,   rank: 1, height: 'h-44 sm:h-60', delay: 0.05, medal: '🥇', labelSize: 'text-xl sm:text-2xl', avatarSize: 'w-28 h-28 sm:w-36 sm:h-36', borderW: 4, label: 'GOLD'   },
                    { cadet: leaderboard[2], color: BRONZE, rank: 3, height: 'h-24 sm:h-36', delay: 0.35, medal: '🥉', labelSize: 'text-sm sm:text-base',   avatarSize: 'w-16 h-16 sm:w-20 sm:h-20', borderW: 3, label: 'BRONZE' },
                  ];
                  return (
                    <div className="relative mb-20">
                      {/* Scene glows */}
                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-72 h-72 rounded-full blur-3xl opacity-15"
                          style={{ background: 'radial-gradient(circle, #FFD700, transparent)' }} />
                        <div className="absolute left-1/4 bottom-0 w-36 h-36 rounded-full blur-2xl opacity-10"
                          style={{ background: 'radial-gradient(circle, #C0C0C0, transparent)' }} />
                        <div className="absolute right-1/4 bottom-0 w-36 h-36 rounded-full blur-2xl opacity-10"
                          style={{ background: 'radial-gradient(circle, #CD7F32, transparent)' }} />
                        {[...Array(14)].map((_, i) => (
                          <motion.div key={i} className="absolute w-1 h-1 rounded-full"
                            style={{ left: `${8 + i * 6.5}%`, bottom: `${25 + (i % 4) * 12}%`, background: i % 3 === 0 ? GOLD : i % 3 === 1 ? SILVER : BRONZE, opacity: 0.4 }}
                            animate={{ y: [0, -(15 + (i % 3) * 12), 0], opacity: [0.4, 0.9, 0.4] }}
                            transition={{ repeat: Infinity, duration: 1.8 + (i % 3) * 0.8, delay: i * 0.18 }} />
                        ))}
                      </div>

                      <div className="relative flex justify-center items-end gap-2 sm:gap-4 px-2">
                        {podiumData.map((p, pIdx) => {
                          const isFirst = p.rank === 1;
                          return (
                            <motion.div key={p.rank}
                              initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: p.delay, duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                              className="flex flex-col items-center flex-1 max-w-[130px] sm:max-w-[220px]">

                              {/* Floating medal / crown */}
                              <motion.div className="mb-3 select-none"
                                animate={{ y: [0, isFirst ? -8 : -5, 0] }}
                                transition={{ repeat: Infinity, duration: isFirst ? 2 : 2.5 + pIdx * 0.3 }}>
                                {isFirst ? (
                                  <Crown className="w-8 h-8 sm:w-10 sm:h-10"
                                    style={{ color: '#FFD700', filter: 'drop-shadow(0 0 20px #FFD70099)' }} />
                                ) : (
                                  <span className={`${pIdx === 0 ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'}`}
                                    style={{ filter: `drop-shadow(0 0 10px ${p.color}80)` }}>
                                    {p.medal}
                                  </span>
                                )}
                              </motion.div>

                              {/* Rank badge */}
                              <div className="mb-4 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-black text-sm sm:text-base"
                                style={{
                                  background: `linear-gradient(135deg, ${p.color}, ${p.color}80)`,
                                  color: '#030308',
                                  boxShadow: `0 0 20px ${p.color}80`,
                                }}>
                                #{p.rank}
                              </div>

                              {/* Name info */}
                              <div className="text-center w-full mb-4 px-1">
                                <div className={`font-black uppercase tracking-tight truncate drop-shadow-lg ${p.labelSize}`}
                                  style={{ color: isFirst ? p.color : 'white' }}>
                                  {p.cadet.name}
                                </div>
                                <div className="text-[10px] sm:text-xs text-white/60 font-semibold tracking-widest truncate mt-1 drop-shadow-md">{p.cadet.branch}</div>
                                <div className={`font-black mt-2.5 flex items-center justify-center gap-1.5 ${isFirst ? 'text-2xl' : 'text-lg'} drop-shadow-[0_0_10px_currentColor]`} style={{ color: p.color }}>
                                  <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                                  <span>{p.cadet.energy.toLocaleString()}</span>
                                  <span className="text-[10px] sm:text-xs text-white/60 font-bold ml-0.5">NEU</span>
                                </div>
                              </div>

                              {/* Podium stage */}
                              <div className={`w-full ${p.height} relative overflow-hidden`}
                                style={{
                                  background: `linear-gradient(to top, ${p.color}25 0%, ${p.color}08 60%, transparent 100%)`,
                                  borderTop: `${isFirst ? 3 : 2}px solid ${p.color}`,
                                  borderLeft: `1px solid ${p.color}25`,
                                  borderRight: `1px solid ${p.color}25`,
                                }}>
                                <div className="absolute top-3 sm:top-4 inset-x-0 flex items-center justify-center drop-shadow-[0_0_10px_currentColor] z-10 w-full px-1">
                                  <span className="text-[10px] sm:text-xs font-black tracking-[0.3em] uppercase opacity-90" style={{ color: p.color }}>{p.label}</span>
                                </div>
                                <div className="absolute bottom-2 inset-x-0 flex items-center justify-center select-none">
                                  <span className="font-black opacity-[0.06]" style={{ color: p.color, fontSize: isFirst ? '80px' : '60px', lineHeight: 1 }}>
                                    {p.rank}
                                  </span>
                                </div>
                                <motion.div className="absolute top-0 bottom-0 w-6 pointer-events-none"
                                  animate={{ left: ['-10%', '120%'] }}
                                  transition={{ repeat: Infinity, duration: 2.5, delay: pIdx, ease: 'easeInOut' }}
                                  style={{ background: `linear-gradient(90deg, transparent, ${p.color}30, transparent)`, opacity: 0.6 }} />
                                <div className="absolute bottom-0 inset-x-0 h-px"
                                  style={{ background: `linear-gradient(90deg, transparent, ${p.color}60, transparent)` }} />
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* ══ HOLOGRAPHIC RANK TABLE ══ */}
                {leaderboard.length === 0 ? (
                  <div className="relative max-w-4xl mx-auto p-16 text-center overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-10" />
                    <p className="text-white/20 text-xs tracking-[0.4em] uppercase">No cadets ranked yet. Start earning energy!</p>
                  </div>
                ) : (
                  <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-[44px_1fr_90px_90px] sm:grid-cols-[56px_1fr_140px_110px] gap-2 px-5 py-2 mb-1"
                      style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <div className="text-[7px] font-black tracking-[0.4em] text-white/20 uppercase">RNK</div>
                      <div className="text-[7px] font-black tracking-[0.4em] text-white/20 uppercase">CADET ID</div>
                      <div className="text-[7px] font-black tracking-[0.4em] text-white/20 uppercase hidden sm:block">BRANCH</div>
                      <div className="text-[7px] font-black tracking-[0.4em] text-white/20 uppercase text-right">NEU</div>
                    </div>

                    <div className="relative space-y-px">
                      <div className="absolute left-0 top-0 bottom-0 w-px"
                        style={{ background: 'linear-gradient(to bottom, rgba(255,215,0,0.3), transparent)' }} />

                      {leaderboard.slice(leaderboard.length >= 3 ? 3 : 0, showAllLeaderboard ? leaderboard.length : 10).map((cadet, offsetIdx) => {
                        const LvlIcon = LEVEL_ICONS[cadet.level?.name] ?? Rocket;
                        const lvlCol = LEVEL_COLORS[cadet.level?.name] ?? '#94a3b8';
                        const maxE = leaderboard[0]?.energy || 1;
                        const pct = Math.round((cadet.energy / maxE) * 100);
                        const isMyRank = profile?.rank === cadet.rank;

                        return (
                          <motion.div key={cadet.rank}
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: Math.min(offsetIdx * 0.04, 0.5), ease: 'easeOut' }}
                            className="group relative overflow-hidden cursor-default">
                            <div className="absolute inset-0 transition-opacity duration-200 opacity-0 group-hover:opacity-100"
                              style={{ background: `linear-gradient(90deg, ${lvlCol}08, transparent)` }} />
                            {isMyRank && (
                              <div className="absolute inset-0"
                                style={{ background: `${lvlCol}06`, border: `1px solid ${lvlCol}25` }} />
                            )}

                            <div className="grid grid-cols-[44px_1fr_90px_90px] sm:grid-cols-[56px_1fr_140px_110px] gap-2 items-center px-5 py-3 relative">
                              <motion.div className="absolute left-0 top-0 bottom-0 w-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                style={{ background: `linear-gradient(to bottom, transparent, ${lvlCol}, transparent)` }} />

                              {/* Rank */}
                              <div className="flex items-center justify-center">
                                <div className="w-9 h-9 flex items-center justify-center font-black text-xs"
                                  style={{
                                    background: `linear-gradient(135deg, ${lvlCol}12, transparent)`,
                                    border: `1px solid ${lvlCol}30`,
                                    color: isMyRank ? lvlCol : 'rgba(255,255,255,0.3)',
                                    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                  }}>
                                  {cadet.rank}
                                </div>
                              </div>

                              {/* Cadet */}
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                                    style={{ background: `${lvlCol}15`, border: `1px solid ${lvlCol}30`, boxShadow: `0 0 8px ${lvlCol}20` }}>
                                    <LvlIcon className="w-3.5 h-3.5" style={{ color: lvlCol }} />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs font-black text-white uppercase truncate leading-none">{cadet.name}</span>
                                      {isMyRank && (
                                        <span className="text-[6px] px-1.5 py-0.5 font-black shrink-0 tracking-wider"
                                          style={{ background: `${lvlCol}25`, color: lvlCol, border: `1px solid ${lvlCol}50` }}>YOU</span>
                                      )}
                                    </div>
                                    <span className="text-[8px] text-white/20 tracking-widest">{cadet.level?.name ?? 'EXPLORER'}</span>
                                  </div>
                                </div>
                                <div className="h-px bg-white/5 overflow-hidden">
                                  <motion.div className="h-full"
                                    initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                    transition={{ duration: 1.5, delay: 0.1 + offsetIdx * 0.03, ease: 'easeOut' }}
                                    style={{ background: `linear-gradient(90deg, ${lvlCol}40, ${lvlCol})` }} />
                                </div>
                              </div>

                              {/* Branch */}
                              <div className="text-[8px] text-white/20 tracking-widest hidden sm:block truncate">{cadet.branch ?? '—'}</div>

                              {/* Energy */}
                              <div className="text-right">
                                <div className="text-sm font-black leading-none"
                                  style={{ color: isMyRank ? lvlCol : 'rgba(255,255,255,0.6)' }}>
                                  {cadet.energy.toLocaleString()}
                                </div>
                                <div className="text-[7px] text-white/15 tracking-[0.2em] mt-0.5">NEU</div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Epic View All Button */}
                    {leaderboard.length > 10 && (
                      <motion.div className="mt-8 flex flex-col items-center gap-3"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                        <button onClick={() => setShowAllLeaderboard(!showAllLeaderboard)}
                          className="group relative overflow-hidden px-10 py-4 font-black tracking-[0.4em] text-xs uppercase transition-all duration-500"
                          style={{
                            background: showAllLeaderboard ? 'rgba(214,255,0,0.1)' : 'transparent',
                            border: '1px solid rgba(214,255,0,0.4)',
                            color: '#D6FF00',
                            boxShadow: showAllLeaderboard ? '0 0 30px rgba(214,255,0,0.15)' : 'none',
                          }}>
                          {['top-0 left-0 border-t border-l', 'top-0 right-0 border-t border-r', 'bottom-0 left-0 border-b border-l', 'bottom-0 right-0 border-b border-r'].map((cls, i) => (
                            <div key={i} className={`absolute w-2.5 h-2.5 ${cls}`} style={{ borderColor: '#D6FF00' }} />
                          ))}
                          <span className="relative z-10 flex items-center gap-3">
                            <TrendingUp className={`w-4 h-4 transition-transform duration-300 ${showAllLeaderboard ? 'rotate-180' : ''}`} />
                            {showAllLeaderboard ? 'COLLAPSE RANKINGS' : `REVEAL ALL ${leaderboard.length} WARRIORS`}
                          </span>
                          <div className="absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                            style={{ background: 'linear-gradient(135deg, rgba(214,255,0,0.08), transparent)' }} />
                          <motion.div className="absolute inset-y-0 w-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                            animate={{ left: ['-15%', '115%'] }} transition={{ repeat: Infinity, duration: 1.8, ease: 'linear' }}
                            style={{ background: 'linear-gradient(90deg, transparent, rgba(214,255,0,0.3), transparent)' }} />
                        </button>
                        <p className="text-[8px] text-white/15 tracking-[0.3em] uppercase">
                          {showAllLeaderboard ? `Showing all ${leaderboard.length} cadets` : `${leaderboard.length - 10} more cadets hidden`}
                        </p>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

 
          {/* ═══════════════════════════════════════════════════════
              FOOTER: ENERGY GUIDE
          ═══════════════════════════════════════════════════════ */}
          <section className="mt-32 pt-20 border-t border-white/5">
            <SectionHeader subtitle="How to Earn" title="ENERGY GUIDE" icon={BarChart3} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Registration', items: [['Register Account', 25], ['Complete Profile', 10], ['Upload Avatar', 5]], color: '#D6FF00', icon: Star },
                { title: 'Events & Missions', items: [['Attend Event', 25], ['3rd Place', 50], ['2nd Place', 80], ['1st Place', 150]], color: '#22d3ee', icon: Target },
                { title: 'Sports', items: [['Register', 20], ['Participate', 35], ['3rd Place', 75], ['2nd Place', 100], ['1st Place', 150]], color: '#a78bfa', icon: Trophy },
                { title: 'Achievements', items: [['Unlock Badge', 25]], color: '#f43f5e', icon: Award },
              ].map(cat => (
                <motion.div key={cat.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  <GlassCard glowColor={cat.color} className="p-6 md:p-8 h-full shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                    <div className="flex items-center gap-3 mb-6 pb-4" style={{ borderBottom: `1px solid ${cat.color}30` }}>
                      <cat.icon className="w-5 h-5 md:w-6 md:h-6" style={{ color: cat.color }} />
                      <span className="text-xs md:text-sm font-black tracking-[0.3em] uppercase drop-shadow-[0_0_10px_currentColor]" style={{ color: cat.color }}>{cat.title}</span>
                    </div>
                    <div className="space-y-4">
                      {cat.items.map(([label, pts]) => (
                        <div key={label as string} className="flex items-center justify-between group">
                          <span className="text-xs md:text-sm text-white/60 font-semibold group-hover:text-white transition-colors uppercase tracking-widest">{label}</span>
                          <span className="text-xs md:text-sm font-black tracking-widest tabular-nums group-hover:scale-105 transition-transform origin-right" style={{ color: cat.color }}>+{pts} NEU</span>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </section>

        </div>
      </main>
    </>
  );
}
