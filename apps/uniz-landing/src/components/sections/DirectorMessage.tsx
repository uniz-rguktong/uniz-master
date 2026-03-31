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
      { threshold: 0.2, rootMargin: "0px 0px -50px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="directors-message" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center mb-6 px-6 py-3 text-lg font-bold tracking-wide text-white bg-[#000035] rounded-full shadow-sm">
            From the Director's Desk
          </span>
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            A Message from the Director
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
            Leadership, vision, and the journey of our Campus
          </p>
        </div>

        {/* Layout */}
        <div
          className="max-w-5xl mx-auto flex flex-col md:flex-row gap-12 items-start opacity-0 director-photo"
          ref={directorRef}
        >
          {/* Photo & Name block (Matching the requested UI layout) */}
          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col items-center sm:items-start lg:w-[320px] gap-6">
            <img
              src={
                directorImage ||
                "https://rguktong.ac.in/images/gupta%20sir.jpeg"
              }
              alt="Dr. A V S S Kumara Swami Gupta"
              className="w-64 h-64 rounded-xl shadow-xl object-cover shrink-0"
            />
            <div className="text-center sm:text-left">
              <h3 className="text-3xl font-bold text-slate-900 leading-tight">
                Dr. A V S S Kumara Swami Gupta
              </h3>
              <p className="mt-3 text-xl font-semibold text-slate-700">
                Director
              </p>
              <p className="text-xl font-semibold text-slate-700">
                RGUKT Ongole.
              </p>
            </div>
          </div>

          {/* Text column */}
          <div className="text-gray-700 text-lg leading-relaxed text-justify mt-4 md:mt-0">
            <p className="mb-4">
              RGUKT Ongole campus aims to create a supportive and inclusive
              environment where gifted and talented students are encouraged to
              explore their potential and achieve their personal best in all
              aspects of university life. Students will be challenged and
              engaged through authentic learning opportunities that inspire them
              to develop creativity, confidence and resilience to become
              independent and ethical life-long learners.
            </p>
            <p className="mb-4">
              We encourage our students to develop respectful relationships with
              their peers, teachers and the broader community. We instil in our
              students a keen social conscience and the capacity to make ethical
              decisions.
            </p>
            <p className="mb-4">
              Our students graduate from RGUKT Ongole campus with the skills,
              mind sets and qualities that will best equip them for success in
              the world of the future. Our students are intelligent, resilient,
              creative, imaginative, disciplined, dedicated to life-long
              learning, respectful and ethical. They are the future leaders and
              role models of society.
            </p>
            <p className="font-semibold text-slate-900 pt-4 text-xl">
              Dr. A V S S Kumara Swami Gupta
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
