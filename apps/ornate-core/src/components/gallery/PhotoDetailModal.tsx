"use client";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  Trash2,
  Replace,
  Plus,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface GalleryPhoto {
  id: string;
  filename?: string;
  name?: string;
  caption?: string;
  thumbnail?: string;
  url?: string;
  size?: string;
  dimensions?: string;
  uploadDate?: string;
}

interface GalleryCategory {
  id: string;
  name: string;
}

interface StoredPhotoMeta {
  caption?: string;
  credit?: string;
  altText?: string;
  tags?: string[];
}

interface PhotoDetailModalProps {
  photo: GalleryPhoto;
  allPhotos: GalleryPhoto[];
  categories: GalleryCategory[];
  isReadOnly?: boolean;
  onClose: () => void;
  onNavigate: (direction: "prev" | "next") => void;
  onReplaceImage?: (photoId: string, file: File) => Promise<void> | void;
  onDownloadImage?: (photo: GalleryPhoto) => void;
  onDeleteImage?: (photoId: string) => Promise<void> | void;
  confirmDelete?: () => boolean | Promise<boolean>;
  onSaveChanges?: (
    photoId: string,
    payload: { caption?: string },
  ) => Promise<void> | void;
}

const isUnsupportedImage = (url?: string) => {
  if (!url) return false;
  const ext = url.split("?")[0]?.split(".").pop()?.toLowerCase();
  return ext === "heic" || ext === "heif";
};

import { Image as ImageIcon } from "lucide-react";

