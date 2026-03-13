'use client';
import { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, Save, ChevronRight, Settings, Info, Clock, AlertTriangle, ShieldCheck, Zap, RotateCcw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/useToast';
import { updateNotificationSettings } from '@/actions/clubSettingsActions';

// Default categories structure
const defaultCategories = [
  {
    id: 'events',
    name: 'Event Lifecycle',
    description: 'Alerts for creation, modification, and participant registration flows.',
    accent: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    settings: [
      { id: 'event_created', label: 'New event created', email: true, push: true, sms: false },
      { id: 'event_updated', label: 'Event details updated', email: true, push: false, sms: false },
      { id: 'new_registration', label: 'New registration received', email: true, push: true, sms: false },
      { id: 'registration_approved', label: 'Approval status changes', email: true, push: false, sms: false },
      { id: 'event_reminder', label: 'Final call reminders', email: true, push: true, sms: true }
    ]
  },
  {
    id: 'system',
    name: 'Critical Infrastructure',
    description: 'Security protocols, backup alerts, and maintenance logs.',
    accent: 'bg-rose-50 text-rose-600 border-rose-100',
    settings: [
      { id: 'security_alert', label: 'Unauthorized access', email: true, push: true, sms: true },
      { id: 'system_maintenance', label: 'Scheduled downtime', email: true, push: false, sms: false },
      { id: 'backup_completed', label: 'Database backup success', email: true, push: false, sms: false }
    ]
  }
];

interface NotificationSettingsPageProps {
  initialSettings?: Record<string, any>;
}

export function NotificationSettingsPage({ initialSettings }: NotificationSettingsPageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  // State for categories which contain the settings
  const [categories, setCategories] = useState(defaultCategories);
  const [globalChannels, setGlobalChannels] = useState<any>({
    email: true,
    push: true,
    sms: false
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialSettings && Object.keys(initialSettings).length > 0) {
      // Merge initialSettings into categories
      // Assuming initialSettings is flattened or structured. 
      // For simplicity, let's assume initialSettings contains keys like 'event_created_email': true

      // This is complex. For now, I'll rely on the defaults being the "schema"
      // and if I had real data I would map it.
      // Since I'm implementing the backend now, I can decide the format.
      // Let's assume initialSettings has 'categories' and 'globalChannels'

      if (initialSettings.categories) {
        setCategories(initialSettings.categories);
      }
      if (initialSettings.globalChannels) {
        setGlobalChannels(initialSettings.globalChannels);
      }
    }
    setIsLoading(false);
  }, [initialSettings]);

  const handleToggle = (categoryId: any, settingId: any, channel: any) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id !== categoryId) return cat;
      return {
        ...cat,
        settings: cat.settings.map(s => {
          if (s.id !== settingId) return s;
          return { ...s, [channel]: !(s as any)[channel] };
        })
      };
    }));
    setHasChanges(true);
  };

  const handleGlobalToggle = (channel: any) => {
    setGlobalChannels((prev: any) => ({ ...prev, [channel]: !prev[channel] }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        categories,
        globalChannels
      };

      const result = await updateNotificationSettings(payload);
      if (result.success) {
        showToast("Notification preferences updated", "success");
        setHasChanges(false);
      } else {
        showToast(result.error || "Failed to update settings", "error");
      }
    } catch (error) {
      showToast("An unexpected error occurred", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 animate-page-entrance">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 text-sm text-[#6B7280] mb-3">
          <span>Dashboard</span>
          <ChevronRight className="w-3 h-3 text-[#9CA3AF]" />
          <span>Settings</span>
          <ChevronRight className="w-3 h-3 text-[#9CA3AF]" />
          <span className="text-[#1A1A1A] font-medium">Notifications</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-[28px] font-semibold text-[#1A1A1A] mb-2">Notification Settings</h1>
            <p className="text-sm text-[#6B7280]">Configure how and when you receive update alerts.</p>
          </div>
        </div>
      </div>

      <div className="space-y-8 pb-20">
        {/* Primary Channels */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-[12px] mt-[10px] mb-[16px]">
          <div className="flex items-center gap-4">
            <div className="px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider border bg-emerald-50 text-emerald-600 border-emerald-100">
              Active Channels
            </div>
            <p className="text-sm text-[#6B7280] hidden md:block">Manage global delivery platforms</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { id: 'email', icon: Mail, label: 'Email', bg: 'bg-indigo-50', text: 'text-indigo-600' },
            { id: 'push', icon: Bell, label: 'Push', bg: 'bg-amber-50', text: 'text-amber-600' },
            { id: 'sms', icon: Smartphone, label: 'SMS', bg: 'bg-rose-50', text: 'text-rose-600' }
          ].map((channel: any, i: any) => (
            <div key={i} className="bg-[#F4F2F0] rounded-[18px] pt-2 pr-2 pb-6 pl-2 flex flex-col transition-all hover:scale-[1.02] duration-300">
              <div className="bg-white rounded-[16px] w-full p-6 border border-gray-100 flex flex-col justify-between transition-all shadow-sm hover:shadow-md flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className={`${channel.bg} w-12 h-12 rounded-xl flex items-center justify-center ${channel.text}`}>
                    <channel.icon className="w-6 h-6" />
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={globalChannels[channel.id]}
                      onChange={() => handleGlobalToggle(channel.id)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
                  </label>
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#1A1A1A]">{channel.label} Notifications</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Preferences */}
        {isLoading ? (
          <div className="bg-[#F4F2F0] rounded-[32px] p-2">
            <div className="bg-white rounded-[24px] p-6 space-y-6">
              {[...Array(3)].map((_: any, i: any) => (
                <div key={i} className="space-y-4">
                  <Skeleton width="30%" height={20} />
                  <Skeleton width="100%" height={120} borderRadius={16} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          categories.map((category: any) => (
            <div key={category.id} className="bg-[#F4F2F0] rounded-[18px] pt-2 pr-2 pb-6 pl-2">
              {/* Header Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-[12px] mt-[10px] mb-[16px]">
                <div className="flex items-center gap-4">
                  <div className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider border ${category.accent}`}>
                    {category.name}
                  </div>
                  <p className="text-sm text-[#6B7280] hidden md:block">{category.description}</p>
                </div>
              </div>

              {/* White Inner Card */}
              <div className="bg-white rounded-[14px] border border-[#E5E7EB] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead className="bg-white border-b border-[#F3F4F6]">
                      <tr>
                        <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Notification Trigger</th>
                        <th className="text-center px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="text-center px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Push</th>
                        <th className="text-center px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">SMS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {category.settings.map((setting: any, idx: any) => (
                        <tr key={setting.id} className={`border-b border-[#F3F4F6] row-hover-effect hover:bg-[#FAFAFA] transition-colors ${idx === category.settings.length - 1 ? 'border-b-0' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-[#1A1A1A]">{setting.label}</div>
                          </td>
                          {['email', 'push', 'sms'].map(channel => (
                            <td key={channel} className="px-6 py-4">
                              <div className="flex justify-center">
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={setting[channel]}
                                    onChange={() => handleToggle(category.id, setting.id, channel)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
                                </label>
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Save Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 lg:static lg:bg-transparent lg:border-none lg:p-0 flex justify-end z-40">
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-xl ${hasChanges && !isSaving
              ? "bg-[#10B981] text-white hover:bg-[#059669] hover:scale-105"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}