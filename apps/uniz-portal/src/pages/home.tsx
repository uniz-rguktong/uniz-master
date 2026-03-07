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
  ChevronDown,
  Users,
  BookOpen,
  ClipboardList,
  Code,
  Cpu,
  Zap,
  Settings,
  Building,
  MapPin,
  ShieldCheck,
  GraduationCap,
  Mail,
  ExternalLink,
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

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const menuData: any = {
    Academics: [
      {
        title: "Faculty",
        desc: "Meet our dedicated academic experts and researchers.",
        icon: Users,
        path: "/academics/faculty",
      },
      {
        title: "Rules & Regulations",
        desc: "Comprehensive guidelines for institutional conduct.",
        icon: BookOpen,
        path: "/academics/rules",
      },
      {
        title: "Academic Calendar",
        desc: "Key dates and milestones for the academic year.",
        icon: Calendar,
        path: "/academics/calendar",
      },
      {
        title: "Exam Cell",
        desc: "Examination schedules, results, and notifications.",
        icon: ClipboardList,
        path: "/examcell",
      },
    ],
    Departments: [
      {
        title: "Computer Science",
        desc: "Innovating the future of engineering and AI.",
        icon: Code,
        path: "/departments/cse",
      },
      {
        title: "Electronics & Comm.",
        desc: "Advancing communication technologies.",
        icon: Cpu,
        path: "/departments/ece",
      },
      {
        title: "Mechanical Eng.",
        desc: "Engineering the physical world of tomorrow.",
        icon: Settings,
        path: "/departments/mech",
      },
      {
        title: "Electrical Eng.",
        desc: "Powering systems and sustainable energy.",
        icon: Zap,
        path: "/departments/eee",
      },
      {
        title: "Civil Engineering",
        desc: "Building sustainable infrastructure.",
        icon: Building,
        path: "/departments/civil",
      },
    ],
    Campus: [
      {
        title: "Infrastructure",
        desc: "Explore our state-of-the-art campus facilities.",
        icon: MapPin,
        path: "/institute/campus",
      },
      {
        title: "Administration",
        desc: "Our leadership and organizational structure.",
        icon: ShieldCheck,
        path: "/institute/administration",
      },
      {
        title: "Alumni Network",
        desc: "Connecting with our global community.",
        icon: GraduationCap,
        path: "/institute/alumni",
      },
      {
        title: "Contact Us",
        desc: "Get in touch with our institutional helpdesk.",
        icon: Mail,
        path: "/contact-us",
      },
    ],
  };

  const NavItem = ({
    label,
    hasDropdown,
  }: {
    label: string;
    hasDropdown?: boolean;
  }) => (
    <div
      className="relative"
      onMouseEnter={() => hasDropdown && setActiveDropdown(label)}
      onMouseLeave={() => hasDropdown && setActiveDropdown(null)}
    >
      <button
        className={`flex items-center gap-1.5 px-4 py-2 text-[14px] font-semibold transition-all duration-300 ${
          activeDropdown === label
            ? "text-slate-900 bg-slate-50 rounded-lg"
            : "text-slate-500 hover:text-slate-900 hover:bg-slate-50/50 rounded-lg"
        }`}
      >
        {label}
        {hasDropdown && (
          <ChevronDown
            size={13}
            className={`transition-transform duration-300 ${activeDropdown === label ? "rotate-180" : ""}`}
          />
        )}
      </button>

      <AnimatePresence>
        {activeDropdown === label && hasDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-1/2 -translate-x-1/2 top-full pt-3 z-[100]"
          >
            <div
              className={`bg-white rounded-[28px] shadow-[0_30px_60px_rgba(0,0,0,0.12)] border border-slate-100 p-6 ${label === "Departments" ? "w-[840px]" : "w-[640px]"}`}
            >
              <div
                className={`grid gap-2 ${label === "Departments" ? "grid-cols-3" : "grid-cols-2"}`}
              >
                {menuData[label]?.map((item: any) => (
                  <button
                    key={item.title}
                    onClick={() => {
                      navigate(item.path);
                      setActiveDropdown(null);
                    }}
                    className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all group text-left"
                  >
                    <div className="mt-0.5 p-2 bg-slate-50 border border-slate-100/50 rounded-xl group-hover:bg-white group-hover:shadow-md transition-all text-slate-400 group-hover:text-slate-900 shrink-0">
                      <item.icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[14px] font-bold text-slate-900 mb-0.5 flex items-center gap-1.5">
                        {item.title}
                        <ExternalLink
                          size={10}
                          className="opacity-0 group-hover:opacity-40 transition-opacity"
                        />
                      </h4>
                      <p className="text-[12px] text-slate-500 font-medium leading-normal line-clamp-2">
                        {item.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* HIGH-FIDELITY HEADER (CAL.COM INSPIRED) */}
      <header className="sticky top-0 z-[100] bg-white/70 backdrop-blur-2xl border-b border-slate-100 px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => navigate("/")}
            >
              <div className="flex items-center justify-center w-full p-6 bg-transparent shrink-0">
                <span className="unifrakturcook-bold text-3xl text-slate-800 tracking-tight leading-none">
                  uniZ
                </span>
              </div>
            </div>

            {/* Nav Menu Items */}
            <nav className="hidden lg:flex items-center gap-1">
              <NavItem label="Academics" hasDropdown />
              <NavItem label="Departments" hasDropdown />
              <NavItem label="Campus" hasDropdown />
              <button
                onClick={() => navigate("/examcell")}
                className="px-4 py-2 text-[14px] font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all rounded-lg"
              >
                Exams
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-5">
            <button
              onClick={() => navigate("/student/signin")}
              className="text-[14px] font-bold text-slate-500 hover:text-slate-900 transition-colors"
            >
              Sign in
            </button>
            <button
              onClick={() => navigate("/student/signin")}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[14px] font-bold shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-1.5"
            >
              Get started <ChevronRight size={14} className="mt-0.5" />
            </button>
          </div>
        </div>
      </header>

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
