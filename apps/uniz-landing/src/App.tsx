import { motion, useScroll, useTransform } from "framer-motion";
import {
  ShieldCheck,
  GraduationCap,
  BellRing,
  ClipboardCheck,
  MonitorCheck,
  ArrowRight,
  ExternalLink,
  Zap,
  Lock,
  Server,
} from "lucide-react";
import "./index.css";

const FeatureCard = ({ icon, title, description, index }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.1, duration: 0.8 }}
    whileHover={{ y: -5 }}
    className="group p-8 bg-white border border-slate-100 rounded-[2rem] hover:shadow-2xl hover:border-blue-900/10 transition-all duration-500 ease-out flex flex-col h-full"
  >
    <div className="w-14 h-14 bg-slate-50 flex items-center justify-center rounded-2xl text-primary mb-8 group-hover:bg-primary group-hover:text-white transition-colors duration-500">
      {icon}
    </div>
    <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight group-hover:text-accent transition-colors">
      {title}
    </h3>
    <p className="text-slate-500 font-medium leading-relaxed mb-10 flex-grow">
      {description}
    </p>
    <div className="pt-6 border-t border-slate-50 mt-auto">
      <button className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-accent group-hover:gap-3 transition-all">
        Learn More <ArrowRight size={14} />
      </button>
    </div>
  </motion.div>
);

