import { motion } from "framer-motion";
import { Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useMemo } from "react";

// ─── Platform Icons (inline SVGs for brand marks) ────────────────────────────

const AppleIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

const AndroidIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.27-.86-.31-.16-.69-.04-.86.27l-1.86 3.22c-1.23-.57-2.6-.89-4.05-.89-1.45 0-2.82.32-4.05.89L6.47 5.71c-.16-.31-.55-.43-.86-.27-.31.16-.43.55-.27.86l1.84 3.18C4.21 10.96 2.17 13.76 2 17h20c-.17-3.24-2.21-6.04-4.4-7.52zM8.5 14c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm7 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
  </svg>
);

const getPlatform = () => {
  if (typeof navigator === "undefined")
    return { label: "Desktop", PlatformIcon: Monitor };
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua))
    return { label: "iOS", PlatformIcon: AppleIcon };
  if (/android/.test(ua))
    return { label: "Android", PlatformIcon: AndroidIcon };
  if (/macintosh|mac os x/.test(ua))
    return { label: "macOS", PlatformIcon: AppleIcon };
  if (/windows/.test(ua)) return { label: "Windows", PlatformIcon: Monitor };
  if (/linux/.test(ua)) return { label: "Linux", PlatformIcon: Monitor };
  return { label: "Desktop", PlatformIcon: Monitor };
};

// ─── Tiny SVG Illustrations ───────────────────────────────────────────────────

const AttendanceIllustration = () => (
  <svg
    width="100%"
    viewBox="0 0 260 180"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="overflow-visible"
  >
    {/* Card shell */}
    <rect
      x="12"
      y="12"
      width="236"
      height="156"
      rx="12"
      fill="white"
      stroke="#f0f0f0"
      strokeWidth="1"
    />
    {/* Header */}
    <rect x="12" y="12" width="236" height="36" rx="12" fill="#fafafa" />
    <rect x="12" y="36" width="236" height="12" fill="#fafafa" />
    <circle cx="30" cy="30" r="8" fill="#0a0a0a" />
    {/* calendar icon */}
    <rect
      x="26"
      y="26.5"
      width="8"
      height="7"
      rx="1.5"
      fill="none"
      stroke="white"
      strokeWidth="1"
    />
    <path
      d="M26 29h8M28.5 25.5v2M33.5 25.5v2"
      stroke="white"
      strokeWidth="1"
      strokeLinecap="round"
    />
    <text
      x="44"
      y="28"
      fill="#111"
      fontSize="9"
      fontWeight="800"
      fontFamily="system-ui"
      letterSpacing="-0.2"
    >
      Attendance Matrix
    </text>
    <text
      x="44"
      y="38"
      fill="#aaa"
      fontSize="7"
      fontWeight="bold"
      fontFamily="system-ui"
      letterSpacing="0.05em"
    >
      ACADEMIC MONITOR
    </text>

    {/* Active pill */}
    <rect
      x="188"
      y="22"
      width="48"
      height="16"
      rx="8"
      fill="#f0fdf4"
      stroke="#bbf7d0"
      strokeWidth="0.5"
    />
    <circle cx="196" cy="30" r="2.5" fill="#16a34a" className="animate-pulse" />
    <text
      x="202"
      y="34"
      fill="#15803d"
      fontSize="7"
      fontWeight="800"
      fontFamily="system-ui"
    >
      ACTIVE
    </text>

    {/* Bar rows with internal motion */}
    {[
      { y: 67, pct: 94, w: 199, label: "Quantum Computing", color: "#0a0a0a" },
      { y: 90, pct: 86, w: 182, label: "Advanced AI", color: "#3f3f46" },
      {
        y: 113,
        pct: 72,
        w: 153,
        label: "Distributed Systems",
        color: "#a1a1aa",
      },
    ].map((row, i) => (
      <g key={i}>
        <text
          x="24"
          y={row.y}
          fill="#555"
          fontSize="8.5"
          fontWeight="600"
          fontFamily="system-ui"
        >
          {row.label}
        </text>
        <text
          x="236"
          y={row.y}
          fill="#111"
          fontSize="8.5"
          fontWeight="800"
          fontFamily="system-ui"
          textAnchor="end"
        >
          {row.pct}%
        </text>
        <rect
          x="24"
          y={row.y + 4}
          width="212"
          height="4"
          rx="2"
          fill="#f4f4f5"
        />
        <motion.rect
          initial={{ width: 0 }}
          whileInView={{ width: row.w }}
          transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
          x="24"
          y={row.y + 4}
          height="4"
          rx="2"
          fill={row.color}
        />
      </g>
    ))}

    {/* warning pill */}
    <motion.g
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ delay: 1.5 }}
    >
      <rect
        x="24"
        y="124"
        width="68"
        height="14"
        rx="7"
        fill="#fef3c7"
        stroke="#fde68a"
        strokeWidth="0.5"
      />
      <text
        x="58"
        y="134"
        fill="#92400e"
        fontSize="7.5"
        fontWeight="700"
        fontFamily="system-ui"
        textAnchor="middle"
      >
        Below 75% alert
      </text>
    </motion.g>

    {/* Footer */}
    <line x1="24" y1="148" x2="236" y2="148" stroke="#f4f4f5" strokeWidth="1" />
    <text
      x="24"
      y="162"
      fill="#aaa"
      fontSize="7.5"
      fontWeight="bold"
      fontFamily="system-ui"
      letterSpacing="0.06em"
    >
      AGGREGATE
    </text>
    <text
      x="236"
      y="163"
      fill="#111"
      fontSize="16"
      fontWeight="900"
      fontFamily="system-ui"
      textAnchor="end"
      letterSpacing="-0.04em"
    >
      84.0%
    </text>
  </svg>
);

