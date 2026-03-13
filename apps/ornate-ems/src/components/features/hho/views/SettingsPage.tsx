'use client';

import { useState, useRef, useEffect } from 'react';
import { Building2, Mail, Phone, Upload, Trash2, Save, Globe, Info, Award, Users, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { getHHOSettings, updateHHOSettings } from '@/actions/settingsActions';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';

const hhoSettingsSchema = z.object({
    name: z.string().min(2, 'Organization name is required'),
    shortName: z.string().min(2, 'Short name is required'),
    coordinator: z.string().min(2, 'Coordinator name is required'),
    establishedYear: z.string().regex(/^(19|20)\d{2}$/, 'Valid year required (1900-2099)'),
    description: z.string().min(10, 'Mission statement should be at least 10 characters'),
    email: z.string().email('Valid email is required'),
    phone: z.string().regex(/^[0-9]{10}$/, '10-digit phone number is required'),
    logo: z.any().nullable().optional()
});

type HHOSettingsValues = z.infer<typeof hhoSettingsSchema>;

export function SettingsPage() {
    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({ volunteers: 0, events: 0, fundsRaised: "₹0" });

    const { register, handleSubmit, reset, setValue, watch, formState: { errors, isDirty, isSubmitting } } = useForm<HHOSettingsValues>({
        resolver: zodResolver(hhoSettingsSchema),
        defaultValues: {
            name: '',
            shortName: 'HHO',
            coordinator: '',
            establishedYear: '2015',
            description: '',
            email: '',
            phone: '',
            logo: null
        }
    });

    const logo = watch('logo');

    useEffect(() => {
        async function fetchSettings() {
            setIsLoading(true);
            const result = await getHHOSettings();
            if (result.success && result.data) {
                reset({
                    name: result.data.name || "",
                    shortName: "HHO",
                    coordinator: result.data.designation || "",
                    establishedYear: "2015",
                    description: result.data.bio || "",
                    email: result.data.email || "",
                    phone: result.data.phone || "",
                    logo: result.data.profilePicture || null
                });
                if (result.data.stats) setStats(result.data.stats);
            } else {
                showToast(result.error || "Failed to load settings", "error");
            }
            setIsLoading(false);
        }
        fetchSettings();
    }, [reset, showToast]);

    const onSave = async (data: HHOSettingsValues) => {
        const result = await updateHHOSettings(data);
        if (result.success) {
            showToast("Organization settings synchronized", "success");
            reset(data);
        } else {
            showToast(result.error || "Failed to sync settings", "error");
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                showToast("File size too large (Max 2MB)", "error");
                return;
            }
            const imageUrl = URL.createObjectURL(file);
            setValue('logo', imageUrl, { shouldDirty: true });
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 space-y-8 animate-pulse">
                <div className="space-y-4">
                    <div className="h-8 bg-gray-100 rounded-xl w-64" />
                    <div className="h-4 bg-gray-100 rounded-lg w-96" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 h-[600px] bg-gray-50 rounded-[32px]" />
                    <div className="h-[400px] bg-gray-50 rounded-[32px]" />
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 animate-page-entrance max-w-7xl mx-auto">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                        <span>Dashboard</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span>HHO Control</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span className="text-indigo-600">Profile Settings</span>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Organization Profile</h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">Refine how HHO appears across the platform</p>
                </div>

                <button
                    onClick={handleSubmit(onSave)}
                    disabled={!isDirty || isSubmitting}
                    className={`flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-xl active:scale-[0.98] ${isDirty && !isSubmitting
                        ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                        }`}>
                    <Save className="w-4 h-4" />
                    {isSubmitting ? 'Syncing...' : 'Save Profile'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Main Config Form */}
                <div className="lg:col-span-2 space-y-10">
                    {/* Core Identity */}
                    <div className="bg-[#F4F2F0] rounded-[32px] p-2">
                        <div className="bg-white rounded-[28px] p-8 border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                                    <Globe className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Core Identity</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Public Information</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Organization Name</label>
                                        <Input {...register('name')} placeholder="Helping Hands Organization" error={errors.name?.message} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Acronym</label>
                                        <Input {...register('shortName')} placeholder="HHO" error={errors.shortName?.message} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Lead Coordinator</label>
                                        <Input {...register('coordinator')} placeholder="Full Name" error={errors.coordinator?.message} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Established</label>
                                        <Input {...register('establishedYear')} type="number" placeholder="2015" error={errors.establishedYear?.message} />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Mission Statement</label>
                                    <textarea
                                        {...register('description')}
                                        rows={5}
                                        placeholder="Our primary objective is to..."
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none leading-relaxed" />
                                    {errors.description && <p className="text-[10px] text-red-500 font-bold ml-1 mt-1">{errors.description.message}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Channels */}
                    <div className="bg-[#F4F2F0] rounded-[32px] p-2">
                        <div className="bg-white rounded-[28px] p-8 border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                                    <Info className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Communication</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Public Contact Points</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                        <Mail className="w-3.5 h-3.5" /> Official Inbox
                                    </label>
                                    <Input {...register('email')} readOnly className="bg-gray-50 text-gray-500 border-none opacity-80 cursor-not-allowed" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                        <Phone className="w-3.5 h-3.5" /> Hotline Number
                                    </label>
                                    <Input {...register('phone')} placeholder="91XXXXXXXX" error={errors.phone?.message} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Assets */}
                <div className="space-y-8">
                    {/* Visual Brand */}
                    <div className="bg-[#F4F2F0] rounded-[32px] p-2">
                        <div className="bg-white rounded-[28px] p-8 border border-gray-100 shadow-sm text-center">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Visual Marketplace</h3>

                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

                            <div className="relative group mx-auto mb-6">
                                <div className="w-32 h-32 mx-auto bg-gray-50 rounded-[32px] flex items-center justify-center border-2 border-dashed border-gray-200 overflow-hidden shadow-inner group-hover:border-indigo-400 transition-colors">
                                    {logo ? (
                                        <img src={logo} alt="HHO Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <Building2 className="w-10 h-10 text-gray-300" />
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-[32px] transition-opacity flex items-center justify-center text-white text-[10px] font-bold uppercase tracking-widest backdrop-blur-[2px]">
                                    Upload New
                                </button>
                            </div>

                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">
                                    Select Image
                                </button>
                                {logo && (
                                    <button
                                        onClick={() => setValue('logo', null, { shouldDirty: true })}
                                        className="w-full py-3 text-rose-500 hover:bg-rose-50 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">
                                        Clear Current
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Impact Stats */}
                    <div className="bg-[#F4F2F0] rounded-[32px] p-2">
                        <div className="bg-white rounded-[28px] p-6 border border-gray-100 shadow-sm">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 px-2">Live Impact Feed</h3>
                            <div className="space-y-4">
                                {[
                                    { label: 'Volunteers', value: stats.volunteers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                                    { label: 'Total Events', value: stats.events, icon: Calendar, color: 'text-violet-600', bg: 'bg-violet-50' },
                                    { label: 'Funds Raised', value: stats.fundsRaised, icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-50' }
                                ].map((stat, i) => (
                                    <div key={i} className={`flex items-center justify-between p-4 ${stat.bg} rounded-2xl hover:scale-[1.02] transition-transform`}>
                                        <div className="flex items-center gap-3">
                                            <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                            <span className="text-[11px] font-bold text-gray-600">{stat.label}</span>
                                        </div>
                                        <span className={`text-sm font-black ${stat.color}`}>{stat.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
