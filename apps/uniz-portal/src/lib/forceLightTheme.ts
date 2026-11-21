const STORED_THEME_KEY = "uniz-theme";

/** Light palette only. A stored "dark" or "system" choice is ignored and dropped. */
export function forceLightTheme(): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.remove("dark");
  document.documentElement.style.colorScheme = "light";
  try {
    localStorage.removeItem(STORED_THEME_KEY);
  } catch {
    /* storage unavailable */
  }
}
