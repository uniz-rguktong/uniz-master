import { useLocation, Link } from "react-router-dom";
import { SEO } from "../components/SEO";
import { Button } from "@/components/Button";
import { PublicFooter, PublicHeader } from "@/components/public/PublicFrame";

export default function SEOLanding() {
  const { pathname } = useLocation();

  const titleMap: Record<
    string,
    { title: string; subtitle: string; keywords: string[] }
  > = {
    "/student-project-management": {
      title: "Student Project Management Platform",
      subtitle:
        "Organize your academic projects with ease. Build specific roadmaps and manage your college team projects online quickly.",
      keywords: [
        "student project manager",
        "academic project management software",
        "college team collaboration",
      ],
    },
    "/college-team-collaboration": {
      title: "College Team Collaboration Tool",
      subtitle:
        "The best academic productivity system guide integrated natively for engineering students. Avoid friction.",
      keywords: [
        "college collaboration tool",
        "engineering students workspace",
        "group project tracker",
      ],
    },
    "/academic-task-tracker": {
      title: "Academic Task Tracker for Colleges",
      subtitle:
        "Track assignments, grades, and projects simultaneously with the native real-time academic tracker.",
      keywords: [
        "academic task tracker",
        "manage college projects online",
        "student assignment tracker",
      ],
    },
    "/blog": {
      title: "UniZ Academic Blog",
      subtitle: "Discover insights about academic productivity and tools.",
      keywords: [
        "student productivity blog",
        "university collaboration insights",
      ],
    },
  };

  const defaultVal = {
    title: "Academic Productivity System Guide",
    subtitle: "Notion alternative for engineering students in India.",
    keywords: [
      "best tools for student collaboration in india",
      "notion alternative",
    ],
  };

  let pageData = titleMap[pathname];

  if (pathname.includes("/blog/")) {
    const slug = pathname.replace("/blog/", "").replace(/-/g, " ");
    pageData = {
      title: slug.replace(/\b\w/g, (c) => c.toUpperCase()),
      subtitle: "Comprehensive guide to mastering " + slug,
      keywords: [slug, "academic productivity", "student collaboration"],
    };
  }

  pageData = pageData || defaultVal;

  return (
    <div className="min-h-screen bg-bg text-text">
      <SEO title={`${pageData.title} | UniZ`} description={pageData.subtitle} />
      <PublicHeader signInTo="/signin" />

      <main className="mx-auto w-full max-w-[65ch] px-4 py-10 min-[821px]:px-0 min-[821px]:py-16">
        <h1 className="font-serif text-[26px] font-normal leading-[34px] tracking-[-0.01em] text-head min-[821px]:text-[32px] min-[821px]:leading-10">
          {pageData.title}
        </h1>
        <p className="mt-4 text-[17px] leading-[27px] text-text-2">{pageData.subtitle}</p>

        <div className="mt-8">
          <Button size="hero" asChild>
            <Link to="/signin">Sign in</Link>
          </Button>
        </div>

        <div className="mt-12 space-y-8 text-[16px] leading-[26px]">
          <section>
            <h2 className="font-serif text-[24px] font-normal leading-8 tracking-[-0.01em] text-head">
              Overview of the platform
            </h2>
            <p className="mt-3 text-text">
              UniZ is the campus portal for RGUKT Ongole. Use it to manage college
              projects online, track academics, and collaborate with classmates. It
              works as a notion alternative for engineering students when you need
              shared project space on campus systems.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-[24px] font-normal leading-8 tracking-[-0.01em] text-head">
              Comparison with alternatives
            </h2>
            <table className="mt-4 w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border-strong text-small font-semibold text-text-2">
                  <th className="py-3 pr-4 font-semibold">Feature</th>
                  <th className="py-3 pr-4 font-semibold">Traditional tools</th>
                  <th className="py-3 font-semibold">UniZ</th>
                </tr>
              </thead>
              <tbody className="text-dense">
                <tr className="border-b border-border">
                  <td className="py-4 pr-4">Academic task tracker integration</td>
                  <td className="py-4 pr-4 text-text-2">Manual / disconnected</td>
                  <td className="py-4">Native real-time</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-4 pr-4">College team collaboration</td>
                  <td className="py-4 pr-4 text-text-2">Third party chat</td>
                  <td className="py-4">Unified campus hub</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="font-serif text-[24px] font-normal leading-8 tracking-[-0.01em] text-head">
              Internal linking and context
            </h2>
            <p className="mt-3 text-text">
              You can always navigate to our{" "}
              <Link to="/student-project-management" className="text-link underline-offset-[1px] hover:underline">
                student collaboration platform
              </Link>{" "}
              page to learn more about how we facilitate large-scale academic
              ecosystems. Likewise, checking our comprehensive{" "}
              <Link to="/academic-task-tracker" className="text-link underline-offset-[1px] hover:underline">
                academic productivity tool
              </Link>{" "}
              documentation helps ease the onboarding phase.
            </p>
            <ul className="mt-6 space-y-3 text-dense">
              <li>
                <Link to="/college-team-collaboration" className="text-link underline-offset-[1px] hover:underline">
                  Team collaboration for colleges
                </Link>
              </li>
              <li>
                <Link to="/blog/best-tools-for-student-collaboration-in-india" className="text-link underline-offset-[1px] hover:underline">
                  Best collaboration tools
                </Link>
              </li>
              <li>
                <Link to="/blog/notion-alternative-for-engineering-students" className="text-link underline-offset-[1px] hover:underline">
                  Notion alternatives
                </Link>
              </li>
              <li>
                <Link to="/blog/academic-productivity-system-guide" className="text-link underline-offset-[1px] hover:underline">
                  Productivity system guide
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
