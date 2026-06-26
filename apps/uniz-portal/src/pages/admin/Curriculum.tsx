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
  X,
  CreditCard,
  Hash,
  Loader2,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { toast } from "../../utils/toast-ref";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeader } from "../../components/admin/SectionHeader";
import {
  adminPageWrapClass,
  adminCardClass,
  adminCardHoverClass,
  adminLabelClass,
  adminInputClass,
  adminSelectClass,
  adminPrimaryButtonClass,
  adminModalShellClass,
  adminModalTitleClass,
  adminModalDescClass,
} from "../../components/admin/admin-ui";
import { cn } from "../../utils/cn";

interface Subject {
  id: string;
  code: string;
  name: string;
  department: string;
  semester: string;
  credits: number;
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

  const departments = ["CSE", "ECE", "EEE", "CIVIL", "MECH"];
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
      if (data.success) {
        toast.success("Subject deleted");
        fetchSubjects();
      }
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className={cn(adminPageWrapClass, "animate-in fade-in duration-700")}>
      {/* Header Area */}
      <SectionHeader
        icon={<BookOpen size={18} />}
        eyebrow="Academic"
        title="Academic Subjects"
        subtitle={`Manage the core institutional curriculum (${totalRecords} records)`}
        actions={
          <button
            onClick={() => handleOpenModal()}
            className={adminPrimaryButtonClass}
          >
            <Plus size={16} /> New Subject
          </button>
        }
      />

      {/* Filters Area */}
      <div className={cn(adminCardClass, "p-3 flex flex-col lg:flex-row gap-3")}>
        <div className="relative flex-1">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
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
              className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-zinc-400"
            />
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Filter
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none z-10"
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
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none z-10"
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
          <Loader2 className="animate-spin text-zinc-900" size={32} />
          <p className="text-zinc-400 font-medium text-[12px] uppercase tracking-[0.14em]">
            Loading curriculum…
          </p>
        </div>
      ) : subjects.length === 0 ? (
        <div className={cn(adminCardClass, "text-center py-20 border-dashed border-zinc-300")}>
          <GraduationCap size={48} strokeWidth={1.5} className="mx-auto text-zinc-200 mb-4" />
          <h3 className="text-[16px] font-semibold tracking-tight text-zinc-900">
            No subjects found
          </h3>
          <p className="text-zinc-500 text-[13px] mt-1">
            Try adjusting your filters or search query.
          </p>
        </div>
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
                <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-600 ring-1 ring-inset ring-zinc-900/5 group-hover:bg-zinc-900 group-hover:text-white transition-colors duration-300">
                  <GraduationCap size={20} />
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleOpenModal(sub)}
                    className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-all"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(sub.id)}
                    className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="space-y-1 mb-5">
                <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.12em]">
                  {sub.code}
                </p>
                <h3 className="text-[16px] font-semibold text-zinc-900 line-clamp-1 leading-tight">
                  {sub.name}
                </h3>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-2.5 py-1 bg-zinc-900 text-white text-[10px] font-medium rounded-full uppercase tracking-wide">
                  {sub.department}
                </span>
                <span className="px-2.5 py-1 bg-zinc-50 text-zinc-600 text-[10px] font-medium rounded-full uppercase tracking-wide border border-zinc-200">
                  {semesterLabel(sub)}
                </span>
              </div>

              {/* Progress Bar (Weight) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-400">
                  <span>Academic Weight</span>
                  <span className="tabular-nums">{((sub.credits / 4) * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(sub.credits / 4) * 100}%` }}
                    className="h-full bg-zinc-900 rounded-full"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <BookOpen size={14} />
                  <span className="text-[10px] font-medium uppercase tracking-[0.12em] tabular-nums">
                    {sub.credits} Credits
                  </span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && totalRecords > 0 && (
        <div className={cn(adminCardClass, "flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4")}>
          <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-[0.12em]">
            Showing <span className="text-zinc-900">{subjects.length}</span> of{" "}
            {totalRecords} records
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-9 h-9 flex items-center justify-center bg-white border border-zinc-200 rounded-lg text-zinc-500 hover:text-zinc-900 hover:border-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="px-3 text-[12px] font-semibold text-zinc-900 tabular-nums">
              Page {page} of {totalPages}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-9 h-9 flex items-center justify-center bg-white border border-zinc-200 rounded-lg text-zinc-500 hover:text-zinc-900 hover:border-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Modal System */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={cn("relative w-full max-w-lg overflow-hidden", adminModalShellClass)}
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-7">
                  <div className="space-y-1.5">
                    <h2 className={adminModalTitleClass}>
                      {editingSubject ? "Edit subject" : "Create subject"}
                    </h2>
                    <p className={adminModalDescClass}>
                      Define metadata for the curriculum entry.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="w-9 h-9 flex items-center justify-center bg-zinc-50 rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className={adminLabelClass}>Subject Code</label>
                      <div className="relative">
                        <Hash
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300 z-10"
                          size={16}
                        />
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
                          className={cn(adminInputClass, "pl-10")}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className={adminLabelClass}>Credits</label>
                      <div className="relative">
                        <CreditCard
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300 z-10"
                          size={16}
                        />
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
                          className={cn(adminInputClass, "pl-10")}
                        />
                      </div>
                    </div>
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

                  <div className="grid grid-cols-2 gap-4">
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
                        {departments.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
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
                  </div>

                  <button
                    type="submit"
                    className={cn(adminPrimaryButtonClass, "h-12 w-full")}
                  >
                    {editingSubject ? "Update Subject" : "Create Subject"}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
