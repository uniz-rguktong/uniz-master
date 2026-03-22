import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Share } from "lucide-react";
import { useRecoilState, useRecoilValue } from "recoil";
import { is_authenticated, pwaInstallAtom } from "../store";

export const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useRecoilState(pwaInstallAtom);
  const [isVisible, setIsVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const auth = useRecoilValue(is_authenticated);

  useEffect(() => {
    // 1. Standalone check
    const isStandaloneMatch =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMatch);

    // 2. iOS detection
    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // 3. Handle beforeinstallprompt (Android/Chrome)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const isDismissed = localStorage.getItem("pwa_prompt_dismissed");
      if (!isStandaloneMatch && !isDismissed) {
        setIsVisible(true);
      }
    };

    if (!deferredPrompt) {
      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, [deferredPrompt, setDeferredPrompt]);

  // 4. Force visibility check for mobile
  useEffect(() => {
    const isDismissed = localStorage.getItem("pwa_prompt_dismissed");
    if (isDismissed) return;

    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );

    const isStandaloneMatch =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (!isStandaloneMatch && isMobile) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [isStandalone]);

  // 5. Show after login if not already standalone
  useEffect(() => {
    const isDismissed = localStorage.getItem("pwa_prompt_dismissed");
    if (auth.is_authenticated && !isStandalone && !isDismissed) {
      setTimeout(() => setIsVisible(true), 2000);
    }
  }, [auth.is_authenticated, isStandalone]);

  // 6. Auto-dismiss after 8 seconds of visibility
  useEffect(() => {
    let timer: any;
    if (isVisible) {
      timer = setTimeout(() => {
        setIsVisible(false);
        localStorage.setItem("pwa_prompt_dismissed", "true");
      }, 8000);
    }
    return () => clearTimeout(timer);
  }, [isVisible]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("pwa_prompt_dismissed", "true");
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setIsVisible(false);
      }
    } else if (isIOS) {
      alert(
        "To install UniZ: Tap 'Share' in Safari and select 'Add to Home Screen'.",
      );
    } else {
      alert(
        "Open your browser menu and select 'Install App' or 'Add to Home Screen'.",
      );
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
            transition={{ duration: 8, ease: "linear" }}
            className="absolute top-0 left-0 h-[2px] bg-navy-900/40"
          />

          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="unifrakturcook-bold text-xl text-slate-800 tracking-tight leading-none">
                  uniZ
                </h3>
                <span className="text-[9px] font-bold text-navy-900 bg-navy-50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  App
                </span>
              </div>
              <h4 className="text-slate-900 font-bold text-[13px] truncate">
                Install app to enjoy full services.
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleInstallClick}
                className="bg-slate-900 hover:bg-black text-white px-3 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
              >
                <Download size={13} />
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {isIOS && (
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[9px] text-slate-400 font-medium italic">
              <Share size={10} className="text-navy-900" />
              <span>Safari: Tap 'Share' then 'Add to Home Screen'</span>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
