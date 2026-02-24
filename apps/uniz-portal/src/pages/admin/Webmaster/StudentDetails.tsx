/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import {
    Search,
    User,
    Mail,
    GraduationCap,
    MapPin,
    Phone,
    Calendar,
    Hash,
    Loader2,
    LayoutList,
    Trash2,
    Users,
    X,
    ChevronRight,
    ShieldAlert,
    ShieldCheck,
    Pencil,
    Save
} from "lucide-react";
import { ADMIN_VIEW_STUDENT, SEARCH_STUDENTS, ADMIN_SUSPEND_ACCOUNT, ADMIN_UPDATE_STUDENT } from "../../../api/endpoints";
import { toast } from "react-toastify";

export default function StudentDetails() {
    const [searchMode, setSearchMode] = useState<"id" | "filter" | "none">("id");
    const [studentId, setStudentId] = useState("");
    const [loading, setLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState({
        branch: "",
        year: "",
        gender: "",
        phone_number: "",
        room_number: ""
    });

    // Filter Search State
    const [branch, setBranch] = useState("CSE");
    const [year, setYear] = useState("E2");

    const fetchStudentById = async (idToFetch?: string) => {
        const id = idToFetch || studentId.trim().toUpperCase();
        if (!id) return;

        setLoading(true);
        const token = localStorage.getItem("admin_token");

        try {
            const res = await fetch(ADMIN_VIEW_STUDENT(id), {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${JSON.parse(token || '""')}`
                }
            });

            const data = await res.json();
            if (data.success) {
                setSearchResults([data.student]);
                setSearchMode("id");
            } else {
                toast.error(data.msg || "Student not found");
                setSearchResults([]);
            }
        } catch (error) {
            toast.error("Failed to fetch student details");
        } finally {
            setLoading(false);
        }
    };

    const handleSearchByFilter = async () => {
        setLoading(true);
        const token = localStorage.getItem("admin_token");
        try {
            const res = await fetch(SEARCH_STUDENTS, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${JSON.parse(token || '""')}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    branch,
                    year,
                    page: 1,
                    limit: 100
                })
            });
            const data = await res.json();
            if (data.success) {
                setSearchResults(data.students || []);
                if (data.students?.length === 0) toast.info("No students found");
            } else {
                toast.error(data.msg || "Search failed");
            }
        } catch (error) {
            toast.error("Error searching students");
        } finally {
            setLoading(false);
        }
    };

    const fetchFullDetails = async (username: string) => {
        setLoading(true);
        const token = localStorage.getItem("admin_token");
        try {
            const res = await fetch(ADMIN_VIEW_STUDENT(username.toUpperCase()), {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${JSON.parse(token || '""')}`
                }
            });
            const data = await res.json();
            if (data.success) {
                setSelectedStudent(data.student);
            } else {
                toast.error(data.msg || "Failed to fetch full details");
            }
        } catch (error) {
            toast.error("Error fetching student profile");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleSuspension = async (e: React.MouseEvent, username: string, currentStatus: boolean) => {
        e.stopPropagation();
        setIsActionLoading(username);
        const token = localStorage.getItem("admin_token");
        try {
            const res = await fetch(ADMIN_SUSPEND_ACCOUNT, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${JSON.parse(token || '""')}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username,
                    suspended: currentStatus
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Account status updated`);
                setSearchResults(prev => prev.map(s => s.username === username ? { ...s, is_active: !currentStatus } : s));
                if (selectedStudent?.username === username) {
                    setSelectedStudent((prev: any) => ({ ...prev, is_active: !currentStatus }));
                }
            } else {
                toast.error(data.msg || "Action failed");
            }
        } catch (error) {
            toast.error("Error toggling suspension");
        } finally {
            setIsActionLoading(null);
        }
    };

    const handleUpdateStudent = async () => {
        if (!selectedStudent) return;
        setLoading(true);
        const token = localStorage.getItem("admin_token");
        try {
            const res = await fetch(ADMIN_UPDATE_STUDENT(selectedStudent.username), {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${JSON.parse(token || '""')}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(editFormData)
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Student details updated");
                setIsEditing(false);
                fetchFullDetails(selectedStudent.username);
                setSearchResults(prev => prev.map(s => s.username === selectedStudent.username ? { ...s, ...editFormData } : s));
            } else {
                toast.error(data.msg || "Update failed");
            }
        } catch (error) {
            toast.error("Error updating student");
        } finally {
            setLoading(false);
        }
    };

    const startEditing = () => {
        setEditFormData({
            branch: selectedStudent.branch || "",
            year: selectedStudent.year || "",
            gender: selectedStudent.gender || "M",
            phone_number: selectedStudent.phone_number || "",
            room_number: selectedStudent.roomno || ""
        });
        setIsEditing(true);
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-col gap-2">
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 leading-tight">Student Explorer</h2>
                    <p className="text-slate-500 font-medium">Search, filter, and manage student accounts</p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                    <button
                        onClick={() => { setSearchMode("id"); setSearchResults([]); setSelectedStudent(null); setIsEditing(false); }}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${searchMode === "id" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                    >
                        By ID
                    </button>
                    <button
                        onClick={() => { setSearchMode("filter"); setSearchResults([]); setSelectedStudent(null); setIsEditing(false); }}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${searchMode === "filter" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                    >
                        By Filter
                    </button>
                </div>
            </div>

            {searchMode === "id" ? (
                <form onSubmit={(e) => { e.preventDefault(); fetchStudentById(); }} className="flex gap-4 max-w-2xl animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="relative flex-1">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Enter Student ID (e.g. O210329)"
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-bold text-slate-900 shadow-sm"
                        />
                    </div>
                    <button
                        disabled={loading}
                        type="submit"
                        className="bg-slate-900 text-white px-8 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Search className="w-4 h-4" />}
                        Find
                    </button>
                </form>
            ) : (
                <div className="flex flex-wrap gap-4 items-end animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Branch</label>
                        <select
                            value={branch}
                            onChange={(e) => setBranch(e.target.value)}
                            className="bg-white border border-slate-200 px-6 py-4 rounded-2xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-slate-900/5 shadow-sm min-w-[150px]"
                        >
                            {["CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM", "MME"].map(b => <option key={b}>{b}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Year</label>
                        <select
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            className="bg-white border border-slate-200 px-6 py-4 rounded-2xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-slate-900/5 shadow-sm min-w-[150px]"
                        >
                            {["E1", "E2", "E3", "E4", "P1", "P2"].map(y => <option key={y}>{y}</option>)}
                        </select>
                    </div>
                    <button
                        onClick={handleSearchByFilter}
                        disabled={loading}
                        className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <LayoutList className="w-4 h-4" />}
                        Fetch List
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className={`space-y-4 ${selectedStudent ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
                    {searchResults.length > 0 && (
                        <div className="flex items-center justify-between px-2">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Search Results ({searchResults.length})</h4>
                        </div>
                    )}

                    <div className="space-y-3">
                        {searchResults.map((std) => (
                            <div
                                key={std.username}
                                onClick={() => fetchFullDetails(std.username)}
                                className={`
                                    group flex items-center justify-between p-4 px-6 bg-white border rounded-2xl transition-all cursor-pointer hover:shadow-lg
                                    ${selectedStudent?.username === std.username ? 'border-slate-900 ring-2 ring-slate-900/5' : 'border-slate-100 hover:border-slate-300'}
                                `}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${selectedStudent?.username === std.username ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900 tracking-tight text-lg leading-none">{std.name}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{std.username}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">{std.branch}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={(e) => handleToggleSuspension(e, std.username, std.is_active !== false)}
                                        className={`p-3 rounded-xl transition-all border ${std.is_active !== false
                                                ? 'text-slate-400 hover:text-red-500 hover:bg-red-50 border-transparent hover:border-red-100'
                                                : 'text-emerald-500 bg-emerald-50 border-emerald-100 hover:bg-emerald-100'
                                            }`}
                                    >
                                        {isActionLoading === std.username ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            std.is_active !== false ? <Trash2 size={18} /> : <ShieldCheck size={18} />
                                        )}
                                    </button>
                                    <ChevronRight size={18} className={`text-slate-300 transition-transform ${selectedStudent?.username === std.username ? 'translate-x-1 text-slate-900' : ''}`} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {searchResults.length === 0 && !loading && (
                        <div className="p-20 flex flex-col items-center justify-center text-center opacity-50 space-y-4">
                            <div className="p-6 bg-slate-50 rounded-full">
                                <Users size={40} className="text-slate-300" />
                            </div>
                            <p className="font-bold text-slate-400 italic">No search results to display</p>
                        </div>
                    )}
                </div>

                {selectedStudent && (
                    <div className="lg:col-span-7 animate-in fade-in zoom-in-95 duration-500 sticky top-24 h-fit">
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden">
                            <div className="bg-slate-900 p-8 text-white relative">
                                <div className="absolute top-6 right-6 flex items-center gap-2">
                                    <button
                                        onClick={() => isEditing ? setIsEditing(false) : startEditing()}
                                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
                                    >
                                        {isEditing ? <X size={20} /> : <Pencil size={18} />}
                                    </button>
                                    <button
                                        onClick={() => { setSelectedStudent(null); setIsEditing(false); }}
                                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="w-24 h-24 rounded-3xl border-4 border-white/10 overflow-hidden bg-white/5 flex items-center justify-center shrink-0">
                                        {selectedStudent.profile_url ? (
                                            <img src={selectedStudent.profile_url} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <User size={48} className="text-white/20" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-2xl font-black tracking-tight">{selectedStudent.name}</h3>
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${selectedStudent.is_active !== false ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                                {selectedStudent.is_active !== false ? 'Active' : 'Suspended'}
                                            </span>
                                        </div>
                                        <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">{selectedStudent.username}</p>
                                    </div>
                                </div>
                            </div>

                            {isEditing ? (
                                <div className="p-8 space-y-6 bg-white">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Branch</label>
                                            <select
                                                value={editFormData.branch}
                                                onChange={(e) => setEditFormData({ ...editFormData, branch: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 outline-none font-bold"
                                            >
                                                {["CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM", "MME"].map(b => <option key={b}>{b}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Year</label>
                                            <select
                                                value={editFormData.year}
                                                onChange={(e) => setEditFormData({ ...editFormData, year: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 outline-none font-bold"
                                            >
                                                {["E1", "E2", "E3", "E4", "P1", "P2"].map(y => <option key={y}>{y}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gender</label>
                                            <select
                                                value={editFormData.gender}
                                                onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 outline-none font-bold"
                                            >
                                                <option value="M">Male</option>
                                                <option value="F">Female</option>
                                                <option value="O">Other</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone</label>
                                            <input
                                                type="tel"
                                                value={editFormData.phone_number}
                                                onChange={(e) => setEditFormData({ ...editFormData, phone_number: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 outline-none font-bold"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Room Number</label>
                                        <input
                                            type="text"
                                            value={editFormData.room_number}
                                            onChange={(e) => setEditFormData({ ...editFormData, room_number: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 outline-none font-bold"
                                        />
                                    </div>
                                    <div className="pt-4 flex gap-4">
                                        <button onClick={() => setIsEditing(false)} className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs border border-slate-200 text-slate-400">Cancel</button>
                                        <button onClick={handleUpdateStudent} disabled={loading} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black flex items-center justify-center gap-2">
                                            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Save size={16} />} Save Changes
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white">
                                    <DetailItem icon={Mail} label="Email Address" value={selectedStudent.email} />
                                    <DetailItem icon={Phone} label="Phone Number" value={selectedStudent.phone_number || "Not provided"} />
                                    <DetailItem icon={MapPin} label="Room & Address" value={`${selectedStudent.roomno || 'Not Assigned'}, Dept: ${selectedStudent.department || selectedStudent.branch}`} />
                                    <DetailItem icon={Calendar} label="Date of Birth" value={selectedStudent.date_of_birth || "Not provided"} />
                                    <DetailItem icon={GraduationCap} label="Campus Status" value={selectedStudent.is_in_campus ? "Present in Campus" : "Outside Campus"} />
                                    <DetailItem icon={Users} label="Parental Guardian" value={selectedStudent.father_name || "Not provided"} />

                                    <div className="md:col-span-2 pt-4">
                                        <button
                                            onClick={(e) => handleToggleSuspension(e, selectedStudent.username, selectedStudent.is_active !== false)}
                                            disabled={isActionLoading === selectedStudent.username}
                                            className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${selectedStudent.is_active !== false ? "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white"
                                                }`}
                                        >
                                            {isActionLoading === selectedStudent.username ? <Loader2 size={16} className="animate-spin" /> : (selectedStudent.is_active !== false ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />)}
                                            {selectedStudent.is_active !== false ? "Suspend Student Access" : "Restore Student Access"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function DetailItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <div className="p-5 rounded-2xl border border-slate-50 bg-slate-50/30 flex items-start gap-4">
            <div className="p-2 bg-white rounded-lg text-slate-400 border border-slate-100">
                <Icon size={16} />
            </div>
            <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">{label}</p>
                <p className="font-bold text-slate-800 text-sm mt-0.5 break-all">{value}</p>
            </div>
        </div>
    );
}
