import { getBranchDetail } from '@/lib/data/branch-detail';
import ClubDetailClient from './ClubDetailClient';
import { notFound } from 'next/navigation';
import { getPromoVideosData } from '@/lib/data/sports';

export const revalidate = 60; // Cache and regenerate page every 60 seconds

export default async function ClubDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    
    // Fetch both detail data and generic promo videos in parallel
    const [data, allPromoVideos] = await Promise.all([
        getBranchDetail(slug),
        getPromoVideosData()
    ]);

    if (!data) {
        notFound();
    }

    return <ClubDetailClient data={data} allPromoVideos={allPromoVideos} />;
}
