import { useState, useEffect } from "react";
import { useRecoilState } from "recoil";
import { pwaInstallAtom } from "../store/atoms";

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useRecoilState(pwaInstallAtom);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standaloneMatch = window.matchMedia("(display-mode: standalone)").matches || 
                           (window.navigator as any).standalone === true;
    setIsInstalled(standaloneMatch);

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    if (deferredPrompt || (window as any).deferredPWAInstallPrompt) {
      setIsInstallable(true);
    } else {
      setIsInstallable(false);
    }
  }, [deferredPrompt]);

  const install = async () => {
    const promptEvent = (window as any).deferredPWAInstallPrompt || deferredPrompt;
    
    if (!promptEvent) {
      if (isIOS) {
        // iOS specific handling - normally we would show a custom UI guide
        // But the user wants it to be as direct as possible.
        // On iOS, we literally can't trigger a native prompt, so we must show instructions.
        return "ios";
      }
      return "fallback";
    }

    try {
      // Show the install prompt using the un-proxied window object if available
      promptEvent.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await promptEvent.userChoice;

      if (outcome === "accepted") {
        console.log("User accepted the install prompt");
        setIsInstallable(false);
        setDeferredPrompt(null);
        (window as any).deferredPWAInstallPrompt = null;
      } else {
        console.log("User dismissed the install prompt");
      }
      return outcome;
    } catch (err) {
      console.error("[PWA] Installation prompt failed:", err);
      // Fallback action if prompt throws (e.g. if event is stale)
      return "error";
    }
  };

  return { isInstallable, isIOS, isInstalled, install };
};
