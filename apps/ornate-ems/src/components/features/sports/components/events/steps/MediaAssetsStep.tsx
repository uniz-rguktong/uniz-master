"use client";
import { useState, useRef } from "react";
import type { ChangeEvent } from "react";
import Image from "next/image";
import {
  Upload,
  X,
  File,
  Youtube,
  Link as LinkIcon,
  FileText,
} from "lucide-react";

interface RulebookData {
  name: string;
  size: string;
  data: string | ArrayBuffer | null;
}

interface MediaAssetsData {
  bannerUrl?: string | ArrayBuffer | null;
  poster?: string | ArrayBuffer | null;
  videoUrl?: string;
  rulebook?: RulebookData | null;
}

interface MediaAssetsStepProps {
  data: MediaAssetsData;
  updateData: (patch: Partial<MediaAssetsData>) => void;
}

export function MediaAssetsStep({ data, updateData }: MediaAssetsStepProps) {
  const [poster, setPoster] = useState(data.bannerUrl || data.poster || null);
  const [videoUrl, setVideoUrl] = useState(data.videoUrl || "");
  const [rulebook, setRulebook] = useState(data.rulebook || null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  const getYoutubeId = (url: string): string | null => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2]?.length === 11 ? (match[2] as string) : null;
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPoster(reader.result);
        updateData({
          bannerUrl: reader.result,
          poster: reader.result, // Keep for compatibility
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePdfChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file && file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onloadend = () => {
        const pdfData = {
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
          data: reader.result,
        };
        setRulebook(pdfData);
        updateData({ rulebook: pdfData });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Primary Poster */}
      <div>
        <label className="block text-sm font-medium text-[#1A1A1A] mb-4 px-1">
          Official Tournament Poster
        </label>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {poster ? (
          <div className="relative max-w-2xl aspect-video rounded-2xl overflow-hidden border border-[#E5E7EB] group mx-auto md:mx-0 shadow-sm">
            <Image
              src={poster as string}
              alt="Poster Preview"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2 bg-white text-[#1A1A1A] rounded-lg text-xs font-bold uppercase tracking-wider shadow-md hover:scale-105 transition-all"
              >
                Change Image
              </button>
              <button
                onClick={() => {
                  setPoster(null);
                  updateData({ poster: null, bannerUrl: null });
                }}
                className="p-2 bg-red-500 text-white rounded-lg shadow-md hover:scale-110 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#E5E7EB] rounded-[24px] p-10 text-center hover:border-[#1A1A1A]/30 hover:bg-[#F9FAFB] transition-all cursor-pointer group max-w-2xl bg-white shadow-sm"
          >
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-[#F9FAFB] border border-[#E5E7EB] rounded-full flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 group-hover:bg-white transition-all">
                <Upload className="w-5 h-5 text-[#6B7280] stroke-[2px]" />
              </div>
              <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">
                Official Competition Poster
              </h3>
              <p className="text-xs text-[#6B7280] mb-5 max-w-xs leading-relaxed">
                Ensure a 16:9 ratio for the best dashboard visibility.
              </p>
              <button className="px-6 py-2.5 bg-[#1A1A1A] text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm hover:translate-y-[-1px] transition-all">
                Select Photo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Video Content */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-[#1A1A1A] px-1">
          Teaser / Video Link
        </label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => {
                setVideoUrl(e.target.value);
                updateData({ videoUrl: e.target.value });
                setShowPreview(false);
              }}
              placeholder="Paste YouTube URL..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-[#E5E7EB] rounded-lg text-sm font-normal text-[#1A1A1A] transition-all focus:ring-2 focus:ring-[#1A1A1A] outline-none shadow-sm"
            />
          </div>
          <button
            onClick={() => setShowPreview(!showPreview)}
            disabled={!getYoutubeId(videoUrl)}
            className={`px-6 border rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${
              showPreview
                ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                : "bg-white border-[#E5E7EB] text-[#1A1A1A] hover:bg-[#F9FAFB] disabled:opacity-50 disabled:cursor-not-allowed"
            }`}
          >
            {showPreview ? "Hide Preview" : "Preview"}
          </button>
        </div>

        {showPreview && getYoutubeId(videoUrl) && (
          <div className="relative max-w-2xl aspect-video rounded-2xl overflow-hidden border border-[#E5E7EB] bg-black animate-in fade-in slide-in-from-top-2 duration-300 shadow-lg">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${getYoutubeId(videoUrl)}?autoplay=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        )}
      </div>

      {/* Rulebook & Docs */}
      <div className="bg-[#F4F2F0] rounded-[18px] p-6 border border-[#E5E7EB]">
        <div className="flex items-center justify-between mb-4 px-1">
          <h4 className="text-xs font-bold text-[#6B7280] uppercase tracking-widest opacity-80">
            Rulebook & Guidelines
          </h4>

          <input
            type="file"
            ref={pdfInputRef}
            onChange={handlePdfChange}
            accept=".pdf"
            className="hidden"
          />

          <button
            onClick={() => pdfInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload PDF
          </button>
        </div>

        {rulebook ? (
          <div className="p-4 bg-white border border-[#E5E7EB] rounded-xl flex items-center justify-between shadow-sm animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center border border-red-100">
                <File className="w-5 h-5 text-red-500 stroke-[1.5px]" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[#1A1A1A] leading-tight mb-0.5">
                  {rulebook.name}
                </div>
                <div className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider">
                  {rulebook.size}
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                className="p-2 hover:bg-[#F9FAFB] rounded-lg transition-all"
                title="View Link"
              >
                <LinkIcon className="w-4 h-4 text-[#9CA3AF]" />
              </button>
              <button
                onClick={() => {
                  setRulebook(null);
                  updateData({ rulebook: null });
                }}
                className="p-2 hover:bg-red-50 rounded-lg text-[#9CA3AF] hover:text-red-500 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="py-8 border-2 border-dashed border-[#E5E7EB] rounded-xl bg-white/50 flex flex-col items-center justify-center text-[#9CA3AF]">
            <FileText className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-[10px] font-bold uppercase tracking-widest">
              No rulebook uploaded
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
