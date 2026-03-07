import { IntegrationSettingsPage } from "@/components/features/clubs/views/IntegrationSettingsPage";
import { getIntegrationSettings } from "@/actions/clubSettingsActions";

export default async function Page() {
  const res = await getIntegrationSettings();
  return (
    <IntegrationSettingsPage
      initialIntegrations={(res.integrations || []) as any[]}
    />
  );
}
