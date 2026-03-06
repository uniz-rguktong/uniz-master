'use client';
import { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, Save, ChevronRight, Settings, Info, Clock, AlertTriangle, ShieldCheck, Zap, RotateCcw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/useToast';
import { updateNotificationSettings } from '@/actions/adminProfileActions';

const notificationCategories = [
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
  initialSettings?: any;
}

const getDefaultSettings = () => ({
  channels: {
    email: true,
    push: true,
    sms: false
  },
  categories: notificationCategories.map((category: any) => ({
    id: category.id,
    settings: category.settings.map((setting: any) => ({
      id: setting.id,
      email: setting.email,
      push: setting.push,
      sms: setting.sms
    }))
  }))
});

export function NotificationSettingsPage({ initialSettings }: NotificationSettingsPageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const { toast, showToast, hideToast } = useToast();
  const [settingsState, setSettingsState] = useState<any>(getDefaultSettings());

  useEffect(() => {
    const defaults = getDefaultSettings();
    if (!initialSettings) {
      setSettingsState(defaults);
      return;
    }

    setSettingsState({
      channels: {
        ...defaults.channels,
        ...(initialSettings?.channels || {})
      },
      categories: defaults.categories.map((category: any) => {
        const existingCategory = (initialSettings?.categories || []).find((entry: any) => entry.id === category.id);
        if (!existingCategory) return category;
        return {
          ...category,
          settings: category.settings.map((setting: any) => {
            const existingSetting = (existingCategory.settings || []).find((entry: any) => entry.id === setting.id);
            return existingSetting ? { ...setting, ...existingSetting } : setting;
          })
        };
      })
    });
  }, [initialSettings]);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const handleReset = () => {
    setSettingsState(getDefaultSettings());
    showToast('Settings reset to default', 'info');
  };

  const handleSave = async () => {
    const result = await updateNotificationSettings(settingsState);
    if (result.success) {
      showToast('Notification preferences saved', 'success');
      return;
    }
    showToast(result.error || 'Failed to save notification settings', 'error');
  };

  const updateChannel = (channel: 'email' | 'push' | 'sms', value: boolean) => {
    setSettingsState((prev: any) => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: value
      }
    }));
  };

  const updateSetting = (categoryId: string, settingId: string, channel: 'email' | 'push' | 'sms', value: boolean) => {
    setSettingsState((prev: any) => ({
      ...prev,
      categories: prev.categories.map((category: any) => {
        if (category.id !== categoryId) return category;
        return {
          ...category,
          settings: category.settings.map((setting: any) => (
            setting.id === settingId ? { ...setting, [channel]: value } : setting
          ))
        };
      })
    }));
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto animate-page-entrance">

      {/* Breadcrumbs & Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 text-sm text-[#6B7280] mb-3">
          <span>Dashboard</span>
          <ChevronRight className="w-3 h-3" />
          <span>Settings</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#1A1A1A] font-medium">Notifications</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-[28px] font-semibold text-[#1A1A1A] mb-2">Notifications</h1>
            <p className="text-sm text-[#6B7280]">Manage notification preferences and delivery channels</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="hidden md:flex items-center gap-2 px-5 py-3 bg-white border border-[#E5E7EB] text-[#1A1A1A] rounded-lg text-sm font-medium hover:bg-[#F9FAFB] transition-colors shadow-sm">
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12 space-y-8">
          {/* Primary Channels */}
          {/* Active Channels */}
          {/* Active Channels Header */}
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
              { icon: Mail, id: 'email', label: 'Email', bg: 'bg-indigo-50', text: 'text-indigo-600' },
              { icon: Bell, id: 'push', label: 'Push', bg: 'bg-amber-50', text: 'text-amber-600' },
              { icon: Smartphone, id: 'sms', label: 'SMS', bg: 'bg-rose-50', text: 'text-rose-600' }
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
                        checked={Boolean(settingsState.channels?.[channel.id])}
                        onChange={(e) => updateChannel(channel.id, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:shadow-sm after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
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
            notificationCategories.map((category: any) => {
              const categorySettings = settingsState.categories?.find((entry: any) => entry.id === category.id);
              return (
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
                        {category.settings.map((setting: any, idx: any) => {
                          const currentSetting = categorySettings?.settings?.find((entry: any) => entry.id === setting.id) || setting;
                          return (
                          <tr key={setting.id} className={`border-b border-[#F3F4F6] row-hover-effect hover:bg-[#FAFAFA] transition-colors ${idx === category.settings.length - 1 ? 'border-b-0' : ''}`}>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-[#1A1A1A]">{setting.label}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex justify-center">
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(currentSetting.email)}
                                    onChange={(e) => updateSetting(category.id, setting.id, 'email', e.target.checked)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:shadow-sm after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
                                </label>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex justify-center">
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(currentSetting.push)}
                                    onChange={(e) => updateSetting(category.id, setting.id, 'push', e.target.checked)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:shadow-sm after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
                                </label>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex justify-center">
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(currentSetting.sms)}
                                    onChange={(e) => updateSetting(category.id, setting.id, 'sms', e.target.checked)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:shadow-sm after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
                                </label>
                              </div>
                            </td>
                          </tr>
                        )})}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )})
          )}
        </div>
      </div>

      <div className="flex justify-end mt-8">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-3 bg-[#10B981] text-white rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors shadow-sm"
        >
          <Save className="w-5 h-5" />
          Save Changes
        </button>
      </div>
    </div>
  );
}