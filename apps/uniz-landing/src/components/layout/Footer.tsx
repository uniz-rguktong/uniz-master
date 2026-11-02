import { useEffect, useState } from "react";
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
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 640);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <footer className="relative w-full overflow-hidden bg-navy-850 text-white">
      <div className="h-0.5 w-full bg-brand-red" aria-hidden="true" />
      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative py-16 lg:py-24 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10 lg:gap-12 border-b border-white/10">

        <div className="col-span-2 flex flex-col gap-5">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/rgukt-logo.png"
              alt="RGUKT Ongole"
              className="w-12 h-12 rounded-lg bg-white p-1.5 object-contain shadow-sm ring-1 ring-white/20"
            />
            <div className="flex flex-col leading-none">
              <span className="font-serif text-2xl font-medium text-white tracking-tight">
                RGUKT
              </span>
              <span className="mt-1 text-xs text-white/50">
                Ongole campus
              </span>
            </div>
          </Link>
          <p className="text-white/70 text-[15px] leading-relaxed max-w-sm">
            Empowering gifted rural youth through world-class technical education in Andhra Pradesh.
          </p>
          <div className="flex gap-3 text-sm text-white/65 mt-1 rounded-lg border border-white/10 bg-white/[0.03] p-4 max-w-sm">
            <MapPin className="w-4 h-4 mt-0.5 text-white/75 flex-shrink-0" />
            <div className="flex flex-col gap-0.5 leading-relaxed">
              <span className="text-sm font-medium text-white/70 mb-1">
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
            <p className="text-sm font-medium text-white/70 mb-5">
              {col.title}
            </p>
            <ul className="flex flex-col gap-3">
              {col.links.map((lk) => (
                <li key={lk.p}>
                  <Link
                    to={lk.p}
                    className="inline-block text-sm text-white/65 hover:text-white hover:translate-x-0.5 transition-[color,transform] duration-150"
                  >
                    {lk.n}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-12 py-6 flex flex-col sm:flex-row justify-between items-center gap-5">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-[11px] tracking-wide text-white/60 text-center sm:text-left">
          <p>© {new Date().getFullYear()} RGUKT Ongole. All rights reserved.</p>
          <span className="hidden sm:inline text-white/20">·</span>
          <a
            href="https://uniz.rguktong.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/70 hover:text-white underline-offset-4 hover:underline"
          >
            UniZ Portal
          </a>
          <span className="hidden sm:inline text-white/20">·</span>
          <a
            href="https://uniz.rguktong.in/developers"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/70 hover:text-white underline-offset-4 hover:underline"
          >
            Developed by Software Development Cell (Developers)
          </a>
        </div>
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
              className="w-10 h-10 flex items-center justify-center rounded-md border border-white/15 bg-white/[0.04] text-white/75 hover:bg-brand-red hover:border-brand-red hover:text-white transition-colors duration-150"
            >
              <Icon className="w-4 h-4" />
            </a>
          ))}
        </div>
      </div>

      <div className="border-t border-white/5 py-10 sm:py-12 text-center select-none">
        <p className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-white/20">
          RGUKT Ongole
        </p>
      </div>

      {showTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll to top"
          className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 w-11 h-11 rounded-lg bg-navy text-white border border-white/15 hover:bg-brand-red flex items-center justify-center transition-colors duration-150"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </footer>
  );
}
