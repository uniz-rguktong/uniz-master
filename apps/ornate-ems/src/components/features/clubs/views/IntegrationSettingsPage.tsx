"use client";
import { useState, useEffect } from "react";
import {
  Link2,
  Mail,
  MessageSquare,
  Video,
  Cloud,
  Database,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { updateIntegrationSettings } from "@/actions/clubSettingsActions";

const integrationMetadata = [
  {
    id: "google-workspace",
    name: "Google Workspace",
    description: "Connect with Gmail, Google Calendar, and Drive",
    icon: Mail,
    color: "#4285F4",
    features: ["Email notifications", "Calendar sync", "Drive storage"],
  },
  {
    id: "microsoft-teams",
    name: "Microsoft Teams",
    description: "Enable Teams notifications and meetings",
    icon: Video,
    color: "#5059C9",
    features: ["Team channels", "Video calls", "Chat integration"],
  },
  {
    id: "slack",
    name: "Slack",
    description: "Send notifications to Slack channels",
    icon: MessageSquare,
    color: "#4A154B",
    features: ["Channel notifications", "Bot commands", "Event alerts"],
  },
  {
    id: "zoom",
    name: "Zoom",
    description: "Schedule and manage Zoom meetings",
    icon: Video,
    color: "#2D8CFF",
    features: ["Meeting scheduling", "Webinar hosting", "Recording access"],
  },
  {
    id: "aws",
    name: "Amazon Web Services",
    description: "Cloud storage and database services",
    icon: Cloud,
    color: "#FF9900",
    features: ["S3 storage", "RDS database", "CloudFront CDN"],
  },
  {
    id: "firebase",
    name: "Firebase",
    description: "Real-time database and authentication",
    icon: Database,
    color: "#FFCA28",
    features: ["Authentication", "Firestore", "Cloud messaging"],
  },
];

interface IntegrationSettingsPageProps {
  initialIntegrations?: Array<Record<string, any>>;
}

export function IntegrationSettingsPage({
  initialIntegrations,
}: IntegrationSettingsPageProps) {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<any>(null);
  const { showToast } = useToast();

  useEffect(() => {
    // Merge metadata with initial status
    const merged = integrationMetadata.map((meta) => {
      const found = initialIntegrations?.find((i) => i.id === meta.id);
      return {
        ...meta,
        connected: found ? found.connected : false,
      };
    });
    setIntegrations(merged);
  }, [initialIntegrations]);

  const handleToggleConnection = async (
    integrationId: any,
    currentStatus: any,
  ) => {
    setLoadingId(integrationId);
    try {
      const newStatus = !currentStatus;
      // Update local state temporarily
      const updatedIntegrations = integrations.map((i) =>
        i.id === integrationId ? { ...i, connected: newStatus } : i,
      );
      setIntegrations(updatedIntegrations);

      // Persist to server
      // We need to send the minimal data to save
      const payload = updatedIntegrations.map((i) => ({
        id: i.id,
        connected: i.connected,
      }));
      const result = await updateIntegrationSettings(payload);

      if (result.success) {
        showToast(
          `${newStatus ? "Connected" : "Disconnected"} successfully`,
          "success",
        );
      } else {
        // Revert on failure
        setIntegrations(integrations);
        showToast(result.error || "Failed to update settings", "error");
      }
    } catch (error) {
      setIntegrations(integrations);
      showToast("An unexpected error occurred", "error");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div
          className="animate-card-entrance"
          style={{ animationDelay: "40ms" }}
        >
          <div className="bg-[#F4F2F0] rounded-[18px] px-[8px] pt-[8px] pb-[24px]">
            <div className="bg-white p-4 rounded-[14px]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#DBEAFE] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Link2 className="w-5 h-5 text-[#3B82F6]" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm text-[#6B7280]">
                    Total Integrations
                  </div>
                  <div className="text-2xl font-semibold text-[#1A1A1A]">
                    {integrations.length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="animate-card-entrance"
          style={{ animationDelay: "80ms" }}
        >
          <div className="bg-[#F4F2F0] rounded-[12px] p-2">
            <div className="bg-white rounded-[10px] p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#D1FAE5] rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-[#10B981]" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm text-[#6B7280]">Connected</div>
                  <div className="text-2xl font-semibold text-[#10B981]">
                    {integrations.filter((i: any) => i.connected).length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="animate-card-entrance"
          style={{ animationDelay: "120ms" }}
        >
          <div className="bg-[#F4F2F0] rounded-[12px] p-2">
            <div className="bg-white rounded-[10px] p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F3F4F6] rounded-lg flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-5 h-5 text-[#6B7280]" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm text-[#6B7280]">Not Connected</div>
                  <div className="text-2xl font-semibold text-[#6B7280]">
                    {integrations.filter((i: any) => !i.connected).length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {integrations.map((integration: any, index: any) => {
          const Icon = integration.icon;
          const isLoading = loadingId === integration.id;

          return (
            <div
              key={integration.id}
              className="bg-[#F4F2F0] rounded-[18px] p-[10px] animate-card-entrance"
              style={{ animationDelay: `${index * 100 + 200}ms` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${integration.color}15` }}
                  >
                    <Icon
                      className="w-6 h-6"
                      style={{ color: integration.color }}
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1A1A1A]">
                      {integration.name}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {integration.connected ? (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D1FAE5] text-[#065F46] rounded-full text-xs font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F3F4F6] text-[#6B7280] rounded-full text-xs font-semibold">
                      <XCircle className="w-3.5 h-3.5" />
                      Not Connected
                    </span>
                  )}
                </div>
              </div>

              <div
                className={`bg-white p-5 shadow-sm transition-all rounded-[16px]`}
              >
                <p className="text-sm text-[#6B7280] mb-4">
                  {integration.description}
                </p>

                {/* Features */}
                <div className="mb-4">
                  <div className="text-xs font-semibold text-[#6B7280] mb-2">
                    KEY FEATURES
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {integration.features.map((feature: any, index: any) => (
                      <span
                        key={index}
                        className="px-2.5 py-1 bg-[#F7F8FA] border border-[#E5E7EB] rounded-full text-xs text-[#1A1A1A]"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {integration.connected ? (
                    <>
                      <button className="flex-1 px-4 py-2 bg-[#F7F8FA] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#1A1A1A] transition-colors">
                        Configure
                      </button>
                      <button
                        onClick={() =>
                          handleToggleConnection(integration.id, true)
                        }
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 bg-[#FEE2E2] hover:bg-[#FECACA] text-[#EF4444] rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Disconnect"
                        )}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() =>
                        handleToggleConnection(integration.id, false)
                      }
                      disabled={isLoading}
                      className="flex-1 px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      style={{ backgroundColor: integration.color }}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Connect"
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* API Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
        {/* API Keys */}
        <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
          <h3 className="text-lg font-semibold text-[#1A1A1A] mb-1">
            API Keys
          </h3>
          <p className="text-xs text-[#6B7280] mb-3">
            Manage your API keys for authentication
          </p>

          <div className="bg-white p-6 shadow-sm rounded-[14px]">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Public API Key
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Not generated"
                    readOnly
                    className="flex-1 px-4 py-2.5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg text-sm text-[#6B7280]"
                  />

                  <button className="px-4 py-2 bg-[#F7F8FA] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#1A1A1A] transition-colors">
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Secret API Key
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="Not generated"
                    readOnly
                    className="flex-1 px-4 py-2.5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg text-sm text-[#6B7280]"
                  />

                  <button className="px-4 py-2 bg-[#F7F8FA] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#1A1A1A] transition-colors">
                    Show
                  </button>
                </div>
              </div>

              <button className="w-full px-4 py-2 bg-[#1A1A1A] hover:bg-[#2D2D2D] text-white rounded-lg text-sm font-medium transition-colors">
                Generate New Keys
              </button>
            </div>
          </div>
        </div>

        {/* Webhooks */}
        <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
          <h3 className="text-lg font-semibold text-[#1A1A1A] mb-1">
            Webhooks
          </h3>
          <p className="text-xs text-[#6B7280] mb-3">
            Configure webhook endpoints for event notifications
          </p>

          <div className="bg-white p-6 shadow-sm rounded-[14px]">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Webhook URL
                </label>
                <input
                  type="url"
                  placeholder="https://your-domain.com/webhook"
                  className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Events to Subscribe
                </label>
                <div className="space-y-2">
                  {[
                    "event.created",
                    "registration.new",
                    "match.scheduled",
                    "winner.announced",
                  ].map((event: any) => (
                    <label key={event} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-[#10B981] bg-white border-[#E5E7EB] rounded focus:ring-[#10B981]"
                      />

                      <span className="text-sm text-[#1A1A1A]">{event}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button className="w-full px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg text-sm font-medium transition-colors">
                Add Webhook
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Developer Documentation */}
      <div className="mt-6 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] rounded-xl p-6 text-white mb-20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Developer Documentation</h3>
            <p className="text-sm opacity-90">
              Learn how to integrate with our API and build custom solutions
            </p>
          </div>
          <button className="px-6 py-3 bg-white text-[#3B82F6] rounded-lg text-sm font-semibold hover:bg-opacity-90 transition-all">
            View Docs
          </button>
        </div>
      </div>
    </>
  );
}
