import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUp, Download, MapPin, Smartphone } from "lucide-react";
import { UNIZ_APK_PATH, openIosDownloadModal } from "../constants/downloads";
import { enableOutingsAndOutpasses } from "../config/featureFlags";

const columns = [
  {
    title: "Portal",
    links: [
      { n: "Student sign in", to: "/student/signin" },
      { n: "Faculty sign in", to: "/faculty/signin" },
      { n: "Administration", to: "/admin/signin" },
      { n: "Privacy", to: "/privacy" },
    ],
  },
  {
    title: "Services",
    links: [
      { n: "Results & transcripts", to: "/student/gradehub" },
      { n: "Course registration", to: "/student/registration" },
      { n: "Attendance", to: "/student/attendance" },
      ...(enableOutingsAndOutpasses
        ? [{ n: "Hostel outpass", to: "/student/outpass" }]
        : []),
    ],
  },
  {
    title: "Campus",
    links: [
      { n: "Developers", to: "/developers" },
      { n: "Circulars", to: "/#campus-updates" },
      { n: "Academic services", to: "/#academic-services" },
    ],
  },
];

export function SiteLegalFooter() {
  const year = new Date().getFullYear();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 640);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
 <footer className="relative w-full overflow-hidden bg-navy-850 text-white">
 <div className="h-0.5 w-full bg-brand-red" aria-hidden="true" />
 <div className="relative mx-auto grid max-w-7xl grid-cols-2 gap-10 border-b border-white/10 px-6 py-16 md:grid-cols-3 lg:grid-cols-6 lg:gap-12 lg:px-12 lg:py-24">
        <div className="col-span-2 flex flex-col gap-5">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/rgukt-logo.png"
              alt="RGUKT Ongole"
 className="h-12 w-12 rounded-lg bg-white object-contain p-1.5 shadow-sm ring-1 ring-white/20"
            />
            <div className="flex flex-col leading-none">
 <span className="font-serif text-2xl font-semibold tracking-tight text-white">
                uniZ
              </span>
 <span className="mt-1 text-xs text-white/50">Ongole campus portal</span>
            </div>
          </Link>
 <p className="max-w-sm text-[15px] leading-relaxed text-white/70">
            Attendance, grades, outpass, and campus notices for students, faculty, and administration at RGUKT Ongole.
          </p>
 <div className="mt-1 flex max-w-sm gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-white/65">
 <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white/75" />
            <div className="flex flex-col gap-0.5 leading-relaxed">
 <span className="mb-1 text-sm font-medium text-white/70">Contact</span>
              <span>RGUKT Ongole Campus,</span>
              <span>Kurnool Road, Santhanuthalapadu,</span>
              <span>Prakasam District, Andhra Pradesh — 523225.</span>
              <a
                href="mailto:webadmin@rguktong.ac.in"
 className="mt-2 text-white/80 underline-offset-4 hover:text-white hover:underline"
              >
                webadmin@rguktong.ac.in
              </a>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={UNIZ_APK_PATH}
              download="uniz-android.apk"
 className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/15 px-3 text-sm text-white/85 transition-colors duration-150 hover:bg-white/10"
            >
              <Download className="h-3.5 w-3.5" />
              Android app
            </a>
            <button
              type="button"
              onClick={() => openIosDownloadModal()}
 className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-white/15 px-3 text-sm text-white/85 transition-colors duration-150 hover:bg-white/10"
            >
              <Smartphone className="h-3.5 w-3.5" />
              iOS app
            </button>
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
 <p className="mb-5 text-sm font-medium text-white/70">{col.title}</p>
            <ul className="flex flex-col gap-3">
              {col.links.map((lk) => (
                <li key={lk.n}>
                  <Link
                    to={lk.to}
 className="inline-block text-sm text-white/65 transition-[color,transform] duration-150 hover:translate-x-0.5 hover:text-white"
                  >
                    {lk.n}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
 <p className="mb-5 text-sm font-medium text-white/70">University</p>
          <ul className="flex flex-col gap-3">
            <li>
              <a
                href="https://rguktong.in"
                target="_blank"
                rel="noopener noreferrer"
 className="inline-block text-sm text-white/65 transition-colors duration-150 hover:text-white"
              >
                rguktong.in
              </a>
            </li>
            <li>
              <Link
                to="/developers"
 className="inline-block text-sm text-white/65 transition-colors duration-150 hover:text-white"
              >
                Software Development Cell
              </Link>
            </li>
          </ul>
        </div>
      </div>

 <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-6 py-6 sm:flex-row lg:px-12">
 <div className="flex flex-col items-center gap-2 text-center text-[11px] tracking-wide text-white/60 sm:flex-row sm:text-left">
          <p>© {year} RGUKT Ongole. All rights reserved.</p>
 <span className="hidden text-white/20 sm:inline">·</span>
 <Link to="/developers" className="text-white/70 underline-offset-4 hover:text-white hover:underline">
            Developed by Software Development Cell
          </Link>
        </div>
      </div>

 <div className="select-none border-t border-white/5 py-10 text-center sm:py-12">
 <p className="font-serif text-3xl font-medium tracking-tight text-white/20 sm:text-4xl">
          uniZ · RGUKT Ongole
        </p>
      </div>

      {showTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll to top"
 className="fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-lg border border-white/15 bg-navy text-white transition-colors duration-150 hover:bg-brand-red sm:bottom-8 sm:right-8"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </footer>
  );
}

export default SiteLegalFooter;
