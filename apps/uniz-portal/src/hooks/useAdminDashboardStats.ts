import { useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import { adminDashboardStatsAtom } from "../store/atoms";
import { ANALYTICS_ADMIN_SUMMARY } from "../api/endpoints";

export function useAdminDashboardStats(
  role: string,
  department?: string,
) {
  const [cached, setCached] = useRecoilState(adminDashboardStatsAtom);
  const [loading, setLoading] = useState(!cached.fetched);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!cached.fetched) setLoading(true);
        const token = (
          localStorage.getItem("admin_token") || ""
        ).replace(/"/g, "");
        if (!token) {
          setLoading(false);
          return;
        }
        const res = await fetch(ANALYTICS_ADMIN_SUMMARY(role, department), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const json = await res.json();
        if (json.success && json.data) {
          setCached({ fetched: true, data: json.data });
        }
      } catch (err) {
        console.error("[useAdminDashboardStats] fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [role, department]);

  return { data: cached.data, loading };
}
