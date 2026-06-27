/**
 * Per-student localStorage cache — prevents cross-account data leaks on shared devices.
 * Every entry stores `owner` (uppercase username from JWT) and is rejected if it
 * does not match the active session.
 */
import { getStoredAuthToken, parseJwt } from "./security";

export const SESSION_CACHE_VERSION = "v3";
const LEGACY_PROFILE_KEY = "uniz_student_cache";
const PROFILE_PREFIX = `uniz_${SESSION_CACHE_VERSION}_profile_`;
const BOOTSTRAP_PREFIX = `uniz_${SESSION_CACHE_VERSION}_bootstrap_`;
const ACADEMIC_PREFIX = "uniz_academic_";

export const PROFILE_TTL_MS = 5 * 60 * 1000;
export const BOOTSTRAP_TTL_MS = 2 * 60 * 1000;

export interface ScopedCacheEntry<T> {
  owner: string;
  data: T;
  timestamp: number;
}

export function getActiveStudentUsername(): string | null {
  const token = getStoredAuthToken();
  if (!token) return null;
  const decoded = parseJwt(token);
  if (!decoded?.username || decoded.role !== "student") return null;
  return decoded.username.toUpperCase();
}

function profileKey(username: string): string {
  return `${PROFILE_PREFIX}${username}`;
}

function bootstrapKey(username: string): string {
  return `${BOOTSTRAP_PREFIX}${username}`;
}

export function readScopedCache<T>(
  key: string,
  owner: string,
  ttlMs: number,
  allowStale = false,
): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as ScopedCacheEntry<T>;
    if (entry.owner !== owner) {
      localStorage.removeItem(key);
      return null;
    }
    if (!allowStale && Date.now() - entry.timestamp > ttlMs) {
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function writeScopedCache<T>(
  key: string,
  owner: string,
  data: T,
): void {
  try {
    const entry: ScopedCacheEntry<T> = {
      owner,
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    /* quota */
  }
}

export function readProfileCache(owner: string, allowStale = false) {
  return readScopedCache<any>(profileKey(owner), owner, PROFILE_TTL_MS, allowStale);
}

export function writeProfileCache(owner: string, data: unknown) {
  writeScopedCache(profileKey(owner), owner, data);
}

export interface BootstrapCachePayload {
  student: Record<string, unknown>;
  grades?: unknown;
  attendance?: unknown;
}

export function readBootstrapCache(
  owner: string,
  allowStale = false,
): BootstrapCachePayload | null {
  return readScopedCache<BootstrapCachePayload>(
    bootstrapKey(owner),
    owner,
    BOOTSTRAP_TTL_MS,
    allowStale,
  );
}

export function writeBootstrapCache(owner: string, payload: BootstrapCachePayload) {
  writeScopedCache(bootstrapKey(owner), owner, payload);
}

/** Drop legacy global profile key and any v3 entries for other students. */
export function prepareStudentSession(username: string): void {
  const owner = username.toUpperCase();
  try {
    localStorage.removeItem(LEGACY_PROFILE_KEY);
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (
        key.startsWith(PROFILE_PREFIX) ||
        key.startsWith(BOOTSTRAP_PREFIX) ||
        key.startsWith(ACADEMIC_PREFIX)
      ) {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          const entry = JSON.parse(raw) as ScopedCacheEntry<unknown> & {
            owner?: string;
          };
          const entryOwner =
            entry.owner ||
            (key.startsWith(ACADEMIC_PREFIX)
              ? key.split("_")[3]?.toUpperCase()
              : undefined);
          if (entryOwner && entryOwner !== owner) {
            keysToRemove.push(key);
          }
        } catch {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

export function clearAllStudentSessionCaches(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key === LEGACY_PROFILE_KEY ||
          key.startsWith(PROFILE_PREFIX) ||
          key.startsWith(BOOTSTRAP_PREFIX) ||
          key.startsWith(ACADEMIC_PREFIX))
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}
