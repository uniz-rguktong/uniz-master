import { Link } from "react-router-dom";
import { Download, Smartphone, ExternalLink } from "lucide-react";
import { UNIZ_APK_PATH, openIosDownloadModal } from "../constants/downloads";

export function SiteLegalFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      role="contentinfo"
      className="w-full bg-[#061527] text-white border-t border-[#163A5C] font-sans"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b border-white/10">
          {/* Institutional Identity */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3.5">
              <img
                src="/logo.png"
                alt="RGUKT Ongole UniZ Seal"
                width={44}
                height={44}
                className="w-11 h-11 rounded-full object-cover border border-white/25 bg-[#0A2540] shrink-0"
              />
              <div>
                <p className="text-[18px] font-bold tracking-[0.03em] text-white leading-tight">
                  uniZ · RGUKT Ongole
                </p>
                <p className="text-[11.5px] uppercase tracking-[0.08em] text-white/70">
                  Office of Examinations &amp; Academic Affairs
                </p>
              </div>
            </div>

            <p className="text-[13.5px] text-white/75 leading-relaxed max-w-md">
              Rajiv Gandhi University of Knowledge Technologies — Ongole Campus.
              Official university portal for academic records, semester course
              registrations, examination transcripts, and campus residence
              administration.
            </p>

            <div className="text-[12.5px] text-white/70 space-y-1 pt-1">
              <p>Kurnool Road, Ongole, Prakasam District, Andhra Pradesh – 523225</p>
              <p>
                Examination &amp; Portal Support:{" "}
                <a
                  href="mailto:webadmin@rguktong.ac.in"
                  className="text-white underline underline-offset-4 hover:text-white/90"
                >
                  webadmin@rguktong.ac.in
                </a>
              </p>
            </div>
          </div>

          {/* Column 1: Portal Sign-In */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-white/90">
              Portal Access
            </h3>
            <ul className="space-y-2 text-[13.5px] text-white/75">
              <li>
                <Link to="/student/signin" className="hover:text-white transition-colors">
                  Student Portal Sign In
                </Link>
              </li>
              <li>
                <Link to="/faculty/signin" className="hover:text-white transition-colors">
                  Faculty Sign In
                </Link>
              </li>
              <li>
                <Link to="/admin/signin" className="hover:text-white transition-colors">
                  Administration Sign In
                </Link>
              </li>
              <li>
                <a
                  href="https://rguktong.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-white transition-colors"
                >
                  Main University Site
                  <ExternalLink className="w-3 h-3 opacity-75" />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Academic Services */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-white/90">
              Academic Services
            </h3>
            <ul className="space-y-2 text-[13.5px] text-white/75">
              <li>
                <Link to="/student/signin" className="hover:text-white transition-colors">
                  Examination Results
                </Link>
              </li>
              <li>
                <Link to="/student/signin" className="hover:text-white transition-colors">
                  Course Registration
                </Link>
              </li>
              <li>
                <Link to="/student/signin" className="hover:text-white transition-colors">
                  Attendance Ledger
                </Link>
              </li>
              <li>
                <Link to="/student/signin" className="hover:text-white transition-colors">
                  Hostel Outpass &amp; Leave
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Official Mobile Apps & Engineering */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-white/90">
              Mobile Access &amp; Systems
            </h3>
            <div className="flex flex-col gap-2">
              <a
                href={UNIZ_APK_PATH}
                download="uniz-android.apk"
                className="inline-flex items-center gap-2 h-9 px-3.5 rounded-[2px] border border-white/25 bg-white/5 hover:bg-white/10 text-white text-[12.5px] font-semibold transition-colors w-fit"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Android App (.apk)</span>
              </a>
              <button
                type="button"
                onClick={() => openIosDownloadModal()}
                className="inline-flex items-center gap-2 h-9 px-3.5 rounded-[2px] border border-white/25 bg-white/5 hover:bg-white/10 text-white text-[12.5px] font-semibold transition-colors cursor-pointer w-fit"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Download iOS App</span>
              </button>
            </div>
            <div className="pt-2 space-y-1.5 text-[13px] text-white/75">
              <div>
                <Link
                  to="/developers"
                  className="text-white font-semibold hover:underline underline-offset-4"
                >
                  Software Development Cell (Developers) →
                </Link>
              </div>
              <div>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy &amp; Institutional Terms
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[12px] text-white/65">
          <p>
            © {year} Rajiv Gandhi University of Knowledge Technologies, Ongole Campus. All rights reserved.
          </p>
          <p>
            Engineered and maintained by the{" "}
            <Link to="/developers" className="text-white hover:underline underline-offset-4 font-semibold">
              RGUKT Ongole Software Development Cell
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default SiteLegalFooter;
