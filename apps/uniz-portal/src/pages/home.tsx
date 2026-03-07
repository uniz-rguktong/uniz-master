import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useIsAuth } from "../hooks/is_authenticated";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Calendar,
  ArrowRight,
  ChevronRight,
  Activity,
} from "lucide-react";
import {
  PUBLIC_BANNERS,
  GET_NOTIFICATIONS,
  SYSTEM_HEALTH,
} from "../api/endpoints";

export default function Home() {
  useIsAuth();
  const navigate = useNavigate();
  const [banners, setBanners] = useState<any[]>([]);
  const [updates, setUpdates] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

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
          setUpdates(result.notifications.updates || []);
        }
      })
      .catch((error) => console.error(error));
  }, []);

  // AUTHENTIC API IMPLEMENTATION FOR SYSTEM HEALTH
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await fetch(SYSTEM_HEALTH);
        const result = await response.json();
        setHealth(result);
      } catch (error) {
        console.error("Health Check Error:", error);
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Sync auto-advance
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

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
    <div className="min-h-screen bg-white flex flex-col font-sans">


      {/* 100% DYNAMIC HERO SECTION */}
      {banners.length > 0 && (
        <section className="relative h-[80vh] min-h-[500px] bg-slate-900 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
              {/* Image & Gradient */}
              <div className="absolute inset-0">
                <img
                  src={banners[currentIndex].imageUrl}
                  className="w-full h-full object-cover scale-105"
                  alt=""
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent"></div>
              </div>

              {/* Text Content */}
              <div className="relative h-full w-full px-6 md:px-20 flex flex-col justify-center">
                <div className="max-w-6xl">
                  <motion.span
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="inline-block px-3 py-1 bg-[#800000] text-white text-[10px] font-black uppercase tracking-[0.3em] mb-6 rounded"
                  >
                    Campus Spotlight
                  </motion.span>
                  <motion.h1
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-5xl md:text-8xl font-black text-white mb-6 leading-none tracking-tighter"
                  >
                    {banners[currentIndex].title}
                  </motion.h1>
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg md:text-2xl text-slate-300 max-w-2xl leading-relaxed mb-10"
                  >
                    {banners[currentIndex].text}
                  </motion.p>
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex gap-4"
                  >
                    <button
                      onClick={() => navigate("/student/signin")}
                      className="px-10 py-4 bg-[#800000] text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-red-800 transition-all shadow-xl shadow-red-900/20 active:scale-95"
                    >
                      Sign In
                    </button>
                    <button className="px-10 py-4 border border-white/20 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-white/10 transition-all active:scale-95">
                      Explore
                    </button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Indicators */}
          <div className="absolute bottom-12 left-6 md:left-20 flex gap-2">
            {banners.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-500 ${i === currentIndex ? "w-12 bg-[#800000]" : "w-4 bg-white/20"}`}
              ></div>
            ))}
          </div>
        </section>
      )}

      {/* 100% DYNAMIC NOTIFICATIONS SECTION */}
      <section className="py-24 bg-white">
        <div className="w-full px-6 md:px-20">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
            <div className="space-y-4">
              <span className="flex items-center gap-2 text-[#800000] font-black uppercase tracking-widest text-[10px]">
                <Bell size={14} className="animate-bounce" /> Live News
              </span>
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">
                Latest <span className="text-[#800000]">Pulse</span>
              </h2>
            </div>
            <button className="text-slate-400 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 hover:text-[#800000] transition-colors">
              VIEW ARCHIVE <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {updates.length > 0 ? (
              updates.map((update, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  key={update.id}
                  className="group p-10 bg-slate-50 rounded-[3rem] border border-slate-100 hover:border-[#800000]/20 hover:bg-white hover:shadow-2xl transition-all flex flex-col h-full"
                >
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-white rounded-2xl group-hover:bg-[#800000] group-hover:text-white transition-all">
                      <Calendar size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {new Date(update.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-4 group-hover:text-[#800000] transition-colors line-clamp-2 leading-tight">
                    {update.title}
                  </h3>
                  <p className="text-slate-500 font-medium leading-relaxed mb-10 line-clamp-3">
                    {update.content}
                  </p>
                  <div className="mt-auto pt-6 border-t border-slate-100">
                    <a
                      href={update.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-black uppercase tracking-widest text-[#800000] flex items-center gap-1 hover:gap-2 transition-all"
                    >
                      READ DETAIL <ChevronRight size={12} />
                    </a>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-100">
                <p className="text-slate-300 font-black uppercase tracking-widest text-[10px]">
                  No active notifications
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* MINIMAL FOOTER */}
      <footer className="mt-auto bg-slate-900 py-12 px-6 md:px-20">
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.6em]">
            UNIZ &bull; 2026 UNIVERSITY PORTAL
          </p>

          {health && (
            <div className="flex items-center gap-4 pl-6 border-l border-white/10">
              <div className="flex items-center gap-2">
                <div
                  className={`w-1.5 h-1.5 rounded-full animate-pulse ${health.status === "ok" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-amber-500"}`}
                ></div>
                <span className="text-white/40 text-[9px] font-bold uppercase tracking-widest">
                  Systems {health.status === "ok" ? "Active" : "Degraded"}
                </span>
              </div>

              <div className="flex items-center gap-2 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                <Activity size={10} className="text-emerald-500" />
                <span className="text-[8px] font-bold text-white/40 uppercase tracking-tighter">
                  Live Monitor
                </span>
              </div>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
