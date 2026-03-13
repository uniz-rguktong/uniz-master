'use client';

import { useState, useEffect } from 'react';
import { Plus, Upload, Grid3x3, List, Archive } from 'lucide-react';
import { GalleryGridView } from '@/components/gallery/GalleryGridView';
import { GalleryListView } from '@/components/gallery/GalleryListView';
import { CategoryModal } from '@/components/gallery/CategoryModal';
import { UploadPhotosModal } from '@/components/gallery/UploadPhotosModal';
import { ViewGalleryModal } from '@/components/gallery/ViewGalleryModal';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/hooks/useToast';
import { usePathname } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { downloadAlbumPhotosAsZip } from '@/lib/galleryZip';
import { uploadFileToR2 } from '@/lib/upload';



import {
  getGalleryAlbums,
  createGalleryAlbum,
  updateGalleryAlbum,
  deleteGalleryAlbum,
  getAlbumPhotos,
  addPhotosToAlbum,
  deleteGalleryImages,
  updateGalleryImage,
  type FormattedGalleryAlbum,
  type FormattedGalleryImage
} from '@/actions/galleryActions';

interface GalleryPageProps {
  initialAlbums?: FormattedGalleryAlbum[];
}

export function GalleryPage({ initialAlbums = [] }: GalleryPageProps) {
  const pathname = usePathname();
  const isBranchAdminRoute = pathname?.startsWith('/branch-admin');
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialAlbums || initialAlbums.length === 0);
  const [viewType, setViewType] = useState('grid');
  const [categories, setCategories] = useState<any[]>(initialAlbums);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      if (initialAlbums && initialAlbums.length > 0) {
        setCategories(initialAlbums);
        setIsLoading(false);
      } else if (categories.length === 0) {
        // Only load if no initial data and no current data
        loadData();
      }
    }
  }, [isMounted]); // Removed initialAlbums from dependency to prevent loop if parent passes new ref on every render

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await getGalleryAlbums();
      if (res.success) {
        setCategories(res.data || []);
      } else {
        // showToast(res.error || "Failed to load albums", "error");
      }
    } catch (error) {
      console.error(error);
      // showToast("Failed to load data", "error");
    } finally {
      setIsLoading(false);
    }
  };
  const [photos, setPhotos] = useState<any[]>([]); // This will be loaded when an album is selected or for generic view if needed.
  // Note: Current UI assumes photos are available globally for 'Uncategorized' logic. 
  // We might need to adjust or fetch all photos. For optimization, let's keep photos empty for now and fetch on demand in view modal.

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [showViewGalleryModal, setShowViewGalleryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [uploadCategory, setUploadCategory] = useState('All Categories');
  const [viewMode, setViewMode] = useState('active'); // 'active' or 'archived'
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => Promise<void>) | null>(null);
  const [showImageDeleteConfirm, setShowImageDeleteConfirm] = useState(false);
  const [imageDeleteCount, setImageDeleteCount] = useState(0);
  const [imageDeleteResolver, setImageDeleteResolver] = useState<((value: boolean) => void) | null>(null);
  const { showToast } = useToast();

  const handleCreateOrUpdateCategory = async (data: any) => {
    setShowCategoryModal(false);
    setIsLoading(true);
    try {
      if (editingCategory) {
        const res = await updateGalleryAlbum(editingCategory.id, data);
        if (res.success) {
          showToast('Gallery updated successfully', 'success');
          loadData();
        } else {
          showToast(res.error || 'Update failed', 'error');
        }
      } else {
        const res = await createGalleryAlbum(data);
        if (res.success) {
          showToast('Gallery created successfully', 'success');
          loadData();
        } else {
          showToast(res.error || 'Creation failed', 'error');
        }
      }
    } catch (error) {
      showToast('Operation failed', 'error');
    } finally {
      setIsLoading(false);
      setEditingCategory(null);
    }
  };


  // For fetching photos when viewing an album
  const handleViewGallery = async (category: any) => {
    setSelectedCategory(category);
    setPhotos([]); // Clear previous photos
    setShowViewGalleryModal(true); // Open modal immediately

    // Fetch photos in background
    try {
      const res = await getAlbumPhotos(category.id);
      if (res.success) {
        setPhotos((res.data || []).map((photo: any) => ({
          ...photo,
          filename: photo.caption || '',
          thumbnail: photo.url,
          category: category.name
        })));
      } else {
        showToast('Failed to load photos', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load photos', 'error');
    }
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

  const uncategorizedPhotos: any[] = []; // Removed mocking logic for now
  // If you want uncategorized, you'd need a separate API call or logic.
  // For now simpler is better.

  const allCategories = categories; // Simplify for now without uncategorized complexity unless backend supports it.


  const filteredCategories = allCategories.filter(cat => {
    if (cat.isUncategorized) return viewMode === 'active';
    return viewMode === 'active' ? !cat.isArchived : cat.isArchived;
  });

  const displayCategories = filteredCategories;

  const handleArchiveCategory = async (category: any) => {
    setIsLoading(true);
    try {
      const res = await updateGalleryAlbum(category.id, { isArchived: !category.isArchived });
      if (res.success) {
        showToast(`Gallery ${category.isArchived ? 'restored' : 'archived'} successfully`, 'success');
        loadData();
      } else {
        showToast(res.error || 'Failed to update gallery', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to update category', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePhotos = async (photoIds: any[]) => {
    try {
      const res = await deleteGalleryImages(photoIds);
      if (res.success) {
        showToast(`Successfully deleted ${photoIds.length} photo(s)`, 'success');
        // Refresh local photo list if in modal
        setPhotos(prev => prev.filter(p => !photoIds.includes(p.id)));
        // Refresh albums count
        loadData();
      } else {
        showToast(res.error || 'Failed to delete photos', 'error');
      }
    } catch (error) {
      showToast('An error occurred during deletion', 'error');
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
  };

  const confirmDeleteWithDialog = (count: number) => new Promise<boolean>((resolve) => {
    setImageDeleteCount(count);
    setShowImageDeleteConfirm(true);
    setImageDeleteResolver(() => resolve);
  });

  const resolveImageDelete = (value: boolean) => {
    if (imageDeleteResolver) imageDeleteResolver(value);
    setShowImageDeleteConfirm(false);
    setImageDeleteResolver(null);
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-white p-8 animate-page-entrance">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 text-sm text-[#6B7280] mb-3">
            <span className="whitespace-nowrap">Dashboard</span>
            <span className="whitespace-nowrap">›</span>
            <span className="whitespace-nowrap">Content Management</span>
            <span className="whitespace-nowrap">›</span>
            <span className="text-[#1A1A1A] font-medium whitespace-nowrap">Gallery Management</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-xl md:text-[28px] font-semibold text-[#1A1A1A]">Gallery Management</h1>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="grid grid-cols-2 sm:flex w-full gap-3">
                <button
                  onClick={() => setShowCategoryModal(true)}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#1A1A1A] hover:bg-[#F7F8FA] transition-colors w-full sm:w-auto">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="truncate">New Gallery</span>
                </button>

                <button
                  onClick={() => setViewMode(viewMode === 'active' ? 'archived' : 'active')}
                  className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3 border rounded-lg text-sm font-medium transition-colors w-full sm:w-auto ${viewMode === 'archived'
                    ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                    : 'bg-white text-[#1A1A1A] border-[#E5E7EB] hover:bg-[#F7F8FA]'
                    }`}>
                  <Archive className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="truncate">{viewMode === 'active' ? 'Archived' : 'Back to Gallery'}</span>
                </button>
              </div>

              <button
                onClick={() => {
                  if (isBranchAdminRoute) {
                    const firstCategoryName = categories[0]?.name || 'All Categories';
                    setUploadCategory(firstCategoryName);
                  }
                  setShowUploadModal(true);
                }}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-[#10B981] text-white rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors shadow-sm w-full sm:w-auto">

                <Upload className="w-5 h-5" />
                Upload Photos
              </button>
            </div>
          </div>
        </div>

        {/* View Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-[#1A1A1A]">Galleries</h2>
            <div className="px-3 py-1 bg-[#F7F8FA] border border-[#E5E7EB] rounded-full">
              <span className="text-sm text-[#6B7280]">{categories.length} galleries</span>
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
              {[...Array(viewType === 'grid' ? 8 : 5)].map((_: any, i: any) => (
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
              onEditCategory={(category: any) => {
                if (category.isUncategorized) {
                  showToast('The Uncategorized category cannot be edited directly.', 'info');
                  return;
                }
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
                    showToast('Category deleted successfully', 'success');
                    loadData();
                  } else {
                    showToast(res.error || 'Delete failed', 'error');
                  }
                });
                setShowConfirmDialog(true);
              }} />
          ) : (
            <GalleryListView
              categories={displayCategories as any}
              onEditCategory={(category: any) => {
                if (category.isUncategorized) return;
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
                    showToast('Category deleted successfully', 'success');
                    loadData();
                  } else {
                    showToast(res.error || 'Delete failed', 'error');
                  }
                });
                setShowConfirmDialog(true);
              }} />
          )}
        </div>

        {/* Modals */}
        {showCategoryModal &&
          <CategoryModal
            category={editingCategory}
            onClose={() => {
              setShowCategoryModal(false);
              setEditingCategory(null);
            }}
            onSave={handleCreateOrUpdateCategory} />

        }

        {showUploadModal &&
          <UploadPhotosModal
            categories={categories}
            uploadedPhotos={photos}
            initialCategory={uploadCategory}
            hideTargetAlbumDropdown={isBranchAdminRoute}
            setUploadedPhotos={setPhotos}
            onDeletePhotos={handleDeletePhotos}
            onSuccess={loadData}
            onClose={() => setShowUploadModal(false)} />
        }

        {showViewGalleryModal &&
          <ViewGalleryModal
            category={selectedCategory}
            photos={photos}
            onDeletePhotos={handleDeletePhotos}
            confirmDeletePhotos={confirmDeleteWithDialog}
            onUpdatePhoto={handleSavePhotoChanges}
            onReplacePhoto={handleReplacePhoto}
            onDownloadPhoto={(photo) => downloadPhoto(photo.url || photo.thumbnail, photo.filename || photo.name)}
            openPreviewOnImageClick={true}
            onClose={() => {
              setShowViewGalleryModal(false);
              setPhotos([]); // Clear photos on close
            }} />
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
          onCancel={() => resolveImageDelete(false)} />

        <ConfirmDialog
          isOpen={showConfirmDialog}
          onClose={() => setShowConfirmDialog(false)}
          title="Confirm Deletion"
          message="Are you sure you want to delete this category?"
          onConfirm={() => {
            if (confirmAction) {
              void confirmAction();
            }
            setShowConfirmDialog(false);
          }}
          onCancel={() => setShowConfirmDialog(false)} />

      </div>
    </div>
  );
}