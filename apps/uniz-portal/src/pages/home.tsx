import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useIsAuth } from "../hooks/is_authenticated";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  Lock,
  Smartphone,
  Download,
} from "lucide-react";
import { PUBLIC_BANNERS, GET_NOTIFICATIONS } from "../api/endpoints";
import FeaturedCarousel from "../components/FeaturedCarousel";
import { Timeline } from "../components/ui/timeline";
import DatabaseWithRestApi from "../components/ui/database-with-rest-api";
import { Features } from "../components/ui/features-9";
import GlobeFeature from "../components/ui/globe-feature-section";

export default function Home() {
  useIsAuth();
  const navigate = useNavigate();
  const [banners, setBanners] = useState<any[]>([]);

  const timelineData = [
    {
      title: "Install the application",
      subtitle: "Campus in your pocket",
      step: "Step 01",
      icon: Smartphone,
      content: (
        <div className="space-y-6">
          <p className="text-slate-500 font-medium text-lg leading-relaxed">
            UniZ is built with cutting-edge PWA technology. This means you can
            install the platform directly on your mobile device or desktop for a
            lightning-fast, native experience—completely bypassing traditional
            app stores.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.alert(
                  "Installation Guide: \n\n1. Open this page in Safari (iOS) or Chrome (Android)\n2. Tap the 'Share' or 'Menu' icon\n3. Select 'Add to Home Screen'\n\nUniZ is now ready in your app drawer!",
                );
              }}
              className="group flex items-center gap-3 px-8 py-4 bg-slate-950 text-white rounded-full font-black text-sm shadow-2xl hover:bg-blue-600 transition-all active:scale-95 no-underline"
            >
              <Download
                size={20}
                strokeWidth={2.5}
                className="group-hover:-translate-y-1 transition-transform"
              />
              Download Portal App
            </a>
          </div>
          <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 max-w-xl">
            <h5 className="font-black text-slate-900 mb-4 tracking-tight">
              App Experience Features
            </h5>
            <ul className="space-y-3">
              {[
                "Instant loading with offline support",
                "Biometric secure authentication",
                "Real-time push notifications",
              ].map((point, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 text-slate-600 text-sm font-bold"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: "Secure your access",
      subtitle: "Live Academic Dashboard",
      step: "Step 02",
      icon: Lock,
      content: (
        <div className="space-y-6">
          <p className="text-slate-500 font-medium text-lg leading-relaxed">
            Gain a God's-eye view of your university credentials. Our platform
            mirrors your official records in real-time digital twins. Track
            exact GPA numbers and attendance thresholds automatically.
          </p>
          <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 max-w-xl">
            <h5 className="font-black text-slate-900 mb-4 tracking-tight">
              Live Academic Dashboard
            </h5>
            <ul className="space-y-3">
              {[
                "Real-time SGPA & CGPA tracking",
                "Multi-department resource sync",
                "Proactive attendance analysis",
              ].map((point, pointIdx) => (
                <li
                  key={pointIdx}
                  className="flex items-center gap-3 text-slate-600 text-sm font-bold"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: "Master your campus",
      subtitle: "Unified Mobility Hub",
      step: "Step 03",
      icon: Activity,
      content: (
        <div className="space-y-6">
          <p className="text-slate-500 font-medium text-lg leading-relaxed">
            Take full control of your campus mobility. Request smart outpasses,
            track results, and receive broadcast alerts directly. It's not just
            checking boxes; it's understanding the pulse of your university
            life.
          </p>
          <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 max-w-xl">
            <h5 className="font-black text-slate-900 mb-4 tracking-tight">
              Unified Mobility Hub
            </h5>
            <ul className="space-y-3">
              {[
                "Smart Outpass automation",
                "Grievance resolution tracking",
                "Global campus broadcasts",
              ].map((itemText, itemIdx) => (
                <li
                  key={itemIdx}
                  className="flex items-center gap-3 text-slate-600 text-sm font-bold"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                  {itemText}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ),
    },
  ];

  // AUTHENTIC API IMPLEMENTATION FOR BANNERS
  useEffect(() => {
    const myHeaders = new Headers();
    myHeaders.append("x-cms-api-key", "uniz-landing-v1-key");

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow" as RequestRedirect,
    };

    fetch(PUBLIC_BANNERS, requestOptions)
      .then((response) => response.json())
      .then((result) => {
        if (result.success) {
          setBanners(result.banners || []);
        }
      })
      .catch((error) => console.error(error));
  }, []);

  // AUTHENTIC API IMPLEMENTATION FOR NOTIFICATIONS
  useEffect(() => {
    const myHeaders = new Headers();
    myHeaders.append("x-cms-api-key", "uniz-landing-v1-key");

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow" as RequestRedirect,
    };

    fetch(GET_NOTIFICATIONS, requestOptions)
      .then((response) => response.json())
      .then((result) => {
        if (result.success && result.notifications) {
          // Notifications data remains but we no longer display the list
        }
      })
      .catch((error) => console.error(error));
  }, []);
  // Admin access
  useEffect(() => {
    let keys = "";
    const track = (e: KeyboardEvent) => {
      keys += e.key.toLowerCase();
      if (keys.endsWith("admin")) navigate("/admin/signin");
      keys = keys.slice(-10);
    };
    window.addEventListener("keydown", track);
    return () => window.removeEventListener("keydown", track);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-sans">
      {/* CENTERED PREMIUM HERO SECTION */}
      <section className="relative min-h-[75vh] flex flex-col items-center justify-center bg-transparent overflow-hidden pt-6 pb-10 px-[9px]">
        <div className="absolute top-0 inset-x-0 h-full bg-grid opacity-20 pointer-events-none"></div>

        <div className="w-full z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative w-full border border-slate-100 rounded-[3rem] px-[9px] py-12 md:py-20 bg-transparent shadow-[0_32px_64px_-16px_rgba(0,0,0,0.02)] flex flex-col items-center text-center overflow-hidden"
          >
            {/* Background Accent */}

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-6xl md:text-9xl font-black text-slate-950 tracking-[-0.05em] leading-[0.9] mb-10 max-w-5xl"
            >
              The intelligent way to <br />
              <span className="text-slate-400">master your</span> campus life.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-lg md:text-2xl text-slate-500 font-medium leading-relaxed mb-14 max-w-2xl"
            >
              Fully customizable university software for students, faculty and
              admins. <br className="hidden md:block" />
              From tracking grades to managing outpasses, UniZ handles it all.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-5 items-center justify-center w-full"
            >
              <button
                onClick={(e) => {
                  e.preventDefault();
                  window.alert("Installation Guide: \n\n1. Open this page in Safari (iOS) or Chrome (Android)\n2. Tap the 'Share' or 'Menu' icon\n3. Select 'Add to Home Screen'\n\nUniZ is now ready in your app drawer!");
                }}
                className="px-10 py-5 bg-white border-2 border-slate-950 text-slate-950 rounded-[2rem] text-[16px] font-bold shadow-sm hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Download size={20} />
                Install application
              </button>
              <button
                onClick={() => navigate("/student/signin")}
                className="px-10 py-5 bg-slate-950 text-white rounded-[2rem] text-[16px] font-bold shadow-2xl shadow-slate-300 hover:bg-slate-800 hover:shadow-slate-400 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-2 group w-full sm:w-auto"
              >
                Student Login
                <ArrowUpRight size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FEATURED NOTIFICATIONS CAROUSEL */}
      <FeaturedCarousel
        items={banners.map((b, i) => ({
          id: b.id || i,
          imageUrl: b.imageUrl,
          title: b.title,
          tag: i % 2 === 0 ? "Featured" : "New Update",
          hasHeart: true,
        }))}
      />

      {/* GETTING STARTED TIMELINE */}
      <div className="px-[9px]">
        <Timeline data={timelineData} />
      </div>

      {/* DATABASE REST API COMPONENT INTEGRATION */}
      <div className="w-full px-6 flex flex-col items-center pb-32 pt-32 md:pt-48">
        <div className="mb-16 text-left w-full max-w-7xl px-4 md:px-8">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-6">
            Everything your campus needs,
            <br className="hidden md:block" />
            <span className="text-slate-400">managed seamlessly.</span>
          </h2>
          <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-2xl">
            Eliminate operational friction with smart syncing connecting
            students, faculty and admin seamlessly.
          </p>
        </div>
        <DatabaseWithRestApi />
      </div>

      {/* SYSTEM HEALTH AND ACTIVITY DASHBOARD */}
      <Features />

      {/* GLOBAL CONNECTIVITY FEATURE - FULL WIDTH */}
      <div className="w-full bg-transparent mt-0 flex flex-col items-center">
        <GlobeFeature />
      </div>
    </div>
  );
}
