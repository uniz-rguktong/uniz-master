import React, { Suspense } from "react";
// WebSocket side channel not deployed — polling handles refresh today.
// import { useWebSocket } from "./hooks/useWebSocket";
import { useAdminDesktopViewport } from "./hooks/useAdminDesktopViewport";
import { useLocation } from "react-router-dom";
import { usePortalTheme } from "./hooks/usePortalTheme";

const Navbar = React.lazy(() => import("./components/Navbar"));

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  usePortalTheme();

  useAdminDesktopViewport();

  const shouldHideNavbar =
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
