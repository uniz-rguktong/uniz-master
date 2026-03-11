import "./index.css";

// Layout
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";

// Sections
import { HeroSection } from "./components/sections/HeroSection";
import { NotificationsSection } from "./components/sections/NotificationsSection";
import { AboutSection } from "./components/sections/AboutSection";
import { DepartmentsSection } from "./components/sections/DepartmentsSection";
import { EcosystemSection } from "./components/sections/EcosystemSection";

export default function App() {
  return (
    <div className="min-h-screen bg-white selection:bg-accent/10 selection:text-accent">

      <Header />
      <HeroSection />

      <NotificationsSection />

      <AboutSection />

      <DepartmentsSection />

      <EcosystemSection />

      <Footer />

    </div>
  );
}
