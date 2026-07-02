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

/** Flush all cached student profile/bootstrap entries after bulk presence updates. */
export async function invalidateAllStudentProfileCaches(): Promise<number> {
  const patterns = ["profile:v2:*", "bootstrap:v1:*"];
  let deleted = 0;

  for (const pattern of patterns) {
    let cursor = "0";
    do {
      const [next, keys] = await redis.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        500,
      );
      cursor = next;
      if (keys.length > 0) {
        deleted += await redis.del(...keys);
      }
    } while (cursor !== "0");
  }

  return deleted;
}
