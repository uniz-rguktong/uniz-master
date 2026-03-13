'use client';

import { motion } from 'framer-motion';
import { Rocket, Globe, Trophy, Code2, Star, Share2, Zap, Crown } from 'lucide-react';

const ICON_MAP = {
  Rocket, Globe, Trophy, Code2, Star, Share2, Zap, Crown,
};

const DEFAULT_BADGES = [
  { id: 'first-mission',   name: 'FIRST MISSION',    description: 'Completed your first mission',         icon: 'Rocket',  bonusEnergy: 50,  category: 'mission', color: '#a78bfa' },
  { id: 'planet-explorer', name: 'PLANET EXPLORER',   description: 'Visited 5 planet sections',            icon: 'Globe',   bonusEnergy: 50,  category: 'website', color: '#22d3ee' },
  { id: 'sports-warrior',  name: 'SPORTS WARRIOR',    description: 'Participated in a sports event',       icon: 'Trophy',  bonusEnergy: 50,  category: 'sports',  color: '#f59e0b' },
  { id: 'code-champion',   name: 'CODING CHAMPION',   description: 'Won a coding mission',                 icon: 'Code2',   bonusEnergy: 75,  category: 'mission', color: '#D6FF00' },
  { id: 'ornate-veteran',  name: 'ORNATE VETERAN',    description: 'Registered early for ORNATE',          icon: 'Star',    bonusEnergy: 75,  category: 'special', color: '#f43f5e' },
  { id: 'social-spark',    name: 'SOCIAL SPARK',      description: 'Shared ORNATE on social platforms',   icon: 'Share2',  bonusEnergy: 30,  category: 'social',  color: '#34d399' },
  { id: 'neon-powered',    name: 'NEON POWERED',      description: 'Generated 500+ energy units',          icon: 'Zap',     bonusEnergy: 100, category: 'energy',  color: '#D6FF00' },
  { id: 'legend-cadet',   name: 'LEGEND CADET',      description: 'Reached Legend level (1200+ energy)',  icon: 'Crown',   bonusEnergy: 200, category: 'energy',  color: '#D6FF00' },
];

interface BadgesProps {
  earnedBadgeIds?: string[];
  showAll?: boolean;
}

export default function AchievementBadges({ earnedBadgeIds = [], showAll = true }: BadgesProps) {
  const badges = showAll ? DEFAULT_BADGES : DEFAULT_BADGES.filter(b => earnedBadgeIds.includes(b.id));

  if (!showAll && badges.length === 0) {
    return (
      <div className="text-center py-8">
        <Zap className="w-8 h-8 text-[#D6FF00]/20 mx-auto mb-2" />
        <p className="text-[10px] text-white/30 tracking-[0.3em] uppercase">No badges earned yet — start earning energy!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {badges.map((badge, i) => {
        const earned = earnedBadgeIds.includes(badge.id);
        const Icon = ICON_MAP[badge.icon as keyof typeof ICON_MAP] ?? Star;
        return (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04 }}
            title={`${badge.name}: ${badge.description} (+${badge.bonusEnergy} NEU)`}
            className="flex flex-col items-center gap-2 p-3 text-center cursor-help transition-all hover:scale-105"
            style={{
              background: earned ? `${badge.color}10` : 'rgba(255,255,255,0.02)',
              border: earned ? `1px solid ${badge.color}40` : '1px solid rgba(255,255,255,0.06)',
              filter: earned ? 'none' : 'grayscale(1) opacity(0.4)',
            }}
          >
            <div
              className="w-10 h-10 flex items-center justify-center"
              style={{
                background: earned ? `${badge.color}15` : 'rgba(255,255,255,0.05)',
                border: `1px solid ${earned ? badge.color + '40' : 'rgba(255,255,255,0.1)'}`,
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              }}
            >
              <Icon className="w-5 h-5" style={{ color: earned ? badge.color : '#ffffff40' }} />
            </div>
            <div>
              <p className="text-[9px] font-black tracking-[0.1em] uppercase leading-tight" style={{ color: earned ? badge.color : 'rgba(255,255,255,0.3)' }}>
                {badge.name}
              </p>
              {earned && (
                <p className="text-[8px] text-[#D6FF00]/60 mt-0.5">+{badge.bonusEnergy} NEU</p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
