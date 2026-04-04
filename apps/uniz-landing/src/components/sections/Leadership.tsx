import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

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
    <section id="leadership" className="relative py-28 overflow-hidden bg-white">


      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20">

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight">
            Our Visionaries
          </h2>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-slate-600 leading-relaxed">
            The distinguished leaders steering RGUKT Ongole towards a future of academic excellence and innovation.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-8 lg:gap-12 sm:grid-cols-3">
          {leaders.map((leader, index) => (
            <div
              key={index}
              className="group relative flex flex-col items-center text-center"
            >
              {/* Card Background */}
              <div className="absolute inset-x-0 top-24 bottom-0 rounded-3xl bg-white shadow-xl shadow-slate-200/50 border border-slate-100 group-hover:shadow-2xl group-hover:shadow-[#000035]/10 transition-all duration-500 transform group-hover:-translate-y-2" />

              {/* Photo */}
              <div className="relative z-10">
                <div className="relative w-48 h-48 mx-auto transform group-hover:-translate-y-2 transition-transform duration-500">
                  {/* Decorative outer ring on hover */}
                  <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-[#000035] to-indigo-500 opacity-0 group-hover:opacity-10 scale-95 group-hover:scale-100 transition-all duration-500" />

                  {/* Image container */}
                  <div className="relative w-full h-full rounded-full overflow-hidden ring-[4px] ring-white shadow-lg group-hover:ring-[#000035] transition-all duration-500 bg-slate-100 z-10">
                    <img
                      src={leader.photo}
                      alt={leader.name}
                      className={`w-full h-full object-cover transition-transform duration-700 ease-out ${leader.imageClasses}`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://ui-avatars.com/api/?name=" +
                          encodeURIComponent(leader.name) +
                          "&background=000035&color=fff&size=256";
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Info  */}
              <div className="relative z-10 pt-8 pb-10 px-6 w-full transform group-hover:-translate-y-2 transition-transform duration-500">
                <h3 className="text-2xl font-bold text-slate-900 group-hover:text-[#000035] transition-colors duration-300 leading-tight">
                  {leader.name}
                </h3>

                <div className="mt-4 mb-3">
                  <span className="inline-block px-4 py-1.5 rounded-full bg-[#000035]/5 text-[#000035] text-sm font-bold tracking-wide border border-[#000035]/10">
                    {leader.role}
                  </span>
                </div>

                <p className="mt-2 text-sm font-medium text-slate-500">
                  {leader.org}
                </p>
              </div>
            </div>
          ))}
        </div>


        {/* CTA */}
        <div className="text-center mt-20">
          <Link
            to="/institute/govcouncil"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[#000035] hover:bg-slate-900 border border-transparent hover:border-[#000035] text-white font-bold tracking-wide transition-all duration-300 shadow-xl shadow-[#000035]/20 hover:shadow-2xl hover:shadow-[#000035]/30 group hover:-translate-y-1"
          >
            View Governing Council
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
