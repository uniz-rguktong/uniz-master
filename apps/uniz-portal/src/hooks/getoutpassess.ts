import { useEffect, useCallback } from "react";
import { useSetRecoilState } from "recoil";
import { outpasses } from "../store";
import { GET_OUTPASS_REQUESTS } from "../api/endpoints";
import { useWebSocket } from "./useWebSocket";
import { useSmartPolling } from "./useSmartPolling";

export function useGetOutpasses(page = 1, limit = 50) {
  const setOutpasses = useSetRecoilState(outpasses);

  const getDetails = useCallback(async () => {
    const token = localStorage.getItem("admin_token");
    if (token) {
      try {
        const res = await fetch(
          `${GET_OUTPASS_REQUESTS}?page=${page}&limit=${limit}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${(token || '').replace(/"/g, '')}`,
            },
          },
        );
        const data = await res.json();
        if (data.success) {
          setOutpasses(data.outpasses);
        }
      } catch (err) {
        console.error("Failed to fetch outpasses", err);
      }
    }
  }, [setOutpasses]);

  useEffect(() => {
    getDetails();
  }, [getDetails]);

  useSmartPolling(getDetails, {
    activeInterval: 300000,
    fallbackInterval: 30000,
  });

  useWebSocket(undefined, (msg) => {
    if (msg.type === "REFRESH_REQUESTS") {
      if (msg.payload?.type === "outpass" || !msg.payload?.type) {
        console.log("WebSocket signal received: Refreshing Outpasses...");
        getDetails();
      }
    }
  });
}
