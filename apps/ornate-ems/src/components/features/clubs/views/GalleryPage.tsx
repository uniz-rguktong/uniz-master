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
import { Skeleton } from '@/components/ui/skeleton';
import { downloadAlbumPhotosAsZip } from '@/lib/galleryZip';
import { uploadFileToR2 } from '@/lib/upload';



import {
  getGalleryAlbums,
  createGalleryAlbum,
  updateGalleryAlbum,
  deleteGalleryAlbum,
  getAlbumPhotos,
  deleteGalleryImages,
  updateGalleryImage
} from '@/actions/galleryActions';

export function GalleryPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [viewType, setViewType] = useState('grid');
  const [categories, setCategories] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [showViewGalleryModal, setShowViewGalleryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [uploadCategory, setUploadCategory] = useState('All Categories');
  const [viewMode, setViewMode] = useState('active'); // 'active' or 'archived'
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(() => () => { });
  const [showImageDeleteConfirm, setShowImageDeleteConfirm] = useState(false);
  const [imageDeleteCount, setImageDeleteCount] = useState(0);
  const [imageDeleteResolver, setImageDeleteResolver] = useState<((value: boolean) => void) | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchGalleryData();
  }, []);

  const fetchGalleryData = async () => {
    setIsLoading(true);
    const result = await getGalleryAlbums();
    if (result.success) {
      setCategories(result.data || []);
      // Photos are typically fetched per album in ViewGalleryModal or similar
      // but if we need global list, we can add getPhotos action
    } else {
      showToast(result.error || 'Error fetching gallery', 'error');
    }
    setIsLoading(false);
  };

  const allCategories = categories;

  const filteredCategories = allCategories.filter(cat => {
    if ((cat as any).isUncategorized) return viewMode === 'active';
    return viewMode === 'active' ? !cat.isArchived : cat.isArchived;
  });

  // Backend already returns photoCount
  const displayCategories = filteredCategories;

  const handleArchiveCategory = async (category: any) => {
    const result = await updateGalleryAlbum(category.id, { ...category, isArchived: !category.isArchived });
    if (result.success) {
      setCategories(prev => prev.map(cat =>
        cat.id === category.id ? { ...cat, isArchived: !cat.isArchived } : cat
      ));
      showToast(`Category ${category.isArchived ? 'restored' : 'archived'} successfully`, 'success');
    } else {
      showToast(result.error || 'Failed to update category', 'error');
    }
  };

  const handleSaveCategory = async (data: any) => {
    if (editingCategory) {
      const result = await updateGalleryAlbum(editingCategory.id, data);
      if (result.success) {
        setCategories(prev => prev.map(c =>
          c.id === editingCategory.id ? { ...c, ...(data as any), lastUpdated: new Date().toISOString().split('T')[0] } : c
        ));
        showToast('Category updated successfully', 'success');
      } else {
        showToast(result.error || 'Failed to update', 'error');
      }
    } else {
      const result = await createGalleryAlbum(data);
      if (result.success) {
        const newCategory = {
          ...(result.data as any),
          name: (result.data as any).title,
          photoCount: 0,
          dateCreated: new Date().toISOString().split('T')[0],
          lastUpdated: new Date().toISOString().split('T')[0]
        };
        setCategories(prev => [...prev, newCategory]);
        showToast('Category created successfully', 'success');
      } else {
        showToast(result.error || 'Failed to create', 'error');
      }
    }
    setShowCategoryModal(false);
    setEditingCategory(null);
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

  const handleViewGallery = async (category: any) => {
    setSelectedCategory(category);
    setPhotos([]);
    setShowViewGalleryModal(true);

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
        showToast(res.error || 'Failed to load photos', 'error');
      }
    } catch (error) {
      showToast('Failed to load photos', 'error');
    }
  };

  const handleDeletePhotos = async (photoIds: string[]) => {
    try {
      const res = await deleteGalleryImages(photoIds);
      if (res.success) {
        setPhotos(prev => prev.filter(photo => !photoIds.includes(photo.id)));
        showToast(`Successfully deleted ${photoIds.length} photo(s)`, 'success');
        fetchGalleryData();
      } else {
        showToast(res.error || 'Failed to delete photos', 'error');
      }
    } catch (error) {
      showToast('Failed to delete photos', 'error');
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

  const downloadPhoto = (url?: string, filename?: string) => {
    if (!url) return;
    const baseName = (filename || 'photo').trim() || 'photo';
    const extensionMatch = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    const extension = extensionMatch?.[1]?.toLowerCase() || 'jpg';
    const finalName = baseName.includes('.') ? baseName : `${baseName}.${extension}`;
    const safeFilename = finalName.replace(/\s+/g, '_');
    const downloadUrl = `/api/branding/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(safeFilename)}`;

    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.download = safeFilename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
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
                  <span className="truncate">New Category</span>
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
                onClick={() => setShowUploadModal(true)}
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
            <h2 className="text-lg font-semibold text-[#1A1A1A]">Categories</h2>
            <div className="px-3 py-1 bg-[#F7F8FA] border border-[#E5E7EB] rounded-full">
              <span className="text-sm text-[#6B7280]">{categories.length} categories</span>
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
              categories={displayCategories}
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
              onDeleteCategory={(category: any) => {
                if (category.isUncategorized) {
                  showToast('The Uncategorized category cannot be deleted.', 'error');
                  return;
                }
                setConfirmAction(() => async () => {
                  const result = await deleteGalleryAlbum(category.id);
                  if (result.success) {
                    setCategories(prev => prev.filter(c => c.id !== category.id));
                    showToast('Category deleted successfully', 'success');
                  } else {
                    showToast(result.error || 'Failed to delete', 'error');
                  }
                });
                setShowConfirmDialog(true);
              }} />
          ) : (
            <GalleryListView
              categories={displayCategories}
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
              onDeleteCategory={(category: any) => {
                if (category.isUncategorized) return;
                setConfirmAction(() => async () => {
                  const result = await deleteGalleryAlbum(category.id);
                  if (result.success) {
                    setCategories(prev => prev.filter(c => c.id !== category.id));
                    showToast('Category deleted successfully', 'success');
                  } else {
                    showToast(result.error || 'Failed to delete', 'error');
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
            onSave={handleSaveCategory} />

        }

        {showUploadModal &&
          <UploadPhotosModal
            categories={categories}
            uploadedPhotos={photos}
            setUploadedPhotos={setPhotos}
            onDeletePhotos={handleDeletePhotos}
            onClose={() => {
              setShowUploadModal(false);
              fetchGalleryData(); // Refresh to see new photos
            }}
            initialCategory={uploadCategory} />
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
          onCancel={() => resolveImageDelete(false)} />

        <ConfirmDialog
          isOpen={showConfirmDialog}
          onClose={() => setShowConfirmDialog(false)}
          title="Confirm Deletion"
          message="Are you sure you want to delete this category?"
          onConfirm={() => {
            confirmAction();
            setShowConfirmDialog(false);
          }}
          onCancel={() => setShowConfirmDialog(false)} />

      </div>
    </div>
  );
}