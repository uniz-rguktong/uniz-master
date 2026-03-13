'use client';
import { useState, useEffect } from 'react';
import {
    Mail,
    Phone,
    MapPin,
    Send,
    ChevronRight,
    Headset,
    ShieldCheck,
    Cpu,
    Zap,
    ArrowUpRight,
    MessageCircle
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';

export function ContactUsPage() {
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [subject, setSubject] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const handleSubmit = (e: any) => {
        e.preventDefault();
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            showToast("Tactical support request broadcasted successfully.", "success");
            setSubject("");
            e.target.reset();
        }, 1500);
    };

    return (
        <div className="p-8 md:p-12 animate-page-entrance min-h-screen bg-gray-50/20">
            {/* Mission Briefing */}
            <div className="max-w-7xl mx-auto mb-16 space-y-8">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-600 rounded-[22px] flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                        <Headset className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                            System Node <ChevronRight className="w-3 h-3" /> Communication Uplink
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Direct <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-600">Interlink</span></h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-8 bg-white rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <ShieldCheck className="w-16 h-16 text-emerald-500" />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Uptime Protocol</p>
                        <h3 className="text-2xl font-black text-gray-900">99.9% Reliable</h3>
                        <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase">Tactical response window 4-8hr</p>
                    </div>
                    <div className="p-8 bg-white rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <Cpu className="w-16 h-16 text-indigo-500" />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Compute Status</p>
                        <h3 className="text-2xl font-black text-gray-900">Edge Support</h3>
                        <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase">Distributed intelligence network</p>
                    </div>
                    <div className="p-8 bg-[#1A1A1A] rounded-[40px] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-20">
                            <Zap className="w-16 h-16 text-amber-400" />
                        </div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Response Speed</p>
                        <h3 className="text-2xl font-black text-white">Priority Relay</h3>
                        <p className="text-[10px] font-bold text-gray-500 mt-2 uppercase">High bandwidth support channels</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Deployment Matrix (Form) */}
                <div className="lg:col-span-8">
                    <div className="bg-[#F4F2F0] rounded-[64px] p-3 shadow-inner">
                        <div className="bg-white rounded-[56px] p-12 border border-white shadow-xl">
                            <div className="flex items-center gap-4 mb-12">
                                <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center">
                                    <MessageCircle className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Transmission Interface</h2>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Initialize encrypted message packet</p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-10">
                                {isLoading ? (
                                    <div className="space-y-8 animate-pulse">
                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="h-14 bg-gray-50 rounded-2xl" />
                                            <div className="h-14 bg-gray-50 rounded-2xl" />
                                        </div>
                                        <div className="h-14 bg-gray-50 rounded-2xl" />
                                        <div className="h-40 bg-gray-50 rounded-2xl" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Relay Name</label>
                                                <input
                                                    required
                                                    type="text"
                                                    placeholder="Liaison Identity"
                                                    className="w-full px-6 py-4.5 bg-gray-50/50 border border-transparent rounded-[24px] text-xs font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all shadow-inner"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Network Address</label>
                                                <input
                                                    required
                                                    type="email"
                                                    placeholder="liaison@cluster.io"
                                                    className="w-full px-6 py-4.5 bg-gray-50/50 border border-transparent rounded-[24px] text-xs font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all shadow-inner"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Subject Frequency</label>
                                            <Select value={subject} onValueChange={setSubject}>
                                                <SelectTrigger className="w-full h-14 rounded-[24px] border-none bg-gray-50/50 px-6 font-bold text-xs focus:ring-4 focus:ring-indigo-500/10 shadow-inner">
                                                    <SelectValue placeholder="Select tactical sector..." />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                                                    <SelectItem value="volunteer_issue">Volunteer Distribution</SelectItem>
                                                    <SelectItem value="event_approval">Event Propulsion</SelectItem>
                                                    <SelectItem value="donation_report">Donation Node Conflict</SelectItem>
                                                    <SelectItem value="general">Global Support Matrix</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data Payload</label>
                                            <textarea
                                                required
                                                rows={6}
                                                placeholder="Describe the system anomaly or tactical requirements..."
                                                className="w-full px-6 py-5 bg-gray-50/50 border border-transparent rounded-[32px] text-xs font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all shadow-inner resize-none leading-relaxed"
                                            ></textarea>
                                        </div>

                                        <div className="pt-4 flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="group px-12 py-5 bg-gray-900 text-white rounded-[28px] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-gray-200 hover:bg-black active:scale-95 transition-all flex items-center gap-4 disabled:opacity-50"
                                            >
                                                {isSubmitting ? 'Synchronizing...' : 'Execute Broadcast'}
                                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:rotate-12 transition-transform">
                                                    <Send className="w-4 h-4 text-emerald-400" />
                                                </div>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </form>
                        </div>
                    </div>
                </div>

                {/* Sidebar Frequency Points */}
                <div className="lg:col-span-4 space-y-8">
                    {[
                        { icon: Mail, label: "Direct Uplink", value: "ops@hho-node.com", sub: "Latency: < 4hrs", color: "text-blue-500", bg: "bg-blue-50" },
                        { icon: Phone, label: "Flash Emergency", value: "+1 (555) ORN-ATE", sub: "Critical failures only", color: "text-emerald-500", bg: "bg-emerald-50" },
                        { icon: MapPin, label: "Physical Node", value: "Sector 7, Alpha Base", sub: "Regional HQ", color: "text-amber-500", bg: "bg-amber-50" }
                    ].map((point, i) => (
                        <div key={i} className="bg-[#F4F2F0] rounded-[40px] p-2 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-50/50 group duration-500">
                            <div className="bg-white rounded-[32px] p-8 border border-white shadow-sm flex items-start gap-6">
                                <div className={`w-16 h-16 ${point.bg} rounded-[24px] flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                                    <point.icon className={`w-8 h-8 ${point.color}`} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{point.label}</h3>
                                    <p className="text-sm font-black text-gray-900">{point.value}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase opacity-60">{point.sub}</p>
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="mt-8 p-10 bg-indigo-600 rounded-[48px] text-white space-y-6 relative overflow-hidden shadow-2xl shadow-indigo-100">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2" />
                        <Zap className="w-10 h-10 text-white/50" />
                        <h4 className="text-2xl font-black tracking-tight leading-tight italic">&quot;Swift response is the core of reliable infrastructure.&quot;</h4>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Ornate Intelligence</span>
                            <div className="w-8 h-px bg-white/30" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
