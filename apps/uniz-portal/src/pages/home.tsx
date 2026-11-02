import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Download, Smartphone } from "lucide-react";
import CampusUpdatesFeed from "../components/CampusUpdatesFeed";
import SiteLegalFooter from "../components/SiteLegalFooter";
import { UNIZ_APK_PATH, openIosDownloadModal } from "../constants/downloads";
import { useIsAuth } from "../hooks/is_authenticated";
import {
  landingCardClass,
  landingContainerClass,
  landingCtaClass,
  landingEyebrowClass,
  landingGhostClass,
  landingHeadingClass,
  landingLeadClass,
  landingPageClass,
} from "../lib/landing-ui";

const QUICK_SERVICES = [
  {
    code: "01",
    title: "Examination Results & Grade Transcripts",
    subtitle: "Semester grade sheets, SGPA/CGPA ledger, and remedial records",
    href: "/student/signin",
    badge: "Examinations",
  },
  {
    code: "02",
    title: "Semester Course Registration",
    subtitle: "PUC (P1–P2) and B.Tech (E1–E4) core and elective enrollment",
    href: "/student/signin",
    badge: "Academics",
  },
  {
    code: "03",
    title: "Subject-Wise Attendance Ledger",
    subtitle: "Verified lecture and laboratory attendance percentages",
    href: "/student/signin",
    badge: "Attendance",
  },
  {
    code: "04",
    title: "Hostel Outpass & Leave Clearance",
    subtitle: "Caretaker, Warden, and Main Gate movement authorization",
    href: "/student/signin",
    badge: "Residence",
  },
  {
    code: "05",
    title: "Faculty, Warden & Dean Administration",
    subtitle: "Grading uploads, attendance submission, and campus governance",
    href: "/admin/signin",
    badge: "Staff",
  },
];

const GOVERNANCE_DIVISIONS = [
  {
    overline: "Examinations",
    title: "Records and transcripts",
    description:
      "End-semester results, CGPA, and verifiable transcripts for every integrated B.Tech cohort.",
  },
  {
    overline: "Academic affairs",
    title: "Registration and attendance",
    description:
      "Semester subject registration and departmental attendance for PUC and engineering branches.",
  },
  {
    overline: "Student welfare",
    title: "Residence and outpass",
    description:
      "Hostel outpass requests, warden approvals, and gate verification, with alerts on Android and iOS.",
  },
];

const FACTS = [
  { label: "Academic program", value: "6-year integrated B.Tech" },
  { label: "Transcripts", value: "SGPA / CGPA ledger" },
  { label: "Campus governance", value: "Digital outpass and gate" },
  { label: "Mobile", value: "Android and iOS" },
];

