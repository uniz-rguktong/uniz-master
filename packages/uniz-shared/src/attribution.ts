/**
 * Single API response credit for UniZ JSON payloads.
 * Prefer top-level `attribution` only — do not duplicate under `meta`.
 */
export const API_ATTRIBUTION = "SreeCharan Desu";

/**
 * Attach platform attribution to a JSON response body and strip the legacy
 * `meta.attribution` duplicate when present.
 */
export function applyApiAttribution(body: Record<string, unknown>): void {
  body.attribution = API_ATTRIBUTION;

  const meta = body.meta;
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    const metaObj = meta as Record<string, unknown>;
    delete metaObj.attribution;
    if (Object.keys(metaObj).length === 0) {
      delete body.meta;
    }
  }
}
