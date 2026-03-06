'use client';
import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import { X, Download, Trash2, Eye, Check } from 'lucide-react';
import Image from 'next/image';
import { PhotoDetailModal } from './PhotoDetailModal';

interface GalleryCategory {
  id: string;
  name: string;
}

interface GalleryPhoto {
  id: string;
  filename?: string;
  name?: string;
  url?: string;
  thumbnail?: string;
  size?: string;
}

interface ViewGalleryModalProps {
  category?: GalleryCategory | null;
  photos: GalleryPhoto[];
  isReadOnly?: boolean;
  onDeletePhotos: (photoIds: string[]) => void | Promise<void>;
  confirmDeletePhotos?: (count: number) => boolean | Promise<boolean>;
  onUpdatePhoto?: (photoId: string, payload: { caption?: string }) => void | Promise<void>;
  onReplacePhoto?: (photoId: string, file: File) => void | Promise<void>;
  onDownloadPhoto?: (photo: GalleryPhoto) => void | Promise<void>;
  openPreviewOnImageClick?: boolean;
  onClose: () => void;
}

const isUnsupportedImage = (url?: string) => {
  if (!url) return false;
  const ext = url.split('?')[0]?.split('.').pop()?.toLowerCase();
  return ext === 'heic' || ext === 'heif';
};

