/**
 * Shared localStorage cache for academic data (grades & attendance).
 * Keys are scoped per student username; entries include an owner field.
 */
import { getActiveStudentUsername } from "./studentSessionCache";

const CACHE_TTL_MS = 30 * 60 * 1000;

type CacheType = "grades" | "attendance";

function buildKey(
  type: CacheType,
  userId: string,
  year: string,
  semester: string,
): string {
  return `uniz_academic_${type}_${userId.toUpperCase()}_${year}_${semester}`;
}

export interface CacheEntry<T> {
  owner: string;
  data: T;
  timestamp: number;
}

function assertOwner(userId: string): string | null {
  const active = getActiveStudentUsername();
  const expected = userId.toUpperCase();
  if (!active || active !== expected) return null;
  return active;
}

export function writeAcademicCache<T>(
  type: CacheType,
  userId: string,
  year: string,
  semester: string,
  data: T,
): void {
  const owner = assertOwner(userId);
  if (!owner) return;
  try {
    const entry: CacheEntry<T> = {
      owner,
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(
      buildKey(type, owner, year, semester),
      JSON.stringify(entry),
    );
  } catch {
    /* quota */
  }
}

export function readAcademicCache<T>(
  type: CacheType,
  userId: string,
  year: string,
  semester: string,
  allowStale = false,
): T | null {
  const owner = assertOwner(userId);
  if (!owner) return null;
  try {
    const raw = localStorage.getItem(buildKey(type, owner, year, semester));
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (entry.owner !== owner) {
      localStorage.removeItem(buildKey(type, owner, year, semester));
      return null;
    }
    if (!allowStale && Date.now() - entry.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(buildKey(type, owner, year, semester));
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function isCacheStale(
  type: CacheType,
  userId: string,
  year: string,
  semester: string,
): boolean {
  const owner = assertOwner(userId);
  if (!owner) return true;
  try {
    const raw = localStorage.getItem(buildKey(type, owner, year, semester));
    if (!raw) return true;
    const entry = JSON.parse(raw) as CacheEntry<unknown>;
    if (entry.owner !== owner) return true;
    return Date.now() - entry.timestamp > CACHE_TTL_MS;
  } catch {
    return true;
  }
}

export function clearAcademicCache(userId: string): void {
  const id = userId.toUpperCase();
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("uniz_academic_") && key.includes(`_${id}_`)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

/** Seed grades/attendance tab caches from bootstrap payload. */
export function seedAcademicCachesFromBootstrap(
  username: string,
  year: string,
  grades: unknown,
  attendance: unknown,
): void {
  if (grades) {
    writeAcademicCache("grades", username, year, "Sem 1", grades);
  }
  if (attendance) {
    writeAcademicCache("attendance", username, year, "Sem 1", attendance);
  }
}
