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
  Check,
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
  BASE_URL,
  GET_AVAILABLE_BATCHES,
} from "../../../api/endpoints";
import { toast } from "@/utils/toast-ref";
import { cn } from "../../../utils/cn";
import {
  adminModalShellClass,
  adminModalTitleClass,
  adminModalDescClass,
  adminLabelClass,
  adminInputClass,
  adminSelectClass,
  adminPrimaryButtonClass,
  adminGhostButtonClass,
  adminWarningBannerClass,
} from "../../../components/admin/admin-ui";

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
  const [allBranchesSelected, setAllBranchesSelected] = useState(true);

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
      const res = await apiClient<{ success: boolean; batches: string[] }>(
        GET_AVAILABLE_BATCHES,
      );
      if (res && res.success) setAvailableBatches(res.batches);
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
      await apiClient(`${BASE_URL}/academics/dean/allocation`, {
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
      await apiClient(`${BASE_URL}/academics/dean/allocation/${id}`, {
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
        <div className="flex flex-col gap-1.5 mb-2">
          <h2 className="text-3xl font-semibold tracking-[-0.02em] text-zinc-900 leading-none">
            Sem Registration
          </h2>
          <p className="text-zinc-500 font-medium text-[15px]">
            Master curriculum control and semester lifecycle management.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchSemesters();
              fetchMasterSubjects();
            }}
            className="p-3 bg-white border border-zinc-100 rounded-xl text-zinc-400 hover:text-zinc-900 transition-all active:scale-95"
          >
            <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setShowNewSemModal(true)}
            className="h-12 px-8 bg-zinc-900 text-white rounded-xl font-semibold text-[10px] uppercase tracking-[0.14em] hover:bg-black transition-all flex items-center gap-3 shadow-lg shadow-zinc-100/50"
          >
            <Zap size={14} /> New Rollout
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex gap-2 bg-white/50 p-1.5 rounded-xl border border-zinc-100 w-fit backdrop-blur-sm">
        {(["catalog", "subjects", "rollout"] as const).map((tabId) => {
          const labels: Record<string, string> = {
            catalog: "Catalog",
            subjects: "Master Catalogue",
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
                flex items-center gap-3 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-[0.14em] transition-all
                ${
                  activeTab === tabId
                    ? "bg-white text-zinc-900 border border-zinc-100"
                    : "text-zinc-400 hover:text-zinc-900 hover:bg-white/80"
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
                className="bg-white rounded-xl border border-zinc-100 p-8 transition-all group cursor-pointer overflow-hidden relative"
              >
                <div className="flex justify-between items-start mb-10">
                  <div
                    className={`p-4 rounded-xl ${sem.status === "REGISTRATION_OPEN" ? "bg-emerald-50 text-emerald-600" : "bg-zinc-50 text-zinc-400"}`}
                  >
                    <Calendar size={28} />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`px-4 py-1.5 rounded-xl text-[9px] font-semibold uppercase tracking-[0.14em] border ${
                        sem.status === "REGISTRATION_OPEN"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : "bg-zinc-50 text-zinc-400 border-zinc-100"
                      }`}
                    >
                      {sem.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
                <h3 className="text-2xl font-semibold text-zinc-900 tracking-tight group-hover:text-zinc-900 transition-colors uppercase">
                  {sem.name}
                </h3>
                <div className="flex items-center gap-6 mt-6 mb-8">
                  <div>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.14em] mb-1">
                      Enrollment
                    </p>
                    <p className="text-lg font-semibold text-zinc-900">
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
                <div className="w-full h-2 bg-zinc-50 rounded-full overflow-hidden mt-auto">
                  <div
                    className={`h-full transition-all duration-1000 ${sem.status === "REGISTRATION_OPEN" ? "w-full bg-emerald-500" : "w-1/3 bg-zinc-500"}`}
                  ></div>
                </div>
              </div>
            ))}
            {semesters.length === 0 && (
              <div className="col-span-full py-24 bg-white rounded-xl border-dashed border-2 border-zinc-100 p-12 text-center animate-in fade-in zoom-in-95 duration-700">
                <div className="w-24 h-24 bg-zinc-50 text-zinc-900 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-white shadow-none">
                  <BookOpen size={40} strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-semibold text-zinc-900 mb-3 tracking-tight italic">
                  Relaxation levels are dangerously high.
                </h3>
                <p className="text-zinc-500 font-medium max-w-md mx-auto mb-10 leading-relaxed">
                  Campus vibes: 100% chill. Students are relaxing… but don't
                  worry, semester registration is loading to take care of that.
                </p>
                <button
                  onClick={() => setShowNewSemModal(true)}
                  className="px-10 py-5 bg-zinc-900 text-white rounded-xl font-semibold uppercase tracking-[0.14em] text-[10px] hover:bg-black transition-all active:scale-95 shadow-none"
                >
                  Initiate New Rollout
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "subjects" && (
          <div className="space-y-8">
            <div className="flex flex-wrap gap-4 bg-white p-6 rounded-xl border border-zinc-100">
              <div className="relative flex-1 min-w-[300px]">
                <Search
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search master subjects..."
                  value={subSearch}
                  onChange={(e) => setSubSearch(e.target.value)}
                  className="w-full h-12 pl-14 pr-6 bg-zinc-50 rounded-xl outline-none focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-100 font-bold text-zinc-900"
                />
              </div>
              <select
                value={subDept}
                onChange={(e) => setSubDept(e.target.value)}
                className="h-12 px-8 bg-zinc-50 rounded-xl font-bold uppercase tracking-[0.14em] text-[10px] text-zinc-600 border-none outline-none appearance-none"
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
                className="h-12 px-8 bg-zinc-900 text-white rounded-xl font-bold uppercase tracking-[0.14em] text-[10px] transition-all flex items-center gap-2 border-2 border-white/20 shadow-none"
              >
                <PlusCircle size={16} /> Add New Subject
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {allSubjects.map((sub, i) => (
                <div
                  key={i}
                  className="bg-white border border-zinc-100 rounded-xl p-5 group overflow-hidden"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-zinc-50 rounded-xl text-zinc-900 border border-zinc-100 transition-all">
                      <BookText size={20} />
                    </div>
                    <div className="px-3 py-1 bg-zinc-50 rounded-xl text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                      {sub.code}
                    </div>
                  </div>
                  <h3 className="text-base font-semibold text-zinc-900 leading-tight mb-2">
                    {sub.name}
                  </h3>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-50">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
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
                      className="text-zinc-300 hover:text-zinc-900 transition-colors"
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
            <div className="bg-zinc-900 rounded-xl p-10 text-white relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-4 py-1.5 bg-zinc-500/20 text-blue-400 rounded-xl text-[10px] font-semibold uppercase tracking-[0.14em] border border-zinc-100/30">
                      Active Rollout
                    </span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-xs font-bold text-zinc-400 italic">
                      Created{" "}
                      {new Date(selectedSem.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h2 className="text-5xl font-semibold tracking-tighter italic">
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
                    className={`h-14 px-10 rounded-xl font-semibold text-[10px] uppercase tracking-[0.14em] transition-all flex items-center gap-3 ${
                      selectedSem.status === "REGISTRATION_OPEN"
                        ? "bg-red-50/5 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white"
                        : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-100"
                    }`}
                  >
                    {selectedSem.status === "REGISTRATION_OPEN" ? (
                      <>Stop Enrollment</>
                    ) : (
                      <>Launch enrollment</>
                    )}
                  </button>
                  <button
                    onClick={handleGlobalApprove}
                    className="h-14 px-8 bg-white/10 text-white rounded-xl font-semibold text-xs uppercase tracking-[0.14em] hover:bg-white/20 transition-all border border-white/10"
                  >
                    Push Progress
                  </button>
                </div>
              </div>
              <div className="absolute right-0 top-0 w-64 h-64 bg-zinc-900/10 blur-[120px] rounded-full"></div>
            </div>

            <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
              <div className="flex gap-8">
                {(["allocations", "registrations"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setRolloutView(v)}
                    className={`pb-4 text-[13px] font-semibold uppercase tracking-[0.14em] transition-all relative ${
                      rolloutView === v
                        ? "text-zinc-900"
                        : "text-zinc-400 hover:text-zinc-600"
                    }`}
                  >
                    {v}
                    {rolloutView === v && (
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-zinc-900 rounded-full animate-in fade-in duration-500"></div>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 mb-4">
                <div className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-xl border border-zinc-100 shadow-none">
                  <Filter size={14} className="text-zinc-400" />
                  <select
                    value={filterBranch}
                    onChange={(e) => setFilterBranch(e.target.value)}
                    className="font-semibold text-[10px] uppercase tracking-[0.14em] text-zinc-700 outline-none border-none bg-transparent"
                  >
                    <option value="all">All Branches</option>
                    {["CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM"].map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-xl border border-zinc-100 shadow-none">
                  <Users size={14} className="text-zinc-400" />
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="font-semibold text-[10px] uppercase tracking-[0.14em] text-zinc-700 outline-none border-none bg-transparent"
                  >
                    <option value="all">All Years</option>
                    {["E1", "E2", "E3", "E4"].map((y) => (
                      <option key={y} value={y}>
                        {y} Engineering
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-xl border border-zinc-100 shadow-none">
                  <BookText size={14} className="text-zinc-400" />
                  <select
                    value={filterBatch}
                    onChange={(e) => setFilterBatch(e.target.value)}
                    className="font-semibold text-[10px] uppercase tracking-[0.14em] text-zinc-700 outline-none border-none bg-transparent"
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
                    className="flex items-center gap-2 bg-zinc-900 text-white px-6 py-2.5 rounded-xl font-semibold text-[10px] uppercase tracking-[0.14em] shadow-none hover:scale-105 active:scale-95 transition-all"
                  >
                    <Plus size={14} /> Add subject
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
              {rolloutView === "allocations" ? (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-zinc-50/50 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400 border-b border-zinc-100">
                      <th className="px-10 py-6">Course Structure</th>
                      <th className="px-10 py-6">Branch / Year</th>
                      <th className="px-10 py-6">Status</th>
                      <th className="px-10 py-6 text-right">Manage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {rolloutAllocations.map((item) => (
                      <tr
                        key={item.id}
                        className="group hover:bg-zinc-50/50 transition-colors"
                      >
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-300 group-hover:text-zinc-900 group-hover:bg-zinc-50 transition-all">
                              <BookOpen size={20} />
                            </div>
                            <div>
                              <p className="font-bold text-zinc-900">
                                {item.customName || item.subject.name}
                              </p>
                              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-[0.14em]">
                                {item.subject.code} •{" "}
                                {item.customCredits || item.subject.credits}{" "}
                                Credits
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-zinc-100 text-zinc-600 rounded-xl text-[9px] font-semibold uppercase tracking-[0.14em]">
                              {item.branch}
                            </span>
                            <span className="px-3 py-1 bg-zinc-50 text-zinc-900 rounded-xl text-[9px] font-semibold uppercase tracking-[0.14em]">
                              {item.academicYear}
                            </span>
                            {item.batch && (
                              <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-xl text-[9px] font-semibold uppercase tracking-[0.14em]">
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
                            <span className="text-[11px] font-extrabold uppercase tracking-tight text-zinc-600">
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
                    <tr className="bg-zinc-50/50 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400 border-b border-zinc-100">
                      <th className="px-10 py-6">Enrolled Student</th>
                      <th className="px-10 py-6">Batch</th>
                      <th className="px-10 py-6">Allocated Course</th>
                      <th className="px-10 py-6">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {rolloutRegistrations.map((reg) => (
                      <tr
                        key={reg.id}
                        className="hover:bg-zinc-50 transition-colors"
                      >
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center font-semibold text-zinc-400">
                              {reg.studentId[0]}
                            </div>
                            <p className="font-bold text-zinc-900 tracking-tight">
                              {reg.studentId}
                            </p>
                          </div>
                        </td>
                        <td className="px-10 py-6">
                          <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-xl text-[9px] font-semibold uppercase tracking-[0.14em]">
                            {reg.batch || "N/A"}
                          </span>
                        </td>
                        <td className="px-10 py-6">
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-zinc-800">
                              {reg.subject.name}
                            </p>
                            <p className="text-[9px] font-semibold italic text-zinc-400">
                              {reg.subject.code}
                            </p>
                          </div>
                        </td>
                        <td className="px-10 py-6 text-xs font-bold text-zinc-400">
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
                  <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-200">
                    <X size={40} />
                  </div>
                  <p className="text-zinc-400 font-bold uppercase tracking-[0.14em] text-xs">
                    Zero activity detected for these parameters.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showNewSemModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm"
          onClick={() => setShowNewSemModal(false)}
        >
          <div
            className={cn("w-full max-w-md relative", adminModalShellClass)}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowNewSemModal(false)}
              className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 rounded-full transition-all z-10"
            >
              <X size={20} />
            </button>
            <div className="p-8">
              <h3 className={cn(adminModalTitleClass, "mb-1")}>Academic rollout</h3>
              <p className={cn(adminModalDescClass, "mb-6")}>
                Initialize a new semester registration event for the campus.
              </p>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className={adminLabelClass}>Semester name</label>
                  <input
                    type="text"
                    value={newSemName}
                    onChange={(e) => setNewSemName(e.target.value)}
                    className={adminInputClass}
                    placeholder="e.g. AY 2024-25 SEM-II"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className={adminLabelClass}>Applicable branches</label>
                    <div
                      className="flex items-center gap-2 cursor-pointer group"
                      onClick={() => {
                        const next = !allBranchesSelected;
                        setAllBranchesSelected(next);
                        if (next)
                          setSelectedBranches([
                            "CSE",
                            "ECE",
                            "EEE",
                            "MECH",
                            "CIVIL",
                            "CHEM",
                          ]);
                      }}
                    >
                      <div
                        className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center transition-all",
                          allBranchesSelected
                            ? "bg-zinc-900 border-zinc-900"
                            : "border-zinc-300 group-hover:border-zinc-500",
                        )}
                      >
                        {allBranchesSelected && (
                          <Check size={12} className="text-white" strokeWidth={4} />
                        )}
                      </div>
                      <span className="text-[12px] font-medium text-zinc-600">
                        All branches
                      </span>
                    </div>
                  </div>

                  {!allBranchesSelected && (
                    <div className="grid grid-cols-3 gap-2">
                      {["CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM"].map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() =>
                            setSelectedBranches((prev) =>
                              prev.includes(b)
                                ? prev.filter((x) => x !== b)
                                : [...prev, b],
                            )
                          }
                          className={cn(
                            "h-10 rounded-xl text-[12px] font-semibold border transition-all",
                            selectedBranches.includes(b)
                              ? "bg-zinc-900 text-white border-zinc-900"
                              : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300",
                          )}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewSemModal(false)}
                    className={cn(adminGhostButtonClass, "flex-1")}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleInitSemester}
                    disabled={
                      loading ||
                      (selectedBranches.length === 0 && !allBranchesSelected)
                    }
                    className={cn(adminPrimaryButtonClass, "flex-[2]")}
                  >
                    {loading ? "Initializing…" : "Launch rollout"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddAllocModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
          <div className={cn("w-full max-w-xl p-8 space-y-6", adminModalShellClass)}>
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className={adminModalTitleClass}>Manual course allocation</h3>
                <p className={adminModalDescClass}>
                  Force-add a course to the current rollout context.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAllocModal(false)}
                className="text-zinc-400 hover:text-zinc-900 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className={adminLabelClass}>Search course catalog</label>
                <select
                  value={addAllocData.subjectId}
                  onChange={(e) =>
                    setAddAllocData({
                      ...addAllocData,
                      subjectId: e.target.value,
                    })
                  }
                  className={adminSelectClass}
                >
                  <option value="">Select subject…</option>
                  {allSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      [{s.code}] {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={adminLabelClass}>Branch target</label>
                  <select
                    value={addAllocData.branch}
                    onChange={(e) =>
                      setAddAllocData({
                        ...addAllocData,
                        branch: e.target.value,
                      })
                    }
                    className={adminSelectClass}
                  >
                    {filterBranch === "all" ? (
                      ["CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM"].map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))
                    ) : (
                      <option value={filterBranch}>{filterBranch}</option>
                    )}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className={adminLabelClass}>Year target</label>
                  <select
                    value={addAllocData.academicYear}
                    onChange={(e) =>
                      setAddAllocData({
                        ...addAllocData,
                        academicYear: e.target.value,
                      })
                    }
                    className={adminSelectClass}
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
                type="button"
                onClick={handleManualAlloc}
                disabled={loading || !addAllocData.subjectId}
                className={cn(adminPrimaryButtonClass, "w-full")}
              >
                Confirm allocation
              </button>
            </div>

            <div className={cn(adminWarningBannerClass, "mt-2")}>
              <p className="text-[12px] font-medium leading-relaxed">
                <ShieldCheck size={14} className="inline mr-2 align-text-bottom" />
                This creates a new BranchAllocation record for the target semester.
                Changes are visible to students once enrollment opens.
              </p>
            </div>
          </div>
        </div>
      )}

      {showSubModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
          <div className={cn("w-full max-w-xl p-8 relative", adminModalShellClass)}>
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className={adminModalTitleClass}>
                  {editingSub ? "Modify subject" : "Add subject"}
                </h3>
                <p className={adminModalDescClass}>
                  {editingSub
                    ? "Update course details in the catalog."
                    : "Create a new course entry in the catalog."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSubModal(false)}
                className="text-zinc-400 hover:text-zinc-900 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSub} className="space-y-5">
              <div className="space-y-2">
                <label className={adminLabelClass}>Course name</label>
                <input
                  required
                  value={newSub.name}
                  onChange={(e) =>
                    setNewSub({ ...newSub, name: e.target.value })
                  }
                  className={adminInputClass}
                  placeholder="e.g. Distributed Systems"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={adminLabelClass}>Course code</label>
                  <input
                    required
                    value={newSub.code}
                    onChange={(e) =>
                      setNewSub({
                        ...newSub,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    className={adminInputClass}
                    placeholder="CS401"
                  />
                </div>
                <div className="space-y-2">
                  <label className={adminLabelClass}>Credits</label>
                  <input
                    type="number"
                    value={newSub.credits}
                    onChange={(e) =>
                      setNewSub({
                        ...newSub,
                        credits: parseInt(e.target.value),
                      })
                    }
                    className={adminInputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={adminLabelClass}>Department</label>
                  <select
                    value={newSub.department}
                    onChange={(e) =>
                      setNewSub({ ...newSub, department: e.target.value })
                    }
                    className={adminSelectClass}
                  >
                    {["CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM"].map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className={adminLabelClass}>Semester</label>
                  <select
                    value={newSub.semester}
                    onChange={(e) =>
                      setNewSub({ ...newSub, semester: e.target.value })
                    }
                    className={adminSelectClass}
                  >
                    {["SEM-1", "SEM-2"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button type="submit" className={cn(adminPrimaryButtonClass, "w-full mt-2")}>
                {editingSub ? "Update subject" : "Create subject"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
