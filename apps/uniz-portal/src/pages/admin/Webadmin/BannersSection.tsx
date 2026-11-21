/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  Image as ImageIcon,
  Plus,
  Loader2,
  Upload,
} from "lucide-react";
import { BANNERS_BASE, UPDATE_BANNER_VISIBILITY } from "../../../api/endpoints";
import { toast } from "@/utils/toast-ref";
import { useRecoilState } from "recoil";
import { bannersAtom } from "../../../store/atoms";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { AdminDialog } from "@/components/admin/AdminDialog";
import {
  adminPageWrapClass,
  adminCardClass,
  adminCardHoverClass,
  adminLabelClass,
  adminInputClass,
  adminTextareaClass,
} from "../../../components/admin/admin-ui";
import { cn } from "../../../utils/cn";
import { uploadImage } from "../../../api/uploadImage";
import { WebsiteEditorLink } from "./WebsiteEditorLink";

export default function BannersSection() {
  const [bannersState, setBannersState] = useRecoilState(bannersAtom);
  const banners = bannersState.data;
  const [loading, setLoading] = useState(!bannersState.fetched);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // New Banner Form State
  const [newBanner, setNewBanner] = useState({
    title: "",
    text: "",
    imageUrl: "",
    isVisible: true,
  });
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBanners();
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

  const fetchBanners = async () => {
    if (!bannersState.fetched) setLoading(true);
    const token = getAuthToken();
    try {
      const res = await fetch(BANNERS_BASE, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setBannersState({
          fetched: true,
          data: data.banners || [],
        });
      } else {
        toast.error(data.msg || "Failed to fetch banners");
      }
    } catch (error) {
      toast.error("Error connecting to banner service");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const imageUrl = await uploadImage(file, "banner");
      if (imageUrl) {
        setNewBanner((prev) => ({ ...prev, imageUrl }));
        toast.success("Image uploaded successfully");
      } else {
        toast.error("Upload failed");
      }
    } catch (error) {
      toast.error("Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(editingBanner ? "updating" : "creating");
    const token = getAuthToken();
    try {
      const url = editingBanner
        ? `${BANNERS_BASE}/${editingBanner.id || editingBanner._id}`
        : BANNERS_BASE;
      const method = editingBanner ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newBanner),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          editingBanner
            ? "Banner updated successfully"
            : "Banner created successfully",
        );
        setShowAddModal(false);
        setEditingBanner(null);
        setNewBanner({ title: "", text: "", imageUrl: "", isVisible: true });
        fetchBanners();
      } else {
        toast.error(data.msg || "Operation failed");
      }
    } catch (error) {
      toast.error("Error saving banner");
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditClick = (banner: any) => {
    setEditingBanner(banner);
    setNewBanner({
      title: banner.title,
      text: banner.text,
      imageUrl: banner.imageUrl,
      isVisible: banner.isVisible,
    });
    setShowAddModal(true);
  };

  const deleteBanner = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this banner permanently?",
      )
    )
      return;
    setActionLoading(id);
    const token = getAuthToken();
    try {
      const res = await fetch(`${BANNERS_BASE}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Banner deleted successfully");
        setBannersState((prev) => ({
          ...prev,
          data: prev.data.filter((b) => (b.id || b._id || b.uuid) !== id),
        }));
      } else {
        toast.error(data.msg || "Deletion failed");
      }
    } catch (error) {
      toast.error("Error deleting banner");
    } finally {
      setActionLoading(null);
    }
  };

  const toggleVisibilityAction = async (banner: any) => {
    const id = banner.id || banner._id || banner.uuid;
    const newVisibility = !banner.isVisible;
    setActionLoading(id);
    const token = getAuthToken();
    try {
      const res = await fetch(UPDATE_BANNER_VISIBILITY(id), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isVisible: newVisibility }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          newVisibility
            ? "Banner is now visible"
            : "Banner hidden successfully",
        );
        setBannersState((prev) => ({
          ...prev,
          data: prev.data.map((b) =>
            b.id === id || b._id === id || b.uuid === id
              ? { ...b, isVisible: newVisibility }
              : b,
          ),
        }));
      } else {
        toast.error(data.msg || "Failed to update visibility");
      }
    } catch (error) {
      toast.error("Error connecting to visibility service");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div
      className={cn(
        adminPageWrapClass,
        "animate-in fade-in duration-700 pb-20",
      )}
    >
      <PageHeader
        title="Banner management"
        meta="Create and control featured spotlight content for student portals."
        action={
          <Button type="button" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> New banner
          </Button>
        }
      />
      <WebsiteEditorLink />

      {/* Banners Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                adminCardClass,
                "overflow-hidden flex flex-col animate-pulse",
              )}
            >
              <div className="h-44 w-full bg-surface-2 border-b border-border/70" />
              <div className="p-6 space-y-5">
                <div className="space-y-3">
                  <div className="h-5 w-3/4 bg-surface-2 rounded-lg" />
                  <div className="h-3 w-full bg-surface-2 rounded-md" />
                  <div className="h-3 w-5/6 bg-surface-2 rounded-md" />
                </div>
                <div className="pt-4 flex items-center gap-2">
                  <div className="h-10 flex-1 bg-surface-2 rounded-xl" />
                  <div className="h-10 w-10 bg-surface-2 rounded-xl" />
                  <div className="h-10 w-10 bg-surface-2 rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : banners.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((banner) => {
            const bannerId = banner.id || banner._id || banner.uuid;
            return (
              <div
                key={bannerId}
                className={cn(
                  adminCardClass,
                  adminCardHoverClass,
                  "overflow-hidden flex flex-col group relative",
                )}
              >
                {/* Preview Image */}
                <div className="h-44 w-full bg-surface-2 relative overflow-hidden shrink-0 border-b border-border/70">
                  {banner.imageUrl ? (
                    <img
                      src={banner.imageUrl}
                      alt={banner.title}
                      className="w-full h-full object-cover transition-transform duration-1000"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-3">
                      <ImageIcon size={20} />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3.5 right-3.5">
                    <Badge tone={banner.isVisible ? "success" : "neutral"}>
                      {banner.isVisible ? "Active" : "Hidden"}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-semibold text-text text-[15px] leading-tight mb-1.5 line-clamp-1">
                    {banner.title}
                  </h3>
                  <p className="text-text-2 text-[13px] line-clamp-2 leading-relaxed mb-5">
                    {banner.text}
                  </p>

                  <div className="mt-auto flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      size="compact"
                      onClick={() => toggleVisibilityAction(banner)}
                      disabled={actionLoading === bannerId}
                      isLoading={actionLoading === bannerId}
                    >
                      {banner.isVisible ? "Hide" : "Show"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="compact"
                      onClick={() => handleEditClick(banner)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="compact"
                      onClick={() => deleteBanner(bannerId)}
                      disabled={actionLoading === bannerId}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No active banners"
          body="Create a featured banner for events, announcements, or updates."
          action={
            <Button type="button" onClick={() => setShowAddModal(true)}>
              Add first banner
            </Button>
          }
        />
      )}

      <AdminDialog
        open={showAddModal}
        onOpenChange={(open: boolean) => {
          setShowAddModal(open);
          if (!open) {
            setEditingBanner(null);
            setNewBanner({
              title: "",
              text: "",
              imageUrl: "",
              isVisible: true,
            });
          }
        }}
        maxWidth="max-w-[640px]"
        title={editingBanner ? "Edit banner" : "New banner"}
        description={
          editingBanner
            ? "Update your featured spotlight content."
            : "Configure a new spotlight for the student portal."
        }
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                setEditingBanner(null);
                setNewBanner({
                  title: "",
                  text: "",
                  imageUrl: "",
                  isVisible: true,
                });
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="banner-editor-form"
              disabled={!!actionLoading}
              isLoading={actionLoading === "creating" || actionLoading === "updating"}
            >
              {editingBanner ? "Update banner" : "Launch banner"}
            </Button>
          </>
        }
      >
            <form id="banner-editor-form" onSubmit={handleSaveBanner} className="space-y-5">
              <div className="space-y-5">
                {/* Title */}
                <div className="space-y-2">
                  <label className={adminLabelClass}>Banner Title</label>
                  <input
                    required
                    type="text"
                    value={newBanner.title}
                    onChange={(e) =>
                      setNewBanner({ ...newBanner, title: e.target.value })
                    }
                    placeholder="e.g. UniZ v2.0 is Live!"
                    className={adminInputClass}
                  />
                </div>

                {/* Text */}
                <div className="space-y-2">
                  <label className={adminLabelClass}>Body Content</label>
                  <textarea
                    required
                    rows={3}
                    value={newBanner.text}
                    onChange={(e) =>
                      setNewBanner({ ...newBanner, text: e.target.value })
                    }
                    placeholder="Briefly describe what this banner is about..."
                    className={adminTextareaClass}
                  />
                </div>

                {/* Image URL & Upload */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className={adminLabelClass}>Banner Image</label>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-1.5 text-caption font-semibold text-text-2 hover:text-text transition-colors"
                    >
                      {uploading ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Upload size={12} />
                      )}
                      {uploading ? "Uploading…" : "Upload file"}
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      className="hidden"
                      accept="image/*"
                    />
                  </div>

                  <input
                    required
                    type="url"
                    value={newBanner.imageUrl}
                    onChange={(e) =>
                      setNewBanner({ ...newBanner, imageUrl: e.target.value })
                    }
                    placeholder="Or paste image URL (https://...)"
                    className={adminInputClass}
                  />
                </div>

                {/* Image Preview */}
                {newBanner.imageUrl && (
                  <div className="h-24 w-full overflow-hidden rounded-lg border border-border">
                    <img
                      src={newBanner.imageUrl}
                      alt="preview"
                      className="w-full h-full object-cover"
                      onError={(e: any) =>
                        (e.target.src =
                          "https://placehold.co/600x400?text=Invalid+URL")
                      }
                    />
                  </div>
                )}
              </div>

            </form>
      </AdminDialog>
    </div>
  );
}
