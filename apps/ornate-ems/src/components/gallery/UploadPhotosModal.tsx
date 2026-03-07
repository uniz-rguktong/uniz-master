"use client";
import { createPortal } from "react-dom";
import { useState, useEffect, useRef } from "react";
import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import {
  X,
  Upload,
  Check,
  Search,
  Download,
  Trash2,
  Grid3x3,
  Eye,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PhotoDetailModal } from "./PhotoDetailModal";
import { uploadFileToR2 } from "@/lib/upload";
import { addPhotosToAlbum } from "@/actions/galleryActions";
import { useToast } from "@/hooks/useToast";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type GallerySortOrder = "Newest First" | "Oldest First" | "Name (A-Z)";
type GridSize = "small" | "medium" | "large";
type UploadStep = "upload" | "manage";

interface GalleryCategory {
  id: string;
  name: string;
}

interface UploadedPhoto {
  id: string;
  filename: string;
  size: string;
  dimensions: string;
  uploadDate: string;
  thumbnail: string;
  url: string;
  status: string;
  category: string;
}

interface UploadQueueItem {
  id: string;
  name: string;
  size: string;
  preview: string;
  file: File;
}

interface UploadPhotosModalProps {
  categories: GalleryCategory[];
  uploadedPhotos: UploadedPhoto[];
  setUploadedPhotos: Dispatch<SetStateAction<UploadedPhoto[]>>;
  onDeletePhotos: (photoIds: string[]) => void;
  initialCategory?: string;
  hideTargetAlbumDropdown?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const isUnsupportedImage = (url?: string) => {
  if (!url) return false;
  const ext = url.split("?")[0]?.split(".").pop()?.toLowerCase();
  return ext === "heic" || ext === "heif";
};

export function UploadPhotosModal({
  categories,
  uploadedPhotos,
  setUploadedPhotos,
  onDeletePhotos,
  initialCategory = "All Categories",
  hideTargetAlbumDropdown = false,
  onClose,
  onSuccess,
}: UploadPhotosModalProps) {
  const [step, setStep] = useState<UploadStep>("upload");
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<GallerySortOrder>("Newest First");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [gridSize, setGridSize] = useState<GridSize>("medium");
  const [viewMode, setViewMode] = useState("grid");
  const [previewPhoto, setPreviewPhoto] = useState<UploadedPhoto | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [processingMessage, setProcessingMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { showToast } = useToast();

  const filteredPhotos = (uploadedPhotos || [])
    .filter((photo) => {
      const matchesSearch = photo.filename
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All Categories" ||
        photo.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a: any, b: any) => {
      if (sortOrder === "Newest First") {
        return (
          new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
        );
      } else if (sortOrder === "Oldest First") {
        return (
          new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime()
        );
      } else if (sortOrder === "Name (A-Z)") {
        return (a.filename || "").localeCompare(b.filename || "");
      }
      return 0;
    });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleBrowse = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from((e.target as HTMLInputElement).files ?? []);
    if (files.length === 0) return;

    setIsUploading(true); // Show a processing state while converting
    const newQueueItems: UploadQueueItem[] = [];

    for (const file of files) {
      const isHeic =
        file.name.toLowerCase().endsWith(".heic") ||
        file.name.toLowerCase().endsWith(".heif");

      let processedFile = file;
      let previewUrl = URL.createObjectURL(file);

      if (isHeic) {
        try {
          setProcessingMessage(`Converting ${file.name}...`);
          // Dynamically load heic2any from CDN if needed
          if (!(window as any).heic2any) {
            const script = document.createElement("script");
            script.src =
              "https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js";
            document.head.appendChild(script);
            await new Promise((resolve) => {
              script.onload = resolve;
            });
          }

          const blob = await (window as any).heic2any({
            blob: file,
            toType: "image/jpeg",
            quality: 0.8,
          });

          // Handle multiple results if it was a burst/live photo (usually single)
          const resultBlob = Array.isArray(blob) ? blob[0] : blob;
          const newName = file.name.replace(/\.(heic|heif)$/i, ".jpg");

          processedFile = new File([resultBlob], newName, {
            type: "image/jpeg",
          });
          previewUrl = URL.createObjectURL(processedFile);
        } catch (err) {
          console.error("HEIC Conversion failed:", err);
          // Fallback to original file if conversion fails
        }
      }

      newQueueItems.push({
        id: Math.random().toString(36).substr(2, 9),
        name: processedFile.name,
        size: (processedFile.size / (1024 * 1024)).toFixed(2) + " MB",
        preview: previewUrl,
        file: processedFile,
      });
    }

    setQueue((prev) => [...prev, ...newQueueItems]);
    setIsUploading(false);
    setProcessingMessage("");
    e.target.value = "";
  };

  const handleStartUpload = async () => {
    if (selectedCategory === "All Categories") {
      showToast("Please select a specific album before uploading.", "error");
      return;
    }

    if (queue.length === 0) {
      showToast("Please select at least one photo to upload.", "error");
      return;
    }

    const targetCategory = categories.find((c) => c.name === selectedCategory);
    if (!targetCategory) {
      showToast("Selected album not found.", "error");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadedUrls = [];
      const failedFiles = [];

      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        if (!item) continue;
        try {
          const url = await uploadFileToR2(item.file);
          if (url) {
            uploadedUrls.push({ url, caption: item.name });
          } else {
            failedFiles.push(item.name);
          }
        } catch (err) {
          console.error(`Failed to upload ${item.name}:`, err);
          failedFiles.push(item.name);
        }
        setUploadProgress(Math.round(((i + 1) / queue.length) * 100));
      }

      if (uploadedUrls.length > 0) {
        const res = await addPhotosToAlbum(targetCategory.id, uploadedUrls);
        if (res.success) {
          const newlyUploaded = uploadedUrls.map((item: any, idx: any) => ({
            id: `new-${Date.now()}-${idx}`,
            filename: item.caption,
            size: "Original",
            dimensions: "High Res",
            uploadDate: new Date().toLocaleString(),
            thumbnail: item.url,
            url: item.url,
            status: "success",
            category: selectedCategory,
          }));

          setUploadedPhotos((prev) => [...newlyUploaded, ...prev]);
          setStep("manage");
          showToast(
            `Successfully uploaded ${uploadedUrls.length} photos`,
            "success",
          );
          if (onSuccess) onSuccess();
        } else {
          showToast(`Database error: ${res.error}`, "error");
        }
      }

      if (failedFiles.length > 0) {
        showToast(
          `Failed to upload ${failedFiles.length} files. Check CORS/Network settings.`,
          "warning",
        );
      }
    } catch (error) {
      console.error("Critical upload error:", error);
      showToast("A critical error occurred during upload process.", "error");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setQueue([]);
    }
  };

