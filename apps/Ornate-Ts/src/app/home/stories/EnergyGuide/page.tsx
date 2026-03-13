import type { Metadata } from 'next';
import StoryReader, { StoryData } from '../StoryReader';

export const metadata: Metadata = {
    title: 'Energy Guide — Mastering the Neon Core | Ornate Archives',
    description: 'Learn how to earn Neon Energy Units, increase your rank, and power your planet.',
};

const ENERGY_GUIDE_STORY: StoryData = {
    id: 'EnergyGuide',
    title: 'Energy Guide',
    subtitle: 'Mastering the Neon Core',
    chapter: 'Cadet Orientation',
    totalPages: 4,
    accentColor: '#00E5FF',
    glowColor: 'rgba(0, 229, 255, 0.4)',
    pages: [
        {
            title: 'What is Neon Energy?',
            content: `"The lifeblood of our universe..."

Neon Energy Units (NEU) power everything in the ORNATE system. 

It fuels the Neon Core, keeps the planetary orbits stable, and traces your cosmic footprint. The more you explore, the brighter our galaxy shines.`,
        },
        {
            title: 'How to Earn Energy?',
            content: `Earn NEU through action.

"Every move you make matters."

You can collect Neon Energy by:
- Participating in exciting events
- Completing critical missions
- Placing high in planetary games
- Unlocking special achievement badges`,
        },
        {
            title: 'Ascending the Ranks',
            content: `From Explorer to Legend.

Your accumulated NEU determines your Cadet Level. Everyone starts their journey as an Explorer.

"Push past your limits..." 

Gather enough energy and you will rise to become a Navigator, Commander, Guardian, and eventually, a true Legend.`,
        },
        {
            title: 'Power Your Planet',
            content: `A collective effort.

"You never fly alone."

Every NEU you earn doesn't just increase your personal rank—it directly charges your Branch's planet. 

Compete on the global leaderboard to make your planet the brightest star in the sector!`,
        },
    ],
};

export default function EnergyGuidePage() {
    return <StoryReader story={ENERGY_GUIDE_STORY} />;
}
