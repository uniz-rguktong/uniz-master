import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Building2,
  CalendarCheck,
  Download,
  ExternalLink,
  FileCheck2,
  GraduationCap,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import CampusUpdatesFeed from "../components/CampusUpdatesFeed";
import SiteLegalFooter from "../components/SiteLegalFooter";
import { DEVELOPER_TESTIMONIALS } from "../constants/developerTestimonials";
import { UNIZ_APK_PATH, openIosDownloadModal } from "../constants/downloads";
import { useIsAuth } from "../hooks/is_authenticated";

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
    subtitle: "PUC (P1–P2) and B.Tech (E1–E4) core & elective credit enrollment",
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
    subtitle: "Caretaker, Warden, and Main Gate digital movement authorization",
    href: "/student/signin",
    badge: "Residence",
  },
  {
    code: "05",
    title: "Faculty, Warden & Dean Administration",
    subtitle: "Grading uploads, attendance submission, and campus governance",
    href: "/admin/signin",
    badge: "Staff Portal",
  },
];

const GOVERNANCE_DIVISIONS = [
  {
    number: "I",
    icon: FileCheck2,
    overline: "Office of the Controller of Examinations",
    title: "Examination Records & Official Transcripts",
    description:
      "Centralized publication of end-semester examination results, cumulative grade point averages (CGPA), and verifiable academic transcripts across all integrated B.Tech cohorts.",
    points: [
      "Semester-wise grade reports & credit summaries",
      "Remedial & grade improvement examination tracking",
      "Downloadable PDF transcripts for higher studies & placements",
    ],
    ctaLabel: "Sign In for Examination Records",
    ctaHref: "/student/signin",
  },
  {
    number: "II",
    icon: BookOpen,
    overline: "Office of Academic Affairs",
    title: "Curriculum Registration & Attendance Ledger",
    description:
      "Structured semester subject registration and departmental attendance monitoring for Pre-University Course (PUC) and Engineering (CSE, ECE, EEE, ME, CE, Chemical, MME) branches.",
    points: [
      "Automated departmental curriculum & credit validation",
      "Subject-level attendance tracking & exam eligibility status",
      "Faculty academic profile & course allocation directory",
    ],
    ctaLabel: "Access Academic Services",
    ctaHref: "/student/signin",
  },
  {
    number: "III",
    icon: ShieldCheck,
    overline: "Chief Warden Office & Student Welfare",
    title: "Campus Residence, Outpass & Mobile Access",
    description:
      "Digitized hostel administration enabling real-time outpass requests, multi-tier warden approvals, security checkpoint verification, and instant mobile notifications.",
    points: [
      "Hierarchical approval workflow (Caretaker → Warden → Security)",
      "Student grievance redressal & Dean of Student Welfare desk",
      "Official Android (.apk) & iOS companion apps for instant alerts",
    ],
    ctaLabel: "Access Residence Portal",
    ctaHref: "/student/signin",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const isAuthenticated = useIsAuth();
  const isAuth = isAuthenticated.is_authenticated;
  const portalPath = isAuthenticated.type === "admin" ? "/admin" : "/student";

  return (
    <div className="flex flex-col min-h-screen w-full bg-white text-[#0F172A] font-sans">
      {/* ─── SECTION A: Harvard / MIT Style Institutional Hero & Service Directory ─── */}
      <section className="w-full bg-[#F8FAFC] border-b border-[#D8E0EA]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 md:py-14 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Left 7 Columns: Formal Institutional Mandate & Primary Actions */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-3 border-b border-[#CBD5E1] pb-2.5">
                  <img
                    src="/rgukt-logo.png"
                    alt="RGUKT Emblem"
                    width={24}
                    height={28}
                    className="h-6 w-auto object-contain shrink-0"
                  />
                  <span className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#0A2540]">
                    Office of Academic Affairs &amp; Examinations · RGUKT Ongole
                  </span>
                </div>

                <h1 className="text-[30px] sm:text-[38px] lg:text-[44px] font-bold tracking-[-0.02em] text-[#0A2540] leading-[1.12]">
                  Unified Academic, Examination &amp; Campus Operations Portal
                </h1>

                <p className="text-[15.5px] sm:text-[16.5px] text-[#334155] leading-[1.65] max-w-2xl">
                  The official digital gateway for Rajiv Gandhi University of
                  Knowledge Technologies, Ongole Campus. Sign in with your
                  university credentials to access semester course registrations,
                  verified examination transcripts, subject attendance ledgers,
                  and residence hall clearances.
                </p>
              </div>

              {/* Primary Sign-In & Mobile App Actions */}
              <div className="space-y-3 pt-1">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(isAuth ? portalPath : "/student/signin")
                    }
                    className="inline-flex items-center justify-center gap-2.5 h-11 px-6 rounded-[2px] bg-[#0A2540] hover:bg-[#061B33] text-white text-[13.5px] font-bold tracking-[0.04em] uppercase transition-colors cursor-pointer shadow-xs"
                  >
                    <span>
                      {isAuth ? "Continue to Portal" : "Student Portal Sign In"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <Link
                    to="/admin/signin"
                    className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-[2px] border border-[#0A2540] bg-white hover:bg-[#0A2540] text-[#0A2540] hover:text-white text-[13.5px] font-bold tracking-[0.04em] uppercase transition-colors"
                  >
                    <span>Faculty &amp; Staff Sign In</span>
                  </Link>
                </div>

                {/* Official Mobile Companion Strip */}
                <div
                  id="mobile-apps"
                  className="flex flex-wrap items-center gap-2.5 pt-1 text-[12.5px]"
                >
                  <span className="font-semibold text-[#475569] uppercase tracking-[0.06em] text-[11px] mr-1">
                    Official Mobile Companion:
                  </span>
                  <a
                    href={UNIZ_APK_PATH}
                    download="uniz-android.apk"
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[2px] border border-[#CBD5E1] bg-white hover:border-[#0A2540] text-[#0A2540] font-semibold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Android App (.apk)</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => openIosDownloadModal()}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[2px] border border-[#CBD5E1] bg-white hover:border-[#0A2540] text-[#0A2540] font-semibold transition-colors cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Download iOS App</span>
                  </button>
                  <Link
                    to="/developers"
                    className="inline-flex items-center gap-1 h-8 px-2.5 text-[#0A2540] font-semibold hover:underline underline-offset-4"
                  >
                    <span>Software Development Cell</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Hairlined Institutional Key Facts Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 border border-[#D8E0EA] bg-white rounded-[2px] divide-y sm:divide-y-0 sm:divide-x divide-[#E2E8F0] mt-2">
                <div className="p-3.5">
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#64748B]">
                    Academic Program
                  </p>
                  <p className="text-[14px] font-bold text-[#0A2540] mt-0.5">
                    6-Yr Integrated B.Tech
                  </p>
                </div>
                <div className="p-3.5">
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#64748B]">
                    Transcripts &amp; Grades
                  </p>
                  <p className="text-[14px] font-bold text-[#0A2540] mt-0.5">
                    SGPA / CGPA Ledger
                  </p>
                </div>
                <div className="p-3.5">
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#64748B]">
                    Campus Governance
                  </p>
                  <p className="text-[14px] font-bold text-[#0A2540] mt-0.5">
                    Digital Outpass &amp; Gate
                  </p>
                </div>
                <div className="p-3.5">
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#64748B]">
                    Mobile Platforms
                  </p>
                  <p className="text-[14px] font-bold text-[#0A2540] mt-0.5">
                    Android &amp; iOS Ready
                  </p>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Quick Access Service Directory (my.harvard.edu style) */}
            <div className="lg:col-span-5 w-full">
              <div className="border border-[#0A2540] bg-white rounded-[2px] shadow-[0_2px_6px_rgba(10,37,64,0.06)] overflow-hidden">
                <div className="bg-[#0A2540] text-white px-5 py-3.5 flex items-center justify-between">
                  <div>
                    <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] text-white">
                      Portal Service Directory
                    </h2>
                    <p className="text-[11.5px] text-white/75 mt-0.5">
                      Select an institutional service to sign in
                    </p>
                  </div>
                  <GraduationCap className="w-5 h-5 text-white/80 shrink-0" />
                </div>

                <div className="divide-y divide-[#E2E8F0]">
                  {QUICK_SERVICES.map((service) => (
                    <Link
                      key={service.code}
                      to={service.href}
                      className="group flex items-start justify-between gap-3 px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-[12px] font-bold tabular-nums text-[#64748B] pt-0.5">
                          {service.code}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[14.5px] font-bold text-[#0A2540] group-hover:underline underline-offset-4">
                              {service.title}
                            </span>
                          </div>
                          <p className="text-[12.5px] text-[#475569] mt-0.5 leading-snug">
                            {service.subtitle}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.06em] text-[#0A2540] shrink-0 pt-0.5">
                        <span className="hidden sm:inline">{service.badge}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-[#0A2540] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </span>
                    </Link>
                  ))}
                </div>

                <div className="bg-[#F8FAFC] border-t border-[#E2E8F0] px-5 py-3 flex items-center justify-between text-[12px] text-[#475569]">
                  <span>University Helpdesk: webadmin@rguktong.ac.in</span>
                  <a
                    href="https://rguktong.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-[#0A2540] hover:underline underline-offset-4"
                  >
                    <span>rguktong.in</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION B: Official Circulars, Examination Notices & Institutional Resources ─── */}
      <section
        id="campus-updates"
        className="w-full bg-white border-b border-[#E2E8F0] py-12 md:py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E2E8F0] pb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#475569]">
                Office of the Controller of Examinations &amp; Academic Section
              </p>
              <h2 className="text-[24px] sm:text-[28px] font-bold tracking-[-0.01em] text-[#0A2540] mt-1">
                Official Announcements &amp; Academic Circulars
              </h2>
            </div>
            <Link
              to="/student/signin"
              className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#0A2540] hover:underline underline-offset-4 shrink-0"
            >
              <span>Sign in to view personalized student notices</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8">
              <CampusUpdatesFeed variant="landing" />
            </div>

            {/* Institutional Quick Reference & Schedule Ledger */}
            <div className="lg:col-span-4 space-y-5">
              <div className="border border-[#D8E0EA] bg-[#F8FAFC] rounded-[2px] p-5 space-y-4">
                <div className="flex items-center gap-2.5 border-b border-[#E2E8F0] pb-3">
                  <CalendarCheck className="w-4 h-4 text-[#0A2540]" />
                  <h3 className="text-[13px] font-bold uppercase tracking-[0.1em] text-[#0A2540]">
                    Institutional Quick Reference
                  </h3>
                </div>

                <dl className="space-y-3 text-[13px]">
                  <div className="border-b border-[#E2E8F0] pb-2.5">
                    <dt className="font-bold text-[#0A2540]">
                      Student Sign-In Credentials
                    </dt>
                    <dd className="text-[#475569] mt-0.5 leading-relaxed">
                      Use your official University ID (e.g.,{" "}
                      <code className="font-bold text-[#0A2540]">O210001</code>).
                      First-time password format:{" "}
                      <code className="font-bold text-[#0A2540]">
                        id@rguktong
                      </code>
                      .
                    </dd>
                  </div>

                  <div className="border-b border-[#E2E8F0] pb-2.5">
                    <dt className="font-bold text-[#0A2540]">
                      Official Mobile App Installation
                    </dt>
                    <dd className="text-[#475569] mt-0.5 leading-relaxed">
                      Install the verified Android APK or iOS WebClip profile to
                      receive real-time examination &amp; outpass alerts.
                    </dd>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <a
                        href={UNIZ_APK_PATH}
                        download="uniz-android.apk"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11.5px] font-bold bg-[#0A2540] text-white rounded-[2px] hover:bg-[#061B33]"
                      >
                        <Download className="w-3 h-3" />
                        Android (.apk)
                      </a>
                      <button
                        type="button"
                        onClick={() => openIosDownloadModal()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11.5px] font-bold border border-[#0A2540] text-[#0A2540] bg-white rounded-[2px] hover:bg-[#0A2540] hover:text-white cursor-pointer"
                      >
                        <Smartphone className="w-3 h-3" />
                        iOS App
                      </button>
                    </div>
                  </div>

                  <div>
                    <dt className="font-bold text-[#0A2540]">
                      Examination Cell &amp; Technical Desk
                    </dt>
                    <dd className="text-[#475569] mt-0.5 leading-relaxed">
                      For transcript discrepancies or credential resets, contact{" "}
                      <a
                        href="mailto:webadmin@rguktong.ac.in"
                        className="font-semibold text-[#0A2540] underline underline-offset-2"
                      >
                        webadmin@rguktong.ac.in
                      </a>
                      .
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION C: Academic Governance & Digital Infrastructure (3-Column Grid) ─── */}
      <section
        id="academic-services"
        className="w-full bg-[#F8FAFC] border-b border-[#E2E8F0] py-12 md:py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="max-w-3xl space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#475569]">
              University Administrative Divisions
            </p>
            <h2 className="text-[24px] sm:text-[28px] font-bold tracking-[-0.01em] text-[#0A2540]">
              Academic Systems &amp; Campus Governance
            </h2>
            <p className="text-[14.5px] text-[#475569] leading-relaxed">
              UniZ integrates academic administration, examination evaluations,
              and residential campus operations under a single institutional
              sign-on for RGUKT Ongole students, faculty, and administration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 border border-[#D8E0EA] bg-white rounded-[2px] divide-y md:divide-y-0 md:divide-x divide-[#D8E0EA]">
            {GOVERNANCE_DIVISIONS.map((div) => {
              const Icon = div.icon;
              return (
                <div
                  key={div.number}
                  className="p-6 sm:p-7 flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                      <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#475569]">
                        Division {div.number}
                      </span>
                      <Icon className="w-4 h-4 text-[#0A2540]" />
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                        {div.overline}
                      </p>
                      <h3 className="text-[18px] font-bold text-[#0A2540] mt-1 leading-snug">
                        {div.title}
                      </h3>
                    </div>

                    <p className="text-[13.5px] text-[#334155] leading-relaxed">
                      {div.description}
                    </p>

                    <ul className="space-y-2 pt-1 border-t border-[#F1F5F9]">
                      {div.points.map((pt) => (
                        <li
                          key={pt}
                          className="flex items-start gap-2 text-[13px] text-[#1E293B]"
                        >
                          <span className="text-[#0A2540] font-bold leading-5">
                            ·
                          </span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2">
                    <Link
                      to={div.ctaHref}
                      className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#0A2540] hover:underline underline-offset-4"
                    >
                      <span>{div.ctaLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── SECTION D: Software Development Cell Directory Band ─── */}
      <section className="w-full bg-white py-12 md:py-16 border-b border-[#E2E8F0]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-7">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E2E8F0] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0A2540]" />
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#475569]">
                  Software Development Cell · RGUKT Ongole
                </p>
              </div>
              <h2 className="text-[22px] sm:text-[26px] font-bold tracking-[-0.01em] text-[#0A2540] mt-1">
                Systems Architecture &amp; Engineering Directory
              </h2>
            </div>

            <Link
              to="/developers"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-[2px] bg-[#0A2540] hover:bg-[#061B33] text-white text-[12.5px] font-bold uppercase tracking-[0.06em] transition-colors shrink-0 w-fit"
            >
              <span>View Engineering Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-[#D8E0EA] rounded-[2px] divide-y sm:divide-y-0 sm:divide-x divide-[#D8E0EA] bg-white">
            {DEVELOPER_TESTIMONIALS.map((dev) => (
              <div
                key={dev.name}
                className="p-5 flex items-center gap-4 hover:bg-[#F8FAFC] transition-colors"
              >
                <img
                  src={dev.src}
                  alt={dev.name}
                  width={56}
                  height={56}
                  loading="lazy"
                  className="w-14 h-14 rounded-full object-cover border border-[#CBD5E1] bg-[#F8FAFC] shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="text-[15px] font-bold text-[#0A2540] truncate">
                    {dev.name}
                  </h3>
                  <p className="text-[12px] font-semibold text-[#475569] truncate">
                    {dev.designation}
                  </p>
                  {dev.linkedin && (
                    <a
                      href={dev.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11.5px] font-bold text-[#0A2540] hover:underline underline-offset-4 mt-1"
                    >
                      <span>Profile</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteLegalFooter />
    </div>
  );
}
