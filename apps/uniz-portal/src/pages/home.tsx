import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { SEO } from "../components/SEO";
import CampusUpdatesFeed from "../components/CampusUpdatesFeed";
import { SiteLegalFooter } from "../components/SiteLegalFooter";
import { UNIZ_CAMPUS_LABEL, UNIZ_TAGLINE } from "@/constants/branding";
import {
  ANDROID_APK_FILENAME,
  ANDROID_APK_URL,
  openIosDownloadModal,
} from "../lib/androidApp";
import { AndroidLogo, AppleLogo } from "../components/DownloadAppBanner";

export default function HomeComponent() {
  const navigate = useNavigate();

  return (
    <div className="portal-theme flex min-h-screen flex-col bg-white pt-[52px] font-sans text-[#061B33]">
      <SEO />
      <Navbar />

      <main className="flex flex-1 flex-col items-center px-6 py-16 text-center">
        <h1 className="text-[24px] font-bold tracking-[0.02em] text-[#061B33]">
          {UNIZ_TAGLINE.line1}
        </h1>
        <p className="mt-2.5 max-w-md text-[15px] text-[#3d4f63]">
          {UNIZ_TAGLINE.line2} {UNIZ_CAMPUS_LABEL}.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/student/signin")}
            className="inline-flex h-10 items-center justify-center rounded-[2px] bg-[#0A2540] px-8 text-[13px] font-bold uppercase tracking-[1.2px] text-white transition-colors hover:bg-[#021227]"
          >
            Login
          </button>

          <a
            href={ANDROID_APK_URL}
            download={ANDROID_APK_FILENAME}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[2px] border border-[#0A2540] bg-white px-5 text-[13px] font-bold uppercase tracking-[1px] text-[#0A2540] transition-colors hover:bg-[#0A2540] hover:text-white"
          >
            <AndroidLogo className="h-4 w-4 shrink-0" />
            Download Android App
          </a>

          <button
            type="button"
            onClick={openIosDownloadModal}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[2px] border border-[#0A2540] bg-white px-5 text-[13px] font-bold uppercase tracking-[1px] text-[#0A2540] transition-colors hover:bg-[#0A2540] hover:text-white"
          >
            <AppleLogo className="h-4 w-4 shrink-0" />
            Download iOS App
          </button>
        </div>

        <CampusUpdatesFeed />
      </main>

      <SiteLegalFooter />
    </div>
  );
}
