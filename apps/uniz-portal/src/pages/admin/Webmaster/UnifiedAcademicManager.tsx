/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Calendar,
  Trash2,
  Search,
  Filter,
  Zap,
  BookText,
  ShieldCheck,
  X,
  PlusCircle,
  Users,
  Layout,
  RefreshCcw,
  Edit3,
} from "lucide-react";
import { apiClient } from "../../../api/apiClient";
import {
  GET_SUBJECTS,
  ADD_SUBJECT,
  SUBJECT_BY_ID,
  SEMESTERS,
  INIT_SEMESTER,
  UPDATE_SEMESTER_STATUS,
  DELETE_SEMESTER,
  DEAN_REVIEW,
  DEAN_APPROVE,
  GET_REGISTRATIONS,
} from "../../../api/endpoints";
import { toast } from "react-toastify";

// --- Types ---
interface Semester {
  id: string;
  name: string;
  status:
    | "DRAFT"
    | "DEAN_REVIEW"
    | "APPROVED"
    | "REGISTRATION_OPEN"
    | "REGISTRATION_CLOSED";
  _count?: { registrations: number };
  createdAt: string;
}

interface Allocation {
  id: string;
  branch: string;
  academicYear: string;
  batch?: string;
  subject: { name: string; code: string; credits: number; id: string };
  isApproved: boolean;
  customName?: string;
  customCredits?: number;
  status: string;
}

