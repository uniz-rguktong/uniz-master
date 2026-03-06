// Category colors mapping - comprehensive premium palette
export const CATEGORY_COLORS: Record<string, string> = {
    // Exact matches from UI/Screenshot
    'Esports': '#FF4D4D',      // Vibrant Red
    'Cultural': '#D946EF',     // Fuchsia
    'Business': '#0EA5E9',     // Sky Blue
    'Busines': '#0EA5E9',      // Typo from screenshot
    'Competition': '#F59E0B',  // Amber/Gold
    'Hackathon': '#10B981',    // Emerald Green
    'Seminar': '#6366F1',      // Indigo
    'Workshop': '#8B5CF6',     // Violet/Purple
    'Technical': '#3B82F6',    // Bright Blue

    // Plurals and Others
    'Workshops': '#8B5CF6',
    'Hackathons': '#10B981',
    'Quizzes': '#F97316',      // Orange
    'Fun Games': '#22C55E',    // Green
    'Sports': '#06B6D4',       // Cyan
    'Seminars': '#6366F1',
    'Competitions': '#F59E0B',
    'Webinars': '#14B8A6',     // Teal
    'Important': '#EF4444',    // Red
    'Events': '#3B82F6',
    'Updates': '#F59E0B',
    'Information': '#10B981',
    'Other': '#64748B',        // Slate
};

// Premium fallback palette for dynamic color generation
export const COLOR_PALETTE = [
    '#FF4D4D', '#D946EF', '#0EA5E9', '#F59E0B',
    '#10B981', '#6366F1', '#8B5CF6', '#3B82F6',
    '#F97316', '#22C55E', '#06B6D4', '#14B8A6'
];

/**
 * Get a color for a category, with fallback
 */
export function getCategoryColor(category: string | null | undefined): string {
    if (!category) return CATEGORY_COLORS['Other'] || '#64748B';

    const cat = category.trim();

    // 1. Exact match
    if (CATEGORY_COLORS[cat]) return CATEGORY_COLORS[cat];

    // 2. Case-insensitive match
    const lowerCategory = cat.toLowerCase();
    for (const [key, value] of Object.entries(CATEGORY_COLORS)) {
        if (key.toLowerCase() === lowerCategory) return value;
    }

    // 3. Handle Plurals (very basic)
    const singular = cat.endsWith('s') ? cat.slice(0, -1) : cat;
    const plural = cat + 's';

    if (CATEGORY_COLORS[singular]) return CATEGORY_COLORS[singular];

    // Check plural case-insensitively
    for (const [key, value] of Object.entries(CATEGORY_COLORS)) {
        const lowerKey = key.toLowerCase();
        if (lowerKey === singular.toLowerCase() || lowerKey === plural.toLowerCase()) return value;
    }

    // 4. Generate a consistent color based on category string hash
    let hash = 0;
    for (let i = 0; i < cat.length; i++) {
        hash = cat.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % COLOR_PALETTE.length);
    return COLOR_PALETTE[index]!;
}

/**
 * Map DB RegistrationStatus to UI display string
 */
export const REGISTRATION_STATUS_UI: Record<string, string> = {
    'CONFIRMED': 'Success',
    'ATTENDED': 'Success',
    'PENDING': 'Pending',
    'CANCELLED': 'Cancelled',
    'REJECTED': 'Cancelled',
    'WAITLISTED': 'Waitlist'
};

export function mapRegistrationStatus(status: string): string {
    return REGISTRATION_STATUS_UI[status] || status;
}

/**
 * Get Event Status based on date
 */
export function getEventStatus(date: Date | string): string {
    return new Date(date) > new Date() ? 'UPCOMING' : 'COMPLETED';
}
