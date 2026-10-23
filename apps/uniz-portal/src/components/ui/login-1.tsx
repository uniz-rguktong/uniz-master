import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { UNIZ_CAMPUS_LABEL, UNIZ_SUPPORT_EMAIL } from "@/constants/branding";
import { cn } from "@/lib/utils";

interface LoginScreenProps {
  isLogin?: boolean;
  onToggleMode?: () => void;
  onBack?: () => void;
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  heroTitle?: string;
  bottomText?: string;
  role?: "student" | "admin" | "faculty";
  stepKey?: string;
  /** Optional lines under @ROLE (ExamCell-style > bullets) */
  roleFeatures?: string[];
  formError?: string | null;
}

const roleMeta: Record<
  NonNullable<LoginScreenProps["role"]>,
  { atLabel: string; features: string[] }
> = {
  student: {
    atLabel: "@STUDENT",
    features: ["Academic results", "Sem registrations", "Attendance & grades"],
  },
  admin: {
    atLabel: "@STAFF",
    features: ["Campus operations", "Records & uploads", "Approvals"],
  },
  faculty: {
    atLabel: "@FACULTY",
    features: ["Classes & marks", "Attendance", "Student lookup"],
  },
};

/**
 * ExamCell-faithful auth layout:
 * 60px gradient header · split @ROLE panel + overlapping LOGIN PORTAL · #eee footer
 */
