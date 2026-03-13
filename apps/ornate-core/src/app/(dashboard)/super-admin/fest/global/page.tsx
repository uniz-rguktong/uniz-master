import { getFestSettings } from '@/actions/festActions';
import GlobalSettingsClient from './GlobalSettingsClient';

export const metadata = {
    title: 'Global Settings | Super Admin',
};

export default async function GlobalSettingsPage() {
    const settings = await getFestSettings();

    return <GlobalSettingsClient initialSettings={JSON.parse(JSON.stringify(settings))} />;
}
