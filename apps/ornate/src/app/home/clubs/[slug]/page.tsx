import { getBranchDetail } from '@/lib/data/branch-detail';
import ClubDetailClient from './ClubDetailClient';
import { notFound } from 'next/navigation';
export const revalidate = 60; // Cache and regenerate page every 60 seconds

export async function generateStaticParams() {
    const slugs = [
        'artix', 'kaladharani', 'icro', 'techxcel', 'pixelro',
        'sarvasrijana', 'khelsaathi'
    ];
    return slugs.map((slug) => ({ slug }));
}

export default async function ClubDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const data = await getBranchDetail(slug);

    if (!data) {
        notFound();
    }

    return <ClubDetailClient data={data} />;
}
