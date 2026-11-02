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
      className="border-y border-line bg-paper text-ink"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-20 sm:py-24 lg:py-28">
        <div className="max-w-2xl mb-14 sm:mb-20">
          <p className="mb-3 text-[13px] font-semibold text-crimson">
            By the numbers
          </p>
          <h2 className="font-serif text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl md:text-5xl">
            Our academic footprint
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
            The scale of academic excellence and student success across RGUKT Ongole.
          </p>
        </div>

        <div
          ref={containerRef}
          className="grid grid-cols-2 gap-x-8 gap-y-12 border-t border-line pt-12 sm:pt-16 md:grid-cols-3 lg:grid-cols-6 lg:gap-x-6"
        >
          {stats.map((stat, idx) => {
            const num = parseInt(String(stat.value).replace(/,/g, ""), 10) || 0;
            return (
              <div key={idx} className="flex flex-col">
                <div className="flex items-baseline gap-0.5">
                  <span
                    className="font-serif text-4xl font-semibold leading-none tracking-tight text-ink sm:text-5xl"
                    data-target={num}
                  >
                    0
                  </span>
                  <span className="font-serif text-2xl leading-none text-crimson">+</span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-ink-muted">
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
