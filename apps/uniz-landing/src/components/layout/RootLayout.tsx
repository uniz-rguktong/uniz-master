import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileAppModal } from "../MobileAppModal";

export function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <Header />
      <main className="flex-1 w-full bg-white">
        <Outlet />
      </main>
      <Footer />
      <MobileAppModal />
    </div>
  );
}
