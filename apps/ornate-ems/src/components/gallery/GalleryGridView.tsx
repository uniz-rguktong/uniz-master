"use client";
import { GalleryCard } from "./GalleryCard";
import { useToast } from "@/hooks/useToast";

type GalleryMenuAction =
  | "view"
  | "edit"
  | "upload"
  | "download"
  | "archive"
  | "delete";

interface GalleryCategory {
  id: string;
  name: string;
  coverImage: string;
  visibility: "public" | "private" | "branch";
  photoCount: number;
  dateCreated: string;
  lastUpdated: string;
  isArchived?: boolean;
  [key: string]: unknown;
}

interface GalleryGridViewProps {
  categories: GalleryCategory[];
  isReadOnly?: boolean;
  onEditCategory: (category: GalleryCategory) => void;
  onUploadPhotos: (categoryName: string) => void;
  onViewGallery?: (category: GalleryCategory) => void;
  onDownloadCategory?: (category: GalleryCategory) => void;
  onDeleteCategory?: (category: GalleryCategory) => void;
  onArchiveCategory?: (category: GalleryCategory) => void;
}

export function GalleryGridView({
  categories,
  isReadOnly = false,
  onEditCategory,
  onUploadPhotos,
  onViewGallery,
  onDownloadCategory,
  onDeleteCategory,
  onArchiveCategory,
}: GalleryGridViewProps) {
  const { showToast } = useToast();

  const handleActionMenuClick = (
    category: GalleryCategory,
    action: GalleryMenuAction,
  ) => {
    switch (action) {
      case "view":
        if (onViewGallery) {
          onViewGallery(category);
        }
        break;
      case "edit":
        onEditCategory(category);
        break;
      case "upload":
        onUploadPhotos(category.name);
        break;
      case "download":
        if (onDownloadCategory) {
          onDownloadCategory(category);
        } else {
          showToast(`Downloading ${category.photoCount} photos...`, "info");
        }
        break;
      case "archive":
        if (onArchiveCategory) {
          onArchiveCategory(category);
        }
        break;
      case "delete":
        if (onDeleteCategory) {
          onDeleteCategory(category);
        }
        break;
    }
  };

  const handleDelete = (category: GalleryCategory) => {
    if (onDeleteCategory) {
      onDeleteCategory(category);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category: any) => (
          <GalleryCard
            key={category.id}
            category={category}
            isReadOnly={isReadOnly}
            onEdit={() => onEditCategory(category)}
            onAddPhotos={onUploadPhotos}
            onDelete={() => handleDelete(category)}
            onActionMenuClick={(action) =>
              handleActionMenuClick(category, action)
            }
          />
        ))}
      </div>
    </>
  );
}
