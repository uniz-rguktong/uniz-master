import { useEffect, useRef, useCallback } from "react";
import { useWebSocket } from "./useWebSocket";

/**
 * useSmartPolling - A hook that fetches data at dynamic intervals
 * - Polls frequently (e.g. 30s) if WebSocket is disconnected or restricted.
 * - Polls rarely (e.g. 5m) if WebSocket is active (heartbeat fallback).
 * - Pauses polling when the window/tab is hidden to save resources.
 */
export function useSmartPolling(
  fetcher: () => void,
  options: {
    activeInterval?: number; // ms during active usage with WS
    fallbackInterval?: number; // ms when WS is disconnected
    disabled?: boolean;
  } = {},
) {
  const {
    activeInterval = 300000, // 5 minutes heartbeat if WS is on
    fallbackInterval = 30000, // 30 seconds if WS is off
    disabled = false,
  } = options;

  const { isConnected } = useWebSocket(undefined);
  const fetcherRef = useRef(fetcher);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const runTick = useCallback(() => {
    // Don't poll if disabled or page is hidden
    if (disabled || document.visibilityState === "hidden") return;
    fetcherRef.current();
  }, [disabled]);

  useEffect(() => {
    if (disabled) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const intervalTime = isConnected ? activeInterval : fallbackInterval;

    // Initial fetch if needed (optional, hooks usually fetch on mount separately)
    // but here we just manage the timer.

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(runTick, intervalTime);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Immediate fetch when coming back to tab
        runTick();
        // Reset interval to ensure fresh timing
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(runTick, intervalTime);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isConnected, activeInterval, fallbackInterval, disabled, runTick]);
}
