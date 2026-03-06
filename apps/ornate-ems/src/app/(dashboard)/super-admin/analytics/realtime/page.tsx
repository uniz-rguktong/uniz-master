import { Radio, Users, Zap, Globe } from 'lucide-react';

const LIVE_ACTIONS = [
    { id: 1, action: 'New Registration', detail: 'John Doe (CSE) joined', time: 'Just now' },
    { id: 2, action: 'Page View', detail: '/schedule visited from India', time: '2s ago' },
     { id: 3, action: 'Vote Cast', detail: 'Dance Competition - Team Alpha', time: '5s ago' },
      { id: 4, action: 'Login', detail: 'Sports Admin logged in', time: '12s ago' },
];

export default function RealTimeAnalyticsPage() {
    return (
        <div className="p-6 md:p-8 max-w-[1200px] mx-auto">
             <div className="flex flex-col gap-4 mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1A1A1A] flex items-center gap-2">
                             <Radio className="w-6 h-6 text-red-600 animate-pulse" />
                             Right Now
                        </h1>
                        <p className="text-sm text-[#6B7280]">Live stream of user activity.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                 <div className="bg-[#1A1A1A] text-white p-6 rounded-[18px] shadow-lg text-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Active Users</p>
                    <div className="text-5xl font-black mb-1">1,248</div>
                    <div className="text-xs text-green-400 font-bold">+5% vs last hour</div>
                 </div>
                 
                 <div className="bg-white p-6 rounded-[18px] border border-[#E5E7EB] shadow-sm flex flex-col justify-center items-center">
                    <Globe className="w-8 h-8 text-blue-500 mb-2 animate-spin-slow" />
                    <div className="text-2xl font-bold text-[#1A1A1A]">Top Region</div>
                    <div className="text-sm text-gray-500">Campus Network (Internal)</div>
                 </div>

                 <div className="bg-white p-6 rounded-[18px] border border-[#E5E7EB] shadow-sm flex flex-col justify-center items-center">
                     <Zap className="w-8 h-8 text-yellow-500 mb-2" />
                    <div className="text-2xl font-bold text-[#1A1A1A]">142</div>
                    <div className="text-sm text-gray-500">Events/min</div>
                 </div>

                 <div className="bg-white p-6 rounded-[18px] border border-[#E5E7EB] shadow-sm flex flex-col justify-center items-center">
                     <Users className="w-8 h-8 text-purple-500 mb-2" />
                    <div className="text-2xl font-bold text-[#1A1A1A]">85%</div>
                    <div className="text-sm text-gray-500">Mobile Rate</div>
                 </div>
            </div>

            <div className="bg-white rounded-[18px] border border-[#E5E7EB] shadow-sm p-6">
                <h3 className="font-bold text-[#1A1A1A] mb-6">Live Activity Feed</h3>
                <div className="space-y-4">
                    {LIVE_ACTIONS.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-in fade-in slide-in-from-left-4 duration-500">
                             <div>
                                <div className="text-sm font-bold text-gray-900">{item.action}</div>
                                <div className="text-xs text-gray-500">{item.detail}</div>
                             </div>
                             <span className="text-xs font-mono text-gray-400">{item.time}</span>
                        </div>
                    ))}
                     <div className="text-center pt-4">
                        <span className="text-xs text-gray-400 animate-pulse">Waiting for new events...</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
