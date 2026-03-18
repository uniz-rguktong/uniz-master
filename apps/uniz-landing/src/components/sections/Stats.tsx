import { useEffect, useRef } from "react";

export function Stats({ stats }: { stats: readonly any[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const statsContainer = containerRef.current;
    if (!statsContainer) return;

    const counters = statsContainer.querySelectorAll<HTMLElement>("[data-target]");
    const speed = 200;

    const animateCounter = (counter: HTMLElement) => {
      const target = +counter.getAttribute("data-target")!;
      let current = 0;
      const increment = target / speed;

      const updateCount = () => {
        if (current < target) {
          current += increment;
          counter.innerText = Math.ceil(current).toString();
          requestAnimationFrame(updateCount);
        } else {
          counter.innerText = target.toString();
        }
      };
      updateCount();
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
      { threshold: 0.5 }
    );

    observer.observe(statsContainer);

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="statistics"
      className="py-24 bg-white relative overflow-hidden"
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Background Decorative Box - Soft Rose/Maroon Tint */}
        <div className="absolute inset-x-0 top-32 bottom-0 bg-rose-50/40 rounded-[3.5rem] -z-10 border border-rose-100/50"></div>

        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 line-height-tight">
            Our Academic <span className="text-[#800000]">Footprint</span>
          </h2>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-slate-600 font-medium">
            Discover the scale of our academic excellence and student success through these core institutional metrics.
          </p>
        </div>

        {/* Stats Container Box - Refined Maroon Background */}
        <div className="bg-gradient-to-br from-[#800000]/[0.02] to-rose-50/80 p-8 md:p-14 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(128,0,0,0.08)] border border-rose-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#800000]/5 blur-[120px] rounded-full -mr-48 -mt-48 transition-transform duration-1000 group-hover:scale-110"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-200/20 blur-[100px] rounded-full -ml-32 -mb-32"></div>

          <div
            ref={containerRef}
            id="stats-container"
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 relative z-10"
          >
            {stats.map((stat, idx) => {
              const num = parseInt(stat.value.replace(/,/g, ''), 10) || 0;
              return (
                <div
                  key={idx}
                  className="group relative bg-white/50 border border-slate-100 p-6 rounded-2xl hover:border-rose-200 hover:bg-white hover:shadow-lg hover:shadow-rose-900/5 transition-all duration-300 flex flex-col items-center text-center"
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#800000] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-b-full"></div>

                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-[#800000] transition-colors duration-300 mb-3">
                    {stat.label}
                  </p>

                  <div className="flex items-baseline justify-center">
                    <h3
                      className="text-3xl font-black text-slate-900 group-hover:text-[#800000] transition-colors duration-300"
                      data-target={num}
                    >
                      0
                    </h3>
                    <span className="text-rose-500 font-bold ml-0.5 text-lg">+</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
