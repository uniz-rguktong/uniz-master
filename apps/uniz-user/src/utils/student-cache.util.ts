import { redis } from "./redis.util";

export function profileCacheKey(username: string): string {
  return `profile:v2:${username.toUpperCase()}`;
}

/** Per-student bootstrap aggregate — keyed by username (unique per student). */
export function bootstrapCacheKey(username: string): string {
  return `bootstrap:v1:${username.toUpperCase()}`;
}

export async function invalidateStudentProfileCaches(
  username: string,
): Promise<void> {
  const id = username.toUpperCase();
  await redis.del(profileCacheKey(id), bootstrapCacheKey(id));
}
