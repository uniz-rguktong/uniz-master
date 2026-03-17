"use client";

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, Download, Sparkles, Terminal, Activity } from 'lucide-react';
import Image from 'next/image';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const INSTALL_PROMPT_SESSION_KEY = 'ornate_install_prompt_session_seen_v1';

function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /android|iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export default function InstallPWA(): React.ReactElement | null {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const standaloneMode = isStandaloneMode();
    const mobileDevice = isMobileDevice();
    const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

    setStandalone(standaloneMode);
    setMobile(mobileDevice);
    setIsIOSDevice(ios);

    if (!standaloneMode && mobileDevice) {
      const seen = window.sessionStorage.getItem(INSTALL_PROMPT_SESSION_KEY) === 'true';
      if (!seen) {
        // Delay slightly for better UX
        const timer = setTimeout(() => setShowPrompt(true), 2500);
        return () => clearTimeout(timer);
      }
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setDeferredPrompt(null);
      setStandalone(true);
      setShowPrompt(false);
      window.sessionStorage.setItem(INSTALL_PROMPT_SESSION_KEY, 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const canShowPrompt = useMemo(() => {
    if (!mobile || standalone || !showPrompt) return false;
    // On Android/Chrome, we only show if we have the prompt event
    if (!isIOSDevice && !deferredPrompt) return false;
    return true;
  }, [mobile, standalone, showPrompt, isIOSDevice, deferredPrompt]);

  const dismiss = () => {
    window.sessionStorage.setItem(INSTALL_PROMPT_SESSION_KEY, 'true');
    setShowPrompt(false);
  };

  const install = async () => {
    if (isIOSDevice) {
      // iOS doesn't support programmatic installation
      // We'll show an alert or just rely on the instructions in the UI
      return;
    }

    if (!deferredPrompt) {
      dismiss();
      return;
    }

    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      console.log('[PWA] Install result:', result.outcome);
      if (result.outcome === 'accepted') {
        setStandalone(true);
        window.sessionStorage.setItem(INSTALL_PROMPT_SESSION_KEY, 'true');
      }
    } catch (err) {
      console.error('[PWA] Installation failed:', err);
    } finally {
      setInstalling(false);
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  return (
    <AnimatePresence>
      {canShowPrompt && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4 backdrop-blur-md"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="group relative w-full max-w-sm overflow-hidden rounded-3xl border border-[#22d3ee]/20 bg-[#070b14]/90 p-6 shadow-[0_0_50px_rgba(34,211,238,0.15)]"
          >
            {/* Background Interstellar Grid Effect */}
            <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
            
            {/* Animated Scanning Line */}
            <motion.div 
              animate={{ 
                top: ["-10%", "110%"],
                opacity: [0, 1, 1, 0]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-[#22d3ee]/50 to-transparent z-10"
            />

            {/* Tactical Corner Objects */}
            <div className="absolute top-0 left-0 w-8 h-8 pointer-events-none">
              <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-[#22d3ee]/40 rounded-tl-sm" />
            </div>
            <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none">
              <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-[#22d3ee]/40 rounded-tr-sm" />
            </div>
            <div className="absolute bottom-0 left-0 w-8 h-8 pointer-events-none">
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-[#22d3ee]/40 rounded-bl-sm" />
            </div>
            <div className="absolute bottom-0 right-0 w-8 h-8 pointer-events-none">
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-[#22d3ee]/40 rounded-br-sm" />
            </div>

            {/* Close Button */}
            <button 
              onClick={dismiss}
              className="absolute top-2 right-2 p-4 text-white/40 hover:text-[#22d3ee] transition-colors z-50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative z-20 flex flex-col items-center text-center">
              {/* Profile/Logo Section */}
              <motion.div 
                animate={{ 
                  boxShadow: ["0 0 0px rgba(34,211,238,0)", "0 0 30px rgba(34,211,238,0.3)", "0 0 0px rgba(34,211,238,0)"]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="relative mb-6 rounded-2xl bg-[#22d3ee]/10 p-4 ring-1 ring-[#22d3ee]/30"
              >
                <div className="relative w-16 h-16">
                  <Image 
                    src="/assets/Ornate_LOGO.svg" 
                    alt="Ornate Logo" 
                    fill 
                    className="object-contain filter drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                  />
                </div>
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-1 -right-1"
                >
                  <Sparkles className="w-5 h-5 text-[#22d3ee]" />
                </motion.div>
              </motion.div>

              <div className="flex items-center gap-2 mb-1">
                <Terminal className="w-3 h-3 text-[#22d3ee]/60" />
                <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#22d3ee]/60">Link Established</span>
              </div>
              
              <h3 className="text-xl font-bold tracking-tight text-white mb-2 underline decoration-[#22d3ee]/30 underline-offset-4 decoration-2">
                Elevate to Core App
              </h3>
              
              <p className="text-sm text-white/60 leading-relaxed mb-8 max-w-[240px]">
                {isIOSDevice 
                  ? "Tap the 'Share' icon below and select 'Add to Home Screen' to launch Ornate."
                  : "Explorer detected. Install Ornate to begin the mission."
                }
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col w-full gap-3 mt-2">
                {!isIOSDevice && (
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(34,211,238,0.3)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { void install(); }}
                    disabled={installing}
                    className="relative group w-full overflow-hidden rounded-xl bg-[#22d3ee] px-6 py-3.5 text-xs font-black uppercase tracking-[0.2em] text-[#070b14] transition-all hover:bg-[#22d3ee]/90 disabled:opacity-50 cursor-pointer"
                  >
                    <div className="flex items-center justify-center gap-2">
                      {installing ? (
                        <Activity className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 group-hover:animate-bounce" />
                      )}
                      <span>{installing ? 'Syncing...' : 'Install Station'}</span>
                    </div>
                    
                    {/* Button Reflection Effect */}
                    <div className="absolute inset-0 -translate-x-full transition-transform duration-1000 group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                  </motion.button>
                )}

                <button
                  onClick={dismiss}
                  className="w-full rounded-xl border border-white/10 px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 hover:bg-white/5 hover:text-white/60 transition-all cursor-pointer"
                >
                  Stay in Browser
                </button>
              </div>

              {/* Status Bar */}
              <div className="mt-6 flex items-center justify-center gap-6 w-full border-t border-white/5 pt-4">
                <div className="flex items-center gap-1.5 opacity-40">
                  <Smartphone className="w-3 h-3" />
                  <span className="text-[9px] uppercase tracking-widest font-medium">Standalone</span>
                </div>
                <div className="w-px h-2 bg-white/10" />
                <div className="flex items-center gap-1.5 opacity-40">
                  <Activity className="w-3 h-3" />
                  <span className="text-[9px] uppercase tracking-widest font-medium">Ultra-Fast</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
