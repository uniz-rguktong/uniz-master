import React from "react";
import { motion } from "framer-motion";

const StaticIcon = ({
  children,
  delay = 0,
  x,
  y,
  size = 24,
}: {
  children: React.ReactNode;
  delay?: number;
  x: string;
  y: string;
  size?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 0.22, scale: 1 }}
    transition={{ duration: 1.5, delay, ease: "easeOut" }}
    style={{ left: x, top: y, position: "absolute" }}
    className="text-navy-900 pointer-events-none"
  >
    <div style={{ width: size, height: size }}>{children}</div>
  </motion.div>
);

const UNIVERSITY_ICONS = [
  // Graduation Cap
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M12 14l9-5-9-5-9 5 9 5z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
    />
  </svg>,
  // Book
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
    />
  </svg>,
  // Academic Building
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    />
  </svg>,
  // Award / Ribbon
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>,
  // Pencil
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
    />
  </svg>,
  // Clipboard List
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
    />
  </svg>,
  // Library / Collection
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
    />
  </svg>,
  // Target / Exam
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>,
  // Clock
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>,
  // Identification
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
    />
  </svg>,
];

interface DecorativeCloudProps {
  className?: string;
}

export const BackgroundIconCloud = ({ className }: DecorativeCloudProps) => {
  return (
    <div
      className={`absolute inset-x-0 top-0 h-[350px] pointer-events-none select-none hidden lg:block ${className}`}
    >
      {/* Left side */}
      <StaticIcon x="4%" y="15%" delay={0.1} size={28}>
        {UNIVERSITY_ICONS[0]}
      </StaticIcon>
      <StaticIcon x="12%" y="10%" delay={0.4} size={22}>
        {UNIVERSITY_ICONS[2]}
      </StaticIcon>
      <StaticIcon x="8%" y="35%" delay={0.7} size={20}>
        {UNIVERSITY_ICONS[1]}
      </StaticIcon>
      <StaticIcon x="20%" y="20%" delay={1.1} size={18}>
        {UNIVERSITY_ICONS[4]}
      </StaticIcon>
      <StaticIcon x="28%" y="12%" delay={1.4} size={24}>
        {UNIVERSITY_ICONS[8]}
      </StaticIcon>
      <StaticIcon x="18%" y="38%" delay={0.3} size={16}>
        {UNIVERSITY_ICONS[9]}
      </StaticIcon>

      {/* Near center-left */}
      <StaticIcon x="35%" y="8%" delay={0.9} size={18}>
        {UNIVERSITY_ICONS[5]}
      </StaticIcon>
      <StaticIcon x="42%" y="22%" delay={1.6} size={20}>
        {UNIVERSITY_ICONS[7]}
      </StaticIcon>

      {/* Near center-right */}
      <StaticIcon x="58%" y="15%" delay={0.5} size={20}>
        {UNIVERSITY_ICONS[1]}
      </StaticIcon>
      <StaticIcon x="65%" y="28%" delay={1.2} size={18}>
        {UNIVERSITY_ICONS[3]}
      </StaticIcon>

      {/* Right side */}
      <StaticIcon x="72%" y="10%" delay={0.8} size={24}>
        {UNIVERSITY_ICONS[6]}
      </StaticIcon>
      <StaticIcon x="80%" y="24%" delay={1.5} size={20}>
        {UNIVERSITY_ICONS[0]}
      </StaticIcon>
      <StaticIcon x="88%" y="15%" delay={0.2} size={26}>
        {UNIVERSITY_ICONS[2]}
      </StaticIcon>
      <StaticIcon x="94%" y="8%" delay={1.1} size={22}>
        {UNIVERSITY_ICONS[5]}
      </StaticIcon>
      <StaticIcon x="85%" y="35%" delay={0.6} size={18}>
        {UNIVERSITY_ICONS[8]}
      </StaticIcon>
      <StaticIcon x="97%" y="25%" delay={1.4} size={16}>
        {UNIVERSITY_ICONS[4]}
      </StaticIcon>
    </div>
  );
};

// Legacy exports for compatibility during migration
export const EducationIllustration = BackgroundIconCloud;
export const SuccessIllustration = () => null;
