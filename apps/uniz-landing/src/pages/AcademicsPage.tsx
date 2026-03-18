import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getAcademicPage } from "../types/api";
import type { AcademicSection, AcademicPageType } from "../types/api";

export function AcademicsPage() {
  const { pageName } = useParams<{ pageName: string }>();
  const [data, setData] = useState<AcademicSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPage() {
      if (pageName) {
        setLoading(true);
        const res = await getAcademicPage(pageName as AcademicPageType);
        setData(res);
        setLoading(false);
      }
    }
    fetchPage();
  }, [pageName]);

  const getDisplayName = (path?: string) => {
    if (!path) return "";
    const mappings: Record<string, string> = {
      academicprograms: "Academic Programs",
      academiccalender: "Academic Calendar",
      academicregulations: "Academic Regulations",
      curicula: "Curricula",
    };
    if (mappings[path.toLowerCase()]) return mappings[path.toLowerCase()];
    return path.replace(/([A-Z])/g, ' $1').trim();
  };

  const displayName = getDisplayName(pageName);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center bg-white cursor-wait">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#000035] border-t-transparent"></div>
          <p className="text-slate-600 font-semibold uppercase tracking-widest text-sm animate-pulse">Loading {displayName}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8 capitalize border-b pb-4">
          {displayName || "Academics"}
        </h1>
        {data.length === 0 ? (
          <p className="text-slate-500 text-lg">No content available for this page at the moment.</p>
        ) : (
          <div className="space-y-8">
            {data.map((section, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8 hover:shadow-md transition-shadow">
                <h2 className="text-2xl font-semibold text-slate-800 mb-6">{section.header}</h2>
                {section.links && section.links.length > 0 ? (
                  <ul className="space-y-4">
                    {section.links.map((link, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-[#000035] mr-3 mt-1 text-lg">●</span>
                        <a 
                          href={link.url || "#"} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[#000035] hover:text-[#000035] hover:underline text-lg font-medium transition-colors break-all"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500 italic">No links available in this section.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
