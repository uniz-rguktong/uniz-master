import { useEffect, useState } from "react";
import { X, Share, PlusSquare, Copy, Check, Download } from "lucide-react";
import {
  ANDROID_APK_FILENAME,
  ANDROID_APK_URL,
  IOS_PROFILE_FILENAME,
  IOS_PROFILE_URL,
  OPEN_IOS_MODAL_EVENT,
} from "../lib/mobile-app";
import { PORTAL_URL } from "@/lib/portal";
import { buttonVariants } from "./ui/button-variants";
import { cn } from "@/lib/utils";

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

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  const copyPortalUrl = async () => {
    try {
      await navigator.clipboard.writeText(PORTAL_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-[var(--overlay)] sm:items-center sm:p-4"
      onClick={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ios-install-title"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-xl border border-border-strong bg-surface p-5 pb-[calc(24px+env(safe-area-inset-bottom))] text-text shadow-lg sm:max-w-[640px] sm:rounded-xl sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-border-strong sm:hidden" aria-hidden="true" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 text-head">
              <img src="/rgukt-logo.png" alt="" width={32} height={37} className="h-8 w-auto" />
              <span className="font-serif text-[20px] font-semibold leading-none">RGUKT Ongole</span>
            </span>
            <h2 id="ios-install-title" className="mt-4 font-serif text-[24px] font-normal leading-8 tracking-[-0.01em] text-head">
              Download iOS App
            </h2>
            <p className="mt-2 text-[15px] leading-6 text-text-2">
              RGUKT Ongole student portal
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-2 hover:bg-tint-2"
            aria-label="Close"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        <div className="mt-6 space-y-6">
          <div className="border-t border-border pt-6">
            <p className="text-[13px] font-medium leading-[18px] text-text-2">
              Option 1 · Direct iOS Profile
            </p>
            <p className="mt-2 text-[15px] leading-6 text-text-2">
              Download the signed iOS WebClip profile and approve it in{" "}
              <strong className="font-semibold text-text">Settings → Profile Downloaded</strong>.
            </p>
            <a
              href={IOS_PROFILE_URL}
              download={IOS_PROFILE_FILENAME}
              className={cn(buttonVariants({ size: "hero" }), "mt-4 w-full")}
            >
              <AppleIcon className="h-4 w-4" />
              Download iOS App Profile (.mobileconfig)
            </a>
          </div>

          <div className="border-t border-border pt-6">
            <p className="text-[13px] font-medium leading-[18px] text-text-2">
              Option 2 · Safari Home Screen
            </p>
            <ol className="mt-3 space-y-3 text-[15px] leading-6 text-text">
              <li className="flex items-start gap-3">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-900 text-[12px] font-medium leading-4 text-white">
                  1
                </span>
                <span>
                  Open the <strong className="font-semibold">Student Portal</strong> in Safari and tap{" "}
                  <Share className="mx-0.5 inline h-4 w-4 text-accent" aria-hidden="true" />{" "}
                  <strong className="font-semibold">Share</strong>.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-900 text-[12px] font-medium leading-4 text-white">
                  2
                </span>
                <span>
                  Select{" "}
                  <PlusSquare className="mx-0.5 inline h-4 w-4 text-accent" aria-hidden="true" />{" "}
                  <strong className="font-semibold">Add to Home Screen</strong>.
                </span>
              </li>
            </ol>
            <button
              type="button"
              onClick={copyPortalUrl}
              className={cn(buttonVariants({ variant: "outline", size: "default" }), "mt-4 w-full")}
            >
              {copied ? <Check size={16} strokeWidth={1.75} aria-hidden="true" /> : <Copy size={16} strokeWidth={1.75} aria-hidden="true" />}
              {copied ? "Copied the Student Portal link" : "Copy Student Portal link"}
            </button>
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-6 text-[15px] leading-6 text-text-2 sm:flex-row sm:items-center sm:justify-between">
            <span>Using Android?</span>
            <a
              href={ANDROID_APK_URL}
              download={ANDROID_APK_FILENAME}
              className="inline-flex min-h-11 items-center gap-2 font-medium text-link underline-offset-2 hover:underline"
            >
              <Download size={16} strokeWidth={1.75} aria-hidden="true" />
              Download Android App (.apk)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