const GradeIllustration = () => (
  <svg
    width="100%"
    viewBox="0 0 260 180"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="overflow-visible"
  >
    {/* Dark card Shell */}
    <rect x="12" y="12" width="236" height="156" rx="12" fill="#0d0d0d" />
    <circle cx="30" cy="30" r="8" fill="#1a1a1a" />
    <path
      d="M30 24.5l1.6 3.2 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5 1.6-3.2z"
      fill="#facc15"
    />
    <text
      x="44"
      y="28"
      fill="white"
      fontSize="9"
      fontWeight="800"
      fontFamily="system-ui"
      letterSpacing="-0.2"
    >
      Grade Highlights
    </text>
    <text
      x="44"
      y="38"
      fill="#555"
      fontSize="7"
      fontWeight="bold"
      fontFamily="system-ui"
      letterSpacing="0.05em"
    >
      OFFICIAL RESULTS
    </text>

    {/* Metric tiles */}
    <g transform="translate(24, 54)">
      {[
        { val: "9.24", lab: "SGPA", highlight: true },
        { val: "8.98", lab: "CGPA", highlight: false },
        { val: "#04", lab: "RANK", highlight: false },
      ].map((m, i) => (
        <g key={i} transform={`translate(${i * 68}, 0)`}>
          <rect
            width="60"
            height="42"
            rx="8"
            fill={m.highlight ? "white" : "#1a1a1a"}
          />
          <text
            x="30"
            y="22"
            fill={m.highlight ? "#000" : "white"}
            fontSize="12"
            fontWeight="900"
            fontFamily="system-ui"
            textAnchor="middle"
          >
            {m.val}
          </text>
          <text
            x="30"
            y="34"
            fill={m.highlight ? "#666" : "#555"}
            fontSize="7.5"
            fontWeight="bold"
            fontFamily="system-ui"
            textAnchor="middle"
          >
            {m.lab}
          </text>
        </g>
      ))}
    </g>

    {/* Course list - Premium rows */}
    <g transform="translate(24, 112)">
      {[
        { name: "Distributed Systems", subtitle: "Core CS", grade: "Ex" },
        { name: "Machine Learning", subtitle: "Specialization", grade: "A" },
      ].map((c, i) => (
        <motion.g
          key={i}
          transform={`translate(0, ${i * 26})`}
          whileHover={{ x: 4 }}
        >
          <rect width="212" height="22" rx="6" fill="#1a1a1a" />
          <text
            x="10"
            y="14"
            fill="#888"
            fontSize="8.5"
            fontWeight="600"
            fontFamily="system-ui"
          >
            {c.name}
          </text>
          <rect
            x="188"
            y="4"
            width="20"
            height="14"
            rx="3"
            fill={i === 0 ? "#fff" : "#333"}
          />
          <text
            x="198"
            y="13.5"
            fill={i === 0 ? "#000" : "#fff"}
            fontSize="7.5"
            fontWeight="900"
            fontFamily="system-ui"
            textAnchor="middle"
          >
            {c.grade}
          </text>
        </motion.g>
      ))}
    </g>
  </svg>
);

