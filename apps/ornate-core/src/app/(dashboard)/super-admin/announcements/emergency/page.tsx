'use client';
import { AlertTriangle, Siren, ShieldAlert } from 'lucide-react';
import { useState } from 'react';

const PRESET_ALERTS = [
    { title: 'Weather Warning', msg: 'Adverse weather conditions detected. Move to designated indoor areas immediately.', color: 'bg-yellow-500' },
    { title: 'Schedule Disruption', msg: 'Multiple events are delayed by >1 hour. Update schedules in progress.', color: 'bg-orange-500' },
    { title: 'Evacuation', msg: 'EMERGENCY EVACUATION. Proceed to nearest exit calmly. Follow volunteer instructions.', color: 'bg-red-500' },
];

export default function EmergencyAlertsPage() {
    const [selectedPreset, setSelectedPreset] = useState<any>(null);

    return (
        <div className="p-6 md:p-8 max-w-[1000px] mx-auto">
             <div className="flex flex-col gap-4 mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-red-600 flex items-center gap-2">
                            <Siren className="w-8 h-8 animate-pulse" />
                            Crisis Communication
                        </h1>
                        <p className="text-sm text-[#6B7280]">Urgent broadcast system for critical incidents.</p>
                    </div>
                </div>
            </div>

            <div className="bg-red-50 border border-red-100 rounded-[18px] p-8 mb-8 text-center animate-in zoom-in-95 duration-300">
                <ShieldAlert className="w-16 h-16 text-red-600 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-red-900 mb-2">Emergency Override Active</h2>
                <p className="text-red-700 max-w-lg mx-auto mb-6">
                    Sending an alert from this console will <strong>override all active screens</strong> on student and admin portals. 
                    Push notifications will be sent with &quot;Critical&quot; priority sound.
                </p>
            </div>

            <h3 className="font-bold text-[#1A1A1A] mb-4">Quick Presets</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {PRESET_ALERTS.map((alert: any, i: any) => (
                    <button 
                        key={i}
                        onClick={() => setSelectedPreset(alert)}
                        className={`text-left p-6 rounded-2xl text-white shadow-lg transform hover:scale-105 transition-all
                        ${alert.color} ring-4 ring-transparent hover:ring-offset-2 hover:ring-${alert.color.replace('bg-', '')}`}
                    >
                        <AlertTriangle className="w-8 h-8 mb-3 opacity-90" />
                        <h3 className="font-bold text-lg mb-1">{alert.title}</h3>
                        <p className="text-xs opacity-90 line-clamp-2">{alert.msg}</p>
                    </button>
                ))}
            </div>

            {selectedPreset && (
                <div className="bg-white border-2 border-red-200 rounded-[18px] p-6 shadow-xl animate-in fade-in slide-in-from-bottom-4">
                    <h3 className="font-bold text-red-600 mb-4">Confirm Broadcast</h3>
                     <div>
                        <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Message Preview</label>
                        <textarea 
                            rows={3} 
                            className="w-full px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-red-900 font-medium focus:outline-none"
                            defaultValue={selectedPreset.msg}
                        />
                    </div>
                    <div className="flex gap-4 mt-6">
                        <button className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200">
                            BROADCAST EMERGENCY ALERT
                        </button>
                         <button 
                            onClick={() => setSelectedPreset(null)}
                            className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
