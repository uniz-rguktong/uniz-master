import { Building2, Users, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { EventType } from './MissionsFilterBar';

export const DISPLAY: Record<string, string> = {
  CSE: 'CSE', ECE: 'ELECSPIRE', MECH: 'Mech', CIVIL: 'Civil', EE: 'EE',
  PIXLERO: 'Pixlero', SARVASRIJANA: 'Sarvasrijana', ICRO: 'ICRO',
  TECHXCEL: 'TechXcel', ARTIX: 'Artix', KALADHARINI: 'Kaladharini', KHELSATHI: 'Khelsathi',
  TECHNICAL: 'Technical', CULTURAL: 'Cultural', SPORTS: 'Sports',
  FUN: 'Fun', WORKSHOPS: 'Workshops', HACKATHONS: 'Hackathons', GAMING: 'Gaming',
};

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

export const EVENT_META: Record<Exclude<EventType, 'ALL'>, EventMeta> = {
  BRANCHES: {
    label: 'Branches',
    icon: Building2,
    color: 'text-neon',
    border: 'border-neon',
    bg: 'bg-neon/10',
    glow: 'shadow-[0_0_15px_rgba(var(--color-neon-rgb,57,255,20),0.3)]',
    image: '/images/events/branches.svg',
    desc: 'CSE - ELECSPIRE - Mech - Civil - EE',
    accent: 'var(--color-neon)',
  },
  CLUBS: {
    label: 'Clubs',
    icon: Users,
    color: 'text-neon',
    border: 'border-neon',
    bg: 'bg-neon/10',
    glow: 'shadow-[0_0_15px_rgba(var(--color-neon-rgb,57,255,20),0.3)]',
    image: '/images/events/clubs.svg',
    desc: 'Pixlero - ICRO - TechXcel - Artix and more',
    accent: '#22d3ee',
  },
  HHO: {
    label: 'HHo',
    icon: Zap,
    color: 'text-amber-400',
    border: 'border-amber-400',
    bg: 'bg-amber-400/10',
    glow: 'shadow-[0_0_15px_rgba(251,191,36,0.3)]',
    image: '/images/events/hho.svg',
    desc: 'Technical - Cultural - Sports - Gaming and more',
    accent: '#fbbf24',
  },
};
