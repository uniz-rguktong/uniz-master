
import { useState, useEffect, useMemo } from "react";
import { Users, Shield, UserCheck, UserX } from "lucide-react";
import { ANALYTICS_SYSTEM_USERS, ANALYTICS_KEY } from "../../../api/endpoints";
import { KPICard } from "../AnalyticsUI";
import { DonutChart } from "../../../components/ui/donut-chart";
import { Card } from "../../../components/ui/card";
import UploadHealthAnalytics from "./UploadHealthAnalytics";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../../utils/cn";

export default function SystemUserAnalytics() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("admin_token") || localStorage.getItem("faculty_token") || localStorage.getItem("student_token");
        const res = await fetch(ANALYTICS_SYSTEM_USERS, {
          headers: {
            "x-api-key": ANALYTICS_KEY,
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });
        const json = await res.json();
        if (json?.success && Array.isArray(json?.data)) {
          setData(json.data);
        } else if (Array.isArray(json)) {
          setData(json);
        }
      } catch (err) {
        console.error("System users analytics failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const roleData = useMemo(() => {
    const colors: Record<string, string> = {
      STUDENT: "#3b82f6",
      DEAN: "hsl(142.1 76.2% 36.3%)",
      HOD: "hsl(47.9 95.8% 53.1%)",
      WEBMASTER: "hsl(262.1 83.3% 57.8%)",
      ADMIN: "hsl(262.1 83.3% 57.8%)",
      STAFF: "hsl(262.1 83.3% 57.8%)"
    };

    // Group by role name and aggregate values
    const grouped = data.reduce((acc: Record<string, any>, curr) => {
      const role = (curr.role || "unknown").toUpperCase();
      if (!acc[role]) {
        acc[role] = { label: role, value: 0, color: colors[role] || "hsl(0 0% 63.9%)" };
      }
      acc[role].value += (Number(curr.Active) || 0) + (Number(curr.Disabled) || 0);
      return acc;
    }, {});

    return Object.values(grouped).sort((a: any, b: any) => b.value - a.value);
  }, [data]);

  const totalUsersCount = useMemo(() => roleData.reduce((sum, d) => sum + d.value, 0), [roleData]);
  const activeSegment = useMemo(() => roleData.find(s => s.label === hoveredSegment), [roleData, hoveredSegment]);

  if (loading) return null;

  const totalActive = data.reduce((acc, curr) => acc + (Number(curr.Active) || 0), 0);
  const totalDisabled = data.reduce((acc, curr) => acc + (Number(curr.Disabled) || 0), 0);
  const totalUsers = totalActive + totalDisabled;

  const staffTotal = data
    .filter(item => ["webmaster", "dean", "hod", "admin", "staff"].includes(item.role?.toLowerCase()))
    .reduce((acc, curr) => acc + (Number(curr.Active) || 0) + (Number(curr.Disabled) || 0), 0);

  const displayValue = activeSegment?.value ?? totalUsersCount;
  const displayLabel = activeSegment?.label ?? "Total Identities";
  const displayPercentage = activeSegment ? (activeSegment.value / totalUsersCount) * 100 : 100;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Identities"
          value={totalUsers.toLocaleString()}
          icon={Users}
          badge="Audited"
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <KPICard
          title="Active Sessions"
          value={totalActive.toLocaleString()}
          icon={UserCheck}
          badge="Live"
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <KPICard
          title="Restricted Access"
          value={totalDisabled.toLocaleString()}
          icon={UserX}
          badge="Flagged"
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
        />
        <KPICard
          title="Administrative Staff"
          value={staffTotal.toLocaleString()}
          icon={Shield}
          badge="Secured"
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* New Interactive Donut Chart */}
        <div className="lg:col-span-4 flex">
          <Card className="p-10 w-full flex flex-col items-center justify-center space-y-8 bg-white border-slate-100 shadow-sm rounded-xl hover:shadow-lg transition-shadow duration-500">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                User Demographics
              </h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Distribution by Role
              </p>
            </div>

            <div className="relative flex items-center justify-center">
              <DonutChart
                data={roleData}
                size={220}
                strokeWidth={25}
                animationDuration={1.2}
                animationDelayPerSegment={0.05}
                highlightOnHover={true}
                onSegmentHover={(s) => setHoveredSegment(s ? s.label : null)}
                centerContent={
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={displayLabel}
                      initial={{ opacity: 0, scale: 0.9, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -5 }}
                      transition={{ duration: 0.2, ease: "circOut" }}
                      className="flex flex-col items-center justify-center text-center"
                    >
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-0.5 max-w-[120px] truncate">
                        {displayLabel}
                      </p>
                      <p className="text-3xl font-black text-slate-900 leading-none tracking-tighter">
                        {displayValue.toLocaleString()}
                      </p>
                      {activeSegment && (
                        <p className="text-xs font-black text-blue-600 mt-1">
                          {displayPercentage.toFixed(1)}%
                        </p>
                      )}
                    </motion.div>
                  </AnimatePresence>
                }
              />
            </div>

            <div className="flex flex-col space-y-2.5 w-full pt-6 border-t border-slate-50">
              {roleData.map((segment, index) => (
                <motion.div
                  key={segment.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-xl transition-all duration-300 group cursor-pointer",
                    hoveredSegment === segment.label ? "bg-slate-50 translate-x-1" : "hover:bg-slate-50/50"
                  )}
                  onMouseEnter={() => setHoveredSegment(segment.label)}
                  onMouseLeave={() => setHoveredSegment(null)}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="h-2.5 w-2.5 rounded-full shadow-sm group-hover:scale-125 transition-transform"
                      style={{ backgroundColor: segment.color }}
                    />
                    <span className="text-xs font-black text-slate-600 uppercase tracking-wide">
                      {segment.label}
                    </span>
                  </div>
                  <span className="text-xs font-black text-slate-900">
                    {segment.value.toLocaleString()}
                  </span>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>

        {/* Reliability Graph */}
        <div className="lg:col-span-8 flex">
          <UploadHealthAnalytics hideHeader={true} />
        </div>
      </div>
    </div>
  );
}
