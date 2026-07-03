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

  // useWebSocket(undefined, (msg) => {
  //   console.log("Real-time update signal:", msg);
  // });

  const shouldHideNavbar =
    location.pathname.startsWith("/student") ||
    location.pathname.startsWith("/admin") ||
    ["/studyspace", "/campushub"].includes(location.pathname);

  if (shouldHideNavbar) {
    return (
      <div
        className={`min-h-screen bg-white${location.pathname.includes("/admin") ? " min-w-[1280px]" : ""}`}
      >
        {children}
      </div>
    );
  }

  const isHomePage = location.pathname === "/";

  return (
    <div
      className={`min-h-screen flex flex-col ${isHomePage ? "bg-white" : "bg-white portal-page-shell"} text-zinc-900 selection:bg-[#D4E8F5] selection:text-[#0B2A47]`}
    >
      <Suspense fallback={<LoadingAnim />}>
        <Navbar />
      </Suspense>
      <main
        className={`flex-grow flex flex-col ${isHomePage ? "" : "max-w-[1600px] w-full mx-auto p-4 sm:p-6 md:p-10"} animate-in fade-in duration-500`}
      >
        <div className="flex-grow h-full w-full">{children}</div>
      </main>
    </div>
  );
}

const LoadingAnim = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#D4E8F5] rounded-full"></div>
        <div className="absolute w-12 h-12 border-4 border-[#0B2A47] border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
};
