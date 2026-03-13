import { z } from 'zod';

export const teamSizeSchema = z.object({
    min: z.coerce.number().min(1, 'Team minimum size must be at least 1'),
    max: z.coerce.number().min(2, 'Team maximum size must be greater than 1'),
}).refine(data => data.max >= data.min, {
    message: "Maximum size must be greater than or equal to minimum size",
    path: ["max"]
});

export const coordinatorSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().regex(/^[0-9]{10}$/, '10-digit phone number is required'),
    isPrimary: z.boolean().optional()
});

export const eventSchema = z.object({
    eventName: z.string().min(3, 'Event name must be at least 3 characters'),
    category: z.string().min(1, 'Category is required'),
    subCategory: z.string().optional(),
    eventType: z.string().min(1, 'Participation type is required'),
    hasPrizes: z.boolean(),
    shortDescription: z.string().min(10, 'Short description must be at least 10 characters').max(200, 'Max 200 characters'),
    detailedDescription: z.string().optional(),

    // Team Size
    teamSize: z.object({
        min: z.coerce.number().min(1).optional().default(1),
        max: z.coerce.number().min(1).optional().default(1),
    }).optional(),

    // Info Step
    locationType: z.enum(['physical', 'online', 'hybrid']),
    venue: z.string().min(1, 'Venue name is required'),
    capacity: z.preprocess(
        (val) => {
            if (val === '' || val === null || val === undefined) return 0;
            const parsed = Number(val);
            return isNaN(parsed) ? 0 : parsed;
        },
        z.number().min(0, 'Capacity must be 0 (unlimited) or more')
    ),
    startDate: z.string().min(1, 'Start date is required'),
    startTime: z.string().min(1, 'Start time is required'),
    endDate: z.string().min(1, 'End date is required'),
    endTime: z.string().min(1, 'End time is required'),
    coordinators: z.array(coordinatorSchema),
    rules: z.string().min(10, 'Rules must be at least 10 characters'),

    // Registration Step
    registrationStatus: z.enum(['open', 'closed', 'paused', 'coming-soon', 'invitation']),
    maxParticipants: z.preprocess(
        (val) => {
            if (val === '' || val === null || val === undefined) return undefined;
            const parsed = Number(val);
            return isNaN(parsed) ? undefined : parsed;
        },
        z.number().min(1, 'Maximum participants must be at least 1').optional()
    ),
    minParticipants: z.preprocess(
        (val) => {
            if (val === '' || val === null || val === undefined) return undefined;
            const parsed = Number(val);
            return isNaN(parsed) ? undefined : parsed;
        },
        z.number().min(1, 'Minimum participants must be at least 1').optional()
    ),
    waitlistEnabled: z.boolean(),
    isPaid: z.boolean(),
    fee: z.preprocess(
        (val) => {
            if (val === '' || val === null || val === undefined) return 0;
            const parsed = Number(val);
            return isNaN(parsed) ? 0 : parsed;
        },
        z.number().min(0, 'Fee cannot be negative')
    ),
    paymentGateway: z.string().optional()
}).refine(data => {
    // Validate team size only if it's a team event
    if (data.eventType.toLowerCase().includes('team')) {
        const min = Number(data.teamSize?.min || 0);
        const max = Number(data.teamSize?.max || 0);
        if (min < 1 || max < 1 || max < min) return false;
    }
    return true;
}, {
    message: "Invalid team size settings",
    path: ["teamSize"]
}).refine(data => {
    // Validate coordinators except for Sports
    const isSports = String(data.category || '').trim().toLowerCase() === 'sports';
    if (!isSports && (!data.coordinators || data.coordinators.length === 0)) {
        return false;
    }
    return true;
}, {
    message: "At least one event coordinator is required",
    path: ["coordinators"]
}).refine(data => {
    if (data.startDate && data.endDate) {
        if (data.startDate === data.endDate) {
            // Lexical comparison works for 24h format "HH:mm"
            return data.startTime < data.endTime;
        }
        return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
}, {
    message: "End date/time must be after start date/time",
    path: ["endTime"]
});
