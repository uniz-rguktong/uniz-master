// ─── Shared Scene Types ───────────────────────────────────────────────────────

/** Auth mode passed between Header warp trigger → SceneOne auth form */
export type AuthMode = 'login' | 'register';

/** Props for the main SceneOne canvas component */
export interface SceneOneProps {
    introComplete?: boolean;
}

/** Visibility state for all 10 text overlays */
export interface SceneTextState {
    showScene1aText: boolean;
    showScene1bText: boolean;
    showScene3Text: boolean;
    showScene4Text: boolean;
    showScene5Text: boolean;
    showScene6Text: boolean;
    showScene7Text: boolean;
    showScene8Text: boolean;
    showScene9Text: boolean;
    showScene10Text: boolean;
}

/** Props accepted by the SceneTextOverlays component */
export interface SceneTextOverlaysProps extends SceneTextState {
    isWarpingActive: boolean;
    authMode: AuthMode;
    onAuthSuccess: () => void;
}
