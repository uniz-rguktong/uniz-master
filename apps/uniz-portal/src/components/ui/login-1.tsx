import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { UnizLogo } from "@/components/admin/UnizLogo";
import { UNIZ_CAMPUS_LABEL } from "@/constants/branding";
import { portalFooterClass } from "@/lib/portal-ui";
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
}

const roleMeta: Record<
  NonNullable<LoginScreenProps["role"]>,
  { label: string; hint: string }
> = {
  student: { label: "Student Portal", hint: "Grades, attendance, outpass" },
  admin: { label: "Staff Portal", hint: "Campus operations & records" },
  faculty: { label: "Faculty Portal", hint: "Classes, marks & attendance" },
};

/**
 * ExamCell-style auth layout: fixed navy header + centered form + light footer.
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
}: LoginScreenProps) {
  const meta = roleMeta[role];

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#FAFAFA] font-sans selection:bg-[#EEEEEE] selection:text-[#0A2540]">
      {/* Fixed 60px navy header */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-[60px] items-center border-b border-[#021227] bg-portal-header px-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex min-h-11 items-center gap-1 rounded-portal-sm px-2 py-1.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}
            <div className="min-w-0">
              <UnizLogo size="md" variant="auth" />
            </div>
          </div>
          <span className="shrink-0 rounded-portal-sm border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/90">
            {meta.label}
          </span>
        </div>
      </header>

      {/* Centered form */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-10 pt-[84px] sm:px-6">
        <div className="w-full min-w-0 max-w-[420px]">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-5 text-center"
          >
            <p className="text-[12px] font-medium text-navy-500 font-form">
              {meta.hint}
            </p>
          </motion.div>

          <div className="rounded-portal-lg border border-navy-200 bg-white p-5 shadow-whisper sm:p-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={stepKey || title}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="mb-5"
              >
                <h1 className="text-[1.375rem] font-semibold leading-tight tracking-[-0.01em] text-navy-900 sm:text-[1.5rem]">
                  {title || (isLogin ? "Sign in" : "Create account")}
                </h1>
                {subtitle && (
                  <p className="mt-1.5 text-[14px] leading-relaxed text-navy-500 font-form">
                    {subtitle}
                  </p>
                )}
              </motion.div>
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={stepKey || "form"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>

          {onToggleMode && (
            <div className="mt-6 text-center text-[14px] text-navy-500 font-form">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={onToggleMode}
                className="inline-flex min-h-11 items-center font-semibold text-navy-900 underline-offset-4 transition-colors hover:underline font-button"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Light institutional footer */}
      <footer
        className={cn(
          portalFooterClass,
          "mt-auto px-4 py-4 text-center text-[12px] sm:px-6",
        )}
      >
        <p className="font-medium text-navy-700">
          {UNIZ_CAMPUS_LABEL}
          {bottomText ? ` · ${bottomText}` : ""}
        </p>
        <p className="mt-1 text-[11px] text-navy-500">
          Examination & academic services
        </p>
      </footer>
    </div>
  );
}
