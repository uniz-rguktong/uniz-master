import { useEffect, useCallback } from "react";
import { useSetRecoilState } from "recoil";
import { offCampus } from "../store";
import { STUDENT_OUTSIDE_CAMPUS } from "../api/endpoints";
import { useSmartPolling } from "./useSmartPolling";

export function useOutsideCampus() {
  const setOffCampus = useSetRecoilState(offCampus);

  const getDetails = useCallback(async () => {
    const token = localStorage.getItem("admin_token");
    if (token) {
      try {
        const res = await fetch(STUDENT_OUTSIDE_CAMPUS, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(token || '').replace(/"/g, '')}`,
          },
        });
        const data = await res.json();
        if (data.success) {
          setOffCampus(data.students);
        }
      } catch (e) {
        console.error("Failed to fetch outside campus students", e);
      }
    }
  }, [setOffCampus]);

  useEffect(() => {
    getDetails();
  }, [getDetails]);

  useSmartPolling(getDetails, {
    activeInterval: 300000,
    fallbackInterval: 30000,
  });
}
