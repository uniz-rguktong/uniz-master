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
    // Check standalone
    const isStandaloneMatch =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMatch);

    // iOS detection
    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);
  }, []);

  // 4. Force visibility check for mobile
  useEffect(() => {
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
    if (auth.is_authenticated && !isStandalone) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [auth.is_authenticated, isStandalone]);

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
    const promptEvent = (window as any).deferredPWAInstallPrompt || deferredPrompt;
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
      // For iOS, manual instructions are unavoidable but we make them as friendly as possible
      alert(
        "To install UniZ: Tap 'Share' in Safari and select 'Add to Home Screen'.",
      );
    } else {
      // If we don't have the prompt, and it's not iOS, don't show the alert instructions
      // Instead, just hide the toast since we can't fulfill the direct install yet.
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
