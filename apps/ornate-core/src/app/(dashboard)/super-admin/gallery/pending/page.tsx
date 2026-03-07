import { Check, X, Shield, Eye } from "lucide-react";
import Image from "next/image";

const PENDING = [
  {
    id: 1,
    src: "https://images.unsplash.com/photo-1543353071-873f17a7a088?w=500&h=500&fit=crop",
    event: "Dance Comp",
    user: "Pro Cam 2",
    time: "10m ago",
  },
  {
    id: 2,
    src: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=500&h=500&fit=crop",
    event: "Crowd Cheering",
    user: "Student Cam",
    time: "12m ago",
  },
  {
    id: 3,
    src: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=500&h=500&fit=crop",
    event: "Code Marathon",
    user: "Volunter",
    time: "15m ago",
  },
];

export default function PendingGalleryPage() {
  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">
              Pending Approvals
            </h1>
            <p className="text-sm text-[#6B7280]">
              Review user uploads before they go public.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow">
              Approve All Visible
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {PENDING.map((item: any) => (
          <div
            key={item.id}
            className="bg-white rounded-[18px] border border-[#E5E7EB] overflow-hidden shadow-sm flex flex-col group"
          >
            <div className="relative aspect-video bg-gray-100">
              <Image
                src={item.src}
                alt={item.event}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100">
                <span className="bg-black/60 text-white px-3 py-1 rounded-full text-xs backdrop-blur-sm flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Preview
                </span>
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col">
              <div className="mb-4">
                <h4 className="font-bold text-[#1A1A1A]">{item.event}</h4>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">by {item.user}</span>
                  <span className="text-xs text-gray-400 font-mono">
                    {item.time}
                  </span>
                </div>
              </div>

              <div className="mt-auto grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-1 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-bold hover:bg-green-100 transition-colors">
                  <Check className="w-4 h-4" /> Approve
                </button>
                <button className="flex items-center justify-center gap-1 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors">
                  <X className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {PENDING.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">All Caught Up!</h3>
          <p className="text-gray-500">No pending photos to review.</p>
        </div>
      )}
    </div>
  );
}
