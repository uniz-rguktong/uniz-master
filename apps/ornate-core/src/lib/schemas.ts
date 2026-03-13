import { z } from 'zod';

export const EventSchema = z.object({
    // Basic Info
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().optional().default(""),
    shortDescription: z.string().optional().nullable(),
    category: z.string().optional().default("General"),

    // Event Type & Team
    eventType: z.string().optional().nullable(),
    teamSizeMin: z.coerce.number().optional().nullable(),
    teamSizeMax: z.coerce.number().optional().nullable(),

    // Location
    locationType: z.enum(["physical", "online", "hybrid"]).default("physical"),
    venue: z.string().optional().default("TBD"),

    // Date & Time
    date: z.coerce.date(), // Marking required to align with DB schema.
    startTime: z.string().optional().nullable(),
    endTime: z.string().optional().nullable(),
    endDate: z.coerce.date().optional().nullable(),

    // Registration
    registrationOpen: z.boolean().default(true),
    maxCapacity: z.coerce.number().int().positive().optional().nullable(),
    minParticipants: z.coerce.number().int().positive().optional().nullable(),
    waitlistEnabled: z.boolean().default(false), // Boolean from checkbox usually needs manual handling if not "true" string, but here we handled it in action

    // Fee
    fee: z.string().optional().default("Free"), // Display string
    price: z.coerce.number().min(0).default(0),      // Numeric value

    // Media
    posterUrl: z.string().url().optional().or(z.literal("")),

    // JSON Fields (validated as objects/arrays)
    coordinatorIds: z.array(z.string()).optional().nullable(), // M2M relation - array of Admin IDs
    eligibility: z.any().optional().nullable(),
    customFields: z.any().optional().nullable(), // flexible to allow object or array
    documents: z.array(z.any()).optional().nullable(),
    additionalImages: z.array(z.string()).optional().default([]),
    prizes: z.array(z.any()).optional().nullable(),
    rules: z.string().optional().nullable(),
    status: z.string().optional().default("Draft"),
    paymentGateway: z.string().optional().default("All Methods"),
});

export const RegistrationSchema = z.object({
    studentName: z.string().min(1, "Name is required"),
    studentId: z.string().min(1, "Student ID is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),

    eventId: z.string().cuid(),
    userId: z.string().cuid().optional(), // If logged in

    teamId: z.string().cuid().optional(), // If joining a team
});

export type EventData = z.infer<typeof EventSchema>;
export type RegistrationData = z.infer<typeof RegistrationSchema>;
