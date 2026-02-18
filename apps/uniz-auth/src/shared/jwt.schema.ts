import { z } from "zod";
import { UserRole } from "./roles.enum";

export const JwtPayloadSchema = z.object({
  id: z.string().optional(),
  username: z.string(),
  role: z.nativeEnum(UserRole).or(z.string()),
  iat: z.number().optional(),
  exp: z.number().optional(),
  jti: z.string().optional(),
});

export type JwtPayload = z.infer<typeof JwtPayloadSchema>;
