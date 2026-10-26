import { useEffect, useRef } from "react";

export function DirectorMessage({ directorImage }: { directorImage: string }) {
  const directorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = directorRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="directors-message" className="section-editorial bg-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="max-w-2xl mb-14 sm:mb-16">
          <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-[#0A2540] mb-4">
            From the Director&apos;s Desk
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[#061B33] leading-tight">
            A message from the Director
          </h2>
          <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed">
            Leadership, vision, and the journey of our campus.
          </p>
        </div>

        {/* Image + editorial text two-column */}
        <div
          className="grid md:grid-cols-12 gap-10 lg:gap-16 items-start director-photo"
          ref={directorRef}
        >
          <div className="md:col-span-4 flex flex-col gap-5">
            <div className="aspect-[4/5] overflow-hidden bg-slate-100">
              <img
                src={directorImage || "https://rguktong.ac.in/images/gupta%20sir.jpeg"}
                alt="Dr. A V S S Kumara Swami Gupta"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#061B33] leading-snug">
                Dr. A V S S Kumara Swami Gupta
              </h3>
              <p className="mt-2 text-sm font-medium text-[#0A2540]">Director</p>
              <p className="text-sm text-slate-500">RGUKT Ongole</p>
            </div>
          </div>

          <div className="md:col-span-8 text-slate-700 text-[1.05rem] sm:text-lg leading-[1.75]">
            <p className="mb-5">
              RGUKT Ongole campus aims to create a supportive and inclusive environment where gifted and talented students are encouraged to explore their potential and achieve their personal best in all aspects of university life. Students will be challenged and engaged through authentic learning opportunities that inspire them to develop creativity, confidence and resilience to become independent and ethical life-long learners.
            </p>
            <p className="mb-5">
              We encourage our students to develop respectful relationships with their peers, teachers and the broader community. We instil in our students a keen social conscience and the capacity to make ethical decisions.
            </p>
            <p className="mb-5">
              Our students graduate from RGUKT Ongole campus with the skills, mind sets and qualities that will best equip them for success in the world of the future. Our students are intelligent, resilient, creative, imaginative, disciplined, dedicated to life-long learning, respectful and ethical. They are the future leaders and role models of society.
            </p>
            <p className="font-serif text-lg font-semibold text-[#061B33] pt-2">
              — Dr. A V S S Kumara Swami Gupta
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
