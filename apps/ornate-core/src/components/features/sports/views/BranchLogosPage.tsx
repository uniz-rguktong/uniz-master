"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Video,
  Image as ImageIcon,
  Play,
  Eye,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VideoCard } from "@/components/VideoCard";
import { LogoCard } from "@/components/LogoCard";
import { Modal } from "@/components/Modal";
import { MetricCard } from "@/components/MetricCard";
import {
  MetricCardSkeleton,
  VideoCardSkeleton,
  LogoCardSkeleton,
} from "@/components/ui/skeleton";
import { useToast } from "@/hooks/useToast";
import Image from "next/image";
import {
  getPromoVideos,
  createPromoVideo,
  updatePromoVideo,
  deletePromoVideo,
  getBrandLogos,
  createBrandLogo,
  updateBrandLogo,
  deleteBrandLogo,
} from "@/actions/brandActions";
import { uploadFileToR2 } from "@/lib/upload";

type BrandingTab = "logos" | "videos";

interface BranchLogosPageProps {
  defaultTab?: BrandingTab;
  sportsAdminMode?: boolean;
  showTabNavigation?: boolean;
  onTabChange?: (tab: BrandingTab) => void;
  tabOrder?: BrandingTab[];
  tabLabels?: {
    logos?: string;
    videos?: string;
  };
}

