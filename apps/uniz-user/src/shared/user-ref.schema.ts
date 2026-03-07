import { z } from "zod";

export const UserReferenceSchema = z.object({
  userId: z.string(),
  username: z.string(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  role: z.string().optional(),
});

export type UserReference = z.infer<typeof UserReferenceSchema>;
