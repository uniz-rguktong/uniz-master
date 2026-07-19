import { formatStatus, formatDisplayText } from "@/utils/displayText";
import { useState, useEffect } from "react";
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
  Upload,
} from "lucide-react";
import { apiClient, apiRequest, downloadFile } from "../../../api/apiClient";
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
  GET_REGISTRATION_SUBJECTS_TEMPLATE,
  UPLOAD_REGISTRATION_RESPONSES,
  UPLOAD_REGISTRATION_SUBJECTS,
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
} from "../../../components/admin/admin-ui";
import DirectPublishModal from "./DirectPublishModal";

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
  customCode?: string;
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
    customCode: "",
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
  const [publishSem, setPublishSem] = useState<Semester | null>(null);
  const [subjectUploadFile, setSubjectUploadFile] = useState<File | null>(null);
  const [registrationUploadFile, setRegistrationUploadFile] =
    useState<File | null>(null);
  const [registrationUploadBranch, setRegistrationUploadBranch] =
    useState("CSE");
  const [registrationDryRun, setRegistrationDryRun] = useState(true);
  const [importSummary, setImportSummary] = useState<any>(null);

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
      customCode: item.customCode || item.subject.code,
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

  const downloadSubjectTemplate = async () => {
    if (!selectedSem) return;
    const branch = branchFilter === "all" ? undefined : branchFilter;
    const year = yearFilter === "all" ? undefined : yearFilter;
    await downloadFile(
      GET_REGISTRATION_SUBJECTS_TEMPLATE(selectedSem.id, branch, year),
      `registration-subjects-${selectedSem.id}.xlsx`,
    );
  };

  const uploadSubjectSheet = async () => {
    if (!selectedSem || !subjectUploadFile) {
      toast.error("Select a subject Excel file first");
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", subjectUploadFile);
      form.append("semesterId", selectedSem.id);
      form.append("dryRun", String(registrationDryRun));
      const res = await apiRequest<any>(UPLOAD_REGISTRATION_SUBJECTS, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        setImportSummary(res);
        toast.error(res.message);
        return;
      }
      if (res.data) {
        setImportSummary(res.data);
        toast.success(
          registrationDryRun
            ? "Subject dry-run complete"
            : "Subjects uploaded for Dean/HOD review",
        );
        fetchAllocations();
      }
    } finally {
      setLoading(false);
    }
  };

  const uploadRegistrationResponses = async () => {
    if (!selectedSem || !registrationUploadFile) {
      toast.error("Select a Google Form response file first");
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", registrationUploadFile);
      form.append("semesterId", selectedSem.id);
      form.append("branch", registrationUploadBranch);
      form.append("dryRun", String(registrationDryRun));
      form.append("mode", "replace");
      const res = await apiRequest<any>(UPLOAD_REGISTRATION_RESPONSES, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        setImportSummary(res);
        toast.error(res.message);
        return;
      }
      if (res.data) {
        setImportSummary(res.data);
        toast.success(
          registrationDryRun
            ? "Registration dry-run complete"
            : "Registrations imported",
        );
        fetchRegistrations();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-700">
      {activeTab === "list" ? (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-semibold text-zinc-900 tracking-tight mb-2">
                Semester Events
              </h1>
              <p className="text-zinc-500 font-medium">
                Coordinate registration rollouts and monitor subject
                allocations.
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowNewModal(true)}
                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-br from-blue-600 to-zinc-700 text-white rounded-xl font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-none border-2 border-white/20"
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
                className="bg-white rounded-xl border border-zinc-100 p-8 shadow-none transition-all group relative overflow-hidden"
              >
                <div
                  className={`absolute top-0 right-0 w-32 h-32 opacity-[0.03] transition-transform duration-1000 group-hover:rotate-12 ${sem.status === "REGISTRATION_OPEN" ? "text-emerald-500" : "text-zinc-900"}`}
                >
                  <Zap size={120} />
                </div>

                <div className="flex items-start justify-between mb-8">
                  <div
                    className={`p-4 rounded-xl shadow-none ${sem.status === "REGISTRATION_OPEN" ? "bg-emerald-50 text-emerald-600" : "bg-zinc-50 text-zinc-400"}`}
                  >
                    <Clock size={28} />
                  </div>
                  <span
                    className={`px-4 py-1.5 rounded-full text-[9px] font-semibold tracking-[0.14em] border ${
                      sem.status === "REGISTRATION_OPEN"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                        : sem.status === "DEAN_REVIEW"
                          ? "bg-amber-50 text-amber-600 border-amber-100"
                          : "bg-zinc-50 text-zinc-400 border-zinc-100"
                    }`}
                  >
                    {formatStatus(sem.status)}
                  </span>
                </div>

                <h3 className="text-2xl font-semibold text-zinc-900 tracking-tight mb-4 group-hover:text-zinc-900 transition-colors ">
                  {sem.name}
                </h3>

                <div className="flex items-center gap-6 mb-10">
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 tracking-[0.14em] mb-1">
                      Students registered
                    </p>
                    <p className="text-xl font-semibold text-zinc-900">
                      {sem._count?.registrations || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 tracking-[0.14em] mb-1">
                      Created
                    </p>
                    <p className="text-sm font-bold text-zinc-600">
                      {new Date(sem.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => viewDetails(sem)}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-zinc-50 text-zinc-600 rounded-xl font-bold text-sm hover:bg-zinc-50 hover:text-zinc-900 transition-all"
                  >
                    Review Allocations <ChevronRight size={16} />
                  </button>

                  {isAdmin && (
                    <div className="flex items-center gap-3 mt-2">
                      {role === "webadmin" &&
                        sem.status !== "REGISTRATION_OPEN" &&
                        sem.status !== "REGISTRATION_CLOSED" && (
                          <button
                            onClick={() => setPublishSem(sem)}
                            className="flex-1 py-4 bg-zinc-900 text-white rounded-xl font-bold text-xs hover:bg-zinc-800 transition-all shadow-none"
                          >
                            Publish to Students
                          </button>
                        )}
                      {sem.status === "REGISTRATION_OPEN" && (
                        <button
                          onClick={() =>
                            updateStatus(sem.id, "REGISTRATION_CLOSED")
                          }
                          className="flex-1 py-4 bg-zinc-900 text-white rounded-xl font-bold text-xs hover:bg-zinc-800 transition-all"
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
              <div className="col-span-full py-20 bg-white rounded-xl border border-dashed border-zinc-200 text-center">
                <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Zap className="text-zinc-300" size={32} />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-2">
                  Ready to start the semester?
                </h3>
                <p className="text-zinc-400 text-sm max-w-xs mx-auto mb-8">
                  Click the button above to rollout the registration event.
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        selectedSem && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between bg-white p-8 rounded-xl border border-zinc-100 shadow-none">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setActiveTab("list")}
                  className="p-3 bg-zinc-50 rounded-xl text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 transition-all border border-transparent hover:border-zinc-100"
                >
                  <ChevronRight className="rotate-180" size={24} />
                </button>
                <div>
                  <p className="text-[10px] font-bold text-zinc-900 tracking-[0.14em] mb-1 opacity-70">
                    Rollout Review •{" "}
                    {branchFilter === "all"
                      ? "All"
                      : formatDisplayText(branchFilter)}
                  </p>
                  <h1 className="text-3xl font-semibold text-zinc-900 tracking-tight">
                    {selectedSem.name}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {((activeViewTab === "allocations" && allocations.length > 0) ||
                  (activeViewTab === "registrations" &&
                    registeredStudents.length > 0)) && (
                  <button
                    onClick={() => downloadExport(activeViewTab)}
                    className="flex items-center gap-3 px-6 py-4 bg-zinc-100 text-zinc-600 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-all"
                  >
                    <Download size={18} />
                    Export
                  </button>
                )}
                {(role === "dean" || role === "hod" || role === "webadmin") &&
                  activeViewTab === "allocations" && (
                    <button
                      onClick={() => setShowAddSubjectModal(true)}
                      className="flex items-center gap-3 px-6 py-4 bg-zinc-50 text-zinc-900 rounded-xl font-bold text-sm hover:bg-zinc-100 transition-all"
                    >
                      <Plus size={18} />
                      Add Subject
                    </button>
                  )}
                {(role === "webadmin" || role === "dean" || role === "hod") && (
                  <button
                    onClick={approveAllocation}
                    disabled={loading}
                    className={`flex items-center gap-3 px-8 py-4 ${role === "dean" ? "bg-zinc-900" : "bg-zinc-900 shadow-none"} text-white rounded-xl font-extrabold text-sm hover:opacity-90 transition-all shadow-none`}
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
                  className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${activeViewTab === "allocations" ? "bg-zinc-900 text-white shadow-none" : "bg-white text-zinc-400 border border-zinc-100"}`}
                >
                  Allocations
                </button>
                <button
                  onClick={() => setActiveViewTab("registrations")}
                  className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${activeViewTab === "registrations" ? "bg-zinc-900 text-white shadow-none" : "bg-white text-zinc-400 border border-zinc-100"}`}
                >
                  Registrations
                </button>
              </div>
              <div className="flex gap-2">
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="bg-white border border-zinc-100 rounded-full px-4 py-2 text-[10px] font-semibold tracking-[0.14em] text-zinc-500"
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
                    className="bg-white border border-zinc-100 rounded-full px-4 py-2 text-[10px] font-semibold tracking-[0.14em] text-zinc-500"
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

            {role === "webadmin" && (
              <div className="bg-white rounded-xl border border-zinc-100 p-6 space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900">
                      Bulk semester data import
                    </h3>
                    <p className="text-sm text-zinc-500">
                      Upload subject allocations and Google Form responses.
                      Duplicate student submissions use the latest timestamp and
                      replace older rows for this semester.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">
                    <input
                      type="checkbox"
                      checked={registrationDryRun}
                      onChange={(e) => setRegistrationDryRun(e.target.checked)}
                    />
                    Dry run
                  </label>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="rounded-xl border border-zinc-100 p-5 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-zinc-900 text-sm">
                          Subject Excel
                        </p>
                        <p className="text-xs text-zinc-500">
                          Download the semester template (all cores + elective
                          options), fill or edit, then upload for Dean → HOD
                          approval before students register.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={downloadSubjectTemplate}
                        className="px-4 py-2 rounded-lg bg-zinc-50 text-zinc-600 text-xs font-bold"
                      >
                        Template
                      </button>
                    </div>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) =>
                        setSubjectUploadFile(e.target.files?.[0] || null)
                      }
                      className="block w-full text-xs text-zinc-500"
                    />
                    <button
                      type="button"
                      onClick={uploadSubjectSheet}
                      disabled={loading || !subjectUploadFile}
                      className={cn(
                        adminPrimaryButtonClass,
                        "w-full justify-center",
                      )}
                    >
                      <Upload size={16} />{" "}
                      {registrationDryRun
                        ? "Dry-run subjects"
                        : "Import subjects"}
                    </button>
                  </div>

                  <div className="rounded-xl border border-zinc-100 p-5 space-y-4">
                    <div>
                      <p className="font-bold text-zinc-900 text-sm">
                        Registration Form export
                      </p>
                      <p className="text-xs text-zinc-500">
                        Imports Google Form responses with latest-submission
                        wins.
                      </p>
                    </div>
                    <select
                      value={registrationUploadBranch}
                      onChange={(e) =>
                        setRegistrationUploadBranch(e.target.value)
                      }
                      className={adminSelectClass}
                    >
                      {["CSE", "ECE", "CE", "EEE", "ME", "AIML"].map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) =>
                        setRegistrationUploadFile(e.target.files?.[0] || null)
                      }
                      className="block w-full text-xs text-zinc-500"
                    />
                    <button
                      type="button"
                      onClick={uploadRegistrationResponses}
                      disabled={loading || !registrationUploadFile}
                      className={cn(
                        adminPrimaryButtonClass,
                        "w-full justify-center",
                      )}
                    >
                      <Upload size={16} />{" "}
                      {registrationDryRun
                        ? "Dry-run registrations"
                        : "Import registrations"}
                    </button>
                  </div>
                </div>

                {importSummary && (
                  <pre className="max-h-52 overflow-auto rounded-xl bg-zinc-950 p-4 text-xs text-zinc-100 whitespace-pre-wrap">
                    {importSummary.errors?.length
                      ? importSummary.errors
                          .map((e: any) => e.message)
                          .join("\n")
                      : JSON.stringify(importSummary, null, 2)}
                  </pre>
                )}
              </div>
            )}

            {activeViewTab === "allocations" ? (
              <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden shadow-none">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-zinc-50 bg-zinc-50/30 font-semibold tracking-[0.14em] text-[10px] text-zinc-400">
                      <th className="px-8 py-6">Subject</th>
                      <th className="px-8 py-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {allocations.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-zinc-50/50 transition-all font-bold"
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-400">
                              <BookOpen size={20} />
                            </div>
                            <div>
                              <p className="text-zinc-900 text-[13px]">
                                {item.customName || item.subject.name}
                              </p>
                              <p className="text-[9px] text-zinc-400 tracking-[0.14em]">
                                {item.customCode || item.subject.code} •{" "}
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
                              className="p-2 text-zinc-400 hover:text-zinc-900 bg-zinc-50 rounded-xl border border-transparent hover:border-zinc-100"
                            >
                              <Edit3 size={18} />
                            </button>
                            <button
                              onClick={() => removeAllocation(item.id)}
                              className="p-2 text-zinc-400 hover:text-red-600 bg-zinc-50 rounded-xl border border-transparent hover:border-red-100"
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
              <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
                <table className="w-full text-left font-bold">
                  <thead>
                    <tr className="border-b border-zinc-50 bg-zinc-50/30 text-[10px] text-zinc-400 tracking-[0.14em]">
                      <th className="px-8 py-6">Student</th>
                      <th className="px-8 py-6">Subject</th>
                      <th className="px-8 py-6">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registeredStudents.map((reg) => (
                      <tr key={reg.id} className="border-b border-zinc-50">
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
          <div className={cn("w-full max-w-xl p-8", adminModalShellClass)}>
            <h2 className={cn(adminModalTitleClass, "mb-1")}>
              New enrollment rollout
            </h2>
            <p className={cn(adminModalDescClass, "mb-6")}>
              Initialize a semester registration event for selected branches.
            </p>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className={adminLabelClass}>Semester label</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className={adminInputClass}
                />
              </div>
              <div className="space-y-2">
                <label className={adminLabelClass}>Branches</label>
                <div className="grid grid-cols-3 gap-2">
                  {["CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM"].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() =>
                        selectedBranches.includes(b)
                          ? setSelectedBranches(
                              selectedBranches.filter((x) => x !== b),
                            )
                          : setSelectedBranches([...selectedBranches, b])
                      }
                      className={cn(
                        "py-2.5 rounded-xl text-[12px] font-semibold border transition-all",
                        selectedBranches.includes(b)
                          ? "bg-zinc-900 text-white border-zinc-900"
                          : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300",
                      )}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className={cn(adminGhostButtonClass, "flex-1")}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={initSemester}
                  disabled={loading}
                  className={cn(adminPrimaryButtonClass, "flex-[2]")}
                >
                  {loading ? "Starting…" : "Start rollout"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Subject Add Modal */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className={cn(
              "w-full max-w-lg p-8 space-y-6",
              adminModalShellClass,
            )}
          >
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className={adminModalTitleClass}>Add subject manually</h3>
                <p className={adminModalDescClass}>
                  Search the catalog and assign to this rollout.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSubjectModal(false)}
                className="text-zinc-400 hover:text-zinc-900 p-1"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-6">
              <div className="space-y-3">
                <label className={adminLabelClass}>Subject search</label>
                <input
                  type="text"
                  placeholder="Search code or name…"
                  className={adminInputClass}
                  value={subjectSearchQuery}
                  onChange={(e) => setSubjectSearchQuery(e.target.value)}
                />
                <select
                  size={5}
                  className={cn(adminSelectClass, "h-auto py-2 text-[12px]")}
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
                        className="py-2 px-2 hover:bg-zinc-50 rounded-lg"
                      >
                        [{s.code}] {s.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-3">
                <label className={adminLabelClass}>Year</label>
                <select
                  className={adminSelectClass}
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
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(false)}
                  className={cn(adminGhostButtonClass, "flex-1")}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={addSubjectToRollout}
                  disabled={loading || !addSubjectData.subjectId}
                  className={cn(adminPrimaryButtonClass, "flex-[2]")}
                >
                  {loading ? "Adding…" : "Add subject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Allocation Modal */}
      {editingAllocation && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className={cn(
              "w-full max-w-lg p-8 space-y-6",
              adminModalShellClass,
            )}
          >
            <h3 className={adminModalTitleClass}>Adjust subject</h3>
            <p className={adminModalDescClass}>
              Update allocation details for this rollout.
            </p>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className={adminLabelClass}>Academic code</label>
                <input
                  type="text"
                  value={editFormData.customCode}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      customCode: e.target.value.toUpperCase(),
                    })
                  }
                  className={adminInputClass}
                  placeholder="Official subject code for this semester"
                />
              </div>
              <div className="space-y-2">
                <label className={adminLabelClass}>Subject name</label>
                <input
                  type="text"
                  value={editFormData.customName}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      customName: e.target.value,
                    })
                  }
                  className={adminInputClass}
                  placeholder="Subject name"
                />
              </div>
              <div className="space-y-2">
                <label className={adminLabelClass}>Credits</label>
                <input
                  type="number"
                  value={editFormData.customCredits}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      customCredits: parseInt(e.target.value),
                    })
                  }
                  className={adminInputClass}
                  placeholder="Credits"
                />
              </div>

              <div className="flex items-center gap-3 px-4 py-3 bg-zinc-50 rounded-xl border border-zinc-200/70">
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
                  className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                />
                <label
                  htmlFor="isMandatory"
                  className="text-[13px] font-medium text-zinc-700"
                >
                  Mandatory course
                </label>
              </div>

              {!editFormData.isMandatory && (
                <div className="space-y-4 p-5 bg-zinc-50/50 rounded-xl border border-zinc-200/70">
                  <div className="space-y-2">
                    <label className={adminLabelClass}>
                      Elective group name
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
                      className={adminInputClass}
                      placeholder="e.g. Professional Elective-I"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={adminLabelClass}>Selection limit</label>
                    <input
                      type="number"
                      value={editFormData.electiveLimit}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          electiveLimit: parseInt(e.target.value),
                        })
                      }
                      className={adminInputClass}
                      placeholder="How many courses from this group?"
                      min={1}
                    />
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAllocation(null)}
                  className={cn(adminGhostButtonClass, "flex-1")}
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={saveAllocation}
                  className={cn(adminPrimaryButtonClass, "flex-[2]")}
                >
                  Save changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {publishSem && (
        <DirectPublishModal
          semester={publishSem}
          onClose={() => setPublishSem(null)}
          onPublished={() => {
            setPublishSem(null);
            fetchSemesters();
          }}
        />
      )}
    </div>
  );
}
