import { useEffect, useRef } from "react";
import type { Stat } from "../../types/api";

export function Stats({ stats }: { stats: readonly Stat[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const counters = el.querySelectorAll<HTMLElement>("[data-target]");

    const animateCounter = (counter: HTMLElement) => {
      const target = +counter.getAttribute("data-target")!;
      const duration = 1600;
      const start = performance.now();

      const step = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
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
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="statistics"
      className="relative overflow-hidden bg-navy-900 text-white"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-20 sm:py-24 lg:py-28">
        <div className="max-w-2xl mb-14 sm:mb-20">
          <p className="text-sm text-white/60 mb-3">By the numbers</p>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white leading-tight">
            Student enrollment
          </h2>
          <p className="mt-5 text-base sm:text-lg text-white/60 leading-relaxed max-w-xl">
            Headcount by program and department on the Ongole campus (from campus records).
          </p>
        </div>

        <div
          ref={containerRef}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-y-12 gap-x-8 lg:gap-x-6 border-t border-white/15 pt-12 sm:pt-16"
        >
          {stats.map((stat, idx) => {
            const num = parseInt(String(stat.value).replace(/,/g, ""), 10) || 0;
            return (
              <div key={idx} className="flex flex-col">
                <div className="flex items-baseline gap-0.5">
                  <span
                    className="font-serif text-4xl sm:text-5xl font-semibold text-white leading-none tracking-tight"
                    data-target={num}
                  >
                    0
                  </span>
                  <span className="font-serif text-2xl text-white/80 leading-none">+</span>
                </div>
                <p className="mt-4 text-xs sm:text-sm text-white/55 leading-relaxed">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
