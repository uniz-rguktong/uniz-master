import React, { Suspense, useEffect } from "react";
// WebSocket side channel not deployed — polling handles refresh today.
// import { useWebSocket } from "./hooks/useWebSocket";
import { useAdminDesktopViewport } from "./hooks/useAdminDesktopViewport";
import { useLocation } from "react-router-dom";
import { forceLightTheme } from "./lib/forceLightTheme";
import { hasPortalSession } from "./utils/portalSession";

const Navbar = React.lazy(() => import("./components/Navbar"));

interface LayoutProps {
  children: React.ReactNode;
}

// Public pages paint their own top bar (PublicHeader, or a redirect onto one).
// The shell Navbar would stack a second navy bar, and its fixed offset leaves
// a white gap between the two.
function routePaintsOwnHeader(pathname: string): boolean {
  const path =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;
  if (
    path === "/" ||
    path === "/privacy" ||
    path === "/login" ||
    path === "/signin" ||
    path === "/student-project-management" ||
    path === "/college-team-collaboration" ||
    path === "/academic-task-tracker"
  ) {
    return true;
  }
  return path === "/blog" || path.startsWith("/blog/");
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  useEffect(() => {
    forceLightTheme();
  }, []);

  useAdminDesktopViewport();

  const developersIsPublic =
    location.pathname === "/developers" && !hasPortalSession();

  const shouldHideNavbar =
    developersIsPublic ||
    routePaintsOwnHeader(location.pathname) ||
    location.pathname.startsWith("/student") ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/faculty") ||
    ["/studyspace", "/campushub"].includes(location.pathname);

  if (shouldHideNavbar) {
    return (
      <div
        className="min-h-screen overflow-x-hidden bg-bg text-text"
      >
        {children}
      </div>
    );
  }

  const isHomePage = location.pathname === "/";

  return (
    <div
      className={`flex flex-col ${isHomePage ? "min-h-screen bg-bg" : "min-h-screen bg-bg pt-16"} text-text`}
    >
      <Suspense fallback={<LoadingAnim />}>
        <Navbar />
      </Suspense>
      <main
        className={`flex min-h-0 flex-1 flex-col ${isHomePage ? "" : "max-w-[1600px] w-full mx-auto p-4 sm:p-6 md:p-10"} animate-in fade-in duration-500`}
      >
        <div className="flex min-h-0 w-full flex-1 flex-col">{children}</div>
      </main>
    </div>
  );
}

const LoadingAnim = () => {
  return (
    <div className="h-16 border-b border-border bg-navy-900" aria-hidden />
  );
};
