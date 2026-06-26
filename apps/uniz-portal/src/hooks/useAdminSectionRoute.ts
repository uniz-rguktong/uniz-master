import { useCallback, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getAdminSectionPath,
  resolveAdminSectionTab,
} from "@/utils/adminSectionRoutes";

/**
 * Sync AdminShell active tab with `/admin/...` URLs.
 */
export function useAdminSectionRoute<T extends string>(
  allowedTabs: readonly T[],
  defaultTab: T = "dashboard" as T,
) {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = useMemo(() => {
    const resolved = resolveAdminSectionTab(location.pathname, allowedTabs);
    if (resolved && allowedTabs.includes(resolved as T)) {
      return resolved as T;
    }
    return defaultTab;
  }, [location.pathname, allowedTabs, defaultTab]);

  useEffect(() => {
    const rest = location.pathname.replace(/^\/admin\/?/, "").replace(/\/$/, "");
    if (!rest) return;

    const resolved = resolveAdminSectionTab(location.pathname, allowedTabs);
    if (resolved === null || !allowedTabs.includes(resolved as T)) {
      navigate(getAdminSectionPath(defaultTab), { replace: true });
    }
  }, [location.pathname, allowedTabs, defaultTab, navigate]);

  const setActiveTab = useCallback(
    (tab: T) => {
      navigate(getAdminSectionPath(tab));
    },
    [navigate],
  );

  return { activeTab, setActiveTab };
}
