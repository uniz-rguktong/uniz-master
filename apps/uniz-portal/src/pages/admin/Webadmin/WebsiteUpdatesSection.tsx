/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  RefreshCw,
  Home,
  BookOpen,
  Info,
  Users,
  Bell,
  Search,
  LayoutGrid,
} from "lucide-react";
import { toast } from "@/utils/toast-ref";
import { Skeleton } from "@/components/ui/Skeleton";
import { LANDING_API_URL } from "../../../api/endpoints";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs } from "@/components/ui/tabs";
import { WebsitePublishBar } from "@/components/admin/WebsitePublishBar";
import {
  adminCardClass,
  adminLabelClass,
  adminGhostButtonClass,
  adminInputClass,
} from "../../../components/admin/admin-ui";
import { cn } from "../../../utils/cn";
import { DeptStaffEditor } from "./DeptStaffEditor";
import { WebsiteLiveEditor } from "./WebsiteLiveEditor";
import { uploadImage } from "../../../api/uploadImage";

const PAGE_LABELS: Record<string, string> = {
  aboutrgukt: "About RGUKT",
  campuslife: "Campus Life",
  edusys: "Education System",
  govcouncil: "Governing Council",
  rtiinfo: "RTI Information",
  scst: "SC/ST Cell",
  AcademicPrograms: "Academic Programs",
  AcademicCalender: "Academic Calendar",
  AcademicRegulations: "Academic Regulations",
  curicula: "Curricula",
  careers: "Careers",
  newsupdates: "News Updates",
  tenders: "Tenders",
};

const formatPageLabel = (page: string) =>
  PAGE_LABELS[page] ||
  page.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ");

const SECTIONS = [
  {
    id: "home",
    label: "Home",
    description: "Hero, highlights, and primary landing metrics.",
    icon: Home,
    endpoint: "/api/home/",
    pages: null,
  },
  {
    id: "institute",
    label: "Institute",
    description: "Campus life, governance, and university history.",
    icon: Info,
    endpoint: "/api/institute/",
    pages: [
      "aboutrgukt",
      "campuslife",
      "edusys",
      "govcouncil",
      "rtiinfo",
      "scst",
    ],
  },
  {
    id: "academics",
    label: "Academics",
    description: "Regulations, calendars, curricula, and programs.",
    icon: BookOpen,
    endpoint: "/api/academics/",
    pages: [
      "AcademicPrograms",
      "AcademicCalender",
      "AcademicRegulations",
      "curicula",
    ],
  },
  {
    id: "departments",
    label: "Dept Staff",
    description: "Faculty directories across all branches.",
    icon: Users,
    endpoint: "/api/departments/",
    pages: [
      "BIOLOGY",
      "CHEMISTRY",
      "CIVIL",
      "CSE",
      "ECE",
      "EEE",
      "ENGLISH",
      "IT",
      "LIB",
      "MANAGEMENT",
      "MATHEMATICS",
      "ME",
      "PED",
      "PHYSICS",
      "TELUGU",
      "YOGA",
    ],
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "News, careers, and official tenders.",
    icon: Bell,
    endpoint: "/api/notifications/",
    pages: ["careers", "newsupdates", "tenders"],
  },
];

const contentVariants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

const getAuthToken = () => {
  const rawToken = localStorage.getItem("admin_token");
  if (!rawToken) return "";
  try {
    return JSON.parse(rawToken);
  } catch {
    return rawToken;
  }
};

