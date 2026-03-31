/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  Bell,
  Plus,
  X,
  Edit3,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { UPDATES_BASE, GET_NOTIFICATIONS } from "../../../api/endpoints";
import { toast } from "@/utils/toast-ref";
import { useRecoilState } from "recoil";
import { updatesAtom } from "../../../store/atoms";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";

export default function UpdatesSection() {
  const [updatesState, setUpdatesState] = useRecoilState(updatesAtom);
  const updates = updatesState.data;
  const [loading, setLoading] = useState(!updatesState.fetched);
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
    if (!updatesState.fetched) setLoading(true);
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
      setUpdatesState({
        fetched: true,
        data: result,
      });
    } else {
      console.warn("CMS_SYNC: All sync attempts failed.");
      setUpdatesState({
        fetched: true,
        data: [],
      });
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
            className="w-11 h-11 flex items-center justify-center bg-slate-100/80 border border-slate-200/50 rounded-xl text-slate-400 hover:text-navy-900 transition-all active:scale-95"
            title="Refresh Stream"
          >
            <Loader2 size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="h-11 px-6 bg-navy-900 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-navy-800 active:scale-95 transition-all flex items-center justify-center gap-2.5"
          >
            <Plus size={16} /> New Update
          </button>
        </div>
      </div>

      {/* Content Sections */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden text-slate-900 shadow-none">
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
                Array(7)
                  .fill(0)
                  .map((_, i) => (
                    <tr
                      key={i}
                      className="animate-pulse border-b border-slate-50 last:border-0 hover:bg-transparent"
                    >
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-xl bg-slate-100 border-2 border-white ring-1 ring-slate-100 shadow-sm" />
                          <div className="space-y-2">
                            <div className="h-4 w-32 bg-slate-100 rounded-lg shadow-sm" />
                            <div className="h-2 w-48 bg-slate-50 rounded shadow-sm opacity-60" />
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="h-4 w-20 bg-slate-50 rounded shadow-sm opacity-60" />
                      </td>
                      <td className="px-10 py-6">
                        <div className="h-7 w-16 bg-navy-50/50 rounded-xl border border-navy-100/50 shadow-sm opacity-60" />
                      </td>
                      <td className="px-10 py-6">
                        <div className="space-y-2">
                          <div className="h-4 w-24 bg-slate-100 rounded-lg shadow-sm" />
                          <div className="h-2 w-16 bg-slate-50 rounded shadow-sm opacity-60" />
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex justify-end gap-2">
                          <div className="h-10 w-10 bg-slate-50 rounded-xl shadow-sm border border-slate-100" />
                          <div className="h-10 w-10 bg-slate-50 rounded-xl shadow-sm border border-slate-100" />
                        </div>
                      </td>
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
                          className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm border-2 border-white ring-1 ring-slate-100 ${update.isVisible ? "bg-navy-900 text-white" : "bg-slate-100 text-slate-400"}`}
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
                          className="flex items-center gap-2 text-navy-900 hover:text-navy-800 transition-all group/link"
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
                        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100 w-fit">
                          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span className="text-[9px] font-bold uppercase tracking-widest">
                            Live
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-400 bg-slate-50 px-3 py-1 rounded-xl border border-slate-100 w-fit">
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
                          className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-navy-50 hover:text-navy-900 border border-slate-100 transition-all active:scale-95 shadow-none"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => deleteUpdate(update._id || update.id)}
                          disabled={actionLoading === (update._id || update.id)}
                          className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-600 border border-slate-100 transition-all active:scale-95 shadow-none"
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
                      <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 text-slate-300">
                        <Bell size={40} />
                      </div>
                      <p className="font-semibold text-slate-400 italic text-sm tracking-tight">
                        No active broadcasts found.
                      </p>
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="h-10 px-6 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-[9px] hover:bg-slate-800 active:scale-95 transition-all"
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
      </div>

      <AlertDialog
        open={showAddModal}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setShowAddModal(false);
            setEditingUpdate(null);
            setNewUpdate({
              title: "",
              content: "",
              link: "",
              isVisible: true,
            });
          }
        }}
      >
        <AlertDialogContent className="max-w-xl p-0 overflow-hidden bg-white border-slate-100 rounded-2xl shadow-2xl">
          <div className="relative">
            {/* Close Button */}
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
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all z-10"
            >
              <X size={20} />
            </button>

            <AlertDialogHeader className="p-8 pb-4 flex flex-col items-center text-center gap-2">
              <AlertDialogTitle className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">
                {editingUpdate ? "Edit Broadcast" : "New Broadcast"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-[14px] font-medium text-slate-500 mt-1 leading-relaxed">
                {editingUpdate
                  ? "Update institutional news for the student dashboard."
                  : "Publish vital news and resources to all students."}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <form onSubmit={handleSaveUpdate} className="px-8 pb-8 space-y-6">
              <div className="space-y-5">
                {/* Title */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Update Title
                  </label>
                  <input
                    required
                    type="text"
                    value={newUpdate.title}
                    onChange={(e) =>
                      setNewUpdate({ ...newUpdate, title: e.target.value })
                    }
                    placeholder="e.g. Semester Registration is Live!"
                    className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-200 focus:border-navy-900 focus:bg-white rounded-xl outline-none font-bold text-slate-900 transition-all placeholder:text-slate-300"
                  />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Broadcast Content
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={newUpdate.content}
                    onChange={(e) =>
                      setNewUpdate({ ...newUpdate, content: e.target.value })
                    }
                    placeholder="Detailed information about the update..."
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-navy-900 focus:bg-white rounded-xl px-6 py-4 font-bold text-slate-900 outline-none transition-all resize-none placeholder:text-slate-300"
                  />
                </div>

                {/* Link */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Resource Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={newUpdate.link}
                    onChange={(e) =>
                      setNewUpdate({ ...newUpdate, link: e.target.value })
                    }
                    placeholder="https://..."
                    className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-200 focus:border-navy-900 focus:bg-white rounded-xl outline-none font-bold text-slate-900 transition-all placeholder:text-slate-300"
                  />
                </div>

                {/* Link Preview Hint */}
                {newUpdate.link && (
                  <div className="p-4 bg-navy-50/50 rounded-xl border border-navy-100">
                    <p className="text-[10px] font-bold text-navy-800 leading-tight text-center">
                      Students will be redirected to this link when they click
                      the broadcast.
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
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
                  className="flex-1 py-3.5 rounded-xl border-2 border-slate-100 text-slate-400 hover:bg-slate-50 font-black uppercase tracking-widest text-[10px] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!!actionLoading}
                  className="flex-[2] py-3.5 rounded-xl bg-navy-900 text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-navy-100 hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {actionLoading === "creating" ||
                  actionLoading === "updating" ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : editingUpdate ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <Plus size={16} />
                  )}
                  {editingUpdate ? "UPDATE BROADCAST" : "PUBLISH NOW"}
                </button>
              </div>
            </form>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
