import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  ANDROID_APK_FILENAME,
  ANDROID_APK_URL,
  androidDownloadHiddenThisSession,
  hideAndroidDownloadForSession,
  isAndroidDownloadUa,
  isStandaloneDisplay,
} from "../lib/androidApp";

/**
 * Website-only APK strip (Android). Hidden in standalone / TWA.
 * Dismiss lasts for this browser session.
 */
export function DownloadAppBanner() {
  const [hidden, setHidden] = useState(true);
  const [steps, setSteps] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (isStandaloneDisplay() || !isAndroidDownloadUa(navigator.userAgent)) {
        setHidden(true);
        return;
      }
      setHidden(androidDownloadHiddenThisSession());
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  if (hidden) return null;

  const dismiss = () => {
    hideAndroidDownloadForSession();
    setHidden(true);
  };

  return (
    <section
      className="border-b border-[color:var(--uniz-border,#e2e8f0)] bg-[color:var(--uniz-surface,#f8fafc)] lg:hidden"
      aria-label="Download uniZ for Android"
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <span
          className="h-7 w-7 shrink-0 rounded-md bg-cover bg-center"
          style={{ backgroundImage: "url(/logo.png)" }}
          aria-hidden
        />
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-[color:var(--uniz-ink,#0a2540)]">
          uniZ for Android
        </p>
        <a
          href={ANDROID_APK_URL}
          download={ANDROID_APK_FILENAME}
          className="inline-flex h-8 shrink-0 items-center rounded-lg bg-[color:var(--uniz-maroon,#0a2540)] px-2.5 text-xs font-bold text-white"
        >
          Download
        </a>
        <button
          type="button"
          className="h-8 shrink-0 px-1 text-xs font-semibold text-[color:var(--uniz-ink,#0a2540)] underline"
          onClick={() => setSteps((open) => !open)}
          aria-expanded={steps}
        >
          Steps
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="flex h-8 w-8 shrink-0 items-center justify-center text-slate-500"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
      {steps ? (
        <ol className="list-decimal space-y-1 px-4 pb-2 pl-8 text-xs leading-snug text-slate-700">
          <li>Tap Download and save the APK.</li>
          <li>Open the file from notifications or Downloads.</li>
          <li>Allow install from this source if Android asks.</li>
          <li>Tap Install — the app opens the live campus portal.</li>
        </ol>
      ) : null}
    </section>
  );
}
