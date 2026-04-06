"use client";

import createGlobe, { COBEOptions } from "cobe";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AnimatedTooltip } from "./animated-tooltip";
import { developers as people } from "@/constants/developers";
import { Github, ArrowUpRight, GitPullRequest } from "lucide-react";

/* ─── Globe config ─────────────────────────────────────────────── */
const GLOBE_CONFIG: COBEOptions = {
  width: 800,
  height: 800,
  onRender: () => {},
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.2,
  dark: 0,
  diffuse: 0.25,
  mapSamples: 22000,
  mapBrightness: 1.0,
  baseColor: [0.97, 0.97, 0.99],
  markerColor: [11 / 255, 42 / 255, 71 / 255],
  glowColor: [0.88, 0.92, 1.0],
  markers: [
    { location: [14.5995, 120.9842], size: 0.03 },
    { location: [19.076, 72.8777], size: 0.08 },
    { location: [23.8103, 90.4125], size: 0.04 },
    { location: [30.0444, 31.2357], size: 0.06 },
    { location: [39.9042, 116.4074], size: 0.07 },
    { location: [-23.5505, -46.6333], size: 0.08 },
    { location: [19.4326, -99.1332], size: 0.08 },
    { location: [40.7128, -74.006], size: 0.09 },
    { location: [34.6937, 135.5022], size: 0.04 },
    { location: [41.0082, 28.9784], size: 0.05 },
    { location: [16.5062, 80.648], size: 0.06 },
  ],
};

/* ─── Globe canvas ─────────────────────────────────────────────── */
export function Globe({
  className,
  config = GLOBE_CONFIG,
}: {
  className?: string;
  config?: COBEOptions;
}) {
  let phi = 0;
  let width = 0;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);
  const [r, setR] = useState(0);

  const updatePointerInteraction = (value: number | null) => {
    pointerInteracting.current = value;
    if (canvasRef.current)
      canvasRef.current.style.cursor = value ? "grabbing" : "grab";
  };

  const updateMovement = (clientX: number) => {
    if (pointerInteracting.current !== null) {
      const delta = clientX - pointerInteracting.current;
      pointerInteractionMovement.current = delta;
      setR(delta / 200);
    }
  };

  const onRender = useCallback(
    (state: Record<string, any>) => {
      if (!pointerInteracting.current) phi += 0.003;
      state.phi = phi + r;
      state.width = width * 2;
      state.height = width * 2;
    },
    [r],
  );

  const onResize = () => {
    if (canvasRef.current) width = canvasRef.current.offsetWidth;
  };

  useEffect(() => {
    window.addEventListener("resize", onResize);
    onResize();
    if (!canvasRef.current) return;
    const globe = createGlobe(canvasRef.current, {
      ...config,
      width: width * 2,
      height: width * 2,
      onRender,
    });
    setTimeout(() => {
      if (canvasRef.current) canvasRef.current.style.opacity = "1";
    });
    return () => globe.destroy();
  }, []);

  return (
    <div
      className={cn("absolute inset-0 mx-auto aspect-square w-full", className)}
    >
      <canvas
        ref={canvasRef}
        className="size-full opacity-0 transition-opacity duration-1000 [contain:layout_paint_size]"
        onPointerDown={(e) =>
          updatePointerInteraction(
            e.clientX - pointerInteractionMovement.current,
          )
        }
        onPointerUp={() => updatePointerInteraction(null)}
        onPointerOut={() => updatePointerInteraction(null)}
        onMouseMove={(e) => updateMovement(e.clientX)}
        onTouchMove={(e) =>
          e.touches[0] && updateMovement(e.touches[0].clientX)
        }
      />
    </div>
  );
}

/* ─── Stat pill ────────────────────────────────────────────────── */
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
      <span className="text-[28px] font-black tracking-[-0.04em] text-zinc-950 leading-none">
        {value}
      </span>
      <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
        {label}
      </span>
    </motion.div>
  );
}

