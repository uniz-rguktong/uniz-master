import { z } from "zod";

export const ApprovalLogEntrySchema = z.object({
  level: z.string(), // e.g., 'caretaker', 'warden'
  approverId: z.string().optional(),
  approverName: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected", "forwarded"]),
  timestamp: z.string().datetime(), // ISO string
  comment: z.string().optional(),
});

export type ApprovalLogEntry = z.infer<typeof ApprovalLogEntrySchema>;

export const ApprovalLogsSchema = z.array(ApprovalLogEntrySchema);
