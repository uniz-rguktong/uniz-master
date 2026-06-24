import { motion, AnimatePresence } from "framer-motion";

interface LoginScreenProps {
  isLogin?: boolean;
  onToggleMode?: () => void;
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  heroTitle?: string;
  bottomText?: string;
  role?: "student" | "admin" | "faculty";
  stepKey?: string;
}

export default function LoginScreen({
  isLogin = true,
  onToggleMode,
  title,
  subtitle,
  children,
  heroTitle,
  bottomText,
  stepKey,
}: LoginScreenProps) {
  return (
    <div className="w-full min-h-screen flex bg-white font-sans selection:bg-zinc-200 selection:text-zinc-950">
      {/* Left — cinematic hero */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-zinc-950">
        <div className="absolute inset-0">
          <img
            src="https://res.cloudinary.com/diipfzmyj/image/upload/v1772885809/signIn_ojzi3w.png"
            alt=""
            className="h-full w-full object-cover scale-[1.03]"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-zinc-950/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/80 via-zinc-950/20 to-transparent" />

        <div className="relative z-10 flex flex-1 flex-col justify-end p-12 xl:p-16">
          {heroTitle ? (
            <h1 className="text-white text-5xl xl:text-6xl font-black leading-[1.05] tracking-[-0.04em] max-w-lg mb-auto pt-4">
              {heroTitle}
            </h1>
          ) : (
            <div className="mb-auto pt-4 max-w-md">
              <p className="text-3xl xl:text-[2.75rem] font-black text-white tracking-[-0.04em] leading-[1.08]">
                One login.
                <span className="block text-white/40 font-light mt-1">
                  Everything campus.
                </span>
              </p>
            </div>
          )}

          {bottomText && (
            <motion.p
              className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              {bottomText}
            </motion.p>
          )}
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-20 sm:px-12 lg:px-16 xl:px-24">
        <div className="w-full max-w-[380px] mx-auto lg:mx-0 lg:max-w-[400px]">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-10"
          >
            <span className="unifrakturcook-bold text-[2.75rem] sm:text-[3rem] text-zinc-950 tracking-tight leading-none block">
              uniZ
            </span>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={stepKey || title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="mb-8"
            >
              <h1 className="text-[1.75rem] sm:text-[2rem] font-black text-zinc-950 tracking-[-0.04em] leading-tight">
                {title || (isLogin ? "Sign in" : "Create account")}
              </h1>
              {subtitle && (
                <p className="mt-2 text-[15px] text-zinc-400 font-medium leading-relaxed">
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

          {onToggleMode && (
            <div className="mt-10 pt-6 border-t border-zinc-100 text-[14px] text-zinc-500">
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
        </div>
      </div>
    </div>
  );
}
