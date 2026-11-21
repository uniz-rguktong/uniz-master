import { Link } from "react-router-dom";
import { Facebook, Twitter, Linkedin, Instagram, Youtube } from "lucide-react";
import { Wrap } from "./Wrap";
import { portalPath } from "@/lib/portal";
import { officialHome } from "@/data/official";
import { EditableText } from "../preview/EditRegion";
import { useSiteContent } from "@/components/site-context";
import { ANDROID_APK_FILENAME, ANDROID_APK_URL, openLandingIosModal } from "@/lib/mobile-app";

const columns = [
  {
    title: "About",
    links: [
      { n: "About RGUKT", p: "/institute/aboutrgukt" },
      { n: "Campus life", p: "/institute/campuslife" },
      { n: "Governing council", p: "/institute/govcouncil" },
      { n: "Photo gallery", p: "/about/gallery" },
      { n: "RTI", p: "/institute/rtiinfo" },
    ],
  },
  {
    title: "Academics",
    links: [
      { n: "Programs", p: "/academics/AcademicPrograms" },
      { n: "Calendar", p: "/academics/AcademicCalender" },
      { n: "Departments", p: "/academics/departments" },
      { n: "Examination cell", p: "/academics/examination-cell" },
      { n: "Admissions", p: "/admissions" },
    ],
  },
  {
    title: "Campus",
    links: [
      { n: "Administration", p: "/administration" },
      { n: "Placements", p: "/information/placements" },
      { n: "SC/ST cell", p: "/institute/scst" },
      { n: "Contact", p: "/information/contact" },
      { n: "Consultancy", p: "/consultancy" },
    ],
  },
  {
    title: "Notices",
    links: [
      { n: "News and updates", p: "/notifications/news" },
      { n: "Tenders", p: "/notifications/tenders" },
      { n: "Careers", p: "/notifications/careers" },
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
  const { contact, authorized } = useSiteContent();
  return (
    <footer className="mt-[72px] w-full bg-navy-900 text-white min-[821px]:mt-[120px] dark:border-t dark:border-sb-border">
      <Wrap className="grid grid-cols-2 gap-x-6 gap-y-9 py-12 pb-9 min-[821px]:grid-cols-[1.6fr_repeat(4,1fr)] min-[821px]:gap-12 min-[821px]:py-[72px] min-[821px]:pb-14">
        <div className="col-span-2 min-w-0 min-[821px]:col-span-1">
          <Link to="/" className="focus-chrome inline-flex items-center gap-3 text-white">
            <img src="/rgukt-logo.png" alt="" width={40} height={46} className="h-10 w-auto brightness-0 invert" />
            <span className="font-serif text-[22px] font-semibold leading-none tracking-[-0.01em]">RGUKT Ongole</span>
          </Link>
          <EditableText
            region="contact-address"
            value={contact.address}
            as="p"
            className="mt-5 max-w-[360px] text-[14px] leading-[22px] text-chrome-link"
          />
          <p className="mt-3 flex flex-col gap-1 text-[13px] leading-[18px] text-chrome-link">
            {authorized ? (
              <EditableText region="contact-phone" value={contact.phone} />
            ) : (
              <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} className="hover:underline">
                {contact.phone}
              </a>
            )}
            {authorized ? (
              <EditableText region="contact-email" value={contact.email} />
            ) : (
              <a href={`mailto:${contact.email}`} className="hover:underline">
                {contact.email}
              </a>
            )}
          </p>
          <p className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-[13px] leading-[18px]">
            {officialHome.campuses.map((campus) => (
              <a key={campus.href} href={campus.href} target="_blank" rel="noopener noreferrer" className="text-chrome-link hover:underline">
                {campus.label}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            ))}
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
          <p className="max-w-[520px] text-[13px] leading-[18px] text-navy-300">
            © RGUKT Ongole. The Rajiv Gandhi University of Knowledge Technologies has been constituted under A.P. Act No. 18 of 2008.
          </p>
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