export default function App() {
  const { scrollYProgress } = useScroll();
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  const features = [
    {
      icon: <GraduationCap size={28} />,
      title: "Academic Core",
      description:
        "Automated grade processing, attendance lifecycle management, and cross-departmental curriculum synchronization.",
    },
    {
      icon: <ClipboardCheck size={28} />,
      title: "Dynamic Requests",
      description:
        "Digital outpass protocols with encrypted verification logs and automated escalation pathways for administrative approval.",
    },
    {
      icon: <BellRing size={28} />,
      title: "Unified Pulse",
      description:
        "Micro-broadcasts for campus-wide alerts, high-priority notifications, and departmental news in real-time.",
    },
    {
      icon: <ShieldCheck size={28} />,
      title: "Secure Auth",
      description:
        "Enterprise-grade identity management with RBAC protocols ensuring data isolation between students and admins.",
    },
    {
      icon: <Server size={28} />,
      title: "Cloud Native",
      description:
        "Powered by a high-availability K3s cluster with automated self-healing, scaling, and integrated monitoring logs.",
    },
  ];

  return (
    <div className="min-h-screen bg-white selection:bg-accent/10 selection:text-accent">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-[100] glass border-b border-slate-100 py-4 px-10">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center h-12">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 group">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-900 transition-colors">
                Cluster Active
              </span>
            </div>
          </div>

          <div className="flex items-center gap-12">
            <nav className="hidden lg:flex items-center gap-8">
              <a
                href="https://uniz.rguktong.in"
                className="text-[10px] font-black text-slate-400 hover:text-primary uppercase tracking-widest transition-colors"
              >
                Portal
              </a>
              <a
                href="https://ornate-ems.rguktong.in"
                className="text-[10px] font-black text-slate-400 hover:text-primary uppercase tracking-widest transition-colors"
              >
                EMS
              </a>
            </nav>
            <button
              onClick={() =>
                (window.location.href =
                  "https://uniz.rguktong.in/student/signin")
              }
              className="px-6 py-2.5 bg-primary text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-lg hover:bg-black transition-all active:scale-95 btn-premium"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-52 pb-44 bg-slate-50/50 overflow-hidden border-b border-slate-100">
        <div className="absolute top-0 right-0 w-[60%] h-full opacity-[0.03] pointer-events-none select-none">
          <div className="w-full h-full font-black text-[30rem] flex items-center justify-center leading-none text-primary transform translate-x-32 rotate-12">
            UNI
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-10 relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 mb-8"
          >
            <div className="w-12 h-[1px] bg-accent/30"></div>
            <span className="text-accent font-black uppercase tracking-[0.5em] text-[10px]">
              RGUKT ONGOLE
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-7xl md:text-[10rem] font-black text-slate-900 leading-[0.8] tracking-tighter mb-16"
          >
            University <br /> Management <br />
            <span className="text-primary opacity-20">Optimized.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl md:text-2xl text-slate-500 font-medium max-w-2xl leading-relaxed mb-16"
          >
            The centralized operations engine for IIIT Ongole. Integrating
            administrative workflows, academic oversight, and student services
            on a secure, high-availability architecture.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-6"
          >
            <button
              onClick={() =>
                (window.location.href = "https://uniz.rguktong.in")
              }
              className="flex items-center gap-4 px-10 py-5 bg-primary text-white rounded-2xl shadow-3xl shadow-blue-900/20 hover:bg-black hover:scale-105 transition-all duration-500 active:scale-95 group btn-premium"
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
              onClick={() => {
                const el = document.getElementById("ecosystem");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-10 py-5 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all font-black text-[12px] uppercase tracking-widest"
            >
              View Infrastructure
            </button>
          </motion.div>
        </div>
      </section>

      {/* STATS STRIP */}
      <div className="bg-primary py-12 px-10">
        <div className="max-w-[1200px] mx-auto flex flex-wrap justify-between items-center gap-12">
          {[
            { label: "Uptime", val: "99.9%" },
            { label: "Latency", val: "< 50ms" },
            { label: "Security", val: "HSTS+" },
            { label: "Nodes", val: "Distributed" },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col gap-1">
              <span className="text-white/30 text-[9px] font-black uppercase tracking-widest">
                {stat.label}
              </span>
              <span className="text-white text-xl font-bold tracking-tight">
                {stat.val}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ECOSYSTEM SECTION */}
      <section id="ecosystem" className="py-48 px-10 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start mb-32 gap-12">
            <div className="max-w-2xl">
              <motion.span
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className="text-accent font-black uppercase tracking-[0.4em] text-[10px] mb-8 block"
              >
                Modular Architecture
              </motion.span>
              <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-10 leading-[0.9]">
                A Unified <span className="text-primary italic">Campus</span>{" "}
                <br /> Digital Experience.
              </h2>
              <p className="text-lg text-slate-500 font-medium leading-relaxed">
                Built using a cloud-native microservices architecture, our
                platform provides specialized vertical modules for every
                department while maintaining enterprise-level security
                protocols.
              </p>
            </div>

            <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 max-w-xs">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-white rounded-xl shadow-sm">
                  <Zap size={20} className="text-amber-500" />
                </div>
                <span className="font-black text-[12px] uppercase tracking-wider text-slate-900">
                  Direct Link
                </span>
              </div>
              <p className="text-xs text-slate-400 font-bold leading-relaxed mb-6">
                Instantly transition to specialized operational suites for
                faculty and administrative teams.
              </p>
              <a
                href="https://ornate-ems.rguktong.in"
                className="flex items-center justify-between p-4 bg-white rounded-2xl group active:scale-95 transition-transform hover:shadow-lg"
              >
                <span className="font-black text-[10px] uppercase tracking-widest group-hover:text-accent transition-colors">
                  EMS Platform
                </span>
                <ArrowRight size={14} />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature: any, i: number) => (
              <FeatureCard key={i} {...feature} index={i} />
            ))}

            {/* CTA Final Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="p-12 bg-primary text-white rounded-[2.5rem] flex flex-col justify-between"
            >
              <div>
                <h4 className="text-3xl font-black leading-none tracking-tighter mb-6">
                  Ready to <br /> Begin?
                </h4>
                <p className="text-white/40 text-sm font-medium leading-relaxed mb-8">
                  Access the official student portal for course registrations
                  and profile management.
                </p>
              </div>
              <button
                onClick={() =>
                  (window.location.href =
                    "https://uniz.rguktong.in/student/signin")
                }
                className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-accent hover:text-white transition-all duration-300"
              >
                Sign In Now
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECURITY BLOCK */}
      <section className="py-32 bg-slate-50 flex justify-center px-10 border-t border-slate-100">
        <div className="max-w-4xl text-center">
          <div className="flex justify-center mb-8">
            <div className="p-6 bg-white rounded-full shadow-xl">
              <Lock size={32} className="text-primary" />
            </div>
          </div>
          <h3 className="text-4xl font-black text-slate-900 tracking-tighter mb-6">
            Enterprise Infrastructure.
          </h3>
          <p className="text-slate-500 font-medium mb-12">
            All session data is encrypted with TLS 1.3 and protected by a
            distributed API gateway. Role-based access control (RBAC) ensures
            zero-trust security across all university namespaces.
          </p>
          <div className="flex justify-center gap-12">
            <div className="flex flex-col items-center">
              <span className="text-primary font-black text-2xl tracking-tighter underline decoration-accent decoration-4 underline-offset-4">
                256-bit
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-2">
                Encryption
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-primary font-black text-2xl tracking-tighter underline decoration-emerald-500 decoration-4 underline-offset-4">
                mTLS
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-2">
                Internal Traffic
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-primary font-black text-2xl tracking-tighter underline decoration-blue-500 decoration-4 underline-offset-4">
                ISO-STD
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-2">
                Workflows
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-24 px-10 bg-white">
        <div className="max-w-[1200px] mx-auto border-t border-slate-100 pt-16 flex flex-col md:flex-row justify-between items-start gap-16">
          <div className="max-w-xs">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black">
                U
              </div>
              <span className="font-black text-xl tracking-tighter uppercase">
                UniZ <span className="text-accent">Systems</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-bold leading-relaxed uppercase tracking-widest">
              Official administration framework for RGUKT Ongole Campus. Powered
              by high-availability cloud cluster.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-20">
            <div className="flex flex-col gap-6 text-[10px] font-black uppercase tracking-widest">
              <span className="text-slate-300">Platforms</span>
              <a
                href="https://uniz.rguktong.in"
                className="hover:text-accent transition-colors"
              >
                Student Portal
              </a>
              <a
                href="https://ornate-ems.rguktong.in"
                className="hover:text-accent transition-colors"
              >
                Staff EMS
              </a>
              <a href="#" className="hover:text-accent transition-colors">
                Admin Hub
              </a>
            </div>
            <div className="flex flex-col gap-6 text-[10px] font-black uppercase tracking-widest">
              <span className="text-slate-300">Resources</span>
              <a href="#" className="hover:text-accent transition-colors">
                Infrastructure
              </a>
              <a href="#" className="hover:text-accent transition-colors">
                Security
              </a>
              <a href="#" className="hover:text-accent transition-colors">
                Compliance
              </a>
            </div>
          </div>
        </div>
        <div className="max-w-[1200px] mx-auto mt-24 flex flex-col md:flex-row justify-between gap-8 pt-8 border-t border-slate-50 items-center">
          <span className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-300">
            &copy; 2026 UNIVERSITY SYSTEM &bull; AP &bull; INDIA
          </span>
          <div className="flex gap-8 items-center opacity-20 hover:opacity-100 transition-opacity">
            <div className="w-6 h-6 bg-slate-200 rounded-full"></div>
            <div className="w-6 h-6 bg-slate-200 rounded-full"></div>
            <div className="w-6 h-6 bg-slate-200 rounded-full"></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
