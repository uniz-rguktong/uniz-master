import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { UnizLogo } from "@/components/admin/UnizLogo";

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
  student: { label: "Student portal", hint: "Grades, attendance, outpass" },
  admin: { label: "Staff portal", hint: "Campus operations & records" },
  faculty: { label: "Faculty portal", hint: "Classes, marks & attendance" },
};

export default function LoginScreen({
  isLogin = true,
  onToggleMode,
  onBack,
  title,
  subtitle,
  children,
  heroTitle,
  bottomText,
  role = "student",
  stepKey,
}: LoginScreenProps) {
  const meta = roleMeta[role];

  return (
    <div className="w-full min-h-screen overflow-x-hidden flex bg-white font-sans selection:bg-[#D4E8F5] selection:text-[#0B2A47]">
      {/* Left — cinematic hero */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden portal-banner-gradient">
        <div className="absolute inset-0">
          <img
            src="https://res.cloudinary.com/diipfzmyj/image/upload/v1772885809/signIn_ojzi3w.png"
            alt=""
            className="h-full w-full object-cover scale-[1.02] opacity-90"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#081E33] via-[#0B2A47]/55 to-[#0F3B63]/25" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#081E33]/90 via-[#0B2A47]/35 to-transparent" />

        <div className="relative z-10 flex flex-1 flex-col p-10 xl:p-14">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex w-fit items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          )}

          {heroTitle ? (
            <h1 className="mt-auto text-white text-5xl xl:text-6xl font-semibold leading-[1.05] tracking-[-0.04em] max-w-lg">
              {heroTitle}
            </h1>
          ) : (
            <div className="mt-auto max-w-md">
              <p className="text-[2.35rem] xl:text-[2.85rem] font-semibold text-white tracking-[-0.04em] leading-[1.08]">
                One login.
              </p>
              <p className="mt-2 text-xl xl:text-2xl font-light text-white/55 tracking-[-0.02em]">
                Your whole campus.
              </p>
            </div>
          )}

          {bottomText && (
            <motion.p
              className="mt-10 text-[12px] font-medium tracking-[0.01em] text-white/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.5 }}
            >
              {bottomText}
            </motion.p>
          )}
        </div>
      </div>

      {/* Right — form */}
      <div className="flex min-w-0 flex-1 flex-col min-h-screen overflow-x-hidden">
        {onBack && (
          <div className="lg:hidden px-5 pt-5">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          </div>
        )}

        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-10 sm:py-10 lg:px-14 xl:px-20">
          <div className="w-full min-w-0 max-w-[420px]">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-7"
            >
              <UnizLogo size="lg" variant="auth" portalLabel={meta.label} />
              <p className="mt-2 text-[12px] text-zinc-400 font-medium">
                {meta.hint}
              </p>
            </motion.div>

            <div className="rounded-2xl border border-[#D4E8F5] bg-white p-5 shadow-[0_1px_2px_rgba(11,42,71,0.04),0_8px_24px_rgba(11,42,71,0.06)] sm:p-7">
              <AnimatePresence mode="wait">
                <motion.div
                  key={stepKey || title}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="mb-6"
                >
                  <h1 className="text-[1.625rem] font-semibold text-[#0B2A47] tracking-[-0.03em] leading-tight">
                    {title || (isLogin ? "Sign in" : "Create account")}
                  </h1>
                  {subtitle && (
                    <p className="mt-1.5 text-[14px] text-zinc-500 leading-relaxed">
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
                  transition={{ duration: 0.2 }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>

            {onToggleMode && (
              <div className="mt-8 text-center text-[14px] text-zinc-500">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={onToggleMode}
                  className="text-zinc-950 font-semibold hover:underline underline-offset-4 transition-colors"
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </div>
            )}

            <p className="mt-6 text-center text-[12px] text-zinc-400 lg:hidden">
              {meta.hint}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
