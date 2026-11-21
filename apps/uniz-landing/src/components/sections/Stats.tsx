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
      className="bg-navy-900 text-white"
    >
      <div className="mx-auto max-w-[1232px] px-5 py-16 min-[821px]:px-10 min-[821px]:py-24">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 text-[15px] leading-6 text-navy-300">By the numbers</p>
          <h2 className="u-section text-white">
            Student enrollment
          </h2>
          <p className="mt-4 max-w-xl text-[15px] leading-6 text-chrome-link">
            Headcount by program and department on the Ongole campus (from campus records).
          </p>
        </div>

        <div
          ref={containerRef}
          className="grid grid-cols-2 gap-x-8 gap-y-10 border-t border-navy-700 pt-10 md:grid-cols-3"
        >
          {stats.map((stat, idx) => {
            const num = parseInt(String(stat.value).replace(/,/g, ""), 10) || 0;
            return (
              <div key={idx} className="flex flex-col">
                <div className="flex items-baseline gap-0.5">
                  <span
                    className="text-[28px] font-semibold leading-9 tracking-[-0.01em] text-white tabular-nums"
                    data-target={num}
                  >
                    0
                  </span>
                  <span className="text-[18px] leading-6 text-chrome-link">+</span>
                </div>
                <p className="mt-3 text-[13px] leading-[18px] text-navy-300">
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
