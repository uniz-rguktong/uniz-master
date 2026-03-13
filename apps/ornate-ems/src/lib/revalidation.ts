'use server';
// ─────────────────────────────────────────────────────────
// Revalidation Helpers (server-side only)
// ─────────────────────────────────────────────────────────

import { revalidateTag as _revalidateTag, revalidatePath } from 'next/cache';
import {
    CACHE_TAGS,
    EVENT_PATHS,
    REGISTRATION_PATHS,
    WINNER_PATHS,
    BRAND_PATHS,
    GALLERY_PATHS,
    PROMO_PATHS,
    CERTIFICATE_PATHS,
    ANNOUNCEMENT_PATHS,
    CLUB_SETTINGS_PATHS,
    ADMIN_PROFILE_PATHS,
    SETTINGS_PATHS,
    STALL_PATHS,
    FEST_PATHS,
    SPORT_PATHS,
    FIXTURE_PATHS,
    POINTS_PATHS,
} from '@/lib/cache-tags';

// This Next.js version requires a second argument for revalidateTag.
// We use a wrapper to simplify the API (same pattern used across codebase).
const bustTag = (tag: string) => (_revalidateTag as any)(tag, 'max');

// ─────────────────────────────────────────────────────────
// Entity-based revalidation helpers
// Call these after mutations instead of scattering
// revalidateTag/revalidatePath calls everywhere.
// ─────────────────────────────────────────────────────────

/**
 * Revalidate all registration-related caches.
 * Call after: create/update/delete/confirm/reject/waitlist registrations.
 */
export async function revalidateRegistrations(eventId?: string) {
    bustTag(CACHE_TAGS.registrations);
    bustTag(CACHE_TAGS.eventRegistrations);
    if (eventId) {
        bustTag(`event-registrations-${eventId}`);
    }
    bustTag(CACHE_TAGS.dashboardStats);
    bustTag(CACHE_TAGS.analytics);
    
    REGISTRATION_PATHS.forEach(p => {
        // Use 'layout' for paths with dynamic segments to ensure all sub-pages are cleared
        const revalidateType = p.includes('[id]') ? 'layout' : 'page';
        revalidatePath(p, revalidateType);
    });
}

/**
 * Revalidate all event-related caches.
 * Call after: create/update/delete events.
 */
export async function revalidateEvents() {
    bustTag(CACHE_TAGS.events);
    bustTag(CACHE_TAGS.eventDetails);
    bustTag(CACHE_TAGS.eventsList);
    bustTag(CACHE_TAGS.calendar);
    bustTag(CACHE_TAGS.dashboardStats);
    bustTag(CACHE_TAGS.todaysEvents);
    EVENT_PATHS.forEach(p => revalidatePath(p, 'page'));
}

/**
 * Revalidate all team-related caches.
 * Call after: create/approve/reject teams.
 */
export async function revalidateTeams() {
    bustTag(CACHE_TAGS.teams);
    bustTag(CACHE_TAGS.registrations);
    revalidatePath('/dashboard', 'page');
    revalidatePath('/branch-admin/registrations', 'page');
    revalidatePath('/sports', 'page');
    revalidatePath('/student', 'page');
}

/**
 * Revalidate user/admin-related caches.
 * Call after: create/update/suspend/delete users.
 */
export async function revalidateUsers() {
    bustTag(CACHE_TAGS.users);
    bustTag(CACHE_TAGS.admins);
}

/**
 * Revalidate all analytics caches.
 * Call after: analytics snapshot updates.
 */
export async function revalidateAnalytics() {
    bustTag(CACHE_TAGS.analytics);
    bustTag(CACHE_TAGS.snapshot);
    bustTag(CACHE_TAGS.metrics);
    bustTag(CACHE_TAGS.dashboardTrends);
}

/**
 * Revalidate sports-specific caches.
 * Call after: sports event/match updates.
 */
export async function revalidateSports() {
    bustTag(CACHE_TAGS.sports);
    bustTag(CACHE_TAGS.stats);
    bustTag(CACHE_TAGS.events);
    SPORT_PATHS.forEach(p => revalidatePath(p, 'page'));
}

/**
 * Revalidate coordinator caches.
 * Call after: coordinator assignment changes.
 */
export async function revalidateCoordinators() {
    bustTag(CACHE_TAGS.coordinator);
    bustTag(CACHE_TAGS.events);
}

/**
 * Revalidate winner/certificate paths across all portals.
 * Call after: winner announcement or certificate operations.
 */
export async function revalidateWinners() {
    WINNER_PATHS.forEach(p => revalidatePath(p, 'page'));
    POINTS_PATHS.forEach(p => revalidatePath(p, 'page'));
    bustTag(CACHE_TAGS.events);
    bustTag(CACHE_TAGS.branchPoints);
}

/**
 * Revalidate task/schedule caches across portals.
 * Call after: task create/update/delete.
 */
export async function revalidateTasks() {
    revalidatePath('/branch-admin/schedule/timeline', 'page');
    revalidatePath('/sports-admin/schedule/timeline', 'page');
}

/**
 * Revalidate fixture/match caches across sports portals.
 * Call after: fixture create/update/score/delete.
 */