export function BranchLogosPage({
  defaultTab = "logos",
  sportsAdminMode = false,
  showTabNavigation = false,
  onTabChange,
  tabOrder = ["videos", "logos"],
  tabLabels,
}: BranchLogosPageProps) {
  const { toast, showToast, hideToast } = useToast();
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const isReadOnly = userRole === "BRANCH_SPORTS_ADMIN";
  const activeTab = defaultTab;
  const logosLabel = tabLabels?.logos || "Brand Logos";
  const logosLabelLower = logosLabel.toLowerCase();
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [videosRes, logosRes] = await Promise.all([
        getPromoVideos(),
        getBrandLogos(),
      ]);

      if (videosRes.success) setPromoVideos(videosRes.videos || []);
      if (logosRes.success) setLogos(logosRes.logos || []);
    } catch (error) {
      console.error("Error fetching branding data:", error);
      showToast("Failed to load branding data", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [showUploadVideoModal, setShowUploadVideoModal] = useState(false);
  const [showUploadLogoModal, setShowUploadLogoModal] = useState(false);
  const [promoVideos, setPromoVideos] = useState<any[]>([]);
  const [logos, setLogos] = useState<any[]>([]);
  const [uploadFile, setUploadFile] = useState<any>(null);
  const [videoThumbnailFile, setVideoThumbnailFile] = useState<File | null>(
    null,
  );
  const [videoThumbnailPreview, setVideoThumbnailPreview] = useState<
    string | null
  >(null);

  // States for Select components
  const [videoPlatform, setVideoPlatform] = useState("YouTube");
  const [videoStatus, setVideoStatus] = useState("Active");
  const [videoCategory, setVideoCategory] = useState("video");

  const [logoType, setLogoType] = useState("Primary Logo");
  const [logoFormat, setLogoFormat] = useState("SVG");
  const [logoStatus, setLogoStatus] = useState("Active");

  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [showVideoPreviewModal, setShowVideoPreviewModal] = useState(false);

  // Form states for modals
  const [videoTitle, setVideoTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isPublishingVideo, setIsPublishingVideo] = useState(false);
  const [isPublishingLogo, setIsPublishingLogo] = useState(false);
  const publishingVideoRef = useRef(false);
  const publishingLogoRef = useRef(false);
  const [logoName, setLogoName] = useState("");
  const [logoPreview, setLogoPreview] = useState<any>(null);

  // Preview state
  const [selectedLogo, setSelectedLogo] = useState<any | null>(null);
  const [showLogoPreviewModal, setShowLogoPreviewModal] = useState(false);

  // Edit States
  const [editingVideo, setEditingVideo] = useState<any>(null);
  const [showEditVideoModal, setShowEditVideoModal] = useState(false);
  const [editingLogo, setEditingLogo] = useState<any>(null);
  const [showEditLogoModal, setShowEditLogoModal] = useState(false);

  // Delete States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [deleteType, setDeleteType] = useState("video"); // 'video' or 'logo'
  const [categoryFilter, setCategoryFilter] = useState("all");

  const handleLogoFileUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e: any) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setUploadFile(file);
        setLogoPreview(URL.createObjectURL(file));
        showToast(`Selected file: ${file.name}`);
      }
    };
    input.click();
  };

  const handleVideoThumbnailUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e: any) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setVideoThumbnailFile(file);
        setVideoThumbnailPreview(URL.createObjectURL(file));
        showToast(`Selected thumbnail: ${file.name}`);
      }
    };
    input.click();
  };

  const handleVideoPreview = (video: any) => {
    setSelectedVideo(video);
    setShowVideoPreviewModal(true);
  };

  const closeVideoModal = () => {
    if (isPublishingVideo) return;
    setShowUploadVideoModal(false);
    setVideoTitle("");
    setVideoUrl("");
    setVideoThumbnailFile(null);
    setVideoThumbnailPreview(null);
    setVideoCategory("video");
  };

  const normalizeUrl = (url: string) =>
    url.trim().toLowerCase().replace(/\/$/, "");

  const handlePublishVideo = async () => {
    if (isPublishingVideo || publishingVideoRef.current) return;

    if (!videoTitle.trim()) {
      showToast("Please enter a video title", "error");
      return;
    }

    if (!videoUrl.trim()) {
      showToast("Please enter a video URL", "error");
      return;
    }

    const normalizedInputUrl = normalizeUrl(videoUrl);
    const alreadyExists = promoVideos.some(
      (video) =>
        normalizeUrl(video.url || "") === normalizedInputUrl &&
        (video.platform || "") === videoPlatform,
    );
    if (alreadyExists) {
      showToast("This video link already exists", "warning");
      return;
    }

    publishingVideoRef.current = true;
    setIsPublishingVideo(true);
    try {
      let customThumbnailUrl = "";
      if (videoThumbnailFile) {
        const uploadedThumbnail = await uploadFileToR2(videoThumbnailFile);
        if (!uploadedThumbnail) {
          showToast("Failed to upload thumbnail", "error");
          return;
        }
        customThumbnailUrl = uploadedThumbnail;
      }

      const res = await createPromoVideo({
        title: videoTitle,
        url: videoUrl,
        platform: videoPlatform,
        status: videoStatus.toLowerCase(),
        category: videoCategory,
        duration: "N/A",
        thumbnail:
          customThumbnailUrl ||
          "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop",
      });

      if (res.success) {
        setPromoVideos((prev) => [res.video, ...prev]);
        showToast("Video uploaded successfully", "success");
        router.refresh();
        fetchData();
        setShowUploadVideoModal(false);
        setVideoTitle("");
        setVideoUrl("");
        setVideoThumbnailFile(null);
        setVideoThumbnailPreview(null);
      } else {
        showToast(res.error || "Failed to create video", "error");
      }
    } catch (error) {
      console.error("Error publishing video:", error);
      showToast("Failed to publish video", "error");
    } finally {
      publishingVideoRef.current = false;
      setIsPublishingVideo(false);
    }
  };

  const closeLogoModal = () => {
    if (isPublishingLogo || publishingLogoRef.current) return;
    setShowUploadLogoModal(false);
    setLogoName("");
    setLogoPreview(null);
    setUploadFile(null);
  };

  const handlePublishLogo = async () => {
    if (isPublishingLogo || publishingLogoRef.current) return;

    if (!logoName.trim()) {
      showToast("Please enter a logo name", "error");
      return;
    }

    let finalUrl = "";
    if (uploadFile) {
      publishingLogoRef.current = true;
      setIsPublishingLogo(true);
      try {
        const uploaded = await uploadFileToR2(uploadFile);
        if (!uploaded) {
          showToast("Failed to upload logo file", "error");
          return;
        }
        finalUrl = uploaded;

        const res = await createBrandLogo({
          name: logoName,
          type: logoType,
          format: logoFormat,
          status: logoStatus.toLowerCase(),
          url: finalUrl,
          thumbnail: finalUrl,
          size: uploadFile
            ? `${(uploadFile.size / 1024).toFixed(1)} KB`
            : "N/A",
          dimensions: "N/A",
        });

        if (res.success) {
          setLogos((prev) => [res.logo, ...prev]);
          showToast("Logo uploaded successfully", "success");
          router.refresh();
          fetchData();
          setShowUploadLogoModal(false);
          setLogoName("");
          setLogoPreview(null);
          setUploadFile(null);
        } else {
          showToast(res.error || "Failed to create logo", "error");
        }
      } catch (error) {
        console.error("Error publishing logo:", error);
        showToast("Failed to publish logo", "error");
      } finally {
        publishingLogoRef.current = false;
        setIsPublishingLogo(false);
      }
    } else {
      showToast("Please select a logo file", "error");
      return;
    }
  };

  const getVideoId = (video: any) => {
    if (!video || !video.url) return null;
    if (video.platform === "YouTube") {
      const regExp =
        /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = video.url.match(regExp);
      return match && match[2].length === 11 ? match[2] : null;
    }
    if (video.platform === "Vimeo") {
      return video.url.split("/").pop()?.split("?")[0];
    }
    return null;
  };

  const getEmbedUrl = (video: any) => {
    const videoId = getVideoId(video);
    if (!videoId) return null;

    if (video.platform === "YouTube") {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    }

    if (video.platform === "Vimeo") {
      return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
    }

    return null;
  };

  const getThumbnailUrl = (video: any) => {
    const videoId = getVideoId(video);
    if (!videoId) return video.thumbnail;

    if (video.platform === "YouTube") {
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }

    if (video.platform === "Vimeo") {
      return `https://vumbnail.com/${videoId}.jpg`;
    }

    return video.thumbnail;
  };

  const handleVideoEdit = (video: any) => {
    setEditingVideo(video);
    setVideoTitle(video.title);
    setVideoUrl(video.url || "");
    setVideoPlatform(video.platform);
    setVideoStatus(
      video.status.charAt(0).toUpperCase() + video.status.slice(1),
    );
    setVideoCategory(video.category || "video");
    setShowEditVideoModal(true);
  };

  const handleVideoDelete = (video: any) => {
    setItemToDelete(video);
    setDeleteType("video");
    setShowDeleteModal(true);
  };

  const handleLogoDownload = (logo: any) => {
    try {
      // Clean name for downloading (remove old extension and spaces)
      const cleanName = logo.name.replace(/\.[^/.]+$/, "").replace(/\s+/g, "_");
      const downloadName = `${cleanName}.png`;
      const downloadUrl = `/api/branding/download?url=${encodeURIComponent(logo.url)}&filename=${encodeURIComponent(downloadName)}&format=png`;

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", downloadName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Downloaded ${logo.name}`, "success");
    } catch (error) {
      showToast("Failed to download logo", "error");
    }
  };

  const handleLogoEdit = (logo: any) => {
    setEditingLogo(logo);
    setLogoName(logo.name);
    setLogoType(logo.type);
    setLogoFormat(logo.format);
    setLogoStatus(logo.status.charAt(0).toUpperCase() + logo.status.slice(1));
    setLogoPreview(logo.thumbnail);
    setShowEditLogoModal(true);
  };

  const handleLogoDelete = (logo: any) => {
    setItemToDelete(logo);
    setDeleteType("logo");
    setShowDeleteModal(true);
  };

  const handleLogoPreview = (logo: any) => {
    setSelectedLogo(logo);
    setShowLogoPreviewModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    if (deleteType === "video") {
      const res = await deletePromoVideo(itemToDelete.id);
      if (res.success) {
        setPromoVideos((prev) => prev.filter((v) => v.id !== itemToDelete.id));
        showToast(`Deleted Video: ${itemToDelete.title}`, "success");
      } else {
        showToast(res.error || "Failed to delete video", "error");
      }
    } else {
      const res = await deleteBrandLogo(itemToDelete.id);
      if (res.success) {
        setLogos((prev) => prev.filter((l) => l.id !== itemToDelete.id));
        showToast(`Deleted Logo: ${itemToDelete.name}`, "success");
      } else {
        showToast(res.error || "Failed to delete logo", "error");
      }
    }
    router.refresh();
    fetchData();
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  return (
    <div className="p-8 animate-page-entrance">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 text-sm text-[#6B7280] mb-3">
          <span className="whitespace-nowrap">Dashboard</span>
          <span className="whitespace-nowrap">›</span>
          <span className="whitespace-nowrap">Branding</span>
          <span className="whitespace-nowrap">›</span>
          <span className="text-[#1A1A1A] font-medium whitespace-nowrap">
            Assets & Logos
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-[28px] font-semibold text-[#1A1A1A] mb-2">
              {logosLabel} & Assets
            </h1>
            <p className="text-sm text-[#6B7280]">
              Manage {logosLabelLower}, branding assets, and promotional videos
            </p>
          </div>

          {!isReadOnly && (
            <button
              onClick={() => {
                if (activeTab === "videos") {
                  setShowUploadVideoModal(true);
                } else {
                  setShowUploadLogoModal(true);
                }
              }}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-[#10B981] text-white rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors shadow-sm w-full md:w-auto"
            >
              <Upload className="w-5 h-5" />
              Upload {activeTab === "videos" ? "Video" : "Logo"}
            </button>
          )}
        </div>

        {showTabNavigation && (
          <div className="inline-flex items-center p-1 bg-[#F4F2F0] rounded-lg border border-[#E5E7EB]/50">
            {tabOrder.map((tab) => {
              const isVideos = tab === "videos";
              const isActive = activeTab === tab;
              const label = isVideos
                ? tabLabels?.videos || "Promo Videos"
                : tabLabels?.logos || "Brand Logos";

              return (
                <button
                  key={tab}
                  onClick={() => onTabChange?.(tab)}
                  className={`flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-[7px] transition-all duration-200 ${
                    isActive
                      ? "bg-white text-[#1A1A1A] shadow-[0_1px_4px_-1px_rgba(0,0,0,0.05)]"
                      : "text-[#6B7280] hover:text-[#1A1A1A]"
                  }`}
                >
                  {isVideos ? (
                    <Video className="w-4 h-4" />
                  ) : (
                    <ImageIcon className="w-4 h-4" />
                  )}
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Promo Videos Tab */}
      {activeTab === "videos" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {isLoading ? (
              <>
                <MetricCardSkeleton />
                <MetricCardSkeleton />
                <MetricCardSkeleton />
                <MetricCardSkeleton />
              </>
            ) : (
              <>
                <div
                  className="animate-card-entrance"
                  style={{ animationDelay: "40ms" }}
                >
                  <MetricCard
                    title="Total Videos"
                    value={promoVideos.length}
                    icon={Video}
                    iconBgColor="#EFF6FF"
                    iconColor="#3B82F6"
                    tooltip="Total promotional videos uploaded"
                  />
                </div>

                <div
                  className="animate-card-entrance"
                  style={{ animationDelay: "80ms" }}
                >
                  <MetricCard
                    title="Total Views"
                    value={promoVideos
                      .reduce((sum: any, v: any) => sum + v.views, 0)
                      .toLocaleString()}
                    icon={Eye}
                    iconBgColor="#F5F3FF"
                    iconColor="#8B5CF6"
                    tooltip="Cumulative views across all active videos"
                  />
                </div>

                <div
                  className="animate-card-entrance"
                  style={{ animationDelay: "120ms" }}
                >
                  <MetricCard
                    title="Active Videos"
                    value={
                      promoVideos.filter((v: any) => v.status === "active")
                        .length
                    }
                    icon={Play}
                    iconBgColor="#F0FDF4"
                    iconColor="#10B981"
                    tooltip="Videos currently visible to students"
                  />
                </div>

                <div
                  className="animate-card-entrance"
                  style={{ animationDelay: "160ms" }}
                >
                  <MetricCard
                    title="Platforms"
                    value={new Set(promoVideos.map((v) => v.platform)).size}
                    icon={Share2}
                    iconBgColor="#FFFBEB"
                    iconColor="#F59E0B"
                    tooltip="Social platforms where videos are hosted"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-[#6B7280]">
                Filter:
              </span>
              <div className="flex gap-2 p-1 bg-[#F4F2F0] rounded-lg">
                {["all", "promo", "video"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                      categoryFilter === cat
                        ? "bg-white text-[#10B981] shadow-sm"
                        : "text-[#6B7280] hover:text-[#1A1A1A]"
                    }`}
                  >
                    {cat.charAt(0).toUpperCase() +
                      cat.slice(1).replace("all", "All Content")}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div
            className="animate-card-entrance"
            style={{ animationDelay: "200ms" }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {isLoading ? (
                <>
                  <VideoCardSkeleton />
                  <VideoCardSkeleton />
                </>
              ) : (
                promoVideos
                  .filter(
                    (v) =>
                      categoryFilter === "all" || v.category === categoryFilter,
                  )
                  .map((video: any) => (
                    <div key={video.id}>
                      <VideoCard
                        video={{ ...video, thumbnail: getThumbnailUrl(video) }}
                        isReadOnly={isReadOnly}
                        onPreview={() => handleVideoPreview(video)}
                        onEdit={() => handleVideoEdit(video)}
                        onDelete={() => handleVideoDelete(video)}
                      />
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Logos Tab */}
      {activeTab === "logos" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <>
                <LogoCardSkeleton />
                <LogoCardSkeleton />
                <LogoCardSkeleton />
              </>
            ) : (
              logos.map((logo: any) => (
                <LogoCard
                  key={logo.id}
                  logo={logo}
                  isReadOnly={isReadOnly}
                  onPreview={() => handleLogoPreview(logo)}
                  onDownload={() => handleLogoDownload(logo)}
                  onEdit={() => handleLogoEdit(logo)}
                  onDelete={() => handleLogoDelete(logo)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Upload Video Modal */}
      {showUploadVideoModal && (
        <Modal
          isOpen={true}
          onClose={() => {
            if (!isPublishingVideo) closeVideoModal();
          }}
          title="Upload Promo Video"
          size="lg"
          footer={
            <div className="flex justify-end gap-4">
              <button
                onClick={closeVideoModal}
                disabled={isPublishingVideo}
                className="px-6 py-2.5 bg-white border border-[#E5E7EB] rounded-[12px] text-[15px] font-medium text-[#1A1A1A] hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handlePublishVideo}
                disabled={isPublishingVideo}
                className="px-6 py-2.5 rounded-[12px] text-[15px] font-medium text-white transition-all shadow-md active:scale-95 bg-[#10B981] hover:bg-[#059669] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isPublishingVideo ? "Publishing..." : "Upload Video"}
              </button>
            </div>
          }
        >
          <div className="space-y-5 p-8">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Video Title *
              </label>
              <input
                type="text"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="Enter video title"
                className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Video URL (YouTube/Vimeo) *
              </label>
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="Paste YouTube or Vimeo URL"
                className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Platform
                </label>
                <Select value={videoPlatform} onValueChange={setVideoPlatform}>
                  <SelectTrigger className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#1A1A1A]">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YouTube">YouTube</SelectItem>
                    <SelectItem value="Vimeo">Vimeo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Status
                </label>
                <Select value={videoStatus} onValueChange={setVideoStatus}>
                  <SelectTrigger className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#1A1A1A]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Category
                </label>
                <Select value={videoCategory} onValueChange={setVideoCategory}>
                  <SelectTrigger className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#1A1A1A]">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Normal Video</SelectItem>
                    <SelectItem value="promo">Promo Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Thumbnail (Optional)
              </label>
              <div
                onClick={handleVideoThumbnailUpload}
                className="border-2 border-dashed border-[#E5E7EB] rounded-lg p-6 text-center hover:border-[#10B981] transition-colors cursor-pointer bg-white relative overflow-hidden min-h-27"
              >
                {videoThumbnailPreview ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                    <Image
                      src={videoThumbnailPreview}
                      alt="Thumbnail Preview"
                      fill
                      className="object-contain p-3"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <p className="text-white text-sm font-medium">
                        Click to change thumbnail
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
                    <p className="text-xs text-[#6B7280]">
                      Upload custom thumbnail (JPG, PNG)
                    </p>
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Description
              </label>
              <textarea
                rows={3}
                placeholder="Brief description of the video..."
                className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981] resize-none"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Video Modal */}
      {showEditVideoModal && editingVideo && (
        <Modal
          isOpen={true}
          onClose={() => {
            setShowEditVideoModal(false);
            setUploadFile(null);
            setLogoPreview(null);
          }}
          title="Edit Promo Video"
          size="lg"
          onConfirm={async () => {
            if (!videoUrl.trim()) {
              showToast("Please enter a video URL", "error");
              return;
            }

            const res = await updatePromoVideo(editingVideo.id, {
              title: videoTitle,
              url: videoUrl,
              platform: videoPlatform,
              status: videoStatus.toLowerCase(),
              category: videoCategory,
            });

            if (res.success) {
              setPromoVideos((prev) =>
                prev.map((v) => (v.id === editingVideo.id ? res.video : v)),
              );
              showToast("Video updated successfully", "success");
              router.refresh();
              fetchData();
              setShowEditVideoModal(false);
              setVideoTitle("");
              setVideoUrl("");
            } else {
              showToast(res.error || "Failed to update video", "error");
            }
          }}
          confirmText="Update Video"
          confirmButtonClass="bg-[#10B981] hover:bg-[#059669]"
        >
          <div className="space-y-5 p-8">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Video Title *
              </label>
              <input
                type="text"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="Enter video title"
                className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Video URL (YouTube/Vimeo) *
              </label>
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="Paste YouTube or Vimeo URL"
                className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Platform
                </label>
                <Select value={videoPlatform} onValueChange={setVideoPlatform}>
                  <SelectTrigger className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#1A1A1A]">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YouTube">YouTube</SelectItem>
                    <SelectItem value="Vimeo">Vimeo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Status
                </label>
                <Select value={videoStatus} onValueChange={setVideoStatus}>
                  <SelectTrigger className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#1A1A1A]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Category
                </label>
                <Select value={videoCategory} onValueChange={setVideoCategory}>
                  <SelectTrigger className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#1A1A1A]">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Normal Video</SelectItem>
                    <SelectItem value="promo">Promo Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Upload Logo Modal */}
      {showUploadLogoModal && (
        <Modal
          isOpen={true}
          onClose={() => {
            if (!isPublishingLogo && !publishingLogoRef.current)
              closeLogoModal();
          }}
          title="Upload Logo"
          size="lg"
          footer={
            <div className="flex justify-end gap-4">
              <button
                onClick={closeLogoModal}
                disabled={isPublishingLogo}
                className="px-6 py-2.5 bg-white border border-[#E5E7EB] rounded-[12px] text-[15px] font-medium text-[#1A1A1A] hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handlePublishLogo}
                disabled={isPublishingLogo}
                className="px-6 py-2.5 rounded-[12px] text-[15px] font-medium text-white transition-all shadow-md active:scale-95 bg-[#10B981] hover:bg-[#059669] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isPublishingLogo ? "Publishing..." : "Upload Logo"}
              </button>
            </div>
          }
        >
          <div className="space-y-5 p-8">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Logo Name *
              </label>
              <input
                type="text"
                value={logoName}
                onChange={(e) => setLogoName(e.target.value)}
                placeholder="Enter logo name"
                className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Logo Type *
              </label>
              <Select value={logoType} onValueChange={setLogoType}>
                <SelectTrigger className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#1A1A1A]">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Primary Logo">Primary Logo</SelectItem>
                  <SelectItem value="Department">Department</SelectItem>
                  <SelectItem value="Team">Team</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Format
                </label>
                <Select value={logoFormat} onValueChange={setLogoFormat}>
                  <SelectTrigger className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#1A1A1A]">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SVG">SVG (Recommended)</SelectItem>
                    <SelectItem value="PNG">PNG</SelectItem>
                    <SelectItem value="JPG">JPG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Status
                </label>
                <Select value={logoStatus} onValueChange={setLogoStatus}>
                  <SelectTrigger className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#1A1A1A]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Logo File *
              </label>
              <div
                onClick={() => {
                  if (!isPublishingLogo && !publishingLogoRef.current)
                    handleLogoFileUpload();
                }}
                className={`border-2 border-dashed border-[#E5E7EB] rounded-lg p-6 text-center transition-colors bg-white relative overflow-hidden ${isPublishingLogo ? "opacity-60 cursor-not-allowed" : "hover:border-[#10B981] cursor-pointer"}`}
              >
                {logoPreview ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                    <Image
                      src={logoPreview}
                      alt="Preview"
                      fill
                      className="object-contain p-4"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <p className="text-white text-sm font-medium">
                        Click to change
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
                    <p className="text-sm text-[#6B7280]">
                      <span className="text-[#10B981] font-medium">
                        Click to upload
                      </span>{" "}
                      or drag and drop
                    </p>
                    <p className="text-xs text-[#9CA3AF] mt-1">
                      SVG, PNG, JPG (max. 2MB)
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Logo Modal */}
      {showEditLogoModal && editingLogo && (
        <Modal
          isOpen={true}
          onClose={() => {
            setShowEditLogoModal(false);
            setUploadFile(null);
            setLogoPreview(null);
          }}
          title="Edit Logo"
          size="lg"
          onConfirm={async () => {
            let finalUrl = editingLogo.url;
            let finalThumbnail = editingLogo.thumbnail;
            let finalSize = editingLogo.size;

            if (uploadFile) {
              const uploaded = await uploadFileToR2(uploadFile);
              if (!uploaded) {
                showToast("Failed to upload logo file", "error");
                return;
              }
              finalUrl = uploaded;
              finalThumbnail = uploaded;
              finalSize = `${(uploadFile.size / 1024).toFixed(1)} KB`;
            }

            const res = await updateBrandLogo(editingLogo.id, {
              name: logoName,
              type: logoType,
              format: logoFormat,
              status: logoStatus.toLowerCase(),
              url: finalUrl,
              thumbnail: finalThumbnail,
            });

            if (res.success) {
              setLogos((prev) =>
                prev.map((l) => (l.id === editingLogo.id ? res.logo : l)),
              );
              showToast("Logo updated successfully", "success");
              setShowEditLogoModal(false);
              setLogoName("");
              setLogoPreview(null);
              setUploadFile(null);
            } else {
              showToast(res.error || "Failed to update logo", "error");
            }
          }}
          confirmText="Update Logo"
          confirmButtonClass="bg-[#10B981] hover:bg-[#059669]"
        >
          <div className="space-y-5 p-8">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Logo Name *
              </label>
              <input
                type="text"
                value={logoName}
                onChange={(e) => setLogoName(e.target.value)}
                placeholder="Enter logo name"
                className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              />
            </div>

            {/* Other logo edit fields... */}
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Logo Type *
              </label>
              <Select value={logoType} onValueChange={setLogoType}>
                <SelectTrigger className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#1A1A1A]">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Primary Logo">Primary Logo</SelectItem>
                  <SelectItem value="Department">Department</SelectItem>
                  <SelectItem value="Team">Team</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Format
                </label>
                <Select value={logoFormat} onValueChange={setLogoFormat}>
                  <SelectTrigger className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#1A1A1A]">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SVG">SVG (Recommended)</SelectItem>
                    <SelectItem value="PNG">PNG</SelectItem>
                    <SelectItem value="JPG">JPG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Status
                </label>
                <Select value={logoStatus} onValueChange={setLogoStatus}>
                  <SelectTrigger className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#1A1A1A]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Logo File *
              </label>
              <div
                onClick={handleLogoFileUpload}
                className="border-2 border-dashed border-[#E5E7EB] rounded-lg p-6 text-center hover:border-[#10B981] transition-colors cursor-pointer bg-white relative overflow-hidden"
              >
                {logoPreview ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                    <Image
                      src={logoPreview}
                      alt="Preview"
                      fill
                      className="object-contain p-4"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <p className="text-white text-sm font-medium">
                        Click to change
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
                    <p className="text-sm text-[#6B7280]">
                      <span className="text-[#10B981] font-medium">
                        Click to upload
                      </span>{" "}
                      or drag and drop
                    </p>
                    <p className="text-xs text-[#9CA3AF] mt-1">
                      SVG, PNG, JPG (max. 2MB)
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={deleteType === "video" ? "Delete Promo Video" : "Delete Logo"}
        onConfirm={confirmDelete}
        confirmText="Delete"
        confirmButtonClass="bg-[#EF4444] hover:bg-[#DC2626]"
      >
        <div className="p-4">
          <p className="text-sm text-[#6B7280]">
            Are you sure you want to delete{" "}
            <span className="font-bold text-[#1A1A1A]">
              {itemToDelete?.title || itemToDelete?.name}
            </span>
            ? This action cannot be undone.
          </p>
        </div>
      </Modal>

      {/* Video Preview Modal */}
      <Modal
        isOpen={showVideoPreviewModal}
        onClose={() => setShowVideoPreviewModal(false)}
        title={selectedVideo?.title || "Video Preview"}
        size="xl"
      >
        <div className="p-1">
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
            {selectedVideo && (
              <iframe
                width="100%"
                height="100%"
                src={getEmbedUrl(selectedVideo) || undefined}
                title={selectedVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            )}
          </div>
        </div>
      </Modal>
      {/* Logo Preview Modal */}
      {showLogoPreviewModal && selectedLogo && (
        <Modal
          isOpen={true}
          onClose={() => setShowLogoPreviewModal(false)}
          title={`Logo Preview - ${selectedLogo.name}`}
          size="lg"
        >
          <div className="p-8 flex items-center justify-center bg-white rounded-xl">
            <div className="relative w-full max-w-2xl aspect-square bg-[#F7F8FA] rounded-xl overflow-hidden shadow-inner flex items-center justify-center p-12">
              <Image
                src={selectedLogo.url || selectedLogo.thumbnail}
                alt={selectedLogo.name}
                className="max-w-full max-h-full object-contain drop-shadow-md"
                width={800}
                height={800}
                unoptimized
                priority
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
