import { useEffect, useRef } from "react";
import { TrendingUp } from "lucide-react";

export function Stats({ stats }: { stats: readonly any[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const counters = el.querySelectorAll<HTMLElement>("[data-target]");

    const animateCounter = (counter: HTMLElement) => {
      const target = +counter.getAttribute("data-target")!;
      const duration = 1800;
      const start = performance.now();

      const step = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        counter.innerText = Math.ceil(eased * target).toLocaleString();
        if (progress < 1) requestAnimationFrame(step);
        else counter.innerText = target.toLocaleString();
      };

      requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            counters.forEach(animateCounter);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="statistics" className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 mb-5 px-4 py-2 text-sm font-bold tracking-widest text-[#000035] bg-[#000035]/5 rounded-full border border-[#000035]/10">
            <TrendingUp className="w-4 h-4" />
            BY THE NUMBERS
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Our Academic <span className="text-[#000035]">Footprint</span>
          </h2>
          <p className="mt-5 max-w-2xl mx-auto text-lg text-slate-600">
            Discover the scale of our academic excellence and student success through these core institutional metrics.
          </p>
        </div>

        {/* Dark Premium Stats Panel */}
        <div
          ref={containerRef}
          className="relative rounded-3xl overflow-hidden bg-[#000035]"
          style={{
            boxShadow: "0 32px 80px -12px rgba(0,0,53,0.35)",
          }}
        >
          {/* Subtle mesh glow */}
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-white/5 blur-3xl pointer-events-none" />

          {/* Grid */}
          <div className="relative grid gap-px bg-white/10 grid-cols-2 md:grid-cols-3 lg:grid-cols-6 z-10">
            {stats.map((stat, idx) => {
              const num = parseInt(stat.value.replace(/,/g, ""), 10) || 0;
              return (
                <div
                  key={idx}
                  className="group flex flex-col items-center justify-center text-center bg-[#000035] px-6 py-10 hover:bg-white/5 transition-colors duration-300"
                >
                  {/* Animated counter */}
                  <div className="flex items-end gap-0.5 mb-3">
                    <span
                      className="text-4xl font-black text-white leading-none"
                      data-target={num}
                    >
                      0
                    </span>
                    <span className="text-xl font-bold text-amber-400 leading-snug mb-0.5">+</span>
                  </div>

                  {/* Divider */}
                  <div className="w-8 h-px bg-white/20 mb-3 group-hover:w-12 group-hover:bg-amber-400 transition-all duration-300" />

                  {/* Label */}
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 group-hover:text-white/80 transition-colors duration-300 leading-relaxed">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Bottom accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-white/20 to-amber-400" />
        </div>

      </div>
    </section>
  );
}
