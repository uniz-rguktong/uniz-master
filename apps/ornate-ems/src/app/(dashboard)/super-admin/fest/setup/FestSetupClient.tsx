"use client";
import { useState, useRef, useEffect } from "react";
import {
  Calendar,
  Save,
  Upload,
  MapPin,
  Type,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import Image from "next/image";
import { InfoTooltip } from "@/components/InfoTooltip";
import { useToast } from "@/hooks/useToast";
import { updateFestSettings } from "@/actions/festActions";

export default function FestSetupClient({
  initialSettings,
}: {
  initialSettings: any;
}) {
  const defaultSettings = {
    festName: "",
    tagline: "",
    startDate: "",
    endDate: "",
    venue: "",
    description: "",
    logoUrl: "",
    brochureUrl: "",
    registrationOpen: true,
  };
  const [settings, setSettings] = useState(initialSettings || defaultSettings);
  const [logoPreview, setLogoPreview] = useState(
    settings?.logoUrl ||
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=200&h=200&fit=crop",
  );
  const [isLoading, setIsLoading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setLogoPreview(reader.result);
          setSettings({ ...settings, logoUrl: reader.result }); // Temp preview
          showToast("Logo preview updated. Click Save to persist.", "info");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      showToast("PDF selected. Click Save to persist.", "info");
      // In a real app, you'd upload to S3/R2 here or in the action
      setSettings({ ...settings, brochureUrl: "pending-upload" });
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const result = await updateFestSettings(settings);
      if (!("error" in result)) {
        showToast("Configuration saved successfully", "success");
      } else {
        showToast(result.error || "Failed to save configuration", "error");
      }
    } catch (error) {
      showToast("An error occurred while saving", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to format date for input
  const formatDate = (date: any) => {
    if (!date) return "";
    return new Date(date).toISOString().split("T")[0];
  };

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto">
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#1A1A1A]">
                Fest Configuration
              </h1>
              <InfoTooltip
                text="Set up the core identity and details of the current fest"
                size="md"
              />
            </div>
            <p className="text-sm text-[#6B7280]">
              Define identity, schedule, and core details for the event.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#1A1A1A] text-white rounded-xl text-sm font-medium hover:bg-[#2D2D2D] transition-colors shadow-lg shadow-gray-200 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="animate-spin">⌛</span>
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Configuration
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Visual Identity */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#F4F2F0] rounded-[18px] px-[10px] pt-4 pb-[10px] md:pt-6">
            <h3 className="font-semibold text-[#1A1A1A] flex items-center gap-2 mb-4 ml-[10px]">
              <ImageIcon className="w-4 h-4 text-[#6B7280]" />
              Fest Logo
              <InfoTooltip
                text="Displayed on all portals and certificates"
                size="sm"
              />
            </h3>
            <div className="bg-white rounded-[14px] p-6 text-center">
              <div
                onClick={() => logoInputRef.current?.click()}
                className="relative w-40 h-40 mx-auto rounded-full border-4 border-gray-100 overflow-hidden mb-4 group cursor-pointer"
              >
                <Image
                  src={logoPreview}
                  alt="Fest Logo"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload className="w-8 h-8 text-white" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Recommended: 500x500px PNG
              </p>
              <input
                type="file"
                ref={logoInputRef}
                onChange={handleLogoUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => logoInputRef.current?.click()}
                className="w-full py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Upload New
              </button>
            </div>
          </div>

          <div className="bg-[#F4F2F0] rounded-[18px] px-[10px] pt-4 pb-[10px] md:pt-6">
            <h3 className="font-semibold text-[#1A1A1A] flex items-center gap-2 mb-4 ml-[10px]">
              <FileText className="w-4 h-4 text-[#6B7280]" />
              Brochure/Rulebook
              <InfoTooltip
                text="Downloadable PDF for public viewing"
                size="sm"
              />
            </h3>
            <div className="bg-white rounded-[14px] p-6 text-center">
              <input
                type="file"
                ref={pdfInputRef}
                onChange={handlePdfUpload}
                accept=".pdf"
                className="hidden"
              />
              <div
                onClick={() => pdfInputRef.current?.click()}
                className="p-8 border-2 border-dashed border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-colors cursor-pointer"
              >
                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <span className="text-sm text-gray-600">
                  Click to upload PDF
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#F4F2F0] rounded-[18px] px-[10px] pt-4 pb-[10px] md:pt-6">
            <h3 className="font-semibold text-[#1A1A1A] flex items-center gap-2 mb-4 ml-[10px]">
              <Type className="w-4 h-4 text-[#6B7280]" />
              Core Details
              <InfoTooltip
                text="Essential information displayed on the landing page"
                size="sm"
              />
            </h3>
            <div className="bg-white rounded-[14px] p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-[#1A1A1A] mb-2 flex items-center gap-2">
                    Fest Name
                    <InfoTooltip
                      text="Official name of the event (e.g., ORNATE 2K26)"
                      size="sm"
                    />
                  </label>
                  <div className="relative">
                    <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={settings.festName}
                      onChange={(e) =>
                        setSettings({ ...settings, festName: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1A1A1A] mb-2 flex items-center gap-2">
                    Tagline / Theme
                    <InfoTooltip
                      text="Short slogan or theme for this year"
                      size="sm"
                    />
                  </label>
                  <input
                    type="text"
                    value={settings.tagline}
                    onChange={(e) =>
                      setSettings({ ...settings, tagline: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Start Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={formatDate(settings.startDate)}
                      onChange={(e) =>
                        setSettings({ ...settings, startDate: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    End Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={formatDate(settings.endDate)}
                      onChange={(e) =>
                        setSettings({ ...settings, endDate: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-[#1A1A1A] mb-2 flex items-center gap-2">
                  Venue Address
                  <InfoTooltip
                    text="Primary location for map integration"
                    size="sm"
                  />
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={settings.venue}
                    onChange={(e) =>
                      setSettings({ ...settings, venue: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={settings.description}
                  onChange={(e) =>
                    setSettings({ ...settings, description: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
