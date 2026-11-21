/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminSectionPath } from "@/utils/adminSectionRoutes";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Loader2,
  ChevronDown,
  Lock,
  UserPlus,
  RefreshCw,
  Download,
  X,
  FileSpreadsheet,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  SlidersHorizontal,
  CheckSquare,
  Square,
  Pencil,
} from "lucide-react";
import StudentPerformanceModal from "./StudentPerformanceModal";
import StudentDashboard from "./StudentDashboard";
import StudentEditModal from "./StudentEditModal";
import { Pagination } from "../../../components/Pagination";
import { Table, type TableColumn } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "../../../utils/cn";
import { SectionHeader } from "../../../components/admin/SectionHeader";
import { AdminDialog } from "../../../components/admin/AdminDialog";
import {
  adminPageWrapClass,
  adminCardClass,
  adminLabelClass,
  adminInputClass,
  adminSelectClass,
  adminPrimaryButtonClass,
  adminGhostButtonClass,
  adminChipClass,
  adminDangerButtonClass,
} from "../../../components/admin/admin-ui";
import {
  ADMIN_VIEW_STUDENT,
  SEARCH_STUDENTS,
  ADMIN_SUSPEND_STUDENT,
  ADMIN_GLOBAL_RESET_PASS,
  GET_AVAILABLE_BATCHES,
  ADMIN_STUDENT_EXPORT,
  ADMIN_DELETE_STUDENT,
  ADMIN_BULK_DELETE_STUDENTS,
  ADMIN_UPDATE_STUDENT,
} from "../../../api/endpoints";
import { toast } from "@/utils/toast-ref";
import { ENGINEERING_BRANCH_OPTIONS } from "@/constants/branches";
import { parseJwt } from "../../../utils/security";
import { resolveAdminPortalRole, resolveHodBranch } from "../../../utils/adminRole";
import { formatDisplayText } from "../../../utils/displayText";

const PAGE_SIZE = 25;
const SEARCH_DEBOUNCE_MS = 450;
const ENRICH_CONCURRENCY = 4;

const EXPORT_FIELDS =
  "username,name,email,gender,phone,fatherName,motherName,fatherOccupation,motherOccupation,fatherEmail,motherEmail,fatherAddress,motherAddress,bloodGroup,dateOfBirth,year,semester,branch,section,batch,roomno,isPresentInCampus,isApplicationPending,isSuspended,category,campus,cgpa,totalBacklogs";

type StudentRow = Record<string, any> & {
  username: string;
  attendance_pct?: number | null;
};

function avgAttendance(summary: Record<string, { percentage?: number }> | undefined) {
  if (!summary || typeof summary !== "object") return null;
  const vals = Object.values(summary)
    .map((s) => s?.percentage)
    .filter((v): v is number => typeof v === "number");
  if (!vals.length) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

function TableSkeleton() {
  return (
    <div className={cn(adminCardClass, "overflow-hidden p-0 animate-pulse")}>
      <div className="h-11 bg-surface-2 border-b border-border" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-11 border-b border-border flex gap-4 px-4 items-center",
            i % 2 === 1 && "bg-surface-2/40",
          )}
        >
          <div className="h-3 w-16 bg-surface-2 rounded" />
          <div className="h-3 w-32 bg-surface-2 rounded" />
          <div className="h-3 w-24 bg-surface-2 rounded flex-1" />
        </div>
      ))}
      <div className="h-14 bg-surface-2/80 border-t border-border" />
    </div>
  );
}

type SortKey =
  | "username"
  | "name"
  | "email"
  | "branch"
  | "year"
  | "batch"
  | "section"
  | "cgpa"
  | "total_backlogs";

const SORTABLE_KEYS = new Set<string>([
  "username",
  "name",
  "email",
  "branch",
  "year",
  "batch",
  "section",
  "cgpa",
  "total_backlogs",
]);

const EDITABLE_KEYS = new Set<string>([
  "name",
  "email",
  "branch",
  "year",
  "batch",
  "section",
  "phone_number",
  "gender",
  "blood_group",
  "roomno",
  "cgpa",
  "total_backlogs",
]);

const COLUMN_API_FIELD: Record<string, string> = {
  name: "name",
  email: "email",
  branch: "branch",
  year: "year",
  batch: "batch",
  section: "section",
  phone_number: "phone",
  gender: "gender",
  blood_group: "bloodGroup",
  roomno: "roomno",
  cgpa: "cgpa",
  total_backlogs: "totalBacklogs",
};

const BRANCH_OPTIONS = [...ENGINEERING_BRANCH_OPTIONS];
const YEAR_OPTIONS = ["ALL", "E1", "E2", "E3", "E4", "PASSED_OUT"];
const GENDER_OPTIONS = ["ALL", "M", "F", "Other"];
const CATEGORY_OPTIONS = ["ALL", "GENERAL", "OBC", "SC", "ST", "EWS"];
const CAMPUS_OPTIONS = ["ALL", "ONGOLE", "NIDADAVOLE"];

/** Fixed widths so sticky `left` offsets stay aligned while scrolling. */
const COLUMNS: { key: string; label: string }[] = [
  { key: "row", label: "#" },
  { key: "username", label: "Student ID" },
  { key: "name", label: "Name" },
  { key: "branch", label: "Branch" },
  { key: "year", label: "Year" },
  { key: "batch", label: "Batch" },
  { key: "section", label: "Sec" },
  { key: "cgpa", label: "CGPA" },
  { key: "total_backlogs", label: "BL" },
  { key: "attendance_pct", label: "Att %" },
  { key: "phone_number", label: "Phone" },
  { key: "gender", label: "Gender" },
  { key: "blood_group", label: "Blood" },
  { key: "roomno", label: "Room" },
  { key: "is_in_campus", label: "Campus" },
  { key: "is_suspended", label: "Status" },
];

