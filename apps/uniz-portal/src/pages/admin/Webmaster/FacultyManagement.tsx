/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Loader2,
  Mail,
  Building2,
  Search,
  Edit2,
  Trash2,
  X,
  UserCheck,
  Award,
} from "lucide-react";
import {
  ACADEMIC_FACULTY,
  ACADEMIC_FACULTY_BY_ID,
  ACADEMIC_FACULTY_ROLE,
} from "../../../api/endpoints";
import { toast } from "react-toastify";
import { apiClient } from "../../../api/apiClient";

export default function FacultyManagement() {
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    email: "",
    department: "CSE",
    role: "FACULTY",
    photo: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchFaculty = async () => {
    setLoading(true);
    try {
      const url = new URL(ACADEMIC_FACULTY, window.location.origin);
      if (department) url.searchParams.append("department", department);

      const data = await apiClient<any[]>(url.pathname + url.search);
      setFaculty(data || []);
    } catch (error) {
      toast.error("Failed to fetch faculty list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, [department]);

  const filteredFaculty = faculty.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.email.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editMode) {
        await apiClient(ACADEMIC_FACULTY_BY_ID(formData.id), {
          method: "PUT",
          body: JSON.stringify(formData),
        });
        toast.success("Faculty profile updated");
      } else {
        await apiClient(ACADEMIC_FACULTY, {
          method: "POST",
          body: JSON.stringify(formData),
        });
        toast.success("Faculty member created");
      }
      setShowModal(false);
      fetchFaculty();
    } catch (error: any) {
      toast.error(error.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this faculty member?"))
      return;
    try {
      await apiClient(ACADEMIC_FACULTY_BY_ID(id), { method: "DELETE" });
      toast.success("Faculty deleted successfully");
      fetchFaculty();
    } catch (error) {
      toast.error("Failed to delete faculty");
    }
  };

  const handleRoleUpdate = async (id: string, newRole: string) => {
    try {
      await apiClient(ACADEMIC_FACULTY_ROLE(id), {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      toast.success(`Role updated to ${newRole}`);
      fetchFaculty();
    } catch (error) {
      toast.error("Failed to update role");
    }
  };

  const openEdit = (member: any) => {
    setFormData({
      id: member.id,
      name: member.name,
      email: member.email,
      department: member.department,
      role: member.role,
      photo: member.photo || "",
    });
    setEditMode(true);
    setShowModal(true);
  };

  const openAdd = () => {
    setFormData({
      id: "",
      name: "",
      email: "",
      department: "CSE",
      role: "FACULTY",
      photo: "",
    });
    setEditMode(false);
    setShowModal(true);
  };

  const DEPARTMENTS = [
    "CSE",
    "CIVIL",
    "ECE",
    "EEE",
    "ME",
    "MATHEMATICS",
    "PHYSICS",
    "CHEMISTRY",
    "IT",
    "BIOLOGY",
    "ENGLISH",
    "LIB",
    "MANAGEMENT",
    "PED",
    "TELUGU",
    "YOGA",
  ];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            Faculty Management
          </h2>
          <p className="text-slate-500 font-medium">
            Manage academic profiles, departments, and roles ({faculty.length}{" "}
            records)
          </p>
        </div>
        <button
          onClick={openAdd}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
        >
          <Plus size={16} /> Add Faculty Member
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="relative col-span-1 md:col-span-2">
          <input
            type="text"
            placeholder="Search by name or email..."
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
          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none font-bold text-sm cursor-pointer"
        >
          <option value="">All Departments</option>
          {DEPARTMENTS.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-slate-900" size={32} />
        </div>
      ) : filteredFaculty.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFaculty.map((member) => (
            <div
              key={member.id}
              className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="relative">
                  {member.photo ? (
                    <img
                      src={member.photo}
                      alt={member.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-50 group-hover:border-blue-500 transition-all shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Users size={24} />
                    </div>
                  )}
                  <div
                    className={`absolute -bottom-2 -right-2 p-1.5 rounded-lg border-2 border-white shadow-sm ${
                      member.role === "DEAN"
                        ? "bg-amber-500 text-white"
                        : member.role === "WEBMASTER"
                          ? "bg-purple-600 text-white"
                          : "bg-blue-600 text-white"
                    }`}
                  >
                    {member.role === "DEAN" ? (
                      <Award size={12} />
                    ) : (
                      <UserCheck size={12} />
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(member)}
                    className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(member.id)}
                    className="p-2 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-600 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight group-hover:text-blue-600 transition-colors">
                  {member.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-md ${
                      member.role === "DEAN"
                        ? "bg-amber-50 text-amber-600"
                        : member.role === "WEBMASTER"
                          ? "bg-purple-50 text-purple-600"
                          : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    {member.role}
                  </span>
                  <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {member.department}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-50 space-y-3">
                <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
                  <Mail size={12} className="text-slate-400" />
                  {member.email}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
                  <Building2 size={12} className="text-slate-400" />
                  {member.department} Faculty
                </div>
              </div>

              {/* Role Quick Toggle */}
              <div className="mt-6 flex gap-2 overflow-x-auto no-scrollbar pb-1">
                <button
                  onClick={() => handleRoleUpdate(member.id, "FACULTY")}
                  className={`flex-1 text-[9px] font-black uppercase tracking-tighter px-2 py-1.5 rounded-lg border transition-all ${
                    member.role === "FACULTY"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-400 border-slate-100 hover:border-blue-200"
                  }`}
                >
                  Faculty
                </button>
                <button
                  onClick={() => handleRoleUpdate(member.id, "DEAN")}
                  className={`flex-1 text-[9px] font-black uppercase tracking-tighter px-2 py-1.5 rounded-lg border transition-all ${
                    member.role === "DEAN"
                      ? "bg-amber-500 text-white border-amber-500"
                      : "bg-white text-slate-400 border-slate-100 hover:border-amber-200"
                  }`}
                >
                  Dean
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
          <Users size={48} className="text-slate-300 mb-4" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
            No faculty members found matching your criteria
          </p>
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
              {editMode ? "Edit Profile" : "Add Faculty Member"}
            </h3>
            <p className="text-slate-400 font-medium text-sm mb-8">
              {editMode
                ? "Update faculty details and system permissions"
                : "Create a new academic faculty profile"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Full Name
                </label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold"
                  placeholder="Prof. John Doe"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Email Address
                </label>
                <input
                  required
                  type="email"
                  disabled={editMode}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold disabled:opacity-50"
                  placeholder="faculty@rguktong.ac.in"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none font-bold cursor-pointer"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none font-bold cursor-pointer"
                  >
                    <option value="FACULTY">Faculty</option>
                    <option value="DEAN">Dean</option>
                    <option value="WEBMASTER">Webmaster</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Photo URL (Optional)
                </label>
                <input
                  value={formData.photo}
                  onChange={(e) =>
                    setFormData({ ...formData, photo: e.target.value })
                  }
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold"
                  placeholder="https://example.com/photo.jpg"
                />
              </div>

              <div className="pt-6 flex gap-4">
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
                    "Update Profile"
                  ) : (
                    "Create Faculty"
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
