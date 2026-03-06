'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface EventPerformanceChartProps {
    data: Array<Record<string, string | number>>;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
    if (!active || !payload || payload.length === 0) return null;

    const byKey = payload.reduce((acc: Record<string, { value: number; color: string }>, item: any) => {
        acc[item.dataKey] = { value: item.value, color: item.color };
        return acc;
    }, {});

    return (
        <div className="rounded-lg bg-white border border-[#E5E7EB] shadow-md px-3 py-2">
            <p className="text-[#1A1A1A] text-sm font-medium mb-1">{label}</p>
            <p className="text-sm" style={{ color: byKey['Total Registrations']?.color || '#14B8A6' }}>
                Total Registrations : {byKey['Total Registrations']?.value ?? 0}
            </p>
            <p className="text-sm" style={{ color: byKey['Participations']?.color || '#4F46E5' }}>
                Participations : {byKey['Participations']?.value ?? 0}
            </p>
        </div>
    );
}

export default function EventPerformanceChart({ data }: EventPerformanceChartProps) {
    return (
        <div className="h-[460px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 56 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                        dataKey="name"
                        type="category"
                        interval={0}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        angle={-18}
                        textAnchor="end"
                        height={72}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                    <Tooltip
                        cursor={{fill: 'transparent'}}
                        content={<CustomTooltip />}
                    />
                    <Legend />
                    <Bar dataKey="Total Registrations" fill="#14B8A6" radius={[4, 4, 0, 0]} barSize={30} />
                    <Bar dataKey="Participations" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
