'use client';
import { AlertCircle, Shield, XCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

const ALERTS = [
    { id: 1, type: 'Suspicious Login', severity: 'High', description: 'Multiple failed login attempts detected from IP 45.12.XX.XX', time: '10m ago', status: 'Open' },
    { id: 2, type: 'Data Export Spike', severity: 'Medium', description: 'User "BranchAdmin" exported 5,000 records.', time: '1h ago', status: 'User Verified' },
    { id: 3, type: 'New Admin Added', severity: 'Low', description: 'New role "Club Coordinator" assigned to staff@ornate.edu', time: 'Yesterday', status: 'Resolved' },
];

export default function SecurityAlertsPage() {
    const { showToast } = useToast();
    return (
        <div className="p-6 md:p-8 max-w-[1200px] mx-auto">
            <div className="flex flex-col gap-4 mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1A1A1A]">Threat Monitor</h1>
                        <p className="text-sm text-[#6B7280]">Real-time security incidents and anomalies.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-red-50 border border-red-100 p-6 rounded-[18px] flex items-center gap-4">
                    <div className="p-3 bg-red-100 rounded-full text-red-600"><AlertCircle className="w-8 h-8" /></div>
                    <div>
                        <div className="text-2xl font-bold text-red-700">1 Critical</div>
                        <div className="text-sm text-red-600">Requires Attention</div>
                    </div>
                </div>
                <div className="bg-orange-50 border border-orange-100 p-6 rounded-[18px] flex items-center gap-4">
                    <div className="p-3 bg-orange-100 rounded-full text-orange-600"><Shield className="w-8 h-8" /></div>
                    <div>
                        <div className="text-2xl font-bold text-orange-700">3 Warnings</div>
                        <div className="text-sm text-orange-600">Last 24 hours</div>
                    </div>
                </div>
                <div className="bg-green-50 border border-green-100 p-6 rounded-[18px] flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-full text-green-600"><CheckCircle className="w-8 h-8" /></div>
                    <div>
                        <div className="text-2xl font-bold text-green-700">System Safe</div>
                        <div className="text-sm text-green-600">No breaches detected</div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {ALERTS.map((alert: any) => (
                    <div key={alert.id} className="bg-white p-6 rounded-[18px] border border-[#E5E7EB] shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
                        <div className={`mt-1 w-3 h-3 rounded-full shrink-0 
                            ${alert.severity === 'High' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' :
                                alert.severity === 'Medium' ? 'bg-orange-500' : 'bg-blue-500'}`}
                        />
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-[#1A1A1A] text-lg">{alert.type}</h3>
                                <div className="text-xs text-gray-500 font-mono">{alert.time}</div>
                            </div>
                            <p className="text-gray-600 mt-1 mb-3">{alert.description}</p>

                            <div className="flex items-center gap-3">
                                <span className={`text-xs px-2 py-1 rounded font-bold uppercase 
                                    ${alert.severity === 'High' ? 'bg-red-50 text-red-700' :
                                        alert.severity === 'Medium' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'}`}>
                                    {alert.severity} Priority
                                </span>
                                <span className="text-gray-300">|</span>
                                <button
                                    onClick={() => showToast('Loading alert details...', 'info')}
                                    className="text-xs font-semibold text-indigo-600 hover:underline">View Details</button>
                                <button
                                    onClick={() => showToast('Alert dismissed', 'warning')}
                                    className="text-xs font-semibold text-gray-500 hover:text-[#1A1A1A]">Dismiss</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
