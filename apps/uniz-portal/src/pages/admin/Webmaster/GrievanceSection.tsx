/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  MessageSquare,
  Search,
  User,
  Tag,
} from "lucide-react";
import { GET_GRIEVANCES_LIST } from "../../../api/endpoints";
import { toast } from "@/utils/toast-ref";

export default function GrievanceSection() {
  const [grievances, setGrievances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>({ total: 0, totalPages: 0 });

  useEffect(() => {
    fetchGrievances();
  }, [page]);

  const fetchGrievances = async () => {
    setLoading(true);
    const token = localStorage.getItem("admin_token");
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: "10",
      });

      const res = await fetch(`${GET_GRIEVANCES_LIST}?${query.toString()}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${(token || "").replace(/"/g, "")}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setGrievances(data.data || []);
        setMeta(data.meta || { total: data.data?.length || 0, totalPages: 1 });
      } else {
        toast.error(data.msg || "Failed to fetch grievances");
      }
    } catch (error) {
      toast.error("Error connecting to grievance service");
    } finally {
      setLoading(false);
    }
  };

  const filteredGrievances = grievances.filter((g) => {
    const matchesFilter =
      filter === "all" || g.status?.toLowerCase() === filter.toLowerCase();
    const matchesSearch =
      g.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.studentId?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusStyles = (status: string) => {
    switch (status?.toLowerCase()) {
      case "resolved":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "pending":
        return "bg-amber-50 text-amber-600 border-amber-100";
      case "in-progress":
        return "bg-navy-50 text-navy-900 border-navy-100";
      default:
        return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "resolved":
        return <CheckCircle2 size={14} />;
      case "pending":
        return <Clock size={14} />;
      default:
        return <AlertCircle size={14} />;
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-3xl font-semibold tracking-[-0.02em] text-slate-900 leading-none">
            Student Grievances
          </h2>
          <p className="text-slate-500 font-medium text-[15px]">
            Review and manage student submitted concerns
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchGrievances}
            disabled={loading}
            className="bg-white border border-slate-200 p-3 rounded-xl hover:bg-slate-50 transition-all shadow-none"
          >
            <Clock size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Total Grievances"
          count={grievances.length}
          icon={MessageSquare}
          color="bg-navy-900"
        />
        <StatCard
          label="Pending Review"
          count={
            grievances.filter((g) => g.status?.toLowerCase() === "pending")
              .length
          }
          icon={Clock}
          color="bg-amber-500"
        />
        <StatCard
          label="Resolved Issues"
          count={
            grievances.filter((g) => g.status?.toLowerCase() === "resolved")
              .length
          }
          icon={CheckCircle2}
          color="bg-emerald-500"
        />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-5 rounded-xl border border-slate-100 shadow-none transition-all">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search grievances by ID, category or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-navy-900/5 focus:border-navy-100 outline-none transition-all font-semibold text-slate-900 text-sm"
          />
        </div>

        <div className="flex gap-2 p-1.5 bg-slate-100/80 rounded-full border border-slate-200/60 backdrop-blur-sm shrink-0">
          {["all", "pending", "resolved"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-xl text-[10px] font-semibold uppercase tracking-widest transition-all ${filter === f ? "bg-white text-navy-800 shadow-none border border-navy-100" : "text-slate-500 hover:text-navy-900"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grievance Grid */}
      {loading ? (
        <div className="p-20 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="animate-spin w-10 h-10 text-slate-300" />
          <p className="font-bold text-slate-400">Loading grievances...</p>
        </div>
      ) : filteredGrievances.length > 0 ? (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredGrievances.map((grievance) => (
              <div
                key={grievance.id || grievance._id}
                className="bg-white rounded-xl border border-slate-100 p-6 shadow-none transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-50 text-slate-400 border border-slate-100">
                        <Tag size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-1.5">
                          Category
                        </p>
                        <p className="font-semibold text-slate-900 text-sm">
                          {grievance.category}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[10px] font-semibold uppercase tracking-widest ${getStatusStyles(grievance.status)}`}
                    >
                      {getStatusIcon(grievance.status)}
                      {grievance.status || "Pending"}
                    </div>
                  </div>

                  <p className="text-slate-700 font-medium leading-relaxed mb-6 line-clamp-3 bg-slate-50/30 p-5 rounded-xl border border-slate-100/50 italic text-[14px]">
                    "{grievance.description}"
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                      <User size={16} />
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-1">
                        Submitted By
                      </p>
                      <p className="text-xs font-semibold text-slate-900 leading-none">
                        {grievance.isAnonymous
                          ? "Anonymous Student"
                          : grievance.studentId || "Unknown ID"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-1">
                      Date
                    </p>
                    <p className="text-xs font-semibold text-slate-900 leading-none">
                      {grievance.createdAt
                        ? new Date(grievance.createdAt).toLocaleDateString()
                        : "Recent"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {meta.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 pt-12">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="w-12 h-12 rounded-xl bg-white border border-slate-100 shadow-none flex items-center justify-center hover:bg-slate-50 disabled:opacity-50 transition-all active:scale-95"
              >
                <Clock size={18} className="rotate-180" />
              </button>

              <div className="flex bg-slate-100 p-1.5 rounded-xl gap-1">
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
                        className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${
                          page === p
                            ? "bg-navy-900 text-white shadow-none"
                            : "text-slate-400 hover:bg-white hover:text-navy-900"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  }
                  return null;
                })}
              </div>

              <button
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                className="w-12 h-12 rounded-xl bg-white border border-slate-100 shadow-none flex items-center justify-center hover:bg-slate-50 disabled:opacity-50 transition-all active:scale-95"
              >
                <Clock size={18} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="p-20 flex flex-col items-center justify-center text-center opacity-50 space-y-4">
          <div className="p-6 bg-slate-50 rounded-full text-slate-300">
            <MessageSquare size={40} />
          </div>
          <div>
            <p className="font-black text-slate-900 text-xl tracking-tight">
              No grievances found
            </p>
            <p className="font-bold text-slate-400 mt-1 italic">
              Everything seems to be running smoothly!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, count, icon: Icon, color }: any) {
  return (
    <div className="bg-white p-7 rounded-xl border border-slate-100 shadow-none flex items-center gap-6 transition-all hover:shadow-none">
      <div
        className={`p-4 rounded-xl text-white ${color} shadow-none bg-opacity-90`}
      >
        <Icon size={26} />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 leading-none mb-2.5">
          {label}
        </p>
        <p className="text-3xl font-semibold text-slate-900 leading-none tracking-tight">
          {count}
        </p>
      </div>
    </div>
  );
}
