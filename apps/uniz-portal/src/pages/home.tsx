import { Link, useNavigate } from "react-router-dom";
import {
  useEffect,
  useState,
  memo,
  lazy,
  Suspense,
} from "react";
import { useIsAuth } from "../hooks/is_authenticated";
import { Activity, Lock, Smartphone, ArrowRight, Code2 } from "lucide-react";
import { PUBLIC_BANNERS } from "../api/endpoints";
import { HeroBlock } from "../components/ui/hero-block-shadcnui";
import { SEO } from "../components/SEO";
import { HOME_SEO, homePageSchema } from "../lib/seo";
import { SiteLegalFooter } from "../components/SiteLegalFooter";
import { motion } from "framer-motion";
import {
  LandingSection,
  LandingSectionHeader,
  LandingDivider,
  LandingCard,
  LandingPill,
} from "../components/ui/landing-section";
import { cn } from "@/lib/utils";
import { ANDROID_APK_FILENAME, ANDROID_APK_URL, openIosDownloadModal } from "@/lib/androidApp";
import { developerTestimonials } from "@/constants/developerTestimonials";

import FeaturedCarousel from "../components/FeaturedCarousel";
import CampusUpdatesFeed from "../components/CampusUpdatesFeed";

// Lazy load below-fold sections; FeaturedCarousel is eager (first below fold)
const Timeline = lazy(() =>
  import("../components/ui/timeline").then((module) => ({
    default: module.Timeline,
  })),
);
const DatabaseWithRestApi = lazy(
  () => import("../components/ui/database-with-rest-api"),
);
const Features = lazy(() =>
  import("../components/ui/features-9").then((module) => ({
    default: module.Features,
  })),
);
const GlobeFeature = lazy(
  () => import("../components/ui/globe-feature-section"),
);

const SectionSkeleton = ({ className = "h-64" }: { className?: string }) => (
  <div className="max-w-[1280px] mx-auto px-6">
    <div className={cn("w-full animate-pulse rounded-[2px] bg-navy-50/80", className)} />
  </div>
);

const MotionSection = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "200px 0px" }}
    transition={{ duration: 0.5 }}
    className={className}
  >
    {children}
  </motion.div>
);

// ─── Platform Icons ─────────────────────────────────────────────────────────

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

const timelineData = [
  {
    step: "Step 01",
    title: "Sign in with Campus ID",
    subtitle: "Seamless Access",
    content: (
      <div className="space-y-4">
        <p className="text-navy-600 text-[15px] md:text-[16px] leading-relaxed font-medium">
          Use your unique University ID and secure credentials to access your
          personalized dashboard. No complicated registration required — your
          account is pre-configured from day one.
        </p>
      </div>
    ),
    icon: Lock,
  },
  {
    step: "Step 02",
    title: "Track Real-time Progress",
    subtitle: "Academic Pulse",
    content: (
      <div className="space-y-4">
        <p className="text-navy-600 text-[15px] md:text-[16px] leading-relaxed font-medium">
          Stay on top of your academic standing with live attendance updates,
          instant semester results, and automated CGPA calculations — all in one
          place.
        </p>
      </div>
    ),
    icon: Activity,
  },
  {
    step: "Step 03",
    title: "Instant Outpass & Requests",
    subtitle: "Digital Freedom",
    content: (
      <div className="space-y-4">
        <p className="text-navy-600 text-[15px] md:text-[16px] leading-relaxed font-medium">
          Apply for outpasses or outings directly from your phone. Track approval
          status in real-time and get digital clearance at the campus gate
          without any paperwork.
        </p>
      </div>
    ),
    icon: Smartphone,
  },
];

