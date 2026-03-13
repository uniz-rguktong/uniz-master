import { Layout, Clock, Globe, ArrowUpRight } from 'lucide-react';

const PORTALS = [
    { name: 'Student Portal', url: 'ornate.edu/student', traffic: '12.5k', health: 98, loadTime: '0.8s', active: true },
    { name: 'Sports Portal', url: 'ornate.edu/sports', traffic: '8.2k', health: 100, loadTime: '0.6s', active: true },
    { name: 'Admin Dashboard', url: 'ornate.edu/admin', traffic: '450', health: 95, loadTime: '1.2s', active: true },
    { name: 'Legacy Site', url: 'ornate.edu/old', traffic: '120', health: 80, loadTime: '3.5s', active: false },
];

export default function PortalAnalyticsPage() {
    return (
        <div className="p-6 md:p-8 max-w-[1200px] mx-auto">
            <div className="flex flex-col gap-4 mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-[28px] font-semibold text-[#1A1A1A]">Portal Usage Metrics</h1>
                        <p className="text-sm text-[#6B7280]">Traffic analysis across different sub-domains.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {PORTALS.map((portal: any) => (
                    <div key={portal.name} className="bg-white rounded-[18px] border border-[#E5E7EB] p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-gray-50 rounded-xl text-gray-900">
                                    <Layout className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#1A1A1A]">{portal.name}</h3>
                                    <a href="#" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                                        {portal.url} <ArrowUpRight className="w-3 h-3" />
                                    </a>
                                </div>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${portal.active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {portal.active ? 'Live' : 'Maintenance'}
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-6">
                            <div>
                                <div className="text-xs text-gray-500 font-bold uppercase mb-1">Daily Views</div>
                                <div className="text-xl font-bold text-[#1A1A1A] flex items-center gap-1">
                                    <Globe className="w-4 h-4 text-gray-400" />
                                    {portal.traffic}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 font-bold uppercase mb-1">Health Score</div>
                                <div className="text-xl font-bold text-[#1A1A1A]">{portal.health}%</div>
                                <div className="w-full h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
                                    <div className="h-full bg-green-500" style={{ width: `${portal.health}%` }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 font-bold uppercase mb-1">Avg Load</div>
                                <div className="text-xl font-bold text-[#1A1A1A] flex items-center gap-1">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    {portal.loadTime}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
