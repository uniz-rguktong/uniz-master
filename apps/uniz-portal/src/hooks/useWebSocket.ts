/**
 * WebSocket side channel — DISABLED.
 *
 * Planned for instant REFRESH_REQUESTS signals (outpass/outing status updates).
 * No server endpoint is deployed yet; polling + Web Push cover live updates today.
 *
 * Re-enable by restoring this hook and setting VITE_WS_URL when the backend exists.
 */

/*
import { useEffect, useRef, useCallback, useState } from "react";

type WebSocketMessage = {
  type: string;
  payload?: any;
};

// ... previous implementation ...
*/

export const useWebSocket = (
  _url?: string,
  _onMessage?: (msg: { type: string; payload?: unknown }) => void,
) => ({
  isConnected: false,
});
