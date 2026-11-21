import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileAppModal } from "../MobileAppModal";

export function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-bg text-text">
      <a href="#content" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="content" className="w-full flex-1">
        <Outlet />
      </main>
      <Footer />
      <MobileAppModal />
    </div>
  );
}
