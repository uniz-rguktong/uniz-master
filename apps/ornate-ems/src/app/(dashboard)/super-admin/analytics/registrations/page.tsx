import { Suspense } from 'react';
import { Building2, User, Users, Venus, Landmark } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { MetricCard } from '@/components/MetricCard';
import RegistrationChart from './RegistrationChart';
import { getRegistrationAnalytics } from '@/actions/analyticsGetters';

// Fallback data when database fetch yields no valid branch groups
const REG_DATA = [
    { branch: 'CSE', male: 0, female: 0, total: 0 },
    { branch: 'ECE', male: 0, female: 0, total: 0 },
    { branch: 'MECH', male: 0, female: 0, total: 0 },
    { branch: 'CIVIL', male: 0, female: 0, total: 0 },
    { branch: 'CHEM', male: 0, female: 0, total: 0 },
];

const CLUB_REG_DATA = [
    { branch: 'TechExcel', male: 0, female: 0, total: 0 },
    { branch: 'Sarvasrijana', male: 0, female: 0, total: 0 },
    { branch: 'Artix', male: 0, female: 0, total: 0 },
    { branch: 'Kaladharini', male: 0, female: 0, total: 0 },
    { branch: 'KhelSaathi', male: 0, female: 0, total: 0 },
    { branch: 'ICRO', male: 0, female: 0, total: 0 },
    { branch: 'Pixelro', male: 0, female: 0, total: 0 },
];

function LoadingSkeleton() {
    return (
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
            <div className="flex flex-col gap-4 mb-8">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-96" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
            </div>
            <Skeleton className="h-[500px]" />
        </div>
    );
}

export default async function RegistrationAnalyticsPage() {
    const result = await getRegistrationAnalytics();
    let data = REG_DATA;
    let clubsData = CLUB_REG_DATA;
    if (result.success && result.data) {
        if (result.data.branches && result.data.branches.length > 0) {
            data = result.data.branches;
        }

        if (result.data.clubs && result.data.clubs.length > 0) {
            clubsData = result.data.clubs;
        }

    }

    // Calculate totals
    const total = data.reduce((acc: any, curr: any) => acc + (curr.total || 0), 0);
    const totalMale = data.reduce((acc: any, curr: any) => acc + (curr.male || 0), 0);
    const totalFemale = data.reduce((acc: any, curr: any) => acc + (curr.female || 0), 0);
    const topBranch = data.reduce((max: any, item: any) => ((item.total || 0) > (max.total || 0) ? item : max), { branch: 'N/A', total: 0 });
    const topClub = clubsData.reduce((max: any, item: any) => ((item.total || 0) > (max.total || 0) ? item : max), { branch: 'N/A', total: 0 });
    const topBranchDisplay = (topBranch.total || 0) > 0 ? topBranch.branch || 'N/A' : 'N/A';
    const topClubDisplay = (topClub.total || 0) > 0 ? topClub.branch || 'N/A' : 'N/A';

    const metricCards = [
        {
            title: 'Total Registrations',
            value: total,
            iconBgColor: '#EFF6FF',
            iconColor: '#3B82F6',
            Icon: Users
        },
        {
            title: 'Male',
            value: totalMale,
            iconBgColor: '#F5F3FF',
            iconColor: '#8B5CF6',
            Icon: User
        },
        {
            title: 'Female',
            value: totalFemale,
            iconBgColor: '#F0FDF4',
            iconColor: '#10B981',
            Icon: Venus
        },
        {
            title: 'Top Branch',
            value: topBranchDisplay,
            iconBgColor: '#FFFBEB',
            iconColor: '#F59E0B',
            Icon: Building2
        },
        {
            title: 'Top Club',
            value: topClubDisplay,
            iconBgColor: '#EFF6FF',
            iconColor: '#3B82F6',
            Icon: Landmark
        }
    ];

    return (
        <Suspense fallback={<LoadingSkeleton />}>
            <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
                <div className="flex flex-col gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1A1A1A]">Registration Insights</h1>
                        <p className="text-sm text-[#6B7280]">Demographic breakdown and enrollment trends.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-8">
                    {metricCards.map((card) => {
                        return (
                            <div key={card.title} className="animate-card-entrance" style={{ animationDelay: '40ms' }}>
                                <MetricCard
                                    title={card.title}
                                    value={card.value}
                                    icon={card.Icon}
                                    iconBgColor={card.iconBgColor}
                                    iconColor={card.iconColor}
                                    tooltip={card.title}
                                    compact
                                />
                            </div>
                        );
                    })}
                </div>

                <div className="bg-[#F4F2F0] rounded-[18px] p-2.5 mb-8 animate-card-entrance">
                    <div className="flex items-center gap-2 mb-4 px-3 mt-1">
                        <h3 className="text-sm font-medium text-[#9CA3AF] uppercase tracking-wide">Branch & Gender Distribution</h3>
                    </div>
                    <div className="bg-white rounded-[14px] border border-[#E5E7EB] p-5 shadow-sm">
                        <RegistrationChart data={data} />
                    </div>
                </div>

                <div className="bg-[#F4F2F0] rounded-[18px] p-2.5 mb-8 animate-card-entrance">
                    <div className="flex items-center gap-2 mb-4 px-3 mt-1">
                        <h3 className="text-sm font-medium text-[#9CA3AF] uppercase tracking-wide">Clubs & Gender Distribution</h3>
                    </div>
                    <div className="bg-white rounded-[14px] border border-[#E5E7EB] p-5 shadow-sm">
                        <RegistrationChart data={clubsData} />
                    </div>
                </div>
            </div>
        </Suspense>
    );
}
