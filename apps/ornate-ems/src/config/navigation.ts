import type { LucideIcon } from 'lucide-react';
import {
    LayoutDashboard,
    Calendar,
    CalendarPlus,
    Users,
    Settings,
    Bell,
    LogOut,
    UserCircle,
    ChevronDown,
    ChevronRight,
    Medal,
    FileText,
    Target,
    Clock,
    List,
    Image as IconImage,
    Megaphone,
    Trophy,
    Map,
    Lock,
    PlusCircle,
    BarChart3,
    CheckCircle2,
    CheckCircle,
    Download,
    Heart,
    IndianRupee,
    Video,
    BookOpen,
    MessageCircle,
    HelpCircle,
    CalendarDays,
    Table,
    ClipboardCheck,
    Activity,
    UserPlus,
    Store,
    GraduationCap,
    History,
    Shield,
    Layout,
    User,
    PieChart
} from 'lucide-react';

export interface NavigationItem {
    label: string;
    href: string;
    icon: LucideIcon;
    exact?: boolean;
}

export interface NavigationSection {
    title: string;
    key?: string;
    items: NavigationItem[];
}

export interface NavigationConfig {
    SUPER_ADMIN: NavigationSection[];
    BRANCH_ADMIN: NavigationSection[];
    HHO: NavigationSection[];
    SPORTS_ADMIN: NavigationSection[];
    BRANCH_SPORTS_ADMIN: NavigationSection[];
    CLUB_COORDINATOR: NavigationSection[];
    EVENT_COORDINATOR: NavigationSection[];
}

