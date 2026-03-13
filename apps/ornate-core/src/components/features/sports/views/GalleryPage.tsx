'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Plus, Upload, Grid3x3, List, Archive } from 'lucide-react';
import { uploadFileToR2 } from '@/lib/upload';
import { GalleryGridView } from '@/components/gallery/GalleryGridView';
import { GalleryListView } from '@/components/gallery/GalleryListView';
import { CategoryModal } from '@/components/gallery/CategoryModal';
import { UploadPhotosModal } from '@/components/gallery/UploadPhotosModal';
import { ViewGalleryModal } from '@/components/gallery/ViewGalleryModal';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/hooks/useToast';
import { Skeleton } from '@/components/ui/skeleton';
import { downloadAlbumPhotosAsZip } from '@/lib/galleryZip';
import {
  getGalleryAlbums,
  createGalleryAlbum,
  updateGalleryAlbum,
  deleteGalleryAlbum,
  getAlbumPhotos,
  updateGalleryImage,
  type FormattedGalleryAlbum,
  type FormattedGalleryImage
} from '@/actions/galleryActions';

export function GalleryPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [viewType, setViewType] = useState('grid');
  const [categories, setCategories] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [showViewGalleryModal, setShowViewGalleryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [uploadCategory, setUploadCategory] = useState('All Categories');
  const [viewMode, setViewMode] = useState('active'); // 'active' or 'archived'
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [showImageDeleteConfirm, setShowImageDeleteConfirm] = useState(false);
  const [imageDeleteCount, setImageDeleteCount] = useState(0);
  const [imageDeleteResolver, setImageDeleteResolver] = useState<((value: boolean) => void) | null>(null);
  const { data: session } = useSession();
  const router = useRouter();
  const userRole = session?.user?.role;
  const isReadOnly = userRole === 'BRANCH_SPORTS_ADMIN';

  const { showToast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await getGalleryAlbums();
      if (res.success) {
        setCategories(res.data || []);
      } else {
        showToast(res.error || "Failed to load albums", "error");
      }
    } catch (error) {
      console.error("Error fetching gallery albums:", error);
      showToast("Network error while loading albums", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleArchiveCategory = async (category: any) => {
    try {
      const res = await updateGalleryAlbum(category.id, {
        ...category,
        isArchived: !category.isArchived
      });
      if (res.success) {
        setCategories(prev => prev.map(cat =>
          cat.id === category.id ? { ...cat, isArchived: !cat.isArchived } : cat
        ));
        showToast(`Category ${category.isArchived ? 'restored' : 'archived'} successfully`, 'success');
        router.refresh();
        fetchData();
      } else {
        showToast(res.error || "Failed to update category", "error");
      }
    } catch (error) {
      showToast("Failed to update category", "error");
    }
  };

  const handleViewGallery = async (category: any) => {
    setSelectedCategory(category);
    setIsLoading(true);
    try {
      const res = await getAlbumPhotos(category.id);
      if (res.success) {
        setPhotos((res.data || []).map(p => ({
          ...p,
          filename: p.caption || "",
          thumbnail: p.url,
          category: category.name
        })));
        setShowViewGalleryModal(true);
      } else {
        showToast(res.error || "Failed to load photos", "error");
      }
    } catch (error) {
      showToast("Failed to load photos", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePhotos = async (photoIds: string[]) => {
    const { deleteGalleryImages } = await import('@/actions/galleryActions');
    try {
      const res = await deleteGalleryImages(photoIds);
      if (res.success) {
        setPhotos(prev => prev.filter(p => !photoIds.includes(p.id)));
        showToast('Photos deleted successfully', 'success');
        // Refresh album data to update cover images/counts if needed
        router.refresh();
        fetchData();
      } else {
        showToast(res.error || "Failed to delete photos", "error");
      }
    } catch (error) {
      showToast("Failed to delete photos", "error");
    }
  };

  const downloadPhoto = (url?: string, filename?: string) => {
    if (!url) return;
    const baseName = (filename || 'photo').trim() || 'photo';

    // Force .png for downloading as a viewable image
    const cleanName = baseName.replace(/\.[^/.]+$/, "").replace(/\s+/g, '_');
    const safeFilename = `${cleanName}.png`;
    const downloadUrl = `/api/branding/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(safeFilename)}&format=png`;

    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.download = safeFilename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const handleDownloadCategory = async (category: any) => {
    try {
      const res = await getAlbumPhotos(category.id);
      if (!res.success) {
        showToast(res.error || 'Failed to fetch photos for download', 'error');
        return;
      }

      const albumPhotos = res.data || [];
      if (albumPhotos.length === 0) {
        showToast('No photos available to download', 'warning');
        return;
      }

      const { added, failed } = await downloadAlbumPhotosAsZip(category.name || 'album', albumPhotos);
      if (failed > 0) {
        showToast(`Downloaded ZIP with ${added} photo(s). ${failed} failed.`, 'warning');
      } else {
        showToast(`Downloaded ZIP with ${added} photo(s).`, 'success');
      }
    } catch (error) {
      showToast('Failed to download album ZIP', 'error');
    }
  };

  const handleSavePhotoChanges = async (photoId: string, payload: { caption?: string }) => {
    const res = await updateGalleryImage(photoId, {
      ...(payload.caption !== undefined ? { caption: payload.caption } : {}),
    });
    if (!res.success) {
      showToast(res.error || 'Failed to save photo changes', 'error');
      return;
    }

    const nextCaption = payload.caption ?? '';
    setPhotos(prev => prev.map(photo =>
      photo.id === photoId
        ? { ...photo, caption: nextCaption, filename: nextCaption }
        : photo
    ));
    showToast('Photo changes saved', 'success');
    router.refresh();
    fetchData();
  };

  const handleReplacePhoto = async (photoId: string, file: File) => {
    const uploadedUrl = await uploadFileToR2(file);
    if (!uploadedUrl) {
      showToast('Failed to upload replacement image', 'error');
      return;
    }

    const res = await updateGalleryImage(photoId, { url: uploadedUrl });
    if (!res.success) {
      showToast(res.error || 'Failed to replace photo', 'error');
      return;
    }

    setPhotos(prev => prev.map(photo =>
      photo.id === photoId
        ? { ...photo, url: uploadedUrl, thumbnail: uploadedUrl }
        : photo
    ));
    showToast('Photo replaced successfully', 'success');
    router.refresh();
    fetchData();
  };

  const confirmDeleteWithDialog = (count: number) => new Promise<boolean>((resolve) => {
    setImageDeleteCount(count);
    setShowImageDeleteConfirm(true);
    setImageDeleteResolver(() => resolve);
  });

  const resolveImageDelete = (value: boolean) => {
    if (imageDeleteResolver) {
      imageDeleteResolver(value);
    }
    setImageDeleteResolver(null);
    setShowImageDeleteConfirm(false);
    setImageDeleteCount(0);
  };

  const displayCategories = categories.filter(cat =>
    viewMode === 'active' ? !cat.isArchived : cat.isArchived
  );

  return (
    <div className="min-h-screen bg-white p-4 md:p-8 animate-page-entrance">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-wrap items-center gap-1 md:gap-2 text-[10px] md:text-sm text-[#6B7280] mb-3">
            <span className="whitespace-nowrap">Dashboard</span>
            <span className="whitespace-nowrap text-[#9CA3AF]">›</span>
            <span className="whitespace-nowrap">Content Management</span>
            <span className="whitespace-nowrap text-[#9CA3AF]">›</span>
            <span className="text-[#1A1A1A] font-medium whitespace-nowrap">Gallery Management</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <h1 className="text-xl md:text-[28px] font-semibold text-[#1A1A1A] truncate">Gallery Management</h1>
            <div className="flex items-center gap-2 shrink-0">
              {!isReadOnly && (
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setShowCategoryModal(true);
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 sm:px-5 sm:py-3 bg-white border border-[#E5E7EB] rounded-lg text-xs sm:text-sm font-medium text-[#1A1A1A] hover:bg-[#F7F8FA] transition-colors whitespace-nowrap">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden xs:inline">New Category</span>
                  <span className="xs:hidden">New</span>
                </button>
              )}

              <button
                onClick={() => setViewMode(viewMode === 'active' ? 'archived' : 'active')}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 sm:px-5 sm:py-3 border rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${viewMode === 'archived'
                  ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                  : 'bg-white text-[#1A1A1A] border-[#E5E7EB] hover:bg-[#F7F8FA]'
                  }`}>
                <Archive className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{viewMode === 'active' ? 'Archived' : 'Gallery'}</span>
              </button>

              {!isReadOnly && (
                <button
                  onClick={() => {
                    const firstCategoryName = displayCategories[0]?.name || 'All Categories';
                    setUploadCategory(firstCategoryName);
                    setShowUploadModal(true);
                  }}
                  className="hidden sm:flex items-center justify-center gap-2 px-5 py-3 bg-[#10B981] text-white rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors shadow-sm">
                  <Upload className="w-5 h-5" />
                  Upload Photos
                </button>
              )}
            </div>
          </div>
          {!isReadOnly && (
            <div className="mt-3 sm:hidden">
              <button
                onClick={() => {
                  const firstCategoryName = displayCategories[0]?.name || 'All Categories';
                  setUploadCategory(firstCategoryName);
                  setShowUploadModal(true);
                }}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-[#10B981] text-white rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors shadow-sm w-full">
                <Upload className="w-5 h-5" />
                Upload Photos
              </button>
            </div>
          )}
        </div>

        {/* View Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-[#1A1A1A]">Categories</h2>
            <div className="px-3 py-1 bg-[#F7F8FA] border border-[#E5E7EB] rounded-full">
              <span className="text-sm text-[#6B7280]">{displayCategories.length} categories</span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-white border border-[#E5E7EB] rounded-lg p-1">
            <button
              onClick={() => setViewType('grid')}
              className={`p-2 rounded transition-colors ${viewType === 'grid' ?
                'bg-[#F7F8FA] text-[#1A1A1A]' :
                'text-[#6B7280] hover:bg-[#F7F8FA]'}`
              }>
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewType('list')}
              className={`p-2 rounded transition-colors ${viewType === 'list' ?
                'bg-[#F7F8FA] text-[#1A1A1A]' :
                'text-[#6B7280] hover:bg-[#F7F8FA]'}`
              }>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Categories Display */}
        <div className="animate-card-entrance" style={{ animationDelay: '200ms' }}>
          {isLoading ? (
            <div className={viewType === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {[...Array(viewType === 'grid' ? 6 : 4)].map((_: any, i: any) => (
                viewType === 'grid' ? (
                  <div key={i} className="bg-white border border-[#E5E7EB] rounded-12 p-1 overflow-hidden">
                    <Skeleton width="100%" height={160} borderRadius={8} />
                    <div className="p-3">
                      <Skeleton width="70%" height={18} className="mb-2" />
                      <Skeleton width="40%" height={14} />
                    </div>
                  </div>
                ) : (
                  <div key={i} className="bg-white border border-[#E5E7EB] rounded-12 p-4 flex items-center gap-4">
                    <Skeleton width={80} height={45} borderRadius={4} />
                    <div className="flex-1">
                      <Skeleton width="40%" height={16} className="mb-2" />
                      <Skeleton width="20%" height={12} />
                    </div>
                    <Skeleton width={80} height={20} borderRadius={10} />
                    <Skeleton width={32} height={32} borderRadius={8} />
                  </div>
                )
              ))}
            </div>
          ) : viewType === 'grid' ? (
            <GalleryGridView
              categories={displayCategories as any}
              isReadOnly={isReadOnly}
              onEditCategory={(category) => {
                setEditingCategory(category);
                setShowCategoryModal(true);
              }}
              onUploadPhotos={(catName) => {
                setUploadCategory(catName || 'All Categories');
                setShowUploadModal(true);
              }}
              onViewGallery={handleViewGallery}
              onDownloadCategory={handleDownloadCategory}
              onArchiveCategory={handleArchiveCategory}
              onDeleteCategory={(category) => {
                setConfirmAction(() => async () => {
                  const res = await deleteGalleryAlbum(category.id);
                  if (res.success) {
                    setCategories(prev => prev.filter(c => c.id !== category.id));
                    showToast('Category deleted successfully', 'success');
                    router.refresh();
                    fetchData();
                  } else {
                    showToast(res.error || "Failed to delete category", "error");
                  }
                });
                setShowConfirmDialog(true);
              }} />
          ) : (
            <GalleryListView
              categories={displayCategories as any}
              isReadOnly={isReadOnly}
              onEditCategory={(category) => {
                setEditingCategory(category);
                setShowCategoryModal(true);
              }}
              onUploadPhotos={(catName) => {
                setUploadCategory(catName || 'All Categories');
                setShowUploadModal(true);
              }}
              onViewGallery={handleViewGallery}
              onArchiveCategory={handleArchiveCategory}
              onDeleteCategory={(category) => {
                setConfirmAction(() => async () => {
                  const res = await deleteGalleryAlbum(category.id);
                  if (res.success) {
                    setCategories(prev => prev.filter(c => c.id !== category.id));
                    showToast('Category deleted successfully', 'success');
                    router.refresh();
                    fetchData();
                  } else {
                    showToast(res.error || "Failed to delete category", "error");
                  }
                });
                setShowConfirmDialog(true);
              }} />
          )}

          {!isLoading && displayCategories.length === 0 && (
            <div className="text-center py-20 bg-[#F7F8FA] rounded-2xl border border-dashed border-[#E5E7EB]">
              <Grid3x3 className="w-12 h-12 text-[#9CA3AF] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#1A1A1A]">No categories found</h3>
              <p className="text-sm text-[#6B7280] mb-6">Create a new category to start managing your gallery.</p>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="inline-flex items-center gap-2 px-6 py-2 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#2D2D2D] transition-colors">
                <Plus className="w-4 h-4" />
                New Category
              </button>
            </div>
          )}
        </div>

        {/* Modals */}
        {showCategoryModal &&
          <CategoryModal
            category={editingCategory as any}
            onClose={() => {
              setShowCategoryModal(false);
              setEditingCategory(null);
            }}
            onSave={async (data: any) => {
              setIsLoading(true);
              try {
                if (editingCategory) {
                  const res = await updateGalleryAlbum(editingCategory.id, data);
                  if (res.success) {
                    showToast('Category updated successfully', 'success');
                    router.refresh();
                    fetchData();
                  } else {
                    showToast(res.error || "Failed to update category", "error");
                  }
                } else {
                  const res = await createGalleryAlbum(data);
                  if (res.success) {
                    showToast('Category created successfully', 'success');
                    router.refresh();
                    fetchData();
                  } else {
                    showToast(res.error || "Failed to create category", "error");
                  }
                }
              } catch (error) {
                showToast("An error occurred", "error");
              } finally {
                setIsLoading(false);
                setShowCategoryModal(false);
                setEditingCategory(null);
              }
            }} />
        }

        {showUploadModal &&
          <UploadPhotosModal
            categories={categories}
            uploadedPhotos={photos}
            initialCategory={uploadCategory}
            hideTargetAlbumDropdown={true}
            setUploadedPhotos={setPhotos}
            onDeletePhotos={handleDeletePhotos}
            onSuccess={fetchData}
            onClose={() => setShowUploadModal(false)} />
        }

        {showViewGalleryModal &&
          <ViewGalleryModal
            category={selectedCategory}
            photos={photos}
            isReadOnly={isReadOnly}
            onDeletePhotos={handleDeletePhotos}
            confirmDeletePhotos={confirmDeleteWithDialog}
            onUpdatePhoto={handleSavePhotoChanges}
            onReplacePhoto={handleReplacePhoto}
            onDownloadPhoto={(photo) => downloadPhoto(photo.url || photo.thumbnail, photo.filename || photo.name)}
            openPreviewOnImageClick={true}
            onClose={() => setShowViewGalleryModal(false)} />
        }

        <ConfirmDialog
          isOpen={showImageDeleteConfirm}
          onClose={() => resolveImageDelete(false)}
          title="Confirm Deletion"
          message={`Are you sure you want to delete ${imageDeleteCount} photo${imageDeleteCount > 1 ? 's' : ''}? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          type="danger"
          onConfirm={() => resolveImageDelete(true)}
          onCancel={() => resolveImageDelete(false)}
        />

        <ConfirmDialog
          isOpen={showConfirmDialog}
          onClose={() => setShowConfirmDialog(false)}
          title="Confirm Deletion"
          message="Are you sure you want to delete this category? This action cannot be undone."
          onConfirm={() => {
            if (confirmAction) confirmAction();
            setShowConfirmDialog(false);
          }}
          onCancel={() => setShowConfirmDialog(false)} />

      </div>
    </div>
  );
}
