import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getInstituteInfo } from "../types/api";
import type { InstituteData, InstitutePage as InstitutePageType } from "../types/api";

export function InstitutePage() {
  const { pageName } = useParams<{ pageName: string }>();
  const [data, setData] = useState<InstituteData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (pageName) {
        setLoading(true);
        const res = await getInstituteInfo(pageName as InstitutePageType);
        setData(res);
        setLoading(false);
      }
    }
    fetchData();
  }, [pageName]);

  const getDisplayName = (path?: string) => {
    if (!path) return "";
    const mappings: Record<string, string> = {
      aboutrgukt: "About RGUKT",
      campuslife: "Campus Life",
      edusys: "Education System",
      govcouncil: "Governing Council",
      rtiinfo: "RTI Information",
      scst: "SC/ST Cell",
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
          {displayName || "Institute Information"}
        </h1>
        
        {!data && !loading ? (
           <p className="text-slate-500 text-lg">Detailed information is not available for this section.</p>
        ) : (
          <div className="space-y-12">
            
            {/* Sections */}
            {data?.sections && data.sections.length > 0 && (
              <div className="space-y-8">
                {data.sections.map((section, idx) => (
                  <div key={idx} className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-2xl font-bold text-[#000035] mb-6">{section.title}</h2>
                    <div className="space-y-4 text-slate-700 text-lg leading-relaxed">
                      {section.content.map((paragraph, pIdx) => (
                        <p key={pIdx} className="text-justify">{paragraph}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Profiles */}
            {data?.profiles && data.profiles.length > 0 && (
              <div className="mt-12">
                 <h2 className="text-3xl font-bold text-slate-900 mb-8 border-b pb-4">Key Profiles</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {data.profiles.map((profile, idx) => (
                     <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-6 items-start hover:shadow-md transition-shadow">
                       {profile.photo ? (
                         <img 
                           src={profile.photo} 
                           alt={profile.name} 
                           className="w-32 h-32 rounded-lg object-cover shadow-sm bg-slate-100 flex-shrink-0"
                           onError={(e) => {
                             (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(profile.name) + "&background=random";
                           }}
                         />
                       ) : (
                         <div className="w-32 h-32 rounded-lg bg-slate-50 border border-slate-100 text-[#000035] flex items-center justify-center text-4xl font-bold flex-shrink-0 shadow-sm capitalize">
                           {profile.name.charAt(0)}
                         </div>
                       )}
                       <div>
                         <h3 className="text-xl font-bold text-slate-800 mb-3">{profile.name}</h3>
                         <div className="space-y-2 text-slate-600 text-sm">
                           {profile.text.map((textLine, tIdx) => (
                             <p key={tIdx} className="leading-relaxed">{textLine}</p>
                           ))}
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
