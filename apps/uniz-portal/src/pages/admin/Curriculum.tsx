/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
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

interface Subject {
  id: string;
  code: string;
  name: string;
  department: string;
  semester: string;
  credits: number;
}

export default function CurriculumManager() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
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
    credits: 3
  });

  const departments = ["CSE", "ECE", "EEE", "CIVIL", "MECH"];
  const semesters = [
    "E1-SEM-1", "E1-SEM-2", 
    "E2-SEM-1", "E2-SEM-2", 
    "E3-SEM-1", "E3-SEM-2", 
    "E4-SEM-1", "E4-SEM-2"
  ];

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token")?.replace(/"/g, "");
      
      const params = new URLSearchParams({
        limit: "12",
        page: page.toString(),
        search: searchQuery
      });
      if (deptFilter !== "ALL") params.append("department", deptFilter);
      if (semFilter !== "ALL") params.append("semester", semFilter);

      const res = await fetch(`${BASE_URL}/academics/subjects?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSubjects(data.subjects || []);
        setTotalPages(data.meta?.totalPages || 1);
        setTotalRecords(data.meta?.total || 0);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch subjects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [page, deptFilter, semFilter, searchQuery]);

  const handleOpenModal = (sub?: Subject) => {
    if (sub) {
      setEditingSubject(sub);
      setFormData({
        code: sub.code,
        name: sub.name,
        department: sub.department,
        semester: sub.semester,
        credits: sub.credits
      });
    } else {
      setEditingSubject(null);
      setFormData({
        code: "",
        name: "",
        department: "CSE",
        semester: "E1-SEM-1",
        credits: 3
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
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
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
    if (!window.confirm("Are you sure you want to delete this subject?")) return;
    const token = localStorage.getItem("admin_token")?.replace(/"/g, "");
    try {
      const res = await fetch(`${BASE_URL}/academics/subjects/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
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
    <div className="animate-in fade-in duration-700">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Academic Subjects</h1>
          <p className="text-slate-500 text-sm font-medium">Manage the core institutional curriculum ({totalRecords} records)</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-navy-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-navy-900/10"
        >
          <Plus size={18} strokeWidth={3} />
          NEW SUBJECT
        </button>
      </div>

      {/* Filters Area */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col lg:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or code..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-900/5 transition-all"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
            <Filter size={14} className="text-slate-400" />
            <select 
              className="bg-transparent text-xs font-bold text-slate-600 focus:outline-none cursor-pointer"
              value={deptFilter}
              onChange={(e) => {
                setDeptFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
            <BookOpen size={14} className="text-slate-400" />
            <select 
              className="bg-transparent text-xs font-bold text-slate-600 focus:outline-none cursor-pointer"
              value={semFilter}
              onChange={(e) => {
                setSemFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All Semesters</option>
              {semesters.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Grid Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-navy-900" size={40} />
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Hydrating Curriculum...</p>
        </div>
      ) : subjects.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <GraduationCap size={64} className="mx-auto text-slate-200 mb-4" />
          <h3 className="text-lg font-bold text-slate-900">No subjects found</h3>
          <p className="text-slate-500 text-sm">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {subjects.map((sub) => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={sub.id} 
              className="group bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:border-navy-900/10 transition-all relative overflow-hidden"
            >
              {/* Card Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-navy-900 group-hover:bg-navy-900 group-hover:text-white transition-colors duration-500">
                  <GraduationCap size={20} />
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleOpenModal(sub)}
                    className="p-2 text-slate-400 hover:text-navy-900 hover:bg-slate-50 rounded-xl transition-all"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(sub.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="space-y-1 mb-5">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{sub.code}</p>
                <h3 className="text-[17px] font-bold text-slate-900 line-clamp-1 leading-tight">{sub.name}</h3>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-2.5 py-1 bg-navy-50 text-navy-900 text-[10px] font-black rounded-lg uppercase tracking-wider">{sub.department}</span>
                <span className="px-2.5 py-1 bg-slate-50 text-slate-600 text-[10px] font-black rounded-lg uppercase tracking-wider">{sub.semester}</span>
              </div>

              {/* Progress Bar (Weight) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>Academic Weight</span>
                  <span>{((sub.credits / 4) * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(sub.credits / 4) * 100}%` }}
                    className="h-full bg-navy-900 rounded-full"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <BookOpen size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{sub.credits} CREDITS</span>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && totalRecords > 0 && (
        <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Showing <span className="text-slate-900">{subjects.length}</span> of {totalRecords} records
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl text-slate-400 hover:text-navy-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="px-4 text-xs font-black text-navy-900 uppercase tracking-widest">
              Page {page} of {totalPages}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl text-slate-400 hover:text-navy-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={20} />
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
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                      {editingSubject ? "Edit Subject" : "Create Subject"}
                    </h2>
                    <p className="text-slate-500 text-sm font-medium">Define metadata for the new curriculum node</p>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-600 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Subject Code</label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input 
                          required
                          value={formData.code}
                          onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                          placeholder="e.g. CSE-302"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-navy-900/5 transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Credits</label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input 
                          type="number"
                          step="0.5"
                          min="0"
                          max="4"
                          required
                          value={formData.credits}
                          onChange={(e) => setFormData({...formData, credits: Number(e.target.value)})}
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-navy-900/5 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Display Name</label>
                    <input 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Advanced Operating Systems"
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-navy-900/5 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Department</label>
                      <select 
                        value={formData.department}
                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-navy-900/5 transition-all appearance-none"
                      >
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Level (Semester)</label>
                      <select 
                        value={formData.semester}
                        onChange={(e) => setFormData({...formData, semester: e.target.value})}
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-navy-900/5 transition-all appearance-none"
                      >
                        {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-navy-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-navy-900/20"
                  >
                    {editingSubject ? "Update Curriculum Node" : "Deploy Subject"}
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
