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
} from "lucide-react";
import { GET_SUBJECTS, ADD_SUBJECT } from "../../../api/endpoints";
import { toast } from "react-toastify";

export default function SubjectManagement() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubject, setNewSubject] = useState({
    name: "",
    code: "",
    credits: 4,
    department: "CSE",
    semester: "SEM-1",
  });
  const [isAdding, setIsAdding] = useState(false);

  const fetchSubjects = async () => {
    setLoading(true);
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch(GET_SUBJECTS, {
        headers: {
          Authorization: `Bearer ${JSON.parse(token || '""')}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setSubjects(data.subjects);
      }
    } catch (error) {
      toast.error("Failed to fetch subjects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch(ADD_SUBJECT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${JSON.parse(token || '""')}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSubject),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Subject added successfully");
        setShowAddModal(false);
        fetchSubjects();
        setNewSubject({
          name: "",
          code: "",
          credits: 4,
          department: "CSE",
          semester: "SEM-1",
        });
      } else {
        toast.error(data.msg || "Failed to add subject");
      }
    } catch (error) {
      toast.error("Error adding subject");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            Academic Subjects
          </h2>
          <p className="text-slate-500 font-medium">
            Manage the core curriculum and course repository
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95"
        >
          <Plus size={16} /> New Subject
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-slate-900" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {subjects.map((sub, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                <BookOpen size={80} />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-slate-50 rounded-xl text-slate-900 border border-slate-100">
                  <BookText size={20} />
                </div>
                <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {sub.code}
                </div>
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">
                {sub.name}
              </h3>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Department
                  </p>
                  <p className="font-bold text-slate-700 text-sm flex items-center gap-1">
                    <Building2 size={12} /> {sub.department}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Semester
                  </p>
                  <p className="font-bold text-slate-700 text-sm flex items-center gap-1">
                    <Calendar size={12} /> {sub.semester}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Credits
                  </p>
                  <div className="flex gap-1">
                    {[...Array(sub.credits)].map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-slate-900"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
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
            <h3 className="text-2xl font-black tracking-tight text-slate-900 mb-6">
              Create New Subject
            </h3>

            <form onSubmit={handleAddSubject} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                  Subject Name
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    required
                    value={newSubject.name}
                    onChange={(e) =>
                      setNewSubject({ ...newSubject, name: e.target.value })
                    }
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-bold"
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
                    value={newSubject.code}
                    onChange={(e) =>
                      setNewSubject({
                        ...newSubject,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-bold"
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
                    value={newSubject.credits}
                    onChange={(e) =>
                      setNewSubject({
                        ...newSubject,
                        credits: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
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
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-bold"
                  >
                    <option>CSE</option>
                    <option>ECE</option>
                    <option>EEE</option>
                    <option>MECH</option>
                    <option>CIVIL</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                    Semester
                  </label>
                  <select
                    value={newSubject.semester}
                    onChange={(e) =>
                      setNewSubject({ ...newSubject, semester: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-bold"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s}>SEM-{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs border border-slate-200 text-slate-400 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  disabled={isAdding}
                  type="submit"
                  className="flex-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {isAdding ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : (
                    <Plus size={16} />
                  )}
                  Create Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
