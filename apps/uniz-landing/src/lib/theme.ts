import { useEffect, useState } from "react";

const KEY = "uniz-landing-theme";

export type ThemePref = "light" | "dark" | "system";

export function readThemePref(): ThemePref {
  try {
    const value = localStorage.getItem(KEY);
    if (value === "light" || value === "dark" || value === "system") return value;
  } catch {
    /* storage can be blocked */
  }
  return "system";
}

export function applyThemePref(pref: ThemePref) {
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = pref === "dark" || (pref === "system" && systemDark);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  return dark;
}

export function writeThemePref(pref: ThemePref) {
  try {
    localStorage.setItem(KEY, pref);
  } catch {
    /* storage can be blocked */
  }
  return applyThemePref(pref);
}

export function useTheme() {
  const [dark, setDark] = useState(() => applyThemePref(readThemePref()));

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (readThemePref() === "system") setDark(applyThemePref("system"));
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const toggle = () => {
    setDark(writeThemePref(dark ? "light" : "dark"));
  };

  return { dark, toggle };
}
