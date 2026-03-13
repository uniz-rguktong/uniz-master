"use client";

import { useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const INSTALL_PROMPT_SESSION_KEY = "ornate_install_prompt_session_seen_v1";
const NOTIFICATION_PROMPT_SESSION_KEY = "ornate_notification_prompt_session_seen_v1";
const NOTIFICATION_PERMISSION_NEEDED_EVENT = "ornate:notifications:permission-needed";

function isStandaloneMode(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isMobileDevice(): boolean {
  return /android|iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isIosDevice(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isSafariBrowser(): boolean {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return userAgent.includes("safari") && !userAgent.includes("chrome") && !userAgent.includes("crios");
}

function isChromeLikeBrowser(): boolean {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return userAgent.includes("chrome") || userAgent.includes("crios") || userAgent.includes("edg");
}

export default function InstallPWA(): React.ReactElement | null {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [iOS, setIOS] = useState(false);
  const [safari, setSafari] = useState(false);
  const [chromeLike, setChromeLike] = useState(false);
  const [secureContext, setSecureContext] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [requestingNotificationPermission, setRequestingNotificationPermission] = useState(false);
  const [showFirstPrompt, setShowFirstPrompt] = useState(false);

  useEffect(() => {
    const standaloneMode = isStandaloneMode();
    const mobileDevice = isMobileDevice();
    const iosDevice = isIosDevice();
    const safariBrowser = isSafariBrowser();
    const chromeBrowser = isChromeLikeBrowser();

    setStandalone(standaloneMode);
    setMobile(mobileDevice);
    setIOS(iosDevice);
    setSafari(safariBrowser);
    setChromeLike(chromeBrowser);
    setSecureContext(window.isSecureContext);
    setNotificationPermission(
      "Notification" in window ? window.Notification.permission : "unsupported",
    );

    if (standaloneMode || !mobileDevice) {
      return;
    }

    const hasSeenInstallThisSession =
      window.sessionStorage.getItem(INSTALL_PROMPT_SESSION_KEY) === "true";
    const hasSeenNotificationThisSession =
      window.sessionStorage.getItem(NOTIFICATION_PROMPT_SESSION_KEY) === "true";
    const shouldPromptNotifications =
      "Notification" in window && window.Notification.permission !== "granted";

    if (!hasSeenInstallThisSession || (!hasSeenNotificationThisSession && shouldPromptNotifications)) {
      setShowFirstPrompt(true);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);

      const seen = window.sessionStorage.getItem(INSTALL_PROMPT_SESSION_KEY) === "true";
      if (!seen && mobileDevice && !standaloneMode) {
        setShowFirstPrompt(true);
      }
    };

    const handleInstalled = () => {
      setDeferredPrompt(null);
      setStandalone(true);
      setShowFirstPrompt(false);
      window.sessionStorage.setItem(INSTALL_PROMPT_SESSION_KEY, "true");
    };

    const handleNotificationPermissionNeeded = () => {
      if (isStandaloneMode() || !isMobileDevice()) return;
      if (!("Notification" in window)) return;
      if (window.Notification.permission === "granted") return;

      setNotificationPermission(window.Notification.permission);
      window.sessionStorage.removeItem(NOTIFICATION_PROMPT_SESSION_KEY);
      setShowFirstPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    window.addEventListener(NOTIFICATION_PERMISSION_NEEDED_EVENT, handleNotificationPermissionNeeded);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      window.removeEventListener(NOTIFICATION_PERMISSION_NEEDED_EVENT, handleNotificationPermissionNeeded);
    };
  }, []);

  useEffect(() => {
    if (!showFirstPrompt) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [showFirstPrompt]);

  const canShowInstallButton = useMemo(
    () => mobile && !standalone && deferredPrompt !== null && !showFirstPrompt,
    [mobile, standalone, deferredPrompt, showFirstPrompt],
  );

  const markPromptSeen = () => {
    window.sessionStorage.setItem(INSTALL_PROMPT_SESSION_KEY, "true");
  };

  const markNotificationPromptSeen = () => {
    window.sessionStorage.setItem(NOTIFICATION_PROMPT_SESSION_KEY, "true");
  };

  const onDismissFirstPrompt = () => {
    markPromptSeen();
    markNotificationPromptSeen();
    setShowFirstPrompt(false);
  };

  const onAllowNotificationsClick = async () => {
    if (!("Notification" in window)) {
      setNotificationPermission("unsupported");
      markNotificationPromptSeen();
      return;
    }

    if (window.Notification.permission === "denied") {
      markNotificationPromptSeen();
      return;
    }

    setRequestingNotificationPermission(true);
    try {
      const permission = await window.Notification.requestPermission();
      setNotificationPermission(permission);
      markNotificationPromptSeen();
    } finally {
      setRequestingNotificationPermission(false);
    }
  };

  const onInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      markPromptSeen();
      if (choice.outcome === "accepted") {
        setStandalone(true);
      }
    } finally {
      setInstalling(false);
      setDeferredPrompt(null);
      setShowFirstPrompt(false);
    }
  };

  const iOSSafariFlow = iOS && safari;
  const canTriggerNativeInstall = deferredPrompt !== null;
  const installUnavailable = !iOSSafariFlow && !canTriggerNativeInstall;

  const primaryButtonLabel = iOSSafariFlow
    ? "Got it"
    : installing
      ? "Opening..."
      : canTriggerNativeInstall
        ? "Install App"
        : "Install Unavailable";

  const installContextMessage = iOSSafariFlow
    ? "Tap Share in Safari, then choose Add to Home Screen."
    : iOS
      ? "Open this site in Safari, then use Share and choose Add to Home Screen."
      : canTriggerNativeInstall
        ? "Install Ornate EMS for full-screen access, faster launch, and a native app feel."
        : !secureContext
          ? "Install is blocked on this URL. Use HTTPS (or localhost) to enable app install."
          : !chromeLike
            ? "Use Chrome on Android to install this app."
            : "Install prompt is not ready yet. Browse for a moment and retry.";

  const onPrimaryAction = async () => {
    if (iOSSafariFlow) {
      onDismissFirstPrompt();
      return;
    }

    await onInstallClick();
  };

  const shouldShowNotificationPrompt =
    notificationPermission !== "granted" && notificationPermission !== "unsupported";

  const notificationMessage =
    notificationPermission === "denied"
      ? "Notifications are blocked in browser settings. Enable them for this site to receive alerts."
      : "Allow notifications to receive instant event updates, approvals, and reminders.";

  if (!mobile || standalone) return null;

  if (showFirstPrompt) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 p-4 backdrop-blur-md">
        <div className="w-full max-w-md overflow-hidden rounded-[24px] border border-[#D8DEE7] bg-[#F7F8FA] shadow-[0_20px_55px_rgba(15,23,42,0.28)]">
          <div className="relative overflow-hidden border-b border-[#E4E7EC] bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] px-6 pb-5 pt-6 text-white">
            <div className="absolute right-[-40px] top-[-40px] h-28 w-28 rounded-full bg-white/10" />
            <div className="absolute bottom-[-32px] left-[-28px] h-24 w-24 rounded-full bg-white/10" />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#CBD5E1]">Ornate EMS App</p>
                <h3 className="mt-1 text-[22px] font-bold leading-tight">Install for the Best Experience</h3>
              </div>
              <img
                src="/assets/icon-192x192.png"
                alt="Ornate EMS"
                className="h-11 w-11 rounded-xl border border-white/30 bg-white/20 p-1"
              />
            </div>
            <p className="relative mt-3 text-sm leading-relaxed text-[#E2E8F0]">
              Launch directly from home screen with native-style fullscreen navigation.
            </p>
          </div>

          <div className="p-5">
            <div className="rounded-[18px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
              <div className="mb-3 inline-flex items-center rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1 text-xs font-semibold text-[#334155]">
                {installUnavailable ? "Install Not Ready" : "Install Available"}
              </div>
              <p className="text-sm leading-relaxed text-[#475569]">{installContextMessage}</p>

              {iOSSafariFlow ? (
                <div className="mt-4 space-y-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-sm text-[#475569]">
                  <p>1. Tap Share in Safari</p>
                  <p>2. Select Add to Home Screen</p>
                  <p>3. Tap Add</p>
                </div>
              ) : null}
            </div>

            {shouldShowNotificationPrompt ? (
              <div className="mt-4 rounded-[18px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
                <div className="mb-3 inline-flex items-center rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1 text-xs font-semibold text-[#334155]">
                  Notifications
                </div>
                <p className="text-sm leading-relaxed text-[#475569]">{notificationMessage}</p>
                <div className="mt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      markNotificationPromptSeen();
                    }}
                    className="flex-1 rounded-[12px] border border-[#D1D5DB] bg-white px-4 py-2.5 text-sm font-semibold text-[#1F2937] transition hover:bg-[#F9FAFB]"
                  >
                    Later
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void onAllowNotificationsClick();
                    }}
                    disabled={requestingNotificationPermission || notificationPermission === "denied"}
                    className="flex-1 rounded-[12px] bg-[#0F172A] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {notificationPermission === "denied"
                      ? "Blocked in Browser"
                      : requestingNotificationPermission
                        ? "Requesting..."
                        : "Allow Notifications"}
                  </button>
                </div>
              </div>
            ) : null}

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={onDismissFirstPrompt}
                className="flex-1 rounded-[12px] border border-[#D1D5DB] bg-white px-4 py-2.5 text-sm font-semibold text-[#1F2937] transition hover:bg-[#F9FAFB]"
              >
                Not now
              </button>
              <button
                type="button"
                onClick={() => {
                  void onPrimaryAction();
                }}
                disabled={installing || installUnavailable}
                className="flex-1 rounded-[12px] bg-[#0F172A] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {primaryButtonLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!canShowInstallButton) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        type="button"
        onClick={onInstallClick}
        disabled={installing}
        className="inline-flex items-center gap-2 rounded-[14px] border border-[#1E293B] bg-[#0F172A] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(15,23,42,0.35)] transition hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-60"
        aria-label="Install Ornate EMS App"
      >
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-[11px]">+</span>
        {installing ? "Opening installer..." : "Install App"}
      </button>
    </div>
  );
}