export default function WebsiteUpdatesSection() {
  const [activeSectionId, setActiveSectionId] = useState("home");
  const [activePage, setActivePage] = useState<string | null>(null);
  const [pageSearch, setPageSearch] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [contentVersion, setContentVersion] = useState(0);
  const savedSnapshotRef = useRef<string>("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSaveRef = useRef<(silent?: boolean) => Promise<void>>(
    async () => {},
  );

  const activeSection = SECTIONS.find((s) => s.id === activeSectionId)!;
  const isDeptStaff = activeSectionId === "departments";

  const filteredPages = useMemo(() => {
    if (!activeSection.pages) return [];
    const q = pageSearch.trim().toLowerCase();
    if (!q) return activeSection.pages;
    return activeSection.pages.filter(
      (p) =>
        p.toLowerCase().includes(q) ||
        formatPageLabel(p).toLowerCase().includes(q),
    );
  }, [activeSection.pages, pageSearch]);

  useEffect(() => {
    setData(null);
    setPageSearch("");
    setContentVersion((v) => v + 1);
    if (activeSection.pages?.length) {
      setActivePage(activeSection.pages[0]);
    } else {
      setActivePage(null);
    }
  }, [activeSectionId]);

  useEffect(() => {
    setContentVersion((v) => v + 1);
  }, [activePage]);

  const fetchData = useCallback(async () => {
    const isReady =
      (activeSection.pages === null && activePage === null) ||
      (activeSection.pages !== null &&
        activePage !== null &&
        activeSection.pages.includes(activePage));

    if (!isReady) return;

    setLoading(true);
    try {
      const base = activeSection.endpoint;
      let url = `${LANDING_API_URL}${base.endsWith("/") ? base : base + "/"}`;
      if (activeSectionId === "notifications" && activePage) {
        url += `?type=${activePage}`;
      } else if (activePage) {
        url += activePage;
      }
      url += (url.includes("?") ? "&" : "?") + "v=" + Date.now();
      const res = await fetch(url.replace(/([^:]\/)\/+/g, "$1"));
      if (!res.ok) throw new Error("Failed to fetch data");
      const json = await res.json();
      setData(json);
      savedSnapshotRef.current = JSON.stringify(json);
    } catch (err: any) {
      toast.error(err.message || "Connection refused");
      setData(null);
      savedSnapshotRef.current = "";
    } finally {
      setLoading(false);
    }
  }, [activeSection, activeSectionId, activePage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isDirty = !!data && JSON.stringify(data) !== savedSnapshotRef.current;

  const handleCloudinaryUpload = async (file: File): Promise<string | null> => {
    try {
      return await uploadImage(file, "website");
    } catch {
      toast.error("Image upload failed");
      return null;
    }
  };

  const handleSave = useCallback(
    async (silent = false) => {
      if (!data || saving) return;
      setSaving(true);
      try {
        const token = getAuthToken();
        const base = activeSection.endpoint;
        let url = `${LANDING_API_URL}${base.endsWith("/") ? base : base + "/"}`;
        if (activeSectionId === "notifications" && activePage) {
          url += `?type=${activePage}`;
        } else if (activePage) {
          url += activePage;
        }
        url += (url.includes("?") ? "&" : "?") + "v=" + Date.now();

        const res = await fetch(url.replace(/([^:]\/)\/+/g, "$1"), {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });

        if (!res.ok) throw new Error("Save failed");
        const saved = await res.json().catch(() => data);
        setData(saved);
        savedSnapshotRef.current = JSON.stringify(saved);
        if (!silent) toast.success("Published to live website");
      } catch (err: any) {
        toast.error(err.message || "Server error occurred");
      } finally {
        setSaving(false);
      }
    },
    [activePage, activeSection.endpoint, activeSectionId, data, saving],
  );

  handleSaveRef.current = handleSave;

  useEffect(() => {
    if (!isDirty || loading || saving || !data) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void handleSaveRef.current(true);
    }, 1000);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [data, isDirty, loading, saving]);

  const updateNestedData = (path: string[], value: any) => {
    setData((prev: any) => {
      if (!prev) return prev;
      const root = Array.isArray(prev) ? [...prev] : { ...prev };
      let current = root;
      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        current[key] = Array.isArray(current[key])
          ? [...current[key]]
          : { ...current[key] };
        current = current[key];
      }
      current[path[path.length - 1]] = value;
      return root;
    });
  };

  const deleteArrayItem = (path: string[], index: number) => {
    setData((prev: any) => {
      if (!prev) return prev;
      const newData = JSON.parse(JSON.stringify(prev));
      let current: any = newData;
      for (let i = 0; i < path.length; i++) {
        if (current == null) return prev;
        current = current[path[i]];
      }
      if (!Array.isArray(current)) return prev;
      current.splice(index, 1);
      return newData;
    });
  };

  const addArrayItem = (path: string[], template: any) => {
    setData((prev: any) => {
      if (!prev) return prev;
      const newData = JSON.parse(JSON.stringify(prev));
      let current: any = newData;
      for (let i = 0; i < path.length; i++) {
        if (current == null) return prev;
        current = current[path[i]];
      }
      if (!Array.isArray(current)) return prev;
      current.push(JSON.parse(JSON.stringify(template)));
      return newData;
    });
  };

  const breadcrumb = activePage
    ? `${activeSection.label} / ${formatPageLabel(activePage)}`
    : activeSection.label;

  const pageLabel = activePage
    ? formatPageLabel(activePage)
    : activeSection.label;

  const publishSubtitle = saving
    ? "Saving to the live site…"
    : isDirty
      ? "Unsaved changes — publishing automatically…"
      : activePage
        ? `${activeSection.label} · ${pageLabel} is up to date`
        : `${activeSection.label} is up to date`;

  const SkeletonLoader = () => (
    <div className="space-y-5">
      {[1, 2, 3].map((i) => (
        <div key={i} className={cn(adminCardClass, "p-6 space-y-3")}>
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-surface overflow-hidden">
      <div className="px-6 md:px-8 pt-6 pb-4 shrink-0">
        <PageHeader
          title="Website content"
          meta="Edit the live RGUKT landing site — changes publish automatically."
        />
        <Tabs
          label="Website sections"
          value={activeSectionId}
          onChange={setActiveSectionId}
          tabs={SECTIONS.map((section) => ({ id: section.id, label: section.label }))}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col border-t border-border min-[821px]:flex-row">
        {activeSection.pages && sidebarOpen && (
        <aside
          className="flex w-full shrink-0 flex-col border-border bg-surface min-[821px]:w-[280px] min-[821px]:border-r"
        >
          {activeSection.pages && (
            <div className="border-t border-border p-4 space-y-3 max-h-[45%] flex flex-col">
              <p className={cn(adminLabelClass, "px-1")}>
                {activeSectionId === "departments" ? "Department" : "Page"}
              </p>
              {activeSection.pages.length > 6 && (
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3"
                  />
                  <input
                    type="text"
                    value={pageSearch}
                    onChange={(e) => setPageSearch(e.target.value)}
                    placeholder="Filter…"
                    className={cn(adminInputClass, "pl-9 h-9 text-[12px]")}
                  />
                </div>
              )}
              <div className="flex-1 overflow-y-auto custom-sidebar-scroll space-y-1 pr-0.5">
                {filteredPages.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setActivePage(page)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-[12px] font-medium transition-[color,background-color,border-color,opacity,transform,box-shadow] duration-150",
                      activePage === page
                        ? "bg-surface-2 text-text"
                        : "text-text-2 hover:bg-surface-2 hover:text-text",
                    )}
                  >
                    {formatPageLabel(page)}
                  </button>
                ))}
                {filteredPages.length === 0 && (
                  <p className="text-caption text-text-3 px-2 py-4 text-center">
                    No matches
                  </p>
                )}
              </div>
            </div>
          )}
        </aside>
        )}

        <main className="flex min-w-0 flex-1 flex-col bg-surface">
          <header className="sticky top-0 z-20 flex shrink-0 flex-col gap-3 border-b border-border bg-bg px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setSidebarOpen((o) => !o)}
                className={cn(
                  adminGhostButtonClass,
                  "w-9 px-0 shrink-0 lg:hidden",
                )}
                title="Toggle sidebar"
              >
                <LayoutGrid size={16} />
              </button>
              <div className="min-w-0">
                <p className="truncate text-dense font-medium text-text">
                  {breadcrumb}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={fetchData}
              className={cn(adminGhostButtonClass, "w-10 px-0")}
              title="Refresh"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto custom-sidebar-scroll">
            <div className={cn("mx-auto px-5 py-8", "max-w-5xl")}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeSectionId}-${activePage ?? "root"}-${contentVersion}`}
                  variants={contentVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {loading ? (
                    <SkeletonLoader />
                  ) : !data ? (
                    <EmptyState
                      tone="error"
                      icon={AlertTriangle}
                      title="Could not load content"
                      body={`Ensure the gateway and landing CMS are running. API: ${LANDING_API_URL}`}
                      action={
                        <Button type="button" variant="outline" onClick={fetchData}>
                          <RefreshCw size={14} /> Retry
                        </Button>
                      }
                    />
                  ) : isDeptStaff && activePage ? (
                    <DeptStaffEditor
                      data={data}
                      deptCode={activePage}
                      onChange={setData}
                      onRefresh={fetchData}
                      onUpload={handleCloudinaryUpload}
                    />
                  ) : (
                    <WebsiteLiveEditor
                      sectionId={activeSectionId}
                      sectionLabel={activeSection.label}
                      pageKey={activePage}
                      pageLabel={pageLabel}
                      sectionDescription={activeSection.description}
                      data={data}
                      loading={loading}
                      onRefresh={fetchData}
                      updateNestedData={updateNestedData}
                      addArrayItem={addArrayItem}
                      deleteArrayItem={deleteArrayItem}
                      onUpload={handleCloudinaryUpload}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>

      <WebsitePublishBar
        visible={(isDirty || saving) && !loading}
        saving={saving}
        autoSave
        subtitle={publishSubtitle}
        onDiscard={fetchData}
        onPublish={() => handleSave(false)}
      />
    </div>
  );
}
