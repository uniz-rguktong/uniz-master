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
 <div className="campus-canvas flex min-h-screen w-full flex-col bg-white text-ink">
 <section className="w-full border-b border-line bg-surface section-editorial">
 <div className="mx-auto max-w-7xl space-y-8 px-5 sm:px-8 lg:px-12">
          {/* Breadcrumb */}
 <div className="flex items-center justify-between gap-4 border-b border-line pb-3.5 text-[12.5px]">
 <div className="flex items-center gap-2 text-ink-muted">
              <Link
                to="/"
 className="font-semibold text-navy hover:underline underline-offset-4"
              >
                Portal Home
              </Link>
              <span>/</span>
 <span className="font-semibold text-ink">
                Software Development Cell
              </span>
            </div>

            <Link
              to="/"
 className="editorial-link inline-flex items-center gap-1.5 text-sm font-medium"
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
 <span className="text-sm text-ink-muted">
                  Rajiv Gandhi University of Knowledge Technologies · Ongole Campus
                </span>
              </div>

 <h1 className="font-serif text-3xl font-medium leading-tight tracking-tight text-navy-900 sm:text-4xl md:text-5xl">
                Software Development Cell
              </h1>

 <p className="max-w-3xl text-base leading-relaxed text-ink-muted sm:text-lg">
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
 className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-navy-900 px-5 text-sm font-medium text-white transition-colors duration-150 hover:bg-navy-950"
              >
                <span>Institutional Source Repository</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              <div className="flex items-center gap-2">
                <a
                  href={UNIZ_APK_PATH}
                  download="uniz-android.apk"
 className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 text-sm font-medium text-navy-900 transition-colors duration-150 hover:bg-surface-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Android (.apk)</span>
                </a>
                <button
                  type="button"
                  onClick={() => openIosDownloadModal()}
 className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 text-sm font-medium text-navy-900 transition-colors duration-150 hover:bg-surface-2"
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
 <section className="w-full border-b border-line bg-white section-editorial">
 <div className="mx-auto max-w-7xl space-y-10 px-5 sm:px-8 lg:px-12">
          <div className="space-y-1.5 max-w-3xl">
 <div className="flex items-center gap-2 text-ink-muted">
 <Cpu className="w-4 h-4 text-navy" />
 <span className="text-[11px] font-medium">
                Production Infrastructure Specifications
              </span>
            </div>
 <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-navy-900 sm:text-4xl">
              System architecture
            </h2>
 <p className="text-[14.5px] text-ink-muted leading-relaxed">
              Designed for zero-downtime examination result publication and daily
              campus operations across all PUC and B.Tech academic cohorts.
            </p>
          </div>

 <div className="grid grid-cols-1 divide-y divide-line overflow-hidden rounded-lg border border-line bg-white md:grid-cols-2 md:divide-y-0">
            {ARCHITECTURE_SPECS.map((item, idx) => {
              const Icon = item.icon;
              const borderClasses = [
                idx >= 2 ? "md:border-t md:border-navy-200" : "",
                idx % 2 === 1 ? "md:border-l md:border-navy-200" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <div
                  key={item.code}
                  className={`p-6 sm:p-7 space-y-3 ${borderClasses}`}
                >
                  <div className="flex items-center justify-between border-b border-line pb-2.5">
 <span className="text-[11px] font-medium text-ink-subtle">
                      {item.code} · {item.spec}
                    </span>
 <Icon className="w-4 h-4 text-navy" />
                  </div>
 <h3 className="font-serif text-xl font-medium text-navy-900">
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
