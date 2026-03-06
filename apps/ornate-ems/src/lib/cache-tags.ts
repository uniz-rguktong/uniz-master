// ─────────────────────────────────────────────────────────
// Cache Tag Registry
// Single source of truth for all cache tags used in the app.
// When adding unstable_cache() tags in getters, reference these.
// ─────────────────────────────────────────────────────────

export const CACHE_TAGS = {
    // Registrations
    registrations: 'registrations',
    confirmedRegistrations: 'confirmed-registrations',
    pendingRegistrations: 'pending-registrations',
    waitlistRegistrations: 'waitlist-registrations',
    allRegistrations: 'all-registrations',
    eventRegistrations: 'event-registrations',
    teamRegistrations: 'team-registrations',

    // Events
    events: 'events',
    eventDetails: 'event-details',
    calendar: 'calendar',
    todaysEvents: 'todays-events',

    // Dashboard
    dashboardStats: 'dashboard-stats',
    dashboardTrends: 'dashboard-trends',
    dashboardRevenue: 'dashboard-revenue',
    dashboardTransactions: 'dashboard-transactions',

    // Super Admin
    registrationTrend: 'registration-trend',
    portalPerformance: 'portal-performance',

    // Analytics
    analytics: 'analytics',
    snapshot: 'snapshot',
    metrics: 'metrics',

    // Teams
    teams: 'teams',

    // Users / Admin
    users: 'users',
    admins: 'admins',
    logs: 'logs',

    // Sports
    sports: 'sports',
    stats: 'stats',
    fixtures: 'fixtures',
    sportRegistrations: 'sport-registrations',
    branchPoints: 'branch-points',
    sportWinners: 'sport-winners',

    // Coordinators
    coordinator: 'coordinator',

    // Misc getters
    branches: 'branches',
    hhoData: 'hho-data',
    eventsList: 'events-list',
    eventAnalytics: 'event-analytics',
    importHistory: 'import-history',
    exportHistory: 'export-history',
    studentWaitlist: 'student-waitlist',

    // Content domains
    brandAssets: 'brand-assets',
    gallery: 'gallery',
    promo: 'promo',
    certificates: 'certificates',
    announcements: 'announcements',
    clubSettings: 'club-settings',
    stalls: 'stalls',
    festSettings: 'fest-settings',
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

// ─────────────────────────────────────────────────────────
// Portal paths that need revalidation after entity changes.
// Centralised here to avoid scattering paths across actions.
// ─────────────────────────────────────────────────────────

export const EVENT_PATHS = [
    '/dashboard/events',
    '/super-admin/events',
    '/branch-admin/events',
    '/clubs-portal/events',
    '/hho',
    '/hho/all-events',
    '/sports',
    '/student',
] as const;

export const REGISTRATION_PATHS = [
    '/branch-admin/registrations',
    '/dashboard/all-registrations',
    '/dashboard/waitlist',
] as const;

export const WINNER_PATHS = [
    '/hho/updates/winners',
    '/clubs-portal/content/winners',
    '/branch-admin/content/winners',
    '/sports/winners',
] as const;

export const BRAND_PATHS = [
    '/sports/branding-assets',
    '/sports/branch-logos',
    '/branch-admin/content/promo-video',
    '/hho/branding',
] as const;

export const GALLERY_PATHS = [
    '/clubs-portal/content/gallery',
    '/sports/all-albums',
    '/sports/gallery',
    '/super-admin/gallery',
    '/hho/gallery',
] as const;

export const PROMO_PATHS = [
    '/clubs-portal/content/promo-video',
] as const;

export const CERTIFICATE_PATHS = [
    '/clubs-portal/content/certificates',
    '/hho/updates/certificates',
    '/branch-admin/content/certificates',
    '/sports/generate-certificates',
    '/super-admin/certificates',
    '/admin/certificates',
] as const;

export const ANNOUNCEMENT_PATHS = [
    '/sports/all-updates',
    '/hho/updates',
] as const;

export const CLUB_SETTINGS_PATHS = [
    '/clubs-portal/settings/club',
    '/clubs-portal/settings/profile',
    '/clubs-portal/settings/notifications',
    '/clubs-portal/settings/integrations',
] as const;

export const ADMIN_PROFILE_PATHS = [
    '/sports/admin-profile',
    '/branch-admin/settings/profile',
] as const;

export const SETTINGS_PATHS = [
    '/hho/updates/settings',
    '/hho/profile',
] as const;

export const STALL_PATHS = [
    '/super-admin/stalls',
] as const;

export const FEST_PATHS = [
    '/super-admin/fest/setup',
    '/',
] as const;

export const SPORT_PATHS = [
    '/sports',
    '/sports/all-sports',
    '/sports/add-sport',
] as const;

export const FIXTURE_PATHS = [
    '/sports/polls-fixtures',
    '/sports/match-schedule',
    '/sports/match-results',
] as const;

export const POINTS_PATHS = [
    '/sports/points-table',
    '/sports/championship',
] as const;
