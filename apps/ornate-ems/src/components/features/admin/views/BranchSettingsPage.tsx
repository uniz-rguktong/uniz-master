'use client';
import { useState, useRef } from 'react';
import { Building2, Mail, Phone, Upload, Trash2, Save, GraduationCap } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { InfoTooltip } from '@/components/InfoTooltip';

export function BranchSettingsPage() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock Branch Data
  const [formData, setFormData] = useState<any>({
    name: "Computer Science & Engineering",
    shortName: "CSE",
    coordinator: "Dr. Arvind Kumar",
    establishedYear: "1995",
    description: "Department focused on excellence in computing education, research, and innovation. Managing all department-level events and student activities.",
    email: "cse.hod@university.edu",
    phone: "+91 76543 21098",
    logo: null,
    stats: {
      students: 1200,
      faculty: 45,
      researchPapers: 320
    }
  });

  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    setHasChanges(false);
    showToast("Branch settings saved successfully", "success");
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

      const imageUrl = URL.createObjectURL(file);
      setFormData((prev: any) => ({
        ...prev,
        logo: imageUrl
      }));
      setHasChanges(true);
      showToast("Logo selected. Click save to apply changes.", "info");
    }
  };

  return (
    <div className="p-8 animate-page-entrance">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
          <span>Dashboard</span>
          <span>›</span>
          <span>Settings</span>
          <span>›</span>
          <span className="text-[#1A1A1A] font-medium">Branch Settings</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-[28px] font-semibold text-[#1A1A1A] mb-2">Branch Settings</h1>
            <p className="text-sm text-[#6B7280]">Configure department details and contact information</p>
          </div>

          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium transition-colors shadow-sm ${hasChanges
              ? "bg-[#10B981] text-white hover:bg-[#059669]"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}>
            <Save className="w-5 h-5" />
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-[#F4F2F0] rounded-[18px] p-[10px] animate-card-entrance" style={{ animationDelay: '40ms' }}>
            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-3 pl-[5px] pt-[15px] pb-[5px] flex items-center gap-2">
              Basic Information
              <InfoTooltip text="Core details about the department/branch." />
            </h3>

            <div className="bg-white rounded-[14px] p-6 shadow-sm">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Branch Name <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
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
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Head of Department / Coordinator
                  </label>
                  <input
                    type="text"
                    name="coordinator"
                    value={formData.coordinator}
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
                    value={formData.establishedYear}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Branch Description
                  </label>
                  <textarea
                    rows={4}
                    name="description"
                    value={formData.description}
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
              <InfoTooltip text="Public contact channels for branch queries." />
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
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#6B7280]" />
                      Office Extension
                    </div>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Branch Logo */}
          <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
            <h3 className="text-base font-semibold text-[#1A1A1A] mb-3 pl-[5px] pt-[15px] pb-[5px] flex items-center gap-2">
              Branch Logo
              <InfoTooltip text="Departmental identity displayed on all related pages." />
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
                    <img src={formData.logo} alt="Branch Logo" className="w-full h-full object-cover" />
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
              Branch Statistics
              <InfoTooltip text="Key departmental metrics." />
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
                    <td className="px-6 py-4 text-sm font-medium text-[#6B7280]">Total Students</td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-[#1A1A1A]">{formData.stats.students}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-[#6B7280]">Faculty Members</td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-[#1A1A1A]">{formData.stats.faculty}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-[#6B7280]">Research Papers</td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-[#1A1A1A]">{formData.stats.researchPapers}</td>
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
