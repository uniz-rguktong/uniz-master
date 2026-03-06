import { Eye, Edit, Trash2, Play } from 'lucide-react';
import Image from 'next/image';

interface VideoCardItem {
  title: string;
  thumbnail: string;
  status: 'active' | 'inactive' | string;
  duration: string;
  views: number;
  platform: string;
  uploadDate: string;
}

interface VideoCardProps {
  video: VideoCardItem;
  isReadOnly?: boolean;
  onPreview: () => void;
  onEdit: () => void;
  onDelete: () => void;
}


















export function VideoCard({ video, isReadOnly = false, onPreview, onEdit, onDelete }: VideoCardProps) {
  return (
    <div className="bg-[#F4F2F0] rounded-[18px] hover:shadow-lg transition-all p-[10px]">
      {/* Header - Outside white card */}
      <h3 className="text-lg font-semibold text-[#1A1A1A] mb-[16px] px-[12px]  mt-[12px]   my-[12px]  pr-[12px] pb-[4px] pl-[12px]">
        {video.title}
      </h3>

      {/* White Inner Card */}
      <div className="bg-white rounded-[12px]">
        {/* Internal Content Wrapper with Padding */}
        <div className="p-4 rounded-[16px] p-10px">
          {/* Video Thumbnail - Click anywhere to play */}
          <div
            onClick={onPreview}
            className="relative aspect-video overflow-hidden bg-[#1A1A1A] rounded-lg cursor-pointer group/thumbnail mb-4"
          >
            <Image
              src={video.thumbnail}
              alt={video.title}
              fill
              unoptimized
              className="object-cover transition-opacity duration-200"
            />


            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black opacity-0 group-hover/thumbnail:opacity-60 transition-opacity duration-200 rounded-[12px]"></div>

            {/* Play Button */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white rounded-full shadow-lg opacity-0 group-hover/thumbnail:opacity-100 transition-all duration-200 flex items-center justify-center scale-90 group-hover/thumbnail:scale-100">
              <Play className="w-8 h-8 ml-1 text-[#1A1A1A] fill-[#1A1A1A]" />
            </div>

            {/* Status Badge - Top Left */}
            <div className="absolute top-3 left-3 z-10">
              <span className={`px-3 py-1 rounded-lg text-xs font-semibold text-white ${video.status === 'active' ? 'bg-[#10B981]' : 'bg-[#6B7280]'}`
              }>
                {video.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* Duration - Bottom Right */}
            <div className="absolute bottom-3 right-3 px-2 py-1 bg-black bg-opacity-70 rounded z-10">
              <span className="text-xs font-semibold text-white">
                {video.duration && video.duration !== '0:00' ? video.duration : 'N/A'}
              </span>
            </div>
          </div>

          {/* Metadata Row */}
          <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-2">
            <Eye className="w-4 h-4" />
            <span>{video.views.toLocaleString()} views</span>
            <span>•</span>
            <span>{video.platform}</span>
          </div>

          {/* Upload Date */}
          <div className="text-sm text-[#6B7280] mb-4">
            Uploaded: {new Date(video.uploadDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            {/* Watch Button */}
            <button
              onClick={onPreview}
              className="flex-1 h-10 bg-[#1A1A1A] text-white rounded-xl hover:bg-[#2D2D2D] transition-all duration-200 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] cursor-pointer">
              <Play className="w-4 h-4 fill-current" />
              <span className="text-[13px] font-semibold">Watch</span>
            </button>

            {!isReadOnly && (
              <>
                {/* Edit Button */}
                <button
                  onClick={onEdit}
                  className="w-10 h-10 bg-white border border-[#E5E7EB] rounded-xl hover:bg-[#F9FAFB] transition-all duration-200 flex items-center justify-center shadow-sm active:scale-[0.98] cursor-pointer">
                  <Edit className="w-4 h-4 text-[#1A1A1A]" />
                </button>

                {/* Delete Button */}
                <button
                  onClick={onDelete}
                  className="w-10 h-10 bg-[#FEF2F2] border border-red-50 rounded-xl hover:bg-[#FEE2E2] transition-all duration-200 flex items-center justify-center active:scale-[0.98] cursor-pointer">
                  <Trash2 className="w-4 h-4 text-[#EF4444]" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>);

}