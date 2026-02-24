/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
    Bell,
    Plus,
    Loader2,
    Type,
    AlignLeft,
    Link as LinkIcon,
    CheckCircle2,
    X,

    ExternalLink,
    AlertCircle
} from "lucide-react";
import { UPDATES_BASE, GET_NOTIFICATIONS } from "../../../api/endpoints";
import { toast } from "react-toastify";

export default function UpdatesSection() {
    const [updates, setUpdates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // New Update Form State
    const [newUpdate, setNewUpdate] = useState({
        title: "",
        content: "",
        link: "",
        isVisible: true
    });

    useEffect(() => {
        fetchUpdates();
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

    const fetchUpdates = async () => {
        setLoading(true);
        const primaryUrl = "https://api.uniz.rguktong.in/api/v1/cms/notifications";
        const proxyUrl = GET_NOTIFICATIONS;

        console.log("CMS_SYNC: Initiating sync with primary endpoint:", primaryUrl);

        const tryFetch = async (url: string) => {
            try {
                const res = await fetch(url, {
                    method: "GET",
                    headers: {
                        "x-cms-api-key": "uniz-landing-v1-key",
                        "Content-Type": "application/json"
                    },
                    redirect: "follow"
                });
                if (!res.ok) return null;
                const data = await res.json();

                // Deep search for notifications array
                const findArray = (obj: any): any[] | null => {
                    if (Array.isArray(obj)) return obj;
                    if (typeof obj !== 'object' || obj === null) return null;
                    if (obj.notifications && Array.isArray(obj.notifications)) return obj.notifications;
                    if (obj.data && obj.data.notifications && Array.isArray(obj.data.notifications)) return obj.data.notifications;
                    if (obj.data && Array.isArray(obj.data)) return obj.data;

                    for (const key in obj) {
                        const result = findArray(obj[key]);
                        if (result) return result;
                    }
                    return null;
                };

                return findArray(data);
            } catch (err) {
                console.error("CMS_SYNC: Error for", url, err);
                return null;
            }
        };

        let result = await tryFetch(primaryUrl);
        if (!result || result.length === 0) {
            console.log("CMS_SYNC: Primary failed, trying proxy...");
            result = await tryFetch(proxyUrl);
        }

        if (result) {
            console.log("CMS_SYNC: Data verified and loaded:", result.length, "items.");
            setUpdates(result);
        } else {
            console.warn("CMS_SYNC: All sync attempts failed.");
            setUpdates([]);
        }
        setLoading(false);
    };

    const handleCreateUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading("creating");
        const token = getAuthToken();
        try {
            const res = await fetch(UPDATES_BASE, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(newUpdate)
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Broadcast published!");
                setShowAddModal(false);
                setNewUpdate({ title: "", content: "", link: "", isVisible: true });
                fetchUpdates();
            } else {
                toast.error(data.msg || "Post failed");
            }
        } catch (error) {
            toast.error("Error publishing update");
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="p-8 space-y-10 animate-in fade-in duration-700 pb-20 text-slate-900">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex flex-col gap-2">
                    <h2 className="text-4xl font-black tracking-tight text-slate-900 leading-none">Campus Updates</h2>
                    <p className="text-slate-500 font-medium">Broadcast vital news and resources to the student body one by one.</p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={fetchUpdates}
                        disabled={loading}
                        className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm"
                        title="Force Refresh"
                    >
                        <Loader2 size={24} className={loading ? "animate-spin" : ""} />
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-3 bg-slate-900 text-white px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl active:scale-95"
                    >
                        <Plus size={20} />
                        New Update
                    </button>
                </div>
            </div>

            {/* Updates Vertical List */}
            {loading ? (
                <div className="p-32 flex flex-col items-center justify-center space-y-4 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                    <Loader2 className="animate-spin w-12 h-12 text-slate-300" />
                    <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Syncing broadcasts...</p>
                </div>
            ) : updates && updates.length > 0 ? (
                <div className="flex flex-col gap-6">
                    {updates.map((update, idx) => (
                        <div
                            key={update._id || update.id || idx}
                            className="bg-white rounded-[2rem] border border-slate-100 p-8 flex flex-col md:flex-row items-center justify-between gap-8 hover:shadow-2xl hover:shadow-slate-200 transition-all group"
                        >
                            <div className="flex items-center gap-8 flex-1">
                                <div className={`p-5 rounded-2xl shrink-0 ${update.isVisible ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
                                    <Bell size={32} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-4">
                                        <h3 className="font-black text-slate-900 text-xl tracking-tight uppercase">{update.title}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${update.isVisible ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                                            {update.isVisible ? "Live" : "Inactive"}
                                        </span>
                                    </div>
                                    <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-3xl">
                                        {update.description || update.content || "No description provided for this campus update."}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-8 shrink-0 pl-8 border-l border-slate-50 ml-auto">
                                <div className="flex flex-col items-end">
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Distributed</p>
                                    <p className="text-xs font-bold text-slate-900">{update.createdAt ? new Date(update.createdAt).toLocaleDateString() : "Today"}</p>
                                </div>

                                {update.link && (
                                    <a
                                        href={update.link}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all shadow-lg active:scale-90"
                                        title="External Resource"
                                    >
                                        <ExternalLink size={20} />
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-32 flex flex-col items-center justify-center text-center space-y-6 bg-white rounded-[3rem] border border-slate-50">
                    <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200">
                        <Bell size={48} strokeWidth={1} />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-slate-900 tracking-tight">No Active Broadcasts</p>
                        <p className="text-slate-400 font-medium mt-2 max-w-sm">Share important news, semester updates, or registration links with the campus community.</p>
                    </div>
                    <button onClick={() => setShowAddModal(true)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all">Create First Update</button>
                </div>
            )}

            {/* Add Update Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowAddModal(false)} />
                    <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
                        <div className="bg-slate-900 p-8 text-white relative flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-2xl">
                                <Bell size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black tracking-tight">New Broadcast</h3>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Publish News to Student Dashboard</p>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateUpdate} className="p-10 space-y-8">
                            <div className="space-y-6">
                                {/* Title */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                                        <Type size={12} /> Update Title
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={newUpdate.title}
                                        onChange={(e) => setNewUpdate({ ...newUpdate, title: e.target.value })}
                                        placeholder="e.g. Semester Registration"
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-bold text-slate-900"
                                    />
                                </div>

                                {/* Content */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                                        <AlignLeft size={12} /> Description Content
                                    </label>
                                    <textarea
                                        required
                                        rows={3}
                                        value={newUpdate.content}
                                        onChange={(e) => setNewUpdate({ ...newUpdate, content: e.target.value })}
                                        placeholder="Detailed information about the update..."
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-bold text-slate-900 resize-none"
                                    />
                                </div>

                                {/* Link */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                                        <LinkIcon size={12} /> Resource Link (Optional)
                                    </label>
                                    <input
                                        type="url"
                                        value={newUpdate.link}
                                        onChange={(e) => setNewUpdate({ ...newUpdate, link: e.target.value })}
                                        placeholder="https://..."
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-bold text-slate-900"
                                    />
                                </div>

                                {/* Link Preview Hint */}
                                {newUpdate.link && (
                                    <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                        <AlertCircle className="text-blue-500 shrink-0" size={16} />
                                        <p className="text-[10px] font-bold text-blue-700 leading-tight">Students will be redirected to this link when they click the broadcast.</p>
                                    </div>
                                )}
                            </div>

                            <button
                                disabled={!!actionLoading}
                                type="submit"
                                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {actionLoading === "creating" ? <Loader2 className="animate-spin w-5 h-5" /> : <CheckCircle2 size={18} />}
                                Broadcast Now
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
