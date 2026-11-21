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
  adminLabelClass,
  adminInputClass,
  adminTextareaClass,
  adminPrimaryButtonClass,
  adminGhostButtonClass,
} from "../../../components/admin/admin-ui";
import { cn } from "../../../utils/cn";
import { Table } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
            <Button type="button" variant="ghost" size="icon" onClick={fetchUpdates} disabled={loading} title="Refresh Stream">
              <Loader2 size={16} className={loading ? "animate-spin" : ""} />
            </Button>
            <Button type="button" onClick={() => setShowAddModal(true)}>
              <Plus size={16} /> New Update
            </Button>
          </>
        }
      />

      {loading ? (
        <p className="text-body text-text-2">Loading broadcasts…</p>
      ) : (
        <Table
          rows={updates || []}
          getRowId={(update) => String(update._id || update.id || update.title)}
          empty={
            <EmptyState
              title="No active broadcasts found."
              icon={Bell}
              action={
                <Button type="button" variant="outline" onClick={() => setShowAddModal(true)}>
                  <Plus size={16} /> Create First Update
                </Button>
              }
            />
          }
          columns={[
            {
              id: "content",
              header: "Broadcast",
              primary: true,
              cell: (update) => (
                <span>
                  <span className="block font-semibold text-head">{update.title}</span>
                  <span className="mt-0.5 block text-small text-text-2 line-clamp-1">
                    {update.description || update.content || "No description provided."}
                  </span>
                  <span className="mt-2 flex gap-2 sm:hidden">
                    <Button type="button" variant="ghost" size="compact" onClick={() => handleEditClick(update)}>
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="compact"
                      disabled={actionLoading === (update._id || update.id)}
                      onClick={() => deleteUpdate(update._id || update.id)}
                    >
                      Delete
                    </Button>
                  </span>
                </span>
              ),
            },
            {
              id: "link",
              header: "Link",
              meta: true,
              cell: (update) =>
                update.link ? (
                  <a href={update.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-small font-semibold text-link">
                    Visit link <ExternalLink size={14} aria-hidden />
                  </a>
                ) : (
                  "None"
                ),
            },
            {
              id: "visibility",
              header: "Visibility",
              meta: true,
              cell: (update) =>
                update.isVisible ? <Badge tone="success">Live</Badge> : <Badge tone="neutral">Draft</Badge>,
            },
            {
              id: "date",
              header: "Published",
              cell: (update) => (
                <span className="tabular-nums">
                  {update.createdAt
                    ? new Date(update.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                    : "Today"}
                </span>
              ),
            },
            {
              id: "actions",
              header: "Actions",
              label: "Actions",
              cell: (update) => (
                <span className="flex items-center gap-2">
                  <Button type="button" variant="ghost" size="icon" aria-label="Edit broadcast" onClick={() => handleEditClick(update)}>
                    <Edit3 size={16} />
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    aria-label="Delete broadcast"
                    disabled={actionLoading === (update._id || update.id)}
                    onClick={() => deleteUpdate(update._id || update.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </span>
              ),
            },
          ]}
        />
      )}

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
        <AlertDialogContent className="max-w-xl p-0 overflow-hidden bg-surface border-border rounded-lg border border-border/60">
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
              className="absolute top-5 right-5 p-2 text-text-3 hover:text-text hover:bg-surface-2 rounded-md transition-[color,background-color,border-color,opacity,transform,box-shadow] z-10"
            >
              <X size={20} />
            </button>

            <AlertDialogHeader className="p-8 pb-3 flex flex-col items-start text-left gap-1.5">
              <AlertDialogTitle className="font-serif text-[24px] font-normal leading-8 text-head">
                {editingUpdate ? "Edit Broadcast" : "New Broadcast"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-small text-text-2 leading-relaxed">
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
                  <div className="p-3.5 bg-surface-2 rounded-xl border border-border/70">
                    <p className="text-caption font-medium text-text-2 leading-relaxed">
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