function cellValue(row: StudentRow, key: string, rowIndex: number) {
  switch (key) {
    case "row":
      return rowIndex;
    case "cgpa":
      return row.cgpa != null ? Number(row.cgpa).toFixed(2) : "—";
    case "total_backlogs":
      return row.total_backlogs ?? 0;
    case "attendance_pct":
      if (row.attendance_pct === undefined) return "…";
      return row.attendance_pct != null ? `${row.attendance_pct}%` : "—";
    case "is_in_campus":
      return row.is_in_campus ? "In" : "Out";
    case "is_suspended":
      return row.is_suspended ? "Suspended" : "Active";
    case "gender":
    case "blood_group":
    case "section":
    case "roomno":
      return row[key] || "—";
    default:
      return row[key] ?? "—";
  }
}

export default function StudentDetails() {
  const navigate = useNavigate();
  const adminToken = localStorage.getItem("admin_token");
  const decoded = adminToken ? parseJwt(adminToken) : null;
  const username = (localStorage.getItem("username") || "").replace(/"/g, "");
  const portalRole = resolveAdminPortalRole(decoded, username);
  const isHodReadOnly = portalRole === "hod";
  const hodBranch = isHodReadOnly ? resolveHodBranch(decoded, username) : "";

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [enriching, setEnriching] = useState(false);

  const [rows, setRows] = useState<StudentRow[]>([]);
  const [selectedRow, setSelectedRow] = useState<StudentRow | null>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const detailRequestRef = useRef(0);
  const fetchGenRef = useRef(0);
  const enrichGenRef = useRef(0);
  const skipAutoSearchRef = useRef(true);

  const [branch, setBranch] = useState(() =>
    isHodReadOnly && hodBranch ? hodBranch : "ALL",
  );
  const [year, setYear] = useState("ALL");
  const [batch, setBatch] = useState("ALL");
  const [intelligenceFilters, setIntelligenceFilters] = useState({
    hasRemedials: "all",
    minCgpa: "",
    maxCgpa: "",
    minBacklogs: "",
    maxBacklogs: "",
    isPresentInCampus: "ALL",
    isSuspended: "ALL",
    isApplicationPending: "ALL",
    gender: "ALL",
    section: "ALL",
    category: "ALL",
    campus: "ALL",
  });
  const [sortBy, setSortBy] = useState<SortKey>("username");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ username: string; key: string } | null>(
    null,
  );
  const [cellDraft, setCellDraft] = useState("");
  const [savingCell, setSavingCell] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [availableBatches, setAvailableBatches] = useState<string[]>([]);

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);

  const [performanceModalOpen, setPerformanceModalOpen] = useState(false);
  const [selectedStudentName, setSelectedStudentName] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [performanceData, setPerformanceData] = useState<any>(null);

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState("");
  const [resetPasswordValue, setResetPasswordValue] = useState("");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTargetUser, setDeleteTargetUser] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkDeleteConfirmText, setBulkDeleteConfirmText] = useState("");
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const authHeaders = () => ({
    Authorization: `Bearer ${(localStorage.getItem("admin_token") || "").replace(/"/g, "")}`,
    "Content-Type": "application/json",
  });

  const effectiveBranch = isHodReadOnly ? hodBranch : branch;

  const enrichAttendance = useCallback(
    async (students: StudentRow[], fetchGen: number) => {
      if (!students.length) return;
      const enrichGen = ++enrichGenRef.current;
      setEnriching(true);
      const token = localStorage.getItem("admin_token");
      const auth = `Bearer ${(token || "").replace(/"/g, "")}`;
      const enriched = [...students];

      for (let i = 0; i < students.length; i += ENRICH_CONCURRENCY) {
        if (
          enrichGen !== enrichGenRef.current ||
          fetchGen !== fetchGenRef.current
        ) {
          return;
        }
        const chunk = students.slice(i, i + ENRICH_CONCURRENCY);
        const chunkResults = await Promise.all(
          chunk.map(async (s) => {
            try {
              const res = await fetch(ADMIN_VIEW_STUDENT(s.username), {
                headers: { Authorization: auth },
              });
              const data = await res.json();
              if (data.success && data.student) {
                return {
                  ...s,
                  attendance_pct: avgAttendance(data.student.attendance_summary),
                  cgpa: data.student.cgpa ?? s.cgpa,
                  total_backlogs:
                    data.student.total_backlogs ?? s.total_backlogs,
                };
              }
            } catch {
              /* keep row */
            }
            return { ...s, attendance_pct: null };
          }),
        );
        chunkResults.forEach((row, idx) => {
          enriched[i + idx] = row;
        });
      }

      if (
        enrichGen !== enrichGenRef.current ||
        fetchGen !== fetchGenRef.current
      ) {
        return;
      }
      setRows(enriched);
      setEnriching(false);
    },
    [],
  );

  const fetchStudents = useCallback(
    async (page = 1, overrides?: { query?: string }) => {
      const gen = ++fetchGenRef.current;
      enrichGenRef.current += 1;
      setEnriching(false);
      const q = (overrides?.query ?? query).trim();
      setLoading(true);
      try {
        const res = await fetch(SEARCH_STUDENTS, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            username: q ? q.toUpperCase() : undefined,
            branch: effectiveBranch,
            year,
            batch,
            ...intelligenceFilters,
            sortBy,
            sortDir,
            page,
            limit: PAGE_SIZE,
          }),
        });
        if (gen !== fetchGenRef.current) return;
        const data = await res.json();
        if (data.success) {
          const list: StudentRow[] = data.students || [];
          setRows(list);
          if (data.pagination) setPagination(data.pagination);
          if (list.length === 0 && page === 1) {
            toast.info("No students match these filters");
          } else if (list.length > 0) {
            enrichAttendance(list, gen);
          }
        } else {
          toast.error(data.msg || data.message || "Search failed");
          setRows([]);
        }
      } catch {
        if (gen === fetchGenRef.current) toast.error("Error loading students");
      } finally {
        if (gen === fetchGenRef.current) setLoading(false);
      }
    },
    [
      query,
      effectiveBranch,
      year,
      batch,
      intelligenceFilters,
      sortBy,
      sortDir,
      enrichAttendance,
    ],
  );

  useEffect(() => {
    if (isHodReadOnly && branch !== hodBranch) {
      setBranch(hodBranch);
    }
  }, [isHodReadOnly, hodBranch, branch]);

  useEffect(() => {
    fetchBatches();
    fetchStudents(1);
    const t = setTimeout(() => {
      skipAutoSearchRef.current = false;
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (skipAutoSearchRef.current) return;
    const t = setTimeout(() => fetchStudents(1), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query, effectiveBranch, year, batch, intelligenceFilters, sortBy, sortDir, fetchStudents]);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setRecommendations([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(SEARCH_STUDENTS, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            username: query.trim().toUpperCase(),
            ...(isHodReadOnly && hodBranch ? { branch: hodBranch } : {}),
            limit: 6,
          }),
        });
        const data = await res.json();
        if (data.success) setRecommendations(data.students || []);
      } catch {
        /* ignore */
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setRecommendations([]);
      }
    };
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (resetModalOpen || editModalOpen || performanceModalOpen || deleteModalOpen) return;
      setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen, resetModalOpen, editModalOpen, performanceModalOpen, deleteModalOpen]);

  const fetchBatches = async () => {
    try {
      const res = await fetch(GET_AVAILABLE_BATCHES, {
        headers: { Authorization: authHeaders().Authorization },
      });
      const data = await res.json();
      if (data.success) setAvailableBatches(data.batches || []);
    } catch {
      /* ignore */
    }
  };

  const openDetail = async (row: StudentRow) => {
    const requestId = ++detailRequestRef.current;
    setSelectedRow(row);
    setDrawerOpen(true);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const res = await fetch(ADMIN_VIEW_STUDENT(row.username), {
        headers: { Authorization: authHeaders().Authorization },
      });
      const data = await res.json();
      if (requestId !== detailRequestRef.current) return;
      if (data.success) setDetailData(data.student);
      else toast.error(data.msg || "Could not load student");
    } catch {
      if (requestId !== detailRequestRef.current) return;
      toast.error("Failed to load student details");
    } finally {
      if (requestId === detailRequestRef.current) setDetailLoading(false);
    }
  };

  const closeDrawer = () => {
    detailRequestRef.current += 1;
    setDrawerOpen(false);
    setDetailData(null);
    setSelectedRow(null);
  };

  const drawerStudentName =
    detailData && selectedRow && detailData.username === selectedRow.username
      ? detailData.name || selectedRow.name || selectedRow.username
      : selectedRow?.name || selectedRow?.username || "";

  const pageUsernames = rows.map((r) => r.username);
  const allPageSelected =
    pageUsernames.length > 0 && pageUsernames.every((id) => selectedIds.has(id));

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) pageUsernames.forEach((id) => next.delete(id));
      else pageUsernames.forEach((id) => next.add(id));
      return next;
    });
  };

  const toggleRowSelect = (username: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(username)) next.delete(username);
      else next.add(username);
      return next;
    });
  };

  const handleSort = (key: string) => {
    if (!SORTABLE_KEYS.has(key)) return;
    const k = key as SortKey;
    if (sortBy === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(k);
      setSortDir("asc");
    }
  };

  const clearAllFilters = () => {
    setQuery("");
    setBranch(isHodReadOnly && hodBranch ? hodBranch : "ALL");
    setYear("ALL");
    setBatch("ALL");
    setIntelligenceFilters({
      hasRemedials: "all",
      minCgpa: "",
      maxCgpa: "",
      minBacklogs: "",
      maxBacklogs: "",
      isPresentInCampus: "ALL",
      isSuspended: "ALL",
      isApplicationPending: "ALL",
      gender: "ALL",
      section: "ALL",
      category: "ALL",
      campus: "ALL",
    });
    setSortBy("username");
    setSortDir("asc");
  };

  const activeFilterCount = [
    !isHodReadOnly && branch !== "ALL",
    year !== "ALL",
    batch !== "ALL",
    query.trim().length > 0,
    intelligenceFilters.gender !== "ALL",
    intelligenceFilters.section !== "ALL",
    intelligenceFilters.category !== "ALL",
    intelligenceFilters.campus !== "ALL",
    intelligenceFilters.hasRemedials !== "all",
    intelligenceFilters.isPresentInCampus !== "ALL",
    intelligenceFilters.isSuspended !== "ALL",
    intelligenceFilters.isApplicationPending !== "ALL",
    intelligenceFilters.minCgpa !== "",
    intelligenceFilters.maxCgpa !== "",
    intelligenceFilters.minBacklogs !== "",
    intelligenceFilters.maxBacklogs !== "",
  ].filter(Boolean).length;

  const startCellEdit = (row: StudentRow, key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isHodReadOnly || !EDITABLE_KEYS.has(key)) return;
    const raw = row[key];
    setEditingCell({ username: row.username, key });
    setCellDraft(
      key === "cgpa"
        ? raw != null
          ? String(raw)
          : ""
        : key === "total_backlogs"
          ? String(raw ?? 0)
          : String(raw ?? ""),
    );
  };

  const saveCellEdit = async (username: string, key: string) => {
    const apiField = COLUMN_API_FIELD[key];
    if (!apiField) return;

    let payloadValue: string | number = cellDraft.trim();
    if (key === "cgpa") payloadValue = Number(cellDraft) || 0;
    if (key === "total_backlogs") payloadValue = parseInt(cellDraft, 10) || 0;

    setSavingCell(`${username}:${key}`);
    try {
      const res = await fetch(ADMIN_UPDATE_STUDENT(username), {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ [apiField]: payloadValue }),
      });
      const data = await res.json();
      if (data.success) {
        setRows((prev) =>
          prev.map((r) =>
            r.username === username
              ? { ...r, ...(data.student || {}), [key]: payloadValue }
              : r,
          ),
        );
        if (detailData?.username === username && data.student) {
          setDetailData(data.student);
        }
        toast.success("Cell updated");
      } else {
        toast.error(data.message || "Update failed");
      }
    } catch {
      toast.error("Failed to save cell");
    } finally {
      setSavingCell(null);
      setEditingCell(null);
    }
  };

  const cancelCellEdit = () => {
    setEditingCell(null);
    setCellDraft("");
  };

  const renderSortIcon = (key: string) => {
    if (!SORTABLE_KEYS.has(key)) return null;
    if (sortBy !== key) return <ArrowUpDown size={12} className="text-text-3" />;
    return sortDir === "asc" ? (
      <ArrowUp size={12} className="text-text" />
    ) : (
      <ArrowDown size={12} className="text-text" />
    );
  };

  const renderNameCell = (row: StudentRow) => {
    if (isHodReadOnly) {
      return (
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="truncate text-text font-medium">{row.name || "—"}</span>
          <span className="truncate text-caption text-text-2 font-normal">
            {row.email || "—"}
          </span>
        </div>
      );
    }

    const isEditingName =
      editingCell?.username === row.username && editingCell?.key === "name";
    const isEditingEmail =
      editingCell?.username === row.username && editingCell?.key === "email";
    const isSavingName = savingCell === `${row.username}:name`;
    const isSavingEmail = savingCell === `${row.username}:email`;

    if (isEditingName) {
      return (
        <div className="flex flex-col gap-1 min-w-0">
          <input
            autoFocus
            type="text"
            value={cellDraft}
            onChange={(e) => setCellDraft(e.target.value)}
            onBlur={() => saveCellEdit(row.username, "name")}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveCellEdit(row.username, "name");
              if (e.key === "Escape") cancelCellEdit();
            }}
            onClick={(e) => e.stopPropagation()}
            className={adminInputClass}
          />
          <span className="truncate text-caption text-text-2 font-normal">
            {row.email || "—"}
          </span>
        </div>
      );
    }

    if (isEditingEmail) {
      return (
        <div className="flex flex-col gap-1 min-w-0">
          <span className="truncate text-text font-medium">{row.name || "—"}</span>
          <input
            autoFocus
            type="text"
            value={cellDraft}
            onChange={(e) => setCellDraft(e.target.value)}
            onBlur={() => saveCellEdit(row.username, "email")}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveCellEdit(row.username, "email");
              if (e.key === "Escape") cancelCellEdit();
            }}
            onClick={(e) => e.stopPropagation()}
            className={adminInputClass}
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-0.5 min-w-0">
        <span
          className="inline-flex items-center gap-1 min-w-0 group/name cursor-text"
          onClick={(e) => startCellEdit(row, "name", e)}
        >
          <span className="truncate text-text font-medium">{row.name || "—"}</span>
          <Pencil
            size={12}
            className="opacity-0 group-hover/name:opacity-40 text-text-3 shrink-0"
          />
          {isSavingName && <Loader2 size={12} className="animate-spin text-text-3 shrink-0" />}
        </span>
        <span
          className="inline-flex items-center gap-1 min-w-0 group/email cursor-text"
          onClick={(e) => startCellEdit(row, "email", e)}
        >
          <span className="truncate text-caption text-text-2 font-normal">
            {row.email || "—"}
          </span>
          <Pencil
            size={12}
            className="opacity-0 group-hover/email:opacity-40 text-text-3 shrink-0"
          />
          {isSavingEmail && <Loader2 size={12} className="animate-spin text-text-3 shrink-0" />}
        </span>
      </div>
    );
  };

  const renderEditableCell = (row: StudentRow, col: (typeof COLUMNS)[number]) => {
    const isEditing =
      editingCell?.username === row.username && editingCell?.key === col.key;
    const isSaving = savingCell === `${row.username}:${col.key}`;

    if (isEditing) {
      if (col.key === "branch") {
        return (
          <select
            autoFocus
            value={cellDraft}
            onChange={(e) => setCellDraft(e.target.value)}
            onBlur={() => saveCellEdit(row.username, col.key)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveCellEdit(row.username, col.key);
              if (e.key === "Escape") cancelCellEdit();
            }}
            onClick={(e) => e.stopPropagation()}
            className={adminSelectClass}
          >
            {BRANCH_OPTIONS.filter((b) => b !== "ALL").map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        );
      }
      if (col.key === "year") {
        return (
          <select
            autoFocus
            value={cellDraft}
            onChange={(e) => setCellDraft(e.target.value)}
            onBlur={() => saveCellEdit(row.username, col.key)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveCellEdit(row.username, col.key);
              if (e.key === "Escape") cancelCellEdit();
            }}
            onClick={(e) => e.stopPropagation()}
            className={adminSelectClass}
          >
            {YEAR_OPTIONS.filter((y) => y !== "ALL").map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        );
      }
      return (
        <input
          autoFocus
          type={col.key === "cgpa" || col.key === "total_backlogs" ? "number" : "text"}
          step={col.key === "cgpa" ? "0.01" : undefined}
          value={cellDraft}
          onChange={(e) => setCellDraft(e.target.value)}
          onBlur={() => saveCellEdit(row.username, col.key)}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveCellEdit(row.username, col.key);
            if (e.key === "Escape") cancelCellEdit();
          }}
          onClick={(e) => e.stopPropagation()}
          className={adminInputClass}
        />
      );
    }

    return (
      <span className="inline-flex items-center gap-1 group/cell">
        {cellValue(row, col.key, 0)}
        {!isHodReadOnly && EDITABLE_KEYS.has(col.key) && (
          <Pencil
            size={12}
            className="opacity-0 group-hover/cell:opacity-40 text-text-3 shrink-0"
          />
        )}
        {isSaving && <Loader2 size={12} className="animate-spin text-text-3" />}
      </span>
    );
  };

  const handleExport = async () => {
    setExporting(true);
    const url = ADMIN_STUDENT_EXPORT(
      effectiveBranch === "ALL" ? undefined : effectiveBranch,
      year === "ALL" ? undefined : year,
      EXPORT_FIELDS,
      batch === "ALL" ? undefined : batch,
    );
    try {
      const res = await fetch(url, {
        headers: { Authorization: authHeaders().Authorization },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Export failed");
      }
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `students_${effectiveBranch}_${year}_${batch}_${Date.now()}.xlsx`;
      a.click();
      toast.success("Excel export downloaded");
    } catch (e: any) {
      toast.error(e.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleToggleSuspension = async (username: string, current: boolean) => {
    if (!window.confirm(`${current ? "Restore" : "Suspend"} access for ${username}?`)) return;
    setIsActionLoading(username + "_suspend");
    try {
      const res = await fetch(ADMIN_SUSPEND_STUDENT(username), {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ suspended: !current }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Account status updated");
        setRows((prev) =>
          prev.map((s) =>
            s.username === username ? { ...s, is_suspended: !current } : s,
          ),
        );
        if (detailData?.username === username) {
          setDetailData((p: any) => ({ ...p, is_suspended: !current }));
        }
      } else toast.error(data.msg || "Action failed");
    } catch {
      toast.error("Error updating suspension");
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleGlobalResetPassword = (username: string) => {
    setResetTargetUser(username);
    setResetPasswordValue("temporary-password-123");
    setResetModalOpen(true);
  };

  const confirmResetPassword = async () => {
    if (!resetPasswordValue) {
      toast.error("Password cannot be empty");
      return;
    }
    setIsActionLoading(resetTargetUser + "_reset");
    try {
      const res = await fetch(ADMIN_GLOBAL_RESET_PASS, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          targetUsername: resetTargetUser,
          newPassword: resetPasswordValue,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Password reset for ${resetTargetUser}`);
        setResetModalOpen(false);
      } else toast.error(data.msg || "Reset failed");
    } catch {
      toast.error("Error resetting password");
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleDeleteStudent = (username: string) => {
    setDeleteTargetUser(username);
    setDeleteConfirmText("");
    setDeleteModalOpen(true);
  };

  const confirmDeleteStudent = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== deleteTargetUser.toUpperCase()) {
      toast.error("Student ID does not match");
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(ADMIN_DELETE_STUDENT(deleteTargetUser), {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Student ${deleteTargetUser} permanently deleted`);
        setDeleteModalOpen(false);
        setRows((prev) => prev.filter((s) => s.username !== deleteTargetUser));
        closeDrawer();
        fetchStudents(pagination.page);
      } else {
        toast.error(data.message || data.msg || "Delete failed");
      }
    } catch {
      toast.error("Failed to delete student");
    } finally {
      setDeleting(false);
    }
  };

  const openBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setBulkDeleteConfirmText("");
    setBulkDeleteModalOpen(true);
  };

  const confirmBulkDelete = async () => {
    const count = selectedIds.size;
    const confirmPhrase = `Delete ${count}`;
    if (bulkDeleteConfirmText.trim().toLowerCase() !== confirmPhrase.toLowerCase()) {
      toast.error(`Type "${confirmPhrase}" to confirm`);
      return;
    }
    setBulkDeleting(true);
    const ids = [...selectedIds];
    try {
      const res = await fetch(ADMIN_BULK_DELETE_STUDENTS, {
        method: "DELETE",
        headers: authHeaders(),
        body: JSON.stringify({ usernames: ids }),
      });
      const data = await res.json();
      if (data.success || data.summary?.deleted > 0) {
        toast.success(data.message || `Deleted ${data.summary?.deleted ?? 0} student(s)`);
        setBulkDeleteModalOpen(false);
        setSelectedIds(new Set());
        const deletedSet = new Set(
          (data.results || [])
            .filter((r: { status: string }) => r.status === "deleted")
            .map((r: { username: string }) => r.username),
        );
        setRows((prev) => prev.filter((s) => !deletedSet.has(s.username)));
        if (selectedRow && deletedSet.has(selectedRow.username)) closeDrawer();
        fetchStudents(pagination.page);
      } else {
        toast.error(data.message || "Bulk delete failed");
      }
    } catch {
      toast.error("Failed to delete selected students");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleOpenPerformance = async (std: StudentRow) => {
    setSelectedStudentName(std.name);
    setSelectedStudentId(std.username);
    setLoading(true);
    try {
      const res = await fetch(ADMIN_VIEW_STUDENT(std.username), {
        headers: { Authorization: authHeaders().Authorization },
      });
      const data = await res.json();
      if (data.success && data.student) {
        setPerformanceData(data.student);
        setPerformanceModalOpen(true);
      } else toast.error(data.msg || "Failed to fetch records");
    } catch {
      toast.error("Error retrieving performance");
    } finally {
      setLoading(false);
    }
  };

  const rangeStart = rows.length ? (pagination.page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(pagination.page * PAGE_SIZE, pagination.total);

  return (
    <div className={cn(adminPageWrapClass, "pb-24")}>
      <SectionHeader
        icon={<FileSpreadsheet size={18} />}
        eyebrow="Students"
        title="Student Details"
        subtitle={
          isHodReadOnly
            ? `Read-only view for ${hodBranch || "your"} department — all years, full profile and performance data.`
            : "Spreadsheet view with attendance, grades, and full profile data. 25 students per page."
        }
        actions={
          isHodReadOnly ? (
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className={adminGhostButtonClass}
            >
              {exporting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              Export Excel
            </button>
          ) : (
          <>
            <button
              type="button"
              onClick={() => {
                sessionStorage.setItem("uniz_bulk_tab", "actions");
                navigate(getAdminSectionPath("student_bulk"));
              }}
              className={adminGhostButtonClass}
            >
              <RefreshCw size={14} /> Cohort Actions
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className={adminGhostButtonClass}
            >
              {exporting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              Export Excel
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingStudent(null);
                setEditModalOpen(true);
              }}
              className={adminPrimaryButtonClass}
            >
              <UserPlus size={14} /> Add Student
            </button>
          </>
          )
        }
      />

      {/* Filters */}
      <div className={cn(adminCardClass, "p-5 space-y-4")}>
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative" ref={dropdownRef}>
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3"
              size={16}
            />
            <input
              type="text"
              placeholder="Search by Student ID or name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={cn(adminInputClass, "pl-10")}
            />
            {(loading || enriching) && (
              <Loader2
                size={14}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-text-3"
              />
            )}
            <AnimatePresence>
              {recommendations.length > 0 && query.trim().length >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="absolute z-50 left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-none overflow-hidden"
                >
                  {recommendations.map((rec) => (
                    <button
                      key={rec.username}
                      type="button"
                      onClick={() => {
                        setQuery(rec.username);
                        setRecommendations([]);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-2 text-left text-[13px]"
                    >
                      <span className="font-semibold text-text">{rec.username}</span>
                      <span className="text-text-2 truncate">{rec.name}</span>
                      <span className="ml-auto text-text-3 text-caption">{rec.branch}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowAdvancedFilters((v) => !v)}
              className={cn(
                adminGhostButtonClass,
                "h-10",
                showAdvancedFilters && "bg-surface-2 border-border-strong",
              )}
            >
              <SlidersHorizontal size={14} />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-md bg-primary text-primary-foreground text-caption font-semibold">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {activeFilterCount > 0 && (
              <button type="button" onClick={clearAllFilters} className={adminGhostButtonClass}>
                Clear all
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {[
            {
              label: "Branch",
              value: branch,
              onChange: setBranch,
              options: isHodReadOnly && hodBranch ? [hodBranch] : BRANCH_OPTIONS,
              locked: isHodReadOnly,
            },
            { label: "Year", value: year, onChange: setYear, options: YEAR_OPTIONS },
            {
              label: "Batch",
              value: batch,
              onChange: setBatch,
              options: ["ALL", ...availableBatches],
            },
            {
              label: "Gender",
              value: intelligenceFilters.gender,
              onChange: (v: string) =>
                setIntelligenceFilters((f) => ({ ...f, gender: v })),
              options: GENDER_OPTIONS,
            },
            {
              label: "Section",
              value: intelligenceFilters.section,
              onChange: (v: string) =>
                setIntelligenceFilters((f) => ({ ...f, section: v })),
              options: ["ALL", "A", "B", "C", "D"],
            },
            {
              label: "Sort by",
              value: sortBy,
              onChange: (v: string) => setSortBy(v as SortKey),
              options: [
                { v: "username", l: "Student ID" },
                { v: "name", l: "Name" },
                { v: "branch", l: "Branch" },
                { v: "year", l: "Year" },
                { v: "batch", l: "Batch" },
                { v: "cgpa", l: "CGPA" },
                { v: "total_backlogs", l: "Backlogs" },
              ],
            },
          ].map((f) => (
            <div key={f.label} className="space-y-1">
              <span className={adminLabelClass}>{f.label}</span>
              <div className="relative">
                <select
                  value={f.value}
                  onChange={(e) => f.onChange(e.target.value)}
                  disabled={"locked" in f && f.locked}
                  className={cn(
                    adminSelectClass,
                    "locked" in f && f.locked && "opacity-70 cursor-not-allowed bg-surface-2",
                  )}
                >
                  {(f.options as any[]).map((o) =>
                    typeof o === "string" ? (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ) : (
                      <option key={o.v} value={o.v}>
                        {o.l}
                      </option>
                    ),
                  )}
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none"
                />
              </div>
            </div>
          ))}
          <div className="space-y-1">
            <span className={adminLabelClass}>Order</span>
            <div className="relative">
              <select
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value as "asc" | "desc")}
                className={cn(adminSelectClass)}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
              <ChevronDown
                size={12}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none"
              />
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showAdvancedFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 border-t border-border grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {[
                  {
                    label: "Remedials",
                    value: intelligenceFilters.hasRemedials,
                    onChange: (v: string) =>
                      setIntelligenceFilters((f) => ({ ...f, hasRemedials: v })),
                    options: [
                      { v: "all", l: "All" },
                      { v: "active", l: "Active BL" },
                      { v: "cleared", l: "Cleared" },
                    ],
                  },
                  {
                    label: "On campus",
                    value: intelligenceFilters.isPresentInCampus,
                    onChange: (v: string) =>
                      setIntelligenceFilters((f) => ({ ...f, isPresentInCampus: v })),
                    options: [
                      { v: "ALL", l: "Any" },
                      { v: "true", l: "In" },
                      { v: "false", l: "Out" },
                    ],
                  },
                  {
                    label: "Account",
                    value: intelligenceFilters.isSuspended,
                    onChange: (v: string) =>
                      setIntelligenceFilters((f) => ({ ...f, isSuspended: v })),
                    options: [
                      { v: "ALL", l: "Any" },
                      { v: "false", l: "Active" },
                      { v: "true", l: "Suspended" },
                    ],
                  },
                  {
                    label: "Application",
                    value: intelligenceFilters.isApplicationPending,
                    onChange: (v: string) =>
                      setIntelligenceFilters((f) => ({ ...f, isApplicationPending: v })),
                    options: [
                      { v: "ALL", l: "Any" },
                      { v: "true", l: "Pending" },
                      { v: "false", l: "Clear" },
                    ],
                  },
                  {
                    label: "Category",
                    value: intelligenceFilters.category,
                    onChange: (v: string) =>
                      setIntelligenceFilters((f) => ({ ...f, category: v })),
                    options: CATEGORY_OPTIONS,
                  },
                  {
                    label: "Campus site",
                    value: intelligenceFilters.campus,
                    onChange: (v: string) =>
                      setIntelligenceFilters((f) => ({ ...f, campus: v })),
                    options: CAMPUS_OPTIONS,
                  },
                ].map((f) => (
                  <div key={f.label} className="space-y-1">
                    <span className={adminLabelClass}>{f.label}</span>
                    <select
                      value={f.value}
                      onChange={(e) => f.onChange(e.target.value)}
                      className={cn(adminSelectClass)}
                    >
                      {(f.options as any[]).map((o) =>
                        typeof o === "string" ? (
                          <option key={o} value={o}>
                            {formatDisplayText(o)}
                          </option>
                        ) : (
                          <option key={o.v} value={o.v}>
                            {o.l}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                ))}
                {[
                  { label: "Min CGPA", key: "minCgpa" as const, max: "10" },
                  { label: "Max CGPA", key: "maxCgpa" as const, max: "10" },
                  { label: "Min BL", key: "minBacklogs" as const, max: "20" },
                  { label: "Max BL", key: "maxBacklogs" as const, max: "20" },
                ].map((f) => (
                  <div key={f.key} className="space-y-1">
                    <span className={adminLabelClass}>{f.label}</span>
                    <input
                      type="number"
                      step={f.key.includes("Cgpa") ? "0.01" : "1"}
                      placeholder="—"
                      value={intelligenceFilters[f.key]}
                      onChange={(e) =>
                        setIntelligenceFilters((prev) => ({
                          ...prev,
                          [f.key]: e.target.value,
                        }))
                      }
                      className={adminInputClass}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sheet toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {isHodReadOnly && (
            <span className={cn(adminChipClass, "bg-tint text-link border border-border")}>
              Read-only · {hodBranch}
            </span>
          )}
          <span className={adminChipClass}>
            {pagination.total.toLocaleString()} students
          </span>
          {rows.length > 0 && (
            <span className="text-caption text-text-2 font-medium">
              Showing {rangeStart}–{rangeEnd}
              {enriching && (
                <span className="ml-2 text-text-3 inline-flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin" /> loading attendance…
                </span>
              )}
            </span>
          )}
          {!isHodReadOnly && selectedIds.size > 0 && (
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-caption font-semibold">
                {selectedIds.size} selected
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="opacity-70 hover:opacity-100"
                >
                  <X size={12} />
                </button>
              </span>
              <Button type="button" variant="destructive" size="compact" onClick={openBulkDelete}>
                <Trash2 size={16} />
                Delete selected
              </Button>
            </span>
          )}
        </div>
        <p className="text-caption text-text-3">
          {isHodReadOnly
            ? "Click row for profile · Double-click for charts"
            : "Click row for profile · Double-click for charts · Click cell to edit inline"}
        </p>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : (
        <Table
          rows={rows}
          getRowId={(row) => row.username}
          selectedId={selectedRow?.username}
          onRowClick={(row) => openDetail(row)}
          onRowDoubleClick={(row) => handleOpenPerformance(row)}
          empty={
            <EmptyState
              title="No students to display"
              body="Adjust filters or search by ID."
              icon={FileSpreadsheet}
            />
          }
          footer={
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              pageSize={PAGE_SIZE}
              onPageChange={(p) => {
                setSelectedIds(new Set());
                fetchStudents(p);
              }}
            />
          }
          columns={[
            ...(!isHodReadOnly
              ? [
                  {
                    id: "select",
                    header: (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectAll();
                        }}
                        className="text-text-2 hover:text-text"
                        aria-label={allPageSelected ? "Deselect page" : "Select page"}
                      >
                        {allPageSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                    ),
                    label: "Select",
                    cell: (row: StudentRow) => (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRowSelect(row.username);
                        }}
                        onDoubleClick={(e) => e.stopPropagation()}
                        className="text-text-2 hover:text-text"
                        aria-label={selectedIds.has(row.username) ? "Deselect student" : "Select student"}
                      >
                        {selectedIds.has(row.username) ? (
                          <CheckSquare size={16} className="text-text" />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                    ),
                  } satisfies TableColumn<StudentRow>,
                ]
              : []),
            ...COLUMNS.map((col) => ({
              id: col.key,
              header: (
                <button
                  type="button"
                  onClick={() => SORTABLE_KEYS.has(col.key) && handleSort(col.key)}
                  className="inline-flex items-center gap-1"
                >
                  {col.label}
                  {renderSortIcon(col.key)}
                </button>
              ),
              label: col.label,
              primary: col.key === "name",
              meta: col.key === "username" || col.key === "branch",
              numeric: col.key === "cgpa" || col.key === "attendance_pct" || col.key === "total_backlogs" || col.key === "row",
              cell: (row: StudentRow) => {
                if (col.key === "is_suspended") {
                  return row.is_suspended ? <Badge tone="error">Suspended</Badge> : <Badge tone="success">Active</Badge>;
                }
                if (col.key === "name") {
                  return (
                    <span className="flex items-start gap-2">
                      {!isHodReadOnly ? (
                        <span
                          role="checkbox"
                          aria-checked={selectedIds.has(row.username)}
                          className="mt-1 text-text-2 sm:hidden"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRowSelect(row.username);
                          }}
                          onDoubleClick={(e) => e.stopPropagation()}
                          aria-label={selectedIds.has(row.username) ? "Deselect student" : "Select student"}
                        >
                          {selectedIds.has(row.username) ? (
                            <CheckSquare size={16} className="text-text" />
                          ) : (
                            <Square size={16} />
                          )}
                        </span>
                      ) : null}
                      {renderNameCell(row)}
                    </span>
                  );
                }
                const index = rows.indexOf(row);
                const body = EDITABLE_KEYS.has(col.key)
                  ? renderEditableCell(row, col)
                  : cellValue(row, col.key, rangeStart + index);
                return (
                  <span
                    onClick={(e) => {
                      if (isHodReadOnly) return;
                      if (EDITABLE_KEYS.has(col.key)) startCellEdit(row, col.key, e);
                    }}
                  >
                    {body}
                  </span>
                );
              },
            })),
          ]}
        />
      )}

      {/* Detail drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-primary/30 "
              onClick={() => {
                if (resetModalOpen || editModalOpen || deleteModalOpen) return;
                closeDrawer();
              }}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320 }}
              className="fixed right-0 top-0 z-[101] h-full w-full max-w-2xl bg-surface border border-border/80 overflow-y-auto custom-sidebar-scroll"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-surface border-b border-border/70">
                <div>
                  <p className="text-caption font-semibold tracking-wide text-text-3">
                    Student profile
                  </p>
                  <p className="font-serif text-h3 font-normal text-head">
                    {drawerStudentName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className={cn(adminGhostButtonClass, "w-10 h-10 px-0")}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-4">
                {detailLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-text-3" size={28} />
                  </div>
                ) : detailData && detailData.username === selectedRow?.username ? (
                  <StudentDashboard
                    key={detailData.username}
                    data={detailData}
                    readOnly={isHodReadOnly}
                    onSuspendToggle={isHodReadOnly ? undefined : handleToggleSuspension}
                    onResetPassword={isHodReadOnly ? undefined : handleGlobalResetPassword}
                    onDeleteStudent={isHodReadOnly ? undefined : handleDeleteStudent}
                    onEditDetails={
                      isHodReadOnly
                        ? undefined
                        : (std) => {
                            setEditingStudent(std);
                            setEditModalOpen(true);
                          }
                    }
                    isActionLoading={
                      isActionLoading === detailData.username + "_suspend" ||
                      isActionLoading === detailData.username + "_reset"
                    }
                  />
                ) : null}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {performanceModalOpen && (
        <StudentPerformanceModal
          isOpen={performanceModalOpen}
          onClose={() => setPerformanceModalOpen(false)}
          studentName={selectedStudentName}
          studentId={selectedStudentId}
          data={performanceData}
        />
      )}

      <AdminDialog
        open={resetModalOpen}
        onOpenChange={setResetModalOpen}
        elevated
        title="Reset password"
        description={resetTargetUser}
        maxWidth="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setResetModalOpen(false)}
              className={adminGhostButtonClass}
            >
              Cancel
            </button>
            <button type="button" onClick={confirmResetPassword} className={adminPrimaryButtonClass}>
              Apply
            </button>
          </>
        }
      >
        <div className="space-y-2">
          <label className={adminLabelClass}>Temporary password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3" size={16} />
            <input
              type="text"
              value={resetPasswordValue}
              onChange={(e) => setResetPasswordValue(e.target.value)}
              className={cn(adminInputClass, "pl-10")}
            />
          </div>
        </div>
      </AdminDialog>

      <AdminDialog
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        elevated
        title="Permanently delete student"
        description="This cannot be undone. Profile, login, grades, attendance, and request history will be removed."
        maxWidth="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              className={adminGhostButtonClass}
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDeleteStudent}
              disabled={
                deleting ||
                deleteConfirmText.trim().toUpperCase() !== deleteTargetUser.toUpperCase()
              }
              className={adminDangerButtonClass}
            >
              {deleting ? <Loader2 className="animate-spin w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
              Delete permanently
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-[13px] text-text-2">
            Type <span className="font-semibold text-text">{deleteTargetUser}</span> to confirm.
          </p>
          <div className="space-y-2">
            <label className={adminLabelClass}>Student ID</label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={deleteTargetUser}
              className={adminInputClass}
              autoComplete="off"
            />
          </div>
        </div>
      </AdminDialog>

      <AdminDialog
        open={bulkDeleteModalOpen}
        onOpenChange={setBulkDeleteModalOpen}
        elevated
        title={`Delete ${selectedIds.size} student(s)`}
        description="Permanent removal of profiles, logins, grades, attendance, and request history for every selected student."
        maxWidth="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setBulkDeleteModalOpen(false)}
              className={adminGhostButtonClass}
              disabled={bulkDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmBulkDelete}
              disabled={
                bulkDeleting ||
                bulkDeleteConfirmText.trim().toLowerCase() !==
                `Delete ${selectedIds.size}`.toLowerCase()
              }
              className={adminDangerButtonClass}
            >
              {bulkDeleting ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete {selectedIds.size} permanently
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-[13px] text-text-2">
            You are about to delete{" "}
            <span className="font-semibold text-text">{selectedIds.size}</span>{" "}
            student record(s). Type{" "}
            <span className="font-semibold text-error">
              Delete {selectedIds.size}
            </span>{" "}
            to confirm.
          </p>
          <div className="max-h-32 overflow-y-auto rounded-xl border border-border bg-surface-2/80 p-3 text-caption font-mono text-text-2 space-y-0.5">
            {[...selectedIds].slice(0, 12).map((id) => (
              <div key={id}>{id}</div>
            ))}
            {selectedIds.size > 12 && (
              <div className="text-text-3">+ {selectedIds.size - 12} more…</div>
            )}
          </div>
          <div className="space-y-2">
            <label className={adminLabelClass}>Confirmation</label>
            <input
              type="text"
              value={bulkDeleteConfirmText}
              onChange={(e) => setBulkDeleteConfirmText(e.target.value)}
              placeholder={`Delete ${selectedIds.size}`}
              className={adminInputClass}
              autoComplete="off"
            />
          </div>
        </div>
      </AdminDialog>

      <StudentEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        student={editingStudent}
        elevated={drawerOpen}
        onSuccess={() => fetchStudents(pagination.page)}
      />
    </div>
  );
}
