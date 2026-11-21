/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
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
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
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
  adminLabelClass,
  adminInputClass,
  adminSelectClass,
} from "../../../components/admin/admin-ui";

import { useRecoilState } from "recoil";
import { subjectsAtom } from "../../../store/atoms";
import { Skeleton } from "@/components/ui/Skeleton";
import { SubjectCode } from "@/components/admin/SubjectCode";

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
    <div className="p-6 space-y-6 animate-in fade-in duration-700 pb-20 text-text">
      <PageHeader
        title="Academic subjects"
        meta={`Manage the core institutional curriculum (${meta.total} records).`}
        action={
          <Button type="button" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> New subject
          </Button>
        }
      />

      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative group flex-1 min-w-[300px]">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-3 group-focus-within:text-text transition-colors"
            size={16}
          />
          <input
            type="text"
            placeholder="Search by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-12 pr-5 bg-surface border border-border rounded-xl focus:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring transition-[color,background-color,border-color,opacity,transform,box-shadow] font-semibold text-text text-sm placeholder:text-text-3 placeholder:font-medium shadow-none"
          />
        </div>

        <div className="relative group">
          <Filter
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-3 group-focus-within:text-text pointer-events-none"
            size={14}
          />
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="bg-surface border border-border pl-11 pr-10 h-11 rounded-xl font-semibold text-caption text-text-2 focus:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring min-w-[170px] transition-[color,background-color,border-color,opacity,transform,box-shadow] cursor-pointer appearance-none shadow-none"
          >
            <option value="">All Departments</option>
            <option value="AIML">AIML</option>
            <option value="CE">CE</option>
            <option value="CSE">CSE</option>
            <option value="ECE">ECE</option>
            <option value="EEE">EEE</option>
            <option value="ME">ME</option>
            <option value="CIVIL">CIVIL</option>
            <option value="MECH">MECH</option>
          </select>
          <ChevronDown
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none"
            size={14}
          />
        </div>

        <div className="relative group">
          <Calendar
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-3 group-focus-within:text-text pointer-events-none"
            size={14}
          />
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="bg-surface border border-border pl-11 pr-10 h-11 rounded-xl font-semibold text-caption text-text-2 focus:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring min-w-[170px] transition-[color,background-color,border-color,opacity,transform,box-shadow] cursor-pointer appearance-none shadow-none"
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
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none"
            size={14}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="bg-surface border border-border rounded-xl p-5 space-y-4"
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
                className="bg-surface border border-border rounded-xl p-5 transition-[color,background-color,border-color,opacity,transform,box-shadow] group overflow-hidden relative"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-surface-2 rounded-lg text-text border border-border transition-colors duration-300">
                    <BookText size={18} />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <SubjectCode
                      code={sub.displayCode || sub.code}
                      academicCode={sub.academicCode}
                    />
                    <h3 className="text-[14px] font-semibold text-text tracking-tight leading-tight line-clamp-2">
                      {sub.name}
                    </h3>
                  </div>
                  <div className="ml-auto flex gap-1 transform translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-[color,background-color,border-color,opacity,transform,box-shadow] duration-300">
                    <button
                      onClick={() => handleEditClick(sub)}
                      className="p-1.5 text-text-3 hover:text-text hover:bg-surface-2 rounded-lg transition-[color,background-color,border-color,opacity,transform,box-shadow]"
                    >
                      <Edit3 size={12} />
                    </button>
                    <button
                      onClick={() => handleDeleteSubject(sub.id)}
                      className="p-1.5 text-text-3 hover:text-error hover:bg-tint rounded-lg transition-[color,background-color,border-color,opacity,transform,box-shadow]"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                  <div className="flex flex-col">
                    <p className="text-caption font-semibold text-text-3 leading-none mb-1">
                      Department
                    </p>
                    <p className="font-semibold text-text-2 text-caption flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-primary"></div>
                      {sub.department}
                    </p>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-caption font-semibold text-text-3 leading-none mb-1">
                      Semester
                    </p>
                    <p className="font-semibold text-text-2 text-caption flex items-center gap-1.5">
                      <Calendar size={10} className="text-text-3" />{" "}
                      {sub.semester}
                    </p>
                  </div>
                  <div className="col-span-2 pt-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-caption font-semibold text-text-3">
                        Academic Weight
                      </p>
                      <span className="text-caption font-semibold text-text px-1.5 py-0.5 bg-surface-2 rounded-md">
                        {sub.credits} CREDITS
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      {[...Array(10)].map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "flex-1 h-1 rounded-full transition-[color,background-color,border-color,opacity,transform,box-shadow] duration-500",
                            i < Number(sub.credits)
                              ? "bg-primary"
                              : "bg-surface-2",
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
                className="w-10 h-10 flex items-center justify-center bg-surface text-text-2 border border-border rounded-xl hover:bg-surface-2 hover:text-text transition-[color,background-color,border-color,opacity,transform,box-shadow] active:scale-90 disabled:opacity-40"
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
                        className={`w-10 h-10 rounded-xl font-semibold text-caption border transition-[color,background-color,border-color,opacity,transform,box-shadow] ${
                          page === p
                            ? "bg-primary text-primary-foreground border-head"
                            : "bg-surface text-text-3 border-border hover:border-border-strong hover:text-text-2"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  }
                  if (p === 2 || p === meta.totalPages - 1) {
                    return (
                      <span key={p} className="text-text-3 font-semibold px-1">
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
                className="w-10 h-10 flex items-center justify-center bg-surface text-text-2 border border-border rounded-xl hover:bg-surface-2 hover:text-text transition-[color,background-color,border-color,opacity,transform,box-shadow] active:scale-90 disabled:opacity-40"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          title="No subjects found"
          body="No subjects match these filters. Clear them to see the full list."
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSearch("");
                setDepartment("");
                setSemester("");
              }}
            >
              Clear filters
            </Button>
          }
        />
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
                <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3 w-4 h-4" />
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

            <div className="grid grid-cols-1 gap-4">
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

            <div className="grid grid-cols-1 gap-4">
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

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingSubject(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isAdding} isLoading={isAdding}>
                {editingSubject ? "Save changes" : "Add subject"}
              </Button>
            </div>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
