'use client';
import { Save, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import { useToast } from '@/hooks/useToast';

export default function PortalSettingsPage() {
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();

    return (
        <div className="p-6 md:p-8 max-w-[1000px] mx-auto">
            <div className="flex flex-col gap-4 mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1A1A1A]">Global Portal Configuration</h1>
                        <p className="text-sm text-[#6B7280]">Configure features and restrictions for all branch portals.</p>
                    </div>
                    <button
                        onClick={() => showToast('Global portal settings updated successfully', 'success')}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#1A1A1A] text-white rounded-xl text-sm font-medium hover:bg-[#2D2D2D] transition-colors shadow-lg shadow-gray-200">
                        <Save className="w-4 h-4" />
                        Save Changes
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {/* Feature Toggles */}
                <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
                    <div className="bg-white rounded-[14px] p-6">
                        <h3 className="text-lg font-bold text-[#1A1A1A] mb-1">Feature Availability</h3>
                        <p className="text-sm text-gray-500 mb-6">Enable or disable modules visible to students.</p>

                        <div className="space-y-4">
                            {[
                                { label: 'Event Registration', desc: 'Allow students to register for events', active: true },
                                { label: 'Gallery Uploads', desc: 'Allow users to submit photos for approval', active: true },
                                { label: 'Live Results', desc: 'Show sports and competition results publicly', active: false },
                                { label: 'Comment System', desc: 'Enable comments on event pages', active: false },
                            ].map((feature: any, i: any) => (
                                <div key={i} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                                    <div>
                                        <div className="font-semibold text-[#1A1A1A]">{feature.label}</div>
                                        <div className="text-sm text-gray-500">{feature.desc}</div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" defaultChecked={feature.active} />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A1A1A]"></div>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Limits */}
                <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
                    <div className="bg-white rounded-[14px] p-6">
                        <h3 className="text-lg font-bold text-[#1A1A1A] mb-6">Rate Limits & Quotas</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Max Events per Branch</label>
                                <input type="number" defaultValue={20} className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Max Registrations (Student)</label>
                                <input type="number" defaultValue={5} className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Upload Size Limit (MB)</label>
                                <input type="number" defaultValue={10} className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]" />
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-yellow-50 rounded-xl flex gap-3 text-yellow-800 text-sm">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p>Warning: Changing quotas will apply immediately. Students exceeding new limits won&apos;t be blocked until their next action.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
