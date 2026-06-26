"use client";

import { motion } from "framer-motion";
import { Github, ArrowUpRight } from "lucide-react";
import { LandingSection } from "./landing-section";

function StatPill({
  value,
  label,
  delay,
}: {
  value: string;
  label: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col"
    >
      <span className="text-[28px] font-semibold tracking-[-0.04em] text-zinc-950 leading-none">
        {value}
      </span>
      <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
        {label}
      </span>
    </motion.div>
  );
}

export default function GlobeFeature() {
  const line1 = ["Make", "your", "first"];
  const line2 = ["contribution."];

  return (
    <LandingSection>
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex w-fit items-center gap-2.5 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 shadow-sm mb-8"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-zinc-500">
            Open Source
          </span>
        </motion.div>

        <h2 className="text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-[0.95] tracking-[-0.05em] text-zinc-950 mb-6">
          <span className="block">
            {line1.map((w, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07, duration: 0.55 }}
                className="mr-[0.15em] inline-block"
              >
                {w}
              </motion.span>
            ))}
          </span>
          <span className="block">
            {line2.map((w, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32 + i * 0.07, duration: 0.55 }}
                className="mr-[0.15em] inline-block text-zinc-300"
              >
                {w}
              </motion.span>
            ))}
          </span>
        </h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="text-[15px] md:text-[17px] font-medium leading-[1.75] text-zinc-500 mb-10"
        >
          Empowering the RGUKT community through open-source collaboration.
          Join us in building a smarter, unified digital ecosystem for students
          and faculty.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-8 mb-10"
        >
          <StatPill value="4+" label="Contributors" delay={0.65} />
          <div className="h-8 w-px bg-zinc-100" />
          <StatPill value="100%" label="Open Source" delay={0.75} />
          <div className="h-8 w-px bg-zinc-100" />
          <StatPill value="∞" label="Ideas" delay={0.85} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <a
            href="https://github.com/uniz-rguktong"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex w-fit items-center gap-2.5 overflow-hidden rounded-xl bg-zinc-950 px-6 py-3 text-[13.5px] font-bold text-white shadow-[0_20px_40px_-12px_rgba(0,0,0,0.3)] transition-all duration-300 hover:shadow-[0_24px_50px_-12px_rgba(0,0,0,0.4)] active:scale-[0.98]"
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/8 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <Github size={15} className="relative fill-white text-white" />
            <span className="relative">Explore on GitHub</span>
            <ArrowUpRight
              size={14}
              className="relative opacity-40 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100"
            />
          </a>
        </motion.div>
      </div>
    </LandingSection>
  );
}
