import { useState, useRef, useEffect } from "react";
import { Pause, Play, ChevronRight, Megaphone } from "lucide-react";
import { cn } from "../utils/cn";

// Types
type Announcement = {
  id: string;
  date: string;
  title: string;
  link: string;
};

type NotificationItem = {
  id: string;
  title: string;
  dateRange: string;
  type: "tender" | "career";
  color: string;
  link: string;
};

const CAREERS: NotificationItem[] = [
  {
    id: "1",
    title: "Recruitment of Assistant Professors (Contract) - CSE & ECE Depts",
    dateRange: "Apply by 15-11-2025",
    type: "career",
    color: "border-l-red-500",
    link: "#",
  },
  {
    id: "2",
    title:
      "Walk-in Interview for Residential Medical Officer @ Campus Hospital",
    dateRange: "20-11-2025",
    type: "career",
    color: "border-l-blue-500",
    link: "#",
  },
  {
    id: "3",
    title: "JRF Position available in Dept of Physics (SERB Project)",
    dateRange: "Apply by 30-11-2025",
    type: "career",
    color: "border-l-yellow-500",
    link: "#",
  },
];

const Scroller = ({
  children,
  height = "h-[300px]",
  isPaused,
}: {
  children: React.ReactNode;
  height?: string;
  isPaused: boolean;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationFrameId: number;
    let lastTimestamp = 0;
    const speed = 0.5; // Pixels per frame

    const step = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;

      if (!isPaused) {
        // Determine the "single set" height (approx half of total scrollHeight)
        // We use scrollHeight / 2 assuming perfect duplication
        const contentHeight = scrollContainer.scrollHeight / 2;

        if (scrollContainer.scrollTop >= contentHeight) {
          // Seamlessly reset to top (minus the small overshoot)
          scrollContainer.scrollTop = scrollContainer.scrollTop - contentHeight;
        } else {
          scrollContainer.scrollTop += speed;
        }
      }
      animationFrameId = requestAnimationFrame(step);
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused]);

  return (
    <div
      ref={scrollRef}
      className={cn("overflow-y-auto pr-2 scrollbar-hide", height)}
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      <div className="space-y-4">
        {/* Original Content */}
        <div className="space-y-4">{children}</div>
        {/* Duplicated Content for Loop */}
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
};

