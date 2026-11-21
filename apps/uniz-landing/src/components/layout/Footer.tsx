import { Link } from "react-router-dom";
import { Facebook, Twitter, Linkedin, Instagram, Youtube } from "lucide-react";
import { Lockup } from "../brand/Lockup";
import { Wrap } from "./Wrap";
import { portalPath } from "@/lib/portal";
import { ANDROID_APK_FILENAME, ANDROID_APK_URL, openLandingIosModal } from "@/lib/mobile-app";

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

const socials = [
  { Icon: Facebook, url: "https://www.facebook.com/RGUKTOfficial/", label: "Facebook" },
  { Icon: Twitter, url: "https://x.com/RGUKT_ONGOLE", label: "X" },
  { Icon: Linkedin, url: "https://in.linkedin.com/company/rguktongole", label: "LinkedIn" },
  { Icon: Instagram, url: "https://www.instagram.com/rgukt__ongole", label: "Instagram" },
  { Icon: Youtube, url: "https://www.youtube.com/@Rgukt-Ongole", label: "YouTube" },
];

const barLink = "focus-chrome inline-flex min-h-11 items-center text-[13px] leading-[18px] text-chrome-link hover:underline min-[640px]:min-h-0";

export function Footer() {
  return (
    <footer className="mt-[72px] w-full bg-navy-900 text-white min-[821px]:mt-[120px] dark:border-t dark:border-sb-border">
      <Wrap className="grid grid-cols-2 gap-x-6 gap-y-9 py-12 pb-9 min-[821px]:grid-cols-[1.6fr_repeat(4,1fr)] min-[821px]:gap-12 min-[821px]:py-[72px] min-[821px]:pb-14">
        <div className="col-span-2 min-w-0 min-[821px]:col-span-1">
          <Link to="/" className="focus-chrome inline-flex text-white">
            <Lockup mark={40} word={24} />
          </Link>
          <p className="mt-5 max-w-[360px] text-[14px] leading-[22px] text-chrome-link">
            Rajiv Gandhi University of Knowledge Technologies, Ongole. RGUKT Ongole Campus, Kurnool Road, Santhanuthalapadu (V&amp;M), Prakasam District, Andhra Pradesh — 523225.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.title} className="min-w-0">
            <h2 className="text-[14px] font-semibold leading-5 text-white">
              {col.title}
            </h2>
            <ul className="mt-3 flex flex-col gap-3">
              {col.links.map((lk) => (
                <li key={lk.p}>
                  <Link
                    to={lk.p}
                    className="focus-chrome inline-flex min-h-11 items-center text-[14px] leading-5 text-chrome-link hover:underline min-[640px]:min-h-0"
                  >
                    {lk.n}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Wrap>

      <div className="border-t border-navy-700">
        <Wrap className="flex flex-col gap-4 py-[22px] min-[821px]:flex-row min-[821px]:items-center min-[821px]:justify-between">
          <p className="text-[13px] leading-[18px] text-navy-300">© 2026 UniZ · RGUKT Ongole</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <a href={ANDROID_APK_URL} download={ANDROID_APK_FILENAME} className={barLink}>
              Android
            </a>
            <button type="button" onClick={openLandingIosModal} className={barLink}>
              iOS
            </button>
            {socials.map(({ Icon, url, label }) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="focus-chrome inline-flex h-11 w-11 items-center justify-center text-navy-300"
              >
                <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
              </a>
            ))}
            <a href={portalPath("/privacy")} className={barLink}>
              Privacy
            </a>
            <a href={portalPath("/developers")} className={barLink}>
              Developers
            </a>
          </div>
        </Wrap>
      </div>
    </footer>
  );
}
