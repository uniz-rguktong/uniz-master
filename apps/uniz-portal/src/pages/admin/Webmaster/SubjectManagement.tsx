/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Loader2,
  BookText,
  Calendar,
  Trash2,
  Search,
  ChevronDown,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  GET_SUBJECTS,
  ADD_SUBJECT,
  SUBJECT_BY_ID,
} from "../../../api/endpoints";
import { toast } from "@/utils/toast-ref";
import { apiClient } from "../../../api/apiClient";
import { Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import {
  adminModalShellClass,
  adminModalTitleClass,
  adminModalDescClass,
  adminModalCloseClass,
  adminLabelClass,
  adminInputClass,
  adminSelectClass,
  adminPrimaryButtonClass,
  adminGhostButtonClass,
} from "../../../components/admin/admin-ui";

import { useRecoilState } from "recoil";
import { subjectsAtom } from "../../../store/atoms";
import { Skeleton } from "@/components/ui/Skeleton";

export default function SubjectManagement() {
  const [subjectsState, setSubjectsState] = useRecoilState(subjectsAtom);
  const [subjects, setSubjects] = useState<any[]>(subjectsState.data);
  const [loading, setLoading] = useState(!subjectsState.fetched);
  const [showAddModal, setShowAddModal] = useState(false);

  // Pagination & Filtering State
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("");
  const [meta, setMeta] = useState<any>(
    subjectsState.meta || { total: 0, totalPages: 0 },
  );

  const [isAdding, setIsAdding] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [newSubject, setNewSubject] = useState({
    name: "",
    code: "",
    credits: 4,
    department: "CSE",
    semester: "E1-SEM-1",
  });

  const fetchSubjects = async () => {
    if (!subjectsState.fetched || search || department || semester)
      setLoading(true);
    try {
      const res = await apiClient<any>(GET_SUBJECTS, {
        params: {
          page,
          limit,
          search,
          department,
          semester,
        },
      });
      if (res && res.success) {
        setSubjects(res.subjects);
        const newMeta = res.meta || {
          total: res.subjects.length,
          totalPages: Math.ceil(res.subjects.length / limit),
        };
        setMeta(newMeta);

        // Only cache the first page with no filters for global state
        if (page === 1 && !search && !department && !semester) {
          setSubjectsState({
            fetched: true,
            data: res.subjects,
            meta: newMeta,
          });
        }
      }
    } catch (error) {
      toast.error("Failed to fetch subjects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [page, department, semester]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) setPage(1);
      else fetchSubjects();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      if (editingSubject) {
        // Update
        const res = await apiClient<any>(SUBJECT_BY_ID(editingSubject.id), {
          method: "PUT",
          body: JSON.stringify(newSubject),
        });
        if (res && res.success) {
          toast.success("Subject updated successfully");
          setShowAddModal(false);
          setEditingSubject(null);
          fetchSubjects();
        }
      } else {
        // Create
        const res = await apiClient<any>(ADD_SUBJECT, {
          method: "POST",
          body: JSON.stringify(newSubject),
        });
        if (res && res.success) {
          toast.success("Subject added successfully");
          setShowAddModal(false);
          fetchSubjects();
          setNewSubject({
            name: "",
            code: "",
            credits: 4,
            department: "CSE",
            semester: "E1-SEM-1",
          });
        }
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditClick = (sub: any) => {
    setEditingSubject(sub);
    setNewSubject({
      name: sub.name,
      code: sub.code,
      credits: sub.credits,
      department: sub.department,
      semester: sub.semester,
    });
    setShowAddModal(true);
  };

  const handleDeleteSubject = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this subject?"))
      return;

    try {
      const res = await apiClient<any>(SUBJECT_BY_ID(id), {
        method: "DELETE",
      });
      if (res && res.success) {
        toast.success("Subject deleted successfully");
        fetchSubjects();
      }
    } catch (error) {
      toast.error("Failed to delete subject");
    }
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-700 pb-20 text-zinc-900">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-3xl font-semibold tracking-[-0.02em] text-zinc-900 leading-none">
            Academic Subjects
          </h2>
          <p className="text-zinc-500 font-medium text-[15px]">
            Manage the core institutional curriculum ({meta.total} records).
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="h-11 px-6 bg-zinc-900 text-white rounded-xl font-bold tracking-[0.14em] text-[10px] hover:bg-zinc-800 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={16} /> New Subject
        </button>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative group flex-1 min-w-[300px]">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 transition-colors"
            size={16}
          />
          <input
            type="text"
            placeholder="Search by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-12 pr-5 bg-white border border-zinc-200 rounded-xl focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-100 outline-none transition-all font-semibold text-zinc-900 text-sm placeholder:text-zinc-400 placeholder:font-medium shadow-none"
          />
        </div>

        <div className="relative group">
          <Filter
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 pointer-events-none"
            size={14}
          />
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="bg-white border border-zinc-200 pl-11 pr-10 h-11 rounded-xl font-bold text-[10px] tracking-[0.14em] text-zinc-600 outline-none focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-100 min-w-[170px] transition-all cursor-pointer appearance-none shadow-none"
          >
            <option value="">All Departments</option>
            <option value="CSE">CSE</option>
            <option value="ECE">ECE</option>
            <option value="EEE">EEE</option>
            <option value="MECH">MECH</option>
            <option value="CIVIL">CIVIL</option>
            <option value="CHEM">CHEMICAL</option>
            <option value="MME">MME</option>
          </select>
          <ChevronDown
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
            size={14}
          />
        </div>

        <div className="relative group">
          <Calendar
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 pointer-events-none"
            size={14}
          />
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="bg-white border border-zinc-200 pl-11 pr-10 h-11 rounded-xl font-bold text-[10px] tracking-[0.14em] text-zinc-600 outline-none focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-100 min-w-[170px] transition-all cursor-pointer appearance-none shadow-none"
          >
            <option value="">All Semesters</option>
            {["E1", "E2", "E3", "E4"].map((y) => (
              <React.Fragment key={y}>
                <option value={`${y}-SEM-1`}>{y} SEM-1</option>
                <option value={`${y}-SEM-2`}>{y} SEM-2</option>
              </React.Fragment>
            ))}
          </select>
          <ChevronDown
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
            size={14}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="bg-white border border-zinc-100 rounded-xl p-5 space-y-4"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="w-16 h-3 rounded" />
                  <Skeleton className="w-32 h-4 rounded" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3">
                <div className="space-y-2">
                  <Skeleton className="w-12 h-2 rounded" />
                  <Skeleton className="w-20 h-3 rounded" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="w-12 h-2 rounded" />
                  <Skeleton className="w-20 h-3 rounded" />
                </div>
              </div>
              <div className="pt-2 space-y-2">
                <Skeleton className="w-24 h-2 rounded" />
                <Skeleton className="w-full h-1 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : subjects.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {subjects.map((sub, idx) => (
              <div
                key={idx}
                className="bg-white border border-zinc-100 rounded-xl p-5 transition-all group overflow-hidden relative"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-zinc-50 rounded-lg text-zinc-900 border border-zinc-100 transition-colors duration-300">
                    <BookText size={18} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-semibold tracking-[0.14em] text-zinc-400">
                        {sub.code}
                      </span>
                    </div>
                    <h3 className="text-[14px] font-bold text-zinc-900 tracking-tight leading-tight truncate">
                      {sub.name}
                    </h3>
                  </div>
                  <div className="ml-auto flex gap-1 transform translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    <button
                      onClick={() => handleEditClick(sub)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-all"
                    >
                      <Edit3 size={12} />
                    </button>
                    <button
                      onClick={() => handleDeleteSubject(sub.id)}
                      className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-50">
                  <div className="flex flex-col">
                    <p className="text-[8px] font-semibold text-zinc-300 tracking-[0.14em] leading-none mb-1">
                      Department
                    </p>
                    <p className="font-bold text-zinc-600 text-[10px] flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-zinc-900"></div>
                      {sub.department}
                    </p>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-[8px] font-semibold text-zinc-300 tracking-[0.14em] leading-none mb-1">
                      Semester
                    </p>
                    <p className="font-bold text-zinc-600 text-[10px] flex items-center gap-1.5">
                      <Calendar size={10} className="text-zinc-400" />{" "}
                      {sub.semester}
                    </p>
                  </div>
                  <div className="col-span-2 pt-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[8px] font-semibold text-zinc-300 tracking-[0.14em]">
                        Academic Weight
                      </p>
                      <span className="text-[9px] font-semibold text-zinc-900 px-1.5 py-0.5 bg-zinc-50 rounded-md">
                        {sub.credits} CREDITS
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      {[...Array(10)].map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "flex-1 h-1 rounded-full transition-all duration-500",
                            i < Number(sub.credits)
                              ? "bg-zinc-900"
                              : "bg-zinc-100",
                          )}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {meta.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 pt-8">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="w-10 h-10 flex items-center justify-center bg-white text-zinc-500 border border-zinc-200 rounded-xl hover:bg-zinc-50 hover:text-zinc-900 transition-all active:scale-90 disabled:opacity-40"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="flex items-center gap-1.5">
                {[...Array(meta.totalPages)].map((_, i) => {
                  const p = i + 1;
                  if (
                    p === 1 ||
                    p === meta.totalPages ||
                    (p >= page - 1 && p <= page + 1)
                  ) {
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-10 h-10 rounded-xl font-bold text-[11px] border transition-all ${
                          page === p
                            ? "bg-zinc-900 text-white border-zinc-900"
                            : "bg-white text-zinc-400 border-zinc-100 hover:border-zinc-300 hover:text-zinc-600"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  }
                  if (p === 2 || p === meta.totalPages - 1) {
                    return (
                      <span key={p} className="text-zinc-300 font-semibold px-1">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <button
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                className="w-10 h-10 flex items-center justify-center bg-white text-zinc-500 border border-zinc-200 rounded-xl hover:bg-zinc-50 hover:text-zinc-900 transition-all active:scale-90 disabled:opacity-40"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="p-32 flex flex-col items-center justify-center text-center space-y-7 bg-white rounded-xl border border-zinc-100 shadow-none">
          <div className="w-24 h-24 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-center text-zinc-300 shadow-none">
            <BookOpen size={48} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-2xl font-semibold text-zinc-900 tracking-tight">
              No Subjects Found
            </p>
            <p className="text-zinc-400 font-medium mt-2 max-w-sm text-[15px]">
              No subjects found matching your criteria. Try adjusting your
              filters or search term.
            </p>
          </div>
          <button
            onClick={() => {
              setSearch("");
              setDepartment("");
              setSemester("");
            }}
            className="text-zinc-900 font-semibold text-sm tracking-[0.14em] hover:underline active:scale-95"
          >
            Clear all filters
          </button>
        </div>
      )}

      <AlertDialog open={showAddModal} onOpenChange={setShowAddModal}>
        <AlertDialogContent className={cn("max-w-xl", adminModalShellClass)}>
          <AlertDialogHeader className="p-8 pb-3 flex flex-col items-start text-left gap-1.5">
            <AlertDialogTitle className={adminModalTitleClass}>
              {editingSubject ? "Edit subject" : "Add subject"}
            </AlertDialogTitle>
            <AlertDialogDescription className={adminModalDescClass}>
              {editingSubject
                ? "Update course parameters in the catalog."
                : "Add a new course to the institutional registry."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <form onSubmit={handleSaveSubject} className="px-8 pb-8 space-y-5">
            <div className="space-y-2">
              <label className={adminLabelClass}>Subject name</label>
              <div className="relative">
                <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                <input
                  required
                  value={newSubject.name}
                  onChange={(e) =>
                    setNewSubject({ ...newSubject, name: e.target.value })
                  }
                  className={cn(adminInputClass, "pl-10")}
                  placeholder="e.g. Artificial Intelligence"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={adminLabelClass}>Code</label>
                <input
                  required
                  value={newSubject.code}
                  onChange={(e) =>
                    setNewSubject({
                      ...newSubject,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  className={cn(adminInputClass, "")}
                  placeholder="CSE402"
                />
              </div>
              <div className="space-y-2">
                <label className={adminLabelClass}>Credits</label>
                <input
                  required
                  type="number"
                  min="1"
                  max="10"
                  value={newSubject.credits}
                  onChange={(e) =>
                    setNewSubject({
                      ...newSubject,
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
                  value={newSubject.department}
                  onChange={(e) =>
                    setNewSubject({
                      ...newSubject,
                      department: e.target.value,
                    })
                  }
                  className={adminSelectClass}
                >
                  <option>CSE</option>
                  <option>ECE</option>
                  <option>EEE</option>
                  <option>MECH</option>
                  <option>CIVIL</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className={adminLabelClass}>Semester</label>
                <select
                  value={newSubject.semester}
                  onChange={(e) =>
                    setNewSubject({ ...newSubject, semester: e.target.value })
                  }
                  className={adminSelectClass}
                >
                  {["E1", "E2", "E3", "E4"].map((y) => (
                    <React.Fragment key={y}>
                      <option value={`${y}-SEM-1`}>{y} SEM-1</option>
                      <option value={`${y}-SEM-2`}>{y} SEM-2</option>
                    </React.Fragment>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingSubject(null);
                }}
                className={cn(adminGhostButtonClass, "flex-1")}
              >
                Cancel
              </button>
              <button
                disabled={isAdding}
                type="submit"
                className={cn(adminPrimaryButtonClass, "flex-[2]")}
              >
                {isAdding ? (
                  <Loader2 className="animate-spin w-4 h-4" />
                ) : editingSubject ? (
                  <Edit3 size={16} />
                ) : (
                  <Plus size={16} />
                )}
                {editingSubject ? "Save changes" : "Add subject"}
              </button>
            </div>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
