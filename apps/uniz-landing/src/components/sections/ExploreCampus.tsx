import { Link } from "react-router-dom";

const campusAreas = [
  {
    title: "Central Library",
    description:
      "A well-equipped central library housing over 20,000 books and 10,000 periodicals, providing students with a rich academic ecosystem to explore knowledge, pursue research, and study in a focused, serene environment.",
    imageUrl:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2128&auto=format&fit=crop",
    link: "/departments/LIB",
    linkLabel: "Visit the Library",
  },
  {
    title: "Internships & Placements",
    description:
      "RGUKT Ongole's dedicated Career Development and Placement Cell (CDPC) bridges academics and industry. It actively facilitates campus placements, internship drives, and career guidance to prepare students for a competitive world.",
    imageUrl:
      "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?q=80&w=2126&auto=format&fit=crop",
    link: "/notifications/news",
    linkLabel: "Latest opportunities",
  },
  {
    title: "Resources & Facilities",
    description:
      "State-of-the-art infrastructure set amidst pristine greenery makes RGUKT Ongole an ideal destination for learning and continuous growth. Modern labs, seminar halls, and residential facilities ensure comfort and excellence at every step.",
    imageUrl:
      "https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=2086&auto=format&fit=crop",
    link: "/institute/campuslife",
    linkLabel: "Campus facilities",
  },
  {
    title: "Extra-Curricular Activities",
    description:
      "At RGUKT, we believe in holistic development. Sports and cultural activities foster physical coordination, mental strength, teamwork, and character — shaping well-rounded individuals ready to lead with confidence beyond the classroom.",
    imageUrl:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2070&auto=format&fit=crop",
    link: "/institute/campuslife",
    linkLabel: "Campus life",
  },
];

export function ExploreCampus() {
  return (
    <section id="explore" className="relative bg-white section-editorial">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="max-w-2xl mb-16 sm:mb-24">
          <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-[#0A2540] mb-4">
            Campus Life
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold text-[#061B33] tracking-tight leading-tight">
            Explore our campus
          </h2>
          <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed">
            From cutting-edge labs to world-class sports — discover the spaces that shape our students into leaders.
          </p>
        </div>

        <div className="flex flex-col gap-20 sm:gap-28">
          {campusAreas.map((area, index) => {
            const imageFirst = index % 2 === 0;
            return (
              <article
                key={area.title}
                className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center"
              >
                <div className={imageFirst ? "md:order-1" : "md:order-2"}>
                  <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                    <img
                      src={area.imageUrl}
                      alt={area.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className={imageFirst ? "md:order-2" : "md:order-1"}>
                  <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#061B33] leading-snug">
                    {area.title}
                  </h3>
                  <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed">
                    {area.description}
                  </p>
                  <div className="mt-6">
                    <Link to={area.link} className="editorial-link text-[15px] font-medium">
                      {area.linkLabel}
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-20 sm:mt-24">
          <Link to="/institute/campuslife" className="editorial-link text-[15px] font-medium">
            Explore campus life
          </Link>
        </div>
      </div>
    </section>
  );
}