export default function UnifiedAcademicManager() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<
    "catalog" | "subjects" | "rollout"
  >("catalog");
  const [selectedSem, setSelectedSem] = useState<Semester | null>(null);

  // Global Loading
  const [loading, setLoading] = useState(false);

  // --- Catalog State (Semesters) ---
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [showNewSemModal, setShowNewSemModal] = useState(false);
  const [newSemName, setNewSemName] = useState("AY 2024-25 SEM-2");
  const [selectedBranches, setSelectedBranches] = useState([
    "CSE",
    "ECE",
    "EEE",
    "MECH",
    "CIVIL",
    "CHEM",
  ]);

  // --- Master Subjects State ---
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [subSearch, setSubSearch] = useState("");
  const [subDept, setSubDept] = useState("");
  const [showSubModal, setShowSubModal] = useState(false);
  const [editingSub, setEditingSub] = useState<any>(null);
  const [newSub, setNewSub] = useState({
    name: "",
    code: "",
    credits: 4,
    department: "CSE",
    semester: "SEM-1",
  });

  // --- Rollout Detail State ---
  const [rolloutAllocations, setRolloutAllocations] = useState<Allocation[]>(
    [],
  );
  const [rolloutRegistrations, setRolloutRegistrations] = useState<any[]>([]);
  const [rolloutView, setRolloutView] = useState<
    "allocations" | "registrations"
  >("allocations");
  const [filterBranch, setFilterBranch] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [filterBatch, setFilterBatch] = useState("all");
  const [availableBatches, setAvailableBatches] = useState<string[]>([]);
  const [showAddAllocModal, setShowAddAllocModal] = useState(false);
  const [addAllocData, setAddAllocData] = useState({
    subjectId: "",
    academicYear: "E1",
    batch: "",
    branch: "all",
  });

  useEffect(() => {
    fetchSemesters();
    fetchMasterSubjects();
  }, [subDept]);

  useEffect(() => {
    if (activeTab === "rollout" && selectedSem) {
      if (rolloutView === "allocations") fetchAllocations();
      else fetchRegistrations();
    }
  }, [
    activeTab,
    selectedSem,
    rolloutView,
    filterBranch,
    filterYear,
    filterBatch,
  ]);

  useEffect(() => {
    const fetchBatches = async () => {
      const res = await apiClient<any>("/api/v1/profile/admin/batches");
      if (res) {
        // Handle both direct array and wrapped { batches: [] } response
        const batches = Array.isArray(res) ? res : res.batches || [];
        setAvailableBatches(batches);
      }
    };
    fetchBatches();
  }, []);

  // --- Actions: Catalog ---
  const fetchSemesters = async () => {
    try {
      const res = await apiClient<Semester[]>(SEMESTERS);
      if (res) setSemesters(res);
    } catch (err) {
      toast.error("Failed to fetch semesters");
    }
  };

  const handleInitSemester = async () => {
    setLoading(true);
    try {
      await apiClient(INIT_SEMESTER, {
        method: "POST",
        body: JSON.stringify({
          academicSemester: newSemName,
          branches: selectedBranches.map((b) => ({ branchName: b })),
        }),
      });
      toast.success("Semester Rollout Initialized");
      setShowNewSemModal(false);
      fetchSemesters();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSemStatus = async (id: string, status: string) => {
    try {
      await apiClient(UPDATE_SEMESTER_STATUS(id), {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast.success(`Status updated to ${status}`);
      fetchSemesters();
      if (selectedSem?.id === id) {
        setSelectedSem((prev) =>
          prev ? { ...prev, status: status as any } : null,
        );
      }
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const handleDeleteSem = async (id: string) => {
    if (
      !window.confirm(
        "Permanently delete this semester and all associated data?",
      )
    )
      return;
    try {
      await apiClient(DELETE_SEMESTER(id), { method: "DELETE" });
      toast.success("Semester deleted");
      if (selectedSem?.id === id) {
        setActiveTab("catalog");
        setSelectedSem(null);
      }
      fetchSemesters();
    } catch (err) {
      toast.error("Deletion failed");
    }
  };

  const fetchMasterSubjects = async () => {
    setLoading(true);
    try {
      const res = await apiClient<any>(GET_SUBJECTS, {
        params: { limit: 100, search: subSearch, department: subDept },
      });
      if (res && res.success) {
        setAllSubjects(res.subjects);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSub = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = editingSub ? SUBJECT_BY_ID(editingSub.id) : ADD_SUBJECT;
      const method = editingSub ? "PUT" : "POST";
      const res = await apiClient<any>(endpoint, {
        method,
        body: JSON.stringify(newSub),
      });
      if (res && res.success) {
        toast.success(editingSub ? "Subject updated" : "Subject created");
        setShowSubModal(false);
        setEditingSub(null);
        fetchMasterSubjects();
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Actions: Rollout ---
  const fetchAllocations = async () => {
    if (!selectedSem) return;
    setLoading(true);
    try {
      const yearQuery = filterYear !== "all" ? `&year=${filterYear}` : "";
      const batchQuery = filterBatch !== "all" ? `&batch=${filterBatch}` : "";
      const res = await apiClient<Allocation[]>(
        `${DEAN_REVIEW(filterBranch)}?semesterId=${selectedSem.id}${yearQuery}${batchQuery}`,
      );
      if (res) setRolloutAllocations(res);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    if (!selectedSem) return;
    setLoading(true);
    try {
      const branchQuery =
        filterBranch !== "all" ? `&branch=${filterBranch}` : "";
      const batchQuery = filterBatch !== "all" ? `&batch=${filterBatch}` : "";
      const res = await apiClient<any[]>(
        `${GET_REGISTRATIONS}?semesterId=${selectedSem.id}${branchQuery}${batchQuery}`,
      );
      if (res) setRolloutRegistrations(res);
    } finally {
      setLoading(false);
    }
  };

  const handleManualAlloc = async () => {
    if (!addAllocData.subjectId || !selectedSem) return;
    setLoading(true);
    try {
      await apiClient("/api/v1/academics/dean/allocation", {
        method: "POST",
        body: JSON.stringify({
          ...addAllocData,
          semesterId: selectedSem.id,
          branch: addAllocData.branch === "all" ? "CSE" : addAllocData.branch,
        }),
      });
      toast.success("Subject allocated to rollout");
      setShowAddAllocModal(false);
      fetchAllocations();
    } catch (err: any) {
      toast.error(err.message || "Allocation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAlloc = async (id: string) => {
    if (!window.confirm("Remove this subject from the rollout?")) return;
    try {
      await apiClient(`/api/v1/academics/dean/allocation/${id}`, {
        method: "DELETE",
      });
      toast.success("Allocation removed");
      fetchAllocations();
    } catch {
      toast.error("Deletion failed");
    }
  };

  const handleGlobalApprove = async () => {
    setLoading(true);
    try {
      await apiClient(DEAN_APPROVE, {
        method: "POST",
        body: JSON.stringify({
          branch: filterBranch,
          semesterId: selectedSem?.id,
          year: filterYear !== "all" ? filterYear : undefined,
          batch: filterBatch !== "all" ? filterBatch : undefined,
        }),
      });
      toast.success("Rollout phase advanced");
      fetchAllocations();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-700 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            <Layout className="text-blue-600" size={36} />
            Academic Governance
          </h1>
          <p className="text-slate-500 font-medium text-[15px] mt-1">
            Master curriculum control and semester lifecycle management.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchSemesters();
              fetchMasterSubjects();
            }}
            className="p-4 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-blue-600 transition-all active:scale-95"
          >
            <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setShowNewSemModal(true)}
            className="h-14 px-8 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center gap-3 shadow-none"
          >
            <Zap size={16} className="text-amber-400 fill-amber-400" /> New
            Rollout
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex gap-2 bg-white/50 p-1.5 rounded-xl border border-slate-100 w-fit backdrop-blur-sm">
        {(["catalog", "subjects", "rollout"] as const).map((tabId) => {
          const labels: Record<string, string> = {
            catalog: "Catalog",
            subjects: "Master Catalog",
            rollout: "Live Rollout",
          };
          const icons: Record<string, any> = {
            catalog: Layout,
            subjects: BookOpen,
            rollout: Zap,
          };
          const Icon = icons[tabId];

          return (
            <button
              key={tabId}
              disabled={tabId === "rollout" && !selectedSem}
              onClick={() => setActiveTab(tabId)}
              className={`
                flex items-center gap-3 px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all
                ${
                  activeTab === tabId
                    ? "bg-white text-blue-600 border border-slate-100"
                    : "text-slate-400 hover:text-slate-900 hover:bg-white/80"
                }
                ${tabId === "rollout" && !selectedSem ? "opacity-30 cursor-not-allowed" : ""}
              `}
            >
              <Icon size={16} />
              {labels[tabId]}
            </button>
          );
        })}
      </div>

      {/* Viewport Rendering */}
      <div className="min-h-[60vh]">
        {activeTab === "catalog" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {semesters.map((sem) => (
              <div
                key={sem.id}
                onClick={() => {
                  setSelectedSem(sem);
                  setActiveTab("rollout");
                }}
                className="bg-white rounded-xl border border-slate-100 p-8 transition-all group cursor-pointer overflow-hidden relative"
              >
                <div className="flex justify-between items-start mb-10">
                  <div
                    className={`p-4 rounded-xl ${sem.status === "REGISTRATION_OPEN" ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"}`}
                  >
                    <Calendar size={28} />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                        sem.status === "REGISTRATION_OPEN"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : "bg-slate-50 text-slate-400 border-slate-100"
                      }`}
                    >
                      {sem.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors uppercase">
                  {sem.name}
                </h3>
                <div className="flex items-center gap-6 mt-6 mb-8">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Enrollment
                    </p>
                    <p className="text-lg font-black text-slate-900">
                      {sem._count?.registrations || 0}
                    </p>
                  </div>
                  <div className="ml-auto flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSem(sem.id);
                      }}
                      className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-none"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden mt-auto">
                  <div
                    className={`h-full transition-all duration-1000 ${sem.status === "REGISTRATION_OPEN" ? "w-full bg-emerald-500" : "w-1/3 bg-blue-500"}`}
                  ></div>
                </div>
              </div>
            ))}
            {semesters.length === 0 && (
              <div className="col-span-full py-24 bg-white rounded-xl border-dashed border-2 border-slate-100 p-12 text-center animate-in fade-in zoom-in-95 duration-700">
                <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-white shadow-none">
                  <BookOpen size={40} strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight italic">
                  Relaxation levels are dangerously high.
                </h3>
                <p className="text-slate-500 font-medium max-w-md mx-auto mb-10 leading-relaxed">
                  Campus vibes: 100% chill. Students are relaxing… but don't
                  worry, semester registration is loading to take care of that.
                </p>
                <button
                  onClick={() => setShowNewSemModal(true)}
                  className="px-10 py-5 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all active:scale-95 shadow-none"
                >
                  Initiate New Rollout
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "subjects" && (
          <div className="space-y-8">
            <div className="flex flex-wrap gap-4 bg-white p-6 rounded-xl border border-slate-100">
              <div className="relative flex-1 min-w-[300px]">
                <Search
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search master subjects..."
                  value={subSearch}
                  onChange={(e) => setSubSearch(e.target.value)}
                  className="w-full h-14 pl-14 pr-6 bg-slate-50 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 font-bold text-slate-900"
                />
              </div>
              <select
                value={subDept}
                onChange={(e) => setSubDept(e.target.value)}
                className="h-14 px-8 bg-slate-50 rounded-xl font-bold uppercase tracking-widest text-[10px] text-slate-600 border-none outline-none appearance-none"
              >
                <option value="">All Departments</option>
                {["CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM"].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  setEditingSub(null);
                  setNewSub({
                    name: "",
                    code: "",
                    credits: 4,
                    department: "CSE",
                    semester: "SEM-1",
                  });
                  setShowSubModal(true);
                }}
                className="h-14 px-8 bg-blue-600 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 border-2 border-white/20 shadow-none"
              >
                <PlusCircle size={16} /> Add New Subject
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {allSubjects.map((sub, i) => (
                <div
                  key={i}
                  className="bg-white border border-slate-100 rounded-xl p-8 transition-all group overflow-hidden"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600 border border-blue-50 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <BookText size={20} />
                    </div>
                    <div className="px-3 py-1 bg-slate-50 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400">
                      {sub.code}
                    </div>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight mb-4">
                    {sub.name}
                  </h3>
                  <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-50">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {sub.department} • {sub.credits} Credits
                    </div>
                    <button
                      onClick={() => {
                        setEditingSub(sub);
                        setNewSub({
                          name: sub.name,
                          code: sub.code,
                          credits: sub.credits,
                          department: sub.department,
                          semester: sub.semester,
                        });
                        setShowSubModal(true);
                      }}
                      className="text-slate-300 hover:text-blue-600 transition-colors"
                    >
                      <Edit3 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "rollout" && selectedSem && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            <div className="bg-slate-900 rounded-xl p-10 text-white relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-4 py-1.5 bg-blue-500/20 text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-500/30">
                      Active Rollout
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-xs font-bold text-slate-400 italic">
                      Created{" "}
                      {new Date(selectedSem.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h2 className="text-5xl font-black tracking-tighter italic">
                    {selectedSem.name}
                  </h2>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() =>
                      handleUpdateSemStatus(
                        selectedSem.id,
                        selectedSem.status === "REGISTRATION_OPEN"
                          ? "REGISTRATION_CLOSED"
                          : "REGISTRATION_OPEN",
                      )
                    }
                    className={`h-14 px-10 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all ${
                      selectedSem.status === "REGISTRATION_OPEN"
                        ? "bg-red-50/10 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white"
                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                    }`}
                  >
                    {selectedSem.status === "REGISTRATION_OPEN"
                      ? "Suspend Enrollment"
                      : "Launch Enrollment 🚀"}
                  </button>
                  <button
                    onClick={handleGlobalApprove}
                    className="h-14 px-8 bg-white/10 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10"
                  >
                    Push Progress
                  </button>
                </div>
              </div>
              <div className="absolute right-0 top-0 w-64 h-64 bg-blue-600/10 blur-[120px] rounded-full"></div>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex gap-8">
                {(["allocations", "registrations"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setRolloutView(v)}
                    className={`pb-4 text-[13px] font-black uppercase tracking-[0.2em] transition-all relative ${
                      rolloutView === v
                        ? "text-blue-600"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {v}
                    {rolloutView === v && (
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-full animate-in fade-in duration-500"></div>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 mb-4">
                <div className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-xl border border-slate-100 shadow-none">
                  <Filter size={14} className="text-slate-400" />
                  <select
                    value={filterBranch}
                    onChange={(e) => setFilterBranch(e.target.value)}
                    className="font-black text-[10px] uppercase tracking-widest text-slate-700 outline-none border-none bg-transparent"
                  >
                    <option value="all">All Branches</option>
                    {["CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM"].map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-xl border border-slate-100 shadow-none">
                  <Users size={14} className="text-slate-400" />
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="font-black text-[10px] uppercase tracking-widest text-slate-700 outline-none border-none bg-transparent"
                  >
                    <option value="all">All Years</option>
                    {["E1", "E2", "E3", "E4"].map((y) => (
                      <option key={y} value={y}>
                        {y} Engineering
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-xl border border-slate-100 shadow-none">
                  <BookText size={14} className="text-slate-400" />
                  <select
                    value={filterBatch}
                    onChange={(e) => setFilterBatch(e.target.value)}
                    className="font-black text-[10px] uppercase tracking-widest text-slate-700 outline-none border-none bg-transparent"
                  >
                    <option value="all">All Batches</option>
                    {availableBatches.map((b) => (
                      <option key={b} value={b}>
                        Batch {b}
                      </option>
                    ))}
                  </select>
                </div>
                {rolloutView === "allocations" && (
                  <button
                    onClick={() => setShowAddAllocModal(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-none hover:scale-105 active:scale-95 transition-all"
                  >
                    <Plus size={14} /> Add 🎓
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
              {rolloutView === "allocations" ? (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                      <th className="px-10 py-6">Course Structure</th>
                      <th className="px-10 py-6">Branch / Year</th>
                      <th className="px-10 py-6">Status</th>
                      <th className="px-10 py-6 text-right">Manage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {rolloutAllocations.map((item) => (
                      <tr
                        key={item.id}
                        className="group hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:text-blue-500 group-hover:bg-blue-50 transition-all">
                              <BookOpen size={20} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">
                                {item.customName || item.subject.name}
                              </p>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {item.subject.code} •{" "}
                                {item.customCredits || item.subject.credits}{" "}
                                Credits
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest">
                              {item.branch}
                            </span>
                            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest">
                              {item.academicYear}
                            </span>
                            {item.batch && (
                              <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-xl text-[9px] font-black uppercase tracking-widest">
                                {item.batch}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${item.status === "APPROVED" ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`}
                            ></div>
                            <span className="text-[11px] font-extrabold uppercase tracking-tight text-slate-600">
                              {item.status.replace("_", " ")}
                            </span>
                          </div>
                        </td>
                        <td className="px-10 py-6 text-right">
                          <button
                            onClick={() => handleRemoveAlloc(item.id)}
                            className="p-3 bg-red-50 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                      <th className="px-10 py-6">Enrolled Student</th>
                      <th className="px-10 py-6">Batch</th>
                      <th className="px-10 py-6">Allocated Course</th>
                      <th className="px-10 py-6">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {rolloutRegistrations.map((reg) => (
                      <tr
                        key={reg.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400">
                              {reg.studentId[0]}
                            </div>
                            <p className="font-bold text-slate-900 tracking-tight">
                              {reg.studentId}
                            </p>
                          </div>
                        </td>
                        <td className="px-10 py-6">
                          <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-xl text-[9px] font-black uppercase tracking-widest">
                            {reg.batch || "N/A"}
                          </span>
                        </td>
                        <td className="px-10 py-6">
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-800">
                              {reg.subject.name}
                            </p>
                            <p className="text-[9px] font-black italic text-slate-400">
                              {reg.subject.code}
                            </p>
                          </div>
                        </td>
                        <td className="px-10 py-6 text-xs font-bold text-slate-400">
                          {new Date(reg.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {((rolloutView === "allocations" &&
                rolloutAllocations.length === 0) ||
                (rolloutView === "registrations" &&
                  rolloutRegistrations.length === 0)) && (
                <div className="p-32 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                    <X size={40} />
                  </div>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                    Zero activity detected for these parameters.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showNewSemModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-xl w-full max-w-xl p-10 animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-4 mb-10">
              <div className="p-5 bg-blue-50 text-blue-600 rounded-xl shadow-none">
                <Zap size={32} className="fill-blue-600 opacity-20" />
              </div>
              <div>
                <h2 className="text-3xl font-black italic tracking-tighter text-slate-900">
                  Launch Academic Rollout
                </h2>
                <p className="text-slate-400 text-sm font-bold">
                  Initialize a new semester registration event.
                </p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">
                  Semester Label (Internal Display)
                </label>
                <input
                  type="text"
                  value={newSemName}
                  onChange={(e) => setNewSemName(e.target.value)}
                  className="w-full h-16 px-8 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-xl outline-none font-black text-slate-900 transition-all"
                  placeholder="e.g. AY 2024-25 SEM-II"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">
                  Applicable Branches
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {["CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM"].map((b) => (
                    <button
                      key={b}
                      onClick={() =>
                        setSelectedBranches((prev) =>
                          prev.includes(b)
                            ? prev.filter((x) => x !== b)
                            : [...prev, b],
                        )
                      }
                      className={`h-14 rounded-xl font-black text-xs transition-all border ${
                        selectedBranches.includes(b)
                          ? "bg-slate-900 text-white border-slate-900 shadow-none"
                          : "bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  onClick={() => setShowNewSemModal(false)}
                  className="h-16 flex-1 bg-slate-100 text-slate-500 rounded-xl font-black uppercase tracking-widest text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInitSemester}
                  disabled={loading}
                  className="h-16 flex-[2] bg-blue-600 text-white rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-none hover:bg-blue-700 transition-all"
                >
                  {loading ? "Initializing Engine..." : "Launch Rollout 🎓"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddAllocModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-xl w-full max-w-xl p-10 shadow-none animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h3 className="text-3xl font-black italic tracking-tighter text-slate-900">
                  Manual Course Allocation
                </h3>
                <p className="text-slate-400 text-sm font-bold">
                  Force-add a course to the current rollout context.
                </p>
              </div>
              <button
                onClick={() => setShowAddAllocModal(false)}
                className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-all"
              >
                <X />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">
                  Search Course Catalog
                </label>
                <select
                  value={addAllocData.subjectId}
                  onChange={(e) =>
                    setAddAllocData({
                      ...addAllocData,
                      subjectId: e.target.value,
                    })
                  }
                  className="w-full h-16 px-8 bg-slate-50 rounded-xl outline-none font-bold text-slate-900 appearance-none"
                >
                  <option value="">Select Subject...</option>
                  {allSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      [{s.code}] {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">
                    Branch Target
                  </label>
                  <select
                    value={addAllocData.branch}
                    onChange={(e) =>
                      setAddAllocData({
                        ...addAllocData,
                        branch: e.target.value,
                      })
                    }
                    className="w-full h-14 px-6 bg-slate-50 rounded-xl font-bold uppercase tracking-widest text-[10px] text-slate-700"
                  >
                    {filterBranch === "all" ? (
                      ["CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM"].map(
                        (b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ),
                      )
                    ) : (
                      <option value={filterBranch}>{filterBranch}</option>
                    )}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">
                    Year Target
                  </label>
                  <select
                    value={addAllocData.academicYear}
                    onChange={(e) =>
                      setAddAllocData({
                        ...addAllocData,
                        academicYear: e.target.value,
                      })
                    }
                    className="w-full h-14 px-6 bg-slate-50 rounded-xl font-bold uppercase tracking-widest text-[10px] text-slate-700"
                  >
                    {["E1", "E2", "E3", "E4"].map((y) => (
                      <option key={y} value={y}>
                        {y} Engineering
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleManualAlloc}
                disabled={loading || !addAllocData.subjectId}
                className="w-full h-16 bg-slate-900 text-white rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-none mt-6"
              >
                Confirm Allocation
              </button>
            </div>

            <div className="mt-10 p-6 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-amber-800 text-[11px] font-bold leading-relaxed">
                <ShieldCheck size={14} className="inline mr-2" />
                This will create a new BranchAllocation record for the target
                semester. Any changes will be visible to students once the
                enrollment phase is opened.
              </p>
            </div>
          </div>
        </div>
      )}

      {showSubModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-xl w-full max-w-xl p-10 shadow-none animate-in zoom-in-95 duration-300 relative">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-3xl font-black italic tracking-tighter text-slate-900">
                {editingSub ? "Modify Subject" : "Course Architectural Entry"}
              </h3>
              <button
                onClick={() => setShowSubModal(false)}
                className="p-2 hover:bg-slate-50 rounded-full transition-all"
              >
                <X />
              </button>
            </div>

            <form onSubmit={handleSaveSub} className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">
                  Course Nomenclature
                </label>
                <input
                  required
                  value={newSub.name}
                  onChange={(e) =>
                    setNewSub({ ...newSub, name: e.target.value })
                  }
                  className="w-full h-14 px-8 bg-slate-50 rounded-xl outline-none font-bold text-slate-900"
                  placeholder="e.g. Distributed Systems"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">
                    Identity Code
                  </label>
                  <input
                    required
                    value={newSub.code}
                    onChange={(e) =>
                      setNewSub({
                        ...newSub,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full h-14 px-8 bg-slate-50 rounded-xl outline-none font-bold text-slate-900"
                    placeholder="CS401"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">
                    Unit Credits
                  </label>
                  <input
                    type="number"
                    value={newSub.credits}
                    onChange={(e) =>
                      setNewSub({
                        ...newSub,
                        credits: parseInt(e.target.value),
                      })
                    }
                    className="w-full h-14 px-8 bg-slate-50 rounded-xl outline-none font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">
                    Ownership Dept
                  </label>
                  <select
                    value={newSub.department}
                    onChange={(e) =>
                      setNewSub({ ...newSub, department: e.target.value })
                    }
                    className="w-full h-14 px-8 bg-slate-50 rounded-xl font-bold uppercase tracking-widest text-[10px] text-slate-700 appearance-none cursor-pointer"
                  >
                    {["CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM"].map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">
                    Semester Mapping
                  </label>
                  <select
                    value={newSub.semester}
                    onChange={(e) =>
                      setNewSub({ ...newSub, semester: e.target.value })
                    }
                    className="w-full h-14 px-8 bg-slate-50 rounded-xl font-bold uppercase tracking-widest text-[10px] text-slate-700 appearance-none cursor-pointer"
                  >
                    {["SEM-1", "SEM-2"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-16 bg-blue-600 text-white rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-none hover:bg-blue-700 transition-all mt-6"
              >
                {editingSub
                  ? "Update Architectural Database"
                  : "Finalize Course Entry 🎓"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
