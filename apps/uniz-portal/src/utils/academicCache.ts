/**
 * academicCache.ts
 * ─────────────────────────────────────────────────────────────────
 * Shared localStorage cache for academic data (grades & attendance).
 *
 * Cache key format: uniz_academic_{type}_{userId}_{year}_{semester}
 * TTL: 30 minutes — data is stale-while-revalidate after this.
 * ─────────────────────────────────────────────────────────────────
 */

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

type CacheType = "grades" | "attendance";

function buildKey(type: CacheType, userId: string, year: string, semester: string): string {
  return `uniz_academic_${type}_${userId}_${year}_${semester}`;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/** Write a result to cache */
export function writeAcademicCache<T>(
  type: CacheType,
  userId: string,
  year: string,
  semester: string,
  data: T,
): void {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    localStorage.setItem(buildKey(type, userId, year, semester), JSON.stringify(entry));
  } catch {
    // Quota exceeded — silently skip
  }
}

/** Read a result from cache. Returns null if missing or expired. */
export function readAcademicCache<T>(
  type: CacheType,
  userId: string,
  year: string,
  semester: string,
  allowStale = false,
): T | null {
  try {
    const raw = localStorage.getItem(buildKey(type, userId, year, semester));
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (!allowStale && Date.now() - entry.timestamp > CACHE_TTL_MS) {
      // Expired — remove it
      localStorage.removeItem(buildKey(type, userId, year, semester));
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

/** Check if a cache entry is stale (older than TTL) without removing it */
export function isCacheStale(
  type: CacheType,
  userId: string,
  year: string,
  semester: string,
): boolean {
  try {
    const raw = localStorage.getItem(buildKey(type, userId, year, semester));
    if (!raw) return true;
    const entry: CacheEntry<unknown> = JSON.parse(raw);
    return Date.now() - entry.timestamp > CACHE_TTL_MS;
  } catch {
    return true;
  }
}

/** Clear all academic cache entries for a specific user */
export function clearAcademicCache(userId: string): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`uniz_academic_`) && key.includes(userId)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}
