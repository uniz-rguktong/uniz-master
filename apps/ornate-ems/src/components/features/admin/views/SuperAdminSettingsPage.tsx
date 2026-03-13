'use client';
import { useState, useRef } from 'react';
import { Building2, Mail, Phone, Upload, Trash2, Save, Shield, Globe } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { InfoTooltip } from '@/components/InfoTooltip';

export function SuperAdminSettingsPage() {
    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Mock Super Admin Data
    const [formData, setFormData] = useState<any>({
        name: "Ornate University Management System",
        shortName: "OUMS",
        coordinator: "Admin Headquarters",
        establishedYear: "2024",
        description: "Centralized control system for managing all university-level fests, departmental activities, and sports events. Ensuring seamless coordination across all administrative portals.",
        email: "admin.hq@university.edu",
        phone: "+91 65432 10987",
        logo: null,
        stats: {
            totalUsers: 15400,
            activePortals: 12,
            globalEvents: 56
        }
    });

    const [hasChanges, setHasChanges] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({
            ...prev,
            [name]: value
        }));
        setHasChanges(true);
    };

    const handleSave = () => {
        // API call simulation
        setTimeout(() => {
            setHasChanges(false);
            showToast("Global system settings saved successfully", "success");
        }, 800);
    };

    const handleLogoUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: any) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit for super admin
                showToast("File size too large. Maximum size is 5MB.", "error");
                return;
            }

            const imageUrl = URL.createObjectURL(file);
            setFormData((prev: any) => ({
                ...prev,
                logo: imageUrl
            }));
            setHasChanges(true);
            showToast("Global logo selected. Click save to apply changes.", "info");
        }
    };

    return (
        <div className="p-8 animate-page-entrance">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
                    <span>Super Admin</span>
                    <span>›</span>
                    <span>Global Settings</span>
                    <span>›</span>
                    <span className="text-[#1A1A1A] font-medium">System Configuration</span>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl md:text-[28px] font-semibold text-[#1A1A1A] mb-2">Global System Settings</h1>
                        <p className="text-sm text-[#6B7280]">Manage institutional identity and global system parameters</p>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={!hasChanges}
                        className={`flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium transition-colors shadow-sm ${hasChanges
                            ? "bg-indigo-600 text-white hover:bg-indigo-700"
                            : "bg-gray-200 text-gray-500 cursor-not-allowed"
                            }`}>
                        <Save className="w-5 h-5" />
                        Save Changes
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Settings */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Institutional Identity */}
                    <div className="bg-[#F4F2F0] rounded-[18px] p-[10px] animate-card-entrance" style={{ animationDelay: '40ms' }}>
                        <h3 className="text-lg font-semibold text-[#1A1A1A] mb-3 pl-[5px] pt-[15px] pb-[5px] flex items-center gap-2">
                            Institutional Identity
                            <InfoTooltip text="Primary branding for the entire management system." />
                        </h3>

                        <div className="bg-white rounded-[14px] p-6 shadow-sm">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                                        System Name <span className="text-[#EF4444]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                                        System Acronym
                                    </label>
                                    <input
                                        type="text"
                                        name="shortName"
                                        value={formData.shortName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                                        Primary Admin Entity
                                    </label>
                                    <input
                                        type="text"
                                        name="coordinator"
                                        value={formData.coordinator}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                                        System Launch Year
                                    </label>
                                    <input
                                        type="number"
                                        name="establishedYear"
                                        value={formData.establishedYear}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                                        System Description
                                    </label>
                                    <textarea
                                        rows={4}
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Support & Support Contact */}
                    <div className="bg-[#F4F2F0] rounded-[18px] p-[10px] animate-card-entrance" style={{ animationDelay: '80ms' }}>
                        <h3 className="text-lg font-semibold text-[#1A1A1A] mb-3 pl-[5px] pt-[15px] pb-[5px] flex items-center gap-2">
                            Global Support Channels
                            <InfoTooltip text="Contacts for system-wide technical support." />
                        </h3>

                        <div className="bg-white rounded-[14px] p-6 shadow-sm">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-[#6B7280]" />
                                            Admin Support Email
                                        </div>
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-[#6B7280]" />
                                            Emergency Tech Support
                                        </div>
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Global System Logo */}
                    <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
                        <h3 className="text-base font-semibold text-[#1A1A1A] mb-3 pl-[5px] pt-[15px] pb-[5px] flex items-center gap-2">
                            Global System Logo
                            <InfoTooltip text="Master logo applied globally across all portals." />
                        </h3>

                        <div className="bg-white rounded-[14px] p-6 shadow-sm">
                            <div className="text-center">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    className="hidden"
                                />

                                <div
                                    className="w-32 h-32 mx-auto mb-4 bg-linear-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center border-2 border-transparent overflow-hidden relative shadow-inner"
                                >
                                    {formData.logo ? (
                                        <img src={formData.logo} alt="Global Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <Globe className="w-12 h-12 text-white opacity-80" />
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={handleLogoUploadClick}
                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg text-sm font-medium text-indigo-700 transition-colors mx-auto w-full"
                                    >
                                        <Upload className="w-4 h-4" />
                                        {formData.logo ? 'Update Master Logo' : 'Upload Master Logo'}
                                    </button>
                                    {formData.logo && (
                                        <button
                                            onClick={() => {
                                                setFormData((prev: any) => ({ ...prev, logo: null }));
                                                setHasChanges(true);
                                            }}
                                            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] text-red-500 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors mx-auto w-full"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Remove
                                        </button>
                                    )}
                                </div>

                                <p className="text-xs text-[#6B7280] mt-3">
                                    Recommended: 1024x1024px, Transparent PNG
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* System Statistics */}
                    <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
                        <h3 className="text-base font-semibold text-[#1A1A1A] mb-3 pl-[5px] pt-[15px] pb-[5px] flex items-center gap-2">
                            System Overview
                            <InfoTooltip text="High-level system metrics." />
                        </h3>

                        <div className="bg-white rounded-[14px] overflow-hidden shadow-sm border border-[#E5E7EB]">
                            <table className="w-full">
                                <thead className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Metric</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Value</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F3F4F6]">
                                    <tr>
                                        <td className="px-6 py-4 text-sm font-medium text-[#6B7280]">Global Users</td>
                                        <td className="px-6 py-4 text-right text-sm font-bold text-[#1A1A1A]">{formData.stats.totalUsers.toLocaleString()}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 text-sm font-medium text-[#6B7280]">Active Portals</td>
                                        <td className="px-6 py-4 text-right text-sm font-bold text-[#1A1A1A]">{formData.stats.activePortals}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 text-sm font-medium text-[#6B7280]">Total Annual events</td>
                                        <td className="px-6 py-4 text-right text-sm font-bold text-[#1A1A1A]">{formData.stats.globalEvents}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
