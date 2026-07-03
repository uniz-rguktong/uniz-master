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

const TOP_BADGES = [
  { key: "first" as const, x: 14, tx: 31, mx: 11, mtx: 31 },
  { key: "second" as const, x: 60, tx: 77, mx: 57, mtx: 77 },
  { key: "third" as const, x: 108, tx: 125, mx: 104, mtx: 124 },
  { key: "fourth" as const, x: 150, tx: 167, mx: 150, mtx: 170 },
];

const FEATURE_ITEMS = [
  { key: "first" as const, Icon: Bell },
  { key: "third" as const, Icon: AlertCircle },
  { key: "fourth" as const, Icon: Smartphone },
  { key: "second" as const, Icon: Megaphone },
] as const;

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
  lightColor = "#18181b",
}: DatabaseWithRestApiProps) => {
  return (
    <div className={cn("relative w-full", className)}>
      {/* ── Mobile: stacked layout (no overlapping SVG art) ── */}
      <div className="flex flex-col items-center gap-4 sm:hidden px-1">
        <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
          {TOP_BADGES.map((badge) => (
            <span
              key={badge.key}
              className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-center text-[11px] font-semibold text-zinc-800 shadow-sm"
            >
              {badgeTexts[badge.key]}
            </span>
          ))}
        </div>

        <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-center shadow-sm">
          <span className="text-[12px] font-bold text-zinc-800 leading-snug">
            {title}
          </span>
        </div>

        <div className="relative w-full max-w-sm rounded-[1.5rem] border border-zinc-200 bg-white p-4 pt-5 shadow-lg shadow-zinc-200/40">
          <div className="grid grid-cols-2 gap-2.5">
            {FEATURE_ITEMS.map(({ key, Icon }) => (
              <div
                key={key}
                className="flex items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-2.5"
              >
                <Icon className="size-4 shrink-0 text-zinc-900" />
                <span className="text-[11px] font-semibold text-zinc-700 leading-tight">
                  {buttonTexts[key]}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-center">
            <div className="grid h-[72px] w-[72px] place-items-center rounded-full border border-zinc-200 bg-white shadow-md">
              <span className="uniz-logo-wordmark text-[2rem] text-zinc-900 leading-none">
                uniZ
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Desktop: animated diagram ── */}
      <div className="relative hidden h-[450px] w-full flex-col items-center sm:flex">
        <svg
          className="h-full w-full text-zinc-300"
          width="100%"
          height="100%"
          viewBox="0 0 200 100"
        >
          <g
            stroke="currentColor"
            fill="none"
            strokeWidth="0.4"
            strokeDasharray="1 2"
            className="text-zinc-300 opacity-50"
          >
            <path d="M 31 0 v 5" />
            <path d="M 77 0 v 5" />
            <path d="M 124 0 v 5" />
            <path d="M 170 0 v 5" />
          </g>
          <g
            stroke="currentColor"
            fill="none"
            strokeWidth="0.4"
            strokeDasharray="100 100"
            pathLength="100"
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
          <g stroke="currentColor" fill="none" strokeWidth="0.4">
            {TOP_BADGES.map((badge) => (
              <g key={badge.key}>
                <rect
                  fill="#ffffff"
                  stroke="#e2e8f0"
                  x={badge.x}
                  y="5"
                  width="34"
                  height="10"
                  rx="5"
                />
                <text
                  x={badge.tx}
                  y="11.5"
                  fill="#0f172a"
                  stroke="none"
                  fontSize="4"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {badgeTexts[badge.key]}
                </text>
              </g>
            ))}
          </g>
          <defs>
            <mask id="db-mask-1">
              <path
                d="M 31 10 v 15 q 0 5 5 5 h 59 q 5 0 5 5 v 10"
                strokeWidth="0.5"
                stroke="white"
              />
            </mask>
            <mask id="db-mask-2">
              <path
                d="M 77 10 v 10 q 0 5 5 5 h 13 q 5 0 5 5 v 15"
                strokeWidth="0.5"
                stroke="white"
              />
            </mask>
            <mask id="db-mask-3">
              <path
                d="M 124 10 v 10 q 0 5 -5 5 h -14 q -5 0 -5 5 v 15"
                strokeWidth="0.5"
                stroke="white"
              />
            </mask>
            <mask id="db-mask-4">
              <path
                d="M 170 10 v 15 q 0 5 -5 5 h -60 q -5 0 -5 5 v 10"
                strokeWidth="0.5"
                stroke="white"
              />
            </mask>
            <radialGradient id="db-blue-grad" fx="1">
              <stop offset="0%" stopColor={lightColor} />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
        </svg>

        <div className="absolute bottom-10 flex w-full flex-col items-center px-10">
          <div className="absolute -bottom-2 h-[100px] w-full max-w-[95%] rounded-3xl bg-zinc-950/10 scale-95" />
          <div className="absolute -top-4 z-20 flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-sm">
            <span className="text-[12px] font-bold text-zinc-800">{title}</span>
          </div>
          <div className="absolute -bottom-12 z-30 grid h-[100px] w-[100px] place-items-center rounded-full border border-zinc-200 bg-white shadow-md text-zinc-950 font-semibold group cursor-pointer">
            <span className="uniz-logo-wordmark text-[3rem] text-zinc-900 leading-none group-hover:scale-110 transition-transform duration-300">
              uniZ
            </span>
          </div>
          <div className="relative z-10 flex h-[250px] w-full items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl shadow-zinc-200/50">
            <motion.div
              className="absolute top-6 left-12 z-20 h-9 rounded-full bg-zinc-50 px-4 text-sm font-semibold text-zinc-700 border border-zinc-200 flex items-center gap-2 shadow-sm"
              animate={{ y: [0, -6, 0] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Bell className="size-4 text-zinc-950" />
              <span>{buttonTexts.first}</span>
            </motion.div>
            <motion.div
              className="absolute bottom-6 left-32 z-20 h-9 rounded-full bg-zinc-50 px-4 text-sm font-semibold text-zinc-700 border border-zinc-200 flex items-center gap-2 shadow-sm"
              animate={{ y: [0, -8, 0] }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
            >
              <AlertCircle className="size-4 text-zinc-950" />
              <span>{buttonTexts.third}</span>
            </motion.div>
            <motion.div
              className="absolute top-8 right-32 z-20 h-9 rounded-full bg-zinc-50 px-4 text-sm font-semibold text-zinc-700 border border-zinc-200 flex items-center gap-2 shadow-sm"
              animate={{ y: [0, -5, 0] }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2,
              }}
            >
              <Smartphone className="size-4 text-zinc-950" />
              <span>{buttonTexts.fourth}</span>
            </motion.div>
            <motion.div
              className="absolute bottom-6 right-12 z-20 h-9 rounded-full bg-zinc-50 px-4 text-sm font-semibold text-zinc-700 border border-zinc-200 flex items-center gap-2 shadow-sm"
              animate={{ y: [0, -7, 0] }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
            >
              <Megaphone className="size-4 text-zinc-950" />
              <span>{buttonTexts.second}</span>
            </motion.div>
            <motion.div
              className="absolute -bottom-14 h-[100px] w-[100px] rounded-full border-t border-zinc-200 bg-zinc-50/50"
              animate={{ scale: [0.98, 1.02, 0.98, 1, 1, 1, 1, 1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              className="absolute -bottom-20 h-[145px] w-[145px] rounded-full border-t border-zinc-200 bg-zinc-50/50"
              animate={{ scale: [1, 1, 1, 0.98, 1.02, 0.98, 1, 1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              className="absolute -bottom-[100px] h-[190px] w-[190px] rounded-full border-t border-zinc-200 bg-zinc-50/50"
              animate={{ scale: [1, 1, 1, 1, 1, 0.98, 1.02, 0.98, 1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              className="absolute -bottom-[120px] h-[235px] w-[235px] rounded-full border-t border-zinc-200 bg-zinc-50/50"
              animate={{
                scale: [1, 1, 1, 1, 1, 1, 0.98, 1.02, 0.98, 1],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <div className="absolute inset-0 flex items-center justify-center gap-8 z-30 pointer-events-none px-4">
              <motion.div
                className="flex flex-col items-center justify-center bg-white/70 backdrop-blur-md border border-zinc-200 shadow-sm rounded-2xl p-4 w-[140px] h-[120px]"
                animate={{ y: [-2, 2, -2] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Database className="text-zinc-950 mb-2 size-6" />
                <span className="text-sm font-bold text-zinc-800 text-center">
                  Core Sync
                </span>
                <span className="text-[10px] text-zinc-500 text-center leading-tight mt-1">
                  Real-time data flow
                </span>
              </motion.div>
              <motion.div
                className="flex flex-col items-center justify-center bg-white/70 backdrop-blur-md border border-zinc-200 shadow-sm rounded-2xl p-4 w-[160px] h-[130px] border-b-2 border-b-zinc-950 mb-4"
                animate={{ y: [2, -2, 2] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <ShieldCheck className="text-zinc-950 mb-2 size-7" />
                <span className="text-base font-bold text-zinc-900 text-center">
                  API Gateway
                </span>
                <span className="text-xs text-zinc-500 text-center leading-tight mt-1">
                  Secure endpoints
                </span>
              </motion.div>
              <motion.div
                className="flex flex-col items-center justify-center bg-white/70 backdrop-blur-md border border-zinc-200 shadow-sm rounded-2xl p-4 w-[140px] h-[120px]"
                animate={{ y: [-2, 2, -2] }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
              >
                <Activity className="text-zinc-950 mb-2 size-6" />
                <span className="text-sm font-bold text-zinc-800 text-center">
                  Webhooks
                </span>
                <span className="text-[10px] text-zinc-500 text-center leading-tight mt-1">
                  Live metrics
                </span>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseWithRestApi;
