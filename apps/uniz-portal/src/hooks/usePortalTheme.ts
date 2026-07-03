import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Routes that keep the marketing / landing palette. */
const LANDING_PATHS = new Set([
  "/",
  "/student-project-management",
  "/college-team-collaboration",
  "/academic-task-tracker",
]);

function isLandingPath(pathname: string) {
  if (LANDING_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/blog")) return true;
  return false;
}

export function usePortalTheme() {
  const { pathname } = useLocation();

  useEffect(() => {
    const root = document.documentElement;
    const enabled = !isLandingPath(pathname);

    root.classList.toggle("portal-theme", enabled);
    document.body.classList.toggle("portal-theme", enabled);

    return () => {
      root.classList.remove("portal-theme");
      document.body.classList.remove("portal-theme");
    };
  }, [pathname]);
}
