import { useState, useEffect } from "react";
import { cn } from "../../../utils/cn";
import {
  Plus,
  Trash2,
  Clock,
  ChevronRight,
  Download,
  Edit3,
  ShieldCheck,
  Zap,
  BookOpen,
  X,
} from "lucide-react";
import { apiClient, downloadFile } from "../../../api/apiClient";
import {
  SEMESTERS,
  INIT_SEMESTER,
  UPDATE_SEMESTER_STATUS,
  DELETE_SEMESTER,
  DEAN_REVIEW,
  DEAN_APPROVE,
  GET_REGISTRATIONS,
  BASE_URL,
  GET_SUBJECTS,
} from "../../../api/endpoints";
import { toast } from "react-toastify";

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
  subject: { name: string; code: string; credits: number };
  isApproved: boolean;
  customName?: string;
  customCredits?: number;
  facultyId?: string;
  isMandatory: boolean;
  electiveGroupId?: string;
  electiveLimit?: number;
}

export default function SemesterRegistrationSection({
  isAdmin = true,
  branch = "",
}: {
  isAdmin?: boolean;
  branch?: string;
}) {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [activeTab, setActiveTab] = useState<"list" | "details">("list");
  const [selectedSem, setSelectedSem] = useState<Semester | null>(null);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState<Allocation | null>(
    null,
  );
  const [editFormData, setEditFormData] = useState({
    customName: "",
    customCredits: 0,
    isMandatory: true,
    electiveGroupId: "",
    electiveLimit: 1,
  });
  const [activeViewTab, setActiveViewTab] = useState<
    "allocations" | "registrations"
  >("allocations");
  const [registeredStudents, setRegisteredStudents] = useState<any[]>([]);
  const [branchFilter, setBranchFilter] = useState(branch || "all");
  const [yearFilter, setYearFilter] = useState("all");

  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState("AY 2024-25 SEM-2");
  const [selectedBranches, setSelectedBranches] = useState([
    "CSE",
    "ECE",
    "EEE",
    "MECH",
    "CIVIL",
    "CHEM",
  ]);

  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [addSubjectData, setAddSubjectData] = useState({
    subjectId: "",
    academicYear: "E1",
  });
  const [subjectSearchQuery, setSubjectSearchQuery] = useState("");

  const role = (() => {
    try {
      const stored = localStorage.getItem("admin_role");
      if (!stored) return "";
      return stored.replace(/"/g, "");
    } catch {
      return "";
    }
  })();

  useEffect(() => {
    fetchSemesters();
    fetchMasterSubjects();
  }, []);

  useEffect(() => {
    if (activeTab === "details" && selectedSem) {
      if (activeViewTab === "allocations") {
        fetchAllocations();
      } else {
        fetchRegistrations();
      }
    }
  }, [activeTab, branchFilter, yearFilter, selectedSem?.id, activeViewTab]);

  const fetchSemesters = async () => {
    try {
      const res = await apiClient<any[]>(SEMESTERS);
      if (res) setSemesters(res);
    } catch (err) {
      console.error("Failed to fetch semesters");
    }
  };

  const fetchMasterSubjects = async () => {
    try {
      const res = await apiClient<any[]>(GET_SUBJECTS);
      if (res) setAllSubjects(res);
    } catch (err) {
      console.error("Failed to fetch master subjects");
    }
  };

  const initSemester = async () => {
    setLoading(true);
    try {
      const res = await apiClient(INIT_SEMESTER, {
        method: "POST",
        body: JSON.stringify({
          academicSemester: newName,
          branches: selectedBranches.map((b) => ({ branchName: b })),
        }),
      });
      if (res) {
        toast.success("Semester Initialized Successfully");
        setShowNewModal(false);
        fetchSemesters();
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteSemester = async (id: string) => {
    if (!window.confirm("Are you sure? This is IRREVERSIBLE.")) return;
    try {
      await apiClient(DELETE_SEMESTER(id), { method: "DELETE" });
      toast.success("Semester Deleted");
      fetchSemesters();
    } catch (err) {
      toast.error("Deletion Failed");
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await apiClient(UPDATE_SEMESTER_STATUS(id), {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      if (res) {
        toast.success("Status Updated");
        fetchSemesters();
      }
    } catch (err) {
      toast.error("Update Failed");
    }
  };

  const viewDetails = (sem: Semester) => {
    setSelectedSem(sem);
    setActiveTab("details");
  };

  const fetchRegistrations = async () => {
    if (!selectedSem) return;
    setLoading(true);
    try {
      const res = await apiClient<any[]>(
        `${GET_REGISTRATIONS}?semesterId=${selectedSem.id}&branch=${branchFilter}`,
      );
      if (res) setRegisteredStudents(res);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllocations = async () => {
    if (!selectedSem) return;
    setLoading(true);
    try {
      const yearQuery = yearFilter !== "all" ? `&year=${yearFilter}` : "";
      const res = await apiClient<any>(
        `${DEAN_REVIEW(branchFilter)}?semesterId=${selectedSem.id}${yearQuery}`,
      );
      if (res) setAllocations(res);
    } finally {
      setLoading(false);
    }
  };

  const approveAllocation = async () => {
    setLoading(true);
    try {
      const res = await apiClient(DEAN_APPROVE, {
        method: "POST",
        body: JSON.stringify({
          branch: branchFilter,
          semesterId: selectedSem?.id,
          year: yearFilter !== "all" ? yearFilter : undefined,
        }),
      });
      if (res) {
        toast.success(
          role === "dean"
            ? "Approved for HOD review"
            : "Final approval complete",
        );
        fetchAllocations();
      }
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (item: Allocation) => {
    setEditingAllocation(item);
    setEditFormData({
      customName: item.customName || item.subject.name,
      customCredits: item.customCredits || item.subject.credits,
      isMandatory: item.isMandatory ?? true,
      electiveGroupId: item.electiveGroupId || "",
      electiveLimit: item.electiveLimit || 1,
    });
  };

  const saveAllocation = async () => {
    if (!editingAllocation) return;
    setLoading(true);
    try {
      await apiClient(
        `${BASE_URL}/academics/dean/allocation/${editingAllocation.id}`,
        {
          method: "PUT",
          body: JSON.stringify(editFormData),
        },
      );
      toast.success("Allocation Updated");
      setEditingAllocation(null);
      fetchAllocations();
    } catch (err) {
      toast.error("Failed to save changes");
    } finally {
      setLoading(false);
    }
  };

  const removeAllocation = async (id: string) => {
    if (!window.confirm("Remove this subject from the rollout?")) return;
    try {
      await apiClient(`${BASE_URL}/academics/dean/allocation/${id}`, {
        method: "DELETE",
      });
      toast.success("Subject removed");
      fetchAllocations();
    } catch (error) {
      toast.error("Failed to remove subject");
    }
  };

  const addSubjectToRollout = async () => {
    if (!addSubjectData.subjectId || !selectedSem) return;
    setLoading(true);
    try {
      await apiClient(`${BASE_URL}/academics/dean/allocation`, {
        method: "POST",
        body: JSON.stringify({
          ...addSubjectData,
          semesterId: selectedSem.id,
          branch:
            branchFilter === "all" ? (isAdmin ? "CSE" : branch) : branchFilter,
        }),
      });
      toast.success("Subject added to rollout");
      setShowAddSubjectModal(false);
      fetchAllocations();
    } catch (error: any) {
      toast.error(error.message || "Failed to add subject");
    } finally {
      setLoading(false);
    }
  };

  const downloadExport = async (type: string) => {
    if (!selectedSem) return;
    const url = `${BASE_URL}/academics/export`;
    await downloadFile(url, `${selectedSem.name}_${type}.xlsx`, {
      type,
      semesterId: selectedSem.id,
      branch: branchFilter,
    });
  };

  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-700">
      {activeTab === "list" ? (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
                Semester Events
              </h1>
              <p className="text-slate-500 font-medium">
                Coordinate registration rollouts and monitor subject
                allocations.
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowNewModal(true)}
                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-none border-2 border-white/20"
              >
                <Zap size={18} />
                Start New Event
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {semesters.map((sem) => (
              <div
                key={sem.id}
                className="bg-white rounded-xl border border-slate-100 p-8 shadow-none transition-all group relative overflow-hidden"
              >
                <div
                  className={`absolute top-0 right-0 w-32 h-32 opacity-[0.03] transition-transform duration-1000 group-hover:rotate-12 ${sem.status === "REGISTRATION_OPEN" ? "text-emerald-500" : "text-blue-500"}`}
                >
                  <Zap size={120} />
                </div>

                <div className="flex items-start justify-between mb-8">
                  <div
                    className={`p-4 rounded-xl shadow-none ${sem.status === "REGISTRATION_OPEN" ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"}`}
                  >
                    <Clock size={28} />
                  </div>
                  <span
                    className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${sem.status === "REGISTRATION_OPEN"
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                      : sem.status === "DEAN_REVIEW"
                        ? "bg-amber-50 text-amber-600 border-amber-100"
                        : "bg-slate-50 text-slate-400 border-slate-100"
                      }`}
                  >
                    {sem.status.replace("_", " ")}
                  </span>
                </div>

                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-4 group-hover:text-blue-600 transition-colors uppercase">
                  {sem.name}
                </h3>

                <div className="flex items-center gap-6 mb-10">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Registrations
                    </p>
                    <p className="text-xl font-black text-slate-900">
                      {sem._count?.registrations || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Created
                    </p>
                    <p className="text-sm font-bold text-slate-600">
                      {new Date(sem.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => viewDetails(sem)}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-slate-50 text-slate-600 rounded-xl font-bold text-sm hover:bg-blue-50 hover:text-blue-600 transition-all"
                  >
                    Review Allocations <ChevronRight size={16} />
                  </button>

                  {isAdmin && (
                    <div className="flex items-center gap-3 mt-2">
                      {sem.status !== "REGISTRATION_OPEN" && (
                        <button
                          onClick={() =>
                            updateStatus(sem.id, "REGISTRATION_OPEN")
                          }
                          className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all shadow-none"
                        >
                          Open Enrollment
                        </button>
                      )}
                      {sem.status === "REGISTRATION_OPEN" && (
                        <button
                          onClick={() =>
                            updateStatus(sem.id, "REGISTRATION_CLOSED")
                          }
                          className="flex-1 py-4 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all"
                        >
                          Close Enrollment
                        </button>
                      )}
                      <button
                        onClick={() => deleteSemester(sem.id)}
                        className="p-4 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-100 flex items-center justify-center"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {semesters.length === 0 && (
              <div className="col-span-full py-20 bg-white rounded-xl border border-dashed border-slate-200 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Zap className="text-slate-300" size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Ready to start the semester?
                </h3>
                <p className="text-slate-400 text-sm max-w-xs mx-auto mb-8">
                  Click the button above to rollout the registration event.
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        selectedSem && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between bg-white p-8 rounded-xl border border-slate-100 shadow-none">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setActiveTab("list")}
                  className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100"
                >
                  <ChevronRight className="rotate-180" size={24} />
                </button>
                <div>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em] mb-1 opacity-70">
                    Rollout Review • {branchFilter.toUpperCase()}
                  </p>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                    {selectedSem.name}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => downloadExport("allocations")}
                  className="flex items-center gap-3 px-6 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
                >
                  <Download size={18} />
                  Export
                </button>
                {(role === "dean" || role === "hod" || role === "webmaster") &&
                  activeViewTab === "allocations" && (
                    <button
                      onClick={() => setShowAddSubjectModal(true)}
                      className="flex items-center gap-3 px-6 py-4 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-100 transition-all"
                    >
                      <Plus size={18} />
                      Add Subject
                    </button>
                  )}
                {(role === "webmaster" ||
                  role === "dean" ||
                  role === "hod") && (
                    <button
                      onClick={approveAllocation}
                      disabled={loading}
                      className={`flex items-center gap-3 px-8 py-4 ${role === "dean" ? "bg-slate-900" : "bg-blue-600 shadow-none"} text-white rounded-xl font-extrabold text-sm hover:opacity-90 transition-all shadow-none`}
                    >
                      <ShieldCheck size={18} />
                      {role === "dean"
                        ? "Approve Rollout"
                        : role === "hod"
                          ? "Confirm Registration"
                          : "Global Override"}
                    </button>
                  )}
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveViewTab("allocations")}
                  className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${activeViewTab === "allocations" ? "bg-blue-600 text-white shadow-none" : "bg-white text-slate-400 border border-slate-100"}`}
                >
                  Allocations
                </button>
                <button
                  onClick={() => setActiveViewTab("registrations")}
                  className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${activeViewTab === "registrations" ? "bg-blue-600 text-white shadow-none" : "bg-white text-slate-400 border border-slate-100"}`}
                >
                  Registrations
                </button>
              </div>
              <div className="flex gap-2">
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="bg-white border border-slate-100 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500"
                >
                  <option value="all">Every Year</option>
                  {["E1", "E2", "E3", "E4"].map((y) => (
                    <option key={y} value={y}>
                      {y} Engineering
                    </option>
                  ))}
                </select>
                {isAdmin && (
                  <select
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    className="bg-white border border-slate-100 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500"
                  >
                    <option value="all">Every Branch</option>
                    {["CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM"].map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {activeViewTab === "allocations" ? (
              <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-none">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-50 bg-slate-50/30 font-black uppercase tracking-widest text-[10px] text-slate-400">
                      <th className="px-8 py-6">Subject</th>
                      <th className="px-8 py-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {allocations.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/50 transition-all font-bold"
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                              <BookOpen size={20} />
                            </div>
                            <div>
                              <p className="text-slate-900 text-[13px]">
                                {item.customName || item.subject.name}
                              </p>
                              <p className="text-[9px] text-slate-400 tracking-widest">
                                {item.subject.code} •{" "}
                                {item.customCredits || item.subject.credits}{" "}
                                CREDITS
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-xl border border-transparent hover:border-blue-100"
                            >
                              <Edit3 size={18} />
                            </button>
                            <button
                              onClick={() => removeAllocation(item.id)}
                              className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 rounded-xl border border-transparent hover:border-red-100"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                <table className="w-full text-left font-bold">
                  <thead>
                    <tr className="border-b border-slate-50 bg-slate-50/30 text-[10px] text-slate-400 uppercase tracking-widest">
                      <th className="px-8 py-6">Student</th>
                      <th className="px-8 py-6">Subject</th>
                      <th className="px-8 py-6">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registeredStudents.map((reg) => (
                      <tr key={reg.id} className="border-b border-slate-50">
                        <td className="px-8 py-6">{reg.studentId}</td>
                        <td className="px-8 py-6 text-[13px]">
                          {reg.subject?.name}
                        </td>
                        <td className="px-8 py-6">
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px]">
                            {reg.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      )}

      {/* Modals placed outside main conditional branches to be globally accessible */}

      {/* New Event Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-xl rounded-[2rem] p-10 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-5 mb-10">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <Zap size={30} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1.5">
                  Launch Academic Rollout
                </h2>
                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                  Initialize a new semester registration event.
                </p>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <label className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 mb-3 block ml-1">
                  Semester Label (Internal Display)
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300"
                  placeholder="e.g. AY 2024-25 SEM-2"
                />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 mb-4 block ml-1">
                  Applicable Branches
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {["CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM"].map((b) => (
                    <button
                      key={b}
                      onClick={() =>
                        selectedBranches.includes(b)
                          ? setSelectedBranches(
                            selectedBranches.filter((x) => x !== b),
                          )
                          : setSelectedBranches([...selectedBranches, b])
                      }
                      className={cn(
                        "py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all active:scale-95",
                        selectedBranches.includes(b)
                          ? "bg-[#0f172a] text-white border-[#0f172a] shadow-lg shadow-slate-900/20"
                          : "bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-200 hover:text-slate-600"
                      )}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 py-4 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={initSemester}
                  disabled={loading}
                  className="flex-[2] px-10 py-4 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
                >
                  {loading ? "Launching..." : "Launch Rollout"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Subject Add Modal */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden shadow-none p-10 space-y-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start">
              <h3 className="text-2xl font-black text-slate-900 italic">
                Manual subject add
              </h3>
              <button
                onClick={() => setShowAddSubjectModal(false)}
                className="text-slate-400"
              >
                <X />
              </button>
            </div>
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 block">
                  Subject Search
                </label>
                <input
                  type="text"
                  placeholder="Search code/name..."
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-xl font-bold text-slate-900 outline-none text-sm"
                  value={subjectSearchQuery}
                  onChange={(e) => setSubjectSearchQuery(e.target.value)}
                />
                <select
                  size={5}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 outline-none text-xs appearance-none"
                  value={addSubjectData.subjectId}
                  onChange={(e) =>
                    setAddSubjectData({
                      ...addSubjectData,
                      subjectId: e.target.value,
                    })
                  }
                >
                  {allSubjects
                    .filter(
                      (s) =>
                        s.code
                          .toLowerCase()
                          .includes(subjectSearchQuery.toLowerCase()) ||
                        s.name
                          .toLowerCase()
                          .includes(subjectSearchQuery.toLowerCase()),
                    )
                    .map((s) => (
                      <option
                        key={s.id}
                        value={s.id}
                        className="py-2 px-2 hover:bg-blue-50 rounded-lg"
                      >
                        [{s.code}] {s.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 block">
                  Engineering Year
                </label>
                <select
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-xl font-bold text-slate-900 outline-none"
                  value={addSubjectData.academicYear}
                  onChange={(e) =>
                    setAddSubjectData({
                      ...addSubjectData,
                      academicYear: e.target.value,
                    })
                  }
                >
                  {["E1", "E2", "E3", "E4"].map((y) => (
                    <option key={y} value={y}>
                      {y} Engineering
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowAddSubjectModal(false)}
                  className="flex-1 py-5 bg-slate-50 text-slate-500 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={addSubjectToRollout}
                  disabled={loading || !addSubjectData.subjectId}
                  className="flex-2 px-10 py-5 bg-slate-900 text-white rounded-xl font-bold shadow-none"
                >
                  {loading ? "Adding..." : "Confirm Add"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Allocation Modal */}
      {editingAllocation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden shadow-none p-10 space-y-8 animate-in zoom-in-95 duration-300">
            <h3 className="text-2xl font-black text-slate-900 italic">
              Adjust Subject
            </h3>
            <div className="space-y-6">
              <input
                type="text"
                value={editFormData.customName}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    customName: e.target.value,
                  })
                }
                className="w-full px-6 py-4 bg-slate-50 rounded-xl font-bold"
                placeholder="Subject Name"
              />
              <input
                type="number"
                value={editFormData.customCredits}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    customCredits: parseInt(e.target.value),
                  })
                }
                className="w-full px-6 py-4 bg-slate-50 rounded-xl font-bold"
                placeholder="Credits"
              />

              <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 rounded-xl border border-slate-100">
                <input
                  type="checkbox"
                  id="isMandatory"
                  checked={editFormData.isMandatory}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      isMandatory: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="isMandatory"
                  className="font-bold text-slate-700"
                >
                  Mandatory Course
                </label>
              </div>

              {!editFormData.isMandatory && (
                <div className="space-y-6 p-6 bg-blue-50/50 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-blue-600 px-1 block">
                      Elective Group Name
                    </label>
                    <input
                      type="text"
                      value={editFormData.electiveGroupId}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          electiveGroupId: e.target.value,
                        })
                      }
                      className="w-full px-6 py-4 bg-white border border-blue-100 rounded-xl font-bold text-slate-900 outline-none"
                      placeholder="e.g. Professional Elective-I"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-blue-600 px-1 block">
                      Selection Limit
                    </label>
                    <input
                      type="number"
                      value={editFormData.electiveLimit}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          electiveLimit: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-6 py-4 bg-white border border-blue-100 rounded-xl font-bold text-slate-900 outline-none"
                      placeholder="How many courses from this group?"
                      min={1}
                    />
                  </div>
                </div>
              )}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setEditingAllocation(null)}
                  className="flex-1 py-5 bg-slate-50 text-slate-500 rounded-xl font-bold"
                >
                  Discard
                </button>
                <button
                  onClick={saveAllocation}
                  className="flex-2 px-10 py-5 bg-blue-600 text-white rounded-xl font-bold shadow-none"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
