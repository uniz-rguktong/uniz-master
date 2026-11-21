import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileAppModal } from "../MobileAppModal";
import { CampusBoot } from "../CampusBoot";
import { SiteContentProvider } from "../SiteContent";

export function RootLayout() {
  return (
    <SiteContentProvider>
    <div className="flex min-h-screen flex-col bg-bg text-text">
      <a href="#content" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="content" className="w-full flex-1">
        <Suspense fallback={<CampusBoot label="Loading page" />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <MobileAppModal />
    </div>
    </SiteContentProvider>
  );
}
