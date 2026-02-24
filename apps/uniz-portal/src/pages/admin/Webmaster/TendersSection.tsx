/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  Briefcase,
  Plus,
  Loader2,
  Type,
  AlignLeft,
  Link as LinkIcon,
  CheckCircle2,
  X,
  FileText,
  Calendar,
  Eye,
  EyeOff,
} from "lucide-react";
import { TENDERS_BASE, GET_NOTIFICATIONS } from "../../../api/endpoints";
import { toast } from "react-toastify";

export default function TendersSection() {
  const [tenders, setTenders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // New Tender Form State
  const [newTender, setNewTender] = useState({
    title: "",
    description: "",
    pdfUrl: "",
    deadline: "",
    isVisible: true,
  });

  useEffect(() => {
    fetchTenders();
  }, []);

  const getAuthToken = () => {
    const rawToken = localStorage.getItem("admin_token");
    if (!rawToken) return "";
    try {
      return JSON.parse(rawToken);
    } catch (e) {
      return rawToken;
    }
  };

  const fetchTenders = async () => {
    setLoading(true);
    // Tenders are also returned in the notifications sweep in some implementations,
    // but here we check a specific list if available or use the public notifications
    try {
      const res = await fetch(GET_NOTIFICATIONS, {
        method: "GET",
        headers: {
          "x-cms-api-key": "uniz-landing-v1-key",
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();

      // Search for tenders array in any possible location in the response
      const findTenders = (obj: any): any[] | null => {
        if (obj.tenders && Array.isArray(obj.tenders)) return obj.tenders;
        if (obj.data && obj.data.tenders && Array.isArray(obj.data.tenders))
          return obj.data.tenders;
        return null;
      };

      const result = findTenders(data);
      if (result) {
        setTenders(result);
      } else {
        // Fallback: If tenders aren't explicitly returned, we might need a specific admin route
        // For now, assume it's empty if not found in public notifications
        setTenders([]);
      }
    } catch (error) {
      console.error("Error fetching tenders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTender = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading("creating");
    const token = getAuthToken();
    try {
      const res = await fetch(TENDERS_BASE, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTender),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Tender published successfully");
        setShowAddModal(false);
        setNewTender({
          title: "",
          description: "",
          pdfUrl: "",
          deadline: "",
          isVisible: true,
        });
        fetchTenders();
      } else {
        toast.error(data.msg || "Post failed");
      }
    } catch (error) {
      toast.error("Error publishing tender");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-700 pb-20 text-slate-900">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-4xl font-black tracking-tight text-slate-900 leading-none">
            Procurement & Tenders
          </h2>
          <p className="text-slate-500 font-medium">
            Manage campus contract opportunities and procurement notices.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-3 bg-slate-900 text-white px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl active:scale-95"
        >
          <Plus size={20} />
          New Tender
        </button>
      </div>

      {/* Tenders List */}
      {loading ? (
        <div className="p-32 flex flex-col items-center justify-center space-y-4 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
          <Loader2 className="animate-spin w-12 h-12 text-slate-300" />
          <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">
            Fetching tenders...
          </p>
        </div>
      ) : tenders && tenders.length > 0 ? (
        <div className="flex flex-col gap-6">
          {tenders.map((tender, idx) => (
            <div
              key={tender.id || idx}
              className="bg-white rounded-[2rem] border border-slate-100 p-8 flex flex-col md:flex-row items-center justify-between gap-8 hover:shadow-2xl hover:shadow-slate-200 transition-all group"
            >
              <div className="flex items-center gap-8 flex-1">
                <div
                  className={`p-5 rounded-2xl shrink-0 ${tender.isVisible ? "bg-indigo-50 text-indigo-600" : "bg-slate-50 text-slate-400"}`}
                >
                  <Briefcase size={32} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <h3 className="font-black text-slate-900 text-xl tracking-tight uppercase">
                      {tender.title}
                    </h3>
                    <div
                      className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 border backdrop-blur-md shadow-sm ${tender.isVisible ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-slate-500/10 text-slate-500 border-slate-500/20"}`}
                    >
                      {tender.isVisible ? (
                        <Eye size={10} />
                      ) : (
                        <EyeOff size={10} />
                      )}
                      {tender.isVisible ? "Published" : "Hidden"}
                    </div>
                  </div>
                  <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-3xl">
                    {tender.description}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    {tender.deadline && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-red-500">
                        <Calendar size={14} />
                        Deadline:{" "}
                        {new Date(tender.deadline).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {tender.pdfUrl && (
                  <a
                    href={tender.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all text-xs font-black uppercase tracking-widest"
                  >
                    <FileText size={16} />
                    View PDF
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-32 flex flex-col items-center justify-center text-center space-y-6 bg-white rounded-[3rem] border border-slate-50">
          <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200">
            <Briefcase size={48} strokeWidth={1} />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              No Active Tenders
            </p>
            <p className="text-slate-400 font-medium mt-2 max-w-sm">
              Manage campus procurement and service contracts here.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all"
          >
            Create First Tender
          </button>
        </div>
      )}

      {/* Add Tender Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={() => setShowAddModal(false)}
          />
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
            <div className="bg-slate-900 p-8 text-white relative flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-2xl">
                <Plus size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight">
                  New Tender Notice
                </h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                  Publish Procurement Opportunity
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateTender} className="p-10 space-y-8">
              <div className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                    <Type size={12} /> Tender Title
                  </label>
                  <input
                    required
                    type="text"
                    value={newTender.title}
                    onChange={(e) =>
                      setNewTender({ ...newTender, title: e.target.value })
                    }
                    placeholder="e.g. Canteen Catering Services 2026"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-bold text-slate-900"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                    <AlignLeft size={12} /> Brief Description
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={newTender.description}
                    onChange={(e) =>
                      setNewTender({
                        ...newTender,
                        description: e.target.value,
                      })
                    }
                    placeholder="General requirements and scope..."
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-bold text-slate-900 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* PDF URL */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                      <LinkIcon size={12} /> PDF Document URL
                    </label>
                    <input
                      type="url"
                      value={newTender.pdfUrl}
                      onChange={(e) =>
                        setNewTender({ ...newTender, pdfUrl: e.target.value })
                      }
                      placeholder="https://..."
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-bold text-slate-900"
                    />
                  </div>

                  {/* Deadline */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                      <Calendar size={12} /> Submission Deadline
                    </label>
                    <input
                      type="date"
                      value={newTender.deadline}
                      onChange={(e) =>
                        setNewTender({ ...newTender, deadline: e.target.value })
                      }
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <button
                disabled={!!actionLoading}
                type="submit"
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {actionLoading === "creating" ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  <CheckCircle2 size={18} />
                )}
                Publish Tender
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
