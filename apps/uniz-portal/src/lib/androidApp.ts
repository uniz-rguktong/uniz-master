/** Direct APK served from apps/uniz-portal/public/download/uniz.apk */
export const ANDROID_APK_URL = "/download/uniz.apk";

export const ANDROID_APK_FILENAME = "uniZ.apk";

/** Direct signed/configured iOS WebClip profile served from public/download/uniz-ios.mobileconfig */
export const IOS_PROFILE_URL = "/download/uniz-ios.mobileconfig";

export const IOS_PROFILE_FILENAME = "uniZ-iOS.mobileconfig";

/** Dedicated iOS installation guide route */
export const IOS_INSTALL_URL = "https://uniz.rguktong.in/ios";

/** True for Android phones/tablets where offering an APK makes sense. */
export function isAndroidDownloadUa(ua: string): boolean {
  if (!/Android/i.test(ua)) return false;
  if (/Windows Phone|Kindle|Silk/i.test(ua)) return false;
  return true;
}

/** True for iPhone / iPad / iPod devices (including iPadOS desktop-class UA). */
export function isIosDeviceUa(ua: string): boolean {
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  if (
    typeof navigator !== "undefined" &&
    navigator.platform === "MacIntel" &&
    navigator.maxTouchPoints > 1
  ) {
    return true;
  }
  return false;
}

/** True when running inside Mobile Safari on iOS (as opposed to Chrome/in-app browser on iOS). */
export function isIosSafariUa(ua: string): boolean {
  if (!isIosDeviceUa(ua)) return false;
  return (
    /Safari/i.test(ua) &&
    !/CriOS|FxiOS|OPiOS|EdgiOS|GSA|FBAN|FBAV|Instagram/i.test(ua)
  );
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

/** Custom window event to open the global iOS app install modal from any component. */
export const IOS_MODAL_EVENT = "uniz:open-ios-install-modal";

export function openIosDownloadModal(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(IOS_MODAL_EVENT));
}
