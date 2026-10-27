import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, ExternalLink, ShieldCheck, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import SiteLegalFooter from "@/components/SiteLegalFooter";
import { UNIZ_APK_PATH, openIosDownloadModal } from "@/constants/downloads";

export const examcellLoginLabelClass =
  "block text-[13px] font-bold tracking-[0.01em] text-[#0A2540] mb-1.5 font-form";

export const examcellLoginInputClass =
  "w-full h-11 rounded-[2px] border border-[#CBD5E1] bg-white px-3.5 text-[14.5px] font-medium text-[#0F172A] placeholder:text-[#94A3B8] placeholder:font-normal focus:outline-none focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/12 font-form transition-all";

export const examcellLoginLinkClass =
  "inline-block text-[12.5px] font-semibold text-[#0A2540] hover:underline underline-offset-4 bg-transparent border-0 cursor-pointer p-0 mt-1 font-form";

export const examcellLoginButtonClass =
  "w-full h-11 rounded-[2px] border-0 bg-[#0A2540] px-6 text-[13.5px] font-bold uppercase tracking-[0.06em] text-white shadow-[0_1px_2px_rgba(10,37,64,0.15)] transition-colors hover:bg-[#061B33] active:opacity-95 disabled:opacity-75 disabled:cursor-not-allowed font-form cursor-pointer";

export interface LoginProps {
  title?: string;
  subtitle?: string;
  bottomText?: React.ReactNode;
  children?: React.ReactNode;
  isLogin?: boolean;
  onBack?: () => void;
  role?: "student" | "admin" | "faculty";
  stepKey?: string;
}

const ROLE_META: Record<
  NonNullable<LoginProps["role"]>,
  {
    badge: string;
    heading: string;
    description: string;
    bullets: string[];
  }
> = {
  student: {
    badge: "Student Single Sign-On",
    heading: "RGUKT Ongole Student Portal",
    description:
      "Authenticate with your official University ID to access academic records, examination grade sheets, and residential campus services.",
    bullets: [
      "End-Semester Examination Results & SGPA/CGPA Transcripts",
      "Semester Course Registration & Credit Ledger",
      "Subject-Wise Biometric & Class Attendance Records",
      "Hostel Outpass & Leave Clearance Requests",
    ],
  },
  faculty: {
    badge: "Faculty Authentication",
    heading: "Faculty Academic Portal",
    description:
      "Sign in with your departmental faculty credentials to manage course rosters, attendance logs, and examination grade submissions.",
    bullets: [
      "Departmental Course Allocation & Student Rosters",
      "Lecture & Laboratory Attendance Submission",
      "Mid-Semester & End-Semester Grade Uploads",
      "Academic Circulars & Departmental Notices",
    ],
  },
  admin: {
    badge: "Administrative Authentication",
    heading: "Campus & Examination Administration",
    description:
      "Authorized sign-in for the Office of the Controller of Examinations, Deans, Head of Departments, Chief Warden, and Campus Security.",
    bullets: [
      "Examination Results Publication & Curriculum Management",
      "Student & Faculty Directory Administration",
      "Hostel Warden Outpass Approvals & Security Gate Desk",
      "Official Campus Announcements & Push Bulletins",
    ],
  },
};

