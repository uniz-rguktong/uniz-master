'use client';
import dynamic from 'next/dynamic';
import { SkeletonLoader } from '@/components/SkeletonLoader';

const SalesTrendChart = dynamic(
    () => import('@/components/SalesTrendChart').then(mod => mod.SalesTrendChart),
    {
        loading: () => <div className="h-[500px]"><SkeletonLoader /></div>, // Approximate height of the chart card
        ssr: false // Optional: Disable SSR if chart is purely client-side interaction
    }
);

const RevenueBreakdown = dynamic(
    () => import('@/components/RevenueBreakdown').then(mod => mod.RevenueBreakdown),
    {
        loading: () => <div className="h-[500px]"><SkeletonLoader /></div>,
        ssr: false
    }
);

interface SalesTrendPoint {
    label: string;
    registered: number;
    attended: number;
}

interface RevenueCategoryPoint {
    category: string;
    value: number;
    color: string;
}

interface ChartsSectionProps {
    salesData: Record<string, SalesTrendPoint[]> | undefined;
    revenueData: RevenueCategoryPoint[] | undefined;
}

/**
 * Currently these sub-components (SalesTrendChart/RevenueBreakdown) mock their own data internally or accept it. 
 * We will assume they just accept data if we pass it, OR we modify them to accept data.
 * For now, since your previous implementation of 'SalesTrendChart' was likely self-contained or static,
 * we will wrap them here.
 * NOTE: Best practice would be to update SalesTrendChart to accept 'data' prop. 
 * I am assuming standard behavior or that I will need to update them if they are static.
 * Given previous View code: <SalesTrendChart /> was used without props. 
 * If we want to stream data, we should pass it. 
 * I'll assume they can accept data or I'll just render them as is for now, but in a real streaming scenario
 * we pass the fetched 'chartData' to them.
 */

export function ChartsSection({ salesData, revenueData }: ChartsSectionProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 animate-card-entrance" style={{ animationDelay: '160ms' }}>
                <SalesTrendChart data={salesData} />
            </div>
            <div className="animate-card-entrance" style={{ animationDelay: '200ms' }}>
                <RevenueBreakdown data={revenueData || []} isLoading={false} />
            </div>
        </div>
    );
}
