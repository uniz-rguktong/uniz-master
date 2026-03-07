import { Edit, Trash2, Download, Check } from "lucide-react";
import Image from "next/image";

interface LogoCardItem {
  name: string;
  thumbnail: string;
  format: string;
  status: "active" | "inactive" | string;
  type: string;
  size: string;
}

interface LogoCardProps {
  logo: LogoCardItem;
  isReadOnly?: boolean;
  onPreview?: () => void;
  onDownload: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function LogoCard({
  logo,
  isReadOnly = false,
  onPreview,
  onDownload,
  onEdit,
  onDelete,
}: LogoCardProps) {
  return (
    <div
      onClick={onPreview}
      className="Card_Container_Outer w-full bg-[#F4F2F0] rounded-[18px] p-[10px] flex flex-col gap-3 transition-shadow duration-200 hover:shadow-[0px_4px_12px_rgba(0,0,0,0.08)] cursor-pointer group"
    >
      {/* TITLE - First Child of Outer Container */}
      <h3 className="Title_Text text-[16px] font-medium text-[#1A1A1A] leading-6 px-[12px]  mt-[12px]  mb-[8px]  my-[4px]">
        {logo.name}
      </h3>

      {/* CARD_CONTAINER_INNER - Second Child of Outer Container */}
      <div className="Card_Container_Inner bg-white rounded-[14px]  flex flex-col gap-4 p-[10px]">
        {/* 1. IMAGE SECTION - First Element in Inner Card */}
        <div className="Image_Container relative w-full aspect-square bg-[#F7F8FA] rounded-[12px] overflow-hidden flex items-center justify-center p-[24px]">
          <Image
            src={logo.thumbnail}
            alt={logo.name}
            className="max-w-full max-h-full object-contain"
            width={100}
            height={100}
            unoptimized
          />

          {/* Format Badge - Top Right */}
          <div className="Badge_Format absolute top-3 right-3 px-2.5 py-1 bg-[#1A1A1A] bg-opacity-90 rounded-md text-xs font-semibold text-white">
            {logo.format}
          </div>

          {/* Status Badge - Top Left */}
          {logo.status === "active" && (
            <div className="Badge_Status absolute top-3 left-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#10B981] rounded-lg text-xs font-medium text-white">
                <Check className="w-3.5 h-3.5" />
                Active
              </span>
            </div>
          )}
        </div>

        {/* 2. TYPE TEXT - Second Element in Inner Card */}
        <div className="Type_Text text-[14px] text-[#6B7280] font-normal">
          {logo.type}
        </div>

        {/* 3. SIZE - Third Element in Inner Card */}
        <div className="Info_Grid grid grid-cols-1 gap-4">
          <div className="Column_Size">
            <div className="text-[13px] text-[#6B7280] mb-1">Size</div>
            <div className="text-[15px] font-medium text-[#1A1A1A]">
              {logo.size}
            </div>
          </div>
        </div>

        {/* 4. BUTTON ROW - Fourth Element in Inner Card */}
        <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
          {/* Download Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            className="flex-1 h-10 bg-[#1A1A1A] text-white rounded-xl hover:bg-[#2D2D2D] transition-all duration-200 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span className="text-[13px] font-semibold">Get File</span>
          </button>

          {!isReadOnly && (
            <>
              {/* Edit Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="w-10 h-10 bg-white border border-[#E5E7EB] rounded-xl hover:bg-[#F9FAFB] transition-all duration-200 flex items-center justify-center shadow-sm active:scale-[0.98] cursor-pointer"
              >
                <Edit className="w-4 h-4 text-[#1A1A1A]" />
              </button>

              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="w-10 h-10 bg-[#FEF2F2] border border-red-50 rounded-xl hover:bg-[#FEE2E2] transition-all duration-200 flex items-center justify-center active:scale-[0.98] cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-[#EF4444]" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
