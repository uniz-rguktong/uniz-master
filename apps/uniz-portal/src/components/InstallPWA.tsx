import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone, Share } from "lucide-react";
import { useRecoilValue } from "recoil";
import { is_authenticated } from "../store";

export const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
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
      console.log("Captured beforeinstallprompt event");
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isStandaloneMatch) {
        setIsVisible(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

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

    // Show if mobile and not installed
    if (!isStandaloneMatch && isMobile) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [isStandalone]);

  // 5. Immediate show after login if not already standalone
  useEffect(() => {
    const isDismissed = localStorage.getItem("pwa_prompt_dismissed");
    if (auth.is_authnticated && !isStandalone && !isDismissed) {
      setIsVisible(true);
    }
  }, [auth.is_authnticated, isStandalone]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("pwa_prompt_dismissed", "true");
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setIsVisible(false);
      }
    } else if (isIOS) {
      alert(
        "To install UniZ App: Tap 'Share' icon in Safari bottom menu, then select 'Add to Home Screen'.",
      );
    } else {
      alert(
        "Open your browser menu (usually three dots) and look for 'Install App' or 'Add to Home Screen'.",
      );
    }
  };

  if (!isVisible || isStandalone) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 200, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 200, opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", damping: 20, stiffness: 200, delay: 0.2 }}
        className="fixed bottom-6 left-4 right-4 z-[99999] md:left-auto md:right-6 md:max-w-[380px]"
      >
        <div className="relative bg-white/95 backdrop-blur-2xl border border-white shadow-[0_30px_70px_-10px_rgba(0,0,0,0.3)] rounded-[2.5rem] p-6 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#800000]/5 rounded-full blur-[40px]" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/5 rounded-full blur-[40px]" />

          <button
            onClick={handleDismiss}
            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-all active:scale-90"
          >
            <X size={16} />
          </button>

          <div className="relative">
            <div className="flex items-center gap-5 mb-5">
              <div className="relative">
                <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-900/30 relative z-10">
                  <Smartphone size={28} strokeWidth={1.5} />
                </div>
                <div className="absolute -inset-2 bg-slate-900/10 blur-xl rounded-2xl" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase italic">
                  UniZ On Mobile
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1.5">
                  Beta Experience
                </p>
              </div>
            </div>

            <p className="text-slate-600 text-sm font-semibold leading-snug mb-6 pr-4">
              Access your grades and outpass
              <span className="text-slate-900 font-bold"> seamlessly</span>.
              Install the app for the best experience and real-time updates.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleInstallClick}
                className="w-full bg-[#800000] text-white font-black uppercase tracking-widest text-[11px] py-4 px-6 rounded-2xl flex items-center justify-center gap-3 hover:bg-[#600000] transition-all shadow-xl shadow-[#800000]/20 active:scale-[0.97]"
              >
                <Download size={16} />
                {isIOS ? "Show Instructions" : "Install UniZ Now"}
              </button>

              {isIOS && (
                <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-tight mt-1 flex items-center justify-center gap-1">
                  <Share size={10} className="text-blue-500" /> Tap Share then
                  'Add to Home Screen'
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
