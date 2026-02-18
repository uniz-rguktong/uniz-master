import { z } from "zod";
import {
  ApprovalLogsSchema,
  ApprovalLogEntrySchema,
  ApprovalLogEntry,
} from "./approval-log.schema";
export { ApprovalLogsSchema, ApprovalLogEntrySchema, ApprovalLogEntry };

export const OutpassRequestSchema = z.object({
  userId: z.string().optional(), // Optional, extracted from JWT
  reason: z.string().min(3),
  fromDay: z.string().datetime(),
  toDay: z.string().datetime(),
});

export const OutpassResponseSchema = z.object({
  id: z.string().uuid(),
  studentId: z.string(),
  reason: z.string(),
  fromDay: z.string().datetime(),
  toDay: z.string().datetime(),
  days: z.number().default(0),
  requestedTime: z.string().datetime(),
  isExpired: z.boolean().default(false),
  isApproved: z.boolean().default(false),
  issuedBy: z.string().default("none"),
  issuedTime: z.string().datetime(),
  message: z.string().nullable().optional(),
  isRejected: z.boolean().default(false),
  rejectedBy: z.string().default("none"),
  rejectedTime: z.string().datetime(),
  inTime: z.string().datetime(),
  currentLevel: z.string().default("caretaker"),
  approvalLogs: ApprovalLogsSchema.optional().nullable(),
});

export const OutingRequestSchema = z.object({
  userId: z.string().optional(),
  reason: z.string().min(3),
  fromTime: z.string().datetime(),
  toTime: z.string().datetime(),
});

export const OutingResponseSchema = z.object({
  id: z.string().uuid(),
  studentId: z.string(),
  reason: z.string(),
  fromTime: z.string().datetime(),
  toTime: z.string().datetime(),
  hours: z.number().default(0),
  requestedTime: z.string().datetime(),
  isExpired: z.boolean().default(false),
  isApproved: z.boolean().default(false),
  issuedBy: z.string().default("none"),
  issuedTime: z.string().datetime(),
  message: z.string().nullable().optional(),
  isRejected: z.boolean().default(false),
  rejectedBy: z.string().default("none"),
  rejectedTime: z.string().datetime(),
  inTime: z.string().datetime(),
  currentLevel: z.string().default("caretaker"),
  approvalLogs: ApprovalLogsSchema.optional().nullable(),
});

export type OutpassRequest = z.infer<typeof OutpassRequestSchema>;
export type OutpassResponse = z.infer<typeof OutpassResponseSchema>;
export type OutingRequest = z.infer<typeof OutingRequestSchema>;
export type OutingResponse = z.infer<typeof OutingResponseSchema>;
