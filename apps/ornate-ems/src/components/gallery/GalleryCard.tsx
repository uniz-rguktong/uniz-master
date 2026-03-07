import {
  Image as ImageIcon,
  Edit,
  Upload,
  Trash2,
  Globe,
  Lock,
  Users,
} from "lucide-react";
import { ActionMenu } from "@/components/ActionMenu";

import Image from "next/image";

type GalleryVisibility = "public" | "private" | "branch";

type GalleryCardAction =
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
  visibility: GalleryVisibility;
  photoCount: number;
  dateCreated: string;
  lastUpdated: string;
  isArchived?: boolean;
}

interface GalleryCardProps {
  category: GalleryCategory;
  isReadOnly?: boolean;
  onEdit: () => void;
  onAddPhotos: (categoryName: string) => void;
  onDelete: () => void;
  onActionMenuClick: (action: GalleryCardAction) => void;
}

const isUnsupportedImage = (url?: string) => {
  if (!url) return false;
  const ext = url.split("?")[0]?.split(".").pop()?.toLowerCase();
  return ext === "heic" || ext === "heif";
};

export function GalleryCard({
  category,
  isReadOnly = false,
  onEdit,
  onAddPhotos,
  onDelete,
  onActionMenuClick,
}: GalleryCardProps) {
  const getVisibilityIcon = (visibility: GalleryVisibility) => {
    switch (visibility) {
      case "public":
        return <Globe className="w-3.5 h-3.5" />;
      case "private":
        return <Lock className="w-3.5 h-3.5" />;
      case "branch":
        return <Users className="w-3.5 h-3.5" />;
      default:
        return <Globe className="w-3.5 h-3.5" />;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div
      className="Card_Container_Outer w-full bg-[#F4F2F0] rounded-[18px] p-[10px] flex flex-col gap-3 transition-shadow duration-200 hover:shadow-[0px_4px_12px_rgba(0,0,0,0.08)] cursor-pointer"
      onClick={() => onActionMenuClick("view")}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onActionMenuClick("view");
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Open ${category.name} gallery`}
    >
      {/* TITLE - First Child of Outer Container */}
      <h3 className="Title_Text text-[16px] font-medium text-[#1A1A1A] leading-6 px-[12px]  mt-[10px]  mb-[6px]  my-[4px]">
        {category.name}
      </h3>

      {/* CARD_CONTAINER_INNER - Second Child of Outer Container */}
      <div className="Card_Container_Inner bg-white rounded-[14px] p-4 flex flex-col gap-4 p-10px">
        {/* 1. IMAGE THUMBNAIL SECTION - First Element in Inner Card */}
        <div className="Image_Thumbnail relative w-full aspect-video rounded-[12px] overflow-hidden group/thumbnail bg-[#F7F8FA] flex items-center justify-center">
          {isUnsupportedImage(category.coverImage) ? (
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <ImageIcon className="w-10 h-10 text-[#9CA3AF] mb-2" />
              <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
                High Efficiency Image
              </span>
            </div>
          ) : (
            <Image
              src={category.coverImage}
              alt={category.name}
              width={800}
              height={450}
              unoptimized
              className="w-full h-full object-cover rounded-[12px] "
            />
          )}

          {/* Visibility Badge - Top Right */}
          <div
            className={`Badge_Visibility absolute top-3 right-3 px-2.5 py-1.5 rounded-lg text-xs font-medium backdrop-blur-sm ${getVisibilityColor(category.visibility)}`}
          >
            <div className="flex items-center gap-1.5">
              {getVisibilityIcon(category.visibility)}
              <span className="capitalize">{category.visibility}</span>
            </div>
          </div>
        </div>

        {/* 2. PHOTO COUNT ROW - Second Element in Inner Card */}
        <div className="Row_PhotoCount_Menu flex items-center justify-between">
          {/* Photo Count */}
          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
            <ImageIcon className="Icon_Image w-4 h-4" />
            <span className="Text_PhotoCount">
              {category.photoCount} photos
            </span>
          </div>

          {/* Three-Dot Menu */}
          <div
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <ActionMenu
              actions={[
                {
                  label: "View Gallery",
                  icon: "view",
                  onClick: () => onActionMenuClick("view"),
                },
                ...(!isReadOnly
                  ? [
                      {
                        label: "Edit Category",
                        icon: "edit",
                        onClick: () => onActionMenuClick("edit"),
                      },
                      {
                        label: "Upload Photos",
                        icon: "download",
                        onClick: () => onActionMenuClick("upload"),
                      },
                    ]
                  : []),
                { divider: true, onClick: () => {} },
                {
                  label: "Download All Photos",
                  icon: "download",
                  onClick: () => onActionMenuClick("download"),
                },
                ...(!isReadOnly
                  ? [
                      {
                        label: category.isArchived
                          ? "Restore Category"
                          : "Archive Category",
                        icon: "archive",
                        onClick: () => onActionMenuClick("archive"),
                      },
                      {
                        label: "Delete Category",
                        icon: "delete",
                        onClick: () => onActionMenuClick("delete"),
                        danger: true,
                      },
                    ]
                  : []),
              ]}
              size="sm"
            />
          </div>
        </div>

        {/* 3. DATE INFORMATION - Third Element in Inner Card */}
        <div className="Date_Info text-[13px] text-[#6B7280] space-y-0.5">
          <div>Created: {formatDate(category.dateCreated)}</div>
          <div>Updated: {formatDate(category.lastUpdated)}</div>
        </div>

        {/* 4. BUTTON ROW - Fourth Element in Inner Card */}
        {!isReadOnly && (
          <div className="Row_Buttons flex gap-2 pt-2 border-t border-[#E5E7EB]">
            {/* Edit Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="Button_Edit flex-1 h-10 bg-[#F3F4F6] rounded-lg hover:bg-[#E5E7EB] transition-all duration-150 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Edit className="w-[18px] h-[18px] text-[#374151]" />
              <span className="text-sm font-medium text-[#374151]">Edit</span>
            </button>

            {/* Add Photos Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddPhotos(category.name);
              }}
              className="Button_AddPhotos flex-1 h-10 bg-[#F3F4F6] rounded-lg hover:bg-[#E5E7EB] transition-all duration-150 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Upload className="w-[18px] h-[18px] text-[#374151]" />
              <span className="text-sm font-medium text-[#374151]">
                Add Photos
              </span>
            </button>

            {/* Delete Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="Button_Delete w-10 h-10 bg-[#FEE2E2] rounded-lg hover:bg-[#FECACA] transition-all duration-150 flex items-center justify-center active:scale-[0.98]"
            >
              <Trash2 className="w-[18px] h-[18px] text-[#DC2626]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