export function PhotoDetailModal({
  photo,
  allPhotos,
  categories,
  isReadOnly = false,
  onClose,
  onNavigate,
  onReplaceImage,
  onDownloadImage,
  onDeleteImage,
  confirmDelete,
  onSaveChanges,
}: PhotoDetailModalProps) {
  const getPhotoStorageIdentity = (targetPhoto: GalleryPhoto) =>
    targetPhoto.id ||
    targetPhoto.url ||
    targetPhoto.filename ||
    targetPhoto.name ||
    "unknown-photo";

  const getMetaStorageKey = (targetPhoto: GalleryPhoto) =>
    `photo-detail-meta:${encodeURIComponent(getPhotoStorageIdentity(targetPhoto))}`;

  const readStoredMeta = (
    targetPhoto: GalleryPhoto,
  ): StoredPhotoMeta | null => {
    try {
      const raw = window.localStorage.getItem(getMetaStorageKey(targetPhoto));
      if (!raw) return null;
      const parsed = JSON.parse(raw) as StoredPhotoMeta;
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  };

  const writeStoredMeta = (
    targetPhoto: GalleryPhoto,
    meta: StoredPhotoMeta,
  ) => {
    try {
      window.localStorage.setItem(
        getMetaStorageKey(targetPhoto),
        JSON.stringify(meta),
      );
    } catch {
      // ignore storage failures
    }
  };

  const normalizeText = (value?: string | null) =>
    (value || "").trim().toLowerCase();
  const isFilenameLikeCredit = (value?: string | null) => {
    const normalizedValue = normalizeText(value);
    if (!normalizedValue) return false;

    const normalizedFilename = normalizeText(photo.filename);
    return normalizedValue === normalizedFilename;
  };

  const [zoom, setZoom] = useState(100);
  const [caption, setCaption] = useState(photo.caption || "");
  const [captionTouched, setCaptionTouched] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [altText, setAltText] = useState("");
  const [credit, setCredit] = useState(
    isFilenameLikeCredit(photo.caption) ? "" : photo.caption || "",
  );
  const [creditTouched, setCreditTouched] = useState(false);
  const [showOnWebsite, setShowOnWebsite] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);

  const currentIndex = allPhotos.findIndex((p) => p.id === photo.id);

  useEffect(() => {
    const nextValue = photo.caption || "";
    const stored = readStoredMeta(photo);
    const nextCredit =
      stored?.credit ?? (isFilenameLikeCredit(photo.caption) ? "" : nextValue);
    const nextCaption = stored?.caption ?? nextValue;

    setCaption(nextCaption);
    setCredit(nextCredit);
    setAltText(stored?.altText || "");
    setTags(Array.isArray(stored?.tags) ? stored!.tags : []);
    setNewTag("");
    setSelectedCategories([]);
    setCaptionTouched(false);
    setCreditTouched(false);
  }, [photo.id, photo.url, photo.caption, photo.filename, photo.name]);

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t: any) => t !== tag));
  };

  const handleDownload = () => {
    if (onDownloadImage) {
      onDownloadImage(photo);
      return;
    }

    const photoUrl = photo.url || photo.thumbnail;
    if (!photoUrl) return;

    const originalName = photo.filename || photo.name || "photo";
    const extensionMatch = photoUrl.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    const extension = extensionMatch?.[1]?.toLowerCase() || "jpg";
    const filename = originalName.includes(".")
      ? originalName.replace(/\.[^/.]+$/, ".png")
      : `${originalName}.png`;
    const safeFilename = filename.replace(/\s+/g, "_");
    const downloadUrl = `/api/branding/download?url=${encodeURIComponent(photoUrl)}&filename=${encodeURIComponent(safeFilename)}&format=png`;

    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = safeFilename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const handleDelete = async () => {
    if (!onDeleteImage) return;
    const confirmed = confirmDelete
      ? await confirmDelete()
      : window.confirm("Are you sure you want to delete this photo?");
    if (!confirmed) return;
    setIsDeleting(true);
    try {
      await onDeleteImage(photo.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReplace = async (file: File) => {
    if (!onReplaceImage) return;
    setIsReplacing(true);
    try {
      await onReplaceImage(photo.id, file);
    } finally {
      setIsReplacing(false);
    }
  };

  const handleSave = async () => {
    if (!onSaveChanges) return;
    setIsSaving(true);
    try {
      const finalCaption = creditTouched
        ? credit
        : captionTouched
          ? caption
          : photo.caption || "";

      await onSaveChanges(photo.id, { caption: finalCaption });

      const persistedCredit = creditTouched
        ? credit
        : isFilenameLikeCredit(finalCaption)
          ? ""
          : finalCaption;

      writeStoredMeta(photo, {
        caption: finalCaption,
        credit: persistedCredit,
        altText,
        tags,
      });

      setCaption(finalCaption);
      setCredit(persistedCredit);
      setCaptionTouched(false);
      setCreditTouched(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 lg:z-60">
      <div className="w-full h-full flex flex-col lg:flex-row">
        {/* Image Display */}
        <div className="relative flex items-center justify-center bg-transparent p-4 lg:p-8 w-full lg:w-auto h-[40vh] lg:h-full lg:flex-1 shrink-0">
          {/* Navigation Arrows */}
          <button
            onClick={() => onNavigate("prev")}
            className="absolute left-2 lg:left-6 top-1/2 -translate-y-1/2 p-2 lg:p-4 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all group/nav z-10"
          >
            <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6 text-white group-hover/nav:scale-110 transition-transform" />
          </button>
          <button
            onClick={() => onNavigate("next")}
            className="absolute right-2 lg:right-6 top-1/2 -translate-y-1/2 p-2 lg:p-4 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all group/nav z-10"
          >
            <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6 text-white group-hover/nav:scale-110 transition-transform" />
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 lg:top-6 lg:right-6 p-2 lg:p-4 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all group/close z-20"
          >
            <X className="w-5 h-5 lg:w-6 lg:h-6 text-white group-hover/close:rotate-90 transition-transform" />
          </button>

          {/* Zoom Controls */}
          <div className="absolute bottom-4 lg:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full p-1.5 lg:p-2 border border-white/10 z-10">
            <button
              onClick={() => setZoom(Math.max(50, zoom - 25))}
              className="p-1.5 lg:p-2 hover:bg-white/20 rounded-full transition-all"
            >
              <ZoomOut className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
            </button>
            <span className="text-white text-xs lg:text-sm font-medium px-2 lg:px-4 tabular-nums">
              {zoom}%
            </span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 25))}
              className="p-1.5 lg:p-2 hover:bg-white/20 rounded-full transition-all"
            >
              <ZoomIn className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
            </button>
          </div>

          {/* Image Container with Shadow */}
          <div className="relative shadow-2xl w-full h-full flex items-center justify-center overflow-hidden">
            {isUnsupportedImage(photo.url || photo.thumbnail) ? (
              <div className="flex flex-col items-center justify-center p-12 bg-white/5 rounded-3xl backdrop-blur-xl border border-white/10 text-center max-w-md mx-6">
                <ImageIcon className="w-20 h-20 text-white/40 mb-6" />
                <h3 className="text-xl font-bold text-white mb-2">
                  HEIC Image
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  This is a High Efficiency image format (original from
                  iPhone/iPad). While it's stored safely, your current browser
                  cannot render a preview of this format.
                </p>
                <div className="mt-8 flex gap-3">
                  <button
                    onClick={handleDownload}
                    className="px-6 py-2.5 bg-white text-black rounded-xl text-sm font-bold hover:bg-white/90 transition-all"
                  >
                    Download to View
                  </button>
                </div>
              </div>
            ) : (
              <Image
                src={photo.thumbnail || photo.url || ""}
                alt={photo.filename || photo.name || "Photo Detail"}
                width={1200}
                height={800}
                unoptimized
                className="max-w-full max-h-full object-contain transition-transform duration-300"
                style={{ transform: `scale(${zoom / 100})` }}
              />
            )}
          </div>

          {/* Photo Counter */}
          <div className="absolute top-4 left-4 lg:top-6 lg:left-6 px-3 py-1.5 lg:px-4 lg:py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10 z-10">
            <span className="text-white text-xs lg:text-sm font-medium tabular-nums">
              {currentIndex + 1} / {allPhotos.length}
            </span>
          </div>
        </div>

        {/* Details Panel */}
        <div className="w-full lg:w-96 bg-white overflow-y-auto h-[60vh] lg:h-full border-t lg:border-t-0 lg:border-l border-[#E5E7EB]">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div>
              <h3 className="text-lg font-semibold text-[#1A1A1A] mb-1">
                Photo Details
              </h3>
              <p className="text-sm text-[#6B7280]">
                Edit information and settings
              </p>
            </div>

            {/* Image Info */}
            <div className="pb-6 border-b border-[#E5E7EB]">
              <h4 className="text-xs font-semibold text-[#6B7280] mb-3">
                IMAGE INFO
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Filename:</span>
                  <span className="text-[#1A1A1A] font-medium">
                    {photo.filename}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Size:</span>
                  <span className="text-[#1A1A1A] font-medium">
                    {photo.size}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Dimensions:</span>
                  <span className="text-[#1A1A1A] font-medium">
                    {photo.dimensions}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Upload Date:</span>
                  <span className="text-[#1A1A1A] font-medium">
                    {photo.uploadDate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Uploaded by:</span>
                  <span className="text-[#1A1A1A] font-medium">Admin</span>
                </div>
              </div>
            </div>

            {/* Caption */}
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Caption
              </label>
              <textarea
                value={caption}
                onChange={(e) => {
                  setCaption(e.target.value);
                  setCaptionTouched(true);
                }}
                disabled={isReadOnly}
                rows={3}
                placeholder={
                  isReadOnly
                    ? "No caption available"
                    : "Add a caption for this photo..."
                }
                className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] resize-none disabled:bg-[#F9FAFB] disabled:text-[#6B7280]"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Category
              </label>
              <select
                multiple
                disabled={isReadOnly}
                className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] disabled:bg-[#F9FAFB] disabled:text-[#6B7280]"
                size={5}
              >
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {!isReadOnly && (
                <p className="text-xs text-[#6B7280] mt-1">
                  Hold Ctrl/Cmd to select multiple
                </p>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Tags
              </label>
              {!isReadOnly && (
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addTag()}
                    placeholder="Add tag..."
                    className="flex-1 px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                  />

                  <button
                    onClick={addTag}
                    className="p-2 bg-[#F7F8FA] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5 text-[#6B7280]" />
                  </button>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {tags.map((tag: any, index: any) => (
                  <div
                    key={index}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F7F8FA] border border-[#E5E7EB] rounded-full text-xs"
                  >
                    <span className="text-[#1A1A1A]">{tag}</span>
                    {!isReadOnly && (
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-[#EF4444] transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Alt Text */}
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Alt Text (Accessibility)
              </label>
              <input
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                disabled={isReadOnly}
                placeholder={
                  isReadOnly
                    ? "No alt text"
                    : "Describe the image for screen readers..."
                }
                className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] disabled:bg-[#F9FAFB] disabled:text-[#6B7280]"
              />
            </div>

            {/* Credit */}
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Credit/Photographer
              </label>
              <input
                type="text"
                value={credit}
                onChange={(e) => {
                  setCredit(e.target.value);
                  setCreditTouched(true);
                }}
                disabled={isReadOnly}
                placeholder={isReadOnly ? "No photo credit" : "Photo credit..."}
                className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] disabled:bg-[#F9FAFB] disabled:text-[#6B7280]"
              />
            </div>

            {/* Visibility Toggles */}
            {!isReadOnly && (
              <div className="space-y-3 pb-6 border-b border-[#E5E7EB]">
                <label className="flex items-center justify-between p-3 bg-[#F7F8FA] rounded-lg cursor-pointer">
                  <div>
                    <div className="text-sm font-medium text-[#1A1A1A]">
                      Show on Main Website
                    </div>
                    <div className="text-xs text-[#6B7280]">
                      Make visible to public
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={showOnWebsite}
                    onChange={(e) => setShowOnWebsite(e.target.checked)}
                    className="w-5 h-5 rounded border-[#E5E7EB]"
                  />
                </label>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              <input
                ref={replaceInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleReplace(file);
                  }
                  e.currentTarget.value = "";
                }}
              />
              {!isReadOnly && (
                <button
                  onClick={() => replaceInputRef.current?.click()}
                  disabled={!onReplaceImage || isReplacing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#F7F8FA] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#1A1A1A] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Replace className="w-4 h-4" />
                  {isReplacing ? "Replacing..." : "Replace Image"}
                </button>
              )}
              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#F7F8FA] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#1A1A1A] transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Original
              </button>
              {!isReadOnly && (
                <button
                  onClick={handleDelete}
                  disabled={!onDeleteImage || isDeleting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FEE2E2] hover:bg-[#FECACA] border border-[#FEE2E2] rounded-lg text-sm font-medium text-[#EF4444] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? "Deleting..." : "Delete Photo"}
                </button>
              )}
            </div>

            {/* Save Button */}
            {!isReadOnly && (
              <button
                onClick={handleSave}
                disabled={!onSaveChanges || isSaving}
                className="w-full px-4 py-3 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#2D2D2D] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
