import { motion } from "framer-motion";
import {
  ShieldCheck,
  GraduationCap,
  BellRing,
  ClipboardCheck,
  MonitorCheck,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import "./index.css";

export default function App() {
  const features = [
    {
      icon: <GraduationCap size={24} />,
      title: "Academic Core",
      description:
        "Standardized grade management, attendance tracking, and curriculum workflows for university departments.",
    },
    {
      icon: <ClipboardCheck size={24} />,
      title: "Request Management",
      description:
        "Streamlined outpass and outing approval systems with digital verification and security logs.",
    },
    {
      icon: <BellRing size={24} />,
      title: "Unified Pulse",
      description:
        "Real-time communication bridge for campus-wide alerts, news, and critical departmental updates.",
    },
    {
      icon: <ShieldCheck size={24} />,
      title: "Secure Access",
      description:
        "Role-based authentication architecture ensuring data integrity for students, faculty, and administration.",
    },
    {
      icon: <MonitorCheck size={24} />,
      title: "Infrastructure Status",
      description:
        "Integrated system monitoring for API gateways, databases, and microservice health across the cluster.",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-slate-100 py-6">
        <div className="container flex justify-between items-center px-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#001f3f] rounded flex items-center justify-center text-white font-black text-xl">
              U
            </div>
            <div className="flex flex-col">
              <span className="font-black text-slate-900 leading-none tracking-tight">
                RGUKT ONGOLE
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                University Resource Portal
              </span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="https://uniz.rguktong.in"
              className="text-xs font-bold text-slate-500 hover:text-[#800000] uppercase tracking-widest"
            >
              Student Portal
            </a>
            <a
              href="https://ornate-ems.rguktong.in"
              className="text-xs font-bold text-slate-500 hover:text-[#800000] uppercase tracking-widest"
            >
              Ornate EMS
            </a>
            <button
              onClick={() =>
                (window.location.href =
                  "https://uniz.rguktong.in/student/signin")
              }
              className="px-6 py-2.5 bg-[#800000] text-white text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-black transition-all"
            >
              Sign In
            </button>
          </nav>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="pt-48 pb-32 bg-slate-50 border-b border-slate-100">
        <div className="container px-10">
          <div className="max-w-4xl">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[#800000] font-black uppercase tracking-[0.4em] text-[10px] mb-6 block"
            >
              System Overview & Infrastructure
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl md:text-8xl font-black text-slate-900 leading-[0.9] tracking-tighter mb-10"
            >
              University Management, <br />
              <span className="text-[#001f3f]">Refined.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl text-slate-500 leading-relaxed font-medium max-w-2xl mb-12"
            >
              The central operational hub for RGUKT Ongole. Integrated academic
              administration, security protocols, and student services on a
              high-availability infrastructure.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex gap-4"
            >
              <button
                onClick={() =>
                  (window.location.href = "https://uniz.rguktong.in")
                }
                className="group flex items-center gap-3 px-8 py-5 bg-[#001f3f] text-white rounded-xl shadow-2xl shadow-blue-900/10 hover:bg-black transition-all"
              >
                <span className="text-[12px] font-black uppercase tracking-widest">
                  Access Services
                </span>
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>
              <button
                onClick={() => (window.location.href = "#features")}
                className="px-8 py-5 border border-slate-200 text-slate-600 rounded-xl hover:bg-white hover:border-slate-300 transition-all text-[12px] font-black uppercase tracking-widest"
              >
                Features & Modules
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section id="features" className="py-40 bg-white">
        <div className="container px-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter mb-6">
                Modular <span className="text-[#800000]">Ecosystem</span>
              </h2>
              <p className="text-lg text-slate-500 font-medium">
                Built on a microservices architecture, our platform provides
                specialized modules for every university operation while
                maintaining a unified data layer.
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Cluster Active
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-10 bg-slate-50 rounded-[2.5rem] border border-slate-50 hover:bg-white hover:border-[#001f3f]/10 hover:shadow-2xl transition-all h-full flex flex-col"
              >
                <div className="p-4 bg-white shadow-sm rounded-2xl w-fit text-[#001f3f] mb-8">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-slate-500 font-medium leading-relaxed mb-8 flex-grow">
                  {feature.description}
                </p>
                <div className="pt-6 border-t border-slate-100 mt-auto">
                  <button className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-[#800000] transition-colors">
                    Learn detail{" "}
                    <ArrowRight
                      size={12}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* QUICK LINKS SECTION */}
      <section className="py-32 bg-slate-900 text-white">
        <div className="container px-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <div className="space-y-6">
              <h4 className="text-[#800000] font-black uppercase tracking-widest text-xs">
                University Portals
              </h4>
              <div className="flex flex-col gap-4">
                <a
                  href="https://uniz.rguktong.in"
                  className="p-6 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 flex justify-between items-center transition-all"
                >
                  <span className="font-bold text-sm tracking-tight">
                    Main Student Portal
                  </span>
                  <ExternalLink size={16} className="text-white/20" />
                </a>
                <a
                  href="https://ornate-ems.rguktong.in"
                  className="p-6 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 flex justify-between items-center transition-all"
                >
                  <span className="font-bold text-sm tracking-tight">
                    Ornate EMS Suite
                  </span>
                  <ExternalLink size={16} className="text-white/20" />
                </a>
              </div>
            </div>
            <div className="md:col-span-2 flex flex-col justify-center">
              <h2 className="text-4xl md:text-6xl font-black leading-none tracking-tighter mb-8">
                Ready to navigate <br /> campus life?
              </h2>
              <p className="text-white/40 font-medium max-w-xl mb-12">
                Login to your specialized portal to manage registrations, track
                academic progress, or request administrative services instantly.
              </p>
              <button
                onClick={() =>
                  (window.location.href =
                    "https://uniz.rguktong.in/student/signin")
                }
                className="w-fit px-12 py-5 bg-white text-slate-900 text-xs font-black uppercase tracking-[0.3em] rounded-xl hover:bg-[#800000] hover:text-white transition-all shadow-2xl"
              >
                Official Sign In
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-16 bg-white border-t border-slate-100 px-10">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300">
              RGUKT ONGOLE &bull; IIIT RK VALLEY &bull; AP
            </p>
            <p className="text-[9px] font-bold text-slate-300 mt-2">
              Built for Performance. Secured for Students.
            </p>
          </div>
          <div className="text-[9px] font-black uppercase tracking-widest text-[#800000] opacity-40">
            &copy; 2026 UNIVERSITY SYSTEM
          </div>
          <nav className="flex items-center gap-8">
            <a
              href="#"
              className="text-[9px] font-bold text-slate-400 uppercase hover:text-slate-900 tracking-widest"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-[9px] font-bold text-slate-400 uppercase hover:text-slate-900 tracking-widest"
            >
              Compliance
            </a>
            <a
              href="#"
              className="text-[9px] font-bold text-slate-400 uppercase hover:text-slate-900 tracking-widest"
            >
              Support
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
