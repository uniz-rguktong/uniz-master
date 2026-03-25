"use client";
import { useScroll, useTransform, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { LucideIcon } from "lucide-react";

interface TimelineEntry {
  title: string;
  subtitle: string;
  step: string;
  content: React.ReactNode;
  icon: LucideIcon;
}

export const Timeline = ({ data }: { data: TimelineEntry[] }) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, [ref]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div className="w-full bg-white font-sans md:px-10" ref={containerRef}>
      {/* ── Section Header ── */}
      <div className="max-w-7xl mx-auto py-20 px-4 md:px-8 lg:px-10">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-950 animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
            How it works
          </span>
          <div className="flex-1 h-px bg-zinc-200/50 max-w-[120px]" />
        </div>
        <h2 className="text-4xl md:text-6xl font-black mb-6 text-zinc-950 tracking-[-0.04em] leading-[1.05]">
          With us, campus{" "}
          <br className="hidden md:block" />
          <span className="text-zinc-400 font-light">mastery is easy.</span>
        </h2>
        <p className="text-zinc-500 font-medium text-[16px] md:text-[18px] max-w-xl leading-relaxed">
          Effortless setup, real-time visibility, and proactive alerts — designed
          for students who want to master their university journey.
        </p>
      </div>

      {/* ── Timeline Steps ── */}
      <div ref={ref} className="relative max-w-7xl mx-auto pb-20 px-2 sm:px-0">
        {data.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="flex justify-start pt-10 md:pt-32 md:gap-10"
          >
            {/* Left: sticky icon + title */}
            <div className="sticky flex flex-col md:flex-row z-40 items-center top-40 self-start max-w-[40px] md:max-w-xs lg:max-w-sm md:w-full">
              <div className="h-10 w-10 absolute left-3 md:left-3 rounded-full bg-zinc-950 flex items-center justify-center shadow-[0_8px_24px_-6px_rgba(0,0,0,0.25)] z-50 text-white">
                <item.icon size={18} strokeWidth={2} />
              </div>
              <h3 className="hidden md:block text-3xl md:text-5xl md:pl-20 font-black text-zinc-300/60 leading-none tracking-tight">
                {item.title}
              </h3>
            </div>

            {/* Right: content card */}
            <div className="relative pl-14 md:pl-4 pr-4 w-full">
              <div className="mb-4">
                {/* Step pill */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200 bg-zinc-50 text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-5">
                  <span className="w-1 h-1 rounded-full bg-zinc-400" />
                  {item.step}
                </div>

                {/* Mobile title */}
                <h3 className="md:hidden block text-2xl mb-4 text-left font-black text-zinc-400">
                  {item.title}
                </h3>

                {/* Subtitle */}
                <p className="text-[11px] font-black uppercase tracking-[0.15em] text-zinc-400 mb-2">
                  {item.subtitle}
                </p>

                {/* Content */}
                <div className="text-zinc-600 text-[15px] font-medium mb-8 max-w-3xl leading-relaxed">
                  {item.content}
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Progress line */}
        <div
          style={{ height: height - 100 + "px" }}
          className="absolute md:left-8 left-8 top-0 overflow-hidden w-[2px] bg-zinc-100 rounded-full"
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className="absolute inset-x-0 top-0 w-[2px] bg-gradient-to-b from-zinc-950 via-zinc-600 to-zinc-300 rounded-full"
          />
        </div>
      </div>
    </div>
  );
};
