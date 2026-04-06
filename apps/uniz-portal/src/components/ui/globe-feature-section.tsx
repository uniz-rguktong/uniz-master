"use client";

import createGlobe, { COBEOptions } from "cobe";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { AnimatedTooltip } from "./animated-tooltip";
import { developers as people } from "@/constants/developers";
import { Github } from "lucide-react";

export default function GlobeFeature() {
  return (
    <section className="relative w-full bg-transparent overflow-hidden px-6 py-12 md:px-16 md:py-20">
      <div className="flex flex-col-reverse items-center justify-between gap-10 md:flex-row">
        <div className="z-10 max-w-xl text-left">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-6 uppercase">
            Make your first{" "}
            <span className="text-navy-900">contribution</span>{" "}
          </h2>
          <p className="text-xl text-slate-900 font-bold tracking-tight mb-2">
            contribute to the campus.
          </p>
          <p className="text-lg text-slate-500 font-medium leading-relaxed mb-8 max-w-lg">
            Empowering the RGUKT community through open-source collaboration.
            Join us in building a smarter, unified digital ecosystem for
            students and faculty.
          </p>
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black  tracking-[0.25em] text-slate-400">
                meet the developers
              </span>
              <AnimatedTooltip items={people} />
            </div>
            <a
              href="https://github.com/uniz-rguktong"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center gap-4 px-12 py-3.5 bg-[#1a1a1a] hover:bg-[#222] text-white rounded-full text-[15px] font-medium transition-all duration-300 border border-white/10 shadow-lg active:scale-[0.98] w-full max-w-[340px]"
            >
              <Github size={20} className="text-white fill-white" />
              <span>Explore on GitHub</span>
            </a>
          </div>
        </div>
        <div className="relative h-[250px] w-full max-w-xl flex items-center justify-center -mr-20">
          <Globe className="absolute -bottom-20 -right-20 scale-[1.7]" />
        </div>
      </div>
    </section>
  );
}

const GLOBE_CONFIG: COBEOptions = {
  width: 800,
  height: 800,
  onRender: () => {},
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.3,
  dark: 0,
  diffuse: 0.4,
  mapSamples: 16000,
  mapBrightness: 1.2,
  baseColor: [1, 1, 1],
  markerColor: [11 / 255, 42 / 255, 71 / 255], // Institutional Navy color
  glowColor: [1, 1, 1],
  markers: [
    { location: [14.5995, 120.9842], size: 0.03 },
    { location: [19.076, 72.8777], size: 0.1 },
    { location: [23.8103, 90.4125], size: 0.05 },
    { location: [30.0444, 31.2357], size: 0.07 },
    { location: [39.9042, 116.4074], size: 0.08 },
    { location: [-23.5505, -46.6333], size: 0.1 },
    { location: [19.4326, -99.1332], size: 0.1 },
    { location: [40.7128, -74.006], size: 0.1 },
    { location: [34.6937, 135.5022], size: 0.05 },
    { location: [41.0082, 28.9784], size: 0.06 },
  ],
};

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
    if (canvasRef.current) {
      canvasRef.current.style.cursor = value ? "grabbing" : "grab";
    }
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
      if (!pointerInteracting.current) phi += 0.005;
      state.phi = phi + r;
      state.width = width * 2;
      state.height = width * 2;
    },
    [r],
  );

  const onResize = () => {
    if (canvasRef.current) {
      width = canvasRef.current.offsetWidth;
    }
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
      className={cn(
        "absolute inset-0 mx-auto aspect-[1/1] w-full max-w-[600px]",
        className,
      )}
    >
      <canvas
        className={cn(
          "size-full opacity-0 transition-opacity duration-500 [contain:layout_paint_size]",
        )}
        ref={canvasRef}
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