const GrievanceIllustration = () => (
  <svg
    width="100%"
    viewBox="0 0 260 180"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="12"
      y="12"
      width="236"
      height="156"
      rx="12"
      fill="white"
      stroke="#f0f0f0"
      strokeWidth="1"
    />
    <rect x="12" y="12" width="236" height="34" rx="12" fill="#fafafa" />
    <rect x="12" y="34" width="236" height="12" fill="#fafafa" />
    <circle cx="30" cy="29" r="8" fill="#0a0a0a" />
    <path
      d="M25 26h10v6H29.5l-1.5 2-1.5-2H25v-6z"
      fill="none"
      stroke="white"
      strokeWidth="1"
      strokeLinejoin="round"
    />
    <text
      x="44"
      y="27"
      fill="#111"
      fontSize="9"
      fontWeight="800"
      fontFamily="system-ui"
      letterSpacing="-0.2"
    >
      File a Grievance
    </text>
    <text
      x="44"
      y="38"
      fill="#aaa"
      fontSize="7"
      fontWeight="bold"
      fontFamily="system-ui"
      letterSpacing="0.05em"
    >
      COMPLAINT PORTAL
    </text>

    {/* Form Skeleton */}
    <rect
      x="20"
      y="56"
      width="220"
      height="22"
      rx="5"
      fill="#fafafa"
      stroke="#e4e4e7"
      strokeWidth="0.5"
    />
    <text x="30" y="70" fill="#aaa" fontSize="8" fontFamily="system-ui">
      Category - Academic
    </text>
    <rect
      x="20"
      y="84"
      width="220"
      height="22"
      rx="5"
      fill="white"
      stroke="#3f3f46"
      strokeWidth="0.7"
    />
    <text x="30" y="98" fill="#111" fontSize="8" fontFamily="system-ui">
      Incorrect grade in ML - Sem 6
    </text>

    {/* Submit button with cursor simulation */}
    <rect x="20" y="145" width="70" height="20" rx="6" fill="#0a0a0a" />
    <text
      x="55"
      y="158"
      fill="white"
      fontSize="8"
      fontWeight="800"
      fontFamily="system-ui"
      textAnchor="middle"
    >
      Submit
    </text>

    <motion.path
      animate={{ x: [100, 60, 60], y: [160, 155, 155], scale: [1, 0.9, 1] }}
      transition={{ duration: 3, repeat: Infinity }}
      d="M10 10l5 12-2.5-1-2.5 1z"
      fill="#000"
      transform="translate(0,0)"
    />

    <g transform="translate(130, 153)">
      <circle cx="0" cy="0" r="4" fill="#16a34a" />
      <circle cx="15" cy="0" r="4" fill="#f59e0b" />
      <circle cx="30" cy="0" r="4" fill="#e4e4e7" />
    </g>
  </svg>
);

