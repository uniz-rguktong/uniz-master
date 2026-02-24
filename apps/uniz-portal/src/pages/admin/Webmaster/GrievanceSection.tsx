/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    Loader2,
    MessageSquare,
    Search,
    User,
    Tag
} from "lucide-react";
import { GET_GRIEVANCES_LIST } from "../../../api/endpoints";
import { toast } from "react-toastify";

export default function GrievanceSection() {
    const [grievances, setGrievances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchGrievances();
    }, []);

    const fetchGrievances = async () => {
        setLoading(true);
        const token = localStorage.getItem("admin_token");
        try {
            const res = await fetch(GET_GRIEVANCES_LIST, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${JSON.parse(token || '""')}`
                }
            });
            const data = await res.json();
            if (data.success) {
                setGrievances(data.grievances || []);
            } else {
                toast.error(data.msg || "Failed to fetch grievances");
            }
        } catch (error) {
            toast.error("Error connecting to grievance service");
        } finally {
            setLoading(false);
        }
    };

    const filteredGrievances = grievances.filter(g => {
        const matchesFilter = filter === "all" || g.status?.toLowerCase() === filter.toLowerCase();
        const matchesSearch = g.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            g.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            g.studentId?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getStatusStyles = (status: string) => {
        switch (status?.toLowerCase()) {
            case "resolved":
                return "bg-emerald-50 text-emerald-600 border-emerald-100";
            case "pending":
                return "bg-amber-50 text-amber-600 border-amber-100";
            case "in-progress":
                return "bg-blue-50 text-blue-600 border-blue-100";
            default:
                return "bg-slate-50 text-slate-600 border-slate-100";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
            case "resolved":
                return <CheckCircle2 size={14} />;
            case "pending":
                return <Clock size={14} />;
            default:
                return <AlertCircle size={14} />;
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-col gap-2">
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 leading-tight">Student Grievances</h2>
                    <p className="text-slate-500 font-medium">Review and manage student submitted concerns</p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={fetchGrievances}
                        disabled={loading}
                        className="bg-white border border-slate-200 p-3 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <Clock size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    label="Total Grievances"
                    count={grievances.length}
                    icon={MessageSquare}
                    color="bg-slate-900"
                />
                <StatCard
                    label="Pending Review"
                    count={grievances.filter(g => g.status?.toLowerCase() === 'pending').length}
                    icon={Clock}
                    color="bg-amber-500"
                />
                <StatCard
                    label="Resolved Issues"
                    count={grievances.filter(g => g.status?.toLowerCase() === 'resolved').length}
                    icon={CheckCircle2}
                    color="bg-emerald-500"
                />
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search grievances by ID, category or content..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-slate-900/5 outline-none transition-all font-bold text-slate-900"
                    />
                </div>

                <div className="flex gap-2 p-1 bg-slate-50 rounded-xl shrink-0">
                    {["all", "pending", "resolved"].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${filter === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grievance Grid */}
            {loading ? (
                <div className="p-20 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="animate-spin w-10 h-10 text-slate-300" />
                    <p className="font-bold text-slate-400">Loading grievances...</p>
                </div>
            ) : filteredGrievances.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {filteredGrievances.map((grievance) => (
                        <div
                            key={grievance._id}
                            className="bg-white rounded-3xl border border-slate-100 p-6 hover:shadow-xl transition-all group flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg bg-slate-50 text-slate-400`}>
                                            <Tag size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Category</p>
                                            <p className="font-black text-slate-900 text-sm">{grievance.category}</p>
                                        </div>
                                    </div>
                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusStyles(grievance.status)}`}>
                                        {getStatusIcon(grievance.status)}
                                        {grievance.status || "Pending"}
                                    </div>
                                </div>

                                <p className="text-slate-700 font-bold leading-relaxed mb-6 line-clamp-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-50">
                                    "{grievance.description}"
                                </p>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                        <User size={14} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Submitted By</p>
                                        <p className="text-xs font-bold text-slate-900 mt-0.5">
                                            {grievance.isAnonymous ? "Anonymous Student" : (grievance.studentId || "Unknown ID")}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Date</p>
                                    <p className="text-xs font-bold text-slate-900 mt-0.5">
                                        {grievance.createdAt ? new Date(grievance.createdAt).toLocaleDateString() : 'Recent'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-20 flex flex-col items-center justify-center text-center opacity-50 space-y-4">
                    <div className="p-6 bg-slate-50 rounded-full text-slate-300">
                        <MessageSquare size={40} />
                    </div>
                    <div>
                        <p className="font-black text-slate-900 text-xl tracking-tight">No grievances found</p>
                        <p className="font-bold text-slate-400 mt-1 italic">Everything seems to be running smoothly!</p>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, count, icon: Icon, color }: any) {
    return (
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
            <div className={`p-4 rounded-2xl text-white ${color} shadow-lg shadow-black/5`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{label}</p>
                <p className="text-3xl font-black text-slate-900 leading-none">{count}</p>
            </div>
        </div>
    );
}
