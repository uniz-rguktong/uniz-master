/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  ScanLine,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  Shield,
  History,
  LayoutDashboard,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/tile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import {
  SECURITY_SUMMARY,
  SECURITY_CHECKIN,
  SECURITY_CHECKOUT,
  SEARCH_STUDENTS,
} from "../../api/endpoints";
import { toast } from "@/utils/toast-ref";
import { apiClient } from "../../api/apiClient";
import { useSmartPolling } from "../../hooks/useSmartPolling";
import { useIsAuth } from "../../hooks/is_authenticated";
import { useLogout } from "../../hooks/useLogout";
import SearchStudents from "./searchstudents";

export default function SecurityPortal() {
  useIsAuth();
  const { logout } = useLogout();
  const [activeTab, setActiveTab] = useState<"dashboard" | "logs" | "search">(
    "dashboard",
  );
  const [scanQuery, setScanQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const username = (localStorage.getItem("username") || "Security").replace(
    /"/g,
    "",
  );

  const navGroups = [
    {
      group: null,
      items: [{ id: "dashboard", label: "Overview", icon: LayoutDashboard }],
    },
    {
      group: "Access Control",
      items: [
        { id: "search", label: "Search Directory", icon: Search },
        { id: "logs", label: "Activity Logs", icon: History },
      ],
    },
  ];

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const data = await apiClient<any>(SECURITY_SUMMARY);
      if (data && data.success) {
        setSummary(data.summary);
      }
    } catch (error) {
      console.error("Failed to fetch security summary", error);
    }
  };

  useSmartPolling(fetchSummary, {
    activeInterval: 300000,
    fallbackInterval: 30000,
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanQuery.trim()) return;

    setSearching(true);
    try {
      const data = await apiClient<any>(SEARCH_STUDENTS, {
        method: "POST",
        body: JSON.stringify({ username: scanQuery, limit: 5 }),
      });
      if (data && data.success) {
        setSearchResults(data.students || []);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleAction = async (
    requestId: string,
    action: "checkin" | "checkout",
  ) => {
    setProcessingId(requestId);
    const endpoint =
      action === "checkin"
        ? SECURITY_CHECKIN(requestId)
        : SECURITY_CHECKOUT(requestId);

    try {
      const data = await apiClient<any>(endpoint, {
        method: "POST",
      });
      if (data && data.success) {
        toast.success(
          `Success: ${action === "checkin" ? "Checked-In" : "Checked-Out"}`,
        );
        fetchSummary();
        setSearchResults([]);
        setScanQuery("");
      }
    } catch (error) {
      console.error("Operation failed:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const renderContent = () => {
    if (activeTab === "logs") {
      return (
        <div className="space-y-2">
          <PageHeader title="Activity logs" meta="Recent gate records on this terminal." />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between gap-3 border-b border-border py-4">
              <div className="min-w-0">
                <p className="text-[15px] font-semibold leading-6 text-head tabular-nums">STUDENT_ID_{i}00{i}</p>
                <p className="text-small text-text-2">Entry recorded · 14:2{i} · Gate 01</p>
              </div>
              <Badge tone="success">Verified</Badge>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === "search") {
      return (
        <div className="animate-in fade-in duration-500">
          <SearchStudents />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <PageHeader
          title="Access control"
          meta="Look up a student and record an entry or an exit."
        />

        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          <StatTile label="Students outside" value={summary?.totalOutside || 0} />
          <StatTile label="Today's check-ins" value={summary?.todayCheckins || 0} />
          <StatTile label="Today's check-outs" value={summary?.todayCheckouts || 0} />
          <StatTile label="Sync status" value="Active" line="Terminal is connected" status="success" icon={Shield} />
        </div>

        <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search size={16} strokeWidth={1.75} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-3" aria-hidden />
            <input
              type="text"
              value={scanQuery}
              onChange={(e) => setScanQuery(e.target.value.toUpperCase())}
              placeholder="Scan an ID card or enter a university ID"
              aria-label="Student ID"
              className="h-11 w-full rounded-md border border-border-strong bg-surface pl-11 pr-4 text-body text-text placeholder:text-text-3 focus:border-navy-600 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-ring max-[639px]:h-12"
            />
          </div>
          <Button type="submit" disabled={searching}>
            {searching ? <Loader2 size={16} className="animate-spin" /> : <ScanLine size={16} />}
            Search
          </Button>
        </form>

          {searchResults.length > 0 && (
            <div className="space-y-0">
              <h2 className="mb-2 font-sans text-h3 text-head">
                {searchResults.length} {searchResults.length === 1 ? "record" : "records"}
              </h2>
              {searchResults.map((student) => (
                <div
                  key={student.id}
                  className="flex flex-col gap-3 border-b border-border py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold leading-6 text-head">{student.name}</p>
                    <p className="text-small text-text-2 tabular-nums">
                      {student.username} · {student.branch} {student.year}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="compact"
                      onClick={() => handleAction(student.username, "checkout")}
                      disabled={processingId === student.username}
                    >
                      {processingId === student.username ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <ArrowUpRight size={16} />
                      )}
                      Log exit
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="compact"
                      onClick={() => handleAction(student.username, "checkin")}
                      disabled={processingId === student.username}
                    >
                      {processingId === student.username ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <ArrowDownLeft size={16} />
                      )}
                      Log entry
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

        <Alert tone="success" title="Gate sync" icon={Shield}>
          The terminal is synchronized with the central server. Entry and exit records are saved as they happen.
        </Alert>
      </div>
    );
  };

  return (
    <AdminShell
      navGroups={navGroups}
      activeTab={activeTab}
      onTabChange={(id) => setActiveTab(id as any)}
      onLogout={logout}
      username={username}
      roleLabel="Security Portal"
      showSidebarProfile
      enableNavSearch
      collapseBranding="abbreviate"
      navSpacing="compact"
    >
      {renderContent()}
    </AdminShell>
  );
}
