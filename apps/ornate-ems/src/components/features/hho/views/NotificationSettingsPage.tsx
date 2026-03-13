'use client';
import { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, Save, ChevronRight, Settings, Info, Clock, AlertTriangle, ShieldCheck, Zap, RotateCcw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/useToast';

const notificationCategories = [
    {
        id: 'impact',
        name: 'Social Impact Lifecycle',
        description: 'Alerts for charity drives, volunteer ops, and donation milestones.',
        accent: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        settings: [
            { id: 'drive_created', label: 'New charity drive launched', email: true, push: true, sms: false },
            { id: 'drive_updated', label: 'Drive logistics updated', email: true, push: false, sms: false },
            { id: 'new_volunteer', label: 'New volunteer sign-up', email: true, push: true, sms: false },
            { id: 'donation_received', label: 'Significant donation milestone', email: true, push: false, sms: false },
            { id: 'vols_approved', label: 'Volunteer group approvals', email: true, push: true, sms: true }
        ]
    },

    {
        id: 'system',
        name: 'Critical Infrastructure',
        description: 'Security protocols, backup alerts, and HHO system logs.',
        accent: 'bg-rose-50 text-rose-600 border-rose-100',
        settings: [
            { id: 'security_alert', label: 'Unauthorized access', email: true, push: true, sms: true },
            { id: 'system_maintenance', label: 'Scheduled downtime', email: true, push: false, sms: false },
            { id: 'backup_completed', label: 'Impact data backup success', email: true, push: false, sms: false }
        ]
    }
];

export function NotificationSettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const { toast, showToast, hideToast } = useToast();

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1200);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto animate-page-entrance">

            {/* Breadcrumbs & Header */}
            <div className="mb-8">
                <div className="flex flex-wrap items-center gap-2 text-sm text-[#6B7280] mb-3">
                    <span>Dashboard</span>
                    <ChevronRight className="w-3 h-3" />
                    <span>Settings</span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-[#1A1A1A] font-medium">Notifications</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <div>
                        <h1 className="text-xl md:text-[28px] font-semibold text-[#1A1A1A] mb-2">Notifications</h1>
                        <p className="text-sm text-[#6B7280]">Manage HHO notification preferences and delivery channels</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => showToast('Settings reset to default', 'info')}
                            className="hidden md:flex items-center gap-2 px-5 py-3 bg-white border border-[#E5E7EB] text-[#1A1A1A] rounded-lg text-sm font-medium hover:bg-[#F9FAFB] transition-colors shadow-sm">
                            <RotateCcw className="w-4 h-4" />
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-12 space-y-8">
                    {/* Active Channels Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-[12px] mt-[10px] mb-[16px]">
                        <div className="flex items-center gap-4">
                            <div className="px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider border bg-emerald-50 text-emerald-600 border-emerald-100">
                                Active Channels
                            </div>
                            <p className="text-sm text-[#6B7280] hidden md:block">Manage global delivery platforms</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { icon: Mail, label: 'Email', bg: 'bg-indigo-50', text: 'text-indigo-600', checked: true },
                            { icon: Bell, label: 'Push', bg: 'bg-amber-50', text: 'text-amber-600', checked: true },
                            { icon: Smartphone, label: 'SMS', bg: 'bg-rose-50', text: 'text-rose-600', checked: false }
                        ].map((channel: any, i: any) => (
                            <div key={i} className="bg-[#F4F2F0] rounded-[18px] pt-2 pr-2 pb-6 pl-2 flex flex-col transition-all hover:scale-[1.02] duration-300">
                                <div className="bg-white rounded-[16px] w-full p-6 border border-gray-100 flex flex-col justify-between transition-all shadow-sm hover:shadow-md flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`${channel.bg} w-12 h-12 rounded-xl flex items-center justify-center ${channel.text}`}>
                                            <channel.icon className="w-6 h-6" />
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" defaultChecked={channel.checked} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
                                        </label>
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-[#1A1A1A]">{channel.label} Notifications</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Detailed Preferences */}
                    {isLoading ? (
                        <div className="bg-[#F4F2F0] rounded-[32px] p-2">
                            <div className="bg-white rounded-[24px] p-6 space-y-6">
                                {[...Array(3)].map((_: any, i: any) => (
                                    <div key={i} className="space-y-4">
                                        <Skeleton width="30%" height={20} />
                                        <Skeleton width="100%" height={120} borderRadius={16} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        notificationCategories.map((category: any) => (
                            <div key={category.id} className="bg-[#F4F2F0] rounded-[18px] pt-2 pr-2 pb-6 pl-2">
                                {/* Header Bar */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-[12px] mt-[10px] mb-[16px]">
                                    <div className="flex items-center gap-4">
                                        <div className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider border ${category.accent}`}>
                                            {category.name}
                                        </div>
                                        <p className="text-sm text-[#6B7280] hidden md:block">{category.description}</p>
                                    </div>
                                </div>

                                {/* White Inner Card */}
                                <div className="bg-white rounded-[14px] border border-[#E5E7EB] overflow-hidden shadow-sm">
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[600px]">
                                            <thead className="bg-white border-b border-[#F3F4F6]">
                                                <tr>
                                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Notification Trigger</th>
                                                    <th className="text-center px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                                                    <th className="text-center px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Push</th>
                                                    <th className="text-center px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">SMS</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {category.settings.map((setting: any, idx: any) => (
                                                    <tr key={setting.id} className={`border-b border-[#F3F4F6] row-hover-effect hover:bg-[#FAFAFA] transition-colors ${idx === category.settings.length - 1 ? 'border-b-0' : ''}`}>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm font-medium text-[#1A1A1A]">{setting.label}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex justify-center">
                                                                <label className="relative inline-flex items-center cursor-pointer">
                                                                    <input type="checkbox" defaultChecked={setting.email} className="sr-only peer" />
                                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
                                                                </label>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex justify-center">
                                                                <label className="relative inline-flex items-center cursor-pointer">
                                                                    <input type="checkbox" defaultChecked={setting.push} className="sr-only peer" />
                                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
                                                                </label>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex justify-center">
                                                                <label className="relative inline-flex items-center cursor-pointer">
                                                                    <input type="checkbox" defaultChecked={setting.sms} className="sr-only peer" />
                                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
                                                                </label>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="flex justify-end mt-8">
                <button
                    onClick={() => showToast('Notification preferences saved', 'success')}
                    className="flex items-center gap-2 px-5 py-3 bg-[#10B981] text-white rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors shadow-sm">
                    <Save className="w-5 h-5" />
                    Save Changes
                </button>
            </div>
        </div>
    );
}
