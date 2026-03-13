'use client';

import { MetricCard } from '@/components/MetricCard';
import { Skeleton } from '@/components/ui/skeleton';
import * as LucideIcons from 'lucide-react';

export interface MetricItem {
    title: string;
    value: string | number;
    icon: string; // Icon name as string (e.g., 'Calendar', 'Users')
    iconBgColor: string;
    iconColor: string;
    infoText?: string;
    tooltip?: string;
    trend?: {
        value: string;
        isPositive: boolean;
        comparisonText?: string;
    };
}

interface EventMetricsProps {
    metrics: MetricItem[];
    isLoading?: boolean;
}

export function EventMetrics({ metrics, isLoading }: EventMetricsProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(metrics.length || 4)].map((_: any, i: any) => (
                    <div key={i} className="h-32 bg-[#F4F2F0] rounded-[22px] p-[10px]">
                        <Skeleton className="h-full w-full rounded-[18px]" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric: any, index: any) => {
                // Resolve icon name to actual icon component
                const IconComponent = (LucideIcons as any)[metric.icon];

                return (
                    <MetricCard
                        key={index}
                        title={metric.title}
                        value={metric.value.toString()}
                        icon={IconComponent}
                        iconBgColor={metric.iconBgColor}
                        iconColor={metric.iconColor}
                        {...(metric.infoText ? { infoText: metric.infoText } : {})}
                        {...(metric.tooltip ? { tooltip: metric.tooltip } : {})}
                        {...(metric.trend ? { trend: metric.trend } : {})}
                        delay={index * 100}
                    />
                );
            })}
        </div>
    );
}
