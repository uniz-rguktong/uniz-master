import { useNavigate } from "react-router-dom";
import { useEffect, useState, memo, useMemo } from "react";
import { useIsAuth } from "../hooks/is_authenticated";
import { Monitor } from "lucide-react";
import { PUBLIC_BANNERS } from "../api/endpoints";
import { usePWAInstall } from "../hooks/usePWAInstall";
import { SEO } from "../components/SEO";
import { HOME_SEO, homePageSchema } from "../lib/seo";
import { SiteLegalFooter } from "../components/SiteLegalFooter";
import { UNIZ_CAMPUS_LABEL, UNIZ_TAGLINE } from "@/constants/branding";
import CampusUpdatesFeed from "../components/CampusUpdatesFeed";

const AppleIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

const AndroidIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.27-.86-.31-.16-.69-.04-.86.27l-1.86 3.22c-1.23-.57-2.6-.89-4.05-.89-1.45 0-2.82.32-4.05.89L6.47 5.71c-.16-.31-.55-.43-.86-.27-.31.16-.43.55-.27.86l1.84 3.18C4.21 10.96 2.17 13.76 2 17h20c-.17-3.24-2.21-6.04-4.4-7.52zM8.5 14c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm7 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
  </svg>
);

const getPlatform = () => {
  if (typeof navigator === "undefined")
    return { label: "Desktop", PlatformIcon: Monitor };
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua))
    return { label: "iOS", PlatformIcon: AppleIcon };
  if (/android/.test(ua))
    return { label: "Android", PlatformIcon: AndroidIcon };
  if (/macintosh|mac os x/.test(ua))
    return { label: "macOS", PlatformIcon: AppleIcon };
  if (/windows/.test(ua)) return { label: "Windows", PlatformIcon: Monitor };
  if (/linux/.test(ua)) return { label: "Linux", PlatformIcon: Monitor };
  return { label: "Desktop", PlatformIcon: Monitor };
};

const Home = () => {
  useIsAuth();
  const navigate = useNavigate();
  const [banners, setBanners] = useState<any[]>([]);
  const { install, isInstalled } = usePWAInstall();
  const platform = useMemo(() => getPlatform(), []);

  const handleInstallClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    const result = await install();
    if (result === "ios") {
      window.alert(
        "To install UniZ on iOS:\n\n1. Tap the Share icon (at bottom)\n2. Select 'Add to Home Screen'\n\nDirect native install is not supported by Apple yet.",
      );
    }
  };

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const headers = new Headers();
    headers.append("x-cms-api-key", "uniz-landing-v1-key");

    fetch(PUBLIC_BANNERS, {
      method: "GET",
      headers,
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((bannerResult) => {
        if (cancelled) return;
        if (bannerResult?.success) setBanners(bannerResult.banners || []);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    let keys = "";
    const track = (e: KeyboardEvent) => {
      keys += e.key.toLowerCase();
      if (keys.endsWith("admin")) navigate("/admin/signin");
      keys = keys.slice(-10);
    };
    window.addEventListener("keydown", track);
    return () => window.removeEventListener("keydown", track);
  }, [navigate]);

  return (
    <div className="flex min-h-[calc(100vh-52px)] flex-col bg-white pt-[52px] font-sans text-[#0A2540]">
      <SEO
        title={HOME_SEO.title}
        description={HOME_SEO.description}
        canonical="https://uniz.rguktong.in/"
        schema={homePageSchema}
      />

      <main className="flex flex-1 flex-col items-center px-6 py-16 text-center">
        <h1 className="text-[22px] font-bold tracking-[0.02em]">
          {UNIZ_TAGLINE.line1}
        </h1>
        <p className="mt-3 max-w-md text-[15px] text-[#3d4f63]">
          {UNIZ_TAGLINE.line2} {UNIZ_CAMPUS_LABEL}.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/student/signin")}
            className="inline-flex h-10 items-center justify-center rounded-[2px] bg-[#0A2540] px-8 text-[13px] font-bold uppercase tracking-[1.5px] text-white hover:bg-[#021227]"
          >
            Login
          </button>
          {!isInstalled && (
            <button
              type="button"
              onClick={handleInstallClick}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[2px] border border-[#E8E8E8] bg-white px-6 text-[13px] font-bold uppercase tracking-[1px] text-[#0A2540]"
            >
              <platform.PlatformIcon size={16} />
              Install
            </button>
          )}
        </div>

        <div className="mt-12 w-full">
          <CampusUpdatesFeed />
        </div>

        {banners.length > 0 && (
          <div className="mt-10 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
            {banners.map((banner, index) => (
              <figure key={banner.id || index} className="overflow-hidden bg-white">
                {banner.imageUrl ? (
                  <img
                    src={banner.imageUrl}
                    alt={banner.title || ""}
                    className="h-40 w-full object-cover"
                  />
                ) : null}
                {banner.title ? (
                  <figcaption className="px-2 py-3 text-[13px] font-medium text-[#0A2540]">
                    {banner.title}
                  </figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        )}
      </main>

      <SiteLegalFooter />
    </div>
  );
};

export default memo(Home);
