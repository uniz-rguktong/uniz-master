import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1 w-full bg-white">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
