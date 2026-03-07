import {
  Edit,
  Trash2,
  Upload,
  ArrowUpDown,
  Globe,
  Lock,
  Users,
  Eye,
  Archive,
  Image as ImageIcon,
} from "lucide-react";
import { ActionMenu } from "@/components/ActionMenu";
import Image from "next/image";

type GalleryVisibility = "public" | "private" | "branch";

interface GalleryCategory {
  id: string;
  name: string;
  coverImage: string;
  photoCount: number;
  dateCreated: string;
  lastUpdated: string;
  visibility: GalleryVisibility;
  isArchived?: boolean;
}

interface GalleryListViewProps {
  categories: GalleryCategory[];
  isReadOnly?: boolean;
  onEditCategory: (category: GalleryCategory) => void;
  onUploadPhotos?: (categoryName: string) => void;
  onViewGallery?: (category: GalleryCategory) => void;
  onDeleteCategory?: (category: GalleryCategory) => void;
  onArchiveCategory?: (category: GalleryCategory) => void;
}

const isUnsupportedImage = (url?: string) => {
  if (!url) return false;
  const ext = url.split("?")[0]?.split(".").pop()?.toLowerCase();
  return ext === "heic" || ext === "heif";
};

export function GalleryListView({
  categories,
  isReadOnly = false,
  onEditCategory,
  onUploadPhotos,
  onViewGallery,
  onDeleteCategory,
  onArchiveCategory,
}: GalleryListViewProps) {
  const getVisibilityIcon = (visibility: GalleryVisibility) => {
    switch (visibility) {
      case "public":
        return <Globe className="w-3 h-3" />;
      case "private":
        return <Lock className="w-3 h-3" />;
      case "branch":
        return <Users className="w-3 h-3" />;
      default:
        return <Globe className="w-3 h-3" />;
    }
  };

  const getVisibilityColor = (visibility: GalleryVisibility) => {
    switch (visibility) {
      case "public":
        return "bg-[#D1FAE5] text-[#065F46]";
      case "private":
        return "bg-[#FEE2E2] text-[#991B1B]";
      case "branch":
        return "bg-[#DBEAFE] text-[#1E40AF]";
      default:
        return "bg-[#F3F4F6] text-[#6B7280]";
    }
  };

  return (
    <div className="bg-white rounded-[12px] border border-[#E5E7EB] overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          <thead className="bg-white border-b border-[#F3F4F6]">
            <tr>
              <th className="px-6 py-3 text-left text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">
                Category Name ↑
              </th>
              <th className="px-6 py-3 text-left text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">
                Photo Count ↑
              </th>
              <th className="px-6 py-3 text-left text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">
                Created Date ↑
              </th>
              <th className="px-6 py-3 text-left text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">
                Last Updated ↑
              </th>
              <th className="px-6 py-3 text-left text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">
                Visibility ↑
              </th>
              <th className="px-6 py-3 text-right text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category: any, index: any) => (
              <tr
                key={category.id}
                onDoubleClick={() => onViewGallery && onViewGallery(category)}
                className={`border-b border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors cursor-pointer ${index === categories.length - 1 ? "border-b-0" : ""}`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-10 relative rounded overflow-hidden bg-[#F7F8FA] flex items-center justify-center border border-[#E5E7EB]">
                      {isUnsupportedImage(category.coverImage) ? (
                        <ImageIcon className="w-5 h-5 text-[#9CA3AF]" />
                      ) : (
                        <Image
                          src={category.coverImage}
                          alt={category.name}
                          width={64}
                          height={40}
                          unoptimized
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    <span className="font-medium text-sm text-[#1A1A1A]">
                      {category.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-sm text-[#1A1A1A]">
                    {category.photoCount}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-[#1A1A1A]">
                    {new Date(category.dateCreated).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      },
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-[#1A1A1A]">
                    {new Date(category.lastUpdated).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      },
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getVisibilityColor(
                      category.visibility,
                    )}`}
                  >
                    {getVisibilityIcon(category.visibility)}
                    <span className="capitalize">{category.visibility}</span>
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end">
                    <ActionMenu
                      actions={[
                        {
                          label: "View Gallery",
                          icon: "view",
                          onClick: () =>
                            onViewGallery && onViewGallery(category),
                        },
                        ...(!isReadOnly
                          ? [
                              {
                                label: "Edit Category",
                                icon: "edit",
                                onClick: () => onEditCategory(category),
                              },
                              {
                                label: "Upload Photos",
                                icon: "upload",
                                onClick: () =>
                                  onUploadPhotos &&
                                  onUploadPhotos(category.name),
                              },
                              {
                                label: category.isArchived
                                  ? "Restore Category"
                                  : "Archive Category",
                                icon: "archive",
                                onClick: () =>
                                  onArchiveCategory &&
                                  onArchiveCategory(category),
                              },
                              {
                                label: "Delete",
                                icon: "delete",
                                onClick: () =>
                                  onDeleteCategory &&
                                  onDeleteCategory(category),
                                danger: true,
                              },
                            ]
                          : []),
                      ]}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
