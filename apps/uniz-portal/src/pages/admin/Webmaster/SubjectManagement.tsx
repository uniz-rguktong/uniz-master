/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Loader2,
  BookText,
  Building2,
  Calendar,
  Trash2,
  Edit2,
  Search,
  X,
} from "lucide-react";
import {
  GET_SUBJECTS,
  ADD_SUBJECT,
  SUBJECT_BY_ID,
} from "../../../api/endpoints";
import { toast } from "react-toastify";
import { apiClient } from "../../../api/apiClient";

export default function SubjectManagement() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Pagination & Filtering State
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("");
  const [meta, setMeta] = useState<any>({ total: 0, totalPages: 0 });

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    code: "",
    credits: 4,
    department: "CSE",
    semester: "E1-SEM-1",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: search || "",
        department: department || "",
        semester: semester || "",
      });

      const data = await apiClient<any>(`${GET_SUBJECTS}?${query.toString()}`);
      if (data.success) {
        setSubjects(data.subjects);
        setMeta(data.meta || { total: data.subjects.length, totalPages: 1 });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editMode) {
        await apiClient(SUBJECT_BY_ID(formData.id), {
          method: "PUT",
          body: JSON.stringify(formData),
        });
        toast.success("Subject updated successfully");
      } else {
        await apiClient(ADD_SUBJECT, {
          method: "POST",
          body: JSON.stringify(formData),
        });
        toast.success("Subject created successfully");
      }
      setShowModal(false);
      fetchSubjects();
    } catch (error: any) {
      toast.error(error.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "Delete this subject? This might affect existing registrations.",
      )
    )
      return;
    try {
      await apiClient(SUBJECT_BY_ID(id), { method: "DELETE" });
      toast.success("Subject deleted");
      fetchSubjects();
    } catch (error: any) {
      toast.error(error.message || "Delete failed");
    }
  };

  const openEdit = (sub: any) => {
    setFormData({
      id: sub.id,
      name: sub.name,
      code: sub.code,
      credits: sub.credits,
      department: sub.department,
      semester: sub.semester,
    });
    setEditMode(true);
    setShowModal(true);
  };

  const openAdd = () => {
    setFormData({
      id: "",
      name: "",
      code: "",
      credits: 4,
      department: "CSE",
      semester: "E1-SEM-1",
    });
    setEditMode(false);
    setShowModal(true);
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            Academic Subjects
          </h2>
          <p className="text-slate-500 font-medium">
            Manage the core curriculum and course repository ({meta.total}{" "}
            subjects)
          </p>
        </div>
        <button
          onClick={openAdd}
          className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2.5 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
        >
          <Plus size={16} /> New Subject
        </button>
      </div>

      {/* Filters Hub */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="relative col-span-1 md:col-span-2">
          <input
            type="text"
            placeholder="Search by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold text-sm"
          />
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
        </div>

        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-slate-900/5 outline-none font-bold text-sm cursor-pointer"
        >
          <option value="">All Departments</option>
          <option value="CSE">CSE</option>
          <option value="ECE">ECE</option>
          <option value="EEE">EEE</option>
          <option value="MECH">MECH</option>
          <option value="CIVIL">CIVIL</option>
          <option value="CHEM">CHEMICAL</option>
          <option value="MME">MME</option>
          <option value="MATHEMATICS">MATHEMATICS</option>
        </select>

        <select
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-slate-900/5 outline-none font-bold text-sm cursor-pointer"
        >
          <option value="">All Semesters</option>
          {["E1", "E2", "E3", "E4"].map((y) => (
            <React.Fragment key={y}>
              <option value={`${y}-SEM-1`}>{y} SEM-1</option>
              <option value={`${y}-SEM-2`}>{y} SEM-2</option>
            </React.Fragment>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      ) : subjects.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {subjects.map((sub) => (
              <div
                key={sub.id}
                className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                      <BookText size={20} />
                    </div>
                    <div className="px-3 py-1 bg-blue-50/50 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-600 border border-blue-100/50">
                      {sub.code}
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                    <button
                      onClick={() => openEdit(sub)}
                      className="p-2 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(sub.id)}
                      className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight mb-1 leading-tight min-h-[3rem]">
                  {sub.name}
                </h3>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Dept
                    </p>
                    <p className="font-bold text-slate-700 text-xs flex items-center gap-1">
                      <Building2 size={12} /> {sub.department}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Sem
                    </p>
                    <p className="font-bold text-slate-700 text-xs flex items-center gap-1">
                      <Calendar size={12} /> {sub.semester}
                    </p>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Credits: {sub.credits}
                    </p>
                    <div className="flex gap-1.5">
                      {[...Array(Number(sub.credits))].map((_, i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-blue-600"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {meta.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 pt-8">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="w-12 h-12 flex items-center justify-center bg-white text-slate-900 border border-slate-200 shadow-sm rounded-2xl hover:bg-slate-50 transition-all disabled:opacity-50"
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
                        className={`w-10 h-10 rounded-xl font-black text-xs border transition-all ${
                          page === p
                            ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100"
                            : "bg-white text-slate-400 border-slate-100 hover:border-slate-300 hover:text-blue-600"
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
                className="w-12 h-12 flex items-center justify-center bg-white text-slate-900 border border-slate-200 shadow-sm rounded-2xl hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                <Plus size={20} className="rotate-45" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
          <BookOpen size={48} className="text-slate-300 mb-4" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
            No subjects found matching your criteria
          </p>
          <button
            onClick={() => {
              setSearch("");
              setDepartment("");
              setSemester("");
            }}
            className="mt-4 text-slate-900 font-black text-xs uppercase tracking-widest hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl relative animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-8 right-8 p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"
            >
              <X size={24} />
            </button>
            <h3 className="text-2xl font-black tracking-tight text-slate-900 mb-2">
              {editMode ? "Update Subject" : "Create New Subject"}
            </h3>
            <p className="text-slate-400 font-medium text-sm mb-8">
              {editMode
                ? "Modify subject parameters"
                : "Fill details to add to course repository"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                  Subject Name
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold"
                    placeholder="e.g. Artificial Intelligence"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                    Code
                  </label>
                  <input
                    required
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold"
                    placeholder="CSE402"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                    Credits
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    max="10"
                    value={formData.credits}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        credits: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                    Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        department: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none font-bold cursor-pointer"
                  >
                    <option>CSE</option>
                    <option>ECE</option>
                    <option>EEE</option>
                    <option>MECH</option>
                    <option>CIVIL</option>
                    <option>CHEM</option>
                    <option>MME</option>
                    <option>MATHEMATICS</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                    Semester
                  </label>
                  <select
                    value={formData.semester}
                    onChange={(e) =>
                      setFormData({ ...formData, semester: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none font-bold cursor-pointer"
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

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs border border-slate-200 text-slate-400 hover:bg-slate-50 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  disabled={isSubmitting}
                  type="submit"
                  className="flex-[2] bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : editMode ? (
                    "Update Subject"
                  ) : (
                    "Create Subject"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
