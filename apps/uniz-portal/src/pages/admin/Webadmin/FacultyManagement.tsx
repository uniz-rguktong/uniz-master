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
import { cn } from "@/utils/cn";
import { formatRoleLabel } from "@/utils/displayText";
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
import { Table } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "../../../components/admin/SectionHeader";
import { uploadImage } from "../../../api/uploadImage";
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

const ROLES = ["coe", "swo", "dean", "ao", "OTHER"];
const DEPARTMENTS = [
  "CSE",
  "ECE",
  "EEE",
  "MECH",
  "CIVIL",
  "CHEM",
  "MME",
  "AI/ML",
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

const isWebadminRole = () => {
  const role = (localStorage.getItem("admin_role") || "").toLowerCase();
  const username = (localStorage.getItem("username") || "")
    .replace(/"/g, "")
    .trim()
    .toLowerCase();
  const identity = username.includes("@")
    ? username
    : username
      ? `${username}@rguktong.ac.in`
      : "";
  return role === "webadmin" && identity === "webadmin@rguktong.ac.in";
};

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
      !window.confirm(`Permanently delete ${username}? This cannot be undone.`)
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
      const uploadedUrl = await uploadImage(
        file,
        "faculty-profile",
        formData.username || undefined,
      );
      if (uploadedUrl) {
        setFormData((prev) => ({ ...prev, profileUrl: uploadedUrl }));
        toast.success("Profile photo uploaded!");
      } else {
        toast.error("Upload failed");
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
      if (n.has(username)) n.delete(username);
      else n.add(username);
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
    if (bulkUpdateFields.email) {
      if (!isWebadminRole()) {
        toast.error("Only webadmin can change faculty email");
        return;
      }
      fieldsToApply.email = bulkUpdateFields.email;
    }
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
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none"
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
                      ? cn(adminSegmentActiveClass, "!bg-error !text-on-error")
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
                  <h3 className="text-[16px] font-semibold tracking-tight text-text">
                    Bulk Import
                  </h3>
                  <p className="text-[13px] text-text-2">
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
                  <div
                    className={cn(
                      adminCardClass,
                      "overflow-hidden border-dashed border-border-strong bg-surface-2/40 p-6",
                    )}
                  >
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
                    className="w-full px-4 py-3 bg-surface border border-border rounded-xl font-mono text-caption text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus:border-border-strong transition-[color,background-color,border-color,opacity,transform,box-shadow] resize-none"
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
              <div className="bg-surface-2 border border-border/70 rounded-xl p-4 flex items-center gap-3">
                <CheckSquare size={18} className="text-text shrink-0" />
                <p className="text-[13px] text-text-2">
                  Select faculty from the table below, then pick fields to
                  update.
                  <span className="font-semibold text-text ml-1">
                    {selectedUsernames.size} selected.
                  </span>
                </p>
              </div>
              <div className={cn(adminCardClass, "p-8 space-y-6")}>
                <h3 className="text-[16px] font-semibold tracking-tight text-text">
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
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none"
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
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none"
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
                    <label className={adminLabelClass}>
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
                  {isWebadminRole() && (
                    <div className="space-y-2">
                      <label className={adminLabelClass}>New Email</label>
                      <input
                        type="email"
                        value={bulkUpdateFields.email}
                        onChange={(e) =>
                          setBulkUpdateFields((p) => ({
                            ...p,
                            email: e.target.value,
                          }))
                        }
                        placeholder="Apply same email to all"
                        className={adminInputClass}
                      />
                    </div>
                  )}
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
              <div className="bg-[color-mix(in_srgb,var(--error)_8%,var(--surface))] border border-error rounded-xl p-4 flex items-center gap-3">
                <AlertTriangle size={18} className="text-error shrink-0" />
                <p className="text-[13px] text-error">
                  Select rows below then delete. This is{" "}
                  <span className="font-semibold">permanent and cannot be undone.</span>
                  <span className="font-semibold ml-1">
                    {selectedUsernames.size} selected.
                  </span>
                </p>
              </div>
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                onClick={() => {
                  if (!selectedUsernames.size) {
                    toast.error("Select at least one user");
                    return;
                  }
                  setShowDeleteConfirm(true);
                }}
                disabled={bulkLoading || !selectedUsernames.size}
              >
                {bulkLoading ? (
                  <Loader2 className="animate-spin w-4 h-4" />
                ) : (
                  <Trash2 size={16} />
                )}
                {bulkLoading
                  ? "Deleting..."
                  : `Delete ${selectedUsernames.size} Selected`}
              </Button>

              {/* Confirm Dialog */}
              {showDeleteConfirm && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-primary/40  p-4">
                  <div
                    className={cn("max-w-sm w-full p-8", adminModalShellClass)}
                  >
                    <div className="w-12 h-12 bg-[color-mix(in_srgb,var(--error)_8%,var(--surface))] rounded-xl flex items-center justify-center mb-5">
                      <AlertTriangle size={24} className="text-error" />
                    </div>
                    <h3 className={cn(adminModalTitleClass, "mb-2")}>
                      Confirm bulk delete
                    </h3>
                    <p className={cn(adminModalDescClass, "mb-3")}>
                      You are about to permanently delete{" "}
                      <strong className="text-error font-semibold">
                        {selectedUsernames.size} faculty account
                        {selectedUsernames.size > 1 ? "s" : ""}
                      </strong>
                      .
                    </p>
                    <div className="max-h-28 overflow-y-auto bg-surface-2 rounded-xl p-3 mb-6 border border-border/70">
                      {Array.from(selectedUsernames).map((u) => (
                        <p key={u} className="text-caption font-mono text-text-2">
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
                      <Button type="button" variant="destructive" className="flex-[2]" onClick={handleBulkDelete}>
                        Yes, Delete All
                      </Button>
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
                <CheckCircle2 size={18} className="text-success" />
                <h4 className="font-semibold tracking-tight text-text">
                  Operation Result
                </h4>
                <span className="text-caption font-medium text-text-3">
                  Total {bulkResult.summary?.total}
                </span>
                <button
                  onClick={() => setBulkResult(null)}
                  className="ml-auto p-1.5 hover:bg-surface-2 rounded-lg text-text-3 hover:text-error transition-[color,background-color,border-color,opacity,transform,box-shadow]"
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
                      className={`p-3 rounded-xl text-center ${k === "errors" || k === "deleted" ? (k === "deleted" ? "bg-[color-mix(in_srgb,var(--error)_8%,var(--surface))]" : "bg-[color-mix(in_srgb,var(--error)_8%,var(--surface))]") : k.includes("skip") || k.includes("not") ? "bg-[color-mix(in_srgb,var(--warning)_8%,var(--surface))]" : "bg-[color-mix(in_srgb,var(--success)_8%,var(--surface))]"}`}
                    >
                      <p
                        className={`text-2xl font-semibold ${k === "errors" ? "text-error" : k.includes("skip") || k.includes("not") ? "text-warning" : k === "deleted" ? "text-error" : "text-success"}`}
                      >
                        {v}
                      </p>
                      <p className="text-caption font-semibold text-text-3 mt-0.5">
                        {k}
                      </p>
                    </div>
                  ))}
              </div>
              {bulkResult.results?.filter(
                (r: any) => r.status === "error" || r.reason,
              ).length > 0 && (
                <div className="max-h-36 overflow-y-auto bg-surface-2 rounded-xl p-3 space-y-1">
                  {bulkResult.results
                    .filter(
                      (r: any) =>
                        r.status !== "created" && r.status !== "updated",
                    )
                    .map((r: any, i: number) => (
                      <p key={i} className="text-caption font-mono text-text-2">
                        <span
                          className={`font-semibold ${r.status === "error" ? "text-error" : "text-warning"}`}
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

      {loading ? (
        <p className="text-body text-text-2">Loading staff…</p>
      ) : (
        <Table
          rows={faculty}
          getRowId={(member: any) => String(member.id || member.Username)}
          onRowClick={mode === "bulk" ? (member: any) => toggleSelect(member.Username) : undefined}
          selectedId={undefined}
          empty={<EmptyState title="No staff members matching your criteria." icon={Users} />}
          footer={
            meta.totalPages > 1 ? (
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-small text-text-2 tabular-nums">
                  Page {page} of {meta.totalPages} · {meta.total} staff
                </p>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="compact" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Button>
                  <span className="text-small tabular-nums text-text">{page} / {meta.totalPages}</span>
                  <Button type="button" variant="outline" size="compact" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            ) : null
          }
          columns={[
            ...(mode === "bulk"
              ? [{
                  id: "select",
                  header: (
                    <button type="button" onClick={toggleAll} aria-label="Select page" className="text-text-2">
                      {selectedUsernames.size === faculty.length && faculty.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                  ),
                  label: "Select",
                  cell: (member: any) =>
                    selectedUsernames.has(member.Username) ? <CheckSquare size={16} /> : <Square size={16} className="text-text-3" />,
                }]
              : []),
            {
              id: "user",
              header: "Staff",
              primary: true,
              cell: (member: any) => (
                <span>
                  <span className="flex items-start gap-2">
                    {mode === "bulk" ? (
                      <span
                        role="checkbox"
                        aria-checked={selectedUsernames.has(member.Username)}
                        className="mt-1 text-text-2 sm:hidden"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(member.Username);
                        }}
                        aria-label={selectedUsernames.has(member.Username) ? "Deselect staff" : "Select staff"}
                      >
                        {selectedUsernames.has(member.Username) ? (
                          <CheckSquare size={16} className="text-text" />
                        ) : (
                          <Square size={16} />
                        )}
                      </span>
                    ) : null}
                    <span>
                      <span className="block font-semibold text-head">{member.Name}</span>
                      <span className="mt-0.5 block text-small text-text-2">{member.Email}</span>
                    </span>
                  </span>
                  {mode === "single" ? (
                    <span className="mt-2 flex flex-wrap gap-2 sm:hidden">
                      <Button type="button" variant="ghost" size="compact" onClick={(e) => { e.stopPropagation(); setSelectedFaculty(member); setShowViewModal(true); }}>
                        View
                      </Button>
                      <Button type="button" variant="outline" size="compact" onClick={(e) => { e.stopPropagation(); openEdit(member); }}>
                        Modify
                      </Button>
                      <Button type="button" variant="outline" size="compact" onClick={(e) => { e.stopPropagation(); handleSuspend(member.Username, member.is_suspended); }}>
                        {member.is_suspended ? "Reinstate" : "Suspend"}
                      </Button>
                      <Button type="button" variant="destructive" size="compact" onClick={(e) => { e.stopPropagation(); handleDelete(member.Username); }}>
                        Delete
                      </Button>
                    </span>
                  ) : null}
                </span>
              ),
            },
            {
              id: "role",
              header: "Role",
              meta: true,
              cell: (member: any) => member.Role ? formatRoleLabel(member.Role) : "Faculty",
            },
            {
              id: "designation",
              header: "Designation",
              meta: true,
              cell: (member: any) => member.Designation || member.Department || "Lecturer",
            },
            {
              id: "status",
              header: "Status",
              cell: (member: any) =>
                member.is_suspended ? <Badge tone="error">Suspended</Badge> : <Badge tone="success">Active</Badge>,
            },
            ...(mode === "single"
              ? [{
                  id: "actions",
                  header: "Actions",
                  label: "Actions",
                  cell: (member: any) => (
                    <span className="flex flex-wrap items-center gap-2">
                      <Button type="button" variant="ghost" size="icon" aria-label="View details" onClick={(e) => { e.stopPropagation(); setSelectedFaculty(member); setShowViewModal(true); }}>
                        <Eye size={16} />
                      </Button>
                      <Button type="button" variant="outline" size="compact" onClick={(e) => { e.stopPropagation(); openEdit(member); }}>
                        Modify
                      </Button>
                      <Button type="button" variant="outline" size="compact" onClick={(e) => { e.stopPropagation(); handleSuspend(member.Username, member.is_suspended); }}>
                        {member.is_suspended ? "Reinstate" : "Suspend"}
                      </Button>
                      <Button type="button" variant="destructive" size="icon" aria-label="Delete staff" onClick={(e) => { e.stopPropagation(); handleDelete(member.Username); }}>
                        <Trash2 size={16} />
                      </Button>
                    </span>
                  ),
                }]
              : []),
          ]}
        />
      )}

      <AlertDialog
        open={showModal}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setShowModal(false);
          }
        }}
      >
        <AlertDialogContent
          className={cn("max-w-xl p-0 overflow-hidden", adminModalShellClass)}
        >
          <div className="relative">
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 p-2 text-text-3 hover:text-text hover:bg-surface-2 rounded-md transition-[color,background-color,border-color,opacity,transform,box-shadow] z-10"
            >
              <X size={20} />
            </button>

            <AlertDialogHeader className="p-8 pb-4 flex flex-col items-center text-center gap-2">
              <div className="relative mb-3 group">
                <div className="w-24 h-24 rounded-full bg-surface-2 border border-dashed border-border-strong flex items-center justify-center overflow-hidden relative">
                  {formData.profileUrl ? (
                    <img
                      src={formData.profileUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-text-3">
                      <Users size={28} />
                      <span className="text-caption font-medium tracking-tight mt-1">
                        No Photo
                      </span>
                    </div>
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-white/80  flex items-center justify-center">
                      <Loader2 className="animate-spin text-text w-5 h-5" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 z-10 flex h-11 w-11 items-center justify-center rounded-full border-2 border-surface bg-primary text-primary-foreground hover:bg-primary-hover"
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
                    disabled={editMode && !isWebadminRole()}
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
                            {r === "OTHER"
                              ? "Other (custom)"
                              : formatRoleLabel(r)}
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
                          className={adminInputClass}
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
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-primary/40  cursor-pointer"
          onClick={() => setShowViewModal(false)}
        >
          <div
            className={cn(
              "w-full max-w-xl overflow-hidden relative cursor-default",
              adminModalShellClass,
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowViewModal(false)}
              className="absolute top-6 right-6 p-2 text-text-3 hover:text-text hover:bg-surface-2 rounded-md transition-[color,background-color,border-color,opacity,transform,box-shadow] z-10"
            >
              <X size={20} />
            </button>

            {/* Centralized Header */}
            <div className="p-10 pb-4 flex flex-col items-center text-center">
              <div className="relative mb-5 group">
                <div className="w-24 h-24 rounded-full bg-surface-2 border border-dashed border-border-strong flex items-center justify-center overflow-hidden">
                  {selectedFaculty.ProfileUrl ? (
                    <img
                      src={selectedFaculty.ProfileUrl}
                      alt={selectedFaculty.Name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-text-3">
                      <Users size={28} />
                      <span className="text-caption font-medium tracking-tight mt-1">
                        No Photo
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <h3 className="mb-3 font-serif text-[24px] font-normal leading-8 text-head">
                {selectedFaculty.Name}
              </h3>

              <div className="flex flex-col items-center gap-2.5">
                <p className="text-text-3 font-medium text-caption">
                  {selectedFaculty.Designation || "Faculty Member"}
                </p>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-surface-2 rounded-md text-caption font-medium text-text-2 border border-border">
                    {selectedFaculty.Department} Department
                  </span>
                  <span className="px-2.5 py-1 bg-primary rounded-md text-caption font-medium text-primary-foreground">
                    {selectedFaculty.Role
                      ? formatRoleLabel(selectedFaculty.Role)
                      : "Faculty"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-6 mt-6 text-text-3">
                <div className="flex items-center gap-2 text-caption font-medium">
                  <Mail size={12} className="text-text-3" />
                  {selectedFaculty.Email}
                </div>
                {selectedFaculty.CreatedAt && (
                  <div className="flex items-center gap-2 text-caption font-medium">
                    <Calendar size={12} className="text-text-3" />
                    Joined{" "}
                    {new Date(selectedFaculty.CreatedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            {/* Bio Content Area */}
            <div className="px-10 py-6 max-h-[50vh] overflow-y-auto bg-surface-2/40 border-t border-border/70">
              <div className="space-y-6">
                <div className="flex items-center gap-2.5 mb-2">
                  <BookOpen size={16} className="text-text-3" />
                  <h4 className="text-caption font-semibold text-text-3">
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
                            className="bg-surface p-5 rounded-xl border border-border/70 hover:border-border-strong transition-colors"
                          >
                            <label className="text-caption font-semibold text-text-3 block mb-3">
                              {key.replace(/_/g, " ")}
                            </label>
                            {Array.isArray(val) ? (
                              <ul className="space-y-2.5">
                                {val.map((item: string, i: number) => (
                                  <li
                                    key={i}
                                    className="text-[13px] text-text-2 flex items-start gap-3 leading-relaxed"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-border mt-2 shrink-0" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-[13px] text-text-2 leading-relaxed">
                                {val}
                              </p>
                            )}
                          </div>
                        );
                      },
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-surface rounded-xl border border-border border-dashed">
                    <BookOpen
                      size={28}
                      className="mx-auto text-text-3 mb-3"
                    />
                    <p className="text-text-3 text-[13px]">
                      No biographical data available for this member.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-surface border-t border-border/70 flex justify-end gap-3">
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
