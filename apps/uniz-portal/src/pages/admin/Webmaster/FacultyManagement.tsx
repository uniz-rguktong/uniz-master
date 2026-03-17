/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  X,
  Trash2,
  Upload,
  Download,
  CheckSquare,
  Square,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Layers,
  Eye,
  BookOpen,
  Calendar,
  Camera,
  UserPlus,
} from "lucide-react";
import Papa from "papaparse";
import axios from "axios";
import {
  SEARCH_FACULTY,
  CREATE_FACULTY,
  UPDATE_FACULTY,
  ADMIN_SUSPEND_FACULTY,
  BASE_URL,
  BULK_CREATE_FACULTY,
  BULK_UPDATE_FACULTY,
  BULK_DELETE_FACULTY,
} from "../../../api/endpoints";
import { toast } from "@/utils/toast-ref";
import { FileUploader } from "../../../components/ui/FileUploader";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";

const ROLES = [
  "teacher",
  "hod",
  "dean",
  "webmaster",
  "dsw",
  "swo",
  "warden",
  "caretaker",
  "security",
  "director",
  "librarian",
  "warden_male",
  "warden_female",
  "caretaker_male",
  "caretaker_female",
];
const DEPARTMENTS = [
  "CSE",
  "ECE",
  "EEE",
  "MECH",
  "CIVIL",
  "CHEM",
  "MME",
  "CHEMISTRY",
  "PHYSICS",
  "ENGLISH",
  "MATHS",
  "TELUGU",
  "FINE ARTS",
  "MANAGEMENT",
  "ALL",
];

