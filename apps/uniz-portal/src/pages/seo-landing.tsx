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
    <div className="min-h-screen bg-slate-50 relative selection:bg-navy-100 selection:text-navy-900 pb-20">
      <SEO title={`${pageData.title} | UniZ`} description={pageData.subtitle} />

      {/* Header Navigation */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 z-50">
        <Link
          to="/"
          className="font-outfit font-black text-2xl tracking-tighter text-navy-900"
        >
          uniZ.
        </Link>
        <nav className="hidden md:flex gap-6 text-sm font-semibold text-slate-500">
          <Link
            to="/college-team-collaboration"
            className="hover:text-navy-900"
          >
            Features
          </Link>
          <Link to="/academic-task-tracker" className="hover:text-navy-900">
            Docs
          </Link>
          <Link to="/blog" className="hover:text-navy-900">
            Blog
          </Link>
          <Link
            to="/student-project-management"
            className="hover:text-navy-900"
          >
            Pricing
          </Link>
        </nav>
        <div className="flex gap-3">
          <Link
            to="/signin"
            className="px-4 py-2 bg-navy-900 text-white rounded-lg font-bold text-sm hover:bg-navy-800 transition-colors"
          >
            Open WorkSpace
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 pt-32">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-navy-900 mb-8 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight mb-6">
          {pageData.title}
        </h1>
        <p className="text-xl text-slate-500 font-medium leading-relaxed mb-12">
          {pageData.subtitle}
        </p>

        <div className="prose prose-slate prose-lg max-w-none">
          <h2>Overview of the Platform</h2>
          <p>
            When utilizing a robust <strong>student project manager</strong>,
            achieving goals becomes significantly easier. UniZ offers an
            unparalleled experience to help you{" "}
            <strong>manage college projects online</strong>. Whether you are
            using this as a{" "}
            <strong>notion alternative for engineering students</strong> or
            simply integrating it into your daily lifecycle, the resulting
            academic enhancements speak for themselves.
          </p>

          <div className="my-10 bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-xl font-bold mt-0 flex items-center gap-2 text-navy-900">
              <CheckCircle2 className="text-emerald-500" /> Comparison with
              Alternatives
            </h3>
            <div className="overflow-x-auto mt-6">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-xs tracking-wider">
                    <th className="py-3">Feature</th>
                    <th className="py-3">Traditional Tools</th>
                    <th className="py-3 text-navy-900">UniZ</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-medium">
                  <tr className="border-b border-slate-50">
                    <td className="py-4 text-slate-700">
                      Academic Task Tracker Integration
                    </td>
                    <td className="py-4 text-slate-400">
                      Manual / Disconnected
                    </td>
                    <td className="py-4 text-emerald-600 font-bold">
                      Native Real-time
                    </td>
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-4 text-slate-700">
                      College Team Collaboration
                    </td>
                    <td className="py-4 text-slate-400">Third Party Chat</td>
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
              className="text-navy-900 font-bold"
            >
              student collaboration platform
            </Link>{" "}
            page to learn more about how we facilitate large-scale academic
            ecosystems. Likewise, checking our comprehensive{" "}
            <Link
              to="/academic-task-tracker"
              className="text-navy-900 font-bold"
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
        <div className="mt-16 bg-navy-900 text-white rounded-3xl p-10 text-center">
          <h2 className="text-3xl font-black mb-4">
            Ready to accelerate your academic journey?
          </h2>
          <p className="text-navy-200 mb-8 text-lg font-medium max-w-xl mx-auto">
            Experience the best real-time college team collaboration tool
            exclusively tailored for students and faculty.
          </p>
          <Link
            to="/signin"
            className="inline-block bg-white text-navy-900 px-8 py-4 rounded-xl font-bold hover:bg-slate-50 transition-colors"
          >
            Create Free Student Account
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-6 mt-32 pt-10 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h4 className="font-outfit font-black text-xl mb-4">uniZ.</h4>
          <p className="text-sm text-slate-400 font-medium">
            The next generation unified learning workspace built specifically
            for engineering and college students.
          </p>
        </div>
        <div>
          <h4 className="font-bold mb-4 text-sm uppercase tracking-widest text-slate-900">
            Platforms
          </h4>
          <ul className="space-y-3 text-sm font-medium text-slate-500">
            <li>
              <Link
                to="/student-project-management"
                className="hover:text-navy-900"
              >
                UniZ Student Workspace
              </Link>
            </li>
            <li>
              <Link
                to="/college-team-collaboration"
                className="hover:text-navy-900"
              >
                Team Collaboration for Colleges
              </Link>
            </li>
            <li>
              <Link to="/academic-task-tracker" className="hover:text-navy-900">
                Academic Task Tracker
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4 text-sm uppercase tracking-widest text-slate-900">
            Resources
          </h4>
          <ul className="space-y-3 text-sm font-medium text-slate-500">
            <li>
              <Link
                to="/blog/best-tools-for-student-collaboration-in-india"
                className="hover:text-navy-900"
              >
                Best Collaboration Tools
              </Link>
            </li>
            <li>
              <Link
                to="/blog/notion-alternative-for-engineering-students"
                className="hover:text-navy-900"
              >
                Notion Alternatives
              </Link>
            </li>
            <li>
              <Link
                to="/blog/academic-productivity-system-guide"
                className="hover:text-navy-900"
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
