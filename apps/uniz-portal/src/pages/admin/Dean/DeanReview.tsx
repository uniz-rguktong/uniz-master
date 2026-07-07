/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  Eye,
  AlertCircle,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Check,
  Edit,
  Download,
  FileSpreadsheet,
  Plus,
  Trash2,
  X,
  Users,
  BookText,
} from "lucide-react";
import { Spinner } from "../../../components/ui/ios-spinner";
import {
  DEAN_REVIEW,
  APPROVE_ALLOCATION,
  BASE_URL,
  GET_SUBJECTS,
  GET_AVAILABLE_BATCHES,
} from "../../../api/endpoints";
import { toast } from "@/utils/toast-ref";
import { apiClient } from "../../../api/apiClient";
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
} from "../../../components/admin/admin-ui";

interface Allocation {
  id: string;
  semesterId: string;
  branch: string;
  subjectId: string;
  facultyId: string | null;
  customName: string | null;
  customCode: string | null;
  customCredits: number | null;
  isApproved: boolean;
  batch?: string;
  academicYear: string;
  subject: {
    id: string;
    name: string;
    code: string;
    credits: number;
    department: string;
    semester: string;
  };
}

export default function DeanReview() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [editing, setEditing] = useState<Allocation | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [filterYear, setFilterYear] = useState("all");
  const [filterBatch, setFilterBatch] = useState("all");
  const [availableBatches, setAvailableBatches] = useState<string[]>([]);
  const [newAllocData, setNewAllocData] = useState({
    subjectId: "",
    academicYear: "E4",
    batch: "",
  });

  // Get department from localStorage (AdminInfo)
  const adminInfo = (() => {
    try {
      const stored = localStorage.getItem("admin_info");
      if (!stored) return {};
      const parsed = JSON.parse(stored);
      return typeof parsed === "string" ? { department: parsed } : parsed;
    } catch {
      return { department: localStorage.getItem("department") || "CSE" };
    }
  })();

  const department = adminInfo.department;

  const fetchData = async () => {
    setLoading(true);
    try {
      const yearQuery = filterYear !== "all" ? `year=${filterYear}` : "";
      const batchQuery = filterBatch !== "all" ? `batch=${filterBatch}` : "";
      const query = [yearQuery, batchQuery].filter(Boolean).join("&");

      const [allocData, subjectsData, batchesData] = await Promise.all([
        apiClient<any[]>(
          `${DEAN_REVIEW(department)}${query ? `?${query}` : ""}`,
        ),
        apiClient<any[]>(GET_SUBJECTS),
        apiClient<string[]>(GET_AVAILABLE_BATCHES),
      ]);
      setAllocations(allocData || []);
      setAllSubjects(subjectsData || []);
      setAvailableBatches(batchesData || []);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [department, filterYear, filterBatch]);

  const handleApprove = async (allocationId: string) => {
    setApproving(allocationId);
    try {
      await apiClient(APPROVE_ALLOCATION, {
        method: "POST",
        body: JSON.stringify({ allocationId }),
      });
      toast.success("Subject allocation approved");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Approval failed");
    } finally {
      setApproving(null);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await apiClient(`${BASE_URL}/academics/dean/allocation/${editing.id}`, {
        method: "PUT",
        body: JSON.stringify(editing),
      });
      toast.success("Allocation updated");
      setEditing(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Update failed");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAllocData.subjectId) return;

    // Find active semester
    const activeSem = allocations[0]?.semesterId;
    if (!activeSem) {
      toast.error("No active semester group found. Cannot add manually.");
      return;
    }

    try {
      await apiClient(`${BASE_URL}/academics/dean/allocation`, {
        method: "POST",
        body: JSON.stringify({
          ...newAllocData,
          semesterId: activeSem,
          branch: department,
        }),
      });
      toast.success("Subject added to rollout");
      setShowAddModal(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to add subject");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remove this subject from registration?")) return;
    try {
      await apiClient(`${BASE_URL}/academics/dean/allocation/${id}`, {
        method: "DELETE",
      });
      toast.success("Subject removed");
      fetchData();
    } catch (error: any) {
      toast.error("Deletion failed");
    }
  };

  const handleExport = async () => {
    // Disabled until EXPORT_ACADEMIC_DATA is implemented
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
            {department} Branch Review
          </h2>
          <p className="text-zinc-500 font-medium">
            Review and finalize subjects for the current semester registration
            rollout.
          </p>
          <div className="flex gap-4 mt-6">
            <div className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-2xl border border-zinc-100 shadow-sm">
              <Users size={14} className="text-zinc-400" />
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="font-semibold text-[10px] tracking-[0.14em] text-zinc-700 outline-none border-none bg-transparent"
              >
                <option value="all">All Years</option>
                {["E1", "E2", "E3", "E4"].map((y) => (
                  <option key={y} value={y}>
                    {y} Engineering
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-2xl border border-zinc-100 shadow-sm">
              <BookText size={14} className="text-zinc-400" />
              <select
                value={filterBatch}
                onChange={(e) => setFilterBatch(e.target.value)}
                className="font-semibold text-[10px] tracking-[0.14em] text-zinc-700 outline-none border-none bg-transparent"
              >
                <option value="all">All Batches</option>
                {availableBatches.map((b) => (
                  <option key={b} value={b}>
                    Batch {b}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {allocations.length > 0 && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-zinc-200 rounded-2xl text-zinc-600 font-bold text-xs hover:bg-zinc-50 transition-all shadow-sm"
            >
              <FileSpreadsheet size={16} />
              Export XLS
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-2xl font-bold text-xs hover:bg-zinc-800 transition-all shadow-xl"
          >
            <Plus size={16} />
            Add Subject
          </button>
          <div className="flex items-center gap-3 px-6 py-3 bg-amber-50 rounded-2xl border border-amber-100">
            <AlertCircle className="text-amber-500" size={18} />
            <p className="text-amber-700 text-xs font-semibold tracking-[0.14em]">
              {allocations.filter((a: any) => !a.isApproved).length} Pending
              Approvals
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      ) : allocations.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {allocations.map((alloc) => (
            <div
              key={alloc.id}
              className={`bg-white border-2 rounded-3xl p-8 transition-all ${
                alloc.isApproved
                  ? "border-emerald-50 opacity-80"
                  : "border-zinc-100 shadow-xl hover:border-zinc-100"
              } group`}
            >
              <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-8">
                <div className="flex items-center gap-6">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                      alloc.isApproved
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-zinc-50 text-zinc-900 group-hover:bg-zinc-900 group-hover:text-white"
                    }`}
                  >
                    <BookOpen size={28} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold tracking-[0.14em] text-zinc-400">
                        {alloc.subject.code}
                      </span>
                      {alloc.isApproved && (
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md text-[8px] font-semibold tracking-[0.14em] flex items-center gap-1">
                          <Check size={8} strokeWidth={4} /> Approved
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold text-zinc-900 tracking-tight leading-tight italic">
                      {alloc.subject.name}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {!alloc.isApproved ? (
                    <>
                      <button
                        onClick={() => setEditing(alloc)}
                        className="p-3.5 bg-zinc-50 text-zinc-400 rounded-2xl hover:bg-zinc-900 hover:text-white transition-all shadow-sm"
                        title="Edit Subject"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(alloc.id)}
                        className="p-3.5 bg-red-50 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button
                        disabled={approving === alloc.id}
                        onClick={() => handleApprove(alloc.id)}
                        className="bg-zinc-900 text-white px-8 py-3.5 rounded-2xl font-semibold tracking-[0.14em] text-[10px] flex items-center gap-2 hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-50"
                      >
                        {approving === alloc.id ? (
                          <Spinner size="sm" className="brightness-200" />
                        ) : (
                          <CheckCircle size={16} />
                        )}
                        Approve
                      </button>
                    </>
                  ) : (
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border-2 border-emerald-100">
                      <ShieldCheck size={24} />
                    </div>
                  )}
                </div>
              </div>

              {/* Subject Meta (Secondary info) */}
              <div className="mt-6 pt-6 border-t border-zinc-50 flex flex-wrap gap-8">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-semibold text-zinc-300 tracking-[0.14em]">
                    Credits
                  </span>
                  <span className="font-bold text-zinc-600 text-xs">
                    {alloc.subject.credits} Units
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-semibold text-zinc-300 tracking-[0.14em]">
                    Semester
                  </span>
                  <span className="font-bold text-zinc-600 text-xs">
                    {alloc.subject.semester}
                  </span>
                </div>
                {alloc.batch && (
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-semibold text-zinc-300 tracking-[0.14em]">
                      Batch
                    </span>
                    <span className="font-bold text-zinc-600 text-xs">
                      {alloc.batch}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-semibold text-zinc-300 tracking-[0.14em]">
                    Year
                  </span>
                  <span className="font-bold text-zinc-600 text-xs text-zinc-900">
                    {alloc.academicYear}
                  </span>
                </div>
                {!alloc.isApproved && (
                  <div className="ml-auto flex items-center gap-2 text-[10px] font-bold text-zinc-900 tracking-[0.14em]">
                    Ready for Review <ArrowRight size={12} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-80 bg-white rounded-3xl border-2 border-dashed border-zinc-100 p-12 text-center">
          <div className="w-20 h-20 bg-zinc-50 rounded-3xl flex items-center justify-center text-zinc-200 mb-6">
            <Eye size={40} />
          </div>
          <h3 className="text-xl font-semibold text-zinc-900">All caught up!</h3>
          <p className="text-zinc-400 font-medium max-w-sm font-outfit mt-2">
            No subjects are pending for your branch review at this time.
          </p>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
          <div className={cn("w-full max-w-xl p-8 space-y-6", adminModalShellClass)}>
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="text-[11px] font-medium text-zinc-500">{editing.subject.code}</span>
                <h3 className={adminModalTitleClass}>Adjust allocation</h3>
                <p className={adminModalDescClass}>
                  Update elective details or credit values.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="text-zinc-400 hover:text-zinc-900 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-5">
              <div className="space-y-2">
                <label className={adminLabelClass}>Academic code</label>
                <input
                  value={editing.customCode || editing.subject.code}
                  onChange={(e) =>
                    setEditing({ ...editing, customCode: e.target.value.toUpperCase() })
                  }
                  className={adminInputClass}
                  placeholder="Official code for sheets / slips"
                />
              </div>
              <div className="space-y-2">
                <label className={adminLabelClass}>Subject name (custom for electives)</label>
                <input
                  value={editing.customName || editing.subject.name}
                  onChange={(e) =>
                    setEditing({ ...editing, customName: e.target.value })
                  }
                  className={adminInputClass}
                  placeholder="e.g. ELECTIVE (NPTEL - Deep Learning)"
                />
              </div>

              <div className="space-y-2">
                <label className={adminLabelClass}>Credits</label>
                <input
                  type="number"
                  value={editing.customCredits || editing.subject.credits}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      customCredits: parseInt(e.target.value) || null,
                    })
                  }
                  className={adminInputClass}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className={cn(adminGhostButtonClass, "flex-1")}
                >
                  Cancel
                </button>
                <button type="submit" className={cn(adminPrimaryButtonClass, "flex-[2]")}>
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
          <div className={cn("w-full max-w-xl p-8 space-y-6", adminModalShellClass)}>
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className={adminModalTitleClass}>Manual allocation</h3>
                <p className={adminModalDescClass}>
                  Add a subject from the curriculum to this rollout.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-zinc-900 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-5">
              <div className="space-y-2">
                <label className={adminLabelClass}>Select subject</label>
                <select
                  required
                  value={newAllocData.subjectId}
                  onChange={(e) =>
                    setNewAllocData({
                      ...newAllocData,
                      subjectId: e.target.value,
                    })
                  }
                  className={adminSelectClass}
                >
                  <option value="">Choose a subject…</option>
                  {allSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      [{s.code}] {s.name} ({s.credits} credits)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className={adminLabelClass}>Academic year</label>
                <select
                  value={newAllocData.academicYear}
                  onChange={(e) =>
                    setNewAllocData({
                      ...newAllocData,
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

              <div className="space-y-2">
                <label className={adminLabelClass}>Student batch (optional)</label>
                <select
                  value={newAllocData.batch}
                  onChange={(e) =>
                    setNewAllocData({
                      ...newAllocData,
                      batch: e.target.value,
                    })
                  }
                  className={adminSelectClass}
                >
                  <option value="">Infer from year</option>
                  {availableBatches.map((b) => (
                    <option key={b} value={b}>
                      Batch {b}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={cn(adminGhostButtonClass, "flex-1")}
                >
                  Cancel
                </button>
                <button type="submit" className={cn(adminPrimaryButtonClass, "flex-[2]")}>
                  Add subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
