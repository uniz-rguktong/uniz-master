/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  Bell,
  Plus,
  Loader2,
  Type,
  AlignLeft,
  Link as LinkIcon,
  CheckCircle2,
  X,
  ExternalLink,
  AlertCircle,
  Edit3,
  Trash2,
} from "lucide-react";
import { UPDATES_BASE, GET_NOTIFICATIONS } from "../../../api/endpoints";
import { toast } from "react-toastify";

export default function UpdatesSection() {
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // New Update Form State
  const [newUpdate, setNewUpdate] = useState({
    title: "",
    content: "",
    link: "",
    isVisible: true,
  });
  const [editingUpdate, setEditingUpdate] = useState<any>(null);

  useEffect(() => {
    fetchUpdates();
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

  const fetchUpdates = async () => {
    setLoading(true);
    const primaryUrl = "https://api.uniz.rguktong.in/api/v1/cms/notifications";
    const proxyUrl = GET_NOTIFICATIONS;

    console.log("CMS_SYNC: Initiating sync with primary endpoint:", primaryUrl);

    const tryFetch = async (url: string) => {
      try {
        const res = await fetch(url, {
          method: "GET",
          headers: {
            "x-cms-api-key": "uniz-landing-v1-key",
            "Content-Type": "application/json",
          },
          redirect: "follow",
        });
        if (!res.ok) return null;
        const data = await res.json();

        // Deep search for notifications array
        const findArray = (obj: any): any[] | null => {
          if (Array.isArray(obj)) return obj;
          if (typeof obj !== "object" || obj === null) return null;
          if (obj.notifications && Array.isArray(obj.notifications))
            return obj.notifications;
          if (
            obj.data &&
            obj.data.notifications &&
            Array.isArray(obj.data.notifications)
          )
            return obj.data.notifications;
          if (obj.data && Array.isArray(obj.data)) return obj.data;

          for (const key in obj) {
            const result = findArray(obj[key]);
            if (result) return result;
          }
          return null;
        };

        return findArray(data);
      } catch (err) {
        console.error("CMS_SYNC: Error for", url, err);
        return null;
      }
    };

    let result = await tryFetch(primaryUrl);
    if (!result || result.length === 0) {
      console.log("CMS_SYNC: Primary failed, trying proxy...");
      result = await tryFetch(proxyUrl);
    }

    if (result) {
      console.log(
        "CMS_SYNC: Data verified and loaded:",
        result.length,
        "items.",
      );
      setUpdates(result);
    } else {
      console.warn("CMS_SYNC: All sync attempts failed.");
      setUpdates([]);
    }
    setLoading(false);
  };

  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(editingUpdate ? "updating" : "creating");
    const token = getAuthToken();
    try {
      const url = editingUpdate
        ? `${UPDATES_BASE}/${editingUpdate._id || editingUpdate.id}`
        : UPDATES_BASE;
      const method = editingUpdate ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUpdate),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          editingUpdate ? "Broadcast updated!" : "Broadcast published!",
        );
        setShowAddModal(false);
        setEditingUpdate(null);
        setNewUpdate({ title: "", content: "", link: "", isVisible: true });
        fetchUpdates();
      } else {
        toast.error(data.msg || "Post failed");
      }
    } catch (error) {
      toast.error("Error saving update");
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditClick = (update: any) => {
    setEditingUpdate(update);
    setNewUpdate({
      title: update.title,
      content: update.content || update.description,
      link: update.link || "",
      isVisible: update.isVisible !== false,
    });
    setShowAddModal(true);
  };

  const deleteUpdate = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this broadcast permanently?",
      )
    )
      return;
    setActionLoading(id);
    const token = getAuthToken();
    try {
      const res = await fetch(`${UPDATES_BASE}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Broadcast removed");
        fetchUpdates();
      } else {
        toast.error(data.msg || "Deletion failed");
      }
    } catch (error) {
      toast.error("Error deleting update");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-700 pb-20 text-slate-900">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-3xl font-semibold tracking-[-0.02em] text-slate-900 leading-none">
            Campus Broadcasts
          </h2>
          <p className="text-slate-500 font-medium text-[15px]">
            Distribute vital institutional news and media resources.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchUpdates}
            disabled={loading}
            className="w-11 h-11 flex items-center justify-center bg-slate-100/80 border border-slate-200/50 rounded-full text-slate-400 hover:text-blue-600 transition-all active:scale-95 shadow-inner"
            title="Refresh Stream"
          >
            <Loader2 size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="h-11 px-6 bg-blue-600 text-white rounded-full font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2.5"
          >
            <Plus size={16} /> New Update
          </button>
        </div>
      </div>

      {/* Content Sections */}
      <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden text-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="px-10 py-6 text-[11px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-50/20">
                  Broadcast Content
                </th>
                <th className="px-10 py-6 text-[11px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-50/20">
                  Resource Link
                </th>
                <th className="px-10 py-6 text-[11px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-50/20">
                  Visibility
                </th>
                <th className="px-10 py-6 text-[11px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-50/20">
                  Distribution Date
                </th>
                <th className="px-10 py-6 text-[11px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-50/20 text-right">
                  Actions
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
              ) : updates && updates.length > 0 ? (
                updates.map((update, idx) => (
                  <tr
                    key={update._id || update.id || idx}
                    className="hover:bg-slate-50/30 transition-all group"
                  >
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shadow-lg shadow-slate-200 border-2 border-white ring-1 ring-slate-100 ${update.isVisible ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}`}
                        >
                          <Bell size={18} />
                        </div>
                        <div className="flex flex-col">
                          <p className="font-bold text-slate-900 tracking-tight leading-none mb-1.5 max-w-[300px] truncate">
                            {update.title}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[400px] opacity-70">
                            {update.description ||
                              update.content ||
                              "No description provided."}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      {update.link ? (
                        <a
                          href={update.link}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-all group/link"
                        >
                          <span className="text-[10px] font-bold uppercase tracking-widest underline decoration-blue-200 group-hover/link:decoration-blue-600">
                            Visit Link
                          </span>
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                          None
                        </span>
                      )}
                    </td>
                    <td className="px-10 py-6">
                      {update.isVisible ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 w-fit">
                          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span className="text-[9px] font-bold uppercase tracking-widest">
                            Live
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 w-fit">
                          <span className="text-[9px] font-bold uppercase tracking-widest">
                            Draft
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex flex-col">
                        <p className="text-sm font-semibold tracking-tight text-slate-700">
                          {update.createdAt
                            ? new Date(update.createdAt).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : "Today"}
                        </p>
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">
                          Publication
                        </p>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(update)}
                          className="p-3 bg-slate-50 text-slate-400 rounded-full hover:bg-blue-50 hover:text-blue-600 border border-slate-100 transition-all active:scale-95"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => deleteUpdate(update._id || update.id)}
                          disabled={actionLoading === (update._id || update.id)}
                          className="p-3 bg-slate-50 text-slate-400 rounded-full hover:bg-red-50 hover:text-red-600 border border-slate-100 transition-all active:scale-95"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-24 text-center">
                    <div className="flex flex-col items-center gap-5">
                      <div className="p-6 bg-slate-50 rounded-full border border-slate-100 shadow-inner text-slate-300">
                        <Bell size={40} />
                      </div>
                      <p className="font-semibold text-slate-400 italic text-sm tracking-tight">
                        No active broadcasts found.
                      </p>
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="h-10 px-6 bg-slate-900 text-white rounded-full font-bold uppercase tracking-widest text-[9px] shadow-lg shadow-slate-100 hover:bg-slate-800 active:scale-95 transition-all"
                      >
                        Create First Update
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Sync Status Footer */}
        <div className="px-10 py-5 bg-slate-50/30 border-t border-slate-50 flex items-center justify-between">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
            Broadcast Stream Monitor
          </p>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                CMS Synchronized
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Update Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={() => {
              setShowAddModal(false);
              setEditingUpdate(null);
              setNewUpdate({
                title: "",
                content: "",
                link: "",
                isVisible: true,
              });
            }}
          />
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
            <div
              className={`${editingUpdate ? "bg-slate-900" : "bg-blue-600"} p-8 text-white relative flex items-center gap-5 transition-colors duration-500`}
            >
              <div className="p-3.5 bg-white/20 rounded-2xl">
                {editingUpdate ? <Edit3 size={26} /> : <Bell size={26} />}
              </div>
              <div>
                <h3 className="text-2xl font-semibold tracking-[-0.02em]">
                  {editingUpdate ? "Edit Broadcast" : "New Broadcast"}
                </h3>
                <p className="text-white/70 text-[10px] font-semibold uppercase tracking-[0.2em] mt-1.5">
                  Publish News to Student Dashboard
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingUpdate(null);
                  setNewUpdate({
                    title: "",
                    content: "",
                    link: "",
                    isVisible: true,
                  });
                }}
                className="absolute top-8 right-8 text-white/60 hover:text-white transition-colors"
              >
                <X size={26} />
              </button>
            </div>

            <form onSubmit={handleSaveUpdate} className="p-10 space-y-8">
              <div className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                    <Type size={14} /> Update Title
                  </label>
                  <input
                    required
                    type="text"
                    value={newUpdate.title}
                    onChange={(e) =>
                      setNewUpdate({ ...newUpdate, title: e.target.value })
                    }
                    placeholder="e.g. Semester Registration"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-semibold text-slate-900"
                  />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                    <AlignLeft size={14} /> Description Content
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={newUpdate.content}
                    onChange={(e) =>
                      setNewUpdate({ ...newUpdate, content: e.target.value })
                    }
                    placeholder="Detailed information about the update..."
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-semibold text-slate-900 resize-none"
                  />
                </div>

                {/* Link */}
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                    <LinkIcon size={14} /> Resource Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={newUpdate.link}
                    onChange={(e) =>
                      setNewUpdate({ ...newUpdate, link: e.target.value })
                    }
                    placeholder="https://..."
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-semibold text-slate-900"
                  />
                </div>

                {/* Link Preview Hint */}
                {newUpdate.link && (
                  <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                    <AlertCircle className="text-blue-500 shrink-0" size={16} />
                    <p className="text-[10px] font-bold text-blue-700 leading-tight">
                      Students will be redirected to this link when they click
                      the broadcast.
                    </p>
                  </div>
                )}
              </div>

              <button
                disabled={!!actionLoading}
                type="submit"
                className={`w-full ${editingUpdate ? "bg-slate-900 shadow-slate-200" : "bg-blue-600 shadow-blue-200"} text-white py-5 rounded-2xl font-semibold uppercase tracking-[0.2em] text-[11px] hover:opacity-90 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95`}
              >
                {actionLoading === "creating" ||
                actionLoading === "updating" ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : editingUpdate ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <Plus size={18} />
                )}
                {editingUpdate ? "Update Broadcast" : "Broadcast Now"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
