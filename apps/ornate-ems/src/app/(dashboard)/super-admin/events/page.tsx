import { Suspense } from "react";
import {
  Search,
  Grid3x3,
  List,
  Calendar as CalendarIcon,
  Archive,
  FileText,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import EventsPageClient from "./EventsPageClient";
import { getEvents } from "@/actions/eventGetters";
import { getSports } from "@/actions/sportGetters";
import { formatTimeTo12h } from "@/lib/dateUtils";

function LoadingSkeleton() {
  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col gap-4 mb-8 text-left">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
        <div className="bg-white rounded-[14px] p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-[42px]" />
            <Skeleton className="h-[42px]" />
            <Skeleton className="h-[42px]" />
            <Skeleton className="h-[42px]" />
          </div>
        </div>
        <div className="bg-white rounded-[14px] p-6">
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    </div>
  );
}

export default async function AllEventsPage() {
  const [eventsResult, sportsResult] = await Promise.all([
    getEvents(),
    getSports(),
  ]);

  const rawEvents = eventsResult.success ? (eventsResult.data ?? []) : [];
  const rawSports = sportsResult.success ? (sportsResult.sports ?? []) : [];

  // Filter out Indoor/Outdoor events from the Event table (sports now come from the Sport model)
  const filteredEvents = rawEvents.filter((e) => {
    const cat = (e.category || "").toLowerCase();
    const title = (e.title || "").toLowerCase();
    return (
      !cat.includes("indoor") &&
      !cat.includes("outdoor") &&
      !title.includes("indoor") &&
      !title.includes("outdoor")
    );
  });

  // Map database Event fields to the structure expected by EventsPageClient
  const events = filteredEvents.map((e) => ({
    id: e.id,
    name: e.title,
    organizer: e.organizer,
    creatorRole: e.creatorRole || null,
    category: e.category || "General",
    dateTime: e.date
      ? new Date(e.date).toLocaleString([], {
          dateStyle: "medium",
          timeStyle: "short",
          hour12: true,
        })
      : "TBD",
    venue: e.venue || "TBD",
    time: formatTimeTo12h(e.time),
    startTime: formatTimeTo12h(e.startTime),
    endTime: formatTimeTo12h(e.endTime),
    registrations: e.registrationsCount,
    status: (e.status || "DRAFT").toString().toUpperCase(),
    lastModified: e.updatedAt
      ? new Date(e.updatedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "—",
    rawDate: e.date,
    source: "event" as const,
  }));

  // Map Sport model to the same shape
  const sportEvents = rawSports.map((s) => ({
    id: s.id,
    name: s.name,
    organizer: "Sports Department",
    creatorRole: "SPORTS_ADMIN",
    category: "Sports",
    date:
      s.date && s.date !== "TBD"
        ? new Date(s.date).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
        : formatTimeTo12h(s.date),
    venue: s.venue || "TBD",
    registrations: s.registrations ?? 0,
    status: s.status?.toUpperCase() || "UPCOMING",
    lastModified: "—",
    rawDate: s.date && s.date !== "TBD" ? s.date : new Date().toISOString(),
    source: "sport" as const,
  }));

  const allEvents = [...events, ...sportEvents];

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <EventsPageClient initialEvents={allEvents} />
    </Suspense>
  );
}
