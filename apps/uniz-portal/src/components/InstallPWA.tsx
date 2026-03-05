import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Smartphone, Share } from "lucide-react";
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
      const isDismissed = localStorage.getItem("pwa_prompt_dismissed");
      if (!isStandaloneMatch && !isDismissed) {
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

  // 6. Auto-dismiss after 5 seconds of visibility
  useEffect(() => {
    let timer: any;
    if (isVisible) {
      timer = setTimeout(() => {
        setIsVisible(false);
        localStorage.setItem("pwa_prompt_dismissed", "true");
      }, 5000);
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
        initial={{ y: 0, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 0, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[99999] bg-[#312e2b] flex flex-col font-sans"
      >
        {/* Top App Banner */}
        <div className="flex items-center px-4 py-3 bg-[#262421] border-b border-white/5">
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white p-1 -ml-1 mr-2"
          >
            <X size={20} />
          </button>
          <div className="w-10 h-10 bg-white rounded-lg p-1 flex items-center justify-center shrink-0">
            <img
              src="/assets/ongole_logo.png"
              alt="UniZ Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="ml-3 flex-1 overflow-hidden">
            <h4 className="text-white text-[15px] font-bold leading-tight">
              UniZ App
            </h4>
            <p className="text-slate-400 text-[12px] leading-tight truncate mt-0.5">
              Access grades, outpass & more!
            </p>
          </div>
          <button
            onClick={handleInstallClick}
            className="bg-[#81b64c] hover:bg-[#a3d160] text-white font-bold text-[14px] px-4 py-1.5 rounded-md shadow-sm transition-colors shrink-0"
          >
            Install
          </button>
        </div>

        {/* Main Content Body */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20 overflow-y-auto">
          <div className="w-16 h-16 bg-white rounded-2xl p-2 shadow-2xl mb-6">
            <img
              src="/assets/ongole_logo.png"
              alt="UniZ Logo"
              className="w-full h-full object-contain"
            />
          </div>

          <h1 className="text-white text-3xl font-black text-center mb-8 px-4 leading-[1.1] tracking-tight">
            Install the UniZ App
          </h1>

          <div className="w-40 h-40 mb-10 opacity-90 drop-shadow-2xl">
            {/* Using a large central icon representing the app installation */}
            <Smartphone
              className="w-full h-full text-[#81b64c]"
              strokeWidth={1}
            />
          </div>

          <div className="w-full max-w-[340px] flex flex-col gap-4">
            <button
              onClick={handleInstallClick}
              className="w-full bg-[#81b64c] hover:bg-[#a3d160] text-white font-bold text-lg py-4 rounded-xl shadow-[0_4px_0_rgba(0,0,0,0.2)] transition-all active:translate-y-1 active:shadow-none"
            >
              {isIOS ? "Show Instructions" : "Install App"}
            </button>

            <div className="flex items-center gap-3 my-2 opacity-50">
              <div className="flex-1 h-px bg-white/20" />
              <span className="text-white/60 text-xs font-bold uppercase tracking-wider">
                OR
              </span>
              <div className="flex-1 h-px bg-white/20" />
            </div>

            <button
              onClick={handleDismiss}
              className="w-full bg-[#45423f] hover:bg-[#524f4c] border border-white/5 text-white/90 font-bold text-base py-3.5 rounded-xl transition-all shadow-[0_3px_0_rgba(0,0,0,0.1)] active:translate-y-1 active:shadow-none"
            >
              Continue in Browser
            </button>

            {isIOS && (
              <p className="text-[11px] text-center text-white/40 font-semibold uppercase tracking-wide mt-4 flex items-center justify-center gap-1.5">
                <Share size={12} className="text-white/60" /> Tap Share then
                'Add to Home Screen'
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
