/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
    Image as ImageIcon,
    Plus,
    Loader2,
    Eye,
    EyeOff,
    Type,
    AlignLeft,
    Link,
    CheckCircle2,
    X
} from "lucide-react";
import { BANNERS_BASE, UPDATE_BANNER_VISIBILITY } from "../../../api/endpoints";
import { toast } from "react-toastify";

export default function BannersSection() {
    const [banners, setBanners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // New Banner Form State
    const [newBanner, setNewBanner] = useState({
        title: "",
        text: "",
        imageUrl: "",
        isVisible: true
    });

    useEffect(() => {
        fetchBanners();
    }, []);

    const getAuthToken = () => {
        const rawToken = localStorage.getItem("admin_token");
        if (!rawToken) return "";
        try {
            return JSON.parse(rawToken);
        } catch (e) {
            return rawToken;
        }
    };

    const fetchBanners = async () => {
        setLoading(true);
        const token = getAuthToken();
        try {
            const res = await fetch(BANNERS_BASE, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.success) {
                setBanners(data.banners || []);
            } else {
                toast.error(data.msg || "Failed to fetch banners");
            }
        } catch (error) {
            toast.error("Error connecting to banner service");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBanner = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading("creating");
        const token = getAuthToken();
        try {
            const res = await fetch(BANNERS_BASE, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(newBanner)
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Banner created successfully");
                setShowAddModal(false);
                setNewBanner({ title: "", text: "", imageUrl: "", isVisible: true });
                fetchBanners();
            } else {
                toast.error(data.msg || "Creation failed");
            }
        } catch (error) {
            toast.error("Error creating banner");
        } finally {
            setActionLoading(null);
        }
    };

    const hideBanner = async (id: string) => {
        if (!id) {
            toast.error("Invalid Banner ID");
            return;
        }
        setActionLoading(id);
        const token = getAuthToken();
        console.log(`Setting visibility to hidden for Banner ${id}`);
        try {
            const res = await fetch(UPDATE_BANNER_VISIBILITY(id), {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ isVisible: false })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Banner hidden successfully");
                setBanners(prev => prev.map(b => (b.id === id || b._id === id || b.uuid === id) ? { ...b, isVisible: false } : b));
            } else {
                console.error("Hide banner failed:", data);
                toast.error(data.msg || "Failed to hide banner");
            }
        } catch (error) {
            console.error("Network error hiding banner:", error);
            toast.error("Error connecting to visibility service");
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500 pb-20 text-slate-900">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-col gap-2">
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 leading-tight">Banner Management</h2>
                    <p className="text-slate-500 font-medium">Create and control featured banners on the student home screen</p>
                </div>

                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl active:scale-95"
                >
                    <Plus size={18} />
                    New Banner
                </button>
            </div>

            {/* Banners Grid */}
            {loading ? (
                <div className="p-20 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="animate-spin w-10 h-10 text-slate-300" />
                    <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Loading banners...</p>
                </div>
            ) : banners.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {banners.map((banner) => {
                        const bannerId = banner.id || banner._id || banner.uuid;
                        return (
                            <div key={bannerId} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all overflow-hidden flex flex-col group relative">
                                {/* Preview Image */}
                                <div className="h-48 w-full bg-slate-50 relative overflow-hidden shrink-0 border-b border-slate-50">
                                    {banner.imageUrl ? (
                                        <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <ImageIcon size={48} strokeWidth={1} />
                                        </div>
                                    )}

                                    {/* Status Badge */}
                                    <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border backdrop-blur-md shadow-sm ${banner.isVisible ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                                        {banner.isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                                        {banner.isVisible ? 'Active' : 'Hidden'}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 flex flex-col flex-1">
                                    <h3 className="font-black text-slate-900 text-lg leading-tight mb-2 line-clamp-1">{banner.title}</h3>
                                    <p className="text-slate-500 font-medium text-sm line-clamp-2 leading-relaxed mb-6">{banner.text}</p>

                                    <div className="mt-auto flex items-center gap-3">
                                        {banner.isVisible && (
                                            <button
                                                onClick={() => hideBanner(bannerId)}
                                                disabled={actionLoading === bannerId}
                                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all border bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100"
                                            >
                                                {actionLoading === bannerId ? <Loader2 size={14} className="animate-spin" /> : <EyeOff size={14} />}
                                                Hide Banner
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="p-32 flex flex-col items-center justify-center text-center space-y-6 bg-white rounded-[3rem] border border-slate-50">
                    <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200">
                        <ImageIcon size={48} strokeWidth={1} />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-slate-900 tracking-tight">No Active Banners</p>
                        <p className="text-slate-400 font-medium mt-2 max-w-sm">Bring your campus to life by creating featured banners for events, announcements, or updates.</p>
                    </div>
                    <button onClick={() => setShowAddModal(true)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all">Add First Banner</button>
                </div>
            )}

            {/* Add Banner Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowAddModal(false)} />
                    <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
                        <div className="bg-slate-900 p-8 text-white relative flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-2xl">
                                <Plus size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black tracking-tight">New Banner</h3>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Configure Spotlight Content</p>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateBanner} className="p-10 space-y-8">
                            <div className="space-y-6">
                                {/* Title */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                                        <Type size={12} /> Banner Title
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={newBanner.title}
                                        onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                                        placeholder="e.g. UniZ v2.0 is Live!"
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-bold text-slate-900"
                                    />
                                </div>

                                {/* Text */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                                        <AlignLeft size={12} /> Body Content
                                    </label>
                                    <textarea
                                        required
                                        rows={3}
                                        value={newBanner.text}
                                        onChange={(e) => setNewBanner({ ...newBanner, text: e.target.value })}
                                        placeholder="Briefly describe what this banner is about..."
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-bold text-slate-900 resize-none"
                                    />
                                </div>

                                {/* Image URL */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                                        <Link size={12} /> Image URL
                                    </label>
                                    <input
                                        required
                                        type="url"
                                        value={newBanner.imageUrl}
                                        onChange={(e) => setNewBanner({ ...newBanner, imageUrl: e.target.value })}
                                        placeholder="https://images.unsplash.com/..."
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-bold text-slate-900"
                                    />
                                </div>

                                {/* Preview mini */}
                                {newBanner.imageUrl && (
                                    <div className="h-24 w-full rounded-2xl overflow-hidden border border-slate-200">
                                        <img src={newBanner.imageUrl} alt="preview" className="w-full h-full object-cover" onError={(e: any) => e.target.src = "https://placehold.co/600x400?text=Invalid+Image+URL"} />
                                    </div>
                                )}
                            </div>

                            <button
                                disabled={!!actionLoading}
                                type="submit"
                                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {actionLoading === "creating" ? <Loader2 className="animate-spin w-5 h-5" /> : <CheckCircle2 size={18} />}
                                Launch Banner
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
