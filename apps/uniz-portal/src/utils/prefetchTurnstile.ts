/** Early-load Cloudflare Turnstile so the login widget is ready sooner. */

const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export function prefetchTurnstile(): void {
  if (typeof document === "undefined") return;
  if (!import.meta.env.VITE_TURNSTILE_SITE_KEY) return;
  if (document.getElementById(SCRIPT_ID)) return;

  const existing = document.querySelector<HTMLScriptElement>(
    `script[src*="challenges.cloudflare.com/turnstile"]`,
  );
  if (existing) {
    if (!existing.id) existing.id = SCRIPT_ID;
    return;
  }

  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.src = SCRIPT_SRC;
  script.async = true;
  script.defer = true;
  script.crossOrigin = "anonymous";
  document.head.appendChild(script);
}
