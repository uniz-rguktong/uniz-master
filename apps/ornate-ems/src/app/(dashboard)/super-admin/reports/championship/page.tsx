import { Trophy, Medal, Download } from 'lucide-react';

const FINAL_STANDINGS = [
    { rank: 1, branch: 'CSE', points: 1250, medal: 'Gold' },
    { rank: 2, branch: 'ECE', points: 1120, medal: 'Silver' },
    { rank: 3, branch: 'MECH', points: 980, medal: 'Bronze' },
    { rank: 4, branch: 'CIVIL', points: 840, medal: '-' },
    { rank: 5, branch: 'CHEM', points: 650, medal: '-' },
];

export default function ChampionshipReportPage() {
    return (
        <div className="p-6 md:p-8 max-w-[1000px] mx-auto">
             <div className="flex flex-col gap-4 mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1A1A1A]">Official Results Card</h1>
                        <p className="text-sm text-[#6B7280]">Validated championship standings for publication.</p>
                    </div>
                     <button className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#2D2D2D] transition-colors">
                        <Download className="w-4 h-4" />
                        Download Certificate
                    </button>
                </div>
            </div>

            <div className="bg-white border-2 border-[#1A1A1A] rounded-xl p-8 max-w-2xl mx-auto shadow-xl">
                 <div className="text-center mb-8">
                    <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-3xl font-black text-[#1A1A1A] uppercase tracking-widest">Ornate 2026</h2>
                    <div className="text-lg font-medium text-gray-600 mt-2">Championship Scorecard</div>
                 </div>

                 <div className="space-y-4">
                    {FINAL_STANDINGS.map((row: any) => (
                        <div key={row.branch} className={`flex items-center justify-between p-4 rounded-lg border-2 
                            ${row.rank === 1 ? 'border-yellow-400 bg-yellow-50' : 'border-gray-100 bg-white'}`}>
                            <div className="flex items-center gap-4">
                                <span className={`w-8 h-8 flex items-center justify-center font-bold text-lg rounded-full 
                                     ${row.rank === 1 ? 'bg-yellow-500 text-white' : 
                                       row.rank === 2 ? 'bg-gray-400 text-white' : 
                                       row.rank === 3 ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                    {row.rank}
                                </span>
                                <span className="text-xl font-bold text-[#1A1A1A]">{row.branch}</span>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-black text-[#1A1A1A]">{row.points}</div>
                                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Points</div>
                            </div>
                        </div>
                    ))}
                 </div>

                 <div className="mt-12 pt-8 border-t border-gray-200 flex justify-between items-end">
                    <div className="text-center">
                        <div className="h-12 border-b border-gray-400 w-32 mb-2"></div>
                        <div className="text-xs font-bold text-gray-500 uppercase">Sports Secretary</div>
                    </div>
                     <div className="text-center">
                        <div className="h-12 border-b border-gray-400 w-32 mb-2"></div>
                        <div className="text-xs font-bold text-gray-500 uppercase">Faculty Coordinator</div>
                    </div>
                     <div className="text-center">
                        <div className="h-12 border-b border-gray-400 w-32 mb-2"></div>
                        <div className="text-xs font-bold text-gray-500 uppercase">Director</div>
                    </div>
                 </div>
            </div>
        </div>
    );
}
