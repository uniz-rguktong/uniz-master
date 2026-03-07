"use client";
import { useState, useRef, useEffect } from "react";
import { Building2, Mail, Phone, Upload, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { InfoTooltip } from "@/components/InfoTooltip";
import { getHHOSettings, updateHHOSettings } from "@/actions/settingsActions";

export function SettingsPage() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<any>({
    name: "",
    shortName: "HHO",
    coordinator: "",
    establishedYear: "2015",
    description: "",
    email: "",
    phone: "",
    logo: null,
    stats: {
      volunteers: 0,
      events: 0,
      fundsRaised: "₹0",
    },
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch settings on mount
  useEffect(() => {
    async function fetchSettings() {
      setIsLoading(true);
      const result = await getHHOSettings();

      if (result.success && result.data) {
        setFormData({
          name: result.data.name || "",
          shortName: "HHO",
          coordinator: result.data.designation || "",
          establishedYear: "2015",
          description: result.data.bio || "",
          email: result.data.email || "",
          phone: result.data.phone || "",
          logo: null,
          stats: result.data.stats || {
            volunteers: 0,
            events: 0,
            fundsRaised: "₹0",
          },
        });
      } else {
        showToast(result.error || "Failed to load settings", "error");
      }
      setIsLoading(false);
    }

    fetchSettings();
  }, []);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsLoading(true);
    const result = await updateHHOSettings(formData);

    if (result.success) {
      setHasChanges(false);
      showToast("HHO settings saved successfully", "success");
    } else {
      showToast(result.error || "Failed to save settings", "error");
    }
    setIsLoading(false);
  };

  const handleLogoUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: any) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        // 2MB limit
        showToast("File size too large. Maximum size is 2MB.", "error");
        return;
      }

      const imageUrl = URL.createObjectURL(file);
      setFormData((prev: any) => ({
        ...prev,
        logo: imageUrl,
      }));
      setHasChanges(true);
      showToast("Logo selected. Click save to apply changes.", "info");
    }
  };

  if (isLoading && !formData.email) {
    return (
      <div className="p-8 animate-page-entrance">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-100 rounded-xl p-6 h-96 animate-pulse"></div>
            <div className="bg-gray-100 rounded-xl p-6 h-48 animate-pulse"></div>
          </div>
          <div className="space-y-6">
            <div className="bg-gray-100 rounded-xl p-6 h-64 animate-pulse"></div>
            <div className="bg-gray-100 rounded-xl p-6 h-48 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 animate-page-entrance">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
          <span>Dashboard</span>
          <span>›</span>
          <span>Settings</span>
          <span>›</span>
          <span className="text-[#1A1A1A] font-medium">
            Organization Settings
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-semibold text-[#1A1A1A] mb-2">
              HHO Settings
            </h1>
            <p className="text-sm text-[#6B7280]">
              Configure organization details and contact information
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={!hasChanges || isLoading}
            className={`flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium transition-colors shadow-sm ${
              hasChanges && !isLoading
                ? "bg-[#10B981] text-white hover:bg-[#059669]"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            <Save className="w-5 h-5" />
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div
            className="bg-[#F4F2F0] rounded-[18px] p-[10px] animate-card-entrance"
            style={{ animationDelay: "40ms" }}
          >
            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-3 pl-[5px] pt-[15px] pb-[5px] flex items-center gap-2">
              Basic Information
              <InfoTooltip text="Core details about the organization." />
            </h3>

            <div className="bg-white rounded-[14px] p-6 shadow-sm">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Organization Name <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Short Name / Acronym
                  </label>
                  <input
                    type="text"
                    name="shortName"
                    value={formData.shortName}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Coordinator Name
                  </label>
                  <input
                    type="text"
                    name="coordinator"
                    value={formData.coordinator}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Established Year
                  </label>
                  <input
                    type="number"
                    name="establishedYear"
                    value={formData.establishedYear}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Mission / Description
                  </label>
                  <textarea
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981] resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div
            className="bg-[#F4F2F0] rounded-[18px] p-[10px] animate-card-entrance"
            style={{ animationDelay: "80ms" }}
          >
            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-3 pl-[5px] pt-[15px] pb-[5px] flex items-center gap-2">
              Contact Information
              <InfoTooltip text="Public contact channels for inquiries." />
            </h3>

            <div className="bg-white rounded-[14px] p-6 shadow-sm">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#6B7280]" />
                      Official Email
                    </div>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    readOnly
                    className="w-full px-4 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-lg text-sm text-gray-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#6B7280]" />
                      Phone Number
                    </div>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Organization Logo */}
          <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
            <h3 className="text-base font-semibold text-[#1A1A1A] mb-3 pl-[5px] pt-[15px] pb-[5px] flex items-center gap-2">
              Organization Logo
              <InfoTooltip text="Brand identity displayed on event pages." />
            </h3>

            <div className="bg-white rounded-[14px] p-6 shadow-sm">
              <div className="text-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                <div className="w-32 h-32 mx-auto mb-4 bg-[#F7F8FA] rounded-lg flex items-center justify-center border-2 border-dashed border-[#E5E7EB] overflow-hidden relative">
                  {formData.logo ? (
                    <img
                      src={formData.logo}
                      alt="HHO Logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="w-12 h-12 text-[#9CA3AF]" />
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleLogoUploadClick}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-[#F7F8FA] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#1A1A1A] transition-colors mx-auto w-full"
                  >
                    <Upload className="w-4 h-4" />
                    {formData.logo ? "Change Logo" : "Upload Logo"}
                  </button>
                  {formData.logo && (
                    <button
                      onClick={() => {
                        setFormData((prev: any) => ({ ...prev, logo: null }));
                        setHasChanges(true);
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] text-red-500 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors mx-auto w-full"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                  )}
                </div>

                <p className="text-xs text-[#6B7280] mt-3">
                  Recommended: 500x500px, PNG or JPG
                </p>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
            <h3 className="text-base font-semibold text-[#1A1A1A] mb-3 pl-[5px] pt-[15px] pb-[5px] flex items-center gap-2">
              Impact Statistics
              <InfoTooltip text="Key organization metrics." />
            </h3>

            <div className="bg-white rounded-[14px] overflow-hidden shadow-sm border border-[#E5E7EB]">
              <table className="w-full">
                <thead className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Metric
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-[#6B7280]">
                      Active Volunteers
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-[#1A1A1A]">
                      {formData.stats.volunteers}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-[#6B7280]">
                      Events Conducted
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-[#1A1A1A]">
                      {formData.stats.events}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-[#6B7280]">
                      Funds Raised
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-[#1A1A1A]">
                      {formData.stats.fundsRaised}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
