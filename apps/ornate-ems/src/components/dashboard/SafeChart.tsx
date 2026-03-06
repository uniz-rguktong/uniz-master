'use client';
import dynamic from 'next/dynamic';

const SalesTrendChart = dynamic(
    () => import('@/components/SalesTrendChart').then(mod => mod.SalesTrendChart),
    {
        loading: () => <div className="h-[400px] bg-gray-50 animate-pulse rounded-2xl" />,
        ssr: false
    }
);

export default function SafeChart({ data }: { data: any }) {
    return <SalesTrendChart data={data} />;
}