export async function revalidateFixtures() {
    bustTag(CACHE_TAGS.fixtures);
    FIXTURE_PATHS.forEach(p => revalidatePath(p, 'page'));
    bustTag(CACHE_TAGS.sports);
}

/**
 * Revalidate standalone sport pages and caches.
 * Call after: create/update/delete/duplicate sport.
 */
export async function revalidateSportData() {
    bustTag(CACHE_TAGS.sports);
    bustTag(CACHE_TAGS.stats);
    bustTag(CACHE_TAGS.branchPoints);
    SPORT_PATHS.forEach(p => revalidatePath(p, 'page'));
    POINTS_PATHS.forEach(p => revalidatePath(p, 'page'));
}

/**
 * Revalidate fixture/match pages and caches.
 * Call after: fixture create/update/delete/score changes.
 * Also busts points-table caches because match completions affect standings.
 */
export async function revalidateFixtureData() {
    bustTag(CACHE_TAGS.fixtures);
    bustTag(CACHE_TAGS.sports);
    bustTag(CACHE_TAGS.branchPoints);
    bustTag(CACHE_TAGS.stats);
    FIXTURE_PATHS.forEach(p => revalidatePath(p, 'page'));
    POINTS_PATHS.forEach(p => revalidatePath(p, 'page'));
}

/**
 * Revalidate branch standings and points-table pages.
 * Call after: branch points recalculation or updates.
 */
export async function revalidateBranchPointsData() {
    bustTag(CACHE_TAGS.branchPoints);
    bustTag(CACHE_TAGS.stats);
    POINTS_PATHS.forEach(p => revalidatePath(p, 'page'));
}

/**
 * Revalidate sport registration pages and caches.
 * Call after: create/update/delete/approve/reject sport registrations.
 */
export async function revalidateSportRegistrationData() {
    bustTag(CACHE_TAGS.sportRegistrations);
    bustTag(CACHE_TAGS.registrations);
    revalidatePath('/sports/all-registrations', 'page');
}

/**
 * Revalidate notification/message caches across portals.
 * Call after: send message, mark read, delete messages.
 */
export async function revalidateNotifications() {
    revalidatePath('/notifications');
    revalidatePath('/hho/messages');
    revalidatePath('/branch-admin/notifications');
    revalidatePath('/super-admin/messages');
}

/**
 * Revalidate brand/logo caches across all portals.
 * Call after: upload/update/delete brand logos, branding assets.
 */
export async function revalidateBrand() {
    bustTag(CACHE_TAGS.brandAssets);
    BRAND_PATHS.forEach(p => revalidatePath(p, 'page'));
}

/**
 * Revalidate gallery caches across portals.
 * Call after: create/update/delete albums or images.
 */
export async function revalidateGallery() {
    bustTag(CACHE_TAGS.gallery);
    GALLERY_PATHS.forEach(p => revalidatePath(p, 'page'));
}

/**
 * Revalidate promo video caches.
 * Call after: create/update/delete promo videos.
 */
export async function revalidatePromo() {
    bustTag(CACHE_TAGS.promo);
    PROMO_PATHS.forEach(p => revalidatePath(p, 'page'));
}

/**
 * Revalidate certificate caches across all portals.
 * Call after: distribute/generate/delete certificates or themes.
 */
export async function revalidateCertificates() {
    bustTag(CACHE_TAGS.certificates);
    CERTIFICATE_PATHS.forEach(p => revalidatePath(p, 'page'));
}

/**
 * Revalidate announcement caches across portals.
 * Call after: create/update/delete announcements.
 */
export async function revalidateAnnouncements() {
    bustTag(CACHE_TAGS.announcements);
    ANNOUNCEMENT_PATHS.forEach(p => revalidatePath(p, 'page'));
}

/**
 * Revalidate club settings caches.
 * Call after: update club settings, profile, notification prefs, integrations.
 */
export async function revalidateClubSettings() {
    bustTag(CACHE_TAGS.clubSettings);
    CLUB_SETTINGS_PATHS.forEach(p => revalidatePath(p, 'page'));
}

/**
 * Revalidate admin profile caches across portals.
 * Call after: update admin profile, avatar, settings.
 */
export async function revalidateAdminProfile() {
    bustTag(CACHE_TAGS.admins);
    ADMIN_PROFILE_PATHS.forEach(p => revalidatePath(p, 'page'));
}

/**
 * Revalidate HHO settings/profile caches.
 * Call after: update HHO settings or profile.
 */
export async function revalidateSettings() {
    SETTINGS_PATHS.forEach(p => revalidatePath(p, 'page'));
}

/**
 * Revalidate stall caches.
 * Call after: create/update/delete stalls.
 */
export async function revalidateStalls() {
    bustTag(CACHE_TAGS.stalls);
    STALL_PATHS.forEach(p => revalidatePath(p, 'page'));
}

/**
 * Revalidate fest settings caches.
 * Call after: update fest settings.
 */
export async function revalidateFestSettings() {
    bustTag(CACHE_TAGS.festSettings);
    FEST_PATHS.forEach(p => revalidatePath(p, 'page'));
}

/**
 * Nuclear option: revalidate everything.
 * Use sparingly — only for admin-level bulk operations.
 */
export async function revalidateAll() {
    Object.values(CACHE_TAGS).forEach(tag => bustTag(tag));
}
