import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/utils/toast-ref";
import { apiClient } from "../../api/apiClient";
import { BASE_URL } from "../../api/endpoints";
import { uploadImage } from "../../api/uploadImage";
import {
  GripVertical,
  Image as ImageIcon,
  Upload,
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
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { AdminDialog } from "@/components/admin/AdminDialog";
import {
  adminLabelClass,
  adminInputClass,
  adminTextareaClass,
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
      className="group relative overflow-hidden rounded-lg border border-border bg-surface"
    >
      <div className="relative aspect-video bg-surface-2">
        <img
          src={banner.imageUrl}
          alt={banner.title}
          className="h-full w-full object-cover"
        />
        <div
          {...attributes}
          {...listeners}
          className="absolute top-3 left-3 cursor-grab rounded-lg bg-surface p-1.5 text-text-2 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <GripVertical className="w-5 h-5" />
        </div>
        <div className="absolute top-3 right-3">
          <Badge tone={banner.isPublished ? "success" : "neutral"}>
            {banner.isPublished ? "Published" : "Draft"}
          </Badge>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-text mb-1 line-clamp-1">
          {banner.title}
        </h3>
        <p className="text-text-2 text-sm line-clamp-2 min-h-[40px]">
          {banner.text}
        </p>

        <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            size="compact"
            onClick={() => publishBanner(banner.id, !banner.isPublished)}
          >
            {banner.isPublished ? "Unpublish" : "Publish"}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="compact"
            onClick={() => deleteBanner(banner.id)}
          >
            Delete
          </Button>
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
      <PageHeader
        title="Banner management"
        meta="Create and manage homepage banners and announcements."
        action={
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" variant="outline" onClick={() => navigate("/admin")}>
              Back
            </Button>
            <Button type="button" onClick={() => setShowAddModal(true)}>
              New banner
            </Button>
          </div>
        }
      />

      {/* Add Banner Modal */}
      <AdminDialog
        open={showAddModal}
        onOpenChange={setShowAddModal}
        maxWidth="max-w-[640px]"
        title="Create new banner"
        description="Upload an image and add descriptive content for the homepage carousel."
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={addBanner}
              disabled={loading || !title || !image}
              isLoading={loading}
            >
              {loading ? "Uploading…" : "Create banner"}
            </Button>
          </>
        }
      >
              <div className="flex flex-col gap-6">
                {/* Dropzone */}
                <div className="w-full">
                  <div
                    {...getRootProps()}
                    className={cn(
                      "flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border-strong bg-surface p-4 text-center",
                      isDragActive && "border-head bg-tint",
                    )}
                  >
                    <input {...getInputProps()} />
                    {image ? (
                      <div className="text-text">
                        <ImageIcon className="w-6 h-6 mx-auto mb-1.5" />
                        <p className="font-semibold text-caption truncate max-w-[250px]">
                          {image.name}
                        </p>
                        <p className="text-caption opacity-70 mt-0.5 font-semibold">
                          Click to change
                        </p>
                      </div>
                    ) : (
                      <div className="text-text-2">
                        <Upload className="w-6 h-6 mx-auto mb-1.5 text-text-3" />
                        <p className="font-semibold text-caption">
                          Select Banner Image
                        </p>
                        <p className="text-caption opacity-60 mt-0.5 font-semibold">
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

      </AdminDialog>

      {/* Banners Grid */}
      <div>
        <h3 className="text-lg font-semibold text-text mb-4 px-1">
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
              <EmptyState
                title="No banners yet"
                body="Create a banner to feature it on the homepage."
              />
            )}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
