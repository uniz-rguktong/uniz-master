import { motion } from "framer-motion";
import {
    GraduationCap,
    ClipboardCheck,
    BellRing,
    ShieldCheck,
    Server,
    Zap,
    Lock,
    ArrowRight,
} from "lucide-react";
import { FeatureCard } from "../ui/FeatureCard";

const FEATURES = [
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

export const EcosystemSection = () => (
    <>
        {/* Ecosystem / Features */}
        <section id="ecosystem" className="py-48 px-10 bg-white border-t border-slate-100">
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
                            A Unified <span className="text-primary italic">Campus</span> <br />
                            Digital Experience.
                        </h2>
                        <p className="text-lg text-slate-500 font-medium leading-relaxed">
                            Built using a cloud-native microservices architecture, our platform provides
                            specialized vertical modules for every department while maintaining
                            enterprise-level security protocols.
                        </p>
                    </div>

                    {/* Direct Link card */}
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
                            Instantly transition to specialized operational suites for faculty and
                            administrative teams.
                        </p>
                        <a
                            href="https://ornate-core.rguktong.in"
                            className="flex items-center justify-between p-4 bg-white rounded-2xl group active:scale-95 transition-transform hover:shadow-lg"
                        >
                            <span className="font-black text-[10px] uppercase tracking-widest group-hover:text-accent transition-colors">
                                EMS Platform
                            </span>
                            <ArrowRight size={14} />
                        </a>
                    </div>
                </div>

                {/* Feature cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {FEATURES.map((feature, i) => (
                        <FeatureCard key={i} {...feature} index={i} />
                    ))}

                    {/* CTA card */}
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
                                Access the official student portal for course registrations and profile
                                management.
                            </p>
                        </div>
                        <button
                            onClick={() =>
                                (window.location.href = "https://uniz.rguktong.in/student/signin")
                            }
                            className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-accent hover:text-white transition-all duration-300"
                        >
                            Sign In Now
                        </button>
                    </motion.div>
                </div>
            </div>
        </section>

        {/* Security block */}
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
                    All session data is encrypted with TLS 1.3 and protected by a distributed API
                    gateway. Role-based access control (RBAC) ensures zero-trust security across all
                    university namespaces.
                </p>
                <div className="flex justify-center gap-12">
                    {[
                        { val: "256-bit", label: "Encryption", color: "decoration-accent" },
                        { val: "mTLS", label: "Internal Traffic", color: "decoration-emerald-500" },
                        { val: "ISO-STD", label: "Workflows", color: "decoration-blue-500" },
                    ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center">
                            <span
                                className={`text-primary font-black text-2xl tracking-tighter underline ${item.color} decoration-4 underline-offset-4`}
                            >
                                {item.val}
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-2">
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    </>
);
