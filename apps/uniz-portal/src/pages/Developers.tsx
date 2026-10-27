import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Cpu,
  Database,
  Download,
  Lock,
  Server,
  Smartphone,
} from "lucide-react";
import MeetTheDevelopersSection from "../components/MeetTheDevelopersSection";
import SiteLegalFooter from "../components/SiteLegalFooter";
import { UNIZ_APK_PATH, openIosDownloadModal } from "../constants/downloads";

const ARCHITECTURE_SPECS = [
  {
    code: "SYS-01",
    icon: Server,
    title: "Distributed Microservices & Gateway Topology",
    spec: "Node.js · TypeScript · Nginx · Kubernetes (K3s)",
    summary:
      "Decoupled domain services for authentication (uniz-auth), user profiles (uniz-user), academic records & grading (uniz-academics), hostel outpasses (uniz-outpass), file storage (uniz-files), and scheduled tasks (uniz-cron).",
  },
  {
    code: "SYS-02",
    icon: Database,
    title: "Academic & Examination Ledger Engine",
    spec: "PostgreSQL · Prisma ORM · Redis Cache",
    summary:
      "ACID-compliant storage for multi-batch student records, semester subject registrations, biometric attendance ledgers, SGPA/CGPA computation, and verifiable PDF grade sheets.",
  },
  {
    code: "SYS-03",
    icon: Lock,
    title: "Institutional Identity & Access Governance",
    spec: "JWT RBAC · Cloudflare Turnstile · Scoped Credentials",
    summary:
      "Role-based access enforcement separating Student, Faculty, Caretaker, Warden, Chief Warden, Security Gate, Head of Department, Dean, and Controller of Examinations privileges.",
  },
  {
    code: "SYS-04",
    icon: Smartphone,
    title: "Web & Native Mobile Companion Delivery",
    spec: "React 18 · Vite · Android Signed TWA (.apk) · iOS WebClip",
    summary:
      "Unified institutional web portal paired with native Android APK and iOS installation profiles for low-latency campus notifications and mobile outpass clearance.",
  },
];

export default function DevelopersPage() {
  return (
    <div className="flex flex-col min-h-screen w-full bg-white text-[#0F172A] font-sans">
      {/* Formal Institutional Header Band */}
      <section className="w-full bg-[#F8FAFC] border-b border-[#D8E0EA] py-10 md:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center justify-between gap-4 border-b border-[#E2E8F0] pb-3.5 text-[12.5px]">
            <div className="flex items-center gap-2 text-[#475569]">
              <Link
                to="/"
                className="font-semibold text-[#0A2540] hover:underline underline-offset-4"
              >
                Portal Home
              </Link>
              <span>/</span>
              <span className="font-semibold text-[#0F172A]">
                Software Development Cell
              </span>
            </div>

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 font-bold text-[#0A2540] hover:underline underline-offset-4"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Portal</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8 space-y-3">
              <div className="inline-flex items-center gap-2.5">
                <img
                  src="/rgukt-logo.png"
                  alt="RGUKT Emblem"
                  width={22}
                  height={26}
                  className="h-5 w-auto object-contain"
                />
                <span className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#0A2540]">
                  Rajiv Gandhi University of Knowledge Technologies · Ongole Campus
                </span>
              </div>

              <h1 className="text-[30px] sm:text-[38px] font-bold tracking-[-0.02em] text-[#0A2540] leading-tight">
                Software Development Cell &amp; Systems Architecture
              </h1>

              <p className="text-[15.5px] text-[#334155] leading-relaxed max-w-3xl">
                UniZ is engineered and maintained in-house by the Software
                Development Cell at RGUKT Ongole to provide reliable, high-availability
                digital infrastructure for university examinations, course
                registrations, attendance tracking, and campus residence
                administration.
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-2.5 lg:items-end">
              <a
                href="https://github.com/uniz-rguktong/uniz-master"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-[2px] bg-[#0A2540] hover:bg-[#061B33] text-white text-[12.5px] font-bold uppercase tracking-[0.06em] transition-colors"
              >
                <span>Institutional Source Repository</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              <div className="flex items-center gap-2">
                <a
                  href={UNIZ_APK_PATH}
                  download="uniz-android.apk"
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[2px] border border-[#CBD5E1] bg-white hover:border-[#0A2540] text-[#0A2540] text-[12px] font-bold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Android (.apk)</span>
                </a>
                <button
                  type="button"
                  onClick={() => openIosDownloadModal()}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[2px] border border-[#CBD5E1] bg-white hover:border-[#0A2540] text-[#0A2540] text-[12px] font-bold transition-colors cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>iOS App</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Engineering Roster */}
      <MeetTheDevelopersSection />

      {/* Technical Architecture & Infrastructure Specifications */}
      <section className="w-full bg-[#F8FAFC] border-b border-[#E2E8F0] py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2 text-[#475569]">
              <Cpu className="w-4 h-4 text-[#0A2540]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.14em]">
                Production Infrastructure Specifications
              </span>
            </div>
            <h2 className="text-[24px] sm:text-[28px] font-bold tracking-[-0.01em] text-[#0A2540]">
              System Architecture &amp; Operational Subsystems
            </h2>
            <p className="text-[14.5px] text-[#475569] leading-relaxed">
              Designed for zero-downtime examination result publication and daily
              campus operations across all PUC and B.Tech academic cohorts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 border border-[#D8E0EA] bg-white rounded-[2px] divide-y md:divide-y-0 divide-[#D8E0EA]">
            {ARCHITECTURE_SPECS.map((item, idx) => {
              const Icon = item.icon;
              const borderClasses = [
                idx >= 2 ? "md:border-t md:border-[#D8E0EA]" : "",
                idx % 2 === 1 ? "md:border-l md:border-[#D8E0EA]" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <div
                  key={item.code}
                  className={`p-6 sm:p-7 space-y-3 ${borderClasses}`}
                >
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#64748B]">
                      {item.code} · {item.spec}
                    </span>
                    <Icon className="w-4 h-4 text-[#0A2540]" />
                  </div>
                  <h3 className="text-[17px] font-bold text-[#0A2540]">
                    {item.title}
                  </h3>
                  <p className="text-[13.5px] text-[#334155] leading-relaxed">
                    {item.summary}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <SiteLegalFooter />
    </div>
  );
}