export function NotificationPanel() {
  const [isAnnouncePaused, setAnnouncePaused] = useState(false);
  const [isNotifyPaused, setNotifyPaused] = useState(false);
  const [activeTab, setActiveTab] = useState<"tenders" | "careers">("tenders");

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [tenders, setTenders] = useState<NotificationItem[]>([]);

  const toggleAnnouncePause = () => setAnnouncePaused(!isAnnouncePaused);
  const toggleNotifyPause = () => setNotifyPaused(!isNotifyPaused);

  useEffect(() => {
    const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

    const myHeaders = new Headers();
    myHeaders.append("x-cms-api-key", "uniz-landing-v1-key");

    fetch(`${BASE}/cms/notifications`, {
      method: "GET",
      headers: myHeaders,
      redirect: "follow" as RequestRedirect,
    })
      .then(async (response) => {
        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          // Gateway returned HTML/text (404 or not running locally) — ignore silently
          return;
        }
        const result = await response.json();
        if (result.success && result.notifications) {
          // Process Updates (Announcements)
          const updates = result.notifications.updates.map((item: any) => {
            const dateObj = new Date(item.createdAt);
            const day = String(dateObj.getDate()).padStart(2, "0");
            const month = String(dateObj.getMonth() + 1).padStart(2, "0");
            const year = dateObj.getFullYear();
            return {
              id: item.id,
              date: `${day}-${month}-${year}`,
              title: item.title,
              link: item.link,
            };
          });
          setAnnouncements(updates);

          // Process Tenders
          const tendersData = result.notifications.tenders.map(
            (item: any, index: number) => {
              const created = new Date(item.createdAt);
              const deadline = new Date(item.deadline);

              const formatDate = (d: Date) =>
                `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;

              const colors = [
                "border-l-red-500",
                "border-l-purple-500",
                "border-l-yellow-500",
                "border-l-blue-500",
                "border-l-green-500",
              ];

              return {
                id: item.id,
                title: item.title,
                dateRange: `${formatDate(created)} to ${formatDate(deadline)}`,
                type: "tender",
                color: colors[index % colors.length],
                link: item.pdfUrl || "#",
              };
            },
          );
          setTenders(tendersData);
        }
      })
      .catch(() => {
        // Silently ignore — panel shows empty state (careers fallback is still shown)
      });
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-7xl mx-auto">
      {/* Announcements Panel */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-100 lg:col-span-2 overflow-hidden flex flex-col h-[500px]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
              Announcements
            </h3>
            <Megaphone className="w-5 h-5 text-pink-500 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAnnouncePause}
              className="p-1.5 rounded hover:bg-slate-200 text-slate-500 transition-colors"
            >
              {isAnnouncePaused ? <Play size={16} /> : <Pause size={16} />}
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          className="p-6 flex-1 overflow-hidden relative"
          onMouseEnter={() => setAnnouncePaused(true)}
          onMouseLeave={() => setAnnouncePaused(false)}
        >
          <Scroller height="h-full" isPaused={isAnnouncePaused}>
            {announcements.map((item) => (
              <div
                key={item.id}
                onClick={() => window.open(item.link, "_blank")}
                className="flex gap-6 group cursor-pointer p-4 rounded-lg hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
              >
                <div className="flex flex-col items-center justify-center min-w-[80px] h-[80px] bg-[#800000]/5 text-[#800000] rounded-lg border border-[#800000]/10">
                  <span className="text-lg font-black leading-none">
                    {item.date.split("-")[0]}
                  </span>
                  <span className="text-[10px] font-bold uppercase">
                    {new Date(
                      item.date.split("-").reverse().join("-"),
                    ).toLocaleString("default", { month: "short" })}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {item.date.split("-")[2]}
                  </span>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <h4 className="font-bold text-slate-800 group-hover:text-[#800000] transition-colors line-clamp-2 leading-tight mb-2">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-wider">
                    <span>Read More</span>
                    <ChevronRight
                      size={12}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </div>
                </div>
              </div>
            ))}
            {/* Duplicate for seamless infinite scroll effect manually if needed, 
                             but the JS scroller handles loop by resetting scrollTop. 
                             Adding some extra padding/items might help visually */}
          </Scroller>
        </div>
      </div>

      {/* Notifications Panel */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-100 col-span-1 overflow-hidden flex flex-col h-[500px]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
            Notifications
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleNotifyPause}
              className="p-1.5 rounded hover:bg-slate-200 text-slate-500 transition-colors"
            >
              {isNotifyPaused ? <Play size={16} /> : <Pause size={16} />}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setActiveTab("tenders")}
            className={cn(
              "flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2",
              activeTab === "tenders"
                ? "border-[#800000] text-[#800000] bg-[#800000]/5"
                : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50",
            )}
          >
            Tenders
          </button>
          <button
            onClick={() => setActiveTab("careers")}
            className={cn(
              "flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2",
              activeTab === "careers"
                ? "border-[#800000] text-[#800000] bg-[#800000]/5"
                : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50",
            )}
          >
            Careers
          </button>
        </div>

        {/* Content */}
        <div
          className="p-4 flex-1 overflow-hidden relative"
          onMouseEnter={() => setNotifyPaused(true)}
          onMouseLeave={() => setNotifyPaused(false)}
        >
          <Scroller height="h-full" isPaused={isNotifyPaused}>
            {(activeTab === "tenders" ? tenders : CAREERS).map((item) => (
              <div
                key={item.id}
                onClick={() => window.open(item.link, "_blank")}
                className={cn(
                  "group cursor-pointer flex justify-between items-center p-3 mb-2 rounded border border-slate-100 hover:shadow-md transition-all bg-white border-l-4",
                  item.color,
                )}
              >
                <div className="flex-1 pr-3">
                  <p className="text-xs font-bold text-slate-700 leading-tight mb-1 group-hover:text-[#800000] transition-colors line-clamp-2">
                    {item.title}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {item.dateRange}
                  </p>
                </div>
                <div className="text-slate-300 group-hover:text-[#800000] transition-colors">
                  <ChevronRight size={16} />
                </div>
              </div>
            ))}
          </Scroller>
        </div>
      </div>
    </div>
  );
}
