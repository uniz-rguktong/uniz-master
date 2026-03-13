import { getSportsStandingsData, getTodaysMatchesData, getPromoVideosData, getAthleticsData, SportData, BranchPointData, StandingRow, computeDynamicStandings } from '@/lib/data/sports';
import { getSportsGalleryAlbums } from '@/lib/data/gallery';
import SportsClient from './SportsClient';

// Enable Incremental Static Regeneration (ISR) with a 5-minute revalidation for better performance
export const revalidate = 300;

export default async function SportsPage() {
    // Parallelize all data fetching
    const [
        sports,
        todaysMatches,
        sportsAlbums,
        promoVideos,
        athleticsWinners
    ] = await Promise.all([
        getSportsStandingsData(),
        getTodaysMatchesData(),
        getSportsGalleryAlbums(),
        getPromoVideosData(),
        getAthleticsData()
    ]);

    // Offload compute to server-side before passing to Client Component
    const boysData = computeDynamicStandings(sports, g => g === 'MALE' || g === 'MIXED');
    const girlsData = computeDynamicStandings(sports, g => g === 'FEMALE' || g === 'MIXED');

    return (
        <SportsClient
            sports={sports}
            athleticsWinners={athleticsWinners}
            boysStandings={boysData.standings}
            boysCategories={boysData.categories}
            girlsStandings={girlsData.standings}
            girlsCategories={girlsData.categories}
            todaysMatches={todaysMatches}
            sportsAlbums={sportsAlbums}
            promoVideos={promoVideos}
        />
    );
}
