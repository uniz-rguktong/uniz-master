'use client';

import { useState, useEffect } from 'react';
import {
    Trophy,
    Users,
    Award,
    Medal,
    ChevronRight,
    CheckCircle2,
    MousePointerClick,
    Send,
    Settings2,
    LayoutTemplate,
    Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    getEventsForCertificates,
    getSportsForCertificates,
    saveCertificateConfiguration,
    saveSportCertificateConfiguration,
    distributeCertificates,
    distributeSportCertificates,
    getCertificateThemes
} from '@/actions/certificateActions';

interface CertificatesPageProps {
    variant?: 'admin' | 'clubs' | 'sports' | 'hho';
}

export default function CertificatesPage({ variant = 'admin' }: CertificatesPageProps) {
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [events, setEvents] = useState<any[]>([]);
    const [certificateThemes, setCertificateThemes] = useState<any[]>([]);
    const [selectedEventId, setSelectedEventId] = useState("");

    const [selectedTheme, setSelectedTheme] = useState<any>(null);
    const [isConfirming, setIsConfirming] = useState(false);
    const [isConfigured, setIsConfigured] = useState(false);
    const [isDistributing, setIsDistributing] = useState(false);
    const [distributionStatus, setDistributionStatus] = useState("DRAFT"); // DRAFT, CONFIGURED, DISTRIBUTED
    const [templates, setTemplates] = useState<any>({
        first: true,
        second: true,
        third: true,
        participation: true
    });
    const entityLabel = variant === 'sports' ? 'Sport' : 'Event';
    const entityLabelLower = entityLabel.toLowerCase();

    // Fetch data on mount
    useEffect(() => {
        async function fetchData() {
            try {
                const [eventsRes, themesRes] = await Promise.all([
                    variant === 'sports' ? getSportsForCertificates() : getEventsForCertificates(),
                    getCertificateThemes()
                ]);

                if (eventsRes.success && eventsRes.data) {
                    setEvents(eventsRes.data as any);
                } else {
                    showToast(eventsRes.error || `Failed to fetch ${entityLabelLower}s`, 'error');
                }

                if (themesRes.success && themesRes.data) {
                    setCertificateThemes(themesRes.data as any);
                } else {
                    showToast(themesRes.error || "Failed to fetch themes", 'error');
                }
            } catch (err: any) {
                showToast("An unexpected error occurred: " + err.message, 'error');
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [showToast, variant, entityLabelLower]);

    // Update state when event changes
    useEffect(() => {
        if (selectedEventId && certificateThemes.length > 0) {
            const event = events.find(e => e.id === selectedEventId);
            if (event) {
                if (event.certificateTheme) {
                    const theme = certificateThemes.find(t => t.id === event.certificateTheme);
                    setSelectedTheme(theme || null);
                } else {
                    setSelectedTheme(null);
                }

                setIsConfigured(event.certificateStatus === 'CONFIGURED' || event.certificateStatus === 'DISTRIBUTED');
                setDistributionStatus(event.certificateStatus);
            }
        } else {
            setSelectedTheme(null);
            setIsConfigured(false);
            setDistributionStatus("DRAFT");
        }
    }, [selectedEventId, events, certificateThemes]);

    const handleTemplateUpload = (label: string) => {
        showToast(`${label} template set to Default`, 'success');
    };

    const handleConfirmTheme = async () => {
        if (!selectedEventId) {
            showToast(`Please select a ${entityLabelLower} first`, 'error');
            return;
        }
        if (!selectedTheme) {
            showToast("Please select a certificate theme", 'error');
            return;
        }

        setIsConfirming(true);

        try {
            const result = variant === 'sports'
                ? await saveSportCertificateConfiguration(selectedEventId, {
                    themeId: selectedTheme.id,
                    templates: templates
                })
                : await saveCertificateConfiguration(selectedEventId, {
                    themeId: selectedTheme.id,
                    templates: templates
                });

            if (result.success) {
                setIsConfigured(true);
                setDistributionStatus('CONFIGURED');
                showToast(`Theme configured successfully`, 'success');
                setEvents(prev => prev.map(e => e.id === selectedEventId ? { ...e, certificateStatus: 'CONFIGURED', certificateTheme: selectedTheme.id } : e));
            } else {
                showToast(result.error || "Failed to save configuration", 'error');
            }
        } catch (err) {
            showToast("Failed to save configuration", 'error');
        } finally {
            setIsConfirming(false);
        }
    };

    const handleDistribute = async () => {
        setIsDistributing(true);
        try {
            const result = variant === 'sports'
                ? await distributeSportCertificates(selectedEventId)
                : await distributeCertificates(selectedEventId);
            if (result.success) {
                setDistributionStatus('DISTRIBUTED');
                showToast(result.message || `Certificates distributed successfully!`, 'success');
                setEvents(prev => prev.map(e => e.id === selectedEventId ? { ...e, certificateStatus: 'DISTRIBUTED' } : e));
            } else {
                showToast(result.error || "Failed to distribute certificates", 'error');
            }
        } catch (err) {
            showToast("Failed to distribute certificates", 'error');
        } finally {
            setIsDistributing(false);
        }
    };

    const selectedEventTitle = events.find(e => e.id === selectedEventId)?.title || "Not selected";

    return (
        <div className="p-8 animate-page-entrance">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-wrap items-center gap-2 text-sm text-[#6B7280] mb-3">
                    <span>Dashboard</span>
                    <ChevronRight className="w-3 h-3" />
                    <span>Content Management</span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-[#1A1A1A] font-medium">Certificates</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-[28px] font-semibold text-[#1A1A1A] mb-2">{entityLabel} Certificates</h1>
                        <p className="text-sm text-[#6B7280]">Select themes and manage certificate distribution for {entityLabelLower}s</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-[#F4F2F0] rounded-[24px] p-[15px]">
                        <h3 className="text-lg font-bold text-[#1A1A1A] mb-[15px] flex items-center gap-2">
                            <Settings2 className="w-5 h-5 text-[#3B82F6]" />
                            1. Select {entityLabel}
                        </h3>
                        <div className="bg-white rounded-[18px] shadow-sm border border-[#E5E7EB] p-6">
                            {isLoading ? (
                                <Skeleton className="w-full h-12 rounded-xl" />
                            ) : (
                                <Select
                                    value={selectedEventId}
                                    onValueChange={setSelectedEventId}
                                >
                                    <SelectTrigger className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-xl text-sm focus:ring-2 focus:ring-[#1A1A1A]">
                                        <SelectValue placeholder={`Choose a ${entityLabelLower}...`} />
                                    </SelectTrigger>
                                    <SelectContent className="">
                                        {events.map(event => (
                                            <SelectItem key={event.id} value={event.id} className="">
                                                {event.title} ({new Date(event.date).toLocaleDateString()}) - {event.certificateStatus}
                                            </SelectItem>
                                        ))}
                                        {events.length === 0 && <SelectItem value="no-events" disabled className="">No {entityLabelLower}s found</SelectItem>}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </div>

                    <div className="bg-[#F4F2F0] rounded-[24px] p-[15px]">
                        <h3 className="text-lg font-bold text-[#1A1A1A] mb-[15px] flex items-center gap-2">
                            <Award className="w-5 h-5 text-[#F59E0B]" />
                            2. Select Certificate Theme
                        </h3>
                        <div className="bg-white rounded-[18px] shadow-sm border border-[#E5E7EB] p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {isLoading ? (
                                    <>
                                        {[1, 2, 3].map((i: any) => (
                                            <div key={i} className="rounded-xl border-2 border-transparent overflow-hidden bg-[#F9FAFB]">
                                                <Skeleton className="w-full h-32 rounded-none" />
                                                <div className="p-3 bg-white">
                                                    <Skeleton className="w-3/5 h-4 mb-2" />
                                                    <Skeleton className="w-2/5 h-3" />
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                ) : (
                                    certificateThemes.map((theme: any) => (
                                        <div
                                            key={theme.id}
                                            onClick={() => selectedEventId && setSelectedTheme(theme)}
                                            className={`relative cursor-pointer group rounded-xl border-2 transition-all overflow-hidden ${selectedTheme?.id === theme.id ? 'border-[#1A1A1A] shadow-lg' : 'border-transparent hover:border-[#E5E7EB]'
                                                }`}
                                        >
                                            <div className="w-full h-32 relative overflow-hidden bg-gray-100">
                                                <Image
                                                    src={theme.preview}
                                                    alt={theme.name}
                                                    fill
                                                    className="object-cover transition-transform group-hover:scale-105"
                                                />
                                            </div>
                                            <div className="p-3 bg-white">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm font-semibold text-[#1A1A1A]">{theme.name}</span>
                                                    {selectedTheme?.id === theme.id && <CheckCircle2 className="w-4 h-4 text-[#10B981]" />}
                                                </div>
                                                <p className="text-[11px] text-[#6B7280]">{theme.style}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {selectedTheme && (
                        <div className="bg-[#F4F2F0] rounded-[24px] p-[15px]">
                            <h3 className="text-lg font-bold text-[#1A1A1A] mb-[15px] flex items-center gap-2">
                                <LayoutTemplate className="w-5 h-5 text-[#10B981]" />
                                3. Theme Templates
                            </h3>
                            <div className="bg-white rounded-[18px] shadow-sm border border-[#E5E7EB] p-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { label: "1st Prize", image: "https://pub-d189280ec8be47c6a7f90812775baa54.r2.dev/certificates/themes/gold_bg.png", color: "#D4AF37", key: 'first' as const },
                                        { label: "2nd Prize", image: "https://pub-d189280ec8be47c6a7f90812775baa54.r2.dev/certificates/themes/silver_bg.jpeg", color: "#C0C0C0", key: 'second' as const },
                                        { label: "3rd Prize", image: "https://pub-d189280ec8be47c6a7f90812775baa54.r2.dev/certificates/themes/bronze_bg.jpeg", color: "#CD7F32", key: 'third' as const },
                                        { label: "Participation", image: "https://pub-d189280ec8be47c6a7f90812775baa54.r2.dev/certificates/themes/participation_bg.png", color: "#3B82F6", key: 'participation' as const }
                                    ].map((type: any) => {
                                        const isUploaded = templates[type.key];
                                        return (
                                            <div
                                                key={type.label}
                                                onClick={() => handleTemplateUpload(type.label)}
                                                className={`relative rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${isUploaded ? 'border-[#10B981]' : 'border-[#E5E7EB] hover:border-[#3B82F6]'
                                                    }`}
                                            >
                                                <div className="relative h-32 bg-gray-100">
                                                    <Image
                                                        src={type.image}
                                                        alt={type.label}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                    {isUploaded && (
                                                        <div className="absolute top-2 right-2 bg-[#10B981] rounded-full p-1">
                                                            <CheckCircle2 className="w-4 h-4 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-3 bg-white text-center">
                                                    <span className="text-xs font-semibold text-[#1A1A1A]">{type.label}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-8">
                    <div className="bg-[#F4F2F0] rounded-[24px] p-[15px]">
                        <h3 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider mb-[15px] flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-[#3B82F6]" />
                            Configuration Summary
                        </h3>
                        <div className="bg-white rounded-[18px] shadow-sm border border-[#E5E7EB] p-6">
                            <div className="space-y-4 mb-8">
                                {isLoading ? (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <Skeleton className="w-20 h-4" />
                                            <Skeleton className="w-24 h-4" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-[#6B7280]">Event</span>
                                            <span className="font-medium text-[#1A1A1A] truncate max-w-[150px]">{selectedEventTitle}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-[#6B7280]">Theme</span>
                                            <span className="font-medium text-[#1A1A1A]">{selectedTheme?.name || "Not selected"}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-[#6B7280]">Templates</span>
                                            <span className={Object.values(templates).every(Boolean) ? "text-[#10B981] font-medium" : "text-[#F59E0B] font-medium"}>
                                                {Object.values(templates).filter(Boolean).length === 4 ? "Ready (4/4)" : `Pending (${Object.values(templates).filter(Boolean).length}/4)`}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-[#6B7280]">Status</span>
                                            <span className={`font-medium ${distributionStatus === 'DISTRIBUTED' ? 'text-green-600' : 'text-orange-500'}`}>
                                                {distributionStatus}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>

                            <button
                                onClick={handleConfirmTheme}
                                disabled={isConfirming || !selectedTheme || !selectedEventId}
                                className="w-full py-4 bg-[#1A1A1A] text-white rounded-xl font-semibold hover:bg-[#2D2D2D] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isConfirming ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-5 h-5" />
                                        {isConfigured ? 'Update Configuration' : 'Confirm & Apply Theme'}
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleDistribute}
                                disabled={!isConfigured || isDistributing}
                                className={`w-full mt-3 py-4 border-2 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${(!isConfigured)
                                    ? 'bg-[#F3F4F6] border-transparent text-[#9CA3AF] cursor-not-allowed'
                                    : 'bg-white border-[#E5E7EB] text-[#1A1A1A] hover:bg-[#F7F8FA]'
                                    }`}
                            >
                                {isDistributing ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className={`w-5 h-5 ${!isConfigured ? 'text-[#9CA3AF]' : 'text-[#3B82F6]'}`} />
                                )}
                                {distributionStatus === 'DISTRIBUTED' ? 'Re-distribute Certificates' : 'Distribute Certificates'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
