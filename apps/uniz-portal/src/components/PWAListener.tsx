import { useEffect } from "react";
import { useRecoilState } from "recoil";
import { pwaInstallAtom } from "../store/atoms";

export const PWAListener = () => {
  const [, setDeferredPrompt] = useRecoilState(pwaInstallAtom);

  useEffect(() => {
    const handler = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      console.log("[PWA] beforeinstallprompt event captured globally");
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Also check for appinstalled event to clear the prompt
    const installedHandler = () => {
      console.log("[PWA] App installed successfully");
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, [setDeferredPrompt]);

  return null;
};
