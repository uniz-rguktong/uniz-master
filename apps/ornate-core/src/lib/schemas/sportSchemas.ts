import { z } from 'zod';

export const SportSchema = z.object({
    name: z.string().min(2, 'Sport name is required'),
    gender: z.enum(['MALE', 'FEMALE', 'MIXED']),
    category: z.enum(['INDIVIDUAL', 'TEAM']).default('TEAM'),
    format: z.enum(['KNOCKOUT', 'LEAGUE', 'GROUP_KNOCKOUT']).default('KNOCKOUT'),
    description: z.string().optional().nullable(),

    winnerPoints: z.coerce.number().int().min(0).default(0),
    runnerUpPoints: z.coerce.number().int().min(0).default(0),
    participationPoints: z.coerce.number().int().min(0).default(0),
    awards: z.array(z.string()).optional().default([]),

    maxTeamsPerBranch: z.coerce.number().int().positive().optional().nullable(),
    minPlayersPerTeam: z.coerce.number().int().positive().optional().nullable(),
    maxPlayersPerTeam: z.coerce.number().int().positive().optional().nullable(),
    eligibility: z.array(z.string()).optional().default([]),
    registrationDeadline: z.coerce.date().optional().nullable(),
    rules: z.string().optional().nullable(),

    matchDuration: z.coerce.number().int().positive().optional().nullable(),

    icon: z.string().optional().nullable(),
    bannerUrl: z.string().url().optional().or(z.literal('')).nullable(),
    isActive: z.boolean().optional().default(true),
});

export const SportRegistrationSchema = z.object({
    sportId: z.string().cuid(),
    studentName: z.string().min(1, 'Student name is required'),
    studentId: z.string().min(1, 'Student ID is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    branch: z.string().optional(),
    year: z.string().optional(),
    section: z.string().optional(),
    status: z.enum(['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED']).default('PENDING'),
});

export const MatchSchema = z.object({
    sportId: z.string().cuid(),
    round: z.string().min(1, 'Round is required'),
    matchId: z.string().optional().nullable(),

    team1Id: z.string().cuid().optional().nullable(),
    team1Name: z.string().optional().nullable(),
    team2Id: z.string().cuid().optional().nullable(),
    team2Name: z.string().optional().nullable(),

    date: z.coerce.date().optional().nullable(),
    time: z.string().optional().nullable(),
    venue: z.string().optional().nullable(),

    status: z.enum(['PENDING', 'SCHEDULED', 'LIVE', 'COMPLETED']).default('PENDING'),
    score1: z.string().optional().nullable(),
    score2: z.string().optional().nullable(),
    winner: z.enum(['TEAM1', 'TEAM2', 'DRAW']).optional().nullable(),

    note: z.string().optional().nullable(),
    referee: z.string().optional().nullable(),
    matchOrder: z.coerce.number().int().min(0).default(0),
});

export type SportData = z.infer<typeof SportSchema>;
export type SportRegistrationData = z.infer<typeof SportRegistrationSchema>;
export type MatchData = z.infer<typeof MatchSchema>;
