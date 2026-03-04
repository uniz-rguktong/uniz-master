/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  Filter,
  X,
  Trash2,
} from "lucide-react";
import {
  SEARCH_FACULTY,
  CREATE_FACULTY,
  UPDATE_FACULTY,
  ADMIN_SUSPEND_FACULTY,
  BASE_URL,
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
  const [, setMeta] = useState<any>({ total: 0, totalPages: 0 });

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
  }, [page]);

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

  const handleDelete = async (username: string) => {
    const token = localStorage.getItem("admin_token");
    if (
      !window.confirm(
        `CRITICAL: Are you sure you want to PERMANENTLY DELETE this faculty profile? This cannot be undone.`,
      )
    )
      return;

    try {
      const res = await fetch(`${BASE_URL}/profile/admin/faculty/${username}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${JSON.parse(token || '""')}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Profile deleted");
        fetchFaculty();
      } else {
        toast.error(data.message || "Failed to delete");
      }
    } catch (error) {
      toast.error("Network error during deletion");
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
    <div className="p-6 space-y-6 animate-in fade-in duration-700 pb-20 text-slate-900">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-3xl font-semibold tracking-[-0.02em] text-slate-900 leading-none">
            User Management
          </h2>
          <p className="text-slate-500 font-medium text-[15px]">
            Manage administrative and teaching staff accounts.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100/80 p-1 rounded-full border border-slate-200/50 backdrop-blur-sm shadow-inner">
            <button className="p-2.5 text-slate-500 hover:text-blue-600 transition-all">
              <Filter size={18} />
            </button>
            <button
              onClick={fetchFaculty}
              className={`p-2.5 text-slate-500 hover:text-blue-600 transition-all ${loading ? "animate-spin" : ""}`}
            >
              <RefreshCw size={18} />
            </button>
          </div>

          <div className="relative group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
              size={14}
            />
            <input
              type="text"
              placeholder="System Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-5 h-11 bg-white border border-slate-200 rounded-full text-[11px] font-bold uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all w-[240px] shadow-sm"
            />
          </div>

          <button
            onClick={openAdd}
            className="h-11 px-6 bg-blue-600 text-white rounded-full font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2.5"
          >
            <Plus size={16} /> Add Staff
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="px-10 py-6 text-[11px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-50/20">
                  User Details
                </th>
                <th className="px-10 py-6 text-[11px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-50/20">
                  Designation
                </th>
                <th className="px-10 py-6 text-[11px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-50/20">
                  Role
                </th>
                <th className="px-10 py-6 text-[11px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-50/20">
                  Status
                </th>
                <th className="px-10 py-6 text-[11px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-50/20 text-right">
                  System Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/60">
              {loading ? (
                Array(6)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td
                        colSpan={5}
                        className="px-10 py-8 bg-slate-50/20"
                      ></td>
                    </tr>
                  ))
              ) : faculty.length > 0 ? (
                faculty.map((member, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50/30 transition-all group"
                  >
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-slate-200 border-2 border-white ring-1 ring-slate-100">
                          {member.Name?.[0] || member.Username?.[0]}
                        </div>
                        <div className="flex flex-col">
                          <p className="font-bold text-slate-900 tracking-tight leading-none mb-1.5">
                            {member.Name}
                          </p>
                          <div className="flex items-center gap-2">
                            <Mail size={10} className="text-slate-300" />
                            <p className="text-[10px] font-medium text-slate-400 leading-none">
                              {member.Email}
                            </p>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <p className="text-xs font-black text-slate-600 uppercase tracking-wide">
                        {member.Designation || "Lecturer"}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        {member.Department}
                      </p>
                    </td>
                    <td className="px-10 py-6">
                      <span className="px-3 py-1 bg-slate-50 rounded-lg text-slate-500 font-semibold uppercase tracking-widest text-[9px] border border-slate-100">
                        {member.Role?.toUpperCase() || "FACULTY"}
                      </span>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-bold uppercase tracking-widest w-fit animate-in fade-in zoom-in-95 duration-300">
                        {!member.is_suspended ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-emerald-600">Active</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            <span className="text-red-500">Suspended</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          onClick={() => openEdit(member)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-600 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all hover:bg-slate-200 active:scale-95 shadow-sm"
                        >
                          Modify
                        </button>
                        <button
                          onClick={() =>
                            handleSuspend(member.Username, member.is_suspended)
                          }
                          className={`flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-full text-[9px] font-bold uppercase tracking-widest transition-all hover:bg-slate-800 active:scale-95 shadow-lg shadow-slate-200 ${member.is_suspended ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100" : ""}`}
                        >
                          {member.is_suspended ? "Reinstate" : "Suspend"}
                        </button>
                        <button
                          onClick={() => handleDelete(member.Username)}
                          className="p-2.5 bg-red-50 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all active:scale-90 border border-red-100"
                          title="Delete Faculty"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-24 text-center">
                    <div className="flex flex-col items-center gap-5">
                      <div className="p-6 bg-slate-50 rounded-full border border-slate-100 shadow-inner">
                        <Users size={40} className="text-slate-300" />
                      </div>
                      <p className="font-semibold text-slate-400 italic text-sm tracking-tight">
                        No staff members matching your current criteria.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[28px] p-10 shadow-2xl relative animate-in zoom-in-95 duration-300 border border-slate-100">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-8 right-8 p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"
            >
              <X size={24} />
            </button>
            <h3 className="text-2xl font-semibold tracking-[-0.02em] text-slate-900 mb-2">
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
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 ml-1">
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
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-semibold text-sm disabled:opacity-50"
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
