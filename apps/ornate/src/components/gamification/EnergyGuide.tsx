'use client';

import { motion } from 'framer-motion';
import { UserPlus, Calendar, Trophy, Dumbbell, Globe, Gamepad2, Award, Users, Star, Zap } from 'lucide-react';

const CATEGORIES = [
  {
    icon: UserPlus,
    title: 'Registration Bonus',
    color: '#22d3ee',
    items: [
      { action: 'Register Account', points: 50 },
      { action: 'Complete Profile', points: 20 },
      { action: 'Upload Avatar',    points: 10 },
    ],
  },
  {
    icon: Calendar,
    title: 'Event Participation',
    color: '#a78bfa',
    items: [
      { action: 'Attend Event',       points: 50 },
    ],
  },
  {
    icon: Trophy,
    title: 'Mission Rewards',
    color: '#D6FF00',
    items: [
      { action: 'Participation',  points: 50 },
      { action: '3rd Place',      points: 120 },
      { action: '2nd Place',      points: 180 },
      { action: '1st Place 🏆',   points: 250 },
    ],
  },
  {
    icon: Dumbbell,
    title: 'Sports Rewards',
    color: '#f59e0b',
    items: [
      { action: 'Sports Registration', points: 40 },
      { action: 'Participation',        points: 70 },
      { action: '3rd Place',           points: 150 },
      { action: '2nd Place',           points: 220 },
      { action: '1st Place 🏆',        points: 300 },
    ],
  },
  {
    icon: Globe,
    title: 'Website Activity',
    color: '#34d399',
    items: [
      { action: 'Visit 5 Planets',          points: 20 },
      { action: 'Complete First Mission',   points: 50 },
      { action: 'Play Fun Game',            points: 15 },
      { action: 'Share ORNATE Poster',      points: 20 },
    ],
  },
  {
    icon: Gamepad2,
    title: 'Game Integration',
    color: '#f87171',
    items: [
      { action: 'Score 500 in Game',    points: 20 },
      { action: 'Score 1000 in Game',   points: 40 },
      { action: 'Top Leaderboard',      points: 80 },
    ],
  },
  {
    icon: Users,
    title: 'Social Gamification',
    color: '#fb923c',
    items: [
      { action: 'Invite a Friend',       points: 20 },
      { action: 'Friend Registers',      points: 40 },
    ],
  },
  {
    icon: Award,
    title: 'Achievement Badges',
    color: '#c084fc',
    items: [
      { action: 'Each Badge Unlocked', points: 50 },
    ],
  },
];

const LEVEL_TIERS = [
  { level: 1, name: 'EXPLORER',  range: '0 – 100 NEU',    color: '#94a3b8' },
  { level: 2, name: 'NAVIGATOR', range: '101 – 300 NEU',  color: '#22d3ee' },
  { level: 3, name: 'COMMANDER', range: '301 – 700 NEU',  color: '#a78bfa' },
  { level: 4, name: 'GUARDIAN',  range: '701 – 1200 NEU', color: '#f59e0b' },
  { level: 5, name: 'LEGEND',    range: '1200+ NEU',      color: '#D6FF00' },
];

function PointRow({ action, points, color }: { action: string; points: number; color: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
      <span className="text-[11px] text-white/60 tracking-wide">{action}</span>
      <div className="flex items-center gap-1">
        <Zap className="w-3 h-3" style={{ color }} />
        <span className="text-[11px] font-black" style={{ color }}>+{points}</span>
      </div>
    </div>
  );
}

export default function EnergyGuide() {
  return (
    <div className="space-y-12">
      {/* Points categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CATEGORIES.map((cat, idx) => {
          const Icon = cat.icon;
          return (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.04 }}
              className="relative p-5 overflow-hidden"
              style={{
                background: 'rgba(10,10,20,0.7)',
                border: `1px solid ${cat.color}25`,
                clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)',
                backdropFilter: 'blur(12px)',
              }}
            >
              {/* Top accent */}
              <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${cat.color}60, transparent)` }} />

              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 flex items-center justify-center" style={{ background: `${cat.color}12`, border: `1px solid ${cat.color}30` }}>
                  <Icon className="w-4 h-4" style={{ color: cat.color }} />
                </div>
                <span className="text-[10px] font-black tracking-[0.15em] uppercase" style={{ color: cat.color }}>{cat.title}</span>
              </div>

              {/* Rows */}
              <div>
                {cat.items.map((item) => (
                  <PointRow key={item.action} action={item.action} points={item.points} color={cat.color} />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Level tiers */}
      <div>
        <h3 className="text-[11px] font-black tracking-[0.4em] uppercase text-white/40 mb-6 text-center">Cadet Level Progression</h3>
        <div className="flex flex-col sm:flex-row gap-3 max-w-4xl mx-auto">
          {LEVEL_TIERS.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex-1 p-4 flex flex-col items-center gap-2 text-center"
              style={{
                background: `${tier.color}08`,
                border: `1px solid ${tier.color}30`,
                clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)',
              }}
            >
              {/* Level badge hexagon-like */}
              <div
                className="w-10 h-10 flex items-center justify-center font-black text-lg border-2"
                style={{
                  borderColor: tier.color,
                  color: tier.color,
                  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                  background: `${tier.color}15`,
                }}
              >
                {tier.level}
              </div>
              <span className="text-xs font-black tracking-wider uppercase" style={{ color: tier.color }}>{tier.name}</span>
              <span className="text-[9px] text-white/40 tracking-widest">{tier.range}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
