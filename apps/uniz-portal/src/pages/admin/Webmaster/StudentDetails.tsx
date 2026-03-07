/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import {
  Search,
  Calendar,
  Hash,
  Loader2,
  LayoutList,
  ChevronRight,
  Filter,
  ShieldOff,
  UserX,
  RotateCcw,
} from "lucide-react";

import {
  ADMIN_VIEW_STUDENT,
  SEARCH_STUDENTS,
  ADMIN_SUSPEND_STUDENT,
  ADMIN_UPDATE_STUDENT,
} from "../../../api/endpoints";
import { toast } from "react-toastify";

export default function StudentDetails() {
  const [searchMode, setSearchMode] = useState<"id" | "filter" | "none">("id");
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

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
          Authorization: `Bearer ${(token || "").replace(/"/g, "")}`,
        },
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
          Authorization: `Bearer ${(token || "").replace(/"/g, "")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          branch,
          year,
          page: 1,
          limit: 100,
        }),
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

  const handleToggleSuspension = async (
    username: string,
    currentSuspendedStatus: boolean,
  ) => {
    if (!window.confirm(`${currentSuspendedStatus ? "Restore" : "Suspend"} access for ${username}?`)) return;
    setIsActionLoading(username + "_suspend");
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch(ADMIN_SUSPEND_STUDENT(username), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${(token || "").replace(/"/g, "")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          suspended: !currentSuspendedStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Account status updated`);
        setSearchResults((prev) =>
          prev.map((s) =>
            s.username === username
              ? { ...s, is_suspended: !currentSuspendedStatus }
              : s,
          ),
        );
      } else {
        toast.error(data.msg || "Action failed");
      }
    } catch (error) {
      toast.error("Error updating suspension status");
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleRevokeAccess = async (username: string) => {
    if (!window.confirm(`PERMANENTLY REVOKE access for ${username}? This action is irreversible.`)) return;
    setIsActionLoading(username + "_revoke");
    const token = localStorage.getItem("admin_token");
    try {
      // Assuming DELETE on student info URL as seen in FacultyManagement
      const res = await fetch(ADMIN_UPDATE_STUDENT(username), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${(token || "").replace(/"/g, "")}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Access revoked successfully");
        setSearchResults((prev) => prev.filter((s) => s.username !== username));
      } else {
        toast.error(data.msg || "Revocation failed");
      }
    } catch (error) {
      toast.error("Error revoking access");
    } finally {
      setIsActionLoading(null);
    }
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-700 pb-20 text-slate-900">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-3xl font-semibold tracking-[-0.02em] text-slate-900 leading-none">
            Student Explorer
          </h2>
          <p className="text-slate-500 font-medium text-[15px]">
            Search, filter, and manage institutional student accounts.
          </p>
        </div>

        <div className="flex bg-slate-100/80 p-1 rounded-full border border-slate-200/50 backdrop-blur-sm shadow-inner group">
          <button
            onClick={() => {
              setSearchMode("id");
              setSearchResults([]);
            }}
            className={`px-8 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] transition-all ${searchMode === "id" ? "bg-white text-blue-700 shadow-lg shadow-blue-100/50" : "text-slate-500 hover:text-blue-600"}`}
          >
            By ID
          </button>
          <button
            onClick={() => {
              setSearchMode("filter");
              setSearchResults([]);
            }}
            className={`px-8 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] transition-all ${searchMode === "filter" ? "bg-white text-blue-700 shadow-lg shadow-blue-100/50" : "text-slate-500 hover:text-blue-600"}`}
          >
            By Filter
          </button>
        </div>
      </div>

      {searchMode === "id" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchStudentById();
          }}
          className="flex items-center gap-3 max-w-2xl animate-in fade-in slide-in-from-left-4 duration-500"
        >
          <div className="relative group flex-1">
            <Hash
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
              size={16}
            />
            <input
              type="text"
              placeholder="Search Student ID (e.g. O210329)"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value.toUpperCase())}
              className="w-full h-12 pl-12 pr-5 bg-white border border-slate-200 rounded-full focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-semibold text-slate-900 shadow-sm text-sm placeholder:text-slate-400 placeholder:font-medium"
            />
          </div>
          <button
            disabled={loading}
            type="submit"
            className="h-12 px-8 bg-blue-600 text-white rounded-full font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin w-4 h-4" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Find Student
          </button>
        </form>
      ) : (
        <div className="flex flex-wrap gap-4 items-center animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="relative group">
            <Filter
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 pointer-events-none"
              size={14}
            />
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="bg-white border border-slate-100 pl-11 pr-10 h-12 rounded-full font-bold text-[11px] uppercase tracking-widest text-slate-600 outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 shadow-sm min-w-[180px] transition-all cursor-pointer appearance-none shadow-slate-100 hover:shadow-md"
            >
              <option value="">All Branches</option>
              {["CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM", "MME"].map(
                (b) => (
                  <option key={b}>{b}</option>
                ),
              )}
            </select>
            <ChevronRight
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none"
              size={14}
            />
          </div>

          <div className="relative group">
            <Calendar
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 pointer-events-none"
              size={14}
            />
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="bg-white border border-slate-100 pl-11 pr-10 h-12 rounded-full font-bold text-[11px] uppercase tracking-widest text-slate-600 outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 shadow-sm min-w-[180px] transition-all cursor-pointer appearance-none shadow-slate-100 hover:shadow-md"
            >
              <option value="">All Batches</option>
              {["E1", "E2", "E3", "E4", "P1", "P2"].map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
            <ChevronRight
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none"
              size={14}
            />
          </div>

          <button
            onClick={handleSearchByFilter}
            disabled={loading}
            className="h-12 px-8 bg-blue-600 text-white rounded-full font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin w-4 h-4" />
            ) : (
              <LayoutList className="w-4 h-4" />
            )}
            Fetch List
          </button>
        </div>
      )}

      <div className="space-y-8">
        {/* Search Results Table - ALWAYS STAY VISIBLE */}
        {searchResults.length > 0 && (
          <div className="w-full animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between px-2 mb-4">
              <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Institutional Records Found ({searchResults.length})
              </h4>
            </div>

<<<<<<< HEAD
            <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden mb-10">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-50 bg-slate-50/20">
                      <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Student</th>
                      <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Credentials</th>
                      <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                      <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Contact</th>
                      <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {searchResults.map((std) => (
                      <tr
                        key={std.username}
                        className="group cursor-default transition-all hover:bg-slate-50/50"
=======
          <div className="space-y-3">
            {searchResults.map((std) => (
              <div
                key={std.username}
                onClick={() => fetchFullDetails(std.username)}
                className={`
                                    group flex items-center justify-between p-4 px-6 bg-white border rounded-[28px] transition-all cursor-pointer hover:shadow-xl hover:translate-y-[-2px]
                                    ${selectedStudent?.username === std.username ? "border-blue-600 ring-4 ring-blue-600/5 shadow-2xl shadow-blue-100" : "border-slate-100 hover:border-blue-100 shadow-sm shadow-slate-50"}
                                `}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-[18px] flex items-center justify-center transition-colors ${selectedStudent?.username === std.username ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white"}`}
                  >
                    <User size={22} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 tracking-tight text-[17px] leading-tight">
                      {std.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[9px] font-semibold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 leading-none">
                        {std.username}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                      <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest leading-none">
                        {std.branch}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isWebmaster && (
                    <button
                      onClick={(e) =>
                        handleToggleSuspension(
                          e,
                          std.username,
                          std.is_suspended === true,
                        )
                      }
                      className={`p-3 rounded-xl transition-all border ${
                        std.is_suspended !== true
                          ? "text-slate-400 hover:text-red-500 hover:bg-red-50 border-transparent hover:border-red-100"
                          : "text-emerald-500 bg-emerald-50 border-emerald-100 hover:bg-emerald-100"
                      }`}
                    >
                      {isActionLoading === std.username ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : std.is_suspended !== true ? (
                        <Trash2 size={18} />
                      ) : (
                        <ShieldCheck size={18} />
                      )}
                    </button>
                  )}
                  <ChevronRight
                    size={18}
                    className={`text-slate-300 transition-transform ${selectedStudent?.username === std.username ? "translate-x-1 text-blue-600" : ""}`}
                  />
                </div>
              </div>
            ))}
          </div>

          {searchResults.length === 0 && !loading && (
            <div className="p-20 flex flex-col items-center justify-center text-center space-y-7 bg-white rounded-[28px] border border-slate-100">
              <div className="p-6 bg-slate-50 rounded-[22px] border border-slate-100 shadow-inner">
                <Users size={40} className="text-slate-300" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-lg tracking-tight">
                  No results found
                </p>
                <p className="text-[13px] font-medium text-slate-400 mt-1 italic leading-relaxed max-w-[200px]">
                  Adjust your criteria or enter a student ID
                </p>
              </div>
            </div>
          )}
        </div>

        {selectedStudent && (
          <div className="lg:col-span-7 animate-in fade-in zoom-in-95 duration-500 sticky top-24 h-fit">
            <div className="bg-white rounded-[28px] border border-slate-100 shadow-2xl overflow-hidden">
              <div className="bg-blue-600 p-8 text-white relative">
                <div className="absolute top-6 right-6 flex items-center gap-2">
                  {isWebmaster && (
                    <button
                      onClick={() =>
                        isEditing ? setIsEditing(false) : startEditing()
                      }
                      className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
                    >
                      {isEditing ? <X size={20} /> : <Pencil size={18} />}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedStudent(null);
                      setIsEditing(false);
                    }}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-3xl border-4 border-white/20 overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
                    {selectedStudent.profile_url ? (
                      <img
                        src={selectedStudent.profile_url}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    ) : (
                      <User size={48} className="text-white/40" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-4">
                      <h3 className="text-2xl font-semibold tracking-[-0.02em]">
                        {selectedStudent.name}
                      </h3>
                      <span
                        className={`px-3.5 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-widest ${selectedStudent.is_suspended !== true ? "bg-emerald-500 text-white shadow-lg shadow-emerald-600/20" : "bg-red-500 text-white shadow-lg shadow-red-600/20"}`}
>>>>>>> origin/main
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm bg-slate-800 text-white border-2 border-white ring-1 ring-slate-100 uppercase transition-all overflow-hidden shrink-0">
                              {std.profile_url ? (
                                <img src={std.profile_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                std.name?.[0] || "U"
                              )}
                            </div>
                            <div className="flex flex-col">
                              <p className="font-bold text-slate-900 tracking-tight leading-none mb-1.5">{std.name}</p>
                              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 leading-none">ID: {std.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black uppercase tracking-widest border border-blue-100">{std.branch}</span>
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black uppercase tracking-widest border border-indigo-100">{std.year}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${std.is_suspended !== true ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-500 border-red-100"}`}>
                            <span className={`w-1 h-1 rounded-full ${std.is_suspended !== true ? "bg-emerald-500" : "bg-red-500"}`}></span>
                            <span className="text-[9px] font-bold uppercase tracking-widest">{std.is_suspended !== true ? "Active" : "Suspended"}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-xs font-semibold text-slate-600 tracking-tight">{std.email}</p>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleSuspension(std.username, std.is_suspended === true)}
                              disabled={isActionLoading === std.username + "_suspend"}
                              className={`p-2 rounded-lg transition-all flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${std.is_suspended === true ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-amber-50 text-amber-600 hover:bg-amber-100"}`}
                              title={std.is_suspended === true ? "Restore Access" : "Suspend Access"}
                            >
                              {isActionLoading === std.username + "_suspend" ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : std.is_suspended === true ? (
                                <RotateCcw size={14} />
                              ) : (
                                <ShieldOff size={14} />
                              )}
                              {std.is_suspended === true ? "Restore" : "Suspend"}
                            </button>
                            <button
                              onClick={() => handleRevokeAccess(std.username)}
                              disabled={isActionLoading === std.username + "_revoke"}
                              className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-all flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest"
                              title="Revoke Access"
                            >
                              {isActionLoading === std.username + "_revoke" ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <UserX size={14} />
                              )}
                              Revoke
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {searchResults.length === 0 && !loading && (
          <div className="p-20 flex flex-col items-center justify-center text-center space-y-7 bg-white rounded-[28px] border border-slate-100">
            <div className="p-6 bg-slate-50 rounded-[22px] border border-slate-100 shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users text-slate-300"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-lg tracking-tight">Search for a student to begin</p>
              <p className="text-[13px] font-medium text-slate-400 mt-1 italic">Records will appear in high-fidelity list view</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
