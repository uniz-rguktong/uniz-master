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
import { UPDATES_BASE, GET_NOTIFICATIONS, BASE_URL } from "../../../api/endpoints";
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
import { SectionHeader } from "../../../components/admin/SectionHeader";
import {
  adminPageWrapClass,
  adminCardClass,
  adminLabelClass,
  adminInputClass,
  adminTextareaClass,
  adminPrimaryButtonClass,
  adminGhostButtonClass,
} from "../../../components/admin/admin-ui";
import { cn } from "../../../utils/cn";

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
    const primaryUrl = `${BASE_URL}/cms/notifications`;
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
    <div className={cn(adminPageWrapClass, "animate-in fade-in duration-700 pb-20")}>
      <SectionHeader
        icon={<Bell size={18} />}
        eyebrow="Campus"
        title="Campus Broadcasts"
        subtitle="Distribute vital institutional news and media resources."
        actions={
          <>
            <button
              onClick={fetchUpdates}
              disabled={loading}
              className={cn(adminGhostButtonClass, "w-11 px-0")}
              title="Refresh Stream"
            >
              <Loader2 size={16} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className={adminPrimaryButtonClass}
            >
              <Plus size={16} /> New Update
            </button>
          </>
        }
      />

      {/* Content Sections */}
      <div className={cn(adminCardClass, "overflow-hidden")}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200/70">
                <th className="px-8 py-4 text-[10px] font-semibold tracking-[0.14em] text-zinc-400">
                  Broadcast Content
                </th>
                <th className="px-8 py-4 text-[10px] font-semibold tracking-[0.14em] text-zinc-400">
                  Resource Link
                </th>
                <th className="px-8 py-4 text-[10px] font-semibold tracking-[0.14em] text-zinc-400">
                  Visibility
                </th>
                <th className="px-8 py-4 text-[10px] font-semibold tracking-[0.14em] text-zinc-400">
                  Distribution Date
                </th>
                <th className="px-8 py-4 text-[10px] font-semibold tracking-[0.14em] text-zinc-400 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                Array(7)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-zinc-100" />
                          <div className="space-y-2">
                            <div className="h-4 w-32 bg-zinc-100 rounded-lg" />
                            <div className="h-2 w-48 bg-zinc-50 rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="h-4 w-20 bg-zinc-50 rounded" />
                      </td>
                      <td className="px-8 py-5">
                        <div className="h-6 w-16 bg-zinc-100 rounded-full" />
                      </td>
                      <td className="px-8 py-5">
                        <div className="space-y-2">
                          <div className="h-4 w-24 bg-zinc-100 rounded-lg" />
                          <div className="h-2 w-16 bg-zinc-50 rounded" />
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex justify-end gap-2">
                          <div className="h-9 w-9 bg-zinc-50 rounded-xl border border-zinc-200/70" />
                          <div className="h-9 w-9 bg-zinc-50 rounded-xl border border-zinc-200/70" />
                        </div>
                      </td>
                    </tr>
                  ))
              ) : updates && updates.length > 0 ? (
                updates.map((update, idx) => (
                  <tr
                    key={update._id || update.id || idx}
                    className="hover:bg-zinc-50/60 transition-colors group"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${update.isVisible ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-400"}`}
                        >
                          <Bell size={16} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <p className="font-semibold text-zinc-900 tracking-tight leading-tight mb-0.5 max-w-[300px] truncate">
                            {update.title}
                          </p>
                          <p className="text-[12px] text-zinc-400 truncate max-w-[400px]">
                            {update.description ||
                              update.content ||
                              "No description provided."}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      {update.link ? (
                        <a
                          href={update.link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
                        >
                          Visit Link
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span className="text-[12px] text-zinc-300">None</span>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      {update.isVisible ? (
                        <div className="inline-flex items-center gap-1.5 text-zinc-700 bg-zinc-50 px-2.5 py-1 rounded-full border border-zinc-200 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="text-[11px] font-medium">Live</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-zinc-400 bg-zinc-50 px-2.5 py-1 rounded-full border border-zinc-200 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                          <span className="text-[11px] font-medium">Draft</span>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <p className="text-[13px] font-medium tracking-tight text-zinc-700 tabular-nums">
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
                        <p className="text-[10px] font-medium text-zinc-400 tracking-[0.12em] mt-0.5">
                          Publication
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(update)}
                          className="h-9 w-9 flex items-center justify-center bg-white text-zinc-400 rounded-xl hover:text-zinc-900 hover:border-zinc-300 border border-zinc-200 transition-all active:scale-95"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => deleteUpdate(update._id || update.id)}
                          disabled={actionLoading === (update._id || update.id)}
                          className="h-9 w-9 flex items-center justify-center bg-white text-zinc-400 rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 border border-zinc-200 transition-all active:scale-95"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 flex items-center justify-center bg-zinc-50 rounded-2xl border border-zinc-200/70 text-zinc-300">
                        <Bell size={32} strokeWidth={1.5} />
                      </div>
                      <p className="text-[14px] font-medium text-zinc-500 tracking-tight">
                        No active broadcasts found.
                      </p>
                      <button
                        onClick={() => setShowAddModal(true)}
                        className={adminPrimaryButtonClass}
                      >
                        <Plus size={15} /> Create First Update
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
        <AlertDialogContent className="max-w-xl p-0 overflow-hidden bg-white border-zinc-200 rounded-2xl shadow-xl">
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
              className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 rounded-full transition-all z-10"
            >
              <X size={20} />
            </button>

            <AlertDialogHeader className="p-8 pb-3 flex flex-col items-start text-left gap-1.5">
              <AlertDialogTitle className="text-[20px] font-semibold text-zinc-900 tracking-[-0.01em]">
                {editingUpdate ? "Edit Broadcast" : "New Broadcast"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-[13px] text-zinc-500 leading-relaxed">
                {editingUpdate
                  ? "Update institutional news for the student dashboard."
                  : "Publish vital news and resources to all students."}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <form onSubmit={handleSaveUpdate} className="px-8 pb-8 space-y-6">
              <div className="space-y-5">
                {/* Title */}
                <div className="space-y-2">
                  <label className={adminLabelClass}>Update Title</label>
                  <input
                    required
                    type="text"
                    value={newUpdate.title}
                    onChange={(e) =>
                      setNewUpdate({ ...newUpdate, title: e.target.value })
                    }
                    placeholder="e.g. Semester Registration is Live!"
                    className={adminInputClass}
                  />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <label className={adminLabelClass}>Broadcast Content</label>
                  <textarea
                    required
                    rows={3}
                    value={newUpdate.content}
                    onChange={(e) =>
                      setNewUpdate({ ...newUpdate, content: e.target.value })
                    }
                    placeholder="Detailed information about the update..."
                    className={adminTextareaClass}
                  />
                </div>

                {/* Link */}
                <div className="space-y-2">
                  <label className={adminLabelClass}>
                    Resource Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={newUpdate.link}
                    onChange={(e) =>
                      setNewUpdate({ ...newUpdate, link: e.target.value })
                    }
                    placeholder="https://..."
                    className={adminInputClass}
                  />
                </div>

                {/* Link Preview Hint */}
                {newUpdate.link && (
                  <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200/70">
                    <p className="text-[12px] font-medium text-zinc-500 leading-relaxed">
                      Students will be redirected to this link when they click
                      the broadcast.
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
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
                  className={cn(adminGhostButtonClass, "flex-1")}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!!actionLoading}
                  className={cn(adminPrimaryButtonClass, "flex-[2]")}
                >
                  {actionLoading === "creating" ||
                  actionLoading === "updating" ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : editingUpdate ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <Plus size={16} />
                  )}
                  {editingUpdate ? "Update Broadcast" : "Publish Now"}
                </button>
              </div>
            </form>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