const getToken = () =>
  (localStorage.getItem("admin_token") || "").replace(/"/g, "");

export default function FacultyManagement({
  deptRestrict,
}: {
  deptRestrict?: string;
}) {
  /* ─── mode: "single" | "bulk" ─── */
  const [mode, setMode] = useState<"single" | "bulk">("single");

  /* ─── Single-mode state ─── */
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [meta, setMeta] = useState<any>({ total: 0, totalPages: 1 });
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    department: deptRestrict || "CSE",
    role: "teacher",
    designation: "Lecturer",
    contact: "",
    profileUrl: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ─── Bulk-mode state ─── */
  const [selectedUsernames, setSelectedUsernames] = useState<Set<string>>(
    new Set(),
  );
  const [bulkTab, setBulkTab] = useState<"add" | "update" | "delete">("add");
  const [csvText, setCsvText] = useState("");
  const [bulkUpdateFields, setBulkUpdateFields] = useState({
    role: "",
    designation: "",
    department: "",
    name: "",
    email: "",
    contact: "",
    profileUrl: "",
  });
  const [bulkResult, setBulkResult] = useState<any>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  /* ─── Fetch ─── */
  const fetchFaculty = async () => {
    setLoading(true);
    try {
      const res = await fetch(SEARCH_FACULTY, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: search,
          department: deptRestrict,
          page,
          limit,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFaculty(data.faculty);
        setMeta(
          data.pagination || { total: data.faculty.length, totalPages: 1 },
        );
      }
    } catch {
      toast.error("Failed to fetch faculty list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, [page]);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) setPage(1);
      else fetchFaculty();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  /* ─── Single CRUD ─── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editMode ? UPDATE_FACULTY(formData.username) : CREATE_FACULTY;
      const method = editMode ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          email: formData.email.toLowerCase(),
          department: formData.department.toUpperCase(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          `Faculty ${editMode ? "updated" : "created"} successfully`,
        );
        setShowModal(false);
        fetchFaculty();
      } else toast.error(data.message || "Operation failed");
    } catch {
      toast.error("Error processing request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuspend = async (username: string, current: boolean) => {
    if (!window.confirm(`${current ? "Reinstate" : "Suspend"} this user?`))
      return;
    try {
      const res = await fetch(ADMIN_SUSPEND_FACULTY(username), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ suspended: !current }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`User ${!current ? "suspended" : "reinstated"}`);
        fetchFaculty();
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (username: string) => {
    if (
      !window.confirm(`PERMANENTLY DELETE ${username}? This cannot be undone.`)
    )
      return;
    try {
      const res = await fetch(`${BASE_URL}/profile/admin/faculty/${username}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Profile deleted");
        fetchFaculty();
      } else toast.error(data.message || "Failed to delete");
    } catch {
      toast.error("Network error during deletion");
    }
  };

  const openEdit = (member: any) => {
    setFormData({
      username: member.Username,
      name: member.Name,
      email: member.Email,
      department: member.Department,
      role: member.Role || "teacher",
      designation: member.Designation,
      contact: member.Contact || "",
      profileUrl: member.ProfileUrl || "",
    });
    setEditMode(true);
    setShowModal(true);
  };
  const openAdd = () => {
    setFormData({
      username: "",
      name: "",
      email: "",
      department: deptRestrict || "CSE",
      role: "teacher",
      designation: "Lecturer",
      contact: "",
      profileUrl: "",
    });
    setEditMode(false);
    setShowModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formDataUpload = new FormData();
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

      formDataUpload.append("file", file);
      formDataUpload.append("upload_preset", uploadPreset);

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        formDataUpload,
      );
      const data = response.data;
      if (data.secure_url) {
        setFormData((prev) => ({ ...prev, profileUrl: data.secure_url }));
        toast.success("Profile photo uploaded!");
      } else {
        toast.error(data.message || "Upload failed");
      }
    } catch {
      toast.error("Upload failed due to network error");
    } finally {
      setIsUploading(false);
    }
  };

  /* ─── Bulk selection ─── */
  const toggleSelect = (username: string) => {
    setSelectedUsernames((prev) => {
      const n = new Set(prev);
      n.has(username) ? n.delete(username) : n.add(username);
      return n;
    });
  };
  const toggleAll = () => {
    if (selectedUsernames.size === faculty.length)
      setSelectedUsernames(new Set());
    else setSelectedUsernames(new Set(faculty.map((f) => f.Username)));
  };

  /* ─── CSV template download ─── */
  const downloadTemplate = () => {
    const csv =
      "username,name,email,department,designation,role,contact\njdoe,John Doe,jdoe@rguktong.ac.in,CSE,Lecturer,teacher,9876543210";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "faculty_bulk_template.csv";
    a.click();
  };

  /* ─── Parse CSV ─── */
  const parseCsv = (text: string) => {
    const lines = text.trim().split("\n").filter(Boolean);
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    return lines.slice(1).map((line) => {
      const vals = line.split(",").map((v) => v.trim());
      const obj: any = {};
      headers.forEach((h, i) => {
        obj[h] = vals[i] || "";
      });
      return obj;
    });
  };

  /* ─── Bulk Add ─── */
  const handleBulkAdd = async () => {
    const entries = parseCsv(csvText);
    if (!entries.length) {
      toast.error("No valid rows to import. Check your CSV.");
      return;
    }
    setBulkLoading(true);
    setBulkResult(null);
    try {
      const res = await fetch(BULK_CREATE_FACULTY, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ faculty: entries }),
      });
      const data = await res.json();
      if (data.success) {
        setBulkResult(data);
        toast.success(
          `Done: ${data.summary.created} created, ${data.summary.skipped} skipped, ${data.summary.errors} errors`,
        );
        fetchFaculty();
      } else toast.error(data.message || "Bulk add failed");
    } catch {
      toast.error("Network error");
    } finally {
      setBulkLoading(false);
    }
  };

  /* ─── Bulk Update ─── */
  const handleBulkUpdate = async () => {
    if (!selectedUsernames.size) {
      toast.error("No users selected");
      return;
    }
    const fieldsToApply: any = {};
    if (bulkUpdateFields.role) fieldsToApply.role = bulkUpdateFields.role;
    if (bulkUpdateFields.designation)
      fieldsToApply.designation = bulkUpdateFields.designation;
    if (bulkUpdateFields.department)
      fieldsToApply.department = bulkUpdateFields.department;
    if (bulkUpdateFields.name) fieldsToApply.name = bulkUpdateFields.name;
    if (bulkUpdateFields.email) fieldsToApply.email = bulkUpdateFields.email;
    if (bulkUpdateFields.contact)
      fieldsToApply.contact = bulkUpdateFields.contact;
    if (bulkUpdateFields.profileUrl)
      fieldsToApply.profileUrl = bulkUpdateFields.profileUrl;
    if (!Object.keys(fieldsToApply).length) {
      toast.error("Choose at least one field to update");
      return;
    }
    setBulkLoading(true);
    setBulkResult(null);
    try {
      const updates = Array.from(selectedUsernames).map((u) => ({
        username: u,
        ...fieldsToApply,
      }));
      const res = await fetch(BULK_UPDATE_FACULTY, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ updates }),
      });
      const data = await res.json();
      if (data.success) {
        setBulkResult(data);
        toast.success(`Done: ${data.summary.updated} updated`);
        setSelectedUsernames(new Set());
        fetchFaculty();
      } else toast.error(data.message || "Bulk update failed");
    } catch {
      toast.error("Network error");
    } finally {
      setBulkLoading(false);
    }
  };

  /* ─── Bulk Delete ─── */
  const handleBulkDelete = async () => {
    if (!selectedUsernames.size) {
      toast.error("No users selected");
      return;
    }
    setBulkLoading(true);
    setBulkResult(null);
    setShowDeleteConfirm(false);
    try {
      const res = await fetch(BULK_DELETE_FACULTY, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ usernames: Array.from(selectedUsernames) }),
      });
      const data = await res.json();
      if (data.success) {
        setBulkResult(data);
        toast.success(`Done: ${data.summary.deleted} deleted`);
        setSelectedUsernames(new Set());
        fetchFaculty();
      } else toast.error(data.message || "Bulk delete failed");
    } catch {
      toast.error("Network error");
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-700 pb-6 text-slate-900">
      {/* ─── Top bar ─── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-3xl font-semibold tracking-[-0.02em] text-slate-900 leading-none">
            Institutional Registry
          </h2>
          <p className="text-slate-500 font-medium text-[15px]">
            Strategic management of administrative and teaching assets.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/50 backdrop-blur-sm shadow-none">
            <button
              onClick={() => setMode(mode === "single" ? "bulk" : "single")}
              title={mode === "single" ? "Switch to Bulk Mode" : "Switch to Individual Mode"}
              className="p-2.5 text-slate-500 hover:text-navy-900 transition-all"
            >
              <Layers size={18} />
            </button>
            <button
              onClick={fetchFaculty}
              title="Refresh Registry"
              className={`p-2.5 text-slate-500 hover:text-navy-900 transition-all ${loading ? "animate-spin" : ""}`}
            >
              <RefreshCw size={18} />
            </button>
          </div>

          <div className="relative group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-navy-900 transition-colors pointer-events-none"
              size={16}
            />
            <input
              type="text"
              placeholder="Search registry..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 pr-5 h-12 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-navy-900/5 focus:border-navy-100 transition-all w-[240px] shadow-none placeholder:text-slate-400"
            />
          </div>

          {mode === "single" && (
            <button
              onClick={openAdd}
              className="h-12 px-6 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-black active:scale-95 transition-all flex items-center gap-2.5 shadow-none whitespace-nowrap"
            >
              <UserPlus size={16} /> Add Faculty
            </button>
          )}
        </div>
      </div>

      {/* ─── BULK MODE ─── */}
      {mode === "bulk" && (
        <div className="space-y-6">
          {/* Sub-tabs */}
          <div className="flex gap-2">
            {(["add", "update", "delete"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setBulkTab(t);
                  setBulkResult(null);
                }}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${bulkTab === t ? (t === "delete" ? "bg-red-600 text-white" : "bg-slate-900 text-white") : "bg-white border border-slate-200 text-slate-500 hover:border-slate-400"}`}
              >
                {t === "add"
                  ? "📥 Bulk Add"
                  : t === "update"
                    ? "✏️ Bulk Update"
                    : "🗑️ Bulk Delete"}
              </button>
            ))}
          </div>

          {/* ── Bulk Add ── */}
          {bulkTab === "add" && (
            <div className="bg-white rounded-xl border border-slate-100 p-8 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">
                    Bulk Add Faculty
                  </h3>
                  <p className="text-sm text-slate-400 font-medium">
                    Paste CSV data or upload. Default password ={" "}
                    <code className="bg-slate-100 px-2 py-0.5 rounded text-xs font-mono">
                      username@uniz
                    </code>
                  </p>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition-all"
                >
                  <Download size={14} /> Download Template
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <FileUploader
                    onFileSelect={(file: File | null) => {
                      if (file) {
                        Papa.parse(file, {
                          header: true,
                          skipEmptyLines: true,
                          complete: (results) => {
                            if (results.data && results.data.length > 0) {
                              const csv = Papa.unparse(results.data);
                              setCsvText(csv);
                              toast.success(`Successfully parsed ${results.data.length} rows`);
                            }
                          },
                          error: (err) => {
                            toast.error("Failed to parse file: " + err.message);
                          },
                        });
                      } else {
                        setCsvText("");
                      }
                    }}
                    label="Upload CSV/Excel Asset"
                    description="XLSX or CSV. Use the template for correct headers."
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">
                    Manual CSV Input (Preview)
                  </label>
                  <textarea
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    rows={8}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-xl font-mono text-xs outline-none focus:ring-4 focus:ring-navy-900/5 focus:border-navy-100 transition-all resize-none shadow-none"
                    placeholder={`username,name,email,department,designation,role\nktejokiran,K Tejo Kiran,ktejokiran@rguktong.ac.in,CSE,Lecturer,teacher`}
                  />
                </div>
              </div>

              <button
                onClick={handleBulkAdd}
                disabled={bulkLoading || !csvText.trim()}
                className="w-full h-12 bg-navy-900 text-white rounded-xl font-black uppercase tracking-widest text-[11px] hover:bg-navy-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
              >
                {bulkLoading ? (
                  <Loader2 className="animate-spin w-4 h-4" />
                ) : (
                  <Upload size={16} />
                )}
                {bulkLoading ? "Processing..." : "Run Bulk Import"}
              </button>
            </div>
          )}

          {/* ── Bulk Update ── */}
          {bulkTab === "update" && (
            <div className="space-y-4">
              <div className="bg-navy-50 border border-navy-100 rounded-xl p-4 flex items-center gap-3">
                <CheckSquare size={18} className="text-navy-900 shrink-0" />
                <p className="text-sm text-navy-800 font-semibold">
                  Select faculty from the table below, then pick fields to
                  update.
                  <span className="font-black ml-1">
                    {selectedUsernames.size} selected.
                  </span>
                </p>
              </div>
              <div className="bg-white rounded-xl border border-slate-100 p-8 space-y-6">
                <h3 className="text-xl font-bold text-slate-900">
                  Fields to Apply to Selected
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      New Role
                    </label>
                    <div className="relative">
                      <select
                        value={bulkUpdateFields.role}
                        onChange={(e) =>
                          setBulkUpdateFields((p) => ({
                            ...p,
                            role: e.target.value,
                          }))
                        }
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm outline-none focus:ring-4 focus:ring-navy-900/5 focus:border-navy-100 appearance-none cursor-pointer"
                      >
                        <option value="">— No change —</option>
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      New Department
                    </label>
                    <div className="relative">
                      <select
                        value={bulkUpdateFields.department}
                        onChange={(e) =>
                          setBulkUpdateFields((p) => ({
                            ...p,
                            department: e.target.value,
                          }))
                        }
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm outline-none focus:ring-4 focus:ring-navy-900/5 focus:border-navy-100 appearance-none cursor-pointer"
                      >
                        <option value="">— No change —</option>
                        {DEPARTMENTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      New Designation
                    </label>
                    <input
                      value={bulkUpdateFields.designation}
                      onChange={(e) =>
                        setBulkUpdateFields((p) => ({
                          ...p,
                          designation: e.target.value,
                        }))
                      }
                      placeholder="e.g. Senior Lecturer"
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm outline-none focus:ring-4 focus:ring-navy-900/5 focus:border-navy-100 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      New Name (Generic)
                    </label>
                    <input
                      value={bulkUpdateFields.name}
                      onChange={(e) =>
                        setBulkUpdateFields((p) => ({
                          ...p,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Apply same name to all"
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm outline-none focus:ring-4 focus:ring-navy-900/5 focus:border-navy-100 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      New Contact
                    </label>
                    <input
                      value={bulkUpdateFields.contact}
                      onChange={(e) =>
                        setBulkUpdateFields((p) => ({
                          ...p,
                          contact: e.target.value,
                        }))
                      }
                      placeholder="Apply same contact to all"
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm outline-none focus:ring-4 focus:ring-navy-900/5 focus:border-navy-100 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Profile URL
                    </label>
                    <input
                      value={bulkUpdateFields.profileUrl}
                      onChange={(e) =>
                        setBulkUpdateFields((p) => ({
                          ...p,
                          profileUrl: e.target.value,
                        }))
                      }
                      placeholder="Apply same image to all"
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm outline-none focus:ring-4 focus:ring-navy-900/5 focus:border-navy-100 transition-all"
                    />
                  </div>
                </div>
                <button
                  onClick={handleBulkUpdate}
                  disabled={bulkLoading || !selectedUsernames.size}
                  className="w-full h-12 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.99]"
                >
                  {bulkLoading ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : null}
                  {bulkLoading
                    ? "Updating..."
                    : `Apply to ${selectedUsernames.size} Selected`}
                </button>
              </div>
            </div>
          )}

          {/* ── Bulk Delete ── */}
          {bulkTab === "delete" && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
                <AlertTriangle size={18} className="text-red-500 shrink-0" />
                <p className="text-sm text-red-700 font-semibold">
                  Select rows below then delete. This is{" "}
                  <strong>permanent and cannot be undone.</strong>
                  <span className="font-black ml-1">
                    {selectedUsernames.size} selected.
                  </span>
                </p>
              </div>
              <button
                onClick={() => {
                  if (!selectedUsernames.size) {
                    toast.error("Select at least one user");
                    return;
                  }
                  setShowDeleteConfirm(true);
                }}
                disabled={bulkLoading || !selectedUsernames.size}
                className="w-full h-12 bg-red-600 text-white rounded-xl font-black uppercase tracking-widest text-[11px] hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-40 shadow-none active:scale-[0.99]"
              >
                {bulkLoading ? (
                  <Loader2 className="animate-spin w-4 h-4" />
                ) : (
                  <Trash2 size={16} />
                )}
                {bulkLoading
                  ? "Deleting..."
                  : `Delete ${selectedUsernames.size} Selected`}
              </button>

              {/* Confirm Dialog */}
              {showDeleteConfirm && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                  <div className="bg-white rounded-xl p-8 max-w-sm w-full shadow-none border border-red-100 mx-4">
                    <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center mb-5">
                      <AlertTriangle size={28} className="text-red-500" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">
                      Confirm Bulk Delete
                    </h3>
                    <p className="text-sm text-slate-500 mb-2">
                      You are about to permanently delete{" "}
                      <strong className="text-red-600">
                        {selectedUsernames.size} faculty account
                        {selectedUsernames.size > 1 ? "s" : ""}
                      </strong>
                      .
                    </p>
                    <div className="max-h-28 overflow-y-auto bg-slate-50 rounded-xl p-3 mb-6">
                      {Array.from(selectedUsernames).map((u) => (
                        <p key={u} className="text-xs font-mono text-slate-600">
                          {u}
                        </p>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        className="flex-[2] py-3 rounded-xl bg-red-600 text-white font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all"
                      >
                        Yes, Delete All
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Result summary */}
          {bulkResult && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-none p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 size={18} className="text-emerald-500" />
                <h4 className="font-bold text-slate-900">Operation Result</h4>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Total {bulkResult.summary?.total}
                </span>
                <button
                  onClick={() => setBulkResult(null)}
                  className="ml-auto p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-500 transition-all"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {Object.entries(bulkResult.summary || {})
                  .filter(([k]) => k !== "total")
                  .map(([k, v]: any) => (
                    <div
                      key={k}
                      className={`p-3 rounded-xl text-center ${k === "errors" || k === "deleted" ? (k === "deleted" ? "bg-red-50" : "bg-red-50") : k.includes("skip") || k.includes("not") ? "bg-amber-50" : "bg-emerald-50"}`}
                    >
                      <p
                        className={`text-2xl font-black ${k === "errors" ? "text-red-600" : k.includes("skip") || k.includes("not") ? "text-amber-600" : k === "deleted" ? "text-red-600" : "text-emerald-600"}`}
                      >
                        {v}
                      </p>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
                        {k}
                      </p>
                    </div>
                  ))}
              </div>
              {bulkResult.results?.filter(
                (r: any) => r.status === "error" || r.reason,
              ).length > 0 && (
                  <div className="max-h-36 overflow-y-auto bg-slate-50 rounded-xl p-3 space-y-1">
                    {bulkResult.results
                      .filter(
                        (r: any) =>
                          r.status !== "created" && r.status !== "updated",
                      )
                      .map((r: any, i: number) => (
                        <p key={i} className="text-xs font-mono text-slate-600">
                          <span
                            className={`font-bold ${r.status === "error" ? "text-red-500" : "text-amber-500"}`}
                          >
                            [{r.status}]
                          </span>{" "}
                          {r.username} {r.reason ? `— ${r.reason}` : ""}
                        </p>
                      ))}
                  </div>
                )}
            </div>
          )}
        </div>
      )}

      {/* ─── TABLE (shown in both modes) ─── */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-none overflow-hidden">
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-10 py-4 bg-slate-50/30 border-b border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Page {page} of {meta.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 disabled:opacity-30 hover:bg-slate-50 text-[9px] font-black uppercase tracking-widest shadow-none"
              >
                Prev
              </button>
              <button
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 disabled:opacity-30 hover:bg-slate-50 text-[9px] font-black uppercase tracking-widest shadow-none"
              >
                Next
              </button>
            </div>
          </div>
        )}

        <div className="relative">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="border-b border-slate-50">
                {mode === "bulk" && (
                  <th className="px-6 py-6 bg-slate-50/20">
                    <button
                      onClick={toggleAll}
                      className="text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      {selectedUsernames.size === faculty.length &&
                        faculty.length > 0 ? (
                        <CheckSquare size={18} className="text-navy-900" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </th>
                )}
                <th className="px-6 py-6 text-[11px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-50/20">
                  User Details
                </th>
                <th className="px-6 py-6 text-[11px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-50/20">
                  Designation
                </th>
                <th className="px-6 py-6 text-[11px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-50/20">
                  Role
                </th>
                <th className="px-6 py-6 text-[11px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-50/20">
                  Status
                </th>
                {mode === "single" && (
                  <th className="px-6 py-6 text-[11px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-50/20 text-right">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/60">
              {loading ? (
                Array(limit)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {mode === "bulk" && <td className="px-4 py-6"><div className="w-5 h-5 bg-slate-100 rounded" /></td>}
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0" />
                          <div className="space-y-2 w-full">
                            <div className="h-4 bg-slate-100 rounded w-24" />
                            <div className="h-3 bg-slate-50 rounded w-40" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="space-y-2">
                          <div className="h-4 bg-slate-100 rounded w-20" />
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="h-5 bg-slate-100 rounded-lg w-16" />
                      </td>
                      <td className="px-6 py-6">
                        <div className="h-6 bg-slate-100 rounded-full w-20" />
                      </td>
                      {mode === "single" && (
                        <td className="px-6 py-6">
                          <div className="flex justify-end gap-2">
                            <div className="w-8 h-8 bg-slate-100 rounded-full" />
                            <div className="w-16 h-8 bg-slate-100 rounded-full" />
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
              ) : faculty.length > 0 ? (
                faculty.map((member) => {
                  const isSelected = selectedUsernames.has(member.Username);
                  return (
                    <tr
                      key={member.id}
                      onClick={() =>
                        mode === "bulk"
                          ? toggleSelect(member.Username)
                          : undefined
                      }
                      className={`transition-all group ${mode === "bulk" ? "cursor-pointer select-none" : ""} ${isSelected ? "bg-navy-50/60 hover:bg-navy-50" : "hover:bg-slate-50/30"}`}
                    >
                      {mode === "bulk" && (
                        <td className="px-6 py-6">
                          {isSelected ? (
                            <CheckSquare size={18} className="text-navy-900" />
                          ) : (
                            <Square
                              size={18}
                              className="text-slate-300 group-hover:text-slate-400"
                            />
                          )}
                        </td>
                      )}
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-11 h-11 rounded-full text-white flex items-center justify-center font-bold text-sm shadow-none border-2 border-white ring-1 ring-slate-100 overflow-hidden ${isSelected ? "bg-navy-900" : "bg-slate-900"}`}
                          >
                            {member.ProfileUrl ? (
                              <img
                                src={member.ProfileUrl}
                                alt={member.Name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              member.Name?.[0] || member.Username?.[0]
                            )}
                          </div>
                          <div className="flex flex-col">
                            <p className="font-bold text-slate-900 tracking-tight leading-none mb-1.5">
                              {member.Name}
                            </p>
                            <div className="flex items-center gap-2">
                              <Mail size={10} className="text-slate-300" />
                              <p className="text-[10px] font-medium text-slate-400 leading-none">
                                {member.Email}
                              </p>
                            </div>
                            <p className="text-[9px] font-mono text-slate-300 mt-1">
                              {member.Username}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <p className="text-xs font-black text-slate-600 uppercase tracking-wide">
                          {member.Designation || "Lecturer"}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          {member.Department}
                        </p>
                      </td>
                      <td className="px-6 py-6">
                        <span className="px-3 py-1 bg-slate-50 rounded-lg text-slate-500 font-semibold uppercase tracking-widest text-[9px] border border-slate-100">
                          {member.Role?.toUpperCase() || "FACULTY"}
                        </span>
                      </td>
                      <td className="px-6 py-6">
                        <div
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-bold uppercase tracking-widest w-fit ${!member.is_suspended ? "border-emerald-100 text-emerald-600" : "border-red-100 text-red-500"}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${!member.is_suspended ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}
                          ></span>
                          {!member.is_suspended ? "Active" : "Suspended"}
                        </div>
                      </td>
                      {mode === "single" && (
                        <td className="px-6 py-6">
                          <div className="flex items-center justify-end gap-2.5">
                            <button
                              onClick={() => {
                                setSelectedFaculty(member);
                                setShowViewModal(true);
                              }}
                              className="p-2.5 bg-slate-100 text-slate-600 rounded-full hover:bg-navy-900 hover:text-white transition-all active:scale-95 shadow-none"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => openEdit(member)}
                              className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-600 rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-slate-200 active:scale-95 transition-all shadow-none"
                            >
                              Modify
                            </button>
                            <button
                              onClick={() =>
                                handleSuspend(
                                  member.Username,
                                  member.is_suspended,
                                )
                              }
                              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all active:scale-95 shadow-none ${member.is_suspended ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-none" : "bg-slate-900 hover:bg-slate-800 text-white shadow-none"}`}
                            >
                              {member.is_suspended ? "Reinstate" : "Suspend"}
                            </button>
                            <button
                              onClick={() => handleDelete(member.Username)}
                              className="p-2.5 bg-red-50 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all active:scale-90 border border-red-100"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={mode === "bulk" ? 5 : 5}
                    className="p-24 text-center"
                  >
                    <div className="flex flex-col items-center gap-5">
                      <div className="p-6 bg-slate-50 rounded-full border border-slate-100 shadow-none">
                        <Users size={40} className="text-slate-300" />
                      </div>
                      <p className="font-semibold text-slate-400 italic text-sm">
                        No staff members matching your criteria.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-10 py-6 bg-slate-50/50 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Page {page} of {meta.totalPages} • Total {meta.total} staff
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 disabled:opacity-30 hover:bg-slate-50 shadow-none"
              >
                Previous
              </button>
              <div className="flex gap-1.5">
                {[...Array(Math.min(meta.totalPages, 5))].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-bold transition-all ${page === i + 1 ? "bg-navy-900 text-white shadow-none" : "bg-white border border-slate-200 text-slate-400 hover:border-navy-100 hover:text-navy-900"}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 disabled:opacity-30 hover:bg-slate-50 shadow-none"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <AlertDialog
        open={showModal}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setShowModal(false);
          }
        }}
      >
        <AlertDialogContent className="max-w-xl p-0 overflow-hidden bg-white border-slate-100 rounded-2xl shadow-2xl">
          <div className="relative">
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all z-10"
            >
              <X size={20} />
            </button>

            <AlertDialogHeader className="p-8 pb-4 flex flex-col items-center text-center gap-2">
              <div className="relative mb-4 group">
                <div className="p-1 bg-white ring-4 ring-navy-50 rounded-full shadow-sm">
                  <div className="w-24 h-24 rounded-full bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative">
                    {formData.profileUrl ? (
                      <img
                        src={formData.profileUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-slate-300">
                        <Users size={32} />
                        <span className="text-[8px] font-black uppercase tracking-tighter mt-1">
                          No Photo
                        </span>
                      </div>
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                        <Loader2 className="animate-spin text-navy-900 w-5 h-5" />
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-navy-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-black transition-all active:scale-90 border-2 border-white z-10"
                >
                  <Camera size={14} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>
              <AlertDialogTitle className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">
                {editMode ? "Institutional Update" : "Faculty Onboarding"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-[14px] font-medium text-slate-500 mt-1 leading-relaxed">
                {editMode
                  ? "Modify professional credentials and access level."
                  : "Create a new entry in the high-performance registry."}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      Personnel ID / Username
                    </label>
                    <input
                      required
                      disabled={editMode}
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          username: e.target.value.toLowerCase(),
                        })
                      }
                      className="w-full h-12 px-5 bg-slate-50 border-2 border-slate-200 focus:border-navy-900 focus:bg-white rounded-xl outline-none font-bold text-slate-900 transition-all disabled:opacity-50"
                      placeholder="e.g. jdoe"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      Legal Full Name
                    </label>
                    <input
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full h-12 px-5 bg-slate-50 border-2 border-slate-200 focus:border-navy-900 focus:bg-white rounded-xl outline-none font-bold text-slate-900 transition-all"
                      placeholder="e.g. Dr. John Wick"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    University Email
                  </label>
                  <input
                    required
                    type="email"
                    disabled={editMode}
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full h-12 px-5 bg-slate-50 border-2 border-slate-200 focus:border-navy-900 focus:bg-white rounded-xl outline-none font-bold text-slate-900 transition-all disabled:opacity-50"
                    placeholder="personnel@rguktong.ac.in"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {!deptRestrict && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                        Department
                      </label>
                      <select
                        value={formData.department}
                        onChange={(e) =>
                          setFormData({ ...formData, department: e.target.value })
                        }
                        className="w-full h-12 px-5 bg-slate-50 border-2 border-slate-200 focus:border-navy-900 focus:bg-white rounded-xl outline-none font-bold text-slate-900 transition-all cursor-pointer"
                      >
                        {DEPARTMENTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      System Privileges
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      className="w-full h-12 px-5 bg-slate-50 border-2 border-slate-200 focus:border-navy-900 focus:bg-white rounded-xl outline-none font-bold text-slate-900 transition-all cursor-pointer"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Professional Designation
                  </label>
                  <input
                    required
                    value={formData.designation}
                    onChange={(e) =>
                      setFormData({ ...formData, designation: e.target.value })
                    }
                    className="w-full h-12 px-5 bg-slate-50 border-2 border-slate-200 focus:border-navy-900 focus:bg-white rounded-xl outline-none font-bold text-slate-900 transition-all"
                    placeholder="e.g. Senior Lecturer / Head of Dept"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3.5 rounded-xl border-2 border-slate-100 text-slate-400 hover:bg-slate-50 font-black uppercase tracking-widest text-[10px] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] py-3.5 rounded-xl bg-navy-900 text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-navy-100 hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : editMode ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <UserPlus size={16} />
                  )}
                  {isSubmitting ? "PROCESSING..." : editMode ? "UPDATE REGISTRY" : "ONBOARD FACULTY"}
                </button>
              </div>
            </form>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      {/* ─── Bio View Modal ─── */}
      {showViewModal && selectedFaculty && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-xl overflow-hidden shadow-none relative animate-in zoom-in-95 duration-300 border border-white/20">
            {/* Modal Header/Profile Panel */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-10 text-white relative">
              <button
                onClick={() => setShowViewModal(false)}
                className="absolute top-8 right-8 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white/50 hover:text-white"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-xl bg-white/10 border-4 border-white/10 overflow-hidden shadow-none shrink-0">
                  {selectedFaculty.ProfileUrl ? (
                    <img
                      src={selectedFaculty.ProfileUrl}
                      alt={selectedFaculty.Name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-black bg-navy-900">
                      {selectedFaculty.Name?.[0]}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-3xl font-black tracking-tight leading-none mb-2">
                    {selectedFaculty.Name}
                  </h3>
                  <p className="text-blue-400 font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-navy-500/20 rounded">
                      {selectedFaculty.Designation || "Lecturer"}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span>{selectedFaculty.Department} Department</span>
                  </p>
                  <div className="flex items-center gap-4 mt-4 text-slate-400 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Mail size={12} className="text-blue-400" />
                      {selectedFaculty.Email}
                    </div>
                    {selectedFaculty.Contact && (
                      <div className="flex items-center gap-1.5">
                        <Plus size={12} className="text-emerald-400" />
                        {selectedFaculty.Contact}
                      </div>
                    )}
                    {selectedFaculty.CreatedAt && (
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-amber-400" />
                        Joined{" "}
                        {new Date(
                          selectedFaculty.CreatedAt,
                        ).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bio Content */}
            <div className="p-10 max-h-[60vh] overflow-y-auto bg-slate-50/50">
              <div className="space-y-8">
                <div className="flex items-center gap-3 mb-6">
                  <BookOpen size={20} className="text-slate-400" />
                  <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                    Professional Biography
                  </h4>
                </div>

                {selectedFaculty.Bio &&
                  Object.keys(selectedFaculty.Bio).length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                    {Object.entries(selectedFaculty.Bio).map(
                      ([key, val]: any) => {
                        if (!val || (Array.isArray(val) && val.length === 0))
                          return null;
                        return (
                          <div
                            key={key}
                            className="bg-white p-6 rounded-xl border border-slate-100 shadow-none"
                          >
                            <label className="text-[10px] font-black uppercase tracking-widest text-navy-900 block mb-3">
                              {key.replace(/_/g, " ")}
                            </label>
                            {Array.isArray(val) ? (
                              <ul className="space-y-2">
                                {val.map((item: string, i: number) => (
                                  <li
                                    key={i}
                                    className="text-sm text-slate-600 font-medium flex items-start gap-2 leading-relaxed"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-200 mt-2 shrink-0" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                {val}
                              </p>
                            )}
                          </div>
                        );
                      },
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-xl border border-slate-100 border-dashed">
                    <BookOpen
                      size={40}
                      className="mx-auto text-slate-200 mb-4"
                    />
                    <p className="text-slate-400 font-bold italic text-sm">
                      No biographical data available for this member.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 bg-white border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-none active:scale-95"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
