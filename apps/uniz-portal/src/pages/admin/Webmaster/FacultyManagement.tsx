/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  Users,
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
import { useRecoilState } from "recoil";
import { facultyAtom } from "../../../store/atoms";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { SectionHeader } from "../../../components/admin/SectionHeader";
import {
  adminPageWrapClass,
  adminCardClass,
  adminLabelClass,
  adminInputClass,
  adminSelectClass,
  adminPrimaryButtonClass,
  adminGhostButtonClass,
  adminSegmentWrapClass,
  adminSegmentActiveClass,
  adminSegmentInactiveClass,
  adminModalShellClass,
  adminModalTitleClass,
  adminModalDescClass,
} from "../../../components/admin/admin-ui";
import { cn } from "../../../utils/cn";

const ROLES = ["webmaster", "coe", "swo", "dean", "ao", "OTHER"];
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
  const [facultyState, setFacultyState] = useRecoilState(facultyAtom);
  const faculty = facultyState.data;
  const [loading, setLoading] = useState(!facultyState.fetched);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [meta, setMeta] = useState<any>({
    total: facultyState.fetched ? facultyState.data.length : 0,
    totalPages: 1,
  });
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
  const fetchFaculty = async (forceLoading = false) => {
    if (forceLoading || !facultyState.fetched) setLoading(true);
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
        setFacultyState({
          fetched: true,
          data: data.faculty || [],
        });
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

  const hasMounted = React.useRef(false);

  useEffect(() => {
    // Only fetch on mount if not already fetched
    if (!facultyState.fetched || hasMounted.current) {
      fetchFaculty();
    }
    hasMounted.current = true;
  }, [page, deptRestrict]);

  useEffect(() => {
    // Skip initial run to avoid double fetch on mount
    if (!hasMounted.current) return;

    const timer = setTimeout(() => {
      // If we are not on page 1, resetting page to 1 will trigger the [page] effect
      // If we are already on page 1, we must call fetchFaculty directly
      if (page !== 1) {
        setPage(1);
      } else {
        fetchFaculty();
      }
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
    <div className={cn(adminPageWrapClass, "pb-20")}>
      {/* ─── Top bar ─── */}
      <SectionHeader
        icon={<Users size={18} />}
        eyebrow="Management"
        title="Faculty Management"
        subtitle="Strategic management of administrative and teaching assets."
        actions={
          <>
            <div className={adminSegmentWrapClass}>
              <button
                onClick={() => setMode(mode === "single" ? "bulk" : "single")}
                className={
                  mode === "bulk"
                    ? cn(adminSegmentActiveClass, "px-2.5 py-1.5")
                    : cn(adminSegmentInactiveClass, "px-2.5 py-1.5")
                }
                title="Toggle bulk mode"
              >
                <Layers size={16} />
              </button>
              <button
                onClick={() => fetchFaculty(true)}
                className={cn(
                  adminSegmentInactiveClass,
                  "px-2.5 py-1.5",
                  loading && "animate-spin",
                )}
                title="Refresh"
              >
                <RefreshCw size={16} />
              </button>
            </div>

            <div className="relative">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                size={15}
              />
              <input
                type="text"
                placeholder="Search registry…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={cn(adminInputClass, "pl-10 w-[240px]")}
              />
            </div>

            {mode === "single" && (
              <button
                onClick={openAdd}
                className={cn(adminPrimaryButtonClass, "whitespace-nowrap")}
              >
                <UserPlus size={16} /> Add Faculty
              </button>
            )}
          </>
        }
      />

      {/* ─── BULK MODE ─── */}
      {mode === "bulk" && (
        <div className="space-y-6">
          {/* Sub-tabs */}
          <div className={adminSegmentWrapClass}>
            {(["add", "update", "delete"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setBulkTab(t);
                  setBulkResult(null);
                }}
                className={
                  bulkTab === t
                    ? t === "delete"
                      ? cn(adminSegmentActiveClass, "!bg-rose-600 !text-white")
                      : adminSegmentActiveClass
                    : adminSegmentInactiveClass
                }
              >
                {t === "add"
                  ? "Bulk Add"
                  : t === "update"
                    ? "Bulk Update"
                    : "Bulk Delete"}
              </button>
            ))}
          </div>

          {/* ── Bulk Add ── */}
          {bulkTab === "add" && (
            <div className="w-full space-y-8">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="text-[16px] font-semibold tracking-tight text-zinc-900">
                    Bulk Import
                  </h3>
                  <p className="text-[13px] text-zinc-500">
                    Automated registry ingestion via protocol-aligned CSV.
                  </p>
                </div>
                <button
                  onClick={downloadTemplate}
                  className={adminGhostButtonClass}
                >
                  <Download size={14} /> Download Template
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className={cn(adminCardClass, "overflow-hidden border-dashed border-zinc-300 bg-zinc-50/40 p-6")}>
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
                                toast.success(
                                  `Successfully parsed ${results.data.length} rows`,
                                );
                              }
                            },
                            error: (err) => {
                              toast.error(
                                "Failed to parse file: " + err.message,
                              );
                            },
                          });
                        } else {
                          setCsvText("");
                        }
                      }}
                      label="Registry Asset"
                      description="CSV format. Default password = username@uniz"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={adminLabelClass}>CSV Preview</label>
                  <textarea
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl font-mono text-[11px] text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-400 transition-all resize-none"
                    placeholder={`username,name,email,department,designation,role\nktejokiran,K Tejo Kiran,ktejokiran@rguktong.ac.in,CSE,Lecturer,teacher`}
                  />
                </div>
              </div>

              <button
                onClick={handleBulkAdd}
                disabled={bulkLoading || !csvText.trim()}
                className={cn(adminPrimaryButtonClass, "h-12 w-full")}
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
              <div className="bg-zinc-50 border border-zinc-200/70 rounded-xl p-4 flex items-center gap-3">
                <CheckSquare size={18} className="text-zinc-700 shrink-0" />
                <p className="text-[13px] text-zinc-600">
                  Select faculty from the table below, then pick fields to
                  update.
                  <span className="font-semibold text-zinc-900 ml-1">
                    {selectedUsernames.size} selected.
                  </span>
                </p>
              </div>
              <div className={cn(adminCardClass, "p-8 space-y-6")}>
                <h3 className="text-[16px] font-semibold tracking-tight text-zinc-900">
                  Fields to Apply to Selected
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className={adminLabelClass}>New Role</label>
                    <div className="relative">
                      <select
                        value={bulkUpdateFields.role}
                        onChange={(e) =>
                          setBulkUpdateFields((p) => ({
                            ...p,
                            role: e.target.value,
                          }))
                        }
                        className={adminSelectClass}
                      >
                        <option value="">- No change -</option>
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className={adminLabelClass}>New Department</label>
                    <div className="relative">
                      <select
                        value={bulkUpdateFields.department}
                        onChange={(e) =>
                          setBulkUpdateFields((p) => ({
                            ...p,
                            department: e.target.value,
                          }))
                        }
                        className={adminSelectClass}
                      >
                        <option value="">- No change -</option>
                        {DEPARTMENTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className={adminLabelClass}>New Designation</label>
                    <input
                      value={bulkUpdateFields.designation}
                      onChange={(e) =>
                        setBulkUpdateFields((p) => ({
                          ...p,
                          designation: e.target.value,
                        }))
                      }
                      placeholder="e.g. Senior Lecturer"
                      className={adminInputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={adminLabelClass}>New Name (Generic)</label>
                    <input
                      value={bulkUpdateFields.name}
                      onChange={(e) =>
                        setBulkUpdateFields((p) => ({
                          ...p,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Apply same name to all"
                      className={adminInputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={adminLabelClass}>New Contact</label>
                    <input
                      value={bulkUpdateFields.contact}
                      onChange={(e) =>
                        setBulkUpdateFields((p) => ({
                          ...p,
                          contact: e.target.value,
                        }))
                      }
                      placeholder="Apply same contact to all"
                      className={adminInputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={adminLabelClass}>Profile URL</label>
                    <input
                      value={bulkUpdateFields.profileUrl}
                      onChange={(e) =>
                        setBulkUpdateFields((p) => ({
                          ...p,
                          profileUrl: e.target.value,
                        }))
                      }
                      placeholder="Apply same image to all"
                      className={adminInputClass}
                    />
                  </div>
                </div>
                <button
                  onClick={handleBulkUpdate}
                  disabled={bulkLoading || !selectedUsernames.size}
                  className={cn(adminPrimaryButtonClass, "h-12 w-full")}
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
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-center gap-3">
                <AlertTriangle size={18} className="text-rose-500 shrink-0" />
                <p className="text-[13px] text-rose-700">
                  Select rows below then delete. This is{" "}
                  <strong>permanent and cannot be undone.</strong>
                  <span className="font-semibold ml-1">
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
                className="w-full h-12 bg-rose-600 text-white rounded-xl font-semibold tracking-tight text-[13px] hover:bg-rose-700 transition-all flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.99]"
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
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
                  <div className={cn("max-w-sm w-full p-8", adminModalShellClass)}>
                    <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center mb-5">
                      <AlertTriangle size={24} className="text-rose-500" />
                    </div>
                    <h3 className={cn(adminModalTitleClass, "mb-2")}>
                      Confirm bulk delete
                    </h3>
                    <p className={cn(adminModalDescClass, "mb-3")}>
                      You are about to permanently delete{" "}
                      <strong className="text-rose-600 font-semibold">
                        {selectedUsernames.size} faculty account
                        {selectedUsernames.size > 1 ? "s" : ""}
                      </strong>
                      .
                    </p>
                    <div className="max-h-28 overflow-y-auto bg-zinc-50 rounded-xl p-3 mb-6 border border-zinc-200/70">
                      {Array.from(selectedUsernames).map((u) => (
                        <p key={u} className="text-xs font-mono text-zinc-600">
                          {u}
                        </p>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className={cn(adminGhostButtonClass, "flex-1")}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        className="flex-[2] h-11 rounded-xl bg-rose-600 text-white font-semibold text-[13px] hover:bg-rose-700 transition-all"
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
            <div className={cn(adminCardClass, "p-6")}>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 size={18} className="text-emerald-500" />
                <h4 className="font-semibold tracking-tight text-zinc-900">Operation Result</h4>
                <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-400">
                  Total {bulkResult.summary?.total}
                </span>
                <button
                  onClick={() => setBulkResult(null)}
                  className="ml-auto p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-rose-500 transition-all"
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
                        className={`text-2xl font-semibold ${k === "errors" ? "text-red-600" : k.includes("skip") || k.includes("not") ? "text-amber-600" : k === "deleted" ? "text-red-600" : "text-emerald-600"}`}
                      >
                        {v}
                      </p>
                      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-400 mt-0.5">
                        {k}
                      </p>
                    </div>
                  ))}
              </div>
              {bulkResult.results?.filter(
                (r: any) => r.status === "error" || r.reason,
              ).length > 0 && (
                <div className="max-h-36 overflow-y-auto bg-zinc-50 rounded-xl p-3 space-y-1">
                  {bulkResult.results
                    .filter(
                      (r: any) =>
                        r.status !== "created" && r.status !== "updated",
                    )
                    .map((r: any, i: number) => (
                      <p key={i} className="text-xs font-mono text-zinc-600">
                        <span
                          className={`font-bold ${r.status === "error" ? "text-red-500" : "text-amber-500"}`}
                        >
                          [{r.status}]
                        </span>{" "}
                        {r.username} {r.reason ? `- ${r.reason}` : ""}
                      </p>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── TABLE (shown in both modes) ─── */}
      <div className={cn(adminCardClass, "overflow-hidden")}>
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-8 py-4 bg-zinc-50/50 border-b border-zinc-200/70">
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-[0.12em]">
              Page {page} of {meta.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-8 px-3.5 bg-white border border-zinc-200 rounded-lg text-zinc-600 disabled:opacity-30 hover:text-zinc-900 hover:border-zinc-300 text-[12px] font-semibold transition-all"
              >
                Prev
              </button>
              <button
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 px-3.5 bg-white border border-zinc-200 rounded-lg text-zinc-600 disabled:opacity-30 hover:text-zinc-900 hover:border-zinc-300 text-[12px] font-semibold transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}

        <div className="relative">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="border-b border-zinc-200/70">
                {mode === "bulk" && (
                  <th className="px-6 py-4">
                    <button
                      onClick={toggleAll}
                      className="text-zinc-400 hover:text-zinc-700 transition-colors"
                    >
                      {selectedUsernames.size === faculty.length &&
                      faculty.length > 0 ? (
                        <CheckSquare size={18} className="text-zinc-900" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </th>
                )}
                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                  User Details
                </th>
                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                  Designation
                </th>
                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                  Role
                </th>
                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                  Status
                </th>
                {mode === "single" && (
                  <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400 text-right">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                Array(limit)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="border-b border-zinc-50/60">
                      {mode === "bulk" && (
                        <td className="px-6 py-6">
                          <Skeleton className="w-5 h-5 rounded-lg" />
                        </td>
                      )}
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-4">
                          <Skeleton className="w-11 h-11 rounded-full shrink-0" />
                          <div className="space-y-2 w-full">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-2 w-48 opacity-50" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-2 w-16 opacity-50" />
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <Skeleton className="h-7 w-20 rounded-lg" />
                      </td>
                      <td className="px-6 py-6">
                        <Skeleton className="h-7 w-24 rounded-full" />
                      </td>
                      {mode === "single" && (
                        <td className="px-6 py-6">
                          <div className="flex justify-end gap-3">
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <Skeleton className="w-20 h-10 rounded-full" />
                            <Skeleton className="w-20 h-10 rounded-full" />
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
                      className={`transition-colors group ${mode === "bulk" ? "cursor-pointer select-none" : ""} ${isSelected ? "bg-zinc-100/70 hover:bg-zinc-100" : "hover:bg-zinc-50/60"}`}
                    >
                      {mode === "bulk" && (
                        <td className="px-6 py-5">
                          {isSelected ? (
                            <CheckSquare size={18} className="text-zinc-900" />
                          ) : (
                            <Square
                              size={18}
                              className="text-zinc-300 group-hover:text-zinc-400"
                            />
                          )}
                        </td>
                      )}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center font-semibold text-[13px] overflow-hidden shrink-0">
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
                          <div className="flex flex-col min-w-0">
                            <p className="font-semibold text-zinc-900 tracking-tight leading-tight mb-0.5">
                              {member.Name}
                            </p>
                            <div className="flex items-center gap-1.5">
                              <Mail size={10} className="text-zinc-300" />
                              <p className="text-[12px] text-zinc-400 leading-none truncate">
                                {member.Email}
                              </p>
                            </div>
                            <p className="text-[10px] font-mono text-zinc-300 mt-1">
                              {member.Username}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-[13px] font-medium text-zinc-700">
                          {member.Designation || "Lecturer"}
                        </p>
                        <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-[0.12em] mt-0.5">
                          {member.Department}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <span className="px-2.5 py-1 bg-zinc-50 rounded-full text-zinc-500 font-medium text-[11px] border border-zinc-200">
                          {member.Role?.toUpperCase() || "FACULTY"}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium w-fit ${!member.is_suspended ? "border-zinc-200 bg-zinc-50 text-zinc-700" : "border-rose-100 bg-rose-50 text-rose-600"}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${!member.is_suspended ? "bg-emerald-500" : "bg-rose-500"}`}
                          ></span>
                          {!member.is_suspended ? "Active" : "Suspended"}
                        </div>
                      </td>
                      {mode === "single" && (
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedFaculty(member);
                                setShowViewModal(true);
                              }}
                              className="h-9 w-9 flex items-center justify-center bg-white border border-zinc-200 text-zinc-500 rounded-xl hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-all active:scale-95"
                              title="View Details"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              onClick={() => openEdit(member)}
                              className="h-9 px-4 bg-white border border-zinc-200 text-zinc-600 rounded-xl text-[12px] font-semibold hover:text-zinc-900 hover:border-zinc-300 active:scale-95 transition-all"
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
                              className="h-9 px-4 rounded-xl text-[12px] font-semibold transition-all active:scale-95 bg-zinc-900 hover:bg-zinc-800 text-white"
                            >
                              {member.is_suspended ? "Reinstate" : "Suspend"}
                            </button>
                            <button
                              onClick={() => handleDelete(member.Username)}
                              className="h-9 w-9 flex items-center justify-center bg-white border border-zinc-200 text-zinc-400 rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all active:scale-90"
                              title="Delete"
                            >
                              <Trash2 size={15} />
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
                    className="py-20 text-center"
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 flex items-center justify-center bg-zinc-50 rounded-2xl border border-zinc-200/70">
                        <Users size={32} strokeWidth={1.5} className="text-zinc-300" />
                      </div>
                      <p className="text-[14px] font-medium text-zinc-500 tracking-tight">
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
          <div className="flex items-center justify-between px-8 py-4 bg-zinc-50/50 border-t border-zinc-200/70">
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-[0.12em]">
              Page {page} of {meta.totalPages} • Total {meta.total} staff
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-8 px-3.5 bg-white border border-zinc-200 rounded-lg text-[12px] font-semibold text-zinc-600 disabled:opacity-30 hover:text-zinc-900 hover:border-zinc-300 transition-all"
              >
                Previous
              </button>
              <div className="flex gap-1.5">
                {[...Array(Math.min(meta.totalPages, 5))].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-semibold tabular-nums transition-all ${page === i + 1 ? "bg-zinc-900 text-white" : "bg-white border border-zinc-200 text-zinc-400 hover:border-zinc-300 hover:text-zinc-900"}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 px-3.5 bg-white border border-zinc-200 rounded-lg text-[12px] font-semibold text-zinc-600 disabled:opacity-30 hover:text-zinc-900 hover:border-zinc-300 transition-all"
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
        <AlertDialogContent className={cn("max-w-xl p-0 overflow-hidden", adminModalShellClass)}>
          <div className="relative">
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 rounded-full transition-all z-10"
            >
              <X size={20} />
            </button>

            <AlertDialogHeader className="p-8 pb-4 flex flex-col items-center text-center gap-2">
              <div className="relative mb-3 group">
                <div className="w-24 h-24 rounded-full bg-zinc-50 border border-dashed border-zinc-300 flex items-center justify-center overflow-hidden relative">
                  {formData.profileUrl ? (
                    <img
                      src={formData.profileUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-zinc-300">
                      <Users size={28} />
                      <span className="text-[9px] font-medium uppercase tracking-tight mt-1">
                        No Photo
                      </span>
                    </div>
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                      <Loader2 className="animate-spin text-zinc-900 w-5 h-5" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-zinc-900 text-white rounded-full flex items-center justify-center shadow-sm hover:bg-zinc-800 transition-all active:scale-90 border-2 border-white z-10"
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
              <AlertDialogTitle className={adminModalTitleClass}>
                {editMode ? "Institutional Update" : "Faculty Onboarding"}
              </AlertDialogTitle>
              <AlertDialogDescription className={adminModalDescClass}>
                {editMode
                  ? "Modify professional credentials and access level."
                  : "Create a new entry in the high-performance registry."}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className={adminLabelClass}>
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
                    className={adminInputClass}
                      placeholder="e.g. jdoe"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={adminLabelClass}>Legal Full Name</label>
                    <input
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className={adminInputClass}
                      placeholder="e.g. Dr. John Wick"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={adminLabelClass}>University Email</label>
                  <input
                    required
                    type="email"
                    disabled={editMode}
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className={adminInputClass}
                    placeholder="personnel@rguktong.ac.in"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {!deptRestrict && (
                    <div className="space-y-2">
                      <label className={adminLabelClass}>Department</label>
                      <select
                        value={formData.department}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            department: e.target.value,
                          })
                        }
                        className={adminSelectClass}
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
                    <label className={adminLabelClass}>System Privileges</label>
                    <div className="flex flex-col gap-2">
                      <select
                        value={
                          ROLES.includes(formData.role)
                            ? formData.role
                            : "OTHER"
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData({
                            ...formData,
                            role: val === "OTHER" ? "" : val,
                          });
                        }}
                        className={adminSelectClass}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r === "OTHER" ? "OTHER (CUSTOM)" : r.toUpperCase()}
                          </option>
                        ))}
                      </select>
                      {(formData.role === "" ||
                        !ROLES.includes(formData.role)) && (
                        <input
                          required
                          value={formData.role}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              role: e.target.value.toLowerCase(),
                            })
                          }
                          className={cn(adminInputClass, "h-10 text-xs")}
                          placeholder="Type custom role (e.g. registrar)"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={adminLabelClass}>
                    Professional Designation
                  </label>
                  <input
                    required
                    value={formData.designation}
                    onChange={(e) =>
                      setFormData({ ...formData, designation: e.target.value })
                    }
                    className={adminInputClass}
                    placeholder="e.g. Senior Lecturer / Head of Dept"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={cn(adminGhostButtonClass, "flex-1")}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(adminPrimaryButtonClass, "flex-[2]")}
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : editMode ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <UserPlus size={16} />
                  )}
                  {isSubmitting
                    ? "Processing…"
                    : editMode
                      ? "Update Registry"
                      : "Onboard Faculty"}
                </button>
              </div>
            </form>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      {/* ─── Bio View Modal ─── */}
      {showViewModal && selectedFaculty && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm cursor-pointer"
          onClick={() => setShowViewModal(false)}
        >
          <div
            className={cn("w-full max-w-xl overflow-hidden relative cursor-default", adminModalShellClass)}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowViewModal(false)}
              className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 rounded-full transition-all z-10"
            >
              <X size={20} />
            </button>

            {/* Centralized Header */}
            <div className="p-10 pb-4 flex flex-col items-center text-center">
              <div className="relative mb-5 group">
                <div className="w-24 h-24 rounded-full bg-zinc-50 border border-dashed border-zinc-300 flex items-center justify-center overflow-hidden">
                  {selectedFaculty.ProfileUrl ? (
                    <img
                      src={selectedFaculty.ProfileUrl}
                      alt={selectedFaculty.Name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-zinc-300">
                      <Users size={28} />
                      <span className="text-[9px] font-medium uppercase tracking-tight mt-1">
                        No Photo
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <h3 className="text-[24px] font-semibold text-zinc-900 tracking-[-0.01em] leading-none mb-3">
                {selectedFaculty.Name}
              </h3>

              <div className="flex flex-col items-center gap-2.5">
                <p className="text-zinc-400 font-medium uppercase tracking-[0.14em] text-[10px]">
                  {selectedFaculty.Designation || "Faculty Member"}
                </p>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-zinc-50 rounded-full text-[11px] font-medium text-zinc-500 border border-zinc-200">
                    {selectedFaculty.Department} Department
                  </span>
                  <span className="px-2.5 py-1 bg-zinc-900 rounded-full text-[11px] font-medium text-white">
                    {selectedFaculty.Role?.toUpperCase() || "FACULTY"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-6 mt-6 text-zinc-400">
                <div className="flex items-center gap-2 text-[11px] font-medium">
                  <Mail size={12} className="text-zinc-400" />
                  {selectedFaculty.Email}
                </div>
                {selectedFaculty.CreatedAt && (
                  <div className="flex items-center gap-2 text-[11px] font-medium">
                    <Calendar size={12} className="text-zinc-400" />
                    Joined{" "}
                    {new Date(selectedFaculty.CreatedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            {/* Bio Content Area */}
            <div className="px-10 py-6 max-h-[50vh] overflow-y-auto bg-zinc-50/40 border-t border-zinc-200/70">
              <div className="space-y-6">
                <div className="flex items-center gap-2.5 mb-2">
                  <BookOpen size={16} className="text-zinc-400" />
                  <h4 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                    Professional Biography
                  </h4>
                </div>

                {selectedFaculty.Bio &&
                Object.keys(selectedFaculty.Bio).length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {Object.entries(selectedFaculty.Bio).map(
                      ([key, val]: any) => {
                        if (!val || (Array.isArray(val) && val.length === 0))
                          return null;
                        return (
                          <div
                            key={key}
                            className="bg-white p-5 rounded-xl border border-zinc-200/70 hover:border-zinc-300 transition-colors"
                          >
                            <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400 block mb-3">
                              {key.replace(/_/g, " ")}
                            </label>
                            {Array.isArray(val) ? (
                              <ul className="space-y-2.5">
                                {val.map((item: string, i: number) => (
                                  <li
                                    key={i}
                                    className="text-[13px] text-zinc-600 flex items-start gap-3 leading-relaxed"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 mt-2 shrink-0" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-[13px] text-zinc-600 leading-relaxed">
                                {val}
                              </p>
                            )}
                          </div>
                        );
                      },
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-xl border border-zinc-200 border-dashed">
                    <BookOpen
                      size={28}
                      className="mx-auto text-zinc-200 mb-3"
                    />
                    <p className="text-zinc-400 text-[13px]">
                      No biographical data available for this member.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-white border-t border-zinc-200/70 flex justify-end gap-3">
              <button
                onClick={() => setShowViewModal(false)}
                className={adminPrimaryButtonClass}
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
