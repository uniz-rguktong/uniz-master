import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
    MessageSquare,
    Clock,
    Filter,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    UserCheck,
    Search,
    RefreshCw,
    ShieldCheck
} from "lucide-react";
import { GET_GRIEVANCES_LIST } from "../../../api/endpoints";
import { apiClient } from "../../../api/apiClient";

interface Grievance {
    id: string;
    username: string;
    category: string;
    description: string;
    isAnonymous: boolean;
    status: "Pending" | "Resolved" | "In Progress";
    createdAt: string;
}

export default function GrievanceList() {
    const [grievances, setGrievances] = useState<Grievance[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState("All");

    const fetchGrievances = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiClient<Grievance[]>(GET_GRIEVANCES_LIST, {
                method: "GET",
            });

            if (Array.isArray(data)) {
                setGrievances(data);
            } else {
                setGrievances([]);
            }
        } catch (error) {
            console.error("Error fetching grievances:", error);
            toast.error("Failed to load grievances.");
            setGrievances([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGrievances();
    }, [fetchGrievances]);

    const filteredGrievances = grievances.filter(g => {
        const matchesSearch = (g.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (g.username || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === "All" || g.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const categories = ["All", "Hostel", "Mess", "Academic", "Infrastructure", "Other"];

    return (
        <div className="p-6 md:p-10 space-y-8 animate-in fade-in duration-500 pb-24">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-[0.2em] mb-3 bg-blue-50 w-fit px-3 py-1 rounded-full border border-blue-100/50">
                        <ShieldCheck size={12} />
                        Resolution Control
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-none">
                        Student Grievances
                    </h1>
                    <p className="text-slate-500 font-medium text-[15px] mt-4">
                        Official dashboard for monitoring and addressing institutional feedback.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchGrievances}
                        className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                        Sync Records
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-blue-200 transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                            <MessageSquare size={20} />
                        </div>
                        <span className="text-blue-600 font-black text-2xl">{grievances.length}</span>
                    </div>
                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Total Reports</p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-amber-200 transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform">
                            <Clock size={20} />
                        </div>
                        <span className="text-amber-600 font-black text-2xl">
                            {grievances.filter(g => g.status === "Pending").length}
                        </span>
                    </div>
                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Active Tickets</p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-emerald-200 transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
                            <CheckCircle2 size={20} />
                        </div>
                        <span className="text-emerald-600 font-black text-2xl">
                            {grievances.filter(g => g.status === "Resolved").length}
                        </span>
                    </div>
                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Resolved Actions</p>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by username or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-transparent rounded-xl pl-11 pr-4 py-3 text-sm font-semibold focus:bg-white focus:border-blue-100 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto overflow-hidden">
                    <Filter className="text-slate-400 shrink-0" size={18} />
                    <div className="flex gap-1 overflow-x-auto no-scrollbar py-1">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setFilterCategory(cat)}
                                className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${filterCategory === cat
                                        ? "bg-slate-900 text-white shadow-md"
                                        : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Table/List */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-[400px] text-slate-300 gap-4">
                        <RefreshCw className="animate-spin" size={32} />
                        <p className="font-bold uppercase tracking-[0.3em] text-[10px]">Accessing Database...</p>
                    </div>
                ) : filteredGrievances.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Context</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Classification</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Statement</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Temporal Log</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredGrievances.map((g) => (
                                    <tr key={g.id} className="group hover:bg-blue-50/30 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-sm ${g.isAnonymous ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-600'}`}>
                                                    {g.isAnonymous ? '??' : (g.username || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className={`text-[14px] font-bold tracking-tight leading-none ${g.isAnonymous ? 'text-slate-400' : 'text-slate-900'}`}>
                                                        {g.isAnonymous ? 'Anonymous' : g.username}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-1">
                                                        {g.isAnonymous ? <ShieldCheck size={10} /> : <UserCheck size={10} />}
                                                        {g.isAnonymous ? 'Identity Protected' : 'Verified Student'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg font-bold text-[10px] uppercase tracking-widest whitespace-nowrap">
                                                {g.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 max-w-xs">
                                            <p className="text-[13px] text-slate-600 leading-relaxed line-clamp-2 italic">
                                                "{g.description}"
                                            </p>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-bold text-slate-700 leading-none">
                                                    {new Date(g.createdAt).toLocaleDateString()}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">
                                                    {new Date(g.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-100 hover:shadow-lg transition-all active:scale-95 group/btn">
                                                <ChevronRight size={18} className="group-hover/btn:translate-x-0.5 transition-transform" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-[400px] text-center p-10">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-200">
                            <AlertCircle size={40} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Null Set: No Grievances Found</h3>
                        <p className="text-slate-400 text-sm max-w-sm">
                            Your search parameters did not yield any records from the database. Try adjusting your filters.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
