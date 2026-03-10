import React, { Suspense } from "react";
import { Footer } from "./components/Footer";
import { useWebSocket } from "./hooks/useWebSocket";
import { useLocation } from "react-router-dom";

const Navbar = React.lazy(() => import("./components/Navbar"));

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  useWebSocket(undefined, (msg) => {
    console.log("Real-time update signal:", msg);
  });

  const shouldHideNavbar =
    location.pathname.startsWith("/student") ||
    location.pathname.startsWith("/admin") ||
    ["/studyspace", "/campushub"].includes(location.pathname);

  if (shouldHideNavbar) {
    return <div className="min-h-screen bg-slate-50/50">{children}</div>;
  }

  const isHomePage = location.pathname === "/";

  return (
    <div className={`min-h-screen flex flex-col ${isHomePage ? "bg-white" : "bg-premium-gradient"} text-slate-900 selection:bg-blue-100 selection:text-blue-900`}>
      <Suspense fallback={<LoadingAnim />}>
        <Navbar />
      </Suspense>
      <main className={`flex-grow flex flex-col ${isHomePage ? "" : "max-w-[1600px] w-full mx-auto p-4 sm:p-6 md:p-10"} animate-in fade-in duration-500`}>
        <div className="flex-grow h-full w-full">{children}</div>
      </main>
      <Footer />
    </div>
  );
}

const LoadingAnim = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-premium-gradient">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-200 rounded-full"></div>
        <div className="absolute w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
};
