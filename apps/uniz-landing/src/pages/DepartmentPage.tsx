import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getDepartmentStaff } from "../types/api";
import type { DepartmentData, DeptCode } from "../types/api";

export function DepartmentPage() {
  const { deptCode } = useParams<{ deptCode: string }>();
  const [data, setData] = useState<DepartmentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (deptCode) {
        setLoading(true);
        const res = await getDepartmentStaff(deptCode.toUpperCase() as DeptCode);
        setData(res);
        setLoading(false);
      }
    }
    fetchData();
  }, [deptCode]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center bg-white cursor-wait">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#000035] border-t-transparent"></div>
          <p className="text-slate-600 font-semibold uppercase tracking-widest text-sm animate-pulse">Loading Department Data...</p>
        </div>
      </div>
    );
  }

  const deptName = deptCode?.toUpperCase() || "";

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8 uppercase border-b pb-4">
          Department of {deptName}
        </h1>
        
        {!data || !data.faculties || data.faculties.length === 0 ? (
          <p className="text-slate-500 text-lg">No designated faculty information available for this department.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {data.faculties.map((faculty, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
                <div className="h-32 bg-gradient-to-r from-navy to-navy w-full flex items-end justify-center pb-4">
                </div>
                <div className="px-6 pb-6 pt-0 flex flex-col items-center text-center -mt-16 flex-grow">
                  {faculty.photo ? (
                    <img 
                      src={faculty.photo} 
                      alt={faculty.name} 
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md bg-white mb-4"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(faculty.name) + "&background=random";
                      }}
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-md bg-slate-100 flex items-center justify-center mb-4 text-4xl font-bold text-[#000035]">
                      {faculty.name.charAt(0)}
                    </div>
                  )}
                  
                  <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-[#000035] transition-colors">{faculty.name}</h3>
                  <a href={`mailto:${faculty.email}`} className="text-[#000035] text-sm font-medium hover:underline mb-4 break-all">
                    {faculty.email}
                  </a>
                  
                  {faculty.bio && Object.keys(faculty.bio).length > 0 ? (
                    <div className="w-full text-left mt-auto pt-4 border-t border-slate-100 space-y-2 text-sm text-slate-600">
                      {Object.entries(faculty.bio).slice(0, 4).map(([key, value]) => {
                        const strVal = String(value);
                        if (!strVal || strVal.toLowerCase() === 'null') return null;
                        return (
                          <div key={key} className="flex flex-col">
                            <span className="font-semibold text-slate-700 capitalize">{key.replace(/_/g, ' ')}:</span>
                            <span className="truncate" title={strVal}>{strVal}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                     <div className="mt-auto pt-4 text-sm text-slate-400 italic">No additional biography available.</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
