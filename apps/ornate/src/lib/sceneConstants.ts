import { getAssetUrl } from './assets';

// ─── Frame Counts ────────────────────────────────────────────────────────────
export const FRAME_COUNT_1 = 120;
export const FRAME_COUNT_2 = 120;
export const FRAME_COUNT_3 = 120;
export const FRAME_COUNT_4 = 120;
export const FRAME_COUNT_5 = 120;
export const FRAME_COUNT_6 = 120;
export const TOTAL_FRAMES =
    FRAME_COUNT_1 + FRAME_COUNT_2 + FRAME_COUNT_3 +
    FRAME_COUNT_4 + FRAME_COUNT_5 + FRAME_COUNT_6;

// ─── Asset Paths ─────────────────────────────────────────────────────────────
export const IMAGES_PATH_1 = getAssetUrl('/assets/scene-1a/2fab1575-3709-4e41-a285-dcfd5941cd13_');
export const IMAGES_PATH_2 = getAssetUrl('/assets/scene-1b/488422f7-dcac-4b00-a518-61d0d141a417_');
export const IMAGES_PATH_3 = getAssetUrl('/assets/scene-1c/5df2306f-4dfc-49e3-8e28-ab5bf923e625_');
export const IMAGES_PATH_4 = getAssetUrl('/assets/scene-1d/32c52baa-7487-46ea-9d58-a3f18f4ad9e3_');
export const IMAGES_PATH_5 = getAssetUrl('/assets/scene-1e/a2ca7121-d62c-4635-aee7-8e5e3bd2cc54_');
export const IMAGES_PATH_6 = getAssetUrl('/assets/scene-1f/bad9d594-cca8-496c-927d-0af09c3958c2_');

// ─── Scroll / Animation ──────────────────────────────────────────────────────
/** Lenis scrub factor shared by all ScrollTrigger instances */
export const SCRUB_FACTOR = 4.5;

/** vh/s speed for the auto-scroll in page.tsx */
export const AUTO_SCROLL_VH_PER_SEC = 54;

// ─── Text-overlay frame thresholds (global frame index) ──────────────────────
// Each entry: [showAt, hideAt, exitAt, restoreAt]
export const TEXT_THRESHOLDS = {
    text1: { exit: 49, restore: 40 },
    text2: { show: 79, hide: 65, exit: 164, restore: 150 },
    text3: { show: 186, hide: 175, exit: 223, restore: 212 },
    text4: { show: 283, hide: 273, exit: 305, restore: 294 },
    text5: { show: 311, hide: 300, exit: 356, restore: 345 },
    text6: { show: 374, hide: 363, exit: 419, restore: 408 },
    text7: { show: 429, hide: 418, exit: 479, restore: 468 },
    text8: { show: 509, hide: 498, exit: 569, restore: 558 },
    text9: { show: 595, hide: 584, exit: 644, restore: 633 },
    text10: { show: 660, hide: 649, exit: 713, restore: 702 },
} as const;
