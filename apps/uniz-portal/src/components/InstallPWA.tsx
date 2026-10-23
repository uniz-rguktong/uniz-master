import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Share } from "lucide-react";
import { useRecoilState, useRecoilValue } from "recoil";
import { is_authenticated, pwaInstallAtom } from "../store";
import {
  ANDROID_APK_FILENAME,
  ANDROID_APK_URL,
  isAndroidDownloadUa,
  isStandaloneDisplay,
} from "../lib/androidApp";

export const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useRecoilState(pwaInstallAtom);
  const [isVisible, setIsVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const auth = useRecoilValue(is_authenticated);

  useEffect(() => {
    setIsStandalone(isStandaloneDisplay());
    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);
    setIsAndroid(isAndroidDownloadUa(navigator.userAgent));
  }, []);

  // Mobile install prompt — Android prefers the APK banner; keep toast for iOS / PWA.
  useEffect(() => {
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );

    if (!isStandaloneDisplay() && isMobile && !isAndroidDownloadUa(navigator.userAgent)) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [isStandalone]);

  // Show after login for iOS / desktop PWA only (Android uses DownloadAppBanner).
  useEffect(() => {
    if (auth.is_authenticated && !isStandalone && !isAndroid) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [auth.is_authenticated, isStandalone, isAndroid]);

  // 6. Auto-dismiss after 5 seconds of visibility
  useEffect(() => {
    let timer: any;
    if (isVisible) {
      timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [isVisible]);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const handleInstallClick = async () => {
    if (isAndroid) {
      window.location.href = ANDROID_APK_URL;
      setIsVisible(false);
      return;
    }
    const promptEvent =
      (window as any).deferredPWAInstallPrompt || deferredPrompt;
    if (promptEvent) {
      try {
        promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === "accepted") {
          setDeferredPrompt(null);
          (window as any).deferredPWAInstallPrompt = null;
          setIsVisible(false);
        }
      } catch (err) {
        console.error("[PWA] Installation prompt failed:", err);
      }
    } else if (isIOS) {
      alert(
        "To install UniZ: Tap 'Share' in Safari and select 'Add to Home Screen'.",
      );
    } else {
      console.log("[PWA] Install clicked but no prompt available");
      setIsVisible(false);
    }
  };

  if (!isVisible || isStandalone) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 10, opacity: 0, scale: 0.98 }}
        className="fixed bottom-6 right-6 z-[9999] w-[320px] md:w-[380px]"
      >
        <div className="relative overflow-hidden bg-white/95 backdrop-blur-xl border border-white/40 shadow-[0_15px_40px_rgba(0,0,0,0.12)] rounded-xl p-4 font-sans">
          {/* Subtle timer line */}
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 5, ease: "linear" }}
            className="absolute top-0 left-0 h-[2px] bg-zinc-900/40"
          />

          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="uniz-logo-wordmark text-xl text-zinc-800 leading-none">
                  uniZ
                </h3>
                <span className="text-[9px] font-bold text-zinc-900 bg-zinc-50 px-1.5 py-0.5 rounded tracking-wider">
                  App
                </span>
              </div>
              <h4 className="text-zinc-900 font-bold text-[13px] truncate">
                {isAndroid
                  ? "Get the Android app for the campus portal."
                  : "Install app to enjoy full services."}
              </h4>
            </div>

            <div className="flex items-center gap-2">
              {isAndroid ? (
                <a
                  href={ANDROID_APK_URL}
                  download={ANDROID_APK_FILENAME}
                  className="bg-zinc-900 hover:bg-black text-white px-3 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                  onClick={() => setIsVisible(false)}
                >
                  <Download size={13} />
                  Download
                </a>
              ) : (
              <button
                onClick={handleInstallClick}
                className="bg-zinc-900 hover:bg-black text-white px-3 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
              >
                <Download size={13} />
                Install
              </button>
              )}
              <button
                onClick={handleDismiss}
                className="p-1 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {isIOS && (
            <div className="mt-3 pt-2 border-t border-zinc-100 flex items-center gap-1.5 text-[9px] text-zinc-400 font-medium italic">
              <Share size={10} className="text-zinc-900" />
              <span>Safari: Tap 'Share' then 'Add to Home Screen'</span>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