/* ─── Section ──────────────────────────────────────────────────── */
export default function GlobeFeature() {
  const line1 = ["Make", "your", "first"];
  const line2 = ["contribution."];

  return (
    <section className="relative w-full overflow-hidden bg-white selection:bg-zinc-100">
      {/* Animated mesh glows */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          animate={{ x: [0, 60, 0], y: [0, -40, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] right-[5%] h-[700px] w-[700px] rounded-full bg-gradient-to-br from-blue-50/70 via-indigo-50/20 to-transparent blur-[130px]"
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, 50, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-[10%] -left-[5%] h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-slate-100/60 via-zinc-50/30 to-transparent blur-[120px]"
        />
        {/* SVG noise grain */}
        <div
          className="absolute inset-0 opacity-[0.022]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundSize: "200px 200px",
          }}
        />
      </div>

      <div className="relative mx-auto grid max-w-[1280px] grid-cols-1 items-center px-6 py-24 md:grid-cols-2 md:px-16 md:py-32">
        {/* ── LEFT ── */}
        <div className="flex flex-col gap-9 md:pr-12">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex w-fit items-center gap-2.5 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 shadow-sm"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              Open Source
            </span>
          </motion.div>

          {/* Heading */}
          <h2 className="text-[clamp(3rem,6vw,5rem)] font-black leading-[0.95] tracking-[-0.05em] text-zinc-950">
            <span className="block">
              {line1.map((w, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.1 + i * 0.07,
                    duration: 0.55,
                    ease: [0.22, 1, 0.36, 1],
                  }}
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
                  transition={{
                    delay: 0.32 + i * 0.07,
                    duration: 0.55,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="mr-[0.15em] inline-block text-zinc-300"
                >
                  {w}
                </motion.span>
              ))}
            </span>
          </h2>

          {/* Body */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.6 }}
            className="max-w-[400px] text-[15px] font-medium leading-[1.75] text-zinc-500"
          >
            Empowering the RGUKT community through open-source collaboration.
            Join us in building a smarter, unified digital ecosystem for
            students and faculty.
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center gap-8"
          >
            <StatPill value="4+" label="Contributors" delay={0.65} />
            <div className="h-8 w-px bg-zinc-100" />
            <StatPill value="100%" label="Open Source" delay={0.75} />
            <div className="h-8 w-px bg-zinc-100" />
            <StatPill value="∞" label="Ideas" delay={0.85} />
          </motion.div>

          {/* Rule */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{
              delay: 0.9,
              duration: 0.55,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="h-px w-full origin-left bg-zinc-100"
          />

          {/* Devs + CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.5 }}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col gap-2.5">
              <span className="text-[9.5px] font-black uppercase tracking-[0.28em] text-zinc-400">
                meet the developers
              </span>
              <AnimatedTooltip items={people} />
            </div>

            <a
              href="https://github.com/uniz-rguktong"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex w-fit items-center gap-2.5 overflow-hidden rounded-xl bg-zinc-950 px-6 py-3 text-[13.5px] font-bold text-white shadow-[0_20px_40px_-12px_rgba(0,0,0,0.3)] transition-all duration-300 hover:shadow-[0_24px_50px_-12px_rgba(0,0,0,0.4)] active:scale-[0.98]"
            >
              {/* shimmer sweep on hover */}
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

        {/* ── RIGHT: Globe ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-16 flex h-[400px] w-full items-center justify-center md:mt-0 md:h-[600px]"
        >
          {/* Slow rotating rings */}
          {[540, 390, 260].map((size, i) => (
            <motion.div
              key={i}
              animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
              transition={{
                duration: 90 + i * 25,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute rounded-full border border-zinc-100"
              style={{ width: size, height: size }}
            />
          ))}

          {/* Pulse glow */}
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.25, 0.45, 0.25] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute h-72 w-72 rounded-full bg-blue-100/50 blur-3xl"
          />

          {/* Floating card — PR notification */}
          <motion.div
            initial={{ opacity: 0, x: -16, y: 8 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 1.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-2 top-14 z-10 flex items-center gap-2.5 rounded-2xl border border-zinc-100/80 bg-white/80 px-4 py-2.5 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12)] backdrop-blur-xl md:left-6"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-950">
              <GitPullRequest size={13} className="text-white" />
            </div>
            <div>
              <p className="text-[11px] font-black leading-tight text-zinc-900">
                New PR merged
              </p>
              <p className="text-[9.5px] font-medium text-zinc-400">
                2 minutes ago
              </p>
            </div>
          </motion.div>

          {/* Floating card — campus tag */}
          <motion.div
            initial={{ opacity: 0, x: 16, y: 8 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 1.7, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-20 right-2 z-10 rounded-2xl border border-zinc-100/80 bg-white/80 px-4 py-3 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12)] backdrop-blur-xl md:right-6"
          >
            <p className="text-[22px] font-black leading-none tracking-[-0.04em] text-zinc-950">
              RGUKT
            </p>
            <p className="mt-0.5 text-[9.5px] font-bold uppercase tracking-[0.16em] text-zinc-400">
              Ongole Campus
            </p>
          </motion.div>

          <Globe className="!relative !inset-auto h-full w-full max-w-none" />
        </motion.div>
      </div>
    </section>
  );
}
