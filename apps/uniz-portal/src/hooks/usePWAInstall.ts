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

    if (deferredPrompt) {
      setIsInstallable(true);
    } else {
      setIsInstallable(false);
    }
  }, [deferredPrompt]);

  const install = async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        // iOS specific handling - normally we would show a custom UI guide
        // But the user wants it to be as direct as possible.
        // On iOS, we literally can't trigger a native prompt, so we must show instructions.
        return "ios";
      }
      return "fallback";
    }

    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
      setIsInstallable(false);
      setDeferredPrompt(null);
    } else {
      console.log("User dismissed the install prompt");
    }
    return outcome;
  };

  return { isInstallable, isIOS, isInstalled, install };
};
