// ─── Point values matching the spec ──────────────────────────────────────────
export const ENERGY_REWARDS = {
  // REGISTRATION
  REGISTRATION_BONUS: 25,
  PROFILE_COMPLETE: 10,
  AVATAR_UPLOAD: 5,
  
  // EVENTS & MISSIONS
  EVENT_REGISTER: 0, // No points for event registration as per the energy guide
  EVENT_ATTEND: 25,
  MISSION_PARTICIPATE: 0,
  MISSION_THIRD: 50,
  MISSION_SECOND: 80,
  MISSION_FIRST: 150,
  
  // SPORTS
  SPORT_REGISTER: 20,
  SPORT_PARTICIPATE: 35,
  SPORT_THIRD: 75,
  SPORT_SECOND: 100,
  SPORT_FIRST: 150,

  // ACHIEVEMENTS
  BADGE_UNLOCK: 25,

  // OTHER / SYSTEM (Set to 0 if not explicitly mentioned in the guide)
  WEBSITE_ACTIVITY: 0,
  GAME_SCORE: 0,
  SOCIAL_SHARE: 0,
  INVITE_FRIEND: 0,
  ADMIN_GRANT: 0,
} as const;

// ─── Cadet level definitions ──────────────────────────────────────────────────
export const CADET_LEVELS = [
  { level: 1, name: 'Explorer',  min: 0,    max: 150  },
  { level: 2, name: 'Navigator', min: 151,  max: 400  },
  { level: 3, name: 'Commander', min: 401,  max: 900  },
  { level: 4, name: 'Guardian',  min: 901,  max: 1728 },
  { level: 5, name: 'Legend',    min: 1729, max: Infinity },
] as const;

export type CadetLevel = (typeof CADET_LEVELS)[number];

export function getCadetLevel(energy: number): CadetLevel {
  return (CADET_LEVELS.find(l => energy >= l.min && energy <= l.max) ?? CADET_LEVELS[0]) as CadetLevel;
}

// ─── Default achievement badges ───────────────────────────────────────────────
export const DEFAULT_BADGES = [
  { id: 'first-mission',   name: 'FIRST MISSION',    description: 'Completed your first mission',        icon: 'Rocket',  bonusEnergy: 50,  category: 'mission' },
  { id: 'planet-explorer', name: 'PLANET EXPLORER',  description: 'Visited 5 planet sections',           icon: 'Globe',   bonusEnergy: 50,  category: 'website' },
  { id: 'ornate-veteran',  name: 'ORNATE VETERAN',   description: 'Registered early for ORNATE',        icon: 'Star',    bonusEnergy: 75,  category: 'special' },
  { id: 'legend-cadet',    name: 'LEGEND CADET',     description: 'Reached Legend level',                icon: 'Crown',   bonusEnergy: 200, category: 'energy'  },
] as const;
