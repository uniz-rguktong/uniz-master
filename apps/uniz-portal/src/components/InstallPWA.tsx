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

  useEffect(() => {
    if (auth.is_authenticated && !isStandalone && !isAndroid) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [auth.is_authenticated, isStandalone, isAndroid]);

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
        <div className="relative overflow-hidden rounded-[2px] border border-[#EEEEEE] bg-white p-4 font-sans shadow-examcell">
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 5, ease: "linear" }}
            className="absolute left-0 top-0 h-[2px] bg-[#34495e]"
          />

          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-0.5 flex items-center gap-2">
                <h3 className="uniz-logo-wordmark text-xl leading-none text-[#0A2540]">
                  UNIZ
                </h3>
                <span className="rounded-[1px] bg-[#FAFAFA] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#0A2540]">
                  App
                </span>
              </div>
              <h4 className="truncate text-[13px] font-bold text-[#0A2540]">
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
                  className="flex items-center gap-1.5 rounded-[1px] bg-[#34495e] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[1px] text-white transition-all hover:bg-[#2c3e50] active:scale-95"
                  onClick={() => setIsVisible(false)}
                >
                  <Download size={13} />
                  Download
                </a>
              ) : (
                <button
                  onClick={handleInstallClick}
                  className="flex items-center gap-1.5 rounded-[1px] bg-[#34495e] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[1px] text-white transition-all hover:bg-[#2c3e50] active:scale-95"
                >
                  <Download size={13} />
                  Install
                </button>
              )}
              <button
                onClick={handleDismiss}
                className="rounded-[1px] p-1 text-[#5A7A94] transition-colors hover:bg-[#FAFAFA] hover:text-[#0A2540]"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {isIOS && (
            <div className="mt-3 flex items-center gap-1.5 border-t border-[#EEEEEE] pt-2 text-[9px] font-medium italic text-[#5A7A94]">
              <Share size={10} className="text-[#0A2540]" />
              <span>Safari: Tap 'Share' then 'Add to Home Screen'</span>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
