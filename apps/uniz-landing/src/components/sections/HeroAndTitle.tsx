import { Link } from "react-router-dom";
import {
  ANDROID_APK_FILENAME,
  ANDROID_APK_URL,
  openLandingIosModal,
} from "../../lib/mobile-app";
import { AndroidIcon, AppleIcon } from "../MobileAppModal";

interface Announcement {
  text: string;
  link?: string | null;
}

export function HeroAndTitle({
  title = "Rajiv Gandhi University of Knowledge Technologies",
  subtitle = "Catering to the Educational Needs of Gifted Rural Youth",
  images = [],
  announcements = [],
}: {
  title?: string;
  subtitle?: string;
  images: readonly string[];
  announcements: readonly Announcement[];
}) {
  const photo = images[0];
  const notices = announcements.filter((item) => item.text).slice(0, 4);

  return (
    <>
      <section className="border-b border-line bg-white">
        <div className="mx-auto grid max-w-6xl items-end gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-12 lg:gap-14 lg:py-20">
          <div className="lg:col-span-7">
            <p className="text-[13px] font-semibold text-crimson">Ongole Campus · RGUKT-AP</p>
            <h1 className="mt-4 font-serif text-[2.35rem] font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.4rem]">
              {title}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-muted">{subtitle}</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link to="/institute/aboutrgukt" className="editorial-link text-[15px]">
                About the institute
              </Link>
              <Link to="/academics/AcademicPrograms" className="editorial-link text-[15px]">
                Academic programs
              </Link>
              <a
                href={ANDROID_APK_URL}
                download={ANDROID_APK_FILENAME}
                className="inline-flex min-h-11 items-center gap-2 text-[15px] font-semibold text-ink hover:text-crimson"
              >
                <AndroidIcon className="h-4 w-4" />
                Android app
              </a>
              <button
                type="button"
                onClick={openLandingIosModal}
                className="inline-flex min-h-11 items-center gap-2 text-[15px] font-semibold text-ink hover:text-crimson"
              >
                <AppleIcon className="h-4 w-4" />
                iOS app
              </button>
            </div>
          </div>

          {photo ? (
            <figure className="lg:col-span-5">
              <img
                src={photo}
                alt="RGUKT Ongole campus"
                className="aspect-[4/3] w-full object-cover"
              />
              <figcaption className="mt-2 text-sm text-ink-subtle">RGUKT Ongole</figcaption>
            </figure>
          ) : null}
        </div>
      </section>

      {notices.length > 0 && (
        <section aria-label="Announcements" className="border-b border-line bg-paper">
          <div className="mx-auto grid max-w-6xl gap-4 px-5 py-6 sm:px-8 md:grid-cols-[10rem_1fr] md:items-start">
            <h2 className="font-serif text-lg text-ink">Announcements</h2>
            <ul className="divide-y divide-line border-line md:border-l md:pl-8">
              {notices.map((ann, idx) => (
                <li key={`${ann.text}-${idx}`} className="py-2 first:pt-0 last:pb-0">
                  {ann.link ? (
                    <a
                      href={ann.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[15px] text-ink hover:text-crimson"
                    >
                      {ann.text}
                    </a>
                  ) : (
                    <p className="text-[15px] text-ink">{ann.text}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