export function ViewGalleryModal({
  category,
  photos,
  isReadOnly = false,
  onDeletePhotos,
  confirmDeletePhotos,
  onUpdatePhoto,
  onReplacePhoto,
  onDownloadPhoto,
  openPreviewOnImageClick = false,
  onClose
}: ViewGalleryModalProps) {
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [previewPhoto, setPreviewPhoto] = useState<GalleryPhoto | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!mounted) return null;

  const togglePhotoSelection = (photoId: string) => {
    const newSelection = new Set(selectedPhotos);
    if (newSelection.has(photoId)) {
      newSelection.delete(photoId);
    } else {
      newSelection.add(photoId);
    }
    setSelectedPhotos(newSelection);
  };

  const selectAll = () => {
    if (selectedPhotos.size === photos.length) {
      setSelectedPhotos(new Set());
    } else {
      setSelectedPhotos(new Set(photos.map((p: any) => p.id)));
    }
  };

  const handleDelete = async () => {
    if (selectedPhotos.size === 0) return;

    const confirmed = confirmDeletePhotos
      ? await confirmDeletePhotos(selectedPhotos.size)
      : confirm(`Are you sure you want to delete ${selectedPhotos.size} photo(s)?`);

    if (!confirmed) return;
    await onDeletePhotos(Array.from(selectedPhotos));
    setSelectedPhotos(new Set());
  };

  const triggerPhotoDownload = (photo: GalleryPhoto) => {
    if (onDownloadPhoto) {
      onDownloadPhoto(photo);
      return;
    }

    const photoUrl = photo.url || photo.thumbnail;
    if (!photoUrl) return;

    const originalName = photo.filename || photo.name || 'photo';
    const extensionMatch = photoUrl.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    const extension = extensionMatch?.[1]?.toLowerCase() || 'jpg';
    const filename = originalName.includes('.') ? originalName : `${originalName}.${extension}`;
    const safeFilename = filename.replace(/\s+/g, '_');
    const downloadUrl = `/api/branding/download?url=${encodeURIComponent(photoUrl)}&filename=${encodeURIComponent(safeFilename)}`;

    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.download = safeFilename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const handleDownloadSelected = () => {
    if (selectedPhotos.size === 0) return;
    const selectedSet = new Set(selectedPhotos);
    const selected = photos.filter((photo) => selectedSet.has(photo.id));
    selected.forEach((photo) => triggerPhotoDownload(photo));
  };

  const activePreviewPhoto = previewPhoto
    ? photos.find((photo) => photo.id === previewPhoto.id) || previewPhoto
    : null;

  return createPortal(
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-9999 p-4 md:p-8">
      <div className="bg-[#F4F2F0] rounded-[18px] p-[10px] w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-[12px] pt-[10px] pb-[16px]">
          <div>
            <h2 className="text-[18px] font-semibold text-[#1A1A1A] mb-1">{category?.name || 'Album'}</h2>
            <p className="text-sm text-[#6B7280]">{photos.length} photos</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#E5E7EB] rounded-lg transition-colors">
            <X className="w-5 h-5 text-[#6B7280]" />
          </button>
        </div>

        <div className="bg-white rounded-[14px] flex-1 overflow-y-auto flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 bg-[#F7F8FA] border-b border-[#E5E7EB] gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={selectAll}
                className="px-3 py-2 text-sm font-medium text-[#1A1A1A] bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F7F8FA] transition-colors"
              >
                {selectedPhotos.size === photos.length && photos.length > 0 ? 'Deselect All' : 'Select All'}
              </button>
              {selectedPhotos.size > 0 && <span className="text-sm text-[#6B7280]">{selectedPhotos.size} selected</span>}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {selectedPhotos.size > 0 && (
                <>
                  <button
                    onClick={handleDownloadSelected}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-[#1A1A1A] bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F7F8FA] transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  {!isReadOnly && (
                    <button
                      onClick={handleDelete}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-[#EF4444] rounded-lg hover:bg-[#DC2626] transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {photos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-20">
                <div className="w-16 h-16 bg-[#F7F8FA] rounded-full flex items-center justify-center mb-4">
                  <ImageIcon className="w-8 h-8 text-[#9CA3AF]" />
                </div>
                <h3 className="text-lg font-medium text-[#1A1A1A]">No photos in this album</h3>
                <p className="text-sm text-[#6B7280]">Use the upload button in the main gallery to add photos.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo: any) => (
                  <div
                    key={photo.id}
                    className="relative group cursor-pointer"
                    onClick={() => {
                      if (openPreviewOnImageClick) {
                        setPreviewPhoto(photo);
                        return;
                      }
                      togglePhotoSelection(photo.id);
                    }}
                  >
                    <div
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedPhotos.has(photo.id)
                        ? 'border-[#10B981] ring-2 ring-[#10B981]'
                        : 'border-transparent hover:border-[#E5E7EB]'
                        }`}
                    >
                      {isUnsupportedImage(photo.url || photo.thumbnail || '') ? (
                        <div className="absolute inset-0 bg-[#F7F8FA] flex flex-col items-center justify-center p-4 text-center">
                          <ImageIcon className="w-10 h-10 text-[#9CA3AF] mb-2" />
                          <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">HEIC Image</span>
                          <span className="text-[9px] text-[#9CA3AF] mt-1 px-2">Preview not available in this browser</span>
                        </div>
                      ) : (
                        <Image
                          src={photo.url || photo.thumbnail || ''}
                          alt={photo.filename || photo.name || 'Gallery Image'}
                          width={400}
                          height={400}
                          unoptimized
                          className="w-full h-full object-cover"
                        />
                      )}

                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all z-10" />

                      <div className="absolute top-2 left-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                        {!isReadOnly && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeletePhotos([photo.id]);
                            }}
                            className="p-2 bg-white/20 hover:bg-[#EF4444] rounded-full backdrop-blur-md transition-all text-white shadow-lg"
                            title="Delete Photo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewPhoto(photo);
                          }}
                          className="p-2 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur-md transition-all text-white shadow-lg"
                          title="View Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="absolute top-2 right-2 z-20">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePhotoSelection(photo.id);
                          }}
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer ${selectedPhotos.has(photo.id)
                            ? 'bg-[#10B981] border-[#10B981] shadow-lg scale-110'
                            : 'bg-white/80 border-white backdrop-blur-sm opacity-0 group-hover:opacity-100'
                            }`}
                        >
                          {selectedPhotos.has(photo.id) && (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-[#6B7280]">
                      <div className="font-medium text-[#1A1A1A] truncate">{photo.filename || photo.name}</div>
                      <div>{photo.size || 'Original'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {activePreviewPhoto && (
        <PhotoDetailModal
          photo={activePreviewPhoto}
          allPhotos={photos}
          categories={category ? [category] : []}
          isReadOnly={isReadOnly}
          onDownloadImage={triggerPhotoDownload}
          onDeleteImage={(photoId) => onDeletePhotos([photoId])}
          {...(onReplacePhoto ? { onReplaceImage: onReplacePhoto } : {})}
          {...(confirmDeletePhotos ? { confirmDelete: () => confirmDeletePhotos(1) } : {})}
          {...(onUpdatePhoto ? { onSaveChanges: onUpdatePhoto } : {})}
          onClose={() => setPreviewPhoto(null)}
          onNavigate={(direction) => {
            if (!photos || photos.length <= 1) return;
            const currentIndex = photos.findIndex((p) => p.id === activePreviewPhoto.id);
            if (currentIndex === -1) return;

            const newIndex = direction === 'next'
              ? (currentIndex + 1) % photos.length
              : (currentIndex - 1 + photos.length) % photos.length;
            const targetPhoto = photos[newIndex];
            if (targetPhoto) {
              setPreviewPhoto(targetPhoto);
            }
          }}
        />
      )}
    </div>,
    document.body
  );
}

interface ImageIconProps {
  className?: string;
}

function ImageIcon({ className }: ImageIconProps) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}