  const handleDeleteSelections = () => {
    if (selectedPhotos.size === 0) return;
    setShowDeleteConfirm(true);
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const toggleSelectAll = () => {
    if (selectedPhotos.size === filteredPhotos.length) {
      setSelectedPhotos(new Set());
    } else {
      setSelectedPhotos(new Set(filteredPhotos.map((p: any) => p.id)));
    }
  };

  const toggleSelectPhoto = (photoId: string) => {
    setSelectedPhotos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  };

  const getGridClass = () => {
    switch (gridSize) {
      case "small":
        return "grid-cols-3 sm:grid-cols-4 md:grid-cols-6";
      case "medium":
        return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4";
      case "large":
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
      default:
        return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4";
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 md:p-8">
      <div className="bg-[#F4F2F0] rounded-[24px] p-[10px] max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-[16px] pt-[12px] pb-[16px]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#10B981] rounded-xl flex items-center justify-center text-white shadow-lg">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-[#1A1A1A]">
                {step === "upload" ? "Upload Photos" : "Manage Photos"}
              </h2>
              <p className="text-xs text-[#6B7280]">
                {step === "upload"
                  ? "Add new assets to your gallery"
                  : "Review and manage your uploads"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#E5E7EB] rounded-full transition-all text-[#6B7280] hover:text-[#1A1A1A]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* White Inner Card */}
        <div className="bg-white rounded-[20px] flex-1 overflow-hidden flex flex-col shadow-inner">
          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {step === "upload" ? (
              <div className="p-8">
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  accept="image/*"
                  className="hidden"
                />

                {/* Category Selection */}
                <div className="mb-8 flex flex-col sm:flex-row items-center justify-between p-5 bg-[#F7F8FA] rounded-2xl border border-[#E5E7EB] gap-4">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-[#E5E7EB]">
                      <ImageIcon className="w-6 h-6 text-[#10B981]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1A1A1A]">
                        Target Album
                      </h4>
                      <p className="text-xs text-[#6B7280]">
                        Select where these photos will be stored
                      </p>
                    </div>
                  </div>
                  {hideTargetAlbumDropdown ? (
                    <div className="w-full sm:w-[240px] h-[48px] px-4 bg-white border border-[#E5E7EB] rounded-xl font-medium text-sm text-[#1A1A1A] flex items-center shadow-sm">
                      {selectedCategory}
                    </div>
                  ) : (
                    <Select
                      value={selectedCategory}
                      onValueChange={setSelectedCategory}
                    >
                      <SelectTrigger className="w-full sm:w-[240px] h-[48px] bg-white border-[#E5E7EB] rounded-xl font-medium shadow-sm transition-all focus:ring-2 focus:ring-[#10B981]/20">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-[#E5E7EB] shadow-xl">
                        <SelectItem
                          value="All Categories"
                          disabled
                          className="text-[#9CA3AF]"
                        >
                          Choose an Album...
                        </SelectItem>
                        {categories.map((cat) => (
                          <SelectItem
                            key={cat.id}
                            value={cat.name}
                            className="py-2.5"
                          >
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Upload Zone */}
                {queue.length === 0 ? (
                  <div
                    onClick={handleBrowse}
                    className="border-2 border-dashed border-[#E5E7EB] rounded-3xl p-20 text-center hover:border-[#10B981] hover:bg-[#10B981]/5 transition-all cursor-pointer bg-white group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#F7F8FA]/50 pointer-events-none"></div>
                    <div className="flex flex-col items-center relative z-10">
                      <div className="w-28 h-28 bg-[#F7F8FA] rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-sm border border-[#E5E7EB]">
                        <Upload className="w-12 h-12 text-[#6B7280] group-hover:text-[#10B981]" />
                      </div>
                      <h3 className="text-[24px] font-bold text-[#1A1A1A] mb-3">
                        Select photos to upload
                      </h3>
                      <p className="text-sm text-[#6B7280] mb-8 max-w-sm mx-auto leading-relaxed">
                        Drag and drop your photos here, or click to browse.
                        Supports JPG, PNG and WebP.
                      </p>
                      <button
                        type="button"
                        className="px-10 py-4 bg-[#1A1A1A] text-white rounded-2xl text-sm font-bold hover:bg-[#2D2D2D] shadow-xl transition-all active:scale-[0.98] flex items-center gap-2"
                      >
                        Browse Files
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-300">
                    <div className="bg-white border border-[#E5E7EB] rounded-[24px] overflow-hidden shadow-md">
                      <div className="px-6 py-5 bg-[#F7F8FA] border-b border-[#E5E7EB] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-6 h-6 bg-[#10B981] text-white text-[10px] font-bold rounded-full">
                            {queue.length}
                          </span>
                          <h4 className="text-sm font-bold text-[#1A1A1A]">
                            In Queue
                          </h4>
                        </div>
                        <button
                          onClick={() => setQueue([])}
                          disabled={isUploading}
                          className="text-xs font-bold text-[#EF4444] hover:bg-[#EF4444]/10 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="divide-y divide-[#E5E7EB] max-h-[360px] overflow-y-auto custom-scrollbar">
                        {queue.map((file: any) => (
                          <div
                            key={file.id}
                            className="px-6 py-4 flex items-center justify-between group hover:bg-[#F7F8FA]/50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 relative rounded-xl overflow-hidden border border-[#E5E7EB] bg-[#F7F8FA] flex items-center justify-center">
                                {isUnsupportedImage(file.name) ? (
                                  <ImageIcon className="w-6 h-6 text-[#9CA3AF]" />
                                ) : (
                                  <img
                                    src={file.preview}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-[#1A1A1A] truncate max-w-[200px]">
                                  {file.name}
                                </div>
                                <div className="text-[10px] font-medium text-[#6B7280]">
                                  {file.size}
                                </div>
                              </div>
                            </div>
                            {isUploading ? (
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-[#10B981] tabular-nums">
                                  {uploadProgress}%
                                </span>
                                <div className="w-5 h-5 flex items-center justify-center">
                                  {uploadProgress === 100 ? (
                                    <Check className="w-5 h-5 text-[#10B981]" />
                                  ) : (
                                    <div className="w-4 h-4 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin"></div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() =>
                                  setQueue((q) =>
                                    q.filter((f) => f.id !== file.id),
                                  )
                                }
                                className="p-2 hover:bg-[#FEE2E2] rounded-lg group/btn transition-all"
                              >
                                <X className="w-4 h-4 text-[#9CA3AF] group-hover/btn:text-[#EF4444]" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {!isUploading ? (
                      <button
                        onClick={handleStartUpload}
                        className="w-full py-5 bg-[#10B981] text-white rounded-[20px] font-bold text-[16px] shadow-xl hover:bg-[#059669] hover:translate-y-[-2px] transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                        <Upload className="w-5 h-5" />
                        Start Uploading {queue.length} Files
                      </button>
                    ) : (
                      <div className="space-y-4 bg-[#F7F8FA] p-6 rounded-[24px] border border-[#E5E7EB]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse"></div>
                            <span className="text-sm font-bold text-[#1A1A1A]">
                              {processingMessage || "Processing uploads..."}
                            </span>
                          </div>
                          <span className="tabular-nums font-black text-[#10B981] text-lg">
                            {uploadProgress}%
                          </span>
                        </div>
                        <div className="h-4 bg-white rounded-full overflow-hidden border border-[#E5E7EB] p-1">
                          <div
                            className="h-full bg-gradient-to-r from-[#10B981] to-[#34D399] rounded-full transition-all duration-300 relative"
                            style={{ width: `${uploadProgress}%` }}
                          >
                            <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
                          </div>
                        </div>
                        <p className="text-[11px] text-[#6B7280] text-center font-medium">
                          Please do not close this window while the upload is in
                          progress.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 md:p-8">
                {/* Toolbar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-6 bg-[#F7F8FA] p-4 rounded-2xl border border-[#E5E7EB]">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedPhotos.size === filteredPhotos.length && filteredPhotos.length > 0 ? "bg-[#10B981] border-[#10B981]" : "bg-white border-[#D1D5DB] group-hover:border-[#10B981]"}`}
                      >
                        <input
                          type="checkbox"
                          checked={
                            selectedPhotos.size === filteredPhotos.length &&
                            filteredPhotos.length > 0
                          }
                          onChange={toggleSelectAll}
                          className="hidden"
                        />
                        {selectedPhotos.size === filteredPhotos.length &&
                          filteredPhotos.length > 0 && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                      </div>
                      <span className="text-sm font-bold text-[#1A1A1A]">
                        Select All
                      </span>
                    </label>

                    <div className="h-8 w-px bg-[#E5E7EB]"></div>

                    {selectedPhotos.size > 0 ? (
                      <span className="text-sm font-bold text-[#10B981] bg-[#10B981]/10 px-3 py-1 rounded-lg">
                        {selectedPhotos.size} selected
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-[#6B7280]">
                        {filteredPhotos.length} total items
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                    {/* Search */}
                    <div className="relative w-full sm:w-[260px]">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                      <input
                        type="text"
                        placeholder="Search assets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 shadow-sm"
                      />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Select
                        value={sortOrder}
                        onValueChange={(value) =>
                          setSortOrder(value as GallerySortOrder)
                        }
                      >
                        <SelectTrigger className="flex-1 sm:w-[150px] h-[46px] bg-white border-[#E5E7EB] rounded-xl text-sm font-medium shadow-sm">
                          <SelectValue placeholder="Sort" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl shadow-xl">
                          <SelectItem value="Newest First">
                            Newest First
                          </SelectItem>
                          <SelectItem value="Oldest First">
                            Oldest First
                          </SelectItem>
                          <SelectItem value="Name (A-Z)">Name (A-Z)</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="flex items-center gap-1 bg-white border border-[#E5E7EB] rounded-xl p-1 shadow-sm">
                        {["small", "medium", "large"].map((size: any) => (
                          <button
                            key={size}
                            onClick={() => setGridSize(size as GridSize)}
                            className={`p-2 rounded-lg transition-all ${gridSize === size ? "bg-[#F7F8FA] text-[#1A1A1A] shadow-sm" : "text-[#6B7280] hover:text-[#1A1A1A]"}`}
                          >
                            <Grid3x3 className="w-4 h-4" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bulk Actions */}
                {selectedPhotos.size > 0 && (
                  <div className="mb-8 p-4 bg-white border-2 border-[#10B981]/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#10B981]/10 rounded-lg flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-[#10B981]" />
                      </div>
                      <span className="text-sm font-bold text-[#1A1A1A]">
                        {selectedPhotos.size} photo
                        {selectedPhotos.size > 1 ? "s" : ""} selected
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <button className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-bold text-[#1A1A1A] hover:bg-[#F7F8FA] transition-all">
                        Move
                      </button>
                      <button
                        onClick={handleDeleteSelections}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-xl text-sm font-bold text-[#EF4444] hover:bg-[#EF4444]/10 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}

                {/* Empty State for Manage view */}
                {filteredPhotos.length === 0 ? (
                  <div className="text-center py-20 bg-[#F7F8FA] rounded-3xl border border-dashed border-[#E5E7EB]">
                    <div className="w-20 h-20 bg-white rounded-[24px] flex items-center justify-center mx-auto mb-6 shadow-sm border border-[#E5E7EB]">
                      <ImageIcon className="w-10 h-10 text-[#9CA3AF]" />
                    </div>
                    <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">
                      No photos found
                    </h3>
                    <p className="text-sm text-[#6B7280]">
                      Try adjusting your filters or upload some new photos.
                    </p>
                  </div>
                ) : (
                  <div className={`grid ${getGridClass()} gap-6`}>
                    {filteredPhotos.map((photo: any) => (
                      <div
                        key={photo.id}
                        className={`group relative aspect-square rounded-[20px] overflow-hidden border-2 transition-all duration-300 ${selectedPhotos.has(photo.id) ? "border-[#10B981] shadow-lg ring-4 ring-[#10B981]/10" : "border-transparent hover:border-[#10B981]/40"}`}
                        onClick={() => toggleSelectPhoto(photo.id)}
                      >
                        {isUnsupportedImage(photo.url || photo.thumbnail) ? (
                          <div className="absolute inset-0 bg-[#F7F8FA] flex flex-col items-center justify-center p-4 text-center">
                            <ImageIcon className="w-10 h-10 text-[#9CA3AF] mb-2" />
                            <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
                              HEIC Image
                            </span>
                            <span className="text-[9px] text-[#9CA3AF] mt-1 px-2">
                              Preview not available in this browser
                            </span>
                          </div>
                        ) : (
                          <Image
                            src={photo.thumbnail}
                            alt={photo.filename || "Gallery Preview"}
                            fill
                            sizes="(max-width: 768px) 50vw, 33vw"
                            unoptimized
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-white truncate max-w-[120px]">
                              {photo.filename}
                            </span>
                            <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeletePhotos([photo.id]);
                                }}
                                className="p-2 bg-white/20 hover:bg-[#EF4444] rounded-full backdrop-blur-md transition-all text-white"
                                title="Delete Photo"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewPhoto(photo);
                                }}
                                className="p-2 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur-md transition-all text-white"
                                title="View Preview"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div
                          className="absolute top-4 left-4 z-20 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectPhoto(photo.id);
                          }}
                        >
                          <div
                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedPhotos.has(photo.id) ? "bg-[#10B981] border-[#10B981] shadow-lg scale-110" : "bg-white/80 border-white backdrop-blur-sm opacity-0 group-hover:opacity-100"}`}
                          >
                            {selectedPhotos.has(photo.id) && (
                              <Check className="w-4 h-4 text-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[#E5E7EB] px-6 py-5 bg-[#F7F8FA] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                Status:
              </span>
              <span className="text-sm font-bold text-[#1A1A1A]">
                {step === "manage"
                  ? `${filteredPhotos.length} Items cached`
                  : queue.length > 0
                    ? `${queue.length} Ready to upload`
                    : "System Ready"}
              </span>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {step === "manage" && (
                <button
                  onClick={() => setStep("upload")}
                  className="px-8 py-3 bg-white border border-[#E5E7EB] rounded-xl text-sm font-extrabold text-[#1A1A1A] hover:bg-[#F3F4F6] transition-all shadow-sm active:scale-[0.98]"
                >
                  Add More
                </button>
              )}
              <button
                onClick={onClose}
                className="px-10 py-3 bg-[#1A1A1A] text-white rounded-xl text-sm font-extrabold hover:bg-[#2D2D2D] transition-all shadow-xl active:scale-[0.98]"
              >
                Close Gallery
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Detail Modal */}
      {previewPhoto && (
        <PhotoDetailModal
          photo={previewPhoto}
          allPhotos={filteredPhotos}
          categories={categories}
          onClose={() => setPreviewPhoto(null)}
          onNavigate={(direction) => {
            if (filteredPhotos.length <= 1) return;
            const currentIndex = filteredPhotos.findIndex(
              (p) => p.id === previewPhoto.id,
            );
            if (currentIndex === -1) return;

            const newIndex =
              direction === "next"
                ? (currentIndex + 1) % filteredPhotos.length
                : (currentIndex - 1 + filteredPhotos.length) %
                  filteredPhotos.length;
            const targetPhoto = filteredPhotos[newIndex];
            if (targetPhoto) {
              setPreviewPhoto(targetPhoto);
            }
          }}
        />
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          onDeletePhotos(Array.from(selectedPhotos));
          setSelectedPhotos(new Set());
          setShowDeleteConfirm(false);
        }}
        title="Delete Photos"
        message={`Are you sure you want to delete ${selectedPhotos.size} photo(s)?`}
        variant="danger"
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </div>,
    document.body,
  );
}
