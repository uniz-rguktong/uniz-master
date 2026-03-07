import { Star, GripVertical, Plus } from "lucide-react";
import Image from "next/image";

const HERO_IMAGES = [
  {
    id: 1,
    src: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&h=300&fit=crop",
    caption: "Crowd Energy",
    active: true,
  },
  {
    id: 2,
    src: "https://images.unsplash.com/photo-1543353071-873f17a7a088?w=500&h=300&fit=crop",
    caption: "Cultural Night",
    active: true,
  },
  {
    id: 3,
    src: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=500&h=300&fit=crop",
    caption: "Tech Fest",
    active: false,
  },
];

export default function FeaturedGalleryPage() {
  return (
    <div className="p-6 md:p-8 max-w-[1000px] mx-auto">
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">
              Featured Highlights
            </h1>
            <p className="text-sm text-[#6B7280]">
              Manage hero carousel and homepage highlights.
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#2D2D2D] transition-colors">
            <Plus className="w-4 h-4" />
            Add New
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {HERO_IMAGES.map((img: any, index: any) => (
          <div
            key={img.id}
            className="bg-white p-4 rounded-[18px] border border-[#E5E7EB] shadow-sm flex items-center gap-6 group"
          >
            <div className="text-gray-300 cursor-move hover:text-gray-600">
              <GripVertical className="w-6 h-6" />
            </div>

            <div className="w-48 h-24 bg-gray-100 rounded-lg relative overflow-hidden shrink-0">
              <Image
                src={img.src}
                alt={img.caption}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-[#1A1A1A]">{img.caption}</h3>
                {img.active && (
                  <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">Slot #{index + 1}</p>
            </div>

            <div className="flex gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-2 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-lg transition-colors">
                <Star
                  className={`w-5 h-5 ${img.active ? "fill-yellow-500 text-yellow-500" : ""}`}
                />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 text-blue-800 text-sm rounded-xl text-center">
        Drag and drop items to reorder the slideshow sequence.
      </div>
    </div>
  );
}
