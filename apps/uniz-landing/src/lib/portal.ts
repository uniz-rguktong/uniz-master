export const PORTAL_URL = "https://uniz.rguktong.in";

/** Optional mirror of the portal outpass flag. Unset in the default build. */
export const SHOW_OUTPASS = import.meta.env.VITE_SHOW_OUTPASS === "true";

export function portalPath(path: string) {
  return `${PORTAL_URL}${path}`;
}
