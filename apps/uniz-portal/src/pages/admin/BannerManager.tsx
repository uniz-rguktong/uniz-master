import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/utils/toast-ref";
import { apiClient } from "../../api/apiClient";
import { BASE_URL } from "../../api/endpoints";
import { uploadImage } from "../../api/uploadImage";
import {
  Trash2,
  PlusCircle,
  Eye,
  GripVertical,
  Image as ImageIcon,
  LayoutDashboard,
  ArrowLeft,
  Upload,
  EyeOff,
  X,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "../../utils/cn";
import {
  adminModalShellClass,
  adminModalTitleClass,
  adminModalDescClass,
  adminLabelClass,
  adminInputClass,
  adminTextareaClass,
  adminPrimaryButtonClass,
  adminGhostButtonClass,
} from "../../components/admin/admin-ui";

type Banner = {
  id: string;
  text: string;
  imageUrl: string;
  isPublished: boolean;
  title: string;
};

function SortableBannerCard({
  banner,
  deleteBanner,
  publishBanner,
}: {
  banner: Banner;
  deleteBanner: (id: string) => void;
  publishBanner: (id: string, publish: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: banner.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative bg-white border border-zinc-200 shadow-sm hover:shadow-md rounded-xl overflow-hidden transition-all duration-200"
    >
      <div className="relative aspect-video bg-zinc-100">
        <img
          src={banner.imageUrl}
          alt={banner.title}
          className="h-full w-full object-cover"
        />
        <div
          {...attributes}
          {...listeners}
          className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm p-1.5 rounded-lg cursor-grab shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white text-zinc-600"
        >
          <GripVertical className="w-5 h-5" />
        </div>
        <div className="absolute top-3 right-3">
          <span
            className={cn(
              "px-2 py-1 text-xs font-bold tracking-wide rounded-md backdrop-blur-md shadow-sm border",
              banner.isPublished
                ? "bg-emerald-500/90 text-white border-emerald-400"
                : "bg-zinc-500/90 text-white border-zinc-400",
            )}
          >
            {banner.isPublished ? "Published" : "Draft"}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-bold text-zinc-900 mb-1 line-clamp-1">
          {banner.title}
        </h3>
        <p className="text-zinc-500 text-sm line-clamp-2 min-h-[40px]">
          {banner.text}
        </p>

        <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-100">
          <button
            onClick={() => publishBanner(banner.id, !banner.isPublished)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors border",
              banner.isPublished
                ? "bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
            )}
          >
            {banner.isPublished ? (
              <>
                <EyeOff className="w-4 h-4" /> Unpublish
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" /> Publish
              </>
            )}
          </button>
          <button
            onClick={() => deleteBanner(banner.id)}
            className="flex items-center justify-center p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Banner"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BannerManager() {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchBanners = async () => {
    try {
      const data = await apiClient<any>(`${BASE_URL}/admin/banners`);
      if (data && data.success) setBanners(data.banners);
    } catch (err) {
      console.error("fetchBanners error:", err);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const addBanner = async () => {
    if (!title || !text || !image) {
      toast.error("Title, Text and Image are required");
      return;
    }
    setLoading(true);
    try {
      const imageUrl = await uploadImage(image, "banner");
      if (!imageUrl) {
        toast.error("Image upload failed");
        return;
      }
      const data = await apiClient<any>(`${BASE_URL}/admin/banners`, {
        method: "POST",
        body: JSON.stringify({ title, text, imageUrl }),
      });
      if (data && data.success) {
        setText("");
        setTitle("");
        setImage(null);
        fetchBanners();
        setShowAddModal(false);
        toast.success("Banner added successfully");
      }
    } catch (err) {
      console.error("addBanner error:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteBanner = async (id: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;
    try {
      const data = await apiClient<any>(`${BASE_URL}/admin/banners/${id}`, {
        method: "DELETE",
      });
      if (data && data.success) {
        toast.success("Banner deleted");
        fetchBanners();
      }
    } catch (err) {
      console.error("deleteBanner error:", err);
    }
  };

  const publishBanner = async (id: string, publish: boolean) => {
    try {
      const data = await apiClient<any>(
        `${BASE_URL}/admin/banners/${id}/publish`,
        {
          method: "POST",
          body: JSON.stringify({ publish }),
        },
      );
      if (data && data.success) {
        toast.success(publish ? "Banner published" : "Banner unpublished");
        fetchBanners();
      }
    } catch (err) {
      console.error("publishBanner error:", err);
    }
  };

  const sensors = useSensors(useSensor(PointerSensor));
  const onDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = banners.findIndex((b) => b.id === active.id);
      const newIndex = banners.findIndex((b) => b.id === over.id);
      setBanners(arrayMove(banners, oldIndex, newIndex));
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files: any) => setImage(files[0]),
    accept: { "image/*": [] },
    multiple: false,
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <button
          onClick={() => navigate("/admin")}
          className="self-start inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">
              Banner Management
            </h1>
            <p className="text-zinc-500 mt-1">
              Create and manage homepage banners and announcements.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="h-12 px-8 bg-zinc-900 text-white rounded-xl font-semibold text-[10px] tracking-[0.14em] hover:bg-black transition-all flex items-center gap-3 shadow-lg shadow-zinc-100/50"
          >
            <PlusCircle size={16} /> New Banner
          </button>
        </div>
      </div>

      {/* Add Banner Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className={cn("w-full max-w-md relative", adminModalShellClass)}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 rounded-full transition-all z-10"
            >
              <X size={20} />
            </button>
            <div className="p-8">
              <h3 className={cn(adminModalTitleClass, "mb-1")}>
                Create new banner
              </h3>
              <p className={cn(adminModalDescClass, "mb-6")}>
                Upload an image and add descriptive content for the homepage
                carousel.
              </p>

              <div className="flex flex-col gap-6">
                {/* Dropzone */}
                <div className="w-full">
                  <div
                    {...getRootProps()}
                    className={cn(
                      "h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center p-4 cursor-pointer transition-all bg-zinc-50",
                      isDragActive
                        ? "border-zinc-100 bg-zinc-50"
                        : "border-zinc-300 hover:border-zinc-400 hover:bg-zinc-100",
                      image && "border-emerald-500 bg-emerald-50",
                    )}
                  >
                    <input {...getInputProps()} />
                    {image ? (
                      <div className="text-emerald-700">
                        <ImageIcon className="w-6 h-6 mx-auto mb-1.5" />
                        <p className="font-bold text-[10px] truncate max-w-[250px] ">
                          {image.name}
                        </p>
                        <p className="text-[9px] opacity-70 mt-0.5 font-semibold ">
                          Click to change
                        </p>
                      </div>
                    ) : (
                      <div className="text-zinc-500">
                        <Upload className="w-6 h-6 mx-auto mb-1.5 text-zinc-400" />
                        <p className="font-bold text-[10px] tracking-wider">
                          Select Banner Image
                        </p>
                        <p className="text-[9px] opacity-60 mt-0.5 font-semibold ">
                          Drop or click
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className={adminLabelClass}>Banner title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Important announcement"
                      className={adminInputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={adminLabelClass}>
                      Content / description
                    </label>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Enter the details…"
                      className={cn(adminTextareaClass, "h-28")}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={cn(adminGhostButtonClass, "flex-1")}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={addBanner}
                  disabled={loading || !title || !image}
                  className={cn(adminPrimaryButtonClass, "flex-[2]")}
                >
                  {loading ? "Uploading…" : "Create banner"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Banners Grid */}
      <div>
        <h3 className="text-lg font-bold text-zinc-900 mb-4 px-1">
          Active Banners
        </h3>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={banners.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            {banners.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {banners.map((banner) => (
                  <SortableBannerCard
                    key={banner.id}
                    banner={banner}
                    deleteBanner={deleteBanner}
                    publishBanner={publishBanner}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-zinc-50 border border-dashed border-zinc-200 rounded-xl p-12 text-center text-zinc-500">
                <LayoutDashboard className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No banners created yet</p>
                <p className="text-sm">
                  Use the form above to add your first banner.
                </p>
              </div>
            )}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
