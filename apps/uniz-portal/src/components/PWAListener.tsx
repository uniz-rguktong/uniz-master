import { useEffect } from "react";
import { useRecoilState } from "recoil";
import { pwaInstallAtom } from "../store/atoms";

export const PWAListener = () => {
  const [, setDeferredPrompt] = useRecoilState(pwaInstallAtom);

  useEffect(() => {
    // Check if the event was already captured by index.html script
    if ((window as any).deferredPWAInstallPrompt) {
      console.log("[PWA] Using early-captured event");
      setDeferredPrompt((window as any).deferredPWAInstallPrompt);
    }

    const handler = (e: any) => {
      e.preventDefault();
      console.log("[PWA] beforeinstallprompt event captured in React");
      setDeferredPrompt(e);
    };

    const earlyReadyHandler = (e: any) => {
      console.log("[PWA] Early event notification received");
      setDeferredPrompt(e.detail);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("pwa-prompt-ready", earlyReadyHandler);

    const installedHandler = () => {
      console.log("[PWA] App installed successfully");
      setDeferredPrompt(null);
      (window as any).deferredPWAInstallPrompt = null;
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("pwa-prompt-ready", earlyReadyHandler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, [setDeferredPrompt]);

  return null;
};
