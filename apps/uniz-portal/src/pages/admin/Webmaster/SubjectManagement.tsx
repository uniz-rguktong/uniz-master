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
} from "lucide-react";
import {
  GET_SUBJECTS,
  ADD_SUBJECT,
  SUBJECT_BY_ID,
} from "../../../api/endpoints";
import { toast } from "react-toastify";
import { apiClient } from "../../../api/apiClient";
import { Edit3 } from "lucide-react";

export default function SubjectManagement() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Pagination & Filtering State
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("");
  const [meta, setMeta] = useState<any>({ total: 0, totalPages: 0 });

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
        setMeta(res.meta || { total: res.subjects.length, totalPages: 1 });
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
    <div className="p-6 space-y-6 animate-in fade-in duration-700 pb-20 text-slate-900">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-3xl font-semibold tracking-[-0.02em] text-slate-900 leading-none">
            Academic Subjects
          </h2>
          <p className="text-slate-500 font-medium text-[15px]">
            Manage the core institutional curriculum ({meta.total} records).
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="h-11 px-6 bg-blue-600 text-white rounded-full font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={16} /> New Subject
        </button>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative group flex-1 min-w-[300px]">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
            size={16}
          />
          <input
            type="text"
            placeholder="Search by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-12 pr-5 bg-white border border-slate-200 rounded-full focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-semibold text-slate-900 shadow-sm text-sm placeholder:text-slate-400 placeholder:font-medium"
          />
        </div>

        <div className="relative group">
          <Filter
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 pointer-events-none"
            size={14}
          />
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="bg-white border border-slate-200 pl-11 pr-10 h-11 rounded-full font-bold text-[10px] uppercase tracking-widest text-slate-600 outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 shadow-sm min-w-[170px] transition-all cursor-pointer appearance-none hover:shadow-md"
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
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            size={14}
          />
        </div>

        <div className="relative group">
          <Calendar
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 pointer-events-none"
            size={14}
          />
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="bg-white border border-slate-200 pl-11 pr-10 h-11 rounded-full font-bold text-[10px] uppercase tracking-widest text-slate-600 outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 shadow-sm min-w-[170px] transition-all cursor-pointer appearance-none hover:shadow-md"
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
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            size={14}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      ) : subjects.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {subjects.map((sub, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-100 rounded-[28px] p-7 shadow-sm hover:shadow-xl hover:translate-y-[-2px] hover:border-blue-100 transition-all group overflow-hidden relative"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-50 rounded-[18px] text-blue-600 border border-blue-50 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                    <BookText size={20} />
                  </div>
                  <div className="px-3 py-1.5 bg-slate-50 rounded-full text-[9px] font-semibold uppercase tracking-widest text-slate-400 border border-slate-100">
                    {sub.code}
                  </div>
                  <div className="ml-auto flex gap-1 transform translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    <button
                      onClick={() => handleEditClick(sub)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteSubject(sub.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 tracking-tight mb-2 leading-tight">
                  {sub.name}
                </h3>

                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none">
                      Dept
                    </p>
                    <p className="font-semibold text-slate-700 text-xs flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600/20 group-hover:bg-blue-600 transition-colors"></div>
                      {sub.department}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none">
                      Term
                    </p>
                    <p className="font-semibold text-slate-700 text-xs flex items-center gap-2">
                      <Calendar size={13} className="text-slate-400" />{" "}
                      {sub.semester}
                    </p>
                  </div>
                  <div className="col-span-2 mt-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                        Credits
                      </p>
                      <span className="text-xs font-semibold text-blue-600">
                        {sub.credits} Units
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {[...Array(Number(sub.credits))].map((_, i) => (
                        <div
                          key={i}
                          className="flex-1 h-1 rounded-full bg-slate-100 group-hover:bg-blue-600/10 transition-colors overflow-hidden"
                        >
                          <div className="w-full h-full bg-blue-600 translate-x-0 group-hover:translate-x-0 transition-transform duration-500"></div>
                        </div>
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
                className="uniz-primary-btn w-12 h-12 p-0 bg-white text-slate-900 border border-slate-200 shadow-sm"
              >
                <Plus size={20} className="rotate-[135deg]" />
              </button>

              <div className="flex items-center gap-2">
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
                        className={`w-10 h-10 rounded-xl font-semibold text-xs border transition-all ${page === p
                            ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100"
                            : "bg-white text-slate-400 border-slate-100 hover:border-blue-200 hover:text-blue-600"
                          }`}
                      >
                        {p}
                      </button>
                    );
                  }
                  if (p === 2 || p === meta.totalPages - 1) {
                    return (
                      <span key={p} className="text-slate-300 font-bold">
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
                className="uniz-primary-btn w-12 h-12 p-0 bg-white text-slate-900 border border-slate-200 shadow-sm"
              >
                <Plus size={20} className="rotate-45" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="p-32 flex flex-col items-center justify-center text-center space-y-7 bg-white rounded-[28px] border border-slate-100 shadow-sm">
          <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-[24px] flex items-center justify-center text-slate-300 shadow-inner">
            <BookOpen size={48} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-900 tracking-tight">
              No Subjects Found
            </p>
            <p className="text-slate-400 font-medium mt-2 max-w-sm text-[15px]">
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
            className="text-blue-600 font-semibold text-sm uppercase tracking-widest hover:underline active:scale-95"
          >
            Clear all filters
          </button>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl relative animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-full transition-colors"
            >
              <Trash2 size={20} className="text-slate-400" />
            </button>
            <h3 className="text-2xl font-semibold tracking-[-0.02em] text-slate-900 mb-6">
              {editingSubject ? "Edit Subject" : "Create New Subject"}
            </h3>

            <form onSubmit={handleSaveSubject} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-400 ml-1">
                  Subject Name
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                  <input
                    required
                    value={newSubject.name}
                    onChange={(e) =>
                      setNewSubject({ ...newSubject, name: e.target.value })
                    }
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-semibold text-sm"
                    placeholder="e.g. Artificial Intelligence"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 ml-1">
                    Code
                  </label>
                  <input
                    required
                    value={newSubject.code}
                    onChange={(e) =>
                      setNewSubject({
                        ...newSubject,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-semibold text-slate-900"
                    placeholder="CSE402"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 ml-1">
                    Credits
                  </label>
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
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 ml-1">
                    Department
                  </label>
                  <select
                    value={newSubject.department}
                    onChange={(e) =>
                      setNewSubject({
                        ...newSubject,
                        department: e.target.value,
                      })
                    }
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-semibold text-slate-900 cursor-pointer"
                  >
                    <option>CSE</option>
                    <option>ECE</option>
                    <option>EEE</option>
                    <option>MECH</option>
                    <option>CIVIL</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 ml-1">
                    Semester
                  </label>
                  <select
                    value={newSubject.semester}
                    onChange={(e) =>
                      setNewSubject({ ...newSubject, semester: e.target.value })
                    }
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-semibold text-slate-900 cursor-pointer"
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

              <div className="pt-8 flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-8 py-4 rounded-2xl font-semibold uppercase tracking-widest text-[11px] border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  disabled={isAdding}
                  type="submit"
                  className={`flex-1 uniz-primary-btn ${editingSubject ? "bg-slate-900 hover:bg-black shadow-slate-200" : ""}`}
                >
                  {isAdding ? (
                    <Loader2 className="animate-spin w-5 h-5" />
                  ) : editingSubject ? (
                    <Edit3 size={18} />
                  ) : (
                    <Plus size={18} />
                  )}
                  {editingSubject ? "Update Subject" : "Create Subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
