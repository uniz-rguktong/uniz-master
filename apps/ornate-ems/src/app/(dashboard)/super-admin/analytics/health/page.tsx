import { Activity, Server, AlertCircle, Cpu } from 'lucide-react';
import LatencyChart from './LatencyChart';

const UPTIME_DATA = [
    { time: '00:00', latency: 45 }, { time: '04:00', latency: 42 },
    { time: '08:00', latency: 120 }, { time: '12:00', latency: 180 },
    { time: '16:00', latency: 150 }, { time: '20:00', latency: 85 },
    { time: '24:00', latency: 50 },
];

export default function FestHealthPage() {
    return (
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
             <div className="flex flex-col gap-4 mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1A1A1A]">System Health Monitor</h1>
                        <p className="text-sm text-[#6B7280]">Real-time infrastructure performance and uptime logs.</p>
                    </div>
                     <span className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-bold animate-pulse">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        All Systems Operational
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-[18px] border border-[#E5E7EB] shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Activity className="w-6 h-6" /></div>
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">+99.9%</span>
                    </div>
                    <div className="text-2xl font-bold text-[#1A1A1A]">45ms</div>
                    <div className="text-xs text-gray-500">Avg. API Latency</div>
                </div>
                 <div className="bg-white p-6 rounded-[18px] border border-[#E5E7EB] shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Cpu className="w-6 h-6" /></div>
                        <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded">Stable</span>
                    </div>
                    <div className="text-2xl font-bold text-[#1A1A1A]">32%</div>
                    <div className="text-xs text-gray-500">Server CPU Usage</div>
                </div>
                 <div className="bg-white p-6 rounded-[18px] border border-[#E5E7EB] shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><AlertCircle className="w-6 h-6" /></div>
                        <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">+2</span>
                    </div>
                    <div className="text-2xl font-bold text-[#1A1A1A]">12</div>
                    <div className="text-xs text-gray-500">Error Rate (per hour)</div>
                </div>
                 <div className="bg-white p-6 rounded-[18px] border border-[#E5E7EB] shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-teal-50 text-teal-600 rounded-lg"><Server className="w-6 h-6" /></div>
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">Healthy</span>
                    </div>
                    <div className="text-2xl font-bold text-[#1A1A1A]">Runnning</div>
                    <div className="text-xs text-gray-500">Database Status</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-[18px] p-6 border border-[#E5E7EB] shadow-sm">
                    <h3 className="font-bold text-[#1A1A1A] mb-6">Latency Metrics (24h)</h3>
                    <LatencyChart data={UPTIME_DATA} />
                </div>

                <div className="bg-white rounded-[18px] p-6 border border-[#E5E7EB] shadow-sm">
                    <h3 className="font-bold text-[#1A1A1A] mb-6">Regional Node Status</h3>
                    <div className="space-y-4">
                        {['US East (N. Virginia)', 'Asia Pacific (Mumbai)', 'EU West (London)'].map((region: any, i: any) => (
                             <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                    <span className="text-sm font-medium text-gray-700">{region}</span>
                                </div>
                                <span className="text-xs font-mono text-gray-500">{40 + i*5}ms</span>
                            </div>
                        ))}
                    </div>

                    <h3 className="font-bold text-[#1A1A1A] mt-8 mb-4">Last Incidents</h3>
                     <div className="space-y-4">
                        <div className="flex gap-3 items-start">
                            <AlertCircle className="w-4 h-4 text-orange-500 mt-1 shrink-0" />
                            <div>
                                <div className="text-sm font-semibold text-gray-900">High Memory Usage</div>
                                <div className="text-xs text-gray-500">2 hours ago - Resolved</div>
                            </div>
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
}
