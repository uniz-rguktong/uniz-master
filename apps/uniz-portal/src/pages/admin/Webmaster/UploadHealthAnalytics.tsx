
import { useState, useEffect } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { cn } from "../../../utils/cn";
import { ANALYTICS_UPLOAD_HEALTH, ANALYTICS_KEY } from "../../../api/endpoints";

import { useRecoilState } from "recoil";
import { uploadHealthAnalyticsAtom } from "../../../store/atoms";
import { AreaChartSkeleton } from "../AnalyticsUI";


export default function UploadHealthAnalytics({ hideHeader = false }: { hideHeader?: boolean }) {
  const [cachedData, setCachedData] = useRecoilState(uploadHealthAnalyticsAtom);
  const [loading, setLoading] = useState(!cachedData.fetched);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState(7);

  useEffect(() => {
    const fetchData = async () => {
      // Skip for localhost to prevent 401 errors from prod API
      if (window.location.hostname === "localhost" || window.location.hostname !== "uniz.rguktong.in") {
        console.log("Upload health analytics fetching skipped on non-production host:", window.location.hostname);
        setLoading(false);
        return;
      }

      try {
        if (!cachedData.fetched) setLoading(true);
        const token = localStorage.getItem("admin_token") || localStorage.getItem("faculty_token") || localStorage.getItem("student_token");
        const res = await fetch(ANALYTICS_UPLOAD_HEALTH, {
          headers: {
            "x-api-key": ANALYTICS_KEY,
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error("Unauthorized or API down");
        const json = await res.json();

        let apiData = [];
        if (json?.success && Array.isArray(json?.data)) {
          apiData = json.data;
        } else if (Array.isArray(json)) {
          apiData = json;
        }
        setCachedData({ fetched: true, data: apiData });
      } catch (err) {
        console.error("Analytics fetch failed:", err);
        setError("Failed to stream analytics.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading && !cachedData.fetched) {
    return <AreaChartSkeleton />;
  }

  const data = cachedData.data;

  const safeData = Array.isArray(data) 
    ? [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) 
    : [];
  
  // Filtering data based on range
  const filteredData = safeData.slice(-range);
  
  const latest = filteredData[filteredData.length - 1] || { success_rate_percent: 0, total: 0 };
  const previous = filteredData[filteredData.length - 2] || latest;
  const delta = Number(latest?.success_rate_percent) - Number(previous?.success_rate_percent);
  
  const highValue = Math.max(...filteredData.map(d => Number(d.success_rate_percent) || 0));
  const lowValue = Math.min(...filteredData.map(d => Number(d.success_rate_percent) || 0));

  const totalSyncs = filteredData.reduce((acc, curr) => acc + (Number(curr?.total) || 0), 0);
  const avgSuccess = filteredData.length > 0
    ? filteredData.reduce((acc, curr) => acc + (Number(curr?.success_rate_percent) || 0), 0) / filteredData.length
    : 0;

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header Info */}
      {!hideHeader && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-1.5 px-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Real-time Stream Active</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 leading-none">
              Upload Ecosystem <span className="text-blue-600">Health</span>
            </h2>
            <p className="text-slate-500 font-medium text-[16px]">
              Statistical analysis of record synchronization health.
            </p>
          </div>

          <div className="flex gap-4">
            <div className="bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-end">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Avg Success</span>
              <span className="text-xl font-black text-emerald-600 leading-none">{(avgSuccess || 0).toFixed(1)}%</span>
            </div>
            <div className="bg-slate-950 px-5 py-3 rounded-2xl shadow-xl flex flex-col items-end">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Records</span>
              <span className="text-xl font-black text-white leading-none">{totalSyncs.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={cn(
          "bg-white rounded-xl border border-slate-100 p-10 shadow-sm transition-all duration-500 relative overflow-hidden",
          hideHeader ? "lg:col-span-3" : "lg:col-span-3"
        )}>
          {/* Top Section with Large Value and Dropdown */}
          <div className="flex justify-between items-start mb-10 relative z-10">
            <div>
              <p className="text-slate-400 font-bold text-sm mb-2 uppercase tracking-tight">Success Health</p>
              <div className="flex items-center gap-4">
                <h3 className="text-5xl font-black text-slate-900 tracking-tighter">
                  {(Number(latest?.success_rate_percent) || 0).toFixed(1)}%
                </h3>
                {delta !== 0 && (
                  <div className={cn(
                    "flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-lg",
                    delta > 0 ? "text-emerald-500" : "text-rose-500"
                  )}>
                    <TrendingUp size={14} className={cn(delta < 0 && "rotate-180")} />
                    <span>{delta > 0 ? "+" : ""}{delta.toFixed(1)}%</span>
                    <span className="text-slate-300 font-medium ml-1">Vs prev</span>
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center gap-6 text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                   <span className="text-slate-500">Total volume:</span>
                   <span className="text-slate-900">{latest?.total || 0}</span>
                </div>
                <div className="flex gap-4">
                    <span className="text-blue-500 flex items-center gap-1.5">
                       <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                       High: {highValue.toFixed(1)}%
                    </span>
                    <span className="text-orange-400 flex items-center gap-1.5">
                       <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                       Low: {lowValue.toFixed(1)}%
                    </span>
                </div>
              </div>
            </div>

            <div className="relative group">
               <select 
                 value={range}
                 onChange={(e) => setRange(Number(e.target.value))}
                 className="appearance-none bg-slate-50 border border-slate-100 rounded-xl px-5 py-2.5 pr-10 text-[11px] font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 cursor-pointer hover:bg-slate-100 transition-all shadow-sm"
               >
                 <option value={7}>Last 7 Days</option>
                 <option value={15}>Last 15 Days</option>
                 <option value={30}>Last 1 Month</option>
               </select>
               <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="h-[250px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.12}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                  dy={20}
                />
                <YAxis
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  hide
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '20px',
                    border: 'none',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                    fontSize: '11px',
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    padding: '12px 20px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="success_rate_percent"
                  stroke="#3b82f6"
                  strokeWidth={4}
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: '#3b82f6' }}
                  fillOpacity={1}
                  fill="url(#colorBlue)"
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {error && !safeData.length && (
        <div className="p-6 bg-red-50 border border-red-100 rounded-[2rem] flex items-center gap-4 text-red-900">
          <AlertCircle size={24} className="shrink-0" />
          <p className="text-sm font-bold uppercase tracking-wide">{error}</p>
        </div>
      )}
    </div>
  );
}
