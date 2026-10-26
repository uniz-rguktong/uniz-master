import { Link } from "react-router-dom";

const leaders = [
  {
    name: "Prof. K. Madhu Murthy",
    role: "Chancellor (FAC)",
    org: "RGUKT, Andhra Pradesh",
    photo: "https://rguktong.ac.in/img/Madhu_Murthy.jpeg",
    imageClasses: "object-center scale-[1.1]",
  },
  {
    name: "Prof. M. Vijaya Kumar",
    role: "Vice Chancellor (FAC)",
    org: "RGUKT, Andhra Pradesh",
    photo: "https://rguktong.ac.in/images/vc vijay kumar.jpg",
    imageClasses: "object-top",
  },
  {
    name: "Prof. A V S S Kumara Swami Gupta",
    role: "Director",
    org: "RGUKT Ongole Campus",
    photo: "https://rguktong.ac.in/images/gupta sir.jpeg",
    imageClasses: "object-top",
  },
];

export function Leadership() {
  return (
    <section id="leadership" className="relative section-editorial bg-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="max-w-2xl mb-16 sm:mb-20">
          <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-[#0A2540] mb-4">
            Leadership
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold text-[#061B33] tracking-tight leading-tight">
            Our visionaries
          </h2>
          <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed">
            The distinguished leaders steering RGUKT Ongole towards academic excellence and innovation.
          </p>
        </div>

        <div className="grid gap-12 sm:gap-10 sm:grid-cols-3">
          {leaders.map((leader) => (
            <div
              key={leader.name}
              className="flex flex-col items-start text-left"
            >
              <div className="w-full aspect-[4/5] overflow-hidden bg-slate-100 mb-6">
                <img
                  src={leader.photo}
                  alt={leader.name}
                  className={`w-full h-full object-cover ${leader.imageClasses}`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://ui-avatars.com/api/?name=" +
                      encodeURIComponent(leader.name) +
                      "&background=000035&color=fff&size=256";
                  }}
                />
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#061B33] leading-snug">
                {leader.name}
              </h3>
              <p className="mt-2 text-sm font-medium text-[#0A2540] tracking-wide">
                {leader.role}
              </p>
              <p className="mt-1 text-sm text-slate-500">{leader.org}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 sm:mt-20">
          <Link to="/institute/govcouncil" className="editorial-link text-[15px] font-medium">
            View Governing Council
          </Link>
        </div>
      </div>
    </section>
  );
}
