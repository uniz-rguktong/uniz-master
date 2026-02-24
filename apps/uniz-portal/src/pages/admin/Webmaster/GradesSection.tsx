/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import {
    GraduationCap,
    Search,
    Plus,
    RefreshCw,
    Loader2,
    User,
    BookOpen,
    ArrowRight,
    Save,
    Table,
    CheckCircle2,
    AlertCircle,
    BarChart3 as BarChartIcon,
    PieChart as PieChartIcon
} from "lucide-react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell
} from "recharts";
import {
    BULK_UPDATE_GRADES,
    GET_BATCH_GRADES,
    ADD_MANUAL_GRADE
} from "../../../api/endpoints";
import { toast } from "react-toastify";

export default function GradesSection() {
    const [subTab, setSubTab] = useState<"bulk" | "batch" | "manual" | null>(null);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);

    // Form States
    const [bulkJson, setBulkJson] = useState("");
    const [batchFilters, setBatchFilters] = useState({
        branch: "CSE",
        year: "E1",
        semesterId: "SEM-1",
        failedOnly: true
    });
    const [manualGrade, setManualGrade] = useState({
        studentId: "",
        subjectId: "",
        semesterId: "SEM-1",
        grade: ""
    });

    const getAuthToken = () => {
        const rawToken = localStorage.getItem("admin_token");
        if (!rawToken) return "";
        try {
            return JSON.parse(rawToken);
        } catch (e) {
            return rawToken;
        }
    };

    const handleBulkUpdate = async () => {
        if (!bulkJson) {
            toast.error("Please provide JSON data");
            return;
        }
        setLoading(true);
        const token = getAuthToken();
        try {
            const payload = JSON.parse(bulkJson);
            const res = await fetch(BULK_UPDATE_GRADES, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Bulk grades updated successfully");
                setBulkJson("");
            } else {
                toast.error(data.msg || "Bulk update failed");
            }
        } catch (error) {
            toast.error("Invalid JSON or server error");
        } finally {
            setLoading(false);
        }
    };

    const fetchBatchGrades = async () => {
        setLoading(true);
        const token = getAuthToken();
        const { branch, year, failedOnly, semesterId } = batchFilters;
        const query = `branch=${branch}&year=${year}&failedOnly=${failedOnly}&semesterId=${semesterId}`;
        const url = `${GET_BATCH_GRADES}?${query}`;

        console.log("GRADES_SYNC: Initiating sync with", url);

        try {
            const res = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const rawData = await res.json();
            console.log("GRADES_SYNC: Raw Response Body:", rawData);

            // Robust deep search for any array that looks like grade data
            const findGradesArray = (obj: any): any[] | null => {
                if (Array.isArray(obj)) return obj;
                if (!obj || typeof obj !== 'object') return null;

                // Priority keys
                if (obj.grades && Array.isArray(obj.grades)) return obj.grades;
                if (obj.data && Array.isArray(obj.data)) return obj.data;
                if (obj.data && obj.data.grades && Array.isArray(obj.data.grades)) return obj.data.grades;

                // Exhaustive recursive search
                for (const key in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, key)) {
                        const result = findGradesArray(obj[key]);
                        if (result) return result;
                    }
                }
                return null;
            };

            const finalData = findGradesArray(rawData);

            if (finalData) {
                console.log("GRADES_SYNC: Successfully extracted array with", finalData.length, "items.");
                setData(finalData);
                if (finalData.length === 0) toast.info("No records found in this batch");
            } else {
                console.error("GRADES_SYNC: No data array found in response structure");
                setData([]);
                toast.error("Format error: Server response did not contain a data list");
            }
        } catch (error) {
            console.error("GRADES_SYNC: Critical error during fetch/parse:", error);
            toast.error("Synchronization failure. Check console for details.");
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleManualAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const token = getAuthToken();
        try {
            const res = await fetch(ADD_MANUAL_GRADE, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(manualGrade)
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Grade added successfully");
                setManualGrade({ studentId: "", subjectId: "", semesterId: "SEM-1", grade: "" });
            } else {
                toast.error(data.msg || "Failed to add grade");
            }
        } catch (error) {
            toast.error("Server error adding grade");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-10 animate-in fade-in duration-700 pb-20 text-slate-900">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h2 className="text-4xl font-black tracking-tight text-slate-900 leading-none">Grade Management</h2>
                <p className="text-slate-500 font-medium">Manage academic performance, bulk updates, and batch records.</p>
            </div>

            {/* Options Selection (Radio Buttons style as requested) */}
            <div className="flex flex-wrap gap-4 bg-slate-100 p-2 rounded-[2rem] w-fit border border-slate-200">
                <button
                    onClick={() => setSubTab("bulk")}
                    className={`px-8 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-xs transition-all flex items-center gap-2 ${subTab === "bulk" ? "bg-slate-900 text-white shadow-xl" : "text-slate-400 hover:text-slate-900"}`}
                >
                    <RefreshCw size={16} /> Bulk Update REM
                </button>
                <button
                    onClick={() => setSubTab("batch")}
                    className={`px-8 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-xs transition-all flex items-center gap-2 ${subTab === "batch" ? "bg-slate-900 text-white shadow-xl" : "text-slate-400 hover:text-slate-900"}`}
                >
                    <Search size={16} /> Batch Grades
                </button>
                <button
                    onClick={() => setSubTab("manual")}
                    className={`px-8 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-xs transition-all flex items-center gap-2 ${subTab === "manual" ? "bg-slate-900 text-white shadow-xl" : "text-slate-400 hover:text-slate-900"}`}
                >
                    <Plus size={16} /> Manual Add Grade
                </button>
            </div>

            {/* Content Area */}
            {!subTab ? (
                <div className="p-32 flex flex-col items-center justify-center text-center space-y-6 bg-white rounded-[3rem] border border-slate-50">
                    <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200">
                        <GraduationCap size={48} strokeWidth={1} />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-slate-900 tracking-tight">Select an option to get started</p>
                        <p className="text-slate-400 font-medium mt-2 max-w-sm">Choose between bulk updates, batch retrieval, or manual entry from the options above.</p>
                    </div>
                    <div className="flex gap-2">
                        {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-200" />)}
                    </div>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {subTab === "bulk" && (
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 space-y-8 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl">
                                    <RefreshCw size={24} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black tracking-tight">Bulk Update REM</h3>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Update multiple student grades via JSON payload</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">JSON Payload Entry</label>
                                <textarea
                                    value={bulkJson}
                                    onChange={(e) => setBulkJson(e.target.value)}
                                    placeholder='{ "updates": [{ "studentId": "O210008", "subjectId": "...", "semesterId": "SEM-1", "grade": "EX" }] }'
                                    className="w-full h-80 px-8 py-8 bg-slate-900 text-emerald-400 font-mono text-sm rounded-[2rem] border-none outline-none focus:ring-8 focus:ring-slate-900/5 transition-all scrollbar-hide"
                                />
                            </div>

                            <button
                                onClick={handleBulkUpdate}
                                disabled={loading}
                                className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                                Execute Bulk Update
                            </button>
                        </div>
                    )}

                    {subTab === "batch" && (
                        <div className="space-y-8">
                            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm flex flex-col md:flex-row items-end gap-6">
                                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6 w-full text-slate-900 font-bold">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Branch</label>
                                        <select
                                            value={batchFilters.branch}
                                            onChange={(e) => setBatchFilters({ ...batchFilters, branch: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all"
                                        >
                                            <option>CSE</option>
                                            <option>ECE</option>
                                            <option>EEE</option>
                                            <option>MECH</option>
                                            <option>CIVIL</option>
                                            <option>CHEM</option>
                                            <option>MET</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Academic Year</label>
                                        <select
                                            value={batchFilters.year}
                                            onChange={(e) => setBatchFilters({ ...batchFilters, year: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all"
                                        >
                                            <option>E1</option>
                                            <option>E2</option>
                                            <option>E3</option>
                                            <option>E4</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Semester</label>
                                        <select
                                            value={batchFilters.semesterId}
                                            onChange={(e) => setBatchFilters({ ...batchFilters, semesterId: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all"
                                        >
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s}>SEM-{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Type Filter</label>
                                        <div className="flex items-center gap-3 h-[58px] bg-slate-50 border border-slate-100 rounded-2xl px-6 cursor-pointer" onClick={() => setBatchFilters({ ...batchFilters, failedOnly: !batchFilters.failedOnly })}>
                                            <div className={`w-10 h-5 rounded-full relative transition-all ${batchFilters.failedOnly ? 'bg-red-400' : 'bg-slate-200'}`}>
                                                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${batchFilters.failedOnly ? 'right-1' : 'left-1'}`} />
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Failed Only</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={fetchBatchGrades}
                                    disabled={loading}
                                    className="bg-slate-900 text-white px-8 h-[58px] rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-lg flex items-center gap-2 whitespace-nowrap"
                                >
                                    {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Search size={16} />}
                                    Sync Batch
                                </button>
                            </div>

                            {/* Analytics Dashboard */}
                            {data.length > 0 && (() => {
                                // Robust polymorphic grade validator
                                const isPass = (g: any) => {
                                    if (g === undefined || g === null) return false;
                                    const val = String(g).toUpperCase().trim();
                                    if (['R', 'F', 'FAIL', 'REML', 'U'].includes(val)) return false;
                                    const num = parseFloat(val);
                                    if (!isNaN(num)) return num >= 4.0;
                                    return true; // Assume codes like EX, O, A, B, C, P are passes
                                };

                                const passedCount = data.filter(d => isPass(d.grade)).length;
                                const failedCount = data.length - passedCount;
                                const passRate = ((passedCount / data.length) * 100).toFixed(1);

                                return (
                                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                            {/* KPI Stats */}
                                            <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-6">
                                                {[
                                                    { label: "Dataset Volume", value: data.length, icon: Table, color: "bg-slate-50 text-slate-600" },
                                                    { label: "Successful Pass", value: passedCount, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
                                                    { label: "Remedial/Failures", value: failedCount, icon: AlertCircle, color: "bg-red-50 text-red-600" },
                                                    { label: "Batch Efficiency", value: `${passRate}%`, icon: GraduationCap, color: "bg-blue-50 text-blue-600" },
                                                ].map((stat, i) => (
                                                    <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex items-center gap-5 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all">
                                                        <div className={`p-4 rounded-2xl ${stat.color} shadow-inner`}>
                                                            <stat.icon size={22} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] leading-none mb-2">{stat.label}</p>
                                                            <p className="text-3xl font-black text-slate-900 leading-none tracking-tighter">{stat.value}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Grade Distribution Bar Chart */}
                                            <div className="lg:col-span-2 bg-white rounded-[3.5rem] border border-slate-100 p-10 shadow-sm space-y-10">
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <h4 className="font-black text-slate-900 uppercase tracking-[0.2em] text-xs">Spread Spectrum</h4>
                                                        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Volume distribution per grade category</p>
                                                    </div>
                                                    <div className="p-4 bg-slate-50 rounded-2xl text-slate-400">
                                                        <BarChartIcon size={20} />
                                                    </div>
                                                </div>
                                                <div className="h-[350px] w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={(() => {
                                                            const counts: any = {};
                                                            data.forEach(d => {
                                                                const g = String(d.grade || 'N/A').toUpperCase().trim();
                                                                counts[g] = (counts[g] || 0) + 1;
                                                            });
                                                            return Object.keys(counts)
                                                                .map(k => ({ name: k, count: counts[k] }))
                                                                .sort((a, b) => b.count - a.count);
                                                        })()}>
                                                            <XAxis
                                                                dataKey="name"
                                                                axisLine={false}
                                                                tickLine={false}
                                                                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 900 }}
                                                                dy={15}
                                                            />
                                                            <YAxis hide domain={[0, 'dataMax + 5']} />
                                                            <Tooltip
                                                                cursor={{ fill: '#f8fafc', radius: 15 }}
                                                                contentStyle={{ borderRadius: '2rem', border: 'none', boxShadow: '0 30px 70px rgba(0,0,0,0.12)', padding: '1.5rem 2rem' }}
                                                                itemStyle={{ fontWeight: 900, color: '#0f172a', fontSize: '14px', textTransform: 'uppercase' }}
                                                            />
                                                            <Bar
                                                                dataKey="count"
                                                                fill="#0f172a"
                                                                radius={[15, 15, 15, 15]}
                                                                barSize={50}
                                                                animationDuration={2000}
                                                            />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>

                                            {/* Pass/Fail Pie Chart */}
                                            <div className="bg-white rounded-[3.5rem] border border-slate-100 p-10 shadow-sm space-y-10 flex flex-col">
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <h4 className="font-black text-slate-900 uppercase tracking-[0.2em] text-xs">Status Ratio</h4>
                                                        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Composition analysis</p>
                                                    </div>
                                                    <div className="p-4 bg-slate-50 rounded-2xl text-slate-400">
                                                        <PieChartIcon size={20} />
                                                    </div>
                                                </div>
                                                <div className="h-[350px] w-full relative flex-1">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie
                                                                data={[
                                                                    { name: 'Satisfactory', value: passedCount },
                                                                    { name: 'Unsatisfactory', value: failedCount }
                                                                ]}
                                                                innerRadius={85}
                                                                outerRadius={115}
                                                                paddingAngle={12}
                                                                dataKey="value"
                                                                stroke="none"
                                                            >
                                                                <Cell fill="#10b981" />
                                                                <Cell fill="#f43f5e" />
                                                            </Pie>
                                                            <Tooltip
                                                                contentStyle={{ borderRadius: '2rem', border: 'none', boxShadow: '0 30px 70px rgba(0,0,0,0.12)' }}
                                                            />
                                                            <Legend
                                                                verticalAlign="bottom"
                                                                align="center"
                                                                wrapperStyle={{ paddingTop: '40px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}
                                                            />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                    {/* Center Stat */}
                                                    <div className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mt-[-10px]">
                                                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none mb-2">Passing</p>
                                                        <p className="text-4xl font-black text-slate-900 leading-none tracking-tighter">{passRate}%</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Raw Records Table */}
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3 ml-6">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                                                <h4 className="font-black text-slate-900 uppercase tracking-[0.3em] text-[10px]">Detailed Cryptographic Trace</h4>
                                            </div>
                                            <div className="bg-white rounded-[3.5rem] border border-slate-100 overflow-hidden shadow-sm">
                                                <table className="w-full text-left">
                                                    <thead>
                                                        <tr className="bg-slate-50 border-b border-slate-100">
                                                            <th className="px-10 py-7 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Identity Token</th>
                                                            <th className="px-10 py-7 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Curriculum GUID</th>
                                                            <th className="px-10 py-7 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Temporal Phase</th>
                                                            <th className="px-10 py-7 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-right">Metric Value</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50">
                                                        {data.map((grade, idx) => {
                                                            const passed = isPass(grade.grade);
                                                            return (
                                                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                                                    <td className="px-10 py-7 font-black text-slate-900 tracking-tight">{grade.studentId}</td>
                                                                    <td className="px-10 py-7 text-slate-500 font-bold">{grade.subjectId}</td>
                                                                    <td className="px-10 py-7">
                                                                        <span className="px-4 py-1.5 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">
                                                                            {grade.semesterId}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-10 py-7 text-right">
                                                                        <span className={`text-xl font-black tracking-tighter ${!passed ? 'text-red-500' : 'text-slate-900'}`}>
                                                                            {grade.grade}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {subTab === "manual" && (
                        <div className="max-w-xl mx-auto bg-white rounded-[2.5rem] border border-slate-100 p-10 space-y-8 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                                    <Plus size={24} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black tracking-tight">Manual Entry</h3>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Add an individual grade record manually</p>
                                </div>
                            </div>

                            <form onSubmit={handleManualAdd} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Student ID</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        <input
                                            required
                                            value={manualGrade.studentId}
                                            onChange={(e) => setManualGrade({ ...manualGrade, studentId: e.target.value.toUpperCase() })}
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-bold"
                                            placeholder="O210329"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Subject ID</label>
                                        <div className="relative">
                                            <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                            <input
                                                required
                                                value={manualGrade.subjectId}
                                                onChange={(e) => setManualGrade({ ...manualGrade, subjectId: e.target.value })}
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-bold"
                                                placeholder="GUID"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Semester</label>
                                        <select
                                            value={manualGrade.semesterId}
                                            onChange={(e) => setManualGrade({ ...manualGrade, semesterId: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-bold"
                                        >
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s}>SEM-{s}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Grade (Point or Code)</label>
                                    <input
                                        required
                                        value={manualGrade.grade}
                                        onChange={(e) => setManualGrade({ ...manualGrade, grade: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-bold"
                                        placeholder="e.g. 9.5 or EX"
                                    />
                                </div>

                                <button
                                    disabled={loading}
                                    type="submit"
                                    className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : <ArrowRight size={18} />}
                                    Commence Entry
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
