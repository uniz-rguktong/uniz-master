import { z } from "zod";

export enum NotificationType {
  EMAIL = "EMAIL",
  SMS = "SMS", // Future
  PUSH = "PUSH", // Future
}

export const NotificationEventSchema = z.object({
  type: z.nativeEnum(NotificationType),
  recipient: z.string().email().or(z.string()), // Email or Phone/Device Token
  subject: z.string().optional(), // For Email
  body: z.string(),
  metadata: z.record(z.any()).optional(),
});

export type NotificationEvent = z.infer<typeof NotificationEventSchema>;