const ReportsIllustration = () => (
  <svg
    width="100%"
    viewBox="0 0 260 180"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="52"
      y="10"
      width="156"
      height="162"
      rx="12"
      fill="white"
      stroke="#e4e4e7"
      strokeWidth="1"
    />
    <path d="M192 10l16 16h-16V10z" fill="#e4e4e7" />
    <rect x="52" y="10" width="156" height="32" rx="12" fill="#0a0a0a" />
    <text
      x="130"
      y="28"
      fill="white"
      fontSize="8.5"
      fontWeight="800"
      fontFamily="system-ui"
      textAnchor="middle"
      letterSpacing="-0.2"
    >
      Academic Report · Sem 6
    </text>

    {[34, 42, 28, 48].map((h, i) => (
      <motion.rect
        key={i}
        initial={{ height: 0, y: 116 }}
        whileInView={{ height: h, y: 116 - h }}
        transition={{ duration: 0.8, delay: 0.8 + i * 0.1 }}
        x={68 + i * 20}
        width={16}
        rx="2"
        fill={i === 3 ? "#0a0a0a" : "#3f3f46"}
      />
    ))}

    <motion.rect
      whileHover={{ scale: 1.05 }}
      x="64"
      y="152"
      width="132"
      height="18"
      rx="6"
      fill="#0a0a0a"
    />
    <text
      x="130"
      y="164"
      fill="white"
      fontSize="8"
      fontWeight="800"
      fontFamily="system-ui"
      textAnchor="middle"
    >
      Download PDF
    </text>
  </svg>
);

// ─── Feature card data ────────────────────────────────────────────────────────

