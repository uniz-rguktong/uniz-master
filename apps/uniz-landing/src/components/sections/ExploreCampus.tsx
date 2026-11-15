import { Link } from "react-router-dom";

const campusAreas = [
  {
    title: "Central Library",
    description:
      "The central library holds books, periodicals, and study spaces for coursework and research across departments.",
    imageUrl: "/carousel/all.jpg.webp",
    link: "/departments/LIB",
    linkLabel: "Library department",
  },
  {
    title: "Internships and placements",
    description:
      "The Career Development and Placement Cell (CDPC) coordinates internships, placement drives, and career guidance for students.",
    imageUrl: "/college.jpg",
    link: "/notifications/news",
    linkLabel: "News and updates",
  },
  {
    title: "Resources and facilities",
    description:
      "Laboratories, seminar halls, and residential facilities support the six-year integrated program on the Ongole campus.",
    imageUrl: "/carousel/VRD.png.webp",
    link: "/institute/campuslife",
    linkLabel: "Campus life",
  },
  {
    title: "Extra-curricular activities",
    description:
      "Sports, cultural events, and student clubs run alongside academics through departments and campus committees.",
    imageUrl: "/carousel/Sports.png.webp",
    link: "/institute/campuslife",
    linkLabel: "Campus life",
  },
];

export function ExploreCampus() {
  return (
    <section id="explore" className="relative bg-white section-editorial">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="max-w-2xl mb-16 sm:mb-24">
          <p className="text-sm text-ink-muted mb-3">Campus life</p>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-navy-900 tracking-tight leading-tight">
            Explore the Ongole campus
          </h2>
          <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed">
            Libraries, labs, hostels, and student activities on the RGUKT Ongole residential campus.
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
                  <div className="aspect-[4/3] overflow-hidden bg-slate-100 rounded-xl border border-line">
                    <img
                      src={area.imageUrl}
                      alt={area.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className={imageFirst ? "md:order-2" : "md:order-1"}>
                  <h3 className="font-serif text-2xl sm:text-3xl font-medium text-navy-900 leading-snug">
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
            Read about campus life
          </Link>
        </div>
      </div>
    </section>
  );
}
