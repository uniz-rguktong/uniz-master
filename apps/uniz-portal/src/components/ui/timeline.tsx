"use client";
import { useScroll, useTransform, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { LucideIcon } from "lucide-react";
import {
  LandingSection,
  LandingSectionHeader,
  LandingPill,
  LandingCard,
} from "./landing-section";

interface TimelineEntry {
  title: string;
  subtitle: string;
  step: string;
  content: React.ReactNode;
  icon: LucideIcon;
}

const STEP_ACCENTS = ["emerald", "blue", "amber"] as const;

export const Timeline = ({ data }: { data: TimelineEntry[] }) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      setHeight(ref.current.getBoundingClientRect().height);
    }
  }, [data]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div className="w-full bg-transparent font-sans" ref={containerRef}>
      <LandingSection className="!pb-10 md:!pb-14">
        <LandingSectionHeader
          eyebrow="How it works"
          title="With us, campus"
          titleMuted="mastery is easy."
          description="Effortless setup, real-time visibility, and proactive alerts — designed for students who want to master their university journey."
        />
      </LandingSection>

      <div ref={ref} className="relative max-w-[1280px] mx-auto pb-20 md:pb-28 px-6">
        {data.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="flex justify-start pt-8 md:pt-24 md:gap-10"
          >
            <div className="sticky flex flex-col md:flex-row z-40 items-center top-40 self-start max-w-[40px] md:max-w-xs lg:max-w-sm md:w-full">
              <div className="h-11 w-11 absolute left-3 md:left-3 rounded-full bg-zinc-950 flex items-center justify-center shadow-[0_12px_32px_-10px_rgba(0,0,0,0.35)] z-50 text-white ring-4 ring-white/80">
                <item.icon size={18} strokeWidth={2.2} />
              </div>
              <h3 className="hidden md:block text-3xl md:text-[2.75rem] md:pl-20 font-semibold text-zinc-300/70 leading-[1.05] tracking-[-0.04em]">
                {item.title}
              </h3>
            </div>

            <div className="relative pl-14 md:pl-4 pr-4 w-full">
              <LandingCard className="p-6 md:p-8 shadow-[0_25px_60px_-22px_rgba(0,0,0,0.1)]">
                <LandingPill
                  label={item.step}
                  accent={STEP_ACCENTS[index % STEP_ACCENTS.length]}
                  className="mb-5"
                />

                <h3 className="md:hidden block text-2xl mb-3 font-semibold text-zinc-950 tracking-tight">
                  {item.title}
                </h3>

                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400 mb-3">
                  {item.subtitle}
                </p>

                <div className="text-zinc-600 text-[15px] md:text-[16px] font-medium leading-relaxed">
                  {item.content}
                </div>
              </LandingCard>
            </div>
          </motion.div>
        ))}

        <div
          style={{ height: Math.max(0, height - 100) + "px" }}
          className="absolute md:left-8 left-8 top-0 overflow-hidden w-[2px] bg-zinc-100/80 rounded-full"
        >
          <motion.div
            style={{ height: heightTransform, opacity: opacityTransform }}
            className="absolute inset-x-0 top-0 w-[2px] bg-gradient-to-b from-zinc-950 via-zinc-500 to-zinc-200 rounded-full"
          />
        </div>
      </div>
    </div>
  );
};