export default function LoginScreen({
  isLogin = true,
  onToggleMode,
  onBack,
  title,
  subtitle,
  children,
  bottomText,
  role = "student",
  stepKey,
  roleFeatures,
  formError,
}: LoginScreenProps) {
  const meta = roleMeta[role];
  const features = roleFeatures ?? meta.features;

  return (
    <div className="flex min-h-screen w-full flex-col bg-white font-sans selection:bg-[#EEEEEE] selection:text-[#0A2540]">
      {/* Fixed 60px ExamCell header */}
      <header className="fixed inset-x-0 top-0 z-[100] flex h-[60px] items-center portal-header-chrome text-white">
        <div className="mx-auto flex w-[94%] items-center justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex h-8 items-center gap-1 text-sm font-medium tracking-[0.5px] text-white/90 hover:text-white"
                aria-label="Back"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <a
              href="/"
              className="flex min-w-0 items-center gap-2.5 text-white no-underline"
            >
              <img
                src="/logo.png"
                alt=""
                className="h-8 w-8 shrink-0 rounded-full object-cover brightness-0 invert"
              />
              <h2 className="truncate text-[20px] font-bold uppercase tracking-[2px] sm:text-[22px]">
                Exam Cell
              </h2>
            </a>
          </div>
          <p className="hidden shrink-0 text-right text-[15px] font-bold uppercase tracking-[1.5px] text-white sm:block sm:text-[17px]">
            {UNIZ_CAMPUS_LABEL}
          </p>
        </div>
      </header>

      {/* Body — ExamCell split login */}
      <main className="relative flex flex-1 flex-col bg-white pt-[60px]">
        <div className="mx-auto flex w-[94%] flex-1 flex-col py-6 md:py-10 lg:min-h-[calc(100vh-110px)] lg:flex-row lg:items-center lg:gap-[2%]">
          {/* Left: @ROLE gradient strip */}
          <div className="relative mb-6 w-full lg:mb-0 lg:w-[49%]">
            <div
              className="relative min-h-[200px] rounded-[2px] px-4 pb-6 pt-8 text-white shadow-examcell md:min-h-[250px] md:px-5 md:pt-9"
              style={{
                backgroundImage:
                  "radial-gradient(circle farthest-corner at 16.5% 37.3%, rgba(10,37,64,1) 0.1%, rgba(2,18,39,1) 90%)",
              }}
            >
              <div className="max-w-[320px] lg:max-w-[38%]">
                <b className="mb-5 block text-center text-[20px] font-bold uppercase tracking-[1px] text-[#FAFAFA]">
                  {meta.atLabel}
                </b>
                {features.map((line) => (
                  <span
                    key={line}
                    className="mt-2.5 block pl-6 text-[11px] uppercase tracking-[0.8px] text-[#FAFAFA]"
                  >
                    <b className="mr-1">&gt;</b> {line}
                  </span>
                ))}
                <p className="mt-6 text-[12px] font-normal normal-case tracking-[0.5px] text-white/90 md:mt-8">
                  For login issues contact @ {UNIZ_SUPPORT_EMAIL}
                </p>
              </div>

              {/* Overlapping LOGIN PORTAL card (desktop) */}
              <div
                className="relative z-10 mt-6 w-full overflow-hidden rounded-[1px] px-6 py-8 text-white uppercase tracking-[0.5px] shadow-examcell-lg md:px-8 lg:absolute lg:right-[-8%] lg:top-1/2 lg:mt-0 lg:w-[72%] lg:-translate-y-1/2 lg:min-h-[300px]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle farthest-corner at 16.5% 37.3%, rgba(10,37,64,1) 0.1%, rgba(2,18,39,1) 90%)",
                  backgroundColor: "#032B3F",
                }}
              >
                {formError ? (
                  <div className="mb-4 min-h-[30px] bg-[#EA2027] px-2.5 text-[13px] font-normal normal-case leading-[30px] tracking-[1px]">
                    &gt;&gt; {formError}
                  </div>
                ) : null}

                <AnimatePresence mode="wait">
                  <motion.div
                    key={stepKey || title}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h2 className="mb-6 font-form text-[20px] font-bold tracking-[2px]">
                      {title || (isLogin ? "Login Portal" : "Create Account")}
                    </h2>
                    {subtitle ? (
                      <p className="mb-4 text-[12px] font-normal normal-case tracking-[1px] text-[#EEEEEE]">
                        {subtitle}
                      </p>
                    ) : null}
                  </motion.div>
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={stepKey || "form"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="examcell-login-form font-form normal-case"
                  >
                    {children}
                  </motion.div>
                </AnimatePresence>

                {onToggleMode && (
                  <div className="mt-5 text-[12px] font-normal normal-case tracking-[1px] text-[#EEEEEE]">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                    <button
                      type="button"
                      onClick={onToggleMode}
                      className="font-semibold text-white underline underline-offset-2"
                    >
                      {isLogin ? "Sign up" : "Sign in"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column spacer / notices area on large screens */}
          <div className="hidden w-[49%] lg:block" aria-hidden />
        </div>
      </main>

      {/* ExamCell #eee footer */}
      <footer className="relative z-20 mt-auto h-[50px] bg-[#EEEEEE] font-form text-[14px] font-bold tracking-[0.5px] text-[#061B33]">
        <div className="mx-auto flex h-full w-[94%] items-center justify-between">
          <span className="truncate uppercase">
            Copyright © {UNIZ_CAMPUS_LABEL}
            {bottomText ? ` · ${bottomText}` : ""}
          </span>
          <span className="hidden shrink-0 sm:inline">
            Developed By SoftwareDevelopmentCell
          </span>
        </div>
      </footer>
    </div>
  );
}

/** Class helpers for fields inside the ExamCell login card */
export const examcellLoginLabelClass =
  "mb-1 block text-[12px] font-bold uppercase tracking-[1px] text-white font-form";

export const examcellLoginInputClass =
  "mb-4 w-full box-border rounded-[1px] border-0 bg-white px-2.5 py-2.5 text-[15px] font-bold tracking-[1px] text-[#0A2540] outline-none font-form placeholder:font-medium placeholder:text-[#9bb0c4]";

export const examcellLoginButtonClass =
  "mt-2 inline-flex h-[35px] items-center justify-center rounded-[1px] bg-[#34495e] px-[45px] font-form text-[13px] font-bold uppercase tracking-[2px] text-white shadow-examcell hover:bg-[#2c3e50] disabled:opacity-40";

export const examcellLoginLinkClass =
  "mt-5 block text-[12px] font-normal capitalize tracking-[1px] text-[#EEEEEE] underline-offset-2 hover:underline";
