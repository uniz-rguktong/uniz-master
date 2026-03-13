import { getPublishedEvents } from '@/lib/data/events';
import { getEventParticipationSnapshot } from '@/lib/data/user-participation';
import MissionsClient from './MissionsClient';
import type { Mission } from '@/components/missions/MissionCard';
import { getSession } from "@/lib/auth";
import { redirect } from 'next/navigation';

export default async function MissionsPage({
    searchParams,
}: {
    searchParams?: Promise<{ id?: string }>;
}) {
    const resolvedSearchParams = await searchParams;
    const initialMissionId = resolvedSearchParams?.id ?? null;

    const [session, events] = await Promise.all([
        getSession(),
        getPublishedEvents(250)
    ]);

    if (!session) {
        redirect('/login');
    }

    let registeredEventIds: string[] = [];
    let userProfile = null;

    if (session?.user?.id) {
        const snapshot = await getEventParticipationSnapshot(session.user.id);
        registeredEventIds = snapshot.registeredEventIds;
        userProfile = snapshot.userProfile;
    }

    // Map to the Mission type expected by MissionCard
    const missions: Mission[] = events.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        category: e.category as Mission['category'],
        subCategory: e.subCategory,
        eventCategory: e.eventCategory,
        exp: e.exp,
        deadline: e.deadline,
        slots: e.slots,
        status: e.status as Mission['status'],
        isPaid: e.isPaid,
        eventDate: e.eventDate,
        eventDay: e.eventDay,
        venue: e.venue,
        registered: e.registered,
        totalSlots: e.totalSlots,
        isTeam: e.isTeam,
        teamSizeMin: e.teamSizeMin ?? undefined,
        teamSizeMax: e.teamSizeMax ?? undefined,
        coordinators: e.coordinators,
    }));

    return (
        <MissionsClient
            missions={missions}
            registeredEventIds={registeredEventIds}
            userProfile={userProfile}
            initialMissionId={initialMissionId}
        />
    );
}
