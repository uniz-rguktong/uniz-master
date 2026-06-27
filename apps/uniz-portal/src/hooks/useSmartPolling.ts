import { useEffect, useRef, useCallback } from "react";
// import { useWebSocket } from "./useWebSocket";

/**
 * useSmartPolling - Polls on a fixed interval while the tab is visible.
 * WebSocket-aware fast/slow switching is disabled until a side channel exists.
 */
export function useSmartPolling(
  fetcher: () => void,
  options: {
    activeInterval?: number;
    fallbackInterval?: number;
    disabled?: boolean;
  } = {},
) {
  const {
    fallbackInterval = 30000,
    disabled = false,
  } = options;

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

    const intervalTime = fallbackInterval;

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
  }, [fallbackInterval, disabled, runTick]);
}
