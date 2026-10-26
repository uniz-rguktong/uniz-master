import { useEffect, useState } from "react";
import { X, Share, PlusSquare, Copy, Check, Download } from "lucide-react";
import {
  ANDROID_APK_FILENAME,
  ANDROID_APK_URL,
  IOS_INSTALL_URL,
  IOS_MODAL_EVENT,
  IOS_PROFILE_FILENAME,
  IOS_PROFILE_URL,
  isAndroidDownloadUa,
  isIosDeviceUa,
  isIosSafariUa,
  isStandaloneDisplay,
  openIosDownloadModal,
} from "../lib/androidApp";
import { RGUKT_CREST_URL } from "@/constants/branding";

const DISMISS_KEY = "uniz-mobile-app-banner-dismissed";

export function AndroidLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24a11.43 11.43 0 0 0-8.94 0L5.65 5.67c-.19-.28-.54-.37-.83-.22-.3.16-.42.54-.26.85l1.84 3.18C4.8 10.92 3.5 12.62 3.5 16.5h17c0-3.88-1.3-5.58-2.9-7.02zM7 14c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm10 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
    </svg>
  );
}

export function AppleLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.96 6.32c.67-.81 1.12-1.94 1-3.07-.96.04-2.13.64-2.82 1.45-.61.7-.11 1.85-.98 2.96 1.07.08 2.13-.53 2.8-1.34" />
    </svg>
  );
}

export function IosInstallModal() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSafari, setIsSafari] = useState(true);

  useEffect(() => {
    setIsSafari(isIosSafariUa(navigator.userAgent));
    const handleOpen = () => setOpen(true);
    window.addEventListener(IOS_MODAL_EVENT, handleOpen);
    return () => window.removeEventListener(IOS_MODAL_EVENT, handleOpen);
  }, []);

  if (!open) return null;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#061B33]/60 p-4 font-sans"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ios-install-title"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-[2px] border border-[#0A2540] bg-white text-[#061B33] shadow-examcell"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-[#0A2540] px-5 py-3.5 text-white">
          <div className="flex items-center gap-2.5">
            <img
              src={RGUKT_CREST_URL}
              alt="RGUKT"
              className="h-7 w-7 rounded-[2px] bg-white p-0.5 object-contain"
            />
            <div>
              <h2
                id="ios-install-title"
                className="text-[15px] font-bold tracking-[0.02em] text-white"
              >
                Download iOS App
              </h2>
              <p className="text-[11px] text-white/75">
                RGUKT Ongole Examination Cell · iPhone &amp; iPad
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-[2px] p-1 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {!isSafari && isIosDeviceUa(navigator.userAgent) && (
            <div className="rounded-[2px] border border-[#D8E0E8] bg-[#F8FAFC] p-3 text-xs text-[#0A2540]">
              <p className="font-bold">Open in Safari on iPhone / iPad</p>
              <p className="mt-0.5 text-[#3d4f63]">
                Apple requires Safari to install iOS WebClip profiles or Home Screen apps.
              </p>
            </div>
          )}

          <div className="rounded-[2px] border border-[#E4E4E4] bg-[#FAFAFA] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#5A7A94]">
              Option 1 · Direct iOS Profile
            </p>
            <p className="mt-1 text-[13px] text-[#3d4f63]">
              Install the signed Exam Cell iOS WebClip configuration profile, then approve it in{" "}
              <strong className="text-[#061B33]">Settings → Profile Downloaded</strong>.
            </p>
            <a
              href={IOS_PROFILE_URL}
              download={IOS_PROFILE_FILENAME}
              className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-[2px] bg-[#0A2540] px-4 text-[12px] font-bold uppercase tracking-[1px] text-white transition-colors hover:bg-[#021227]"
            >
              <AppleLogo className="h-3.5 w-3.5" />
              Download iOS App Profile (.mobileconfig)
            </a>
          </div>

          <div className="rounded-[2px] border border-[#E4E4E4] bg-white p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#5A7A94]">
              Option 2 · Safari Instant Install
            </p>
            <ol className="mt-2.5 space-y-2 text-[13px] text-[#061B33]">
              <li className="flex items-center gap-2.5">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[2px] bg-[#0A2540] text-[11px] font-bold text-white">
                  1
                </span>
                <span>
                  Tap <Share className="mx-0.5 inline h-3.5 w-3.5 text-[#0A2540]" />{" "}
                  <strong>Share</strong> in the Safari toolbar.
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[2px] bg-[#0A2540] text-[11px] font-bold text-white">
                  2
                </span>
                <span>
                  Select{" "}
                  <PlusSquare className="mx-0.5 inline h-3.5 w-3.5 text-[#0A2540]" />{" "}
                  <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.
                </span>
              </li>
            </ol>
            <button
              type="button"
              onClick={copyLink}
              className="mt-3 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-[2px] border border-[#D8E0E8] bg-[#FAFAFA] px-3 text-[12px] font-bold text-[#0A2540] transition-colors hover:bg-[#EEEEEE]"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Portal Link Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy Link for Safari ({IOS_INSTALL_URL.replace(/^https?:\/\//, "")})
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-[#E4E4E4] pt-3 text-[12px] text-[#5A7A94]">
            <span>Using an Android device?</span>
            <a
              href={ANDROID_APK_URL}
              download={ANDROID_APK_FILENAME}
              className="inline-flex items-center gap-1.5 font-bold text-[#0A2540] underline underline-offset-2 hover:text-[#021227]"
            >
              <Download className="h-3.5 w-3.5" />
              Download Android App (.apk)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DownloadAppBanner() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<"android" | "ios" | null>(null);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* ignore */
    }
    if (isStandaloneDisplay()) return;
    const ua = navigator.userAgent;
    if (isAndroidDownloadUa(ua)) {
      setPlatform("android");
      setVisible(true);
    } else if (isIosDeviceUa(ua)) {
      setPlatform("ios");
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible || !platform || (typeof window !== "undefined" && window.location.pathname === "/")) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[190] border-t border-[#0A2540] bg-[#0A2540] text-white shadow-examcell md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      role="region"
      aria-label="Download uniZ Mobile App"
    >
      <div className="mx-auto flex max-w-lg items-center gap-2.5 px-3.5 py-2.5">
        {platform === "android" ? (
          <AndroidLogo className="h-5 w-5 shrink-0 text-white" />
        ) : (
          <AppleLogo className="h-5 w-5 shrink-0 text-white" />
        )}
        <p className="min-w-0 flex-1 text-xs leading-snug text-white/95">
          <span className="font-bold text-white">Exam Cell Mobile App</span>{" "}
          <span className="text-white/80">
            {platform === "android"
              ? "— Install official Android APK."
              : "— Install on iPhone or iPad."}
          </span>
        </p>
        {platform === "android" ? (
          <a
            href={ANDROID_APK_URL}
            download={ANDROID_APK_FILENAME}
            className="shrink-0 rounded-[2px] bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.06em] text-[#0A2540] transition-colors hover:bg-[#EEEEEE]"
          >
            Download APK
          </a>
        ) : (
          <button
            type="button"
            onClick={openIosDownloadModal}
            className="shrink-0 rounded-[2px] bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.06em] text-[#0A2540] transition-colors hover:bg-[#EEEEEE]"
          >
            Install iOS
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-[2px] p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