// Fallback banners when API isn't configured or returns empty
const FALLBACK_BANNERS = [
  {
    id: 1,
    title: "Central Campus Block",
    tag: "Infrastructure",
    imageUrl: "/assets/campus-1.jpg",
    hasHeart: true,
  },
  {
    id: 2,
    title: "Academic Library & Study Center",
    tag: "Academics",
    imageUrl: "/assets/campus-2.jpg",
    hasHeart: false,
  },
  {
    id: 3,
    title: "Student Activity & Sports Complex",
    tag: "Campus Life",
    imageUrl: "/assets/campus-3.jpg",
    hasHeart: true,
  },
  {
    id: 4,
    title: "Innovation & Research Labs",
    tag: "Technology",
    imageUrl: "/assets/campus-4.jpg",
    hasHeart: false,
  },
];

const Home = memo(() => {
  useIsAuth();
  const navigate = useNavigate();

  const [featuredItems, setFeaturedItems] = useState<any[]>(FALLBACK_BANNERS);
  const [loadingBanners, setLoadingBanners] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch(PUBLIC_BANNERS, { headers: { "x-cms-api-key": "uniz-landing-v1-key" } });
        const data = await res.json();
        if (data.success && data.banners && data.banners.length > 0) {
          setFeaturedItems(data.banners);
        }
      } catch (error) {
        console.error("Failed to fetch banners:", error);
      } finally {
        setLoadingBanners(false);
      }
    };
    fetchBanners();
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
    <div className="relative min-h-screen w-full overflow-x-hidden bg-white text-navy-900 font-sans selection:bg-navy-100">
      <SEO
        title={HOME_SEO.title}
        description={HOME_SEO.description}
        keywords={HOME_SEO.keywords}
        canonical="/"
        schema={homePageSchema}
      />

      {/* 1. Hero Section */}
      <div className="relative z-10 w-full pt-12">
        <HeroBlock />
      </div>

      {/* 1b. Live campus announcements */}
      <CampusUpdatesFeed variant="landing" />

      <LandingDivider />

      {/* 2. Featured Stories Carousel */}
      <MotionSection className="relative z-20">
        <FeaturedCarousel items={featuredItems} loading={loadingBanners} />
      </MotionSection>

      <LandingDivider />

      {/* 3. How It Works Timeline */}
      <MotionSection className="relative z-20">
        <Suspense fallback={<SectionSkeleton className="h-[520px]" />}>
          <Timeline data={timelineData} />
        </Suspense>
      </MotionSection>

      <LandingDivider />

      {/* 4. Unified Architecture Diagram */}
      <MotionSection className="relative z-20">
        <LandingSection>
          <LandingSectionHeader
            eyebrow="Unified Architecture"
            title="Everything your campus needs,"
            titleMuted="managed seamlessly."
            description="A single source of truth connecting students, faculty, and administration in real-time."
          />
          <div className="w-full flex justify-center">
            <Suspense fallback={<SectionSkeleton className="h-[420px]" />}>
              <DatabaseWithRestApi />
            </Suspense>
          </div>
        </LandingSection>
      </MotionSection>

      <LandingDivider />

      {/* 5. Features Showcase */}
      <MotionSection className="relative z-20">
        <Suspense fallback={<SectionSkeleton className="h-[480px]" />}>
          <Features />
        </Suspense>
      </MotionSection>

      <LandingDivider />

      {/* 6. Software Development Cell — Developers Spotlight */}
      <MotionSection className="relative z-20">
        <LandingSection id="developers-spotlight">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <LandingSectionHeader
              eyebrow="Software Development Cell"
              title="Engineered by RGUKT Ongole"
              titleMuted="student developers."
              description="UniZ is architected, maintained, and continuously shipped by students of the Software Development Cell at RGUKT Ongole."
              className="!mb-0"
            />
            <Link
              to="/developers"
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-[4px] bg-[#0A2540] px-5 text-[13px] font-bold uppercase tracking-[0.08em] text-white shadow-sm transition-colors hover:bg-[#061B33]"
            >
              <Code2 size={15} />
              <span>Open Developer Page</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {developerTestimonials.map((dev) => (
              <Link
                key={dev.name}
                to="/developers"
                className="group flex flex-col justify-between rounded-[2px] border border-navy-200/80 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#0A2540] hover:shadow-[0_20px_45px_-20px_rgba(10,37,64,0.2)] no-underline"
              >
                <div>
                  <div className="flex items-center gap-3.5 mb-4">
                    <img
                      src={dev.src}
                      alt={dev.name}
                      loading="lazy"
                      className="h-12 w-12 rounded-full object-cover border border-navy-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-bold text-navy-950 truncate group-hover:text-[#0A2540]">
                        {dev.name}
                      </h3>
                      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-navy-500 truncate">
                        {dev.designation}
                      </p>
                    </div>
                  </div>
                  <p className="text-[13px] font-medium text-navy-600 leading-relaxed line-clamp-3">
                    “{dev.quote}”
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-navy-100 flex items-center justify-between text-[11.5px] font-bold uppercase tracking-[0.08em] text-[#0A2540]">
                  <span>View Profile</span>
                  <ArrowRight
                    size={13}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </div>
              </Link>
            ))}
          </div>
        </LandingSection>
      </MotionSection>

      <LandingDivider />

      {/* 7. Open Source / Globe Feature */}
      <MotionSection className="relative z-20">
        <Suspense fallback={<SectionSkeleton className="h-80" />}>
          <GlobeFeature />
        </Suspense>
      </MotionSection>

      <LandingDivider />

      {/* 8. Final Call to Action Card */}
      <MotionSection className="relative z-20">
        <LandingSection className="!pt-12 !pb-20 md:!pb-28">
          <LandingCard className="p-8 sm:p-12 md:p-16 text-center shadow-[0_30px_80px_-28px_rgba(0,0,0,0.12)]">
            <div className="max-w-2xl mx-auto flex flex-col items-center">
              <LandingPill
                label="Campus Community"
                accent="emerald"
                className="mb-6"
              />

              <h3 className="text-[clamp(1.75rem,4vw,2.75rem)] font-semibold text-navy-950 tracking-[-0.04em] leading-[1.08] mb-4">
                Built by RGUKT students,{" "}
                <span className="text-navy-400 font-light">
                  for RGUKT students.
                </span>
              </h3>

              <p className="text-navy-500 text-[15px] md:text-[17px] font-medium leading-relaxed mb-8">
                Sign in with your campus credentials, download the official UniZ
                mobile app, or meet the student engineering team behind the
                platform.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3.5">
                <button
                  type="button"
                  onClick={() => navigate("/student/signin")}
                  className="inline-flex h-12 items-center gap-2.5 rounded-[4px] bg-[#0A2540] px-7 text-[13.5px] font-bold uppercase tracking-[0.08em] text-white shadow-sm transition-colors hover:bg-[#061B33]"
                >
                  <span>Student &amp; Staff Login</span>
                  <ArrowRight size={15} />
                </button>

                <a
                  href={ANDROID_APK_URL}
                  download={ANDROID_APK_FILENAME}
                  className="inline-flex h-12 items-center gap-2 rounded-[4px] border border-[#0A2540] bg-white px-5 text-[13px] font-bold uppercase tracking-[0.06em] text-[#0A2540] no-underline transition-colors hover:bg-navy-50"
                >
                  <AndroidIcon size={16} />
                  <span>Download Android App</span>
                </a>

                <button
                  type="button"
                  onClick={openIosDownloadModal}
                  className="inline-flex h-12 items-center gap-2 rounded-[4px] border border-[#0A2540] bg-white px-5 text-[13px] font-bold uppercase tracking-[0.06em] text-[#0A2540] transition-colors hover:bg-navy-50"
                >
                  <AppleIcon size={16} />
                  <span>Download iOS App</span>
                </button>

                <Link
                  to="/developers"
                  className="inline-flex h-12 items-center gap-2 rounded-[4px] border border-navy-200 bg-navy-50/70 px-5 text-[13px] font-bold uppercase tracking-[0.06em] text-[#0A2540] no-underline transition-colors hover:bg-navy-100"
                >
                  <Code2 size={15} />
                  <span>Developer Page</span>
                </Link>
              </div>
            </div>
          </LandingCard>
        </LandingSection>
      </MotionSection>

      <SiteLegalFooter />
    </div>
  );
});

export default Home;
