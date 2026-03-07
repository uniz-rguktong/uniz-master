"use client";
import { useState } from "react";
import { Globe, Lock, Bell, MessageSquare, Save } from "lucide-react";
import { InfoTooltip } from "@/components/InfoTooltip";
import { useToast } from "@/hooks/useToast";
import { updateFestSettings } from "@/actions/festActions";

export default function GlobalSettingsClient({
  initialSettings,
}: {
  initialSettings: any;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const result = await updateFestSettings(settings);
      if (!("error" in result)) {
        showToast("Global settings updated successfully", "success");
      } else {
        showToast(result.error || "Failed to update settings", "error");
      }
    } catch (error) {
      showToast("An error occurred while saving", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto">
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#1A1A1A]">
                Global System Settings
              </h1>
              <InfoTooltip
                text="Manage system-wide configurations and behavior"
                size="md"
              />
            </div>
            <p className="text-sm text-[#6B7280]">
              Control system-wide behavior, maintenance modes, and social
              integrations.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#1A1A1A] text-white rounded-xl text-sm font-medium hover:bg-[#2D2D2D] transition-colors shadow-lg shadow-gray-200 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="animate-spin text-lg">⏳</span>
            ) : (
              <Save className="w-4 h-4" />
            )}
            Update Settings
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Access Control */}
        <div className="bg-[#F4F2F0] rounded-[18px] px-[10px] pt-4 pb-[10px] md:pt-6 h-full flex flex-col">
          <h3 className="font-semibold text-[#1A1A1A] flex items-center gap-2 mb-4 ml-[10px]">
            <Lock className="w-4 h-4 text-[#6B7280]" />
            Access Control
            <InfoTooltip
              text="Manage user access and registration permissions"
              size="sm"
            />
          </h3>
          <div className="bg-white rounded-[14px] p-6 space-y-6 flex-1">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                <div>
                  <div className="font-semibold text-[#1A1A1A] flex items-center gap-2">
                    Maintenance Mode
                    <InfoTooltip
                      text="Temporarily disable access for all non-admin users"
                      size="sm"
                    />
                  </div>
                  <div className="text-sm text-gray-500">
                    Disable student access to the platform temporarily
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.maintenanceMode}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        maintenanceMode: e.target.checked,
                      })
                    }
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                <div>
                  <div className="font-semibold text-[#1A1A1A]">
                    Guest Registration
                  </div>
                  <div className="text-sm text-gray-500">
                    Allow non-RGUKT students to register
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.guestRegistration}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        guestRegistration: e.target.checked,
                      })
                    }
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Communication */}
        <div className="bg-[#F4F2F0] rounded-[18px] px-[10px] pt-4 pb-[10px] md:pt-6 h-full flex flex-col">
          <h3 className="font-semibold text-[#1A1A1A] flex items-center gap-2 mb-4 ml-[10px]">
            <Bell className="w-4 h-4 text-[#6B7280]" />
            Communication
            <InfoTooltip
              text="Configure automated system emails and alerts"
              size="sm"
            />
          </h3>
          <div className="bg-white rounded-[14px] p-6 space-y-6 flex-1">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                <div>
                  <div className="font-semibold text-[#1A1A1A]">
                    Email Notifications
                  </div>
                  <div className="text-sm text-gray-500">
                    Send automatic emails for registration/approvals
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.emailNotifications}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        emailNotifications: e.target.checked,
                      })
                    }
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Presence */}
      <div className="bg-[#F4F2F0] rounded-[18px] px-[10px] pt-4 pb-[10px] md:pt-6">
        <h3 className="font-semibold text-[#1A1A1A] flex items-center gap-2 mb-4 ml-[10px]">
          <Globe className="w-4 h-4 text-[#6B7280]" />
          Social Presence
          <InfoTooltip
            text="Links displayed in the footer and contact sections"
            size="sm"
          />
        </h3>
        <div className="bg-white rounded-[14px] p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Instagram URL
              </label>
              <input
                type="text"
                placeholder="https://instagram.com/ornate"
                value={settings.instagramUrl || ""}
                onChange={(e) =>
                  setSettings({ ...settings, instagramUrl: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                YouTube Channel
              </label>
              <input
                type="text"
                placeholder="https://youtube.com/@ornate"
                value={settings.youtubeUrl || ""}
                onChange={(e) =>
                  setSettings({ ...settings, youtubeUrl: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Support Email
              </label>
              <input
                type="email"
                placeholder="support@ornate.com"
                value={settings.supportEmail || ""}
                onChange={(e) =>
                  setSettings({ ...settings, supportEmail: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
