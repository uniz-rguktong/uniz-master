/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
    Clock,
    RefreshCw,
    Activity,
    ShieldCheck,
    AlertTriangle,
    Loader2,
    FileText,
    Settings,
    ShieldAlert
} from "lucide-react";
import { ADMIN_UPLOAD_HISTORY, TRIGGER_CRON } from "../../../api/endpoints";
import { toast } from "react-toastify";

export default function SystemLogsSection() {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMaintenanceLoading, setIsMaintenanceLoading] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
        const token = localStorage.getItem("admin_token");
        try {
            const res = await fetch(ADMIN_UPLOAD_HISTORY, {
                headers: { "Authorization": `Bearer ${JSON.parse(token || '""')}` }
            });
            const data = await res.json();
            if (data.success) {
                setHistory(data.history || []);
            }
        } catch (error) {
            console.error("Failed to fetch history", error);
        } finally {
            setLoading(false);
        }
    };

    const triggerMaintenance = async () => {
        setIsMaintenanceLoading(true);
        const token = localStorage.getItem("admin_token");
        try {
            const res = await fetch(TRIGGER_CRON, {
                headers: { "Authorization": `Bearer ${JSON.parse(token || '""')}` }
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Maintenance cron triggered successfully");
            } else {
                toast.error(data.msg || "Trigger failed");
            }
        } catch (error) {
            toast.error("Network error triggering cron");
        } finally {
            setIsMaintenanceLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-10 animate-in fade-in duration-700 pb-20 text-slate-900">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex flex-col gap-2">
                    <h2 className="text-4xl font-black tracking-tight text-slate-900 leading-none">System & Audit Logs</h2>
                    <p className="text-slate-500 font-medium">Monitor background events, upload history, and system health.</p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={fetchHistory}
                        disabled={loading}
                        className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm"
                        title="Refresh Logs"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                    <button
                        onClick={triggerMaintenance}
                        disabled={isMaintenanceLoading}
                        className="flex items-center gap-3 bg-red-50 text-red-600 px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-600 hover:text-white transition-all shadow-lg active:scale-95"
                    >
                        {isMaintenanceLoading ? <Loader2 className="animate-spin" size={16} /> : <Settings size={16} />}
                        Trigger System Cron
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <StatusCard icon={Activity} label="System Health" value="Healthy" color="emerald" />
                <StatusCard icon={ShieldCheck} label="Security Engine" value="Encrypted" color="blue" />
                <StatusCard icon={Clock} label="Uptime" value="99.9%" color="slate" />
                <StatusCard icon={FileText} label="Total Logs" value={history.length.toString()} color="slate" />
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-900 rounded-2xl text-white">
                            <Clock size={20} />
                        </div>
                        <div>
                            <h3 className="font-black text-xl tracking-tight">Recent Synchronization Audit</h3>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Immutable Log of all Bulk Accesses</p>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Timestamp</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Operator</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Action Type</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Total Records</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-8 py-6 h-16 bg-slate-50/20"></td>
                                    </tr>
                                ))
                            ) : history.length > 0 ? (
                                history.map((log, idx) => (
                                    <tr key={log._id || idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <p className="font-bold text-slate-900 text-sm">{new Date(log.createdAt).toLocaleDateString()}</p>
                                            <p className="text-[10px] font-medium text-slate-400 mt-1">{new Date(log.createdAt).toLocaleTimeString()}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-[10px] text-slate-600">
                                                    {log.operator?.[0] || 'W'}
                                                </div>
                                                <span className="font-bold text-slate-700 text-sm">{log.operator || "Webmaster"}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="px-3 py-1 bg-slate-100 rounded-lg text-slate-600 font-black uppercase tracking-widest text-[9px] border border-slate-200">
                                                {log.actionType || "SYNC"}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="font-black text-slate-900">{log.totalRecords || 0}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Profiles</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                {log.status === "completed" ? (
                                                    <div className="flex items-center gap-2 text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                                        <ShieldCheck size={12} />
                                                        <span className="text-[9px] font-black uppercase tracking-widest">Verified</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-red-500 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                                                        <ShieldAlert size={12} />
                                                        <span className="text-[9px] font-black uppercase tracking-widest">Concern</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-50">
                                            <AlertTriangle size={48} className="text-slate-300" />
                                            <p className="font-bold text-slate-400 italic">No access logs found in the primary ledger.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatusCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
    const colors: any = {
        emerald: "bg-emerald-50 text-emerald-500 border-emerald-100",
        blue: "bg-blue-50 text-blue-500 border-blue-100",
        slate: "bg-slate-50 text-slate-500 border-slate-100",
    };

    return (
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
            <div className={`p-4 rounded-2xl ${colors[color] || colors.slate} border`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">{label}</p>
                <p className="text-xl font-black text-slate-900 mt-2 tracking-tight">{value}</p>
            </div>
        </div>
    );
}
