/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  Image as ImageIcon,
  Plus,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  Edit3,
  Trash2,
  Upload,
} from "lucide-react";
import { BANNERS_BASE, UPDATE_BANNER_VISIBILITY } from "../../../api/endpoints";
import { toast } from "@/utils/toast-ref";
import { useRecoilState } from "recoil";
import { bannersAtom } from "../../../store/atoms";
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
  adminCardHoverClass,
  adminLabelClass,
  adminInputClass,
  adminTextareaClass,
  adminPrimaryButtonClass,
  adminGhostButtonClass,
} from "../../../components/admin/admin-ui";
import { cn } from "../../../utils/cn";

const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

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

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      toast.error("Cloudinary configuration missing");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );
      const data = await res.json();
      if (data.secure_url) {
        setNewBanner((prev) => ({ ...prev, imageUrl: data.secure_url }));
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
    <div className={cn(adminPageWrapClass, "animate-in fade-in duration-700 pb-20")}>
      <SectionHeader
        icon={<ImageIcon size={18} />}
        eyebrow="Campus"
        title="Banner Management"
        subtitle="Create and control featured spotlight content for student portals."
        actions={
          <button
            onClick={() => setShowAddModal(true)}
            className={adminPrimaryButtonClass}
          >
            <Plus size={16} /> New Banner
          </button>
        }
      />

      {/* Banners Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(adminCardClass, "overflow-hidden flex flex-col animate-pulse")}
            >
              <div className="h-44 w-full bg-zinc-100 border-b border-zinc-200/70" />
              <div className="p-6 space-y-5">
                <div className="space-y-3">
                  <div className="h-5 w-3/4 bg-zinc-100 rounded-lg" />
                  <div className="h-3 w-full bg-zinc-50 rounded-md" />
                  <div className="h-3 w-5/6 bg-zinc-50 rounded-md" />
                </div>
                <div className="pt-4 flex items-center gap-2">
                  <div className="h-10 flex-1 bg-zinc-50 rounded-xl" />
                  <div className="h-10 w-10 bg-zinc-50 rounded-xl" />
                  <div className="h-10 w-10 bg-zinc-50 rounded-xl" />
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
                className={cn(adminCardClass, adminCardHoverClass, "overflow-hidden flex flex-col group relative")}
              >
                {/* Preview Image */}
                <div className="h-44 w-full bg-zinc-100 relative overflow-hidden shrink-0 border-b border-zinc-200/70">
                  {banner.imageUrl ? (
                    <img
                      src={banner.imageUrl}
                      alt={banner.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-300">
                      <ImageIcon size={40} strokeWidth={1} />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div
                    className={`absolute top-3.5 right-3.5 px-2.5 py-1 rounded-full text-[10px] font-medium tracking-tight flex items-center gap-1.5 border backdrop-blur-md ${banner.isVisible ? "bg-white/90 text-zinc-700 border-zinc-200" : "bg-white/90 text-zinc-400 border-zinc-200"}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${banner.isVisible ? "bg-emerald-500" : "bg-zinc-300"}`}
                    />
                    {banner.isVisible ? "Active" : "Hidden"}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-semibold text-zinc-900 text-[15px] leading-tight mb-1.5 line-clamp-1">
                    {banner.title}
                  </h3>
                  <p className="text-zinc-500 text-[13px] line-clamp-2 leading-relaxed mb-5">
                    {banner.text}
                  </p>

                  <div className="mt-auto flex items-center gap-2">
                    <button
                      onClick={() => toggleVisibilityAction(banner)}
                      disabled={actionLoading === bannerId}
                      className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl border border-zinc-200 bg-white text-zinc-600 text-[12px] font-semibold hover:text-zinc-900 hover:border-zinc-300 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {actionLoading === bannerId ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : banner.isVisible ? (
                        <EyeOff size={13} />
                      ) : (
                        <Eye size={13} />
                      )}
                      {banner.isVisible ? "Hide" : "Show"}
                    </button>
                    <button
                      onClick={() => handleEditClick(banner)}
                      className="h-10 w-10 flex items-center justify-center bg-white text-zinc-400 rounded-xl hover:text-zinc-900 hover:border-zinc-300 border border-zinc-200 transition-all active:scale-95"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => deleteBanner(bannerId)}
                      disabled={actionLoading === bannerId}
                      className="h-10 w-10 flex items-center justify-center bg-white text-zinc-400 rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 border border-zinc-200 transition-all active:scale-95"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={cn(adminCardClass, "py-24 flex flex-col items-center justify-center text-center space-y-6")}>
          <div className="w-16 h-16 bg-zinc-50 border border-zinc-200/70 rounded-2xl flex items-center justify-center text-zinc-300">
            <ImageIcon size={32} strokeWidth={1.5} />
          </div>
          <div className="space-y-1.5">
            <p className="text-[17px] font-semibold text-zinc-900 tracking-tight">
              No Active Banners
            </p>
            <p className="text-zinc-500 max-w-sm text-[13px] leading-relaxed">
              Bring your campus to life by creating featured banners for events,
              announcements, or updates.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className={adminPrimaryButtonClass}
          >
            <Plus size={16} /> Add First Banner
          </button>
        </div>
      )}

      <AlertDialog
        open={showAddModal}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setShowAddModal(false);
            setEditingBanner(null);
            setNewBanner({
              title: "",
              text: "",
              imageUrl: "",
              isVisible: true,
            });
          }
        }}
      >
        <AlertDialogContent className="max-w-md p-0 overflow-hidden bg-white border-zinc-200 rounded-2xl shadow-xl">
          <div className="relative">
            {/* Close Button */}
            <button
              type="button"
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
              className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 rounded-full transition-all z-10"
            >
              <X size={20} />
            </button>

            <form onSubmit={handleSaveBanner} className="p-8">
              {/* Header */}
              <AlertDialogHeader className="flex flex-col items-start text-left gap-1.5 mb-7">
                <AlertDialogTitle className="text-[20px] font-semibold text-zinc-900 tracking-[-0.01em]">
                  {editingBanner ? "Edit Banner" : "New Banner"}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-[13px] text-zinc-500 leading-relaxed">
                  {editingBanner
                    ? "Update your featured spotlight content."
                    : "Configure a new spotlight for the student portal."}
                </AlertDialogDescription>
              </AlertDialogHeader>

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
                      className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
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
                  <div className="h-24 w-full rounded-xl overflow-hidden border border-zinc-200 relative group">
                    <img
                      src={newBanner.imageUrl}
                      alt="preview"
                      className="w-full h-full object-cover"
                      onError={(e: any) =>
                        (e.target.src =
                          "https://placehold.co/600x400?text=Invalid+URL")
                      }
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-[10px] font-semibold text-white tracking-[0.14em]">
                        Current Selection
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-8">
                <button
                  type="button"
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
                  ) : editingBanner ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <Plus size={16} />
                  )}
                  {editingBanner ? "Update Banner" : "Launch Banner"}
                </button>
              </div>
            </form>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
