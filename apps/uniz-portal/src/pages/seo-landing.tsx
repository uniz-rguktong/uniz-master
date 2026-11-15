import { useLocation, Link, useNavigate } from "react-router-dom";
import { SEO } from "../components/SEO";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default function SEOLanding() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Basic content map for dynamic rendering
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

  // Blog pages
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
    <div className="min-h-screen bg-zinc-50 relative selection:bg-zinc-100 selection:text-zinc-900 pb-20">
      <SEO title={`${pageData.title} | UniZ`} description={pageData.subtitle} />

      {/* Header Navigation */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-zinc-100 flex items-center justify-between px-6 z-50">
        <Link
          to="/"
          className="uniz-logo-wordmark text-2xl text-zinc-900"
        >
          uniZ.
        </Link>
        <nav className="hidden md:flex gap-6 text-sm font-semibold text-zinc-500">
          <Link
            to="/college-team-collaboration"
            className="hover:text-zinc-900"
          >
            Features
          </Link>
          <Link to="/academic-task-tracker" className="hover:text-zinc-900">
            Docs
          </Link>
          <Link to="/blog" className="hover:text-zinc-900">
            Blog
          </Link>
          <Link
            to="/student-project-management"
            className="hover:text-zinc-900"
          >
            Pricing
          </Link>
        </nav>
        <div className="flex gap-3">
          <Link
            to="/signin"
            className="px-4 py-2 bg-navy-900 text-white rounded-lg font-medium text-sm hover:bg-navy-800 transition-[color,background-color] duration-150"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 pt-32">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-medium text-navy-400 hover:text-navy-900 mb-8 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <h1 className="text-4xl md:text-6xl font-semibold text-zinc-900 tracking-tight leading-tight mb-6">
          {pageData.title}
        </h1>
        <p className="text-xl text-zinc-500 font-medium leading-relaxed mb-12">
          {pageData.subtitle}
        </p>

        <div className="prose prose-slate prose-lg max-w-none">
          <h2>Overview of the Platform</h2>
          <p>
            UniZ is the campus portal for RGUKT Ongole. Use it to{" "}
            <strong>manage college projects online</strong>, track academics,
            and collaborate with classmates. It works as a{" "}
            <strong>notion alternative for engineering students</strong> when
            you need shared project space on campus systems.
          </p>

          <div className="my-10 bg-white p-8 rounded-2xl border border-zinc-100 shadow-sm">
            <h3 className="text-xl font-semibold mt-0 flex items-center gap-2 text-navy-900">
              <CheckCircle2 className="text-emerald-500" /> Comparison with
              Alternatives
            </h3>
            <div className="overflow-x-auto mt-6">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-100 text-navy-400 font-medium text-xs">
                    <th className="py-3">Feature</th>
                    <th className="py-3">Traditional Tools</th>
                    <th className="py-3 text-zinc-900">UniZ</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-medium">
                  <tr className="border-b border-zinc-50">
                    <td className="py-4 text-zinc-700">
                      Academic Task Tracker Integration
                    </td>
                    <td className="py-4 text-zinc-400">
                      Manual / Disconnected
                    </td>
                    <td className="py-4 text-emerald-600 font-bold">
                      Native Real-time
                    </td>
                  </tr>
                  <tr className="border-b border-zinc-50">
                    <td className="py-4 text-zinc-700">
                      College Team Collaboration
                    </td>
                    <td className="py-4 text-zinc-400">Third Party Chat</td>
                    <td className="py-4 text-emerald-600 font-bold">
                      Unified Campus Hub
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <h2>Internal Linking & Context</h2>
          <p>
            You can always navigate to our{" "}
            <Link
              to="/student-project-management"
              className="text-zinc-900 font-bold"
            >
              student collaboration platform
            </Link>{" "}
            page to learn more about how we facilitate large-scale academic
            ecosystems. Likewise, checking our comprehensive{" "}
            <Link
              to="/academic-task-tracker"
              className="text-zinc-900 font-bold"
            >
              academic productivity tool
            </Link>{" "}
            documentation helps ease the onboarding phase.
          </p>
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
        </div>

        {/* CTA Block */}
        <div className="mt-16 bg-navy-900 text-white rounded-2xl p-10 text-center">
          <h2 className="text-3xl font-semibold mb-4">
            Campus portal for RGUKT Ongole
          </h2>
          <p className="text-zinc-200 mb-8 text-lg font-medium max-w-xl mx-auto">
            Academics, registration, and campus updates in one place.
          </p>
          <Link
            to="/signin"
            className="inline-block bg-white text-navy-900 px-7 py-3 rounded-lg font-medium hover:bg-navy-50 transition-[color,background-color] duration-150"
          >
            Get started
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-6 mt-32 pt-10 border-t border-zinc-200 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h4 className="uniz-logo-wordmark text-xl mb-4">uniZ.</h4>
          <p className="text-sm text-zinc-400 font-medium">
            The next generation unified learning workspace built specifically
            for engineering and college students.
          </p>
        </div>
        <div>
          <h4 className="font-medium mb-4 text-sm text-navy-900">
            Platforms
          </h4>
          <ul className="space-y-3 text-sm font-medium text-zinc-500">
            <li>
              <Link
                to="/student-project-management"
                className="hover:text-zinc-900"
              >
                UniZ Student Workspace
              </Link>
            </li>
            <li>
              <Link
                to="/college-team-collaboration"
                className="hover:text-zinc-900"
              >
                Team Collaboration for Colleges
              </Link>
            </li>
            <li>
              <Link to="/academic-task-tracker" className="hover:text-zinc-900">
                Academic Task Tracker
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-medium mb-4 text-sm text-navy-900">
            Resources
          </h4>
          <ul className="space-y-3 text-sm font-medium text-zinc-500">
            <li>
              <Link
                to="/blog/best-tools-for-student-collaboration-in-india"
                className="hover:text-zinc-900"
              >
                Best Collaboration Tools
              </Link>
            </li>
            <li>
              <Link
                to="/blog/notion-alternative-for-engineering-students"
                className="hover:text-zinc-900"
              >
                Notion Alternatives
              </Link>
            </li>
            <li>
              <Link
                to="/blog/academic-productivity-system-guide"
                className="hover:text-zinc-900"
              >
                Productivity System Guide
              </Link>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
