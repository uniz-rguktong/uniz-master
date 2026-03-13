// Refreshing profile data...
import { getMyProfile } from '@/lib/actions/profile';
import ProfileClient from './ProfileClient';
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function ProfilePage() {
    const session = await getSession();

    // If not authenticated, redirect to central auth hub
    if (!session?.user) {
        redirect('/login');
    }

    const profile = await getMyProfile();

    if (!profile) {
        return notFound();
    }

    return <ProfileClient profile={profile} />;
}