export const LoginScreen = ({
  title = "University Sign In",
  subtitle,
  bottomText,
  children,
  onBack,
  role = "student",
  stepKey = "signin",
}: LoginProps) => {
  const meta = ROLE_META[role] ?? ROLE_META.student;

  const defaultSubtitle =
    stepKey === "signin"
      ? role === "student"
        ? "Sign in using your RGUKT Ongole University ID and password."
        : "Sign in using your authorized staff or administrative credentials."
      : subtitle;

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#F8FAFC] text-[#0F172A] font-sans">
      {/* Tier 1: Slim Institutional Utility Bar */}
      <div className="bg-[#061527] text-white/80 border-b border-white/10">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 text-[11.5px] tracking-[0.03em]">
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-white/95">RGUKT ONGOLE</span>
            <span className="hidden sm:inline text-white/30">·</span>
            <span className="hidden sm:inline text-white/75">
              Office of the Controller of Examinations &amp; Academic Affairs
            </span>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <a
              href={UNIZ_APK_PATH}
              download="uniz-android.apk"
              className="inline-flex items-center gap-1 text-white/80 hover:text-white transition-colors"
            >
              <Download className="w-3 h-3" />
              <span>Android App</span>
            </a>
            <button
              type="button"
              onClick={() => openIosDownloadModal()}
              className="inline-flex items-center gap-1 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <Smartphone className="w-3 h-3" />
              <span>iOS App</span>
            </button>
            <Link
              to="/developers"
              className="hidden sm:inline text-white/80 hover:text-white transition-colors"
            >
              Developers
            </Link>
          </div>
        </div>
      </div>

      {/* Tier 2: Formal Authentication Header */}
      <header className="bg-[#0A2540] text-white border-b border-[#163A5C]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3.5 text-white no-underline">
            <img
              src="/logo.png"
              alt="RGUKT Ongole UniZ Seal"
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover shrink-0 border border-white/25 bg-[#061527]"
              decoding="async"
            />
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2.5">
                <span className="text-[21px] font-bold tracking-[0.03em] text-white leading-none">
                  uniZ
                </span>
                <span className="hidden sm:inline text-white/30">|</span>
                <span className="hidden sm:inline text-[13px] font-medium text-white/90 leading-none">
                  University Authentication Service
                </span>
              </div>
              <span className="text-[10.5px] tracking-[0.08em] uppercase text-white/65 mt-1 leading-none">
                Rajiv Gandhi University of Knowledge Technologies · Ongole
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[2px] border border-white/25 bg-white/5 hover:bg-white/10 text-white text-[12.5px] font-semibold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Portal Home</span>
              </button>
            ) : (
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[2px] border border-white/25 bg-white/5 hover:bg-white/10 text-white text-[12.5px] font-semibold transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Portal Home</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Centered HarvardKey-Style Institutional Sign-In Sheet */}
      <main className="flex-1 flex flex-col justify-center py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-12 border border-[#CBD5E1] bg-white rounded-[2px] shadow-[0_2px_10px_rgba(10,37,64,0.06)] overflow-hidden">
            {/* Left Institutional Context Column (5 Cols) */}
            <div className="order-2 md:order-1 md:col-span-5 bg-[#0A2540] text-white p-6 sm:p-8 flex flex-col justify-between space-y-8 border-t md:border-t-0 md:border-r border-[#163A5C]">
              <div className="space-y-5">
                <div className="flex items-center gap-2.5 border-b border-white/15 pb-3.5">
                  <img
                    src="/rgukt-logo.png"
                    alt="RGUKT Emblem"
                    width={24}
                    height={28}
                    className="h-6 w-auto object-contain shrink-0"
                  />
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/85">
                    {meta.badge}
                  </span>
                </div>

                <div>
                  <h2 className="text-[22px] font-bold text-white leading-snug tracking-[-0.01em]">
                    {meta.heading}
                  </h2>
                  <p className="text-[13px] text-white/80 leading-relaxed mt-2">
                    {meta.description}
                  </p>
                </div>

                <div className="space-y-2.5 pt-1">
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-white/65">
                    Authorized Portal Services
                  </p>
                  <ul className="space-y-2 text-[12.5px] text-white/85">
                    {meta.bullets.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="text-white/60 font-bold leading-4">·</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-3 border-t border-white/15 pt-4 text-[12px] text-white/75">
                <div className="flex items-center gap-2 text-white/90 font-semibold">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Official Mobile Companion Apps</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={UNIZ_APK_PATH}
                    download="uniz-android.apk"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[2px] border border-white/25 bg-white/5 hover:bg-white/10 text-white text-[11.5px] font-semibold transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    <span>Android (.apk)</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => openIosDownloadModal()}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[2px] border border-white/25 bg-white/5 hover:bg-white/10 text-white text-[11.5px] font-semibold transition-colors cursor-pointer"
                  >
                    <Smartphone className="w-3 h-3" />
                    <span>iOS App</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Sign-In Form Column (7 Cols) */}
            <div className="order-1 md:order-2 md:col-span-7 bg-white p-6 sm:p-9 flex flex-col justify-between">
              <div className="space-y-6">
                {/* Role Switcher Tabs */}
                <div className="flex items-center border-b border-[#E2E8F0] gap-1">
                  <Link
                    to="/student/signin"
                    className={cn(
                      "px-3.5 py-2 text-[12.5px] font-bold tracking-[0.03em] border-b-2 -mb-px transition-colors",
                      role === "student"
                        ? "border-[#0A2540] text-[#0A2540]"
                        : "border-transparent text-[#64748B] hover:text-[#0A2540]",
                    )}
                  >
                    Student Portal
                  </Link>
                  <Link
                    to="/faculty/signin"
                    className={cn(
                      "px-3.5 py-2 text-[12.5px] font-bold tracking-[0.03em] border-b-2 -mb-px transition-colors",
                      role === "faculty"
                        ? "border-[#0A2540] text-[#0A2540]"
                        : "border-transparent text-[#64748B] hover:text-[#0A2540]",
                    )}
                  >
                    Faculty Portal
                  </Link>
                  <Link
                    to="/admin/signin"
                    className={cn(
                      "px-3.5 py-2 text-[12.5px] font-bold tracking-[0.03em] border-b-2 -mb-px transition-colors",
                      role === "admin"
                        ? "border-[#0A2540] text-[#0A2540]"
                        : "border-transparent text-[#64748B] hover:text-[#0A2540]",
                    )}
                  >
                    Administration
                  </Link>
                </div>

                {/* Form Title & Subtitle */}
                <div>
                  <h1 className="text-[22px] sm:text-[24px] font-bold tracking-[-0.01em] text-[#0A2540]">
                    {title === "Login Portal" ? "University Sign In" : title}
                  </h1>
                  {(defaultSubtitle || subtitle) && (
                    <p className="text-[13.5px] text-[#475569] mt-1 leading-relaxed">
                      {subtitle || defaultSubtitle}
                    </p>
                  )}
                </div>

                {/* Form Body */}
                <div key={stepKey} className="w-full">
                  {children}
                </div>

                {bottomText && <div className="pt-1">{bottomText}</div>}
              </div>

              {/* Institutional Help & Policy Note */}
              <div className="mt-8 pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[12px] text-[#64748B]">
                <span>
                  Assistance:{" "}
                  <a
                    href="mailto:webadmin@rguktong.ac.in"
                    className="font-semibold text-[#0A2540] hover:underline underline-offset-2"
                  >
                    webadmin@rguktong.ac.in
                  </a>
                </span>
                <div className="flex items-center gap-3">
                  <Link
                    to="/developers"
                    className="font-semibold text-[#0A2540] hover:underline underline-offset-2"
                  >
                    Software Development Cell
                  </Link>
                  <span>·</span>
                  <a
                    href="https://rguktong.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 font-semibold text-[#0A2540] hover:underline underline-offset-2"
                  >
                    <span>rguktong.in</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteLegalFooter />
    </div>
  );
};

export default LoginScreen;