export const navigationConfig: NavigationConfig = {
    SUPER_ADMIN: [
        {
            title: 'OVERVIEW',
            items: [
                {
                    label: 'Mission Control',
                    href: '/super-admin',
                    icon: LayoutDashboard,
                    exact: true
                }
            ]
        },
        {
            title: 'USERS & ROLES',
            key: 'users',
            items: [
                { label: 'All Users', href: '/super-admin/users', icon: Users, exact: true }
            ]
        },
        {
            title: 'EVENTS CONTROL CENTER',
            key: 'events',
            items: [
                { label: 'All Events', href: '/super-admin/events', icon: Calendar, exact: true },
                { label: 'Roadmap & Schedule', href: '/super-admin/events/roadmap', icon: Map }
            ]
        },
        {
            title: 'STALLS MANAGEMENT',
            key: 'stalls',
            items: [
                { label: 'All Stalls', href: '/super-admin/stalls', icon: Store }
            ]
        },
        {
            title: 'AWARDS',
            key: 'awards',
            items: [
                { label: 'Outgoing Students', href: '/super-admin/awards/best-outgoing', icon: GraduationCap }
            ]
        },
        {
            title: 'CHAMPIONSHIP',
            key: 'championship',
            items: [
                { label: 'Tracking Board', href: '/super-admin/championship', icon: Trophy }
            ]
        },
        {
            title: 'GLOBAL ANNOUNCEMENTS',
            key: 'announcements',
            items: [
                { label: 'Create New', href: '/super-admin/announcements/create', icon: Megaphone },
                { label: 'Scheduled', href: '/super-admin/announcements/scheduled', icon: Calendar }
            ]
        },
        {
            title: 'ANALYTICS',
            key: 'analytics',
            items: [
                { label: 'Events Analytics', href: '/super-admin/analytics/events', icon: Activity },
                { label: 'Registrations', href: '/super-admin/analytics/registrations', icon: Users }
            ]
        },
        {
            title: 'HELP & SUPPORT',
            key: 'support',
            items: [
                { label: 'Documentation', href: '/super-admin/support/docs', icon: FileText },
                { label: 'Contact Support', href: '/super-admin/support/contact', icon: UserCircle },
                { label: 'FAQs', href: '/super-admin/support/faq', icon: Bell }
            ]
        }
    ],

    BRANCH_ADMIN: [
        {
            title: 'DASHBOARD',
            items: [
                { label: 'Overview', href: '/branch-admin', icon: LayoutDashboard, exact: true }
            ]
        },
        {
            title: 'EVENTS MANAGEMENT',
            key: 'events',
            items: [
                { label: 'All Events', href: '/branch-admin/events', icon: Calendar, exact: true },
                { label: 'Add New Event', href: '/branch-admin/events/create', icon: CalendarPlus },
                { label: 'Event Analytics', href: '/branch-admin/events/analytics', icon: Target },
                { label: 'Coordinator Management', href: '/branch-admin/coordinators', icon: Users }
            ]
        },
        {
            title: 'REGISTRATIONS',
            key: 'registrations',
            items: [
                { label: 'All Registrations', href: '/branch-admin/registrations', icon: Users, exact: true },
                { label: 'Pending Approvals', href: '/branch-admin/registrations/pending', icon: Clock },
                { label: 'Confirmed', href: '/branch-admin/registrations/confirmed', icon: CheckCircle },
                { label: 'Waitlist Management', href: '/branch-admin/registrations/waitlist', icon: List }
            ]
        },
        {
            title: 'CONTENT MANAGEMENT',
            key: 'content',
            items: [
                { label: 'Promo Video & Logo', href: '/branch-admin/content/promo-video', icon: Video },
                { label: 'Gallery Management', href: '/branch-admin/content/gallery', icon: IconImage },
                { label: 'Updates & Announcements', href: '/branch-admin/content/announcements', icon: Megaphone },
                { label: 'Winners Announcement', href: '/branch-admin/content/winners', icon: Trophy },
                { label: 'Best Outgoing Students', href: '/branch-admin/content/outgoing-students', icon: GraduationCap },
                { label: 'Certificates', href: '/branch-admin/content/certificates', icon: Medal }
            ]
        },
        {
            title: 'SCHEDULE & ROADMAP',
            key: 'schedule',
            items: [
                { label: 'Event Calendar', href: '/branch-admin/schedule/calendar', icon: CalendarDays },
                { label: 'Timeline/Roadmap', href: '/branch-admin/schedule/timeline', icon: Map }
            ]
        },
        {
            title: 'SPORTS',
            key: 'sports',
            items: [
                { label: 'Championship Tracking', href: '/branch-admin/sports/championship', icon: Trophy }
            ]
        },
        {
            title: 'SETTINGS',
            key: 'settings',
            items: [
                { label: 'Admin Profile', href: '/branch-admin/settings/profile', icon: User }
            ]
        },
        {
            title: 'HELP & SUPPORT',
            key: 'support',
            items: [
                { label: 'Documentation', href: '/branch-admin/support/documentation', icon: BookOpen },
                { label: 'Contact Us', href: '/branch-admin/support/contact', icon: MessageCircle },
                { label: 'FAQs', href: '/branch-admin/support/faq', icon: HelpCircle }
            ]
        }
    ],

    HHO: [
        {
            title: 'OVERVIEW',
            items: [
                { label: 'Dashboard Homepage', href: '/hho', icon: LayoutDashboard, exact: true }
            ]
        },
        {
            title: 'EVENTS MANAGEMENT',
            key: 'events-mgmt',
            items: [
                { label: 'All Events', href: '/hho/all-events', icon: Calendar, exact: true },
                { label: 'Add New Event', href: '/hho/add-event', icon: PlusCircle },
                { label: 'Event Analytics', href: '/hho/event-analytics', icon: BarChart3 }
            ]
        },
        {
            title: 'REGISTRATIONS',
            key: 'registrations',
            items: [
                { label: 'All Registrations', href: '/hho/all-registrations', icon: Users, exact: true },
                { label: 'Pending Approvals', href: '/hho/pending-approvals', icon: Clock },
                { label: 'Confirmed', href: '/hho/confirmed-registrations', icon: CheckCircle2 },
                { label: 'Waitlist Management', href: '/hho/waitlist', icon: Clock }
            ]
        },
        {
            title: 'BRANDING ASSETS',
            key: 'branding',
            items: [
                { label: 'Promo Video & Logo', href: '/hho/branding', icon: Video }
            ]
        },
        {
            title: 'GALLERY MANAGEMENT',
            key: 'gallery',
            items: [
                { label: 'All Albums', href: '/hho/gallery', icon: IconImage }
            ]
        },
        {
            title: 'UPDATES & ANNOUNCEMENTS',
            key: 'updates',
            items: [
                { label: 'All Updates', href: '/hho/updates', icon: Megaphone, exact: true },
                { label: 'Event Winners', href: '/hho/updates/winners', icon: Trophy },
                { label: 'Certificates', href: '/hho/updates/certificates', icon: Medal }
            ]
        },
        {
            title: 'SETTINGS',
            key: 'settings',
            items: [
                { label: 'Admin Profile', href: '/hho/profile', icon: User }
            ]
        },
        {
            title: 'HELP & SUPPORT',
            key: 'support',
            items: [
                { label: 'Documentation', href: '/hho/documentation', icon: BookOpen },
                { label: 'Contact Us', href: '/hho/contact', icon: MessageCircle },
                { label: 'FAQ', href: '/hho/faq', icon: HelpCircle }
            ]
        }
    ],

    SPORTS_ADMIN: [
        {
            title: 'DASHBOARD',
            items: [
                { label: 'Overview', href: '/sports', icon: LayoutDashboard, exact: true }
            ]
        },
        {
            title: 'SPORTS MANAGEMENT',
            key: 'sports-mgmt',
            items: [
                { label: 'All Sports', href: '/sports/all-sports', icon: Layout },
                { label: 'Add New Sport', href: '/sports/add-sport', icon: PlusCircle }
            ]
        },
        {
            title: 'REGISTRATIONS',
            key: 'registrations',
            items: [
                { label: 'All Registrations', href: '/sports/all-registrations', icon: Users }
            ]
        },
        {
            title: 'TOURNAMENT MANAGEMENT',
            key: 'tournament',
            items: [
                { label: 'Polls & Fixtures', href: '/sports/polls-fixtures', icon: Trophy },
                { label: 'Match Schedule', href: '/sports/match-schedule', icon: Calendar },
                { label: 'Match Results', href: '/sports/match-results', icon: ClipboardCheck }
            ]
        },
        {
            title: 'RESULTS & AWARDS',
            key: 'results',
            items: [
                { label: 'Generate Certificates', href: '/sports/generate-certificates', icon: IconImage }
            ]
        },
        {
            title: 'OVERALL CHAMPIONSHIP',
            key: 'championship',
            items: [
                { label: 'Points Table', href: '/sports/points-table', icon: Table }
            ]
        },
        {
            title: 'BRANDING ASSETS',
            key: 'branding',
            items: [
                { label: 'Brand Logos', href: '/sports/branch-logos', icon: IconImage },
                { label: 'Promo Videos', href: '/sports/branding-assets', icon: IconImage }
            ]
        },
        {
            title: 'GALLERY MANAGEMENT',
            key: 'gallery',
            items: [
                { label: 'All Albums', href: '/sports/all-albums', icon: IconImage }
            ]
        },
        {
            title: 'UPDATES & ANNOUNCEMENTS',
            key: 'updates',
            items: [
                { label: 'All Updates', href: '/sports/all-updates', icon: Megaphone }
            ]
        },
        {
            title: 'SETTINGS',
            key: 'settings',
            items: [
                { label: 'Admin Profile', href: '/sports/admin-profile', icon: User }
            ]
        },
        {
            title: 'HELP & SUPPORT',
            key: 'support',
            items: [
                { label: 'Documentation', href: '/sports/documentation', icon: BookOpen },
                { label: 'Contact Us', href: '/sports/contact', icon: MessageCircle },
                { label: 'FAQs', href: '/sports/faq', icon: HelpCircle }
            ]
        }
    ],
    BRANCH_SPORTS_ADMIN: [
        {
            title: 'DASHBOARD',
            items: [
                { label: 'Overview', href: '/sports', icon: LayoutDashboard, exact: true }
            ]
        },
        {
            title: 'SPORTS MANAGEMENT',
            key: 'sports-mgmt',
            items: [
                { label: 'All Sports', href: '/sports/all-sports', icon: Layout }
            ]
        },
        {
            title: 'REGISTRATIONS',
            key: 'registrations',
            items: [
                { label: 'All Registrations', href: '/sports/all-registrations', icon: Users }
            ]
        },
        {
            title: 'TOURNAMENT MANAGEMENT',
            key: 'tournament',
            items: [
                { label: 'Polls & Fixtures', href: '/sports/polls-fixtures', icon: Trophy },
                { label: 'Match Schedule', href: '/sports/match-schedule', icon: Calendar },
                { label: 'Match Results', href: '/sports/match-results', icon: ClipboardCheck }
            ]
        },
        {
            title: 'OVERALL CHAMPIONSHIP',
            key: 'championship',
            items: [
                { label: 'Points Table', href: '/sports/points-table', icon: Table }
            ]
        },
        {
            title: 'BRANDING ASSETS',
            key: 'branding',
            items: [
                { label: 'Brand Logos', href: '/sports/branch-logos', icon: IconImage },
                { label: 'Promo Videos', href: '/sports/branding-assets', icon: IconImage }
            ]
        },
        {
            title: 'GALLERY MANAGEMENT',
            key: 'gallery',
            items: [
                { label: 'All Albums', href: '/sports/all-albums', icon: IconImage }
            ]
        },
        {
            title: 'UPDATES & ANNOUNCEMENTS',
            key: 'updates',
            items: [
                { label: 'All Updates', href: '/sports/all-updates', icon: Megaphone }
            ]
        },
        {
            title: 'SETTINGS',
            key: 'settings',
            items: [
                { label: 'Admin Profile', href: '/sports/admin-profile', icon: User }
            ]
        },
        {
            title: 'HELP & SUPPORT',
            key: 'support',
            items: [
                { label: 'Documentation', href: '/sports/documentation', icon: BookOpen },
                { label: 'Contact Us', href: '/sports/contact', icon: MessageCircle },
                { label: 'FAQs', href: '/sports/faq', icon: HelpCircle }
            ]
        }
    ],

    CLUB_COORDINATOR: [
        {
            title: 'DASHBOARD',
            items: [
                { label: 'Overview', href: '/clubs-portal', icon: LayoutDashboard, exact: true }
            ]
        },
        {
            title: 'EVENTS MANAGEMENT',
            key: 'events',
            items: [
                { label: 'All Events', href: '/clubs-portal/events', icon: Calendar, exact: true },
                { label: 'Add New Event', href: '/clubs-portal/events/create', icon: CalendarPlus },
                { label: 'Event Analytics', href: '/clubs-portal/events/analytics', icon: Target },
                { label: 'Live Attendance', href: '/clubs-portal/live-attendance', icon: ClipboardCheck },
                { label: 'Coordinator Management', href: '/clubs-portal/coordinators', icon: Users }
            ]
        },
        {
            title: 'REGISTRATIONS',
            key: 'registrations',
            items: [
                { label: 'All Registrations', href: '/clubs-portal/registrations', icon: Users, exact: true },
                { label: 'Pending Approvals', href: '/clubs-portal/registrations/pending', icon: Clock },
                { label: 'Confirmed', href: '/clubs-portal/registrations/confirmed', icon: CheckCircle },
                { label: 'Waitlist Management', href: '/clubs-portal/registrations/waitlist', icon: List }
            ]
        },
        {
            title: 'CONTENT MANAGEMENT',
            key: 'content',
            items: [
                { label: 'Promo Video & Logo', href: '/clubs-portal/content/promo-video', icon: Video },
                { label: 'Gallery Management', href: '/clubs-portal/content/gallery', icon: IconImage },
                { label: 'Updates & Announcements', href: '/clubs-portal/content/announcements', icon: Megaphone },
                { label: 'Winners Announcement', href: '/clubs-portal/content/winners', icon: Trophy },
                { label: 'Certificates', href: '/clubs-portal/content/certificates', icon: Medal }
            ]
        },
        {
            title: 'CLUBS SCHEDULE',
            key: 'schedule',
            items: [
                { label: 'Event Calendar', href: '/clubs-portal/schedule/calendar', icon: CalendarDays },
                { label: 'Timeline/Roadmap', href: '/clubs-portal/schedule/timeline', icon: Map }
            ]
        },
        {
            title: 'SETTINGS',
            key: 'settings',
            items: [
                { label: 'Admin Profile', href: '/clubs-portal/settings/profile', icon: User }
            ]
        },
        {
            title: 'HELP & SUPPORT',
            key: 'support',
            items: [
                { label: 'Documentation', href: '/clubs-portal/support/documentation', icon: BookOpen },
                { label: 'Contact Us', href: '/clubs-portal/support/contact', icon: MessageCircle },
                { label: 'FAQs', href: '/clubs-portal/support/faq', icon: HelpCircle }
            ]
        }
    ],

    EVENT_COORDINATOR: [
        {
            title: 'DASHBOARD',
            items: [
                { label: 'Overview', href: '/coordinator', icon: LayoutDashboard, exact: true }
            ]
        },
        {
            title: 'HELP & SUPPORT',
            key: 'support',
            items: [
                { label: 'Documentation', href: '/coordinator/support/docs', icon: BookOpen },
                { label: 'Contact Support', href: '/coordinator/support/contact', icon: MessageCircle }
            ]
        }
    ],
};
