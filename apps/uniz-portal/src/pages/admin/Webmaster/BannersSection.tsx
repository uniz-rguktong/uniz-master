/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  Image as ImageIcon,
  Plus,
  Loader2,
  Eye,
  EyeOff,
  Type,
  AlignLeft,
  Link,
  CheckCircle2,
  X,
  Edit3,
  Trash2,
} from "lucide-react";
import { BANNERS_BASE, UPDATE_BANNER_VISIBILITY } from "../../../api/endpoints";
import { toast } from "react-toastify";

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
          className="h-11 px-6 bg-blue-600 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={16} /> New Banner
        </button>
      </div>

      {/* Banners Grid */}
      {loading ? (
        <div className="p-20 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="animate-spin w-10 h-10 text-slate-300" />
          <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">
            Loading banners...
          </p>
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
                      className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-50 hover:text-blue-600 border border-slate-100 transition-all active:scale-95"
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

      {/* Add Banner Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
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
          />
          <div className="bg-white w-full max-w-xl rounded-xl relative overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
            <div
              className={`${editingBanner ? "bg-slate-900" : "bg-blue-600"} p-8 text-white relative flex items-center gap-5 transition-colors duration-500`}
            >
              <div className="p-3.5 bg-white/20 rounded-xl">
                {editingBanner ? <Edit3 size={26} /> : <Plus size={26} />}
              </div>
              <div>
                <h3 className="text-2xl font-semibold tracking-[-0.02em]">
                  {editingBanner ? "Edit Banner" : "New Banner"}
                </h3>
                <p className="text-white/70 text-[10px] font-semibold uppercase tracking-[0.2em] mt-1.5">
                  Configure Spotlight Content
                </p>
              </div>
              <button
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
                className="absolute top-8 right-8 text-white/60 hover:text-white transition-colors"
              >
                <X size={26} />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="p-10 space-y-8">
              <div className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                    <Type size={14} /> Banner Title
                  </label>
                  <input
                    required
                    type="text"
                    value={newBanner.title}
                    onChange={(e) =>
                      setNewBanner({ ...newBanner, title: e.target.value })
                    }
                    placeholder="e.g. UniZ v2.0 is Live!"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-semibold text-slate-900"
                  />
                </div>

                {/* Text */}
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                    <AlignLeft size={14} /> Body Content
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={newBanner.text}
                    onChange={(e) =>
                      setNewBanner({ ...newBanner, text: e.target.value })
                    }
                    placeholder="Briefly describe what this banner is about..."
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-semibold text-slate-900 resize-none"
                  />
                </div>

                {/* Image URL */}
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                    <Link size={14} /> Image URL
                  </label>
                  <input
                    required
                    type="url"
                    value={newBanner.imageUrl}
                    onChange={(e) =>
                      setNewBanner({ ...newBanner, imageUrl: e.target.value })
                    }
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-semibold text-slate-900"
                  />
                </div>

                {/* Preview mini */}
                {newBanner.imageUrl && (
                  <div className="h-24 w-full rounded-xl overflow-hidden border border-slate-200">
                    <img
                      src={newBanner.imageUrl}
                      alt="preview"
                      className="w-full h-full object-cover"
                      onError={(e: any) =>
                      (e.target.src =
                        "https://placehold.co/600x400?text=Invalid+Image+URL")
                      }
                    />
                  </div>
                )}
              </div>

              <button
                disabled={!!actionLoading}
                type="submit"
                className={`w-full ${editingBanner ? "bg-slate-900" : "bg-blue-600"} text-white py-5 rounded-xl font-semibold uppercase tracking-[0.2em] text-[11px] hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95`}
              >
                {actionLoading === "creating" ||
                  actionLoading === "updating" ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : editingBanner ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <Plus size={18} />
                )}
                {editingBanner ? "Update Banner" : "Launch Banner"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
