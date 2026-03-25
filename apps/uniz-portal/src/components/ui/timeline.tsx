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
      <div className="max-w-7xl mx-auto py-20 px-4 md:px-8 lg:px-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 bg-slate-50 mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-navy-900"></div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            How it works
          </span>
        </div>
        <h2 className="text-4xl md:text-6xl font-black mb-6 text-slate-900 tracking-tighter leading-tight">
          With us, campus <br />
          <span className="text-slate-400">mastery is easy</span>
        </h2>
        <p className="text-slate-500 font-medium text-lg md:text-xl max-w-2xl leading-relaxed">
          Effortless setup, real-time visibility, and proactive alerts-designed
          for high-performing students who want to master their university
          journey.
        </p>
      </div>

      <div ref={ref} className="relative max-w-7xl mx-auto pb-20 px-2 sm:px-0">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex justify-start pt-10 md:pt-40 md:gap-10"
          >
            <div className="sticky flex flex-col md:flex-row z-40 items-center top-40 self-start max-w-[40px] md:max-w-xs lg:max-w-sm md:w-full">
              <div className="h-10 absolute left-3 md:left-3 w-10 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm z-50 text-navy-900">
                <item.icon size={20} strokeWidth={2.5} />
              </div>
              <h3 className="hidden md:block text-3xl md:pl-20 md:text-6xl font-black text-slate-400 leading-none">
                {item.title}
              </h3>
            </div>

            <div className="relative pl-14 md:pl-4 pr-4 w-full">
              <div className="mb-4">
                <div className="inline-block px-3 py-1 rounded-full border border-navy-100 bg-navy-50 text-navy-900 text-[10px] font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="md:hidden block text-2xl mb-4 text-left font-black text-slate-400">
                  {item.title}
                </h3>
                <div className="text-slate-800 dark:text-neutral-200 text-sm md:text-base font-normal mb-8 max-w-3xl leading-relaxed">
                  {item.content}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div
          style={{
            height: height - 100 + "px",
          }}
          className="absolute md:left-8 left-8 top-0 overflow-hidden w-[2px] bg-slate-100"
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className="absolute inset-x-0 top-0 w-[2px] bg-navy-900"
          />
        </div>
      </div>
    </div>
  );
};
