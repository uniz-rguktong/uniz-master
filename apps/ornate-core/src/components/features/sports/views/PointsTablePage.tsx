'use client';
import { useState, useEffect } from 'react';
import { Trophy, Award } from 'lucide-react';


import { getTournamentStandings } from '@/actions/fixtureActions';


const BRANCHES = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL'];
const BASE_SPORTS = ['Cricket', 'Football', 'Basketball', 'Volleyball', 'Kabaddi', 'Kho-Kho', 'Badminton'];
const GIRLS_SPORTS = ['Volleyball', 'Basketball', 'Kabaddi', 'Throwball', 'Badminton', 'Kho-Kho', 'Athletics'];

interface PointsTablePageProps {
    includeAthletics?: boolean;
    twoCardLayout?: boolean;
}

export function PointsTablePage({ includeAthletics = true, twoCardLayout = false }: PointsTablePageProps) {
    const [boysStandings, setBoysStandings] = useState<any>({});
    const [girlsStandings, setGirlsStandings] = useState<any>({});
    const [isLoading, setIsLoading] = useState(true);
    const boysSports = includeAthletics ? [...BASE_SPORTS, 'Athletics'] : BASE_SPORTS;
    const girlsSports = GIRLS_SPORTS;

    const loadStandings = async () => {
        setIsLoading(true);
        const res = await getTournamentStandings();
        if (res.success && res.data) {
            setBoysStandings((res.data as any).Boys || {});
            setGirlsStandings((res.data as any).Girls || {});
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadStandings();
    }, []);

    return (
        <div className="p-4 md:p-8 animate-page-entrance bg-white min-h-full">
            <div className="mb-6">
                <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
                    <span className="capitalize">Dashboard</span>
                    <span className="text-[#9CA3AF]">›</span>
                    <span>Sports</span>
                    <span className="text-[#9CA3AF]">›</span>
                    <span className="text-[#1A1A1A] font-medium">Championship Tracking</span>
                </div>

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-xl md:text-[28px] font-semibold text-[#1A1A1A] mb-2">Overall Championship</h1>
                        <p className="text-[10px] md:text-sm text-[#6B7280]">Track departmental leaderboard and standings.</p>
                    </div>
                </div>

                <div className={twoCardLayout ? 'grid grid-cols-1 xl:grid-cols-2 gap-8' : 'flex flex-col gap-8'}>
                    <div className="bg-[#F4F2F0] rounded-xl border border-[#E5E7EB] p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
                                <Trophy className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-[#1A1A1A]">Boys Standings</h3>
                                <p className="text-xs text-[#6B7280]">Per-branch performance across categories</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-[12px] border border-[#E5E7EB] overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-225">
                                    <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                                        <tr>
                                            <th className="text-left px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-[0.15em]">Department</th>
                                            {boysSports.map(s => (
                                                <th key={s} className="text-center px-4 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-[0.12em]">{s}</th>
                                            ))}
                                            <th className="text-center px-6 py-4 text-[11px] font-bold text-[#1A1A1A] uppercase tracking-[0.15em]">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                        {BRANCHES.map((branch: any, idx: any) => {
                                            let totalPoints = 0;
                                            return (
                                                <tr key={branch} className={`border-b border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors ${idx === BRANCHES.length - 1 ? 'border-b-0' : ''}`}>
                                                    <td className="py-4 px-6 text-[12px] font-bold text-[#1A1A1A]">{branch}</td>
                                                    {boysSports.map(sport => {
                                                        const sportData = boysStandings[sport] || {};
                                                        const rawPoints = sportData[branch];
                                                        const points = (typeof rawPoints === 'number') ? rawPoints : 0;
                                                        totalPoints += points;

                                                        return (
                                                            <td key={sport} className="text-center py-4 px-4">
                                                                {points > 0 ? (
                                                                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold text-white shadow-sm ${points === 10 ? 'bg-amber-500' :
                                                                        points === 5 ? 'bg-emerald-500' :
                                                                            points === 3 ? 'bg-blue-500' :
                                                                                'bg-slate-400'
                                                                        }`}>
                                                                        {points}
                                                                    </span>
                                                                ) : <span className="text-[10px] text-gray-300">-</span>}
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="text-center py-4 px-6">
                                                        <span className="text-[13px] font-bold text-[#1A1A1A]">{totalPoints}</span>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#F4F2F0] rounded-xl border border-[#E5E7EB] p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-[#FFF1F2] flex items-center justify-center">
                                <Award className="w-5 h-5 text-pink-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-[#1A1A1A]">Girls Standings</h3>
                                <p className="text-xs text-[#6B7280]">Per-branch performance across categories</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-[12px] border border-[#E5E7EB] overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-225">
                                    <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                                        <tr>
                                            <th className="text-left px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-[0.15em]">Department</th>
                                            {girlsSports.map(s => (
                                                <th key={s} className="text-center px-4 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-[0.12em]">{s}</th>
                                            ))}
                                            <th className="text-center px-6 py-4 text-[11px] font-bold text-[#1A1A1A] uppercase tracking-[0.15em]">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                        {BRANCHES.map((branch: any, idx: any) => {
                                            let totalPoints = 0;
                                            return (
                                                <tr key={branch} className={`border-b border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors ${idx === BRANCHES.length - 1 ? 'border-b-0' : ''}`}>
                                                    <td className="py-4 px-6 text-[12px] font-bold text-[#1A1A1A]">{branch}</td>
                                                    {girlsSports.map(sport => {
                                                        const sportData = girlsStandings[sport] || {};
                                                        const rawPoints = sportData[branch];
                                                        const points = (typeof rawPoints === 'number') ? rawPoints : 0;
                                                        totalPoints += points;

                                                        return (
                                                            <td key={sport} className="text-center py-4 px-4">
                                                                {points > 0 ? (
                                                                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold text-white shadow-sm ${points === 10 ? 'bg-amber-500' :
                                                                        points === 5 ? 'bg-emerald-500' :
                                                                            points === 3 ? 'bg-blue-500' :
                                                                                'bg-slate-400'
                                                                        }`}>
                                                                        {points}
                                                                    </span>
                                                                ) : <span className="text-[10px] text-gray-300">-</span>}
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="text-center py-4 px-6">
                                                        <span className="text-[13px] font-bold text-[#1A1A1A]">{totalPoints}</span>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
