export const ANDROID_APK_URL = "/download/uniz.apk";
export const ANDROID_APK_FILENAME = "uniZ.apk";
export const IOS_PROFILE_URL = "/download/uniz-ios.mobileconfig";
export const IOS_PROFILE_FILENAME = "uniZ-iOS.mobileconfig";
export const OPEN_IOS_MODAL_EVENT = "uniz-landing:open-ios-modal";

export function openLandingIosModal() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OPEN_IOS_MODAL_EVENT));
  }
}
