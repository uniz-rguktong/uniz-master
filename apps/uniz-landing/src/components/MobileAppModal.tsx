import { useEffect, useState } from "react";
import { X, Share, PlusSquare, Copy, Check, Download } from "lucide-react";

export const ANDROID_APK_URL = "/download/uniz.apk";
export const ANDROID_APK_FILENAME = "uniZ.apk";
export const IOS_PROFILE_URL = "/download/uniz-ios.mobileconfig";
export const IOS_PROFILE_FILENAME = "uniZ-iOS.mobileconfig";
export const OPEN_IOS_MODAL_EVENT = "uniz-landing:open-ios-modal";

export function openLandingIosModal() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OPEN_IOS_MODAL_EVENT));
  }
}

export function AndroidIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24a11.43 11.43 0 0 0-8.94 0L5.65 5.67c-.19-.28-.54-.37-.83-.22-.3.16-.42.54-.26.85l1.84 3.18C4.8 10.92 3.5 12.62 3.5 16.5h17c0-3.88-1.3-5.58-2.9-7.02zM7 14c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm10 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
    </svg>
  );
}

export function AppleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.96 6.32c.67-.81 1.12-1.94 1-3.07-.96.04-2.13.64-2.82 1.45-.61.7-.11 1.85-.98 2.96 1.07.08 2.13-.53 2.8-1.34" />
    </svg>
  );
}

export function MobileAppModal() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(OPEN_IOS_MODAL_EVENT, handler);
    return () => window.removeEventListener(OPEN_IOS_MODAL_EVENT, handler);
  }, []);

  if (!open) return null;

  const copyPortalUrl = async () => {
    try {
      await navigator.clipboard.writeText("https://uniz.rguktong.in");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#061B33]/65 p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-[2px] border border-[#0A2540] bg-white text-[#061B33] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-[#0A2540] px-5 py-3.5 text-white">
          <div className="flex items-center gap-2.5">
            <img
              src="/rgukt-logo.png"
              alt="RGUKT"
              className="h-7 w-7 rounded-[2px] bg-white p-0.5 object-contain"
            />
            <div>
              <h3 className="text-[15px] font-bold tracking-[0.02em] text-white">
                Download iOS App
              </h3>
              <p className="text-[11px] text-white/75">
                RGUKT Ongole · Examination Cell Mobile App
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-[2px] p-1 text-white/80 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded-[2px] border border-slate-200 bg-[#FAFAFA] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
              Option 1 · Direct iOS Profile
            </p>
            <p className="mt-1 text-[13px] text-slate-600">
              Download the signed iOS WebClip profile and approve it in{" "}
              <strong className="text-[#061B33]">Settings → Profile Downloaded</strong>.
            </p>
            <a
              href={IOS_PROFILE_URL}
              download={IOS_PROFILE_FILENAME}
              className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-[2px] bg-[#0A2540] px-4 text-xs font-bold uppercase tracking-[1px] text-white transition-colors hover:bg-[#021227]"
            >
              <AppleIcon className="w-3.5 h-3.5" />
              Download iOS App Profile (.mobileconfig)
            </a>
          </div>

          <div className="rounded-[2px] border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
              Option 2 · Safari Home Screen
            </p>
            <ol className="mt-2.5 space-y-2 text-[13px] text-slate-700">
              <li className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[2px] bg-[#0A2540] text-[11px] font-bold text-white">
                  1
                </span>
                <span>
                  Open <strong>uniz.rguktong.in</strong> in Safari and tap{" "}
                  <Share className="mx-0.5 inline h-3.5 w-3.5 text-[#0A2540]" />{" "}
                  <strong>Share</strong>.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[2px] bg-[#0A2540] text-[11px] font-bold text-white">
                  2
                </span>
                <span>
                  Select{" "}
                  <PlusSquare className="mx-0.5 inline h-3.5 w-3.5 text-[#0A2540]" />{" "}
                  <strong>Add to Home Screen</strong>.
                </span>
              </li>
            </ol>
            <button
              type="button"
              onClick={copyPortalUrl}
              className="mt-3 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-[2px] border border-slate-200 bg-[#FAFAFA] px-3 text-xs font-bold text-[#0A2540] hover:bg-slate-100"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied uniz.rguktong.in" : "Copy Safari Portal Link"}
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-xs text-slate-500">
            <span>Using Android?</span>
            <a
              href={ANDROID_APK_URL}
              download={ANDROID_APK_FILENAME}
              className="inline-flex items-center gap-1 font-bold text-[#0A2540] underline underline-offset-2"
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
