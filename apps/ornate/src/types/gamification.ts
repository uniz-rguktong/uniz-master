import type { CadetLevel } from '@/lib/gamification-constants';

export type NeonTopCadet = {
  rank: number;
  name: string;
  branch: string;
  energy: number;
  level: CadetLevel;
};

export type NeonStats = {
  totalEnergy: number;
  totalCadets: number;
  topCadets: NeonTopCadet[];
};

export type LeaderboardCadet = {
  rank: number;
  name: string;
  branch: string;
  stdid: string;
  energy: number;
  level: CadetLevel;
  badgeCount: number;
};

export type PlanetLeaderboardEntry = {
  branch: string;
  energy: number;
  cadets: number;
  rank: number;
};

export type CadetMissionActivity = {
  title: string;
  category: string;
  date: string;
  status: string;
  energy: number;
};

export type CadetHubProfile = {
  name: string;
  branch: string;
  totalEnergy: number;
  level: CadetLevel;
  badgeIds: string[];
  transactions: { amount: number; reason: string; description?: string | null; createdAt: string }[];
  rank: number | null;
  totalCadets: number;
  stats: {
    missions: number;
    events: number;
    gamesPlayed: number;
  };
  recentMissions: CadetMissionActivity[];
};
