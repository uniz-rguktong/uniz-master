'use client';
import { useState } from 'react';
import { Link2, Mail, MessageSquare, Video, Cloud, Database, CheckCircle, XCircle, Settings, Key, Globe, Bell } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/useToast';

const webhookSchema = z.object({
  webhookUrl: z.string().url('Please enter a valid URL (starting with http:// or https://)'),
  subscribedEvents: z.array(z.string()).min(1, 'Please select at least one event')
});

type WebhookFormValues = z.infer<typeof webhookSchema>;

const integrations = [
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    description: 'Connect with Gmail, Google Calendar, and Drive',
    icon: Mail,
    color: '#4285F4',
    connected: false,
    features: ['Email notifications', 'Calendar sync', 'Drive storage']
  },
  {
    id: 'microsoft-teams',
    name: 'Microsoft Teams',
    description: 'Enable Teams notifications and meetings',
    icon: Video,
    color: '#5059C9',
    connected: false,
    features: ['Team channels', 'Video calls', 'Chat integration']
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send notifications to Slack channels',
    icon: MessageSquare,
    color: '#4A154B',
    connected: false,
    features: ['Channel notifications', 'Bot commands', 'Event alerts']
  },
  {
    id: 'zoom',
    name: 'Zoom',
    description: 'Schedule and manage Zoom meetings',
    icon: Video,
    color: '#2D8CFF',
    connected: false,
    features: ['Meeting scheduling', 'Webinar hosting', 'Recording access']
  },
  {
    id: 'aws',
    name: 'Amazon Web Services',
    description: 'Cloud storage and database services',
    icon: Cloud,
    color: '#FF9900',
    connected: false,
    features: ['S3 storage', 'RDS database', 'CloudFront CDN']
  },
  {
    id: 'firebase',
    name: 'Firebase',
    description: 'Real-time database and authentication',
    icon: Database,
    color: '#FFCA28',
    connected: false,
    features: ['Authentication', 'Firestore', 'Cloud messaging']
  }];


