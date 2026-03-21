"use client";

import { motion } from "framer-motion";
import {
  Bell,
  Megaphone,
  AlertCircle,
  Smartphone,
  Database,
  ShieldCheck,
  Activity,
} from "lucide-react";
import { cn } from "../../lib/utils";

interface DatabaseWithRestApiProps {
  className?: string;
  badgeTexts?: {
    first: string;
    second: string;
    third: string;
    fourth: string;
  };
  buttonTexts?: {
    first: string;
    second: string;
    third?: string;
    fourth?: string;
  };
  title?: string;
  lightColor?: string;
}

const DatabaseWithRestApi = ({
  className,
  badgeTexts = {
    first: "Results",
    second: "Registrations",
    third: "Attendance",
    fourth: "Seating",
  },
  buttonTexts = {
    first: "Notifications",
    second: "Banners",
    third: "Grievances",
    fourth: "PWA",
  },
  title = "Unified Campus Management System",
  lightColor = "#00A6F5",
}: DatabaseWithRestApiProps) => {
  return (
    <div
      className={cn(
        "relative flex h-[380px] sm:h-[450px] w-full flex-col items-center",
        className,
      )}
    >
      {/* SVG Paths  */}
      <svg
        className="h-full w-full text-slate-300"
        width="100%"
        height="100%"
        viewBox="0 0 200 100"
      >
        {/* Top Connectors (Inputs) */}
        <g
          stroke="currentColor"
          fill="none"
          strokeWidth="0.4"
          strokeDasharray="1 2"
          className="text-slate-300 opacity-50"
        >
          <path d="M 31 0 v 5" />
          <path d="M 77 0 v 5" />
          <path d="M 124 0 v 5" />
          <path d="M 170 0 v 5" />
        </g>
        {/* Desktop Paths (hidden on mobile) */}
        <g
          stroke="currentColor"
          fill="none"
          strokeWidth="0.4"
          strokeDasharray="100 100"
          pathLength="100"
          className="hidden sm:block"
        >
          <path d="M 31 10 v 15 q 0 5 5 5 h 59 q 5 0 5 5 v 10" />
          <path d="M 77 10 v 10 q 0 5 5 5 h 13 q 5 0 5 5 v 15" />
          <path d="M 124 10 v 10 q 0 5 -5 5 h -14 q -5 0 -5 5 v 15" />
          <path d="M 170 10 v 15 q 0 5 -5 5 h -60 q -5 0 -5 5 v 10" />
          <animate
            attributeName="stroke-dashoffset"
            from="100"
            to="0"
            dur="1s"
            fill="freeze"
            calcMode="spline"
            keySplines="0.25,0.1,0.5,1"
            keyTimes="0; 1"
          />
        </g>
        {/* Mobile Paths (hidden on desktop) - MOVED UP */}
        <g
          stroke="currentColor"
          fill="none"
          strokeWidth="0.4"
          strokeDasharray="100 100"
          pathLength="100"
          className="block sm:hidden"
        >
          <path d="M 31 6 v 19 q 0 5 5 5 h 59 q 5 0 5 5 v 10" />
          <path d="M 77 6 v 14 q 0 5 5 5 h 13 q 5 0 5 5 v 15" />
          <path d="M 124 6 v 14 q 0 5 -5 5 h -14 q -5 0 -5 5 v 15" />
          <path d="M 170 6 v 19 q 0 5 -5 5 h -60 q -5 0 -5 5 v 10" />
          <animate
            attributeName="stroke-dashoffset"
            from="100"
            to="0"
            dur="1s"
            fill="freeze"
            calcMode="spline"
            keySplines="0.25,0.1,0.5,1"
            keyTimes="0; 1"
          />
        </g>
        {/* Blue Lights */}
        <g mask="url(#db-mask-1)">
          <circle
            className="database db-light-1"
            cx="0"
            cy="0"
            r="12"
            fill="url(#db-blue-grad)"
          />
        </g>
        <g mask="url(#db-mask-2)">
          <circle
            className="database db-light-2"
            cx="0"
            cy="0"
            r="12"
            fill="url(#db-blue-grad)"
          />
        </g>
        <g mask="url(#db-mask-3)">
          <circle
            className="database db-light-3"
            cx="0"
            cy="0"
            r="12"
            fill="url(#db-blue-grad)"
          />
        </g>
        <g mask="url(#db-mask-4)">
          <circle
            className="database db-light-4"
            cx="0"
            cy="0"
            r="12"
            fill="url(#db-blue-grad)"
          />
        </g>
        {/* Buttons - Separated Mobile and Desktop */}
        <g stroke="currentColor" fill="none" strokeWidth="0.4">
          {/* Desktop Badges */}
          <g className="hidden sm:block">
            {[
              { x: 14, tx: 31, text: badgeTexts?.first },
              { x: 60, tx: 77, text: badgeTexts?.second },
              { x: 108, tx: 125, text: badgeTexts?.third },
              { x: 150, tx: 167, text: badgeTexts?.fourth }
            ].map((b, i) => (
              <g key={i}>
                <rect fill="#ffffff" stroke="#e2e8f0" x={b.x} y="5" width="34" height="10" rx="5" />
                <text x={b.tx} y="11.5" fill="#0f172a" stroke="none" fontSize="4" fontWeight="600" textAnchor="middle">{b.text}</text>
              </g>
            ))}
          </g>

          {/* Mobile Badges - MOVED UP to y=1 */}
          <g className="block sm:hidden">
            {[
              { x: 11, tx: 31, text: badgeTexts?.first },
              { x: 57, tx: 77, text: badgeTexts?.second },
              { x: 104, tx: 124, text: badgeTexts?.third },
              { x: 150, tx: 170, text: badgeTexts?.fourth }
            ].map((b, i) => (
              <g key={i}>
                <rect fill="#ffffff" stroke="#e2e8f0" x={b.x} y="0" width="40" height="12" rx="6" />
                <text x={b.tx} y="7.8" fill="#0f172a" stroke="none" fontSize="5.5" fontWeight="600" textAnchor="middle">{b.text}</text>
              </g>
            ))}
          </g>
        </g>
        <defs>
          {/* 1 -  user list */}
          <mask id="db-mask-1">
            <path
              d="M 31 10 v 15 q 0 5 5 5 h 59 q 5 0 5 5 v 10"
              strokeWidth="0.5"
              stroke="white"
            />
          </mask>
          {/* 2 - task list */}
          <mask id="db-mask-2">
            <path
              d="M 77 10 v 10 q 0 5 5 5 h 13 q 5 0 5 5 v 15"
              strokeWidth="0.5"
              stroke="white"
            />
          </mask>
          {/* 3 - backlogs */}
          <mask id="db-mask-3">
            <path
              d="M 124 10 v 10 q 0 5 -5 5 h -14 q -5 0 -5 5 v 15"
              strokeWidth="0.5"
              stroke="white"
            />
          </mask>
          {/* 4 - misc */}
          <mask id="db-mask-4">
            <path
              d="M 170 10 v 15 q 0 5 -5 5 h -60 q -5 0 -5 5 v 10"
              strokeWidth="0.5"
              stroke="white"
            />
          </mask>
          {/* Blue Grad */}
          <radialGradient id="db-blue-grad" fx="1">
            <stop offset="0%" stopColor={lightColor} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
      </svg>
      {/* Main Box */}
      <div className="absolute bottom-10 flex w-full flex-col items-center px-4 sm:px-10">
        {/* bottom shadow */}
        <div className="absolute -bottom-2 h-[100px] w-full max-w-[95%] rounded-[3rem] bg-navy-500/10 scale-95" />
        {/* box title */}
        <div className="absolute top-0 -translate-y-1/2 z-20 flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-sm sm:top-auto sm:translate-y-0 sm:-top-4 sm:py-2">
          <span className="text-[12px] font-bold text-slate-800">{title}</span>
        </div>
        {/* box outter circle */}
        <div className="absolute -bottom-12 z-30 grid h-[100px] w-[100px] place-items-center rounded-full border border-slate-200 bg-white shadow-md text-slate-950 font-black group cursor-pointer">
          <span className="unifrakturcook-bold text-[3rem] text-slate-900 tracking-tight leading-none group-hover:scale-110 transition-transform duration-300">
            uniZ
          </span>
        </div>
        {/* box content */}
        <div className="relative z-10 flex h-[160px] sm:h-[250px] w-full items-center justify-center overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
          {/* Floating Badges */}
          <motion.div
            className="absolute top-8 left-8 sm:top-6 sm:left-12 z-20 h-7 sm:h-9 rounded-full bg-slate-50 px-3 sm:px-4 text-[11px] sm:text-sm font-semibold text-slate-700 border border-slate-200 flex items-center gap-2 shadow-sm cursor-pointer hover:bg-slate-100"
            animate={{ y: [0, -6, 0] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0,
            }}
          >
            <Bell className="size-4 text-navy-900" />
            <span>{buttonTexts?.first}</span>
          </motion.div>

          <motion.div
            className="absolute bottom-4 left-4 sm:bottom-6 sm:left-32 z-20 h-7 sm:h-9 rounded-full bg-slate-50 px-3 sm:px-4 text-[11px] sm:text-sm font-semibold text-slate-700 border border-slate-200 flex items-center gap-2 shadow-sm cursor-pointer hover:bg-slate-100"
            animate={{ y: [0, -8, 0] }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          >
            <AlertCircle className="size-4 text-navy-900" />
            <span>{buttonTexts?.third}</span>
          </motion.div>

          <motion.div
            className="absolute top-6 right-6 sm:top-8 sm:right-32 z-20 h-7 sm:h-9 rounded-full bg-slate-50 px-3 sm:px-4 text-[11px] sm:text-sm font-semibold text-slate-700 border border-slate-200 flex items-center gap-2 shadow-sm cursor-pointer hover:bg-slate-100"
            animate={{ y: [0, -5, 0] }}
            transition={{
              duration: 4.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
          >
            <Smartphone className="size-4 text-navy-900" />
            <span>{buttonTexts?.fourth}</span>
          </motion.div>

          <motion.div
            className="absolute bottom-4 right-4 sm:bottom-6 sm:right-12 z-20 h-7 sm:h-9 rounded-full bg-slate-50 px-3 sm:px-4 text-[11px] sm:text-sm font-semibold text-slate-700 border border-slate-200 flex items-center gap-2 shadow-sm cursor-pointer hover:bg-slate-100"
            animate={{ y: [0, -7, 0] }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
          >
            <Megaphone className="size-4 text-navy-900" />
            <span>{buttonTexts?.second}</span>
          </motion.div>
          {/* Circles */}
          <motion.div
            className="absolute -bottom-14 h-[100px] w-[100px] rounded-full border-t border-slate-200 bg-slate-50/50"
            animate={{
              scale: [0.98, 1.02, 0.98, 1, 1, 1, 1, 1, 1],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-20 h-[145px] w-[145px] rounded-full border-t border-slate-200 bg-slate-50/50"
            animate={{
              scale: [1, 1, 1, 0.98, 1.02, 0.98, 1, 1, 1],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-[100px] h-[190px] w-[190px] rounded-full border-t border-slate-200 bg-slate-50/50"
            animate={{
              scale: [1, 1, 1, 1, 1, 0.98, 1.02, 0.98, 1, 1],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-[120px] h-[235px] w-[235px] rounded-full border-t border-slate-200 bg-slate-50/50"
            animate={{
              scale: [1, 1, 1, 1, 1, 1, 0.98, 1.02, 0.98, 1],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Floating Internal Cards */}
          <div className="absolute inset-0 hidden sm:flex items-center justify-center gap-4 sm:gap-8 z-30 pointer-events-none px-4">
            <motion.div
              className="flex flex-col items-center justify-center bg-white/70 backdrop-blur-md border border-slate-200 shadow-sm rounded-2xl p-4 w-[110px] h-[100px] sm:w-[140px] sm:h-[120px]"
              animate={{ y: [-2, 2, -2] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Database className="text-navy-900 mb-2 size-5 sm:size-6" />
              <span className="text-xs sm:text-sm font-bold text-slate-800 text-center">
                Core Sync
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 text-center leading-tight mt-1">
                Real-time data flow
              </span>
            </motion.div>

            <motion.div
              className="flex flex-col items-center justify-center bg-white/70 backdrop-blur-md border border-slate-200 shadow-sm rounded-2xl p-4 w-[120px] h-[110px] sm:w-[160px] sm:h-[130px] border-b-2 border-b-blue-500 mb-4"
              animate={{ y: [2, -2, 2] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ShieldCheck className="text-navy-900 mb-2 size-6 sm:size-7" />
              <span className="text-sm sm:text-base font-bold text-slate-900 text-center">
                API Gateway
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500 text-center leading-tight mt-1">
                Secure endpoints
              </span>
            </motion.div>

            <motion.div
              className="flex flex-col items-center justify-center bg-white/70 backdrop-blur-md border border-slate-200 shadow-sm rounded-2xl p-4 w-[110px] h-[100px] sm:w-[140px] sm:h-[120px]"
              animate={{ y: [-2, 2, -2] }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
            >
              <Activity className="text-navy-900 mb-2 size-5 sm:size-6" />
              <span className="text-xs sm:text-sm font-bold text-slate-800 text-center">
                Webhooks
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 text-center leading-tight mt-1">
                Live metrics
              </span>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseWithRestApi;