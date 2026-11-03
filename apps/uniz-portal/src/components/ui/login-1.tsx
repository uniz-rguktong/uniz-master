import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, ExternalLink, ShieldCheck, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import SiteLegalFooter from "@/components/SiteLegalFooter";
import { UNIZ_APK_PATH, openIosDownloadModal } from "@/constants/downloads";

export const examcellLoginLabelClass =
  "block text-[13px] font-medium text-[#334155] mb-2 font-form";

export const examcellLoginInputClass =
  "w-full h-12 min-h-[44px] rounded-lg border border-line bg-white px-3.5 text-[15px] font-normal text-ink placeholder:text-ink-subtle shadow-[0_1px_2px_rgba(10,37,64,0.04)] hover:border-navy-300 focus:outline-none focus:border-navy focus:ring-4 focus:ring-navy/10 transition-[border-color,box-shadow] duration-150 ease-[cubic-bezier(0.2,0,0,1)]";

export const examcellLoginLinkClass =
  "inline-block text-[12.5px] font-semibold text-navy hover:underline underline-offset-4 bg-transparent border-0 cursor-pointer p-0 mt-1 font-form";

export const examcellLoginButtonClass =
  "w-full h-12 min-h-[44px] cursor-pointer rounded-lg border-0 bg-brand-red px-6 text-[15px] font-medium text-white transition-colors duration-150 hover:bg-[#C81A20] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-ink-subtle";

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
 <div className="campus-canvas flex min-h-screen w-full flex-col bg-surface text-ink">
      {/* Tier 1: Slim Institutional Utility Bar */}
 <div className="bg-navy-850 text-white/80 border-b border-white/10">
 <div className="mx-auto flex h-8 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 text-[11.5px] tracking-[0.03em]">
          <div className="flex items-center gap-2 truncate">
 <span className="font-semibold text-white/95">RGUKT ANDHRA PRADESH</span>
 <span className="hidden text-white/30 sm:inline">·</span>
 <span className="hidden text-white/75 sm:inline">
              Catering to the Educational Needs of Gifted Rural Youth
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
 <header className="sticky top-0 z-30 border-b border-line bg-white">
 <div className="mx-auto flex h-[68px] max-w-[90rem] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link to="/" className="flex items-center gap-3 no-underline">
            <img
              src="/rgukt-logo.png"
              alt="RGUKT Ongole"
              width={44}
              height={44}
              className="h-10 w-10 object-contain md:h-11 md:w-11"
              decoding="async"
            />
            <div className="hidden flex-col justify-center sm:flex">
 <span className="font-serif text-[1.35rem] font-semibold leading-none tracking-tight text-navy-900">
                uniZ
              </span>
 <span className="mt-1 text-[11px] font-medium text-ink-muted">
                Ongole campus portal
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
 className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border border-line bg-white px-3.5 text-sm font-medium text-navy-900 transition-colors duration-150 hover:bg-surface-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Portal Home</span>
              </button>
            ) : (
              <Link
                to="/"
 className="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-lg border border-line bg-white px-3.5 text-sm font-medium text-navy-900 transition-colors duration-150 hover:bg-surface-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Portal Home</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Centered HarvardKey-Style Institutional Sign-In Sheet */}
 <main className="relative flex flex-1 flex-col justify-center bg-surface px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <div className="relative mx-auto w-full max-w-[1040px]">
 <div className="grid grid-cols-1 overflow-hidden rounded-[12px] border border-line bg-white shadow-[0_12px_32px_-12px_rgba(6,21,39,0.18)] md:grid-cols-12">
            {/* Left Institutional Context Column (5 Cols) */}
 <div className="order-2 md:order-1 md:col-span-5 relative bg-[linear-gradient(160deg,#0A2540_0%,#021227_70%)] text-white before:absolute before:left-8 before:top-0 before:h-[3px] before:w-12 before:rounded-b-full before:bg-brand-red p-6 sm:p-10 flex flex-col justify-between space-y-8 border-t md:border-t-0 md:border-r border-navy-500">
              <div className="space-y-5">
                <div className="flex items-center gap-2.5 border-b border-white/15 pb-3.5">
                  <img
                    src="/rgukt-logo.png"
                    alt="RGUKT Emblem"
                    width={24}
                    height={28}
                    className="h-6 w-auto object-contain shrink-0"
                  />
 <span className="text-[12px] font-medium text-white/80">
                    {meta.badge}
                  </span>
                </div>

                <div>
 <h2 className="text-[26px] sm:text-[30px] font-semibold text-white leading-[1.15] tracking-[-0.03em]">
                    {meta.heading}
                  </h2>
 <p className="text-[14px] text-white/70 leading-6 mt-3">
                    {meta.description}
                  </p>
                </div>

                <div className="space-y-2.5 pt-1">
 <p className="text-[12px] font-medium text-white/60">
                    Authorized Portal Services
                  </p>
 <ul className="space-y-2.5 text-[13px] text-white/85">
                    {meta.bullets.map((item) => (
                      <li key={item} className="flex items-start gap-2">
 <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-brand-red" aria-hidden="true" />
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
 className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] text-white text-[11.5px] font-semibold transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    <span>Android (.apk)</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => openIosDownloadModal()}
 className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] text-white text-[11.5px] font-semibold transition-colors cursor-pointer"
                  >
                    <Smartphone className="w-3 h-3" />
                    <span>iOS App</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Sign-In Form Column (7 Cols) */}
 <div className="order-1 md:order-2 md:col-span-7 bg-white p-6 sm:p-12 flex flex-col justify-between">
              <div className="space-y-6">
                {/* Role Switcher Tabs */}
 <div className="flex items-center gap-1 overflow-x-auto rounded-lg bg-surface-2 p-1" aria-label="Choose portal">
                  <Link
                    to="/student/signin"
                    className={cn(
                      "inline-flex flex-1 items-center justify-center whitespace-nowrap min-h-[44px] px-2.5 sm:px-3.5 rounded-lg text-[13px] sm:text-[14px] font-semibold transition-[background-color,color,box-shadow] duration-150 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy",
                      role === "student"
                        ? "bg-white text-navy shadow-[0_1px_2px_rgba(10,37,64,0.08),0_0_0_1px_rgba(10,37,64,0.04)]"
                        : "text-ink-muted hover:text-navy hover:bg-white/60",
                    )}
                  >
                    <span className="sm:hidden">Student</span>
                    <span className="hidden sm:inline">Student Portal</span>
                  </Link>
                  <Link
                    to="/faculty/signin"
                    className={cn(
                      "inline-flex flex-1 items-center justify-center whitespace-nowrap min-h-[44px] px-2.5 sm:px-3.5 rounded-lg text-[13px] sm:text-[14px] font-semibold transition-[background-color,color,box-shadow] duration-150 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy",
                      role === "faculty"
                        ? "bg-white text-navy shadow-[0_1px_2px_rgba(10,37,64,0.08),0_0_0_1px_rgba(10,37,64,0.04)]"
                        : "text-ink-muted hover:text-navy hover:bg-white/60",
                    )}
                  >
                    <span className="sm:hidden">Faculty</span>
                    <span className="hidden sm:inline">Faculty Portal</span>
                  </Link>
                  <Link
                    to="/admin/signin"
                    className={cn(
                      "inline-flex flex-1 items-center justify-center whitespace-nowrap min-h-[44px] px-2.5 sm:px-3.5 rounded-lg text-[13px] sm:text-[14px] font-semibold transition-[background-color,color,box-shadow] duration-150 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy",
                      role === "admin"
                        ? "bg-white text-navy shadow-[0_1px_2px_rgba(10,37,64,0.08),0_0_0_1px_rgba(10,37,64,0.04)]"
                        : "text-ink-muted hover:text-navy hover:bg-white/60",
                    )}
                  >
                    <span className="sm:hidden">Admin</span>
                    <span className="hidden sm:inline">Administration</span>
                  </Link>
                </div>

                {/* Form Title & Subtitle */}
                <div>
 <h1 className="text-[30px] sm:text-[38px] font-semibold leading-[1.08] tracking-[-0.035em] text-navy">
                    {title === "Login Portal" ? "University Sign In" : title}
                  </h1>
                  {(defaultSubtitle || subtitle) && (
 <p className="text-[15px] text-ink-subtle mt-2 leading-6">
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
 <div className="mt-8 pt-5 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[12px] text-ink-subtle">
                <span>
                  Assistance:{" "}
                  <a
                    href="mailto:webadmin@rguktong.ac.in"
 className="font-semibold text-navy hover:underline underline-offset-2"
                  >
                    webadmin@rguktong.ac.in
                  </a>
                </span>
                <div className="flex items-center gap-3">
                  <Link
                    to="/developers"
 className="font-semibold text-navy hover:underline underline-offset-2"
                  >
                    Software Development Cell
                  </Link>
                  <span>·</span>
                  <a
                    href="https://rguktong.in"
                    target="_blank"
                    rel="noopener noreferrer"
 className="inline-flex items-center gap-0.5 font-semibold text-navy hover:underline underline-offset-2"
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
