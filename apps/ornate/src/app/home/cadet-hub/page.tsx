import CadetHubClient from './CadetHubClient';
import { getNeonCoreStats, getLeaderboard, getPlanetLeaderboard } from '@/lib/actions/gamification';
import type { LeaderboardCadet, NeonStats, PlanetLeaderboardEntry } from '@/types/gamification';

import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const revalidate = 60;

export const metadata = {
  title: 'Cadet Hub — ORNATE',
  description: 'The ORNATE Gamification Dashboard. Earn Neon Energy, climb the leaderboard, and power the universe.',
};

export default async function CadetHubPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  let neonStats: NeonStats = { totalEnergy: 0, totalCadets: 0, topCadets: [] };
  let leaderboard: LeaderboardCadet[] = [];
  let planets: PlanetLeaderboardEntry[] = [];

  try {
    // Fetch global stats and leaderboards in parallel (ISR cached)
    [neonStats, leaderboard, planets] = await Promise.all([
      getNeonCoreStats(),
      getLeaderboard(50),
      getPlanetLeaderboard(),
    ]);
  } catch {
    // DB tables not yet created — show empty state
  }

  return (
    <CadetHubClient
      neonStats={neonStats}
      leaderboard={leaderboard}
      planets={planets}
      myProfile={null}
    />
  );
}
