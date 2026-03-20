import { getBranchDetail } from '@/lib/data/branch-detail';
import BranchDetailClient from './BranchDetailClient';
import { notFound } from 'next/navigation';
import { getSportsStandingsData, computeDynamicStandings, getPromoVideosData } from '@/lib/data/sports';

export const revalidate = 60; // Cache and regenerate page every 60 seconds (ISR)

export default async function BranchPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    // Fetch Branch Detail, Sports Standings, and Promo Videos in parallel
    const [data, sports, allPromoVideos] = await Promise.all([
        getBranchDetail(slug),
        getSportsStandingsData(),
        getPromoVideosData()
    ]);

    if (!data) {
        notFound();
    }

    const boysData = computeDynamicStandings(sports, g => g === 'MALE' || g === 'MIXED');
    const girlsData = computeDynamicStandings(sports, g => g === 'FEMALE' || g === 'MIXED');

    return (
        <BranchDetailClient
            data={data}
            boysStandings={boysData.standings}
            boysCategories={boysData.categories}
            girlsStandings={girlsData.standings}
            girlsCategories={girlsData.categories}
            allPromoVideos={allPromoVideos}
        />
    );
}
