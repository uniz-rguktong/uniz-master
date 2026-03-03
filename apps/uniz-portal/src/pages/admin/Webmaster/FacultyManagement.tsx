/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Loader2,
  Mail,
  Building2,
  Contact,
  Search,
  Edit2,
  Lock,
  Unlock,
  X,
  ShieldCheck,
} from "lucide-react";
import {
  SEARCH_FACULTY,
  CREATE_FACULTY,
  UPDATE_FACULTY,
  ADMIN_SUSPEND_FACULTY,
} from "../../../api/endpoints";
import { toast } from "react-toastify";

export default function FacultyManagement() {
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Pagination & Filtering State
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [meta, setMeta] = useState<any>({ total: 0, totalPages: 0 });

  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    department: "CSE",
    role: "teacher",
    designation: "Lecturer",
    contact: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchFaculty = async () => {
    setLoading(true);
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch(SEARCH_FACULTY, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${JSON.parse(token || '""')}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: search,
          department: department || undefined,
          page,
          limit,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFaculty(data.faculty);
        setMeta(
          data.pagination || { total: data.faculty.length, totalPages: 1 },
        );
      }
    } catch (error) {
      toast.error("Failed to fetch faculty list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, [page, department]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) setPage(1);
      else fetchFaculty();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem("admin_token");
    try {
      const url = editMode ? UPDATE_FACULTY(formData.username) : CREATE_FACULTY;
      const method = editMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${JSON.parse(token || '""')}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          `Faculty ${editMode ? "updated" : "created"} successfully`,
        );
        setShowModal(false);
        fetchFaculty();
      } else {
        toast.error(data.message || "Operation failed");
      }
    } catch (error) {
      toast.error("Error processing request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuspend = async (username: string, currentStatus: boolean) => {
    const token = localStorage.getItem("admin_token");
    if (
      !window.confirm(
        `Are you sure you want to ${currentStatus ? "reinstate" : "suspend"} this user?`,
      )
    )
      return;

    try {
      const res = await fetch(ADMIN_SUSPEND_FACULTY(username), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${JSON.parse(token || '""')}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ suspended: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`User ${!currentStatus ? "suspended" : "reinstated"}`);
        fetchFaculty();
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const openEdit = (member: any) => {
    setFormData({
      username: member.Username,
      name: member.Name,
      email: member.Email,
      department: member.Department,
      role: member.Role || "teacher",
      designation: member.Designation,
      contact: member.Contact || "",
    });
    setEditMode(true);
    setShowModal(true);
  };

  const openAdd = () => {
    setFormData({
      username: "",
      name: "",
      email: "",
      department: "CSE",
      role: "teacher",
      designation: "Lecturer",
      contact: "",
    });
    setEditMode(false);
    setShowModal(true);
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            Faculty & Staff
          </h2>
          <p className="text-slate-500 font-medium">
            Manage administrative and teaching staff accounts ({meta.total}{" "}
            records)
          </p>
        </div>
        <button
          onClick={openAdd}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
        >
          <Plus size={16} /> Add Staff Member
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="relative col-span-1 md:col-span-2">
          <input
            type="text"
            placeholder="Search by name, ID or email..."
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
          <option value="CSE">CSE</option>
          <option value="ECE">ECE</option>
          <option value="EEE">EEE</option>
          <option value="MECH">MECH</option>
          <option value="CIVIL">CIVIL</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-slate-900" size={32} />
        </div>
      ) : faculty.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {faculty.map((member, idx) => (
            <div
              key={idx}
              className={`bg-white border rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden ${member.Role === "suspended"
                ? "border-red-100 opacity-75"
                : "border-slate-100"
                }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <ShieldCheck size={24} />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(member)}
                    className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() =>
                      handleSuspend(member.Username, member.is_suspended)
                    }
                    className={`p-2 rounded-xl transition-all ${member.is_suspended
                      ? "text-green-500 hover:bg-green-50"
                      : "text-red-500 hover:bg-red-50"
                      }`}
                  >
                    {member.is_suspended ? (
                      <Unlock size={16} />
                    ) : (
                      <Lock size={16} />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none">
                  {member.Name}
                </h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {member.Designation} • {member.Username}
                </p>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                  <Building2 size={14} className="text-slate-400" />
                  {member.Department}
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                  <Mail size={14} className="text-slate-400" />
                  {member.Email}
                </div>
                {member.Contact && (
                  <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                    <Contact size={14} className="text-slate-400" />
                    {member.Contact}
                  </div>
                )}
              </div>

              {member.is_suspended && (
                <div className="absolute inset-x-0 bottom-0 bg-red-500 py-1 text-center font-black text-[10px] text-white uppercase tracking-widest">
                  Account Suspended
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
          <Users size={48} className="text-slate-300 mb-4" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
            No staff members found matching your criteria
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
              {editMode ? "Edit Staff Details" : "Register Staff Member"}
            </h3>
            <p className="text-slate-400 font-medium text-sm mb-8">
              {editMode
                ? "Update profile information and permissions"
                : "Create a new faculty or administrative account"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Username / ID
                  </label>
                  <input
                    required
                    disabled={editMode}
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        username: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold disabled:opacity-50"
                    placeholder="e.g. FAC001"
                  />
                </div>
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
                    placeholder="Prof. Surname"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Email Address
                </label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold"
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
                    <option>CSE</option>
                    <option>ECE</option>
                    <option>EEE</option>
                    <option>MECH</option>
                    <option>CIVIL</option>
                    <option>ADMIN</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                    System Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none font-bold cursor-pointer"
                  >
                    <option value="teacher">Teacher</option>
                    <option value="hod">Department Head</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Designation
                </label>
                <input
                  required
                  value={formData.designation}
                  onChange={(e) =>
                    setFormData({ ...formData, designation: e.target.value })
                  }
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold"
                  placeholder="e.g. HOD, Lecturer"
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
                    "Update"
                  ) : (
                    "Register Account"
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
