import { redirect } from 'next/navigation';

export default function SettingsIndex() {
    redirect('/clubs-portal/settings/profile');
}