export function IntegrationSettingsPage() {
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);
  const { showToast } = useToast();

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<WebhookFormValues>({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      webhookUrl: '',
      subscribedEvents: []
    }
  });

  const subscribedEvents = watch('subscribedEvents');

  const onWebhookSubmit = async (data: WebhookFormValues) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    showToast("Webhook added successfully!", "success");
    console.log("Webhook data:", data);
  };

  const toggleEvent = (event: string) => {
    const current = [...subscribedEvents];
    if (current.includes(event)) {
      setValue('subscribedEvents', current.filter(e => e !== event));
    } else {
      setValue('subscribedEvents', [...current, event]);
    }
  };

  return (
    <div className="p-8 animate-page-entrance">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
          <span className="hover:text-[#1A1A1A] cursor-pointer">Dashboard</span>
          <span className="text-gray-300">›</span>
          <span className="hover:text-[#1A1A1A] cursor-pointer">Settings</span>
          <span className="text-gray-300">›</span>
          <span className="text-[#1A1A1A] font-medium border-b border-indigo-500 pb-0.5">Integrations</span>
        </div>

        <div>
          <h1 className="text-2xl md:text-[32px] font-bold text-[#1A1A1A] mb-2 tracking-tight">Integration Hub</h1>
          <p className="text-sm text-[#6B7280] font-medium">Power up your event management with external tool connections</p>
        </div>
      </div>

      {/* Modern Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: 'Total Syncs', value: integrations.length, icon: Link2, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active Links', value: integrations.filter(i => i.connected).length, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Dormant', value: integrations.filter(i => !i.connected).length, icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-100' },
          { label: 'API Hits (24h)', value: '1,247', icon: Settings, color: 'text-orange-600', bg: 'bg-orange-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
            <div className={`absolute -right-6 -top-6 w-24 h-24 ${stat.bg} opacity-20 rounded-full group-hover:scale-110 transition-transform`} />
            <div className="flex items-center gap-4 relative z-10">
              <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center shadow-inner`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Globe className="w-5 h-5 text-indigo-600" />
          External Services
        </h2>
        <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full uppercase tracking-widest">
          {integrations.length} Available
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {integrations.map((integration: any, index: any) => {
          const Icon = integration.icon;
          return (
            <div
              key={integration.id}
              className="bg-[#F4F2F0] rounded-[24px] p-[10px] animate-card-entrance group"
              style={{ animationDelay: `${index * 50}ms` }}>

              <div className="bg-white p-6 rounded-[20px] shadow-sm border border-[#E5E7EB]/50 h-full flex flex-col">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform"
                      style={{ backgroundColor: `${integration.color}15` }}>
                      <Icon className="w-7 h-7" style={{ color: integration.color }} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#1A1A1A]">{integration.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`w-2 h-2 rounded-full ${integration.connected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {integration.connected ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-[#6B7280] mb-6 font-medium leading-relaxed">{integration.description}</p>

                <div className="mb-6 flex-1">
                  <div className="text-[10px] font-bold text-[#9CA3AF] mb-3 uppercase tracking-widest">Sync Capabilities</div>
                  <div className="flex flex-wrap gap-2">
                    {integration.features.map((feature: any, index: any) =>
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-gray-50 text-[10px] font-bold text-gray-600 rounded-lg border border-gray-100 flex items-center gap-1.5 hover:bg-white hover:border-indigo-200 transition-all cursor-default">
                        <div className="w-1 h-1 rounded-full bg-indigo-400" />
                        {feature}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-50">
                  {integration.connected ?
                    <>
                      <button className="flex-1 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 uppercase tracking-widest transition-all">
                        Configure
                      </button>
                      <button className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">
                        Off
                      </button>
                    </> :
                    <button
                      className="w-full px-4 py-3 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg hover:shadow-indigo-200 active:scale-[0.98]"
                      style={{ backgroundColor: integration.color }}>
                      Link {integration.name}
                    </button>
                  }
                </div>
              </div>
            </div>);
        })}
      </div>

      {/* Advanced Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* API Credentials */}
        <div className="bg-[#F4F2F0] rounded-[28px] p-2 flex flex-col">
          <div className="p-6 bg-white rounded-[24px] border border-gray-100 shadow-sm flex-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1A1A1A]">API Credentials</h3>
                <p className="text-xs text-[#6B7280] font-medium">Universal keys for cross-platform auth</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Client Identifier</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value="ORN_PRD_8x92KL01"
                    readOnly
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono text-gray-600 focus:outline-none" />
                  <button className="px-5 py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">
                    Copy
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Universal Secret</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value="••••••••••••••••••••"
                    readOnly
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono text-gray-600 focus:outline-none" />
                  <button className="px-5 py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">
                    Show
                  </button>
                </div>
              </div>

              <button className="w-full py-4 bg-[#1A1A1A] hover:bg-black text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-xl shadow-black/10 active:scale-[0.98]">
                Rotate Credentials
              </button>
            </div>
          </div>
        </div>

        {/* Webhook Stream */}
        <div className="bg-[#F4F2F0] rounded-[28px] p-2 flex flex-col">
          <div className="p-6 bg-white rounded-[24px] border border-gray-100 shadow-sm flex-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1A1A1A]">Event Callbacks</h3>
                <p className="text-xs text-[#6B7280] font-medium">Live data streams to your endpoints</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onWebhookSubmit)} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Destination URL</label>
                <Input
                  {...register('webhookUrl')}
                  placeholder="https://hooks.yourdomain.io/main"
                  error={errors.webhookUrl?.message}
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Event Subscriptions</label>
                <div className="grid grid-cols-2 gap-3">
                  {['event.created', 'registration.new', 'match.scheduled', 'winner.announced'].map((event: any) => (
                    <button
                      key={event}
                      type="button"
                      onClick={() => toggleEvent(event)}
                      className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-left ${subscribedEvents.includes(event)
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                          : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                        }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${subscribedEvents.includes(event) ? 'bg-indigo-600' : 'bg-gray-300'}`} />
                      <span className="text-[11px] font-bold font-mono tracking-tight">{event}</span>
                    </button>
                  ))}
                </div>
                {errors.subscribedEvents?.message && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.subscribedEvents.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-xl shadow-emerald-100 disabled:opacity-50 active:scale-[0.98]">
                {isSubmitting ? 'Registering...' : 'Activate Webhook'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Developer Documentation */}
      <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-[32px] p-8 text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-indigo-500/20 transition-colors" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div>
            <h3 className="text-2xl font-black mb-3 tracking-tight">Technical Reference</h3>
            <p className="text-gray-400 max-w-md font-medium leading-relaxed">
              Unlock the full potential of Ornate EMS by building custom extensions using our comprehensive GraphQL & REST APIs.
            </p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <button className="flex-1 md:flex-none px-8 py-4 bg-white text-gray-900 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-[0.98]">
              API Guide
            </button>
            <button className="flex-1 md:flex-none px-8 py-4 bg-white/10 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10 backdrop-blur-sm">
              Showcases
            </button>
          </div>
        </div>
      </div>
    </div>);
}