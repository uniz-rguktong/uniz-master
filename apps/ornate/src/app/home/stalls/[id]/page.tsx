import { notFound } from 'next/navigation';
import { getStalls } from '@/lib/data/stalls';
import StallDetailClient from './StallDetailClient';

export default async function StallDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ panel?: string }>;
}) {
    const { id } = await params;
    const { panel } = await searchParams;

    // Find stall data
    const stalls = await getStalls();
    const stallData = stalls.find((s) => s.id === id);

    if (!stallData) {
        notFound();
    }

    return <StallDetailClient stall={stallData} initialPanel={panel} />;
}