const FEATURES = [
  {
    tag: "Attendance",
    title: "Live tracking",
    desc: "Per-subject attendance with 75% threshold alerts and weekly heatmaps.",
    illustration: <AttendanceIllustration />,
    accent: "bg-emerald-50 text-emerald-700 border-emerald-100",
    dot: "bg-emerald-500",
  },
  {
    tag: "Grades",
    title: "Scorecard",
    desc: "SGPA, CGPA and department rank, surfaced cleanly every semester.",
    illustration: <GradeIllustration />,
    accent: "bg-amber-50 text-amber-700 border-amber-100",
    dot: "bg-amber-400",
  },
  {
    tag: "Grievance",
    title: "File",
    desc: "Raise academic or admin complaints via an integrated ticketing system.",
    illustration: <GrievanceIllustration />,
    accent: "bg-blue-50 text-blue-700 border-blue-100",
    dot: "bg-blue-500",
  },
  {
    tag: "Reports",
    title: "One-click PDF",
    desc: "Download polished academic reports for any semester, instantly.",
    illustration: <ReportsIllustration />,
    accent: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const CalcomHero = () => {
  const { install, isInstalled } = usePWAInstall();
  const platform = useMemo(() => getPlatform(), []);

  const handleDownload = async () => {
    const result = await install();
    if (result === "ios") {
      window.alert(
        "To install UniZ on iOS:\n\n1. Tap the Share icon (at bottom)\n2. Select 'Add to Home Screen'\n\nDirect native install is not supported by Apple yet.",
      );
    } else if (result === "fallback") {
      window.alert(
        "Direct installation is not supported by your current browser (like Safari), or the app is already installed. Try using Chrome or Edge, or manually install from your browser menu ('Add to Home Screen' or 'Install App').",
      );
    } else if (result === "error") {
      window.alert(
        "Installation failed. Please try installing manually from your browser menu.",
      );
    }
  };

  return (
    <div className="relative w-full bg-white font-sans overflow-hidden selection:bg-zinc-100">
      {/* ── High-End Mesh Gradient Backdrop ── */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          animate={{ x: [0, 50, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -right-[5%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-blue-50/40 via-blue-100/10 to-transparent blur-[120px] opacity-70"
        />
        <motion.div
          animate={{ x: [0, -40, 0], y: [0, 60, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-slate-100/50 via-zinc-100/20 to-transparent blur-[140px] opacity-60"
        />
        <div className="absolute inset-0 opacity-[0.015] grayscale contrast-150 brightness-150 mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      {/* ── Floating Icon Particles ── */}
      <div className="absolute inset-0 pointer-events-none select-none hidden lg:block overflow-hidden">
        {[
          { x: "6%", y: "18%", d: 0.2, s: 22 },
          { x: "14%", y: "12%", d: 0.5, s: 18 },
          { x: "22%", y: "35%", d: 0.9, s: 20 },
          { x: "32%", y: "8%", d: 1.2, s: 16 },
          { x: "78%", y: "14%", d: 0.3, s: 24 },
          { x: "86%", y: "30%", d: 0.7, s: 18 },
          { x: "92%", y: "10%", d: 1.0, s: 20 },
          { x: "70%", y: "38%", d: 1.4, s: 16 },
          { x: "50%", y: "5%", d: 0.6, s: 14 },
          { x: "42%", y: "42%", d: 1.1, s: 18 },
        ].map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.28, scale: 1 }}
            transition={{ duration: 1.5, delay: p.d, ease: "easeOut" }}
            style={{
              left: p.x,
              top: p.y,
              position: "absolute",
              width: p.s,
              height: p.s,
            }}
            className="text-zinc-600"
          >
            <svg
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.2}
            >
              {i % 5 === 0 && (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 14l9-5-9-5-9 5 9 5z"
                />
              )}
              {i % 5 === 0 && (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                />
              )}
              {i % 5 === 1 && (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              )}
              {i % 5 === 2 && (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              )}
              {i % 5 === 3 && (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              )}
              {i % 5 === 4 && (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              )}
            </svg>
          </motion.div>
        ))}
      </div>

      <div className="max-w-[1280px] mx-auto px-6 pt-24 pb-20 md:pt-32 md:pb-28">
        {/* ── Hero copy ── */}
        <div className="flex flex-col items-center text-center mb-20 md:mb-24">
          <motion.h1 className="text-[clamp(2.8rem,7vw,5.5rem)] font-black text-zinc-950 leading-[1.0] tracking-[-0.05em] mb-6 max-w-6xl">
            {"The better way to".split(" ").map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.5 }}
                className="inline-block mr-[0.2em]"
              >
                {word}
              </motion.span>
            ))}
            <br className="hidden md:block" />{" "}
            {"navigate through university.".split(" ").map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.05, duration: 0.5 }}
                className="inline-block mr-[0.2em] text-zinc-400 font-light"
              >
                {word}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-[15px] md:text-[17px] text-zinc-500 leading-relaxed mb-10 max-w-xl"
          >
            An integrated governance system for students, faculty, and admin —
            bringing campus data to life in real-time.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            {isInstalled ? (
              <div className="flex items-center gap-2.5 px-5 py-3 bg-emerald-50 text-emerald-700 rounded-xl text-[13px] font-bold border border-emerald-100">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                App installed — you're all set
              </div>
            ) : (
              <Button
                onClick={handleDownload}
                className="group relative h-12 px-8 bg-zinc-950 hover:bg-black text-white text-[14px] font-bold rounded-xl flex items-center gap-3 transition-all duration-300 overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                <platform.PlatformIcon size={16} />
                Download for {platform.label}
              </Button>
            )}
          </motion.div>
        </div>

        {/* ── Feature cards ── */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              whileHover={{
                y: -10,
                backgroundColor: "rgba(255,255,255,1)",
                borderColor: "rgba(228,228,231,1)",
                boxShadow: "0 25px 60px -15px rgba(0,0,0,0.1)",
              }}
              animate={{
                y: [0, -4, 0],
                transition: {
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.4,
                },
              }}
              className="group flex flex-col rounded-[2.5rem] border border-zinc-100/60 bg-white/60 backdrop-blur-sm overflow-hidden transition-all duration-500 cursor-pointer"
            >
              <div className="w-full bg-zinc-50/40 border-b border-zinc-100/40 p-4 group-hover:bg-transparent transition-colors duration-500 overflow-hidden">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {f.illustration}
                </motion.div>
              </div>

              <div className="flex flex-col gap-2 p-6 pt-5">
                <div
                  className={`inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full border text-[9.5px] font-black tracking-widest uppercase transition-colors duration-500 ${f.accent}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${f.dot} animate-pulse`}
                  />
                  {f.tag}
                </div>
                <h3 className="text-[15px] font-black text-zinc-950 tracking-tight leading-snug">
                  {f.title}
                </h3>
                <p className="text-[12.5px] font-medium text-zinc-500/80 leading-relaxed group-hover:text-zinc-600 transition-colors">
                  {f.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
