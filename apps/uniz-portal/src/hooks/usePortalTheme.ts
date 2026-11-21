import { useCallback, useEffect, useState } from "react";

/** Persisted appearance. `system` follows prefers-color-scheme. */
export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "uniz-theme";

function readStoredPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "light" || value === "dark" || value === "system") return value;
  } catch {
    /* storage unavailable */
  }
  return "system";
}

function systemIsDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolveTheme(preference: ThemePreference): "light" | "dark" {
  if (preference === "system") return systemIsDark() ? "dark" : "light";
  return preference;
}

export function applyThemePreference(preference: ThemePreference) {
  const dark = resolveTheme(preference) === "dark";
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

let preference: ThemePreference =
  typeof window === "undefined" ? "system" : readStoredPreference();
const listeners = new Set<() => void>();

function commitPreference(next: ThemePreference) {
  preference = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* storage unavailable */
  }
  applyThemePreference(next);
  listeners.forEach((listener) => listener());
}

/**
 * Applies `.dark` on `<html>` from the shared light / dark / system preference.
 * Call once near the router root. Every caller shares the same preference.
 */
export function usePortalTheme() {
  const [current, setCurrent] = useState<ThemePreference>(preference);

  useEffect(() => {
    const sync = () => setCurrent(preference);
    listeners.add(sync);
    applyThemePreference(preference);
    return () => {
      listeners.delete(sync);
    };
  }, []);

  useEffect(() => {
    if (current !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyThemePreference("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [current]);

  const setPreference = useCallback((next: ThemePreference) => {
    commitPreference(next);
  }, []);

  return {
    preference: current,
    resolved: resolveTheme(current),
    setPreference,
  };
}
