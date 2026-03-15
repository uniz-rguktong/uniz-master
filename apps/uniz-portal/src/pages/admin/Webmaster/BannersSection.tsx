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
import { 
  AlertDialog, 
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";

const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

export default function BannersSection() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
    setLoading(true);
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
        setBanners(data.banners || []);
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
        }
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
        setBanners((prev) =>
          prev.filter((b) => (b.id || b._id || b.uuid) !== id),
        );
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
        setBanners((prev) =>
          prev.map((b) =>
            b.id === id || b._id === id || b.uuid === id
              ? { ...b, isVisible: newVisibility }
              : b,
          ),
        );
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
    <div className="p-6 space-y-6 animate-in fade-in duration-700 pb-20 text-slate-900">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-3xl font-semibold tracking-[-0.02em] text-slate-900 leading-none">
            Banner Management
          </h2>
          <p className="text-slate-500 font-medium text-[15px]">
            Create and control featured spotlight content for student portals.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="h-11 px-6 bg-navy-900 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-navy-800 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={16} /> New Banners
        </button>
      </div>

      {/* Banners Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col animate-pulse shadow-sm">
              <div className="h-44 w-full bg-slate-100/50 border-b border-slate-100 relative overflow-hidden" />
              <div className="p-7 space-y-5">
                <div className="space-y-3">
                  <div className="h-5 w-3/4 bg-slate-100 rounded-lg shadow-sm" />
                  <div className="h-3 w-full bg-slate-50 rounded-md opacity-60" />
                  <div className="h-3 w-5/6 bg-slate-50 rounded-md opacity-40" />
                </div>
                <div className="pt-4 flex items-center gap-3">
                  <div className="h-11 flex-1 bg-slate-50 rounded-xl border border-slate-100/50" />
                  <div className="h-11 w-11 bg-slate-50 rounded-xl border border-slate-100/50" />
                  <div className="h-11 w-11 bg-slate-50 rounded-xl border border-slate-100/50" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : banners.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {banners.map((banner) => {
            const bannerId = banner.id || banner._id || banner.uuid;
            return (
              <div
                key={bannerId}
                className="bg-white rounded-xl border border-slate-100 hover:translate-y-[-4px] transition-all overflow-hidden flex flex-col group relative"
              >
                {/* Preview Image */}
                <div className="h-44 w-full bg-slate-50 relative overflow-hidden shrink-0 border-b border-slate-100">
                  {banner.imageUrl ? (
                    <img
                      src={banner.imageUrl}
                      alt={banner.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <ImageIcon size={40} strokeWidth={1} />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div
                    className={`absolute top-4 right-4 px-3 py-1.5 rounded-xl text-[10px] font-semibold uppercase tracking-widest flex items-center gap-1.5 border backdrop-blur-md ${banner.isVisible ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-500 border-slate-200"}`}
                  >
                    {banner.isVisible ? (
                      <Eye size={12} />
                    ) : (
                      <EyeOff size={12} />
                    )}
                    {banner.isVisible ? "Active" : "Hidden"}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="font-semibold text-slate-900 text-[17px] leading-tight mb-2 line-clamp-1">
                    {banner.title}
                  </h3>
                  <p className="text-slate-500 font-medium text-[13px] line-clamp-2 leading-relaxed mb-6">
                    {banner.text}
                  </p>

                  <div className="mt-auto flex items-center gap-2">
                    <button
                      onClick={() => toggleVisibilityAction(banner)}
                      disabled={actionLoading === bannerId}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full font-bold uppercase tracking-widest text-[9px] transition-all border ${banner.isVisible
                        ? "bg-red-50 text-red-600 border-red-100 hover:bg-red-600 hover:text-white"
                        : "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white"
                        } active:scale-95 disabled:opacity-50`}
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
                      className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-navy-50 hover:text-navy-900 border border-slate-100 transition-all active:scale-95"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => deleteBanner(bannerId)}
                      disabled={actionLoading === bannerId}
                      className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-600 border border-slate-100 transition-all active:scale-95"
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
        <div className="p-32 flex flex-col items-center justify-center text-center space-y-7 bg-white rounded-xl border border-slate-100">
          <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-300">
            <ImageIcon size={48} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-900 tracking-tight">
              No Active Banners
            </p>
            <p className="text-slate-400 font-medium mt-2 max-w-sm text-[15px]">
              Bring your campus to life by creating featured banners for events,
              announcements, or updates.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="uniz-primary-btn px-8"
          >
            Add First Banner
          </button>
        </div>
      )}

      <AlertDialog 
        open={showAddModal} 
        onOpenChange={(open: boolean) => {
          if (!open) {
            setShowAddModal(false);
            setEditingBanner(null);
            setNewBanner({ title: "", text: "", imageUrl: "", isVisible: true });
          }
        }}
      >
        <AlertDialogContent className="max-w-md p-0 overflow-hidden bg-white border-slate-100 rounded-2xl shadow-2xl">
          <div className="relative">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setEditingBanner(null);
                setNewBanner({ title: "", text: "", imageUrl: "", isVisible: true });
              }}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all z-10"
            >
              <X size={20} />
            </button>

            <form onSubmit={handleSaveBanner} className="p-8">
              {/* Header */}
              <AlertDialogHeader className="flex flex-col items-center text-center gap-2 mb-8">
                <AlertDialogTitle className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">
                  {editingBanner ? "Edit Banner" : "New Banner"}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-[14px] font-medium text-slate-500 mt-1 leading-relaxed">
                  {editingBanner
                    ? "Update your featured spotlight content."
                    : "Configure a new spotlight for the student portal."}
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="space-y-5">
                {/* Title */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Banner Title
                  </label>
                  <input
                    required
                    type="text"
                    value={newBanner.title}
                    onChange={(e) =>
                      setNewBanner({ ...newBanner, title: e.target.value })
                    }
                    placeholder="e.g. UniZ v2.0 is Live!"
                    className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-200 focus:border-navy-900 focus:bg-white rounded-xl outline-none font-bold text-slate-900 transition-all placeholder:text-slate-300"
                  />
                </div>

                {/* Text */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Body Content
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={newBanner.text}
                    onChange={(e) =>
                      setNewBanner({ ...newBanner, text: e.target.value })
                    }
                    placeholder="Briefly describe what this banner is about..."
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-navy-900 focus:bg-white rounded-xl px-6 py-4 font-bold text-slate-900 outline-none transition-all resize-none placeholder:text-slate-300"
                  />
                </div>

                {/* Image URL & Upload */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Banner Image
                    </label>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-2 text-[10px] font-bold text-navy-900 hover:text-black transition-colors"
                    >
                      {uploading ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Upload size={12} />
                      )}
                      {uploading ? "UPLOADING..." : "UPLOAD FILE"}
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      className="hidden"
                      accept="image/*"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <input
                      required
                      type="url"
                      value={newBanner.imageUrl}
                      onChange={(e) =>
                        setNewBanner({ ...newBanner, imageUrl: e.target.value })
                      }
                      placeholder="Or paste image URL (https://...)"
                      className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-200 focus:border-navy-900 focus:bg-white rounded-xl outline-none font-bold text-slate-900 transition-all placeholder:text-slate-300"
                    />
                  </div>
                </div>

                {/* Image Preview */}
                {newBanner.imageUrl && (
                  <div className="h-24 w-full rounded-xl overflow-hidden border-2 border-slate-100 relative group">
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
                       <p className="text-[10px] font-bold text-white uppercase tracking-widest">Current Selection</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-10">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingBanner(null);
                    setNewBanner({ title: "", text: "", imageUrl: "", isVisible: true });
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
                  {actionLoading === "creating" || actionLoading === "updating" ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : editingBanner ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <Plus size={16} />
                  )}
                  {editingBanner ? "UPDATE BANNER" : "LAUNCH BANNER"}
                </button>
              </div>
            </form>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
