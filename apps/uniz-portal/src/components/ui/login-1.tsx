// Login Screen Component — Enhanced with role theming, animated hero, framer-motion transitions

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
  stepKey?: string; // for animating step transitions
}

const ROLE_CONFIG = {
  student: {
    accentGradient: "from-blue-600 via-indigo-600 to-violet-700",
    orb1: "bg-blue-500/30",
    orb2: "bg-indigo-600/20",
    orb3: "bg-violet-500/15",
    tagline: "Student Portal",
    tagBg: "bg-blue-500/20 text-blue-200 border-blue-400/30",
  },
  admin: {
    accentGradient: "from-slate-800 via-gray-900 to-zinc-900",
    orb1: "bg-amber-500/20",
    orb2: "bg-slate-500/20",
    orb3: "bg-zinc-400/15",
    tagline: "Administrator Portal",
    tagBg: "bg-amber-500/20 text-amber-200 border-amber-400/30",
  },
  faculty: {
    accentGradient: "from-emerald-700 via-teal-700 to-cyan-800",
    orb1: "bg-emerald-500/25",
    orb2: "bg-teal-500/20",
    orb3: "bg-cyan-500/15",
    tagline: "Faculty Portal",
    tagBg: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
  },
};

export default function LoginScreen({
  isLogin = true,
  onToggleMode,
  title,
  subtitle,
  children,
  heroTitle,
  bottomText,
  role = "student",
  stepKey,
}: LoginScreenProps) {
  const config = ROLE_CONFIG[role];

  return (
    <div className="w-full min-h-screen flex bg-white font-sans selection:bg-navy-100 selection:text-navy-900">
      {/* Mobile-only: uniZ logo pinned to top center */}
      <div className="md:hidden fixed top-0 left-0 w-full z-40 flex justify-center pt-5 pb-3 bg-white/90 backdrop-blur-lg border-b border-slate-100">
        <span className="unifrakturcook-bold text-4xl text-slate-900 tracking-tight leading-none">
          uniZ
        </span>
      </div>

      {/* Left side - Hero section */}
      <div className="hidden lg:flex flex-1 bg-navy-900 items-center justify-center p-12 relative overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className={`absolute top-[-15%] left-[-10%] w-[50%] h-[50%] ${config.orb1} rounded-full blur-[100px]`}
            animate={{
              x: [0, 30, -20, 0],
              y: [0, -25, 15, 0],
              scale: [1, 1.1, 0.95, 1],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className={`absolute bottom-[-10%] right-[-15%] w-[55%] h-[55%] ${config.orb2} rounded-full blur-[120px]`}
            animate={{
              x: [0, -25, 20, 0],
              y: [0, 20, -30, 0],
              scale: [1, 0.9, 1.05, 1],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className={`absolute top-[40%] left-[30%] w-[35%] h-[35%] ${config.orb3} rounded-full blur-[80px]`}
            animate={{
              x: [0, 15, -10, 0],
              y: [0, -10, 20, 0],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://res.cloudinary.com/diipfzmyj/image/upload/v1772885809/signIn_ojzi3w.png"
            alt="UNIZ Login"
            className="w-full h-full object-cover"
          />
        </div>

        {heroTitle && (
          <div className="text-white max-w-xl relative z-10 text-center">
            <h1 className="text-6xl font-black mb-8 leading-[1.1] tracking-tight">
              {heroTitle}
            </h1>
            <div className="w-20 h-1.5 bg-navy-500 rounded-full mx-auto" />
          </div>
        )}

        {/* Bottom Text */}
        {bottomText && (
          <motion.div
            className="absolute bottom-10 left-0 w-full text-center z-20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <span className="text-white/70 font-bold tracking-[0.3em] uppercase text-xs">
              {bottomText}
            </span>
          </motion.div>
        )}
      </div>

      {/* Right side - Login/Signup form */}
      <div className="flex-1 bg-white flex items-center justify-center p-8 sm:p-12 md:p-16 lg:p-20">
        <div className="w-full max-w-md">
          {/* Logo Section - hidden on mobile, visible on md+ */}
          <div className="hidden md:block text-center mb-10">
            <motion.div
              className="inline-flex items-center justify-center mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <span className="unifrakturcook-bold text-5xl text-slate-900 tracking-tight leading-none">
                uniZ
              </span>
            </motion.div>
            <AnimatePresence mode="wait">
              <motion.div
                key={stepKey || title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">
                  {title || (isLogin ? "Welcome Back" : "Join Us Today")}
                </h2>
                <p className="text-slate-500 font-medium text-[15px]">
                  {subtitle ||
                    (isLogin
                      ? "Continue your journey with the UNIZ portal"
                      : "Start your journey with the UNIZ portal")}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Mobile-only: title + subtitle below the fixed top logo */}
          <div className="md:hidden text-center mb-8 pt-14">
            <AnimatePresence mode="wait">
              <motion.div
                key={`mobile-${stepKey || title}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
                  {title || (isLogin ? "Welcome Back" : "Join Us Today")}
                </h2>
                <p className="text-slate-500 font-medium text-[15px]">
                  {subtitle ||
                    (isLogin
                      ? "Continue your journey with the UNIZ portal"
                      : "Start your journey with the UNIZ portal")}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Form Content — animated step transitions */}
          <AnimatePresence mode="wait">
            <motion.div
              key={stepKey || "default"}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="space-y-6"
            >
              {children}
            </motion.div>
          </AnimatePresence>

          {/* Optional Toggle Mode (Hidden if not provided) */}
          {onToggleMode && (
            <div className="text-center mt-8 pt-8 border-t border-slate-100">
              <span className="text-slate-500">
                {isLogin ? "Don't have an account?" : "Already have account?"}
              </span>{" "}
              <button
                type="button"
                onClick={onToggleMode}
                className="text-navy-900 hover:text-navy-800 font-bold transition-colors"
              >
                {isLogin ? "Sign Up" : "Login"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
