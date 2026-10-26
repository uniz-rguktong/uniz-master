import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Share, PlusSquare } from "lucide-react";
import Navbar from "../components/Navbar";
import { SiteLegalFooter } from "../components/SiteLegalFooter";
import {
  ANDROID_APK_FILENAME,
  ANDROID_APK_URL,
  IOS_PROFILE_FILENAME,
  IOS_PROFILE_URL,
} from "../lib/androidApp";
import { AndroidLogo, AppleLogo } from "../components/DownloadAppBanner";

export default function IosInstallPage() {
  const navigate = useNavigate();

  return (
    <div className="portal-theme flex min-h-screen flex-col bg-white font-sans text-[#061B33]">
      <Navbar />

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 pt-[76px] pb-16">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-bold text-[#34495E] hover:text-[#0A2540]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Examination Cell
        </button>

        <div className="border-b border-[#E4E4E4] pb-5">
          <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#5A7A94]">
            RGUKT Ongole · Examination Cell
          </p>
          <h1 className="mt-1 text-[24px] font-bold tracking-[0.01em] text-[#061B33]">
            Mobile Application Downloads (Android &amp; iOS)
          </h1>
          <p className="mt-1.5 text-[14px] text-[#3d4f63]">
            Install the official RGUKT Ongole Examination Cell application for direct access to grades, attendance, and student records.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* Android APK Card */}
          <section className="flex flex-col justify-between rounded-[2px] border border-[#D8E0E8] bg-white p-6">
            <div>
              <div className="flex items-center gap-3 border-b border-[#EEEEEE] pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-[2px] bg-[#0A2540] text-white">
                  <AndroidLogo className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-[17px] font-bold text-[#061B33]">
                    Android Application (.APK)
                  </h2>
                  <p className="text-[12px] text-[#5A7A94]">
                    Signed Release Package · in.rguktong.uniz
                  </p>
                </div>
              </div>

              <ol className="mt-4 space-y-2.5 text-[13px] text-[#3d4f63]">
                <li className="flex gap-2.5">
                  <span className="font-bold text-[#0A2540]">1.</span>
                  <span>
                    Download <strong className="text-[#061B33]">uniZ.apk</strong> directly to your Android phone.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span className="font-bold text-[#0A2540]">2.</span>
                  <span>
                    Open the downloaded file and confirm installation to launch the standalone Exam Cell app.
                  </span>
                </li>
              </ol>
            </div>

            <div className="mt-6 pt-4 border-t border-[#EEEEEE]">
              <a
                href={ANDROID_APK_URL}
                download={ANDROID_APK_FILENAME}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[2px] bg-[#0A2540] px-5 text-[13px] font-bold uppercase tracking-[1px] text-white transition-colors hover:bg-[#021227]"
              >
                <Download className="h-4 w-4" />
                Download Android App
              </a>
            </div>
          </section>

          {/* iOS Card */}
          <section className="flex flex-col justify-between rounded-[2px] border border-[#D8E0E8] bg-white p-6">
            <div>
              <div className="flex items-center gap-3 border-b border-[#EEEEEE] pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-[2px] bg-[#0A2540] text-white">
                  <AppleLogo className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-[17px] font-bold text-[#061B33]">
                    iOS Application (iPhone &amp; iPad)
                  </h2>
                  <p className="text-[12px] text-[#5A7A94]">
                    iOS Configuration Profile &amp; Safari Web App
                  </p>
                </div>
              </div>

              <ol className="mt-4 space-y-2.5 text-[13px] text-[#3d4f63]">
                <li className="flex gap-2.5">
                  <span className="font-bold text-[#0A2540]">1.</span>
                  <span>
                    Download the iOS configuration profile below and approve it in{" "}
                    <strong className="text-[#061B33]">Settings → Profile Downloaded</strong>.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span className="font-bold text-[#0A2540]">2.</span>
                  <span>
                    Or in Safari, tap{" "}
                    <Share className="mx-0.5 inline h-3.5 w-3.5 text-[#0A2540]" />{" "}
                    <strong className="text-[#061B33]">Share</strong> →{" "}
                    <PlusSquare className="mx-0.5 inline h-3.5 w-3.5 text-[#0A2540]" />{" "}
                    <strong className="text-[#061B33]">Add to Home Screen</strong>.
                  </span>
                </li>
              </ol>
            </div>

            <div className="mt-6 pt-4 border-t border-[#EEEEEE]">
              <a
                href={IOS_PROFILE_URL}
                download={IOS_PROFILE_FILENAME}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[2px] border border-[#0A2540] bg-white px-5 text-[13px] font-bold uppercase tracking-[1px] text-[#0A2540] transition-colors hover:bg-[#0A2540] hover:text-white"
              >
                <AppleLogo className="h-4 w-4" />
                Download iOS App
              </a>
            </div>
          </section>
        </div>
      </main>

      <SiteLegalFooter />
    </div>
  );
}
