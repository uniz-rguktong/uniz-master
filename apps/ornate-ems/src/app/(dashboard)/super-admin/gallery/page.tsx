"use client";
import {
  Search,
  Filter,
  MoreVertical,
  Heart,
  Download,
  Trash2,
  Shield,
} from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/useToast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL_UPLOADS = [
  {
    id: 1,
    src: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=500&h=500&fit=crop",
    event: "Inauguration",
    user: "Pro Cam 1",
    status: "Approved",
    likes: 120,
  },
  {
    id: 2,
    src: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&h=500&fit=crop",
    event: "Crowd Shot",
    user: "Student Cam",
    status: "Approved",
    likes: 85,
  },
  {
    id: 3,
    src: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=500&h=500&fit=crop",
    event: "Code Marathon",
    user: "Branch Admin",
    status: "Approved",
    likes: 45,
  },
  {
    id: 4,
    src: "https://images.unsplash.com/photo-1543353071-873f17a7a088?w=500&h=500&fit=crop",
    event: "Dance Comp",
    user: "Pro Cam 2",
    status: "Pending",
    likes: 0,
  },
  {
    id: 5,
    src: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=500&h=500&fit=crop",
    event: "Decorations",
    user: "Volunteer",
    status: "Flagged",
    likes: 0,
  },
];

export default function GalleryDashboardPage() {
  const { showToast } = useToast();
  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">Media Library</h1>
            <p className="text-sm text-[#6B7280]">
              Central repository of all event photos and videos.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() =>
                showToast("Media upload modal will open here", "info")
              }
              className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] text-[#1A1A1A] rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <UploadButton />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-white p-4 rounded-[18px] border border-[#E5E7EB] shadow-sm">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search by event or uploader..."
            className="pl-9 pr-4 py-2 bg-gray-50 border border-transparent rounded-lg text-sm w-full focus:bg-white focus:border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] transition-all"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select defaultValue="All Media">
            <SelectTrigger className="w-full sm:w-[140px] px-3 py-2 bg-gray-50 border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#1A1A1A]">
              <SelectValue placeholder="All Media" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Media">All Media</SelectItem>
              <SelectItem value="Photos">Photos</SelectItem>
              <SelectItem value="Videos">Videos</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="All Status">
            <SelectTrigger className="w-full sm:w-[140px] px-3 py-2 bg-gray-50 border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#1A1A1A]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Status">All Status</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Flagged">Flagged</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {ALL_UPLOADS.map((item: any) => (
          <div key={item.id} className="group relative break-inside-avoid">
            <div className="relative aspect-4/5 bg-gray-100 rounded-xl overflow-hidden shadow-sm">
              <Image
                src={item.src}
                alt={item.event}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
                <div className="flex justify-between items-start">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                                        ${
                                          item.status === "Approved"
                                            ? "bg-green-500 text-white"
                                            : item.status === "Pending"
                                              ? "bg-yellow-500 text-white"
                                              : "bg-red-500 text-white"
                                        }`}
                  >
                    {item.status}
                  </span>
                  <button className="p-1.5 bg-white/20 hover:bg-white/40 rounded-lg text-white backdrop-blur-sm">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <p className="text-white text-sm font-bold truncate">
                    {item.event}
                  </p>
                  <p className="text-white/70 text-xs truncate">
                    by {item.user}
                  </p>
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/20">
                    <button
                      onClick={() => showToast("Post liked!", "success")}
                      className="text-white hover:text-red-400 flex items-center gap-1 text-xs"
                    >
                      <Heart className="w-3.5 h-3.5" /> {item.likes}
                    </button>
                    <button
                      onClick={() => showToast("Downloading media...", "info")}
                      className="text-white hover:text-blue-400 ml-auto"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UploadButton() {
  return <span className="flex items-center gap-2">Upload Media</span>;
}
