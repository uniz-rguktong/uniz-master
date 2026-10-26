import { Link } from "react-router-dom";
import { Facebook, Twitter, Linkedin, Instagram, Youtube, ArrowUp, MapPin } from "lucide-react";

const columns = [
  {
    title: "Academics",
    links: [
      { n: "Programs", p: "/academics/AcademicPrograms" },
      { n: "Calendar", p: "/academics/AcademicCalender" },
      { n: "Regulations", p: "/academics/AcademicRegulations" },
      { n: "Curricula", p: "/academics/curicula" },
    ],
  },
  {
    title: "Departments",
    links: [
      { n: "Computer Science", p: "/departments/CSE" },
      { n: "Electronics", p: "/departments/ECE" },
      { n: "Civil Engg", p: "/departments/CIVIL" },
      { n: "Mechanical", p: "/departments/ME" },
      { n: "Mathematics", p: "/departments/MATHEMATICS" },
    ],
  },
  {
    title: "Institute",
    links: [
      { n: "About RGUKT", p: "/institute/aboutrgukt" },
      { n: "Campus Life", p: "/institute/campuslife" },
      { n: "Governing Council", p: "/institute/govcouncil" },
      { n: "RTI Info", p: "/institute/rtiinfo" },
      { n: "SC/ST Cell", p: "/institute/scst" },
    ],
  },
  {
    title: "Notifications",
    links: [
      { n: "News & Notifications", p: "/notifications/news" },
      { n: "Careers", p: "/notifications/careers" },
      { n: "Tenders", p: "/notifications/tenders" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative w-full bg-[#061B33] text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-20 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10 lg:gap-12 border-b border-white/10">

        <div className="col-span-2 flex flex-col gap-5">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/rgukt-logo.png"
              alt="RGUKT"
              className="w-10 h-10 object-contain mix-blend-lighten"
            />
            <div className="flex flex-col leading-none">
              <span className="font-serif text-lg font-semibold text-white tracking-tight">
                RGUKT
              </span>
              <span className="mt-1 text-[10px] font-medium tracking-[0.16em] uppercase text-white/50">
                Ongole Campus
              </span>
            </div>
          </Link>
          <p className="text-white/55 text-[15px] leading-relaxed max-w-sm">
            Empowering gifted rural youth through world-class technical education in Andhra Pradesh.
          </p>
          <div className="flex gap-3 text-sm text-white/50 mt-1">
            <MapPin className="w-4 h-4 mt-0.5 text-[#0A2540] flex-shrink-0" />
            <div className="flex flex-col gap-0.5 leading-relaxed">
              <span className="font-medium text-white/70 tracking-widest text-[10px] uppercase mb-1">
                Contact
              </span>
              <span>RGUKT Ongole Campus,</span>
              <span>Kurnool Road, Santhanuthalapadu (V&amp;M),</span>
              <span>Prakasam District, Andhra Pradesh — 523225.</span>
            </div>
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-white/35 mb-5">
              {col.title}
            </p>
            <ul className="flex flex-col gap-3">
              {col.links.map((lk) => (
                <li key={lk.p}>
                  <Link
                    to={lk.p}
                    className="text-sm text-white/60 hover:text-white underline-offset-[0.22em] hover:underline transition-colors"
                  >
                    {lk.n}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6 flex flex-col sm:flex-row justify-between items-center gap-5">
        <p className="text-[11px] tracking-wide text-white/35 text-center sm:text-left">
          © {new Date().getFullYear()} RGUKT Ongole. All rights reserved.
        </p>
        <div className="flex gap-3">
          {[
            { Icon: Facebook, url: "https://www.facebook.com/RGUKTOfficial/" },
            { Icon: Twitter, url: "https://x.com/RGUKT_ONGOLE" },
            { Icon: Linkedin, url: "https://in.linkedin.com/company/rguktongole" },
            { Icon: Instagram, url: "https://www.instagram.com/rgukt__ongole" },
            { Icon: Youtube, url: "https://www.youtube.com/@Rgukt-Ongole" },
          ].map(({ Icon, url }, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Social Link"
              className="w-9 h-9 flex items-center justify-center text-white/45 hover:text-white transition-colors"
            >
              <Icon className="w-4 h-4" />
            </a>
          ))}
        </div>
      </div>

      {/* Quiet wordmark — no canvas flicker */}
      <div className="border-t border-white/5 py-10 sm:py-14 text-center select-none">
        <p className="font-serif text-4xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-white/[0.06]">
          RGUKT Ongole
        </p>
      </div>

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Scroll to top"
        className="fixed bottom-8 right-8 z-50 w-11 h-11 rounded-full bg-[#0A2540] hover:bg-[#021227] text-white flex items-center justify-center transition-colors"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </footer>
  );
}
