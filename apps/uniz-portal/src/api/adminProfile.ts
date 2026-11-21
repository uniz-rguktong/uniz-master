import { useEffect, useState } from "react";
import { BASE_URL } from "./endpoints";

export type AdminProfile = {
  name?: string;
  email?: string;
  contact?: string;
  designation?: string;
  department?: string;
  role?: string;
  profile_url?: string;
};

let cached: AdminProfile | null = null;
let inflight: Promise<AdminProfile | null> | null = null;
const listeners = new Set<(profile: AdminProfile | null) => void>();

function authToken() {
  return (localStorage.getItem("admin_token") || "").replace(/"/g, "");
}

function publish(profile: AdminProfile | null) {
  cached = profile;
  listeners.forEach((listener) => listener(profile));
}

export function subscribeAdminProfile(
  listener: (profile: AdminProfile | null) => void,
) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Merge a profile written by the editor so the shell and overview stay in sync. */
export function rememberAdminProfile(next: AdminProfile) {
  publish({ ...(cached || {}), ...next });
}

/** One in-flight GET /profile/admin/me shared by the shell and the overview. */
export function fetchAdminProfile(force = false): Promise<AdminProfile | null> {
  if (!force && cached) return Promise.resolve(cached);
  if (!force && inflight) return inflight;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  inflight = fetch(`${BASE_URL}/profile/admin/me`, {
    headers: { Authorization: `Bearer ${authToken()}` },
    signal: controller.signal,
  })
    .then((res) => res.json())
    .then((data) => {
      if (data?.success && data.data) {
        publish(data.data);
        return data.data as AdminProfile;
      }
      return cached;
    })
    .catch(() => cached)
    .finally(() => {
      clearTimeout(timer);
      inflight = null;
    });
  return inflight;
}

export function useAdminProfile() {
  const [profile, setProfile] = useState<AdminProfile | null>(cached);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState(false);

  useEffect(() => {
    let live = true;
    if (!cached) setLoading(true);
    fetchAdminProfile()
      .then((next) => {
        if (!live) return;
        setProfile(next);
        setError(!next);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    const unsubscribe = subscribeAdminProfile((next) => {
      if (!live) return;
      setProfile(next);
      setError(!next);
      setLoading(false);
    });
    return () => {
      live = false;
      unsubscribe();
    };
  }, []);

  return {
    profile,
    loading,
    error,
    refresh: () => fetchAdminProfile(true),
  };
}
