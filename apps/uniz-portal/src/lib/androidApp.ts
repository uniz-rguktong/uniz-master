/** Android TWA / APK client helpers (abcchess-style download banner). */

import {
  ANDROID_APK_URL,
  ANDROID_PACKAGE_ID,
  ANDROID_PLAY_STORE_URL,
} from "../constants/android";

export {
  ANDROID_APK_URL,
  ANDROID_PACKAGE_ID,
  ANDROID_PLAY_STORE_URL,
};

export const ANDROID_APK_FILENAME = "uniZ.apk";

export const APK_BANNER_HIDE_KEY = "uniz.apkBanner.hidden";
const APK_BANNER_LOGIN_KEY = "uniz.apkBanner.afterLogin";

export function isAndroidDownloadUa(ua: string | null | undefined): boolean {
  return Boolean(ua && /Android/i.test(ua));
}

/** A fresh sign-in should show the download strip again in this tab. */
export function noteAndroidDownloadLogin() {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(APK_BANNER_LOGIN_KEY, "1");
    sessionStorage.removeItem(APK_BANNER_HIDE_KEY);
  } catch {
    /* ignore */
  }
}

export function androidDownloadHiddenThisSession(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  try {
    if (sessionStorage.getItem(APK_BANNER_LOGIN_KEY) === "1") {
      sessionStorage.removeItem(APK_BANNER_LOGIN_KEY);
      return false;
    }
    return sessionStorage.getItem(APK_BANNER_HIDE_KEY) === "1";
  } catch {
    return false;
  }
}

export function hideAndroidDownloadForSession() {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(APK_BANNER_HIDE_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
}
