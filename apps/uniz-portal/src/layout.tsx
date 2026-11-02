import React, { Suspense } from "react";
// WebSocket side channel not deployed — polling handles refresh today.
// import { useWebSocket } from "./hooks/useWebSocket";
import { useAdminDesktopViewport } from "./hooks/useAdminDesktopViewport";
import { useLocation } from "react-router-dom";
import { usePortalTheme } from "./hooks/usePortalTheme";
import { CampusBoot } from "./components/CampusBoot";

const Navbar = React.lazy(() => import("./components/Navbar"));

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  usePortalTheme();

  useAdminDesktopViewport();

  // useWebSocket(undefined, (msg) => {
  //   console.log("Real-time update signal:", msg);
  // });

  const shouldHideNavbar =
    location.pathname.startsWith("/student") ||
    location.pathname.startsWith("/faculty") ||
    location.pathname.startsWith("/admin") ||
    ["/studyspace", "/campushub"].includes(location.pathname);

  if (shouldHideNavbar) {
    return (
      <div
 className={`campus-canvas min-h-screen bg-surface overflow-x-hidden${location.pathname.includes("/admin") ? " min-w-[1280px]" : ""}`}
      >
        {children}
      </div>
    );
  }

  const isHomePage = ["/", "/developers", "/privacy"].includes(location.pathname);
  const isPortalHome = location.pathname === "/";

  return (
    <div
 className={`campus-canvas min-h-screen flex flex-col ${isHomePage ? "bg-white" : "bg-white portal-page-shell"} text-ink`}
    >
      <Suspense fallback={<LoadingAnim />}>
        <Navbar />
      </Suspense>
      <main
        className={`flex-grow flex flex-col ${isHomePage ? "" : "max-w-[1600px] w-full mx-auto p-4 sm:p-6 md:p-10"} ${isPortalHome ? "" : "animate-in fade-in duration-500"}`}
      >
        <div className="flex-grow h-full w-full">{children}</div>
      </main>
    </div>
  );
}

const LoadingAnim = () => <CampusBoot />;
