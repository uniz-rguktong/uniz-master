import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const MOBILE_VIEWPORT =
  "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
const ADMIN_DESKTOP_VIEWPORT =
  "width=1280, initial-scale=1.0, minimum-scale=0.25, maximum-scale=3.0, user-scalable=yes";

/**
 * On /admin routes, pin the layout viewport to desktop width so mobile
 * browsers render the admin UI like a desktop site (scroll/zoom as needed).
 */
export function useAdminDesktopViewport() {
  const { pathname } = useLocation();
  const isAdminRoute = pathname.includes("/admin");

  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (!meta) return;

    meta.setAttribute(
      "content",
      isAdminRoute ? ADMIN_DESKTOP_VIEWPORT : MOBILE_VIEWPORT,
    );

    return () => {
      meta.setAttribute("content", MOBILE_VIEWPORT);
    };
  }, [isAdminRoute]);
}
