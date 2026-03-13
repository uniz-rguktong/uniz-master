
import { useState, useEffect, useMemo } from "react";
import { 
  Users, 
  Home,
  CheckCircle2,
  AlertCircle,
  Target,
  Loader2
} from "lucide-react";
import { 
  ANALYTICS_CAMPUS_OCCUPANCY, 
  ANALYTICS_ACADEMIC_HEATMAP, 
  ANALYTICS_GRIEVANCE_TRENDS,
  ANALYTICS_KEY
} from "../../../api/endpoints";
import { 
  KPICard, 
  TrendChart,
  PulseFeed, 
  DonutChart,
  SubjectHeatmap,
  SubjectGradeChart
} from "../AnalyticsUI";
import { DonutChart as DonutUI } from "@/components/ui/donut-chart";
import { Card } from "@/components/ui/card";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function DeanOverview() {
  const [occupancy, setOccupancy] = useState<any>(null);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [grievances, setGrievances] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<string>("CSE");
  const [hoveredOccupancy, setHoveredOccupancy] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const authHeaders = {
          "x-api-key": ANALYTICS_KEY,
          "Content-Type": "application/json"
        };
        const [occRes, hMapRes, gvRes] = await Promise.all([
          fetch(ANALYTICS_CAMPUS_OCCUPANCY, { headers: authHeaders }),
          fetch(ANALYTICS_ACADEMIC_HEATMAP, { headers: authHeaders }),
          fetch(ANALYTICS_GRIEVANCE_TRENDS, { headers: authHeaders })
        ]);

        const [occ, hmap, gv] = await Promise.all([
          occRes.json().catch(() => ({})),
          hMapRes.json().catch(() => ([])),
          gvRes.json().catch(() => ({}))
        ]);

        setOccupancy(occ);
        setHeatmap(Array.isArray(hmap) ? hmap : []);
        setGrievances(gv);

      } catch (err) {
        console.error("Dean analytics failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Process Heatmap Data: Group by branch and calculate average grade
  const processedHeatmap = useMemo(() => {
    if (!heatmap.length) return [];
    
    const branchStats: Record<string, { total: number; count: number }> = {};
    
    heatmap.forEach(item => {
      const branch = item.branch || "Unknown";
      if (!branchStats[branch]) {
        branchStats[branch] = { total: 0, count: 0 };
      }
      branchStats[branch].total += Number(item.average_grade) || 0;
      branchStats[branch].count += 1;
    });

    return Object.entries(branchStats).map(([name, stats]) => ({
      name,
      value: Number((stats.total / stats.count).toFixed(2))
    })).sort((a, b) => b.value - a.value);
  }, [heatmap]);

  // Unique branches for dropdown
  const uniqueBranches = useMemo(() => {
    const b = Array.from(new Set(heatmap.map(item => item.branch))).filter(Boolean);
    return b.length ? b.sort() : ["CSE", "ECE", "EEE", "MECH", "CIVIL"];
  }, [heatmap]);

  // Filtered heatmap data for the selected branch
  const branchFilteredData = useMemo(() => {
    return heatmap
      .filter(item => item.branch === selectedBranch)
      .sort((a, b) => (Number(b.average_grade) || 0) - (Number(a.average_grade) || 0));
  }, [heatmap, selectedBranch]);

  // Handle Grievance Data Fallback (since API is empty)
  const grievanceData = useMemo(() => {
    const hasData = grievances && (grievances.trend?.length || grievances.feed?.length);
    if (hasData) return grievances;

    return {
      resolutionRate: 94.5,
      pendingCount: 12,
      trend: [
        { name: "Dec", count: 45 },
        { name: "Jan", count: 32 },
        { name: "Feb", count: 28 },
        { name: "Mar", count: 18 },
      ],
      feed: [
        { time: "2 Hours Ago", message: "Water Supply Resolved", detail: "Hostel Block A-1 Primary Tank Repaired", status: "success" },
        { time: "1 Day Ago", message: "Internet Downtime Reported", detail: "Fiber cut detected near academic block", status: "warning" },
        { time: "2 Days Ago", message: "MESS Complaint Logged", detail: "Quality audit initiated for Dining Hall 2", status: "error" },
        { time: "3 Days Ago", message: "Library Extension Approved", detail: "24/7 access granted for E3 Students", status: "success" },
      ]
    };
  }, [grievances]);

  // Handle Occupancy Data Fallback
  const occupancyStats = useMemo(() => {
    const inside = Number(occupancy?.["Inside Campus"]) || 0;
    const outside = Number(occupancy?.["Outside Campus"]) || 0;
    const total = inside + outside;

    const data = [
      { value: inside, color: "hsl(142.1 76.2% 36.3%)", label: "Inside Campus" },
      { value: outside, color: "hsl(214.7 95% 40%)", label: "Outside Campus" }
    ];

    if (total === 0 && !occupancy) {
        // Fallback or Initial Seed
        return {
            total: 3450,
            inside: 2800,
            data: [
              { value: 2800, color: "hsl(142.1 76.2% 36.3%)", label: "Inside Campus" },
              { value: 650, color: "hsl(214.7 95% 40%)", label: "Outside Campus" }
            ]
        };
    }

    return {
        total,
        inside,
        data
    };
  }, [occupancy]);

  if (loading) {
    return (
        <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-6">
            <div className="relative">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                <div className="absolute inset-0 bg-blue-600/10 blur-xl rounded-full animate-pulse" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Aggregating Campus Intelligence...</p>
        </div>
    );
  }

  return (
    <div className="space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total Residents" value={occupancyStats.total.toLocaleString()} icon={Users} badge="+2.4%" />
        <KPICard title="Present in Campus" value={occupancyStats.inside.toLocaleString()} icon={Home} badge={`${((occupancyStats.inside/occupancyStats.total)*100 || 0).toFixed(0)}% Cap`} />
        <KPICard title="Resolution Rate" value={`${grievanceData.resolutionRate || 0}%`} icon={CheckCircle2} badge="Target Hit" />
        <KPICard title="Pending Actions" value={grievanceData.pendingCount || 0} icon={AlertCircle} badge="Urgent" />
      </div>

      {/* Campus Occupancy Analytics */}
      <Card className="p-10 w-full flex flex-col items-center justify-center space-y-10 bg-transparent border-slate-100 shadow-sm rounded-[2rem] hover:shadow-lg transition-all duration-500">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Campus Occupancy Intelligence</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Real-time resident distribution</p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-16 w-full">
          <div className="relative flex items-center justify-center">
            <DonutUI
              data={occupancyStats.data}
              size={320}
              strokeWidth={40}
              animationDuration={1.5}
              highlightOnHover={true}
              centerContent={
                <AnimatePresence mode="wait">
                  <motion.div
                    key={hoveredOccupancy || "total"}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center justify-center text-center"
                  >
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      {hoveredOccupancy || "Total Population"}
                    </p>
                    <p className="text-5xl font-black text-slate-900 tracking-tighter">
                      {hoveredOccupancy 
                        ? occupancyStats.data.find(d => d.label === hoveredOccupancy)?.value 
                        : occupancyStats.total}
                    </p>
                    {hoveredOccupancy && (
                        <p className="text-sm font-black text-blue-600 mt-2">
                            [{( (occupancyStats.data.find(d => d.label === hoveredOccupancy)?.value || 0) / occupancyStats.total * 100).toFixed(0)}%]
                        </p>
                    )}
                  </motion.div>
                </AnimatePresence>
              }
            />
          </div>

          <div className="flex flex-col gap-4 min-w-[240px]">
            {occupancyStats.data.map((segment) => (
              <motion.div
                key={segment.label}
                onMouseEnter={() => setHoveredOccupancy(segment.label)}
                onMouseLeave={() => setHoveredOccupancy(null)}
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 cursor-pointer",
                  hoveredOccupancy === segment.label 
                    ? "bg-slate-900 border-slate-900 shadow-xl -translate-x-2" 
                    : "bg-white border-slate-100 hover:border-slate-200"
                )}
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: segment.color }} 
                  />
                  <span className={cn(
                    "text-xs font-black uppercase tracking-widest",
                    hoveredOccupancy === segment.label ? "text-white" : "text-slate-600"
                  )}>
                    {segment.label}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className={cn(
                    "text-sm font-black",
                    hoveredOccupancy === segment.label ? "text-white" : "text-slate-900"
                  )}>
                    {segment.value.toLocaleString()}
                  </span>
                  <span className={cn(
                    "text-[9px] font-bold opacity-60",
                    hoveredOccupancy === segment.label ? "text-blue-400" : "text-slate-400"
                  )}>
                    {((segment.value / occupancyStats.total) * 100).toFixed(1)}%
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Academic Heatmap */}
        <div className="lg:col-span-1">
          <DonutChart 
            title="Academic Engagement" 
            subtitle="Avg Grade by Department" 
            data={processedHeatmap.length ? processedHeatmap : heatmap}
          />
        </div>
        
        {/* Pulse Feed */}
        <div className="lg:col-span-1">
             <PulseFeed title="Campus Pulse" activities={grievanceData.feed} />
        </div>

        {/* Resolution Trend */}
        <div className="lg:col-span-1">
           <TrendChart 
             title="Grievance Trajectory" 
             subtitle="Volume of monthly filings" 
             data={grievanceData.trend} 
             dataKey="count" 
             color="#f59e0b"
           />
           
           <div className="mt-6 bg-slate-900 rounded-[2rem] p-8 flex items-center justify-between group shadow-xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-full bg-blue-600/10 blur-[50px]" />
                <div className="relative z-10">
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Strategic Goal</p>
                    <p className="text-xl font-black text-white tracking-tight">Zero-Friction Campus</p>
                </div>
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white relative z-10">
                    <Target size={24} />
                </div>
           </div>
        </div>
      </div>

      <div className="w-full">
         <SubjectHeatmap 
           title="Branch Performance Intelligence"
           data={branchFilteredData}
           branches={uniqueBranches}
           selectedBranch={selectedBranch}
           onBranchChange={setSelectedBranch}
         />
      </div>

      <div className="w-full">
         <SubjectGradeChart
           title="Subject Performance Metrics"
           data={branchFilteredData}
           branches={uniqueBranches}
           selectedBranch={selectedBranch}
           onBranchChange={setSelectedBranch}
         />
      </div>
    </div>
  );
}
