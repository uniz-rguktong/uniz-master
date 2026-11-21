import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Share } from "lucide-react";
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
 className="fixed inset-x-4 bottom-4 z-[9999] min-[821px]:inset-x-auto min-[821px]:right-6 min-[821px]:w-[420px]"
 >
 <div className="rounded-xl border border-border bg-panel p-6 font-sans shadow-none">
 <h2 className="font-serif text-[22px] font-normal leading-[30px] text-head">
 Install app to enjoy full services.
 </h2>
 <div className="mt-5 flex flex-col gap-3 min-[821px]:flex-row min-[821px]:justify-end">
 <button
 type="button"
 onClick={handleDismiss}
 className="inline-flex h-11 items-center justify-center rounded-full px-4 text-[15px] font-semibold text-text-2 hover:bg-tint"
 >
 Dismiss
 </button>
 <button
 type="button"
 onClick={handleInstallClick}
 className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-[15px] font-semibold text-primary-foreground hover:bg-primary-hover"
 >
 <Download size={16} strokeWidth={1.75} aria-hidden />
 Install
 </button>
 </div>
 {isIOS && (
 <p className="mt-4 flex items-center gap-2 text-small text-text-2">
 <Share size={16} strokeWidth={1.75} aria-hidden />
 Safari: Tap Share then Add to Home Screen
 </p>
 )}
 </div>
 </motion.div>
 </AnimatePresence>
 );
};
