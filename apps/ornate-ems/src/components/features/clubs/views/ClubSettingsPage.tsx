'use client';
import { useState, useEffect, useRef } from 'react';
import { Building2, Mail, Phone, MapPin, Globe, Save, Upload, Trash2 } from 'lucide-react';
import { useClub } from '@/context/ClubContext';
import { useToast } from '@/hooks/useToast';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { InfoTooltip } from '@/components/InfoTooltip';
import Image from 'next/image';
import { updateClubSettings } from '@/actions/clubSettingsActions';

interface ClubSettings {
  name?: string;
  shortName?: string;
  coordinator?: string;
  establishedYear?: number | string;
  description?: string;
  email?: string;
  phone?: string;
  logo?: string | null;
  stats?: {
    members?: number;
    events?: number;
  };
  [key: string]: unknown;
}

interface ClubSettingsPageProps {
  initialSettings?: ClubSettings;
}

export function ClubSettingsPage({ initialSettings }: ClubSettingsPageProps) {
  const { clubDetails } = useClub();
  const { showToast } = useToast();

  const [formData, setFormData] = useState(initialSettings || clubDetails || {});
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialSettings) {
      setFormData(initialSettings);
    } else if (clubDetails) {
      setFormData(clubDetails);
    }
  }, [initialSettings, clubDetails]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateClubSettings(formData as any);
      if (result.success) {
        showToast("Club settings saved successfully", "success");
        setHasChanges(false);
      } else {
        showToast(result.error || "Failed to save settings", "error");
      }
    } catch (error) {
      showToast("An unexpected error occurred", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: any) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        showToast("File size too large. Maximum size is 2MB.", "error");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev: any) => ({
          ...prev,
          logo: reader.result as string
        }));
        setHasChanges(true);
        showToast("Logo selected. Click save to apply changes.", "info");
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="animate-page-entrance">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-semibold text-[#1A1A1A] mb-2">Club Settings</h1>
          <p className="text-sm text-[#6B7280]">Configure club identity and contact information</p>
        </div>

        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className={`flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium transition-colors shadow-sm ${hasChanges && !isSaving
            ? "bg-[#10B981] text-white hover:bg-[#059669]"
            : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}>
          <Save className="w-5 h-5" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-[#F4F2F0] rounded-[18px] p-[10px] animate-card-entrance" style={{ animationDelay: '40ms' }}>
            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-3 pl-[5px] pt-[15px] pb-[5px] flex items-center gap-2">
              Basic Information
              <InfoTooltip text="Essential club details visible to the public." />
            </h3>

            <div className="bg-white rounded-[14px] p-6 shadow-sm">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Club Name <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Short Name
                  </label>
                  <input
                    type="text"
                    name="shortName"
                    value={formData.shortName || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Club Coordinator
                  </label>
                  <input
                    type="text"
                    name="coordinator"
                    value={formData.coordinator || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Established Year
                  </label>
                  <input
                    type="number"
                    name="establishedYear"
                    value={formData.establishedYear || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={4}
                    value={formData.description || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981] resize-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-[#F4F2F0] rounded-[18px] p-[10px] animate-card-entrance" style={{ animationDelay: '80ms' }}>
            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-3 pl-[5px] pt-[15px] pb-[5px] flex items-center gap-2">
              Contact Information
              <InfoTooltip text="Official communication channels for inquiries." />
            </h3>

            <div className="bg-white rounded-[14px] p-6 shadow-sm">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#6B7280]" />
                      Email Address
                    </div>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    readOnly
                    className="w-full px-4 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-lg text-sm text-gray-600 cursor-not-allowed" />
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
                    value={formData.phone || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Club Logo */}
          <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
            <h3 className="text-base font-semibold text-[#1A1A1A] mb-3 pl-[5px] pt-[15px] pb-[5px] flex items-center gap-2">
              Club Logo
              <InfoTooltip text="Brand identity displayed on club profile and events." />
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

                <div
                  className="w-32 h-32 mx-auto mb-4 bg-[#F7F8FA] rounded-lg flex items-center justify-center border-2 border-dashed border-[#E5E7EB] overflow-hidden relative"
                >
                  {formData.logo ? (
                    <img src={formData.logo} alt="Club Logo" className="w-full h-full object-cover" />
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
                    {formData.logo ? 'Change Logo' : 'Upload Logo'}
                  </button>
                  {formData.logo && (
                    <button
                      onClick={() => {
                        setFormData((prev: any) => ({ ...prev, logo: null }));
                        setHasChanges(true);
                        showToast("Logo removed. Click save to apply changes.", "info");
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-2 text-rose-500 hover:bg-rose-50 rounded-lg text-sm font-medium transition-colors w-full"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove Logo
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-[#6B7280] text-center mt-4">
                Recommended: 500x500px, Max: 2MB<br />
                Supports JPG, PNG
              </p>
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
            <h3 className="text-base font-semibold text-[#1A1A1A] mb-3 pl-[5px] pt-[15px] pb-[5px] flex items-center gap-2">
              Club Statistics
              <InfoTooltip text="Key club metrics." />
            </h3>
            <div className="bg-white rounded-[14px] overflow-hidden shadow-sm border border-[#E5E7EB]">
              <table className="w-full">
                <thead className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Metric</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-[#6B7280]">Total Members</td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-[#1A1A1A]">{formData.stats?.members || 0}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-[#6B7280]">Active Events</td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-[#1A1A1A]">{formData.stats?.events || 0}</td>
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
