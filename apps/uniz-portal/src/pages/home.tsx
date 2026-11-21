import { memo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarCheck, ClipboardCheck, GraduationCap } from "lucide-react";
import { useIsAuth } from "../hooks/is_authenticated";
import { SEO } from "../components/SEO";
import { HOME_SEO, homePageSchema } from "../lib/seo";
import { UNIZ_CAMPUS_LABEL } from "../constants/branding";
import { prefetchTurnstile } from "../utils/prefetchTurnstile";
import { Button } from "@/components/Button";
import { Tile } from "@/components/ui/tile";
import {
  CampusIllustration,
  PublicFooter,
  PublicHeader,
} from "@/components/public/PublicFrame";

const Home = () => {
  useIsAuth();
  const navigate = useNavigate();

  useEffect(() => {
    prefetchTurnstile();
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
    <div className="min-h-screen bg-bg font-sans text-text">
      <SEO
        title={HOME_SEO.title}
        description={HOME_SEO.description}
        canonical="https://uniz.rguktong.in/"
        schema={homePageSchema}
      />
      <PublicHeader />

      <main>
        <section className="mx-auto grid w-full max-w-[1232px] items-center gap-10 px-5 py-10 min-[821px]:grid-cols-[minmax(0,1fr)_520px] min-[821px]:gap-20 min-[821px]:px-10 min-[821px]:py-16">
          <div>
            <p className="text-body text-text-2">
              {UNIZ_CAMPUS_LABEL} campus platform
            </p>
            <h1 className="mt-4 max-w-[16ch] font-serif text-[34px] font-normal leading-[44px] tracking-[-0.01em] text-head min-[821px]:text-display min-[821px]:leading-[66px]">
              Campus tools for RGUKT Ongole students
            </h1>
            <p className="mt-4 max-w-[34rem] text-[17px] leading-[27px] text-text-2 min-[821px]:text-lede min-[821px]:leading-[30px]">
              Academics, semester registration, outpasses, and campus updates in
              one signed in place.
            </p>
            <div className="mt-8 flex flex-col gap-3 min-[821px]:flex-row min-[821px]:items-center">
              <Button
                size="hero"
                className="w-full min-[821px]:w-auto"
                onMouseEnter={prefetchTurnstile}
                onFocus={prefetchTurnstile}
                onClick={() => navigate("/student/signin")}
              >
                Sign in
              </Button>
            </div>
          </div>
          <div className="h-[300px] overflow-hidden rounded-xl border border-border bg-tint min-[821px]:h-[480px]">
            <CampusIllustration />
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1232px] px-5 pb-16 min-[821px]:px-10">
          <h2 className="font-serif text-[28px] font-normal leading-8 tracking-[-0.01em] text-head min-[821px]:text-[36px] min-[821px]:leading-[46px]">
            Services
          </h2>
          <p className="mt-2 text-[17px] leading-[26px] text-text-2">
            Sign in with your university ID or college email.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-5 min-[821px]:grid-cols-3">
            <Tile
              icon={GraduationCap}
              label="Results"
              line="Semester results and subjects."
              onClick={() => navigate("/student/gradehub")}
            />
            <Tile
              icon={CalendarCheck}
              label="Attendance"
              line="Attendance for each subject."
              onClick={() => navigate("/student/attendance")}
            />
            <Tile
              icon={ClipboardCheck}
              label="Registration"
              line="Semester registration and deadlines."
              onClick={() => navigate("/student/registration")}
            />
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};

export default memo(Home);
