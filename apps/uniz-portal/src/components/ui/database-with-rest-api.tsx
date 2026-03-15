"use client";

import { motion } from "framer-motion";
import { Folder, HeartHandshakeIcon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatabaseWithRestApiProps {
  className?: string;
  circleText?: string;
  badgeTexts?: {
    first: string;
    second: string;
    third: string;
    fourth: string;
  };
  buttonTexts?: {
    first: string;
    second: string;
  };
  title?: string;
  lightColor?: string;
}

const DatabaseWithRestApi = ({
  className,
  circleText = "uniZ",
  badgeTexts = {
    first: "Results",
    second: "Registrations",
    third: "Attendance",
    fourth: "Seating",
  },
  buttonTexts = {
    first: "Notifications",
    second: "Grievances",
  },
  title = "Unified Campus Management System",
  lightColor = "#3B82F6",
}: DatabaseWithRestApiProps) => {
  return (
    <div
      className={cn(
        "relative flex h-[350px] sm:h-[400px] w-full flex-col items-center justify-between",
        className
      )}
    >
      {/* SVG Paths  */}
      <svg
        className="absolute inset-0 h-full w-full text-slate-200"
        width="100%"
        height="100%"
        viewBox="0 0 200 100"
        preserveAspectRatio="xMidYMid meet"
      >
        <g
          stroke="currentColor"
          fill="none"
          strokeWidth="0.4"
          strokeDasharray="100 100"
          pathLength="100"
        >
          <path d="M 31 10 v 15 q 0 5 5 5 h 59 q 5 0 5 5 v 20" />
          <path d="M 77 10 v 10 q 0 5 5 5 h 13 q 5 0 5 5 v 20" />
          <path d="M 124 10 v 10 q 0 5 -5 5 h -14 q -5 0 -5 5 v 20" />
          <path d="M 170 10 v 15 q 0 5 -5 5 h -60 q -5 0 -5 5 v 20" />
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
        {/* Tracer Lights */}
        <g mask="url(#db-mask-1)">
          <circle className="database db-light-1" cx="0" cy="0" r="10" fill="url(#db-blue-grad)" />
        </g>
        <g mask="url(#db-mask-2)">
          <circle className="database db-light-2" cx="0" cy="0" r="10" fill="url(#db-blue-grad)" />
        </g>
        <g mask="url(#db-mask-3)">
          <circle className="database db-light-3" cx="0" cy="0" r="10" fill="url(#db-blue-grad)" />
        </g>
        <g mask="url(#db-mask-4)">
          <circle className="database db-light-4" cx="0" cy="0" r="10" fill="url(#db-blue-grad)" />
        </g>
        
        {/* Status Badges in SVG */}
        <g stroke="currentColor" fill="none" strokeWidth="0.4">
          {/* Badge 1 */}
          <g transform="translate(14, 2)">
            <rect fill="#18181B" x="0" y="0" width="34" height="10" rx="5" />
            <DatabaseIcon x="4" y="2.5" />
            <text x="14" y="7" fill="white" stroke="none" fontSize="4.5" fontWeight="600">{badgeTexts.first}</text>
          </g>
          {/* Badge 2 */}
          <g transform="translate(60, 2)">
            <rect fill="#18181B" x="0" y="0" width="34" height="10" rx="5" />
            <DatabaseIcon x="4" y="2.5" />
            <text x="14" y="7" fill="white" stroke="none" fontSize="4.5" fontWeight="600">{badgeTexts.second}</text>
          </g>
          {/* Badge 3 */}
          <g transform="translate(108, 2)">
            <rect fill="#18181B" x="0" y="0" width="34" height="10" rx="5" />
            <DatabaseIcon x="4" y="2.5" />
            <text x="14" y="7" fill="white" stroke="none" fontSize="4.5" fontWeight="600">{badgeTexts.third}</text>
          </g>
          {/* Badge 4 */}
          <g transform="translate(150, 2)">
            <rect fill="#18181B" x="0" y="0" width="40" height="10" rx="5" />
            <DatabaseIcon x="4" y="2.5" />
            <text x="16" y="7" fill="white" stroke="none" fontSize="4.5" fontWeight="600">{badgeTexts.fourth}</text>
          </g>
        </g>
        
        <defs>
          <mask id="db-mask-1"><path d="M 31 10 v 15 q 0 5 5 5 h 59 q 5 0 5 5 v 20" strokeWidth="1" stroke="white" /></mask>
          <mask id="db-mask-2"><path d="M 77 10 v 10 q 0 5 5 5 h 13 q 5 0 5 5 v 20" strokeWidth="1" stroke="white" /></mask>
          <mask id="db-mask-3"><path d="M 124 10 v 10 q 0 5 -5 5 h -14 q -5 0 -5 5 v 20" strokeWidth="1" stroke="white" /></mask>
          <mask id="db-mask-4"><path d="M 170 10 v 15 q 0 5 -5 5 h -60 q -5 0 -5 5 v 20" strokeWidth="1" stroke="white" /></mask>
          <radialGradient id="db-blue-grad" fx="1">
            <stop offset="0%" stopColor={lightColor} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
      </svg>

      {/* Main Content Area */}
      <div className="absolute bottom-10 flex w-full flex-col items-center px-4">
        {/* Title Badge */}
        <div className="absolute -top-10 z-50 flex items-center justify-center rounded-full border border-slate-200 bg-black px-4 py-1.5 shadow-xl sm:-top-16">
          <Sparkles className="size-3 text-blue-400" />
          <span className="ml-2 text-[10px] font-bold text-white uppercase tracking-wider">
            {title}
          </span>
        </div>

        {/* Central Logo Circle */}
        <div className="absolute -bottom-8 z-40 grid h-[80px] w-[80px] place-items-center rounded-full border border-slate-200 bg-white shadow-2xl font-black unifrakturcook-bold text-2xl transition-transform hover:scale-110 duration-300">
          {circleText}
        </div>

        {/* The Animated Box */}
        <div className="relative z-10 flex h-[160px] w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          {/* Floating Feature Tags */}
          <div className="absolute bottom-6 left-6 z-20 h-8 rounded-full bg-slate-100 px-4 text-[11px] font-bold text-slate-900 border border-slate-200 flex items-center gap-2 shadow-sm transition-all hover:bg-white active:scale-95">
            <HeartHandshakeIcon className="size-3.5 text-blue-500" />
            <span>{buttonTexts.first}</span>
          </div>
          <div className="absolute top-6 right-6 z-20 h-8 rounded-full bg-slate-100 px-4 text-[11px] font-bold text-slate-900 border border-slate-200 flex items-center gap-2 shadow-sm transition-all hover:bg-white active:scale-95">
            <Folder className="size-3.5 text-blue-500" />
            <span>{buttonTexts.second}</span>
          </div>

          {/* Pulsing Core Circles */}
          <div className="relative flex items-center justify-center pointer-events-none opacity-20">
            {[100, 145, 190, 235].map((size, idx) => (
              <motion.div
                key={idx}
                className="absolute rounded-full border border-blue-400 bg-blue-50/10"
                style={{ width: size, height: size }}
                animate={{
                  scale: [0.95, 1.05, 0.95],
                  opacity: [0.2, 0.6, 0.2],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: idx * 0.4,
                }}
              />
            ))}
          </div>

          {/* Subtle Background Text for depth */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] select-none pointer-events-none">
             <span className="unifrakturcook-bold text-[8rem] text-black italic">
               uniZ
             </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const DatabaseIcon = ({ x = "0", y = "0" }: { x: string; y: string }) => {
  return (
    <svg
      x={x}
      y={y}
      xmlns="http://www.w3.org/2000/svg"
      width="5"
      height="5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  );
};

export default DatabaseWithRestApi;
