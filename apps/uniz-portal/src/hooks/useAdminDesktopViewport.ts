import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const MOBILE_VIEWPORT =
  "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";

/**
 * Keep the layout viewport at device width so the admin shell can use its
 * drawer below 821px instead of forcing a 1280px desktop canvas.
 */
export function useAdminDesktopViewport() {
  const { pathname } = useLocation();
  const isAdminRoute =
    pathname.includes("/admin") || pathname.startsWith("/faculty");

  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (!meta) return;

    meta.setAttribute("content", MOBILE_VIEWPORT);

    return () => {
      meta.setAttribute("content", MOBILE_VIEWPORT);
    };
  }, [isAdminRoute]);
}
