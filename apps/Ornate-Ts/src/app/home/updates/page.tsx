import { getActiveAnnouncements } from '@/lib/data/announcements';
import UpdatesClient from './UpdatesClient';

export default async function UpdatesPage() {
    const announcements = await getActiveAnnouncements();
    return <UpdatesClient announcements={announcements} />;
}
