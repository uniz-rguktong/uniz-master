import { Link } from "react-router-dom";
import {
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  ArrowUp,
  MapPin,
  ChevronRight,
} from "lucide-react";

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const sections = [
    {
      title: "Academics",
      links: [
        { name: "Programs", path: "/academics/AcademicPrograms" },
        { name: "Academic Calendar", path: "/academics/AcademicCalender" },
        { name: "Regulations", path: "/academics/AcademicRegulations" },
        { name: "Curricula", path: "/academics/curicula" },
        { name: "Office of Academics", path: "/institute/aboutrgukt" },
      ],
    },
    {
      title: "Departments",
      links: [
        { name: "Computer Science", path: "/departments/CSE" },
        { name: "Electronics & Comms", path: "/departments/ECE" },
        { name: "Civil Engineering", path: "/departments/CIVIL" },
        { name: "Mechanical Engg", path: "/departments/ME" },
        { name: "Mathematics & Physics", path: "/departments/MATHEMATICS" },
      ],
    },
    {
      title: "Institute Life",
      links: [
        { name: "Campus Life", path: "/institute/campuslife" },
        { name: "Governance Council", path: "/institute/govcouncil" },
        { name: "SC/ST Cell", path: "/institute/scst" },
        { name: "Library & Computing", path: "#" },
        { name: "Hostel Management", path: "#" },
      ],
    },
    {
      title: "Updates",
      links: [
        { name: "Latest News", path: "/notifications" },
        { name: "Careers", path: "/notifications" },
        { name: "Tender Invitations", path: "/notifications" },
        { name: "Events & Symposiums", path: "#" },
      ],
    },
  ];

  return (
    <footer className="bg-[#020617] text-white relative border-t border-slate-800">
      {/* Newsletter / CTA Section */}
      <div className="border-b border-slate-800/50">
        <div className="container mx-auto max-w-7xl px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#800000]/10 rounded-2xl border border-[#800000]/20">
              <img
                src="/rgukt-logo.png"
                alt="Logo"
                className="w-10 h-10 object-contain brightness-110 grayscale-0"
              />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">
                Rajiv Gandhi University of Knowledge Technologies
              </h3>
              <p className="text-slate-400 text-sm font-medium italic">
                Catering to the Educational Needs of Gifted Rural Youth
              </p>
            </div>
          </div>
          <div className="flex gap-4"></div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 pt-16 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10 lg:gap-8 mb-12">
          {/* Logo & Info */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2 flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black italic tracking-tighter text-white">
                UNI<span className="text-[#800000]">Z</span>
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500 border-l border-slate-700 pl-2">
                Ongole Campus
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Pioneering technical excellence and academic innovation at RGUKT
              Ongole.
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3 text-slate-400 group">
                <MapPin className="w-5 h-5 text-[#800000] shrink-0 mt-0.5" />
                <span className="text-sm group-hover:text-white transition-colors leading-snug">
                  RGUKT Ongole Campus, <br />
                  Prakasam District, AP - 523225
                </span>
              </div>
            </div>
            <div className="flex gap-4 pt-2">
              {[Facebook, Twitter, Linkedin, Instagram, Youtube].map(
                (Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-10 h-10 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-[#800000] hover:border-[#800000] transition-all duration-300"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                ),
              )}
            </div>
          </div>

          {/* Dynamic Sections */}
          {sections.map((section, idx) => (
            <div key={idx} className="flex flex-col gap-6">
              <h4 className="font-bold tracking-tight text-white relative inline-block">
                {section.title}
                <span className="absolute -bottom-1 left-0 w-8 h-0.5 bg-[#800000]"></span>
              </h4>
              <div className="flex flex-col gap-3">
                {section.links.map((link, lIdx) => (
                  <Link
                    key={lIdx}
                    to={link.path}
                    className="text-slate-400 hover:text-white text-sm transition-all flex items-center group gap-1"
                  >
                    <ChevronRight className="w-3 h-3 text-[#800000] opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* BOTTOM COPYRIGHT ROW */}
        <div className="border-t border-slate-800/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">
          <p>
            © {new Date().getFullYear()} Rajiv Gandhi University of Knowledge
            Technologies. All rights reserved.
          </p>
          <div className="flex items-center gap-8">
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Contact Support
            </a>
          </div>
        </div>
      </div>

      {/* FLOATING SCROLL TO TOP */}
      <button
        onClick={scrollToTop}
        aria-label="Scroll to top"
        className="fixed bottom-8 right-8 w-14 h-14 bg-[#800000] hover:bg-[#600000] text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-[#800000]/40 transition-all duration-300 hover:-translate-y-2 active:scale-95 group z-50"
      >
        <ArrowUp className="w-6 h-6 group-hover:animate-bounce" />
      </button>
    </footer>
  );
}
