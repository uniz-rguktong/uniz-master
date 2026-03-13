'use client';
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface RegistrationChartProps {
    data: Array<Record<string, string | number>>;
}

export default function RegistrationChart({ data }: RegistrationChartProps) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: isMobile ? 60 : 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                        dataKey="branch"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: isMobile ? 11 : 12, fill: '#6B7280' }}
                        interval={isMobile ? 0 : "preserveEnd" as any}
                        angle={isMobile ? -25 : 0}
                        textAnchor={isMobile ? "end" : "middle"}
                        height={isMobile ? 80 : 30}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend verticalAlign={isMobile ? "top" : "bottom"} height={36} />
                    <Bar dataKey="male" stackId="a" fill="#3B82F6" name="Male" radius={[0, 0, 4, 4]} {...(isMobile ? { barSize: 35 } : {})} />
                    <Bar dataKey="female" stackId="a" fill="#8B5CF6" name="Female" radius={[4, 4, 0, 0]} {...(isMobile ? { barSize: 35 } : {})} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