export default function Home() {
  const navigate = useNavigate();
  const isAuthenticated = useIsAuth();
  const isAuth = isAuthenticated.is_authenticated;
  const portalPath = isAuthenticated.type === "admin" ? "/admin" : "/student";

  return (
    <div className={landingPageClass}>
 <section className="relative w-full overflow-hidden bg-navy-950">
 <div className="absolute inset-x-0 top-0 z-[2] h-0.5 bg-brand-red" aria-hidden="true" />
        <div className={`${landingContainerClass} relative z-[3] pb-16 pt-16 sm:pb-20 sm:pt-20 lg:pb-24 lg:pt-24`}>
 <p className="mb-4 text-sm text-white/70">Ongole campus</p>
 <h1 className="max-w-4xl font-serif text-[2rem] font-medium leading-[1.06] tracking-tight text-white [text-wrap:balance] sm:text-5xl md:text-6xl lg:text-[3.75rem]">
            Unified academic, examination and campus portal
          </h1>
 <p className="mt-5 max-w-xl border-l-2 border-brand-red pl-4 text-base leading-relaxed text-white/80 sm:mt-6 sm:text-lg">
            Sign in with your university credentials for course registration, transcripts, attendance, and residence clearances at RGUKT Ongole.
          </p>

          <div className="mt-8 flex flex-col items-stretch gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={() => navigate(isAuth ? portalPath : "/student/signin")}
              className={landingCtaClass}
            >
              {isAuth ? "Continue to portal" : "Student sign in"}
            </button>
            <Link to="/admin/signin" className={landingGhostClass}>
              Faculty and staff
            </Link>
            <div id="mobile-apps" className="flex flex-wrap gap-2 sm:ml-1">
              <a
                href={UNIZ_APK_PATH}
                download="uniz-android.apk"
 className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/25 px-4 text-sm font-medium text-white/90 transition-colors duration-150 hover:bg-white/10"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Android app
              </a>
              <button
                type="button"
                onClick={() => openIosDownloadModal()}
 className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-white/25 px-4 text-sm font-medium text-white/90 transition-colors duration-150 hover:bg-white/10"
              >
                <Smartphone className="h-4 w-4" aria-hidden="true" />
                iOS app
              </button>
            </div>
          </div>
        </div>
      </section>

 <section className="border-b border-line bg-surface">
        <div className={`${landingContainerClass} grid grid-cols-2 divide-line sm:grid-cols-4 sm:divide-x`}>
          {FACTS.map((fact) => (
 <div key={fact.label} className="px-1 py-6 sm:px-6 sm:first:pl-0">
 <p className="text-sm text-ink-muted">{fact.label}</p>
 <p className="mt-1 text-[15px] font-medium text-navy-900">{fact.value}</p>
            </div>
          ))}
        </div>
      </section>

 <section id="academic-services" className="border-b border-line bg-white section-editorial">
        <div className={landingContainerClass}>
          <div className="mb-12 max-w-2xl sm:mb-16">
            <p className={landingEyebrowClass}>Services</p>
            <h2 className={`mt-3 ${landingHeadingClass}`}>What you can open after sign in</h2>
            <p className={`mt-5 ${landingLeadClass}`}>
              One institutional sign-on for examinations, academics, and residence at RGUKT Ongole.
            </p>
          </div>

          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className={`${landingCardClass} divide-y divide-line lg:col-span-7`}>
              {QUICK_SERVICES.map((service) => (
                <Link
                  key={service.code}
                  to={service.href}
 className="group flex items-start justify-between gap-4 px-5 py-4 transition-colors duration-150 hover:bg-surface-2 sm:px-6"
                >
                  <div className="flex items-start gap-4">
 <span className="pt-0.5 text-sm tabular-nums text-ink-subtle">{service.code}</span>
                    <div>
 <p className="text-[15px] font-medium text-navy-900 group-hover:underline group-hover:underline-offset-4">
                        {service.title}
                      </p>
 <p className="mt-1 text-sm leading-relaxed text-ink-muted">{service.subtitle}</p>
                    </div>
                  </div>
 <span className="inline-flex shrink-0 items-center gap-1 pt-0.5 text-sm text-navy">
                    <span className="hidden sm:inline">{service.badge}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>

            <div className="flex flex-col gap-10 lg:col-span-5">
              {GOVERNANCE_DIVISIONS.map((div) => (
                <div key={div.title}>
 <p className="text-sm text-ink-muted">{div.overline}</p>
 <h3 className="mt-2 font-serif text-2xl font-medium tracking-tight text-navy-900">
                    {div.title}
                  </h3>
 <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">{div.description}</p>
                </div>
              ))}
 <Link to="/student/signin" className="editorial-link w-fit text-[15px] font-medium">
                Sign in to the student portal
              </Link>
            </div>
          </div>
        </div>
      </section>

 <section id="campus-updates" className="border-b border-line bg-surface section-editorial">
        <div className={landingContainerClass}>
          <div className="mb-10 flex flex-col gap-6 sm:mb-14 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className={landingEyebrowClass}>Announcements</p>
              <h2 className={`mt-3 ${landingHeadingClass}`}>Circulars and notices</h2>
            </div>
            <Link
              to="/student/signin"
 className="inline-flex items-center gap-1.5 text-[15px] font-medium text-navy-900"
            >
              Sign in for student notices
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <CampusUpdatesFeed variant="landing" />
        </div>
      </section>

      <SiteLegalFooter />
    </div>
  );
}
