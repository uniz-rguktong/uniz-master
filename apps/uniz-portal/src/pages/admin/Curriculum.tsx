/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from "react";
import { BASE_URL } from "../../api/endpoints";
import {
  Search,
  BookOpen,
  Plus,
  Filter,
  GraduationCap,
  Trash2,
  Edit,
  Loader2,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { toast } from "../../utils/toast-ref";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { AdminDialog } from "@/components/admin/AdminDialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  adminPageWrapClass,
  adminCardClass,
  adminCardHoverClass,
  adminLabelClass,
  adminInputClass,
  adminSelectClass,
} from "../../components/admin/admin-ui";
import { SubjectCode } from "../../components/admin/SubjectCode";
import { cn } from "../../utils/cn";

interface Subject {
  id: string;
  code: string;
  name: string;
  department: string;
  semester: string;
  credits: number;
  academicCode?: string | null;
  displayCode?: string | null;
}

const SEARCH_DEBOUNCE_MS = 400;

function semesterLabel(sub: Subject) {
  const fromCode = sub.code.match(/E[1-4]-SEM-[12]/i);
  return fromCode ? fromCode[0].toUpperCase() : sub.semester;
}

export default function CurriculumManager() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [semFilter, setSemFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    department: "CSE",
    semester: "E1-SEM-1",
    credits: 3,
  });

  const fetchGenRef = useRef(0);
  const hasLoadedRef = useRef(false);

  // Match live catalog departments (CE/ME aliases still work in the API).
  const departments = ["AIML", "CE", "CSE", "ECE", "EEE", "ME"];
  const semesters = [
    "E1-SEM-1",
    "E1-SEM-2",
    "E2-SEM-1",
    "E2-SEM-2",
    "E3-SEM-1",
    "E3-SEM-2",
    "E4-SEM-1",
    "E4-SEM-2",
  ];

  const fetchSubjects = useCallback(async () => {
    const gen = ++fetchGenRef.current;
    if (!hasLoadedRef.current) setLoading(true);
    else setRefreshing(true);

    try {
      const token = localStorage.getItem("admin_token")?.replace(/"/g, "");

      const params = new URLSearchParams({
        limit: "12",
        page: page.toString(),
        search: debouncedSearch.trim(),
      });
      if (deptFilter !== "ALL") params.append("department", deptFilter);
      if (semFilter !== "ALL") params.append("semester", semFilter);

      const res = await fetch(
        `${BASE_URL}/academics/subjects?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (gen !== fetchGenRef.current) return;
      const data = await res.json();
      if (data.success) {
        setSubjects(data.subjects || []);
        setTotalPages(data.meta?.totalPages || 1);
        setTotalRecords(data.meta?.total || 0);
      }
    } catch (err) {
      if (gen === fetchGenRef.current) {
        console.error(err);
        toast.error("Failed to fetch subjects");
      }
    } finally {
      if (gen === fetchGenRef.current) {
        hasLoadedRef.current = true;
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [page, deptFilter, semFilter, debouncedSearch]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch((prev) => {
        const next = searchInput;
        if (next !== prev) setPage(1);
        return next;
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const t = setTimeout(() => fetchSubjects(), 150);
    return () => clearTimeout(t);
  }, [page, deptFilter, semFilter, debouncedSearch, fetchSubjects]);

  const handleOpenModal = (sub?: Subject) => {
    if (sub) {
      setEditingSubject(sub);
      setFormData({
        code: sub.code,
        name: sub.name,
        department: sub.department,
        semester: sub.semester,
        credits: sub.credits,
      });
    } else {
      setEditingSubject(null);
      setFormData({
        code: "",
        name: "",
        department: "CSE",
        semester: "E1-SEM-1",
        credits: 3,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("admin_token")?.replace(/"/g, "");
    const method = editingSubject ? "PUT" : "POST";
    const url = editingSubject
      ? `${BASE_URL}/academics/subjects/${editingSubject.id}`
      : `${BASE_URL}/academics/subjects/add`;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingSubject ? "Subject updated" : "Subject created");
        setIsModalOpen(false);
        fetchSubjects();
      } else {
        toast.error(data.message || "Operation failed");
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this subject?"))
      return;
    const token = localStorage.getItem("admin_token")?.replace(/"/g, "");
    try {
      const res = await fetch(`${BASE_URL}/academics/subjects/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Subject deleted");
        fetchSubjects();
      } else {
        toast.error(data.message || "Failed to delete subject");
      }
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className={cn(adminPageWrapClass, "animate-in fade-in duration-700")}>
      {/* Header Area */}
      <PageHeader
        title="Academic subjects"
        meta={`Manage the core institutional curriculum (${totalRecords} records)`}
        action={
          <Button type="button" onClick={() => handleOpenModal()}>
            <Plus size={16} /> New subject
          </Button>
        }
      />

      {/* Filters Area */}
      <div className={cn(adminCardClass, "flex flex-col gap-3 p-3 sm:flex-row")}>
        <div className="relative flex-1">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3"
            size={16}
          />
          <input
            type="text"
            placeholder="Search by name or code…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={cn(adminInputClass, "pl-10")}
          />
          {refreshing && (
            <Loader2
              size={14}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-text-3"
            />
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Filter
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none z-10"
              size={14}
            />
            <select
              className={cn(adminSelectClass, "pl-9 w-[180px]")}
              value={deptFilter}
              onChange={(e) => {
                setDeptFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <BookOpen
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none z-10"
              size={14}
            />
            <select
              className={cn(adminSelectClass, "pl-9 w-[180px]")}
              value={semFilter}
              onChange={(e) => {
                setSemFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All Semesters</option>
              {semesters.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-text" size={32} />
          <p className="text-text-3 font-medium text-[12px]">
            Loading curriculum…
          </p>
        </div>
      ) : subjects.length === 0 ? (
        <EmptyState
          title="No subjects found"
          body="Try adjusting your filters or search query."
        />
      ) : (
        <div
          className={cn(
            "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5 transition-opacity duration-200",
            refreshing && "opacity-60 pointer-events-none",
          )}
        >
          {subjects.map((sub) => (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              key={sub.id}
              className={cn(adminCardClass, adminCardHoverClass, "group p-5 relative overflow-hidden")}
            >
              {/* Card Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-surface-2 rounded-xl flex items-center justify-center text-text-2 ring-1 ring-inset ring-ring/5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                  <GraduationCap size={20} />
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleOpenModal(sub)}
                    className="p-2 text-text-3 hover:text-text hover:bg-surface-2 rounded-lg transition-[color,background-color,border-color,opacity,transform,box-shadow]"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(sub.id)}
                    className="p-2 text-text-3 hover:text-error hover:bg-tint rounded-lg transition-[color,background-color,border-color,opacity,transform,box-shadow]"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="mb-5 space-y-2">
                <SubjectCode
                  code={sub.displayCode || sub.code}
                  academicCode={sub.academicCode}
                />
                <h3 className="text-[16px] font-semibold text-text line-clamp-2 leading-tight">
                  {sub.name}
                </h3>
              </div>

              {/* Tags */}
              <div className="mb-6 flex flex-wrap gap-2">
                <Badge tone="neutral">{sub.department}</Badge>
                <Badge tone="neutral">{semesterLabel(sub)}</Badge>
              </div>

              {/* Progress Bar (Weight) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-caption font-medium text-text-3">
                  <span>Academic Weight</span>
                  <span className="tabular-nums">{((sub.credits / 4) * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(sub.credits / 4) * 100}%` }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-text-3">
                  <BookOpen size={14} />
                  <span className="text-caption font-medium tabular-nums">
                    {sub.credits} Credits
                  </span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && totalRecords > 0 && (
        <div className={cn(adminCardClass, "flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4")}>
          <div className="text-caption font-medium text-text-3">
            Showing <span className="text-text">{subjects.length}</span> of{" "}
            {totalRecords} records
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-9 h-9 flex items-center justify-center bg-surface border border-border rounded-lg text-text-2 hover:text-text hover:border-border-strong disabled:opacity-30 disabled:cursor-not-allowed transition-[color,background-color,border-color,opacity,transform,box-shadow]"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="px-3 text-[12px] font-semibold text-text tabular-nums">
              Page {page} of {totalPages}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-9 h-9 flex items-center justify-center bg-surface border border-border rounded-lg text-text-2 hover:text-text hover:border-border-strong disabled:opacity-30 disabled:cursor-not-allowed transition-[color,background-color,border-color,opacity,transform,box-shadow]"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Modal System */}
      <AdminDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        maxWidth="max-w-[640px]"
        title={editingSubject ? "Edit subject" : "Create subject"}
        description="Define metadata for the curriculum entry."
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="curriculum-subject-form">
              {editingSubject ? "Update subject" : "Create subject"}
            </Button>
          </>
        }
      >
                <form id="curriculum-subject-form" onSubmit={handleSubmit} className="mx-auto max-w-[640px] space-y-4">
                    <div>
                      <label className={adminLabelClass}>Subject Code</label>
                        <input
                          required
                          value={formData.code}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              code: e.target.value.toUpperCase(),
                            })
                          }
                          placeholder="e.g. CSE-302"
                          className={adminInputClass}
                        />
                    </div>
                    <div>
                      <label className={adminLabelClass}>Credits</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="4"
                          required
                          value={formData.credits}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              credits: Number(e.target.value),
                            })
                          }
                          className={adminInputClass}
                        />
                    </div>

                  <div className="space-y-2">
                    <label className={adminLabelClass}>Display Name</label>
                    <input
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g. Advanced Operating Systems"
                      className={adminInputClass}
                    />
                  </div>

                    <div>
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
                        {departments.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                        <option value="CIVIL">CIVIL</option>
                        <option value="MECH">MECH</option>
                      </select>
                    </div>
                    <div>
                      <label className={adminLabelClass}>Level (Semester)</label>
                      <select
                        value={formData.semester}
                        onChange={(e) =>
                          setFormData({ ...formData, semester: e.target.value })
                        }
                        className={adminSelectClass}
                      >
                        {semesters.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                </form>
      </AdminDialog>
    </div>
  );
}
