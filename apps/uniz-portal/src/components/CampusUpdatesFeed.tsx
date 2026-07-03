import { motion } from "framer-motion";
import {
  Megaphone,
  Bell,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type CampusUpdate,
  getTimeAgo,
  useCampusUpdates,
} from "@/hooks/useCampusUpdates";
import {
  LandingCard,
  LandingPill,
  LandingSection,
} from "@/components/ui/landing-section";

const NOTIF_STYLES: {
  bg: string;
  border: string;
  Icon: LucideIcon;
  text: string;
  bubble: string;
}[] = [
  {
    bg: "bg-amber-50",
    border: "border-amber-200",
    Icon: Megaphone,
    text: "text-amber-700",
    bubble: "bg-amber-50 border-amber-100 text-amber-900",
  },
  {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    Icon: CheckCircle2,
    text: "text-emerald-700",
    bubble: "bg-emerald-50 border-emerald-100 text-emerald-900",
  },
  {
    bg: "bg-blue-50",
    border: "border-blue-200",
    Icon: ClipboardList,
    text: "text-blue-700",
    bubble: "bg-blue-50 border-blue-100 text-blue-900",
  },
  {
    bg: "bg-violet-50",
    border: "border-violet-200",
    Icon: GraduationCap,
    text: "text-violet-700",
    bubble: "bg-violet-50 border-violet-100 text-violet-900",
  },
];

function updateBody(update: CampusUpdate) {
  return update.content || update.description || "";
}

type CampusUpdatesFeedProps = {
  variant?: "landing" | "portal";
  className?: string;
  fallback?: CampusUpdate[];
  maxItems?: number;
};

function UpdateRow({
  update,
  idx,
  variant,
}: {
  update: CampusUpdate;
  idx: number;
  variant: "landing" | "portal";
}) {
  const style = NOTIF_STYLES[idx % NOTIF_STYLES.length];
  const body = updateBody(update);
  const Wrapper = update.link ? "a" : "div";
  const linkProps = update.link
    ? {
        href: update.link,
        target: "_blank" as const,
        rel: "noopener noreferrer",
      }
    : {};

  if (variant === "portal") {
    return (
      <Wrapper
        {...linkProps}
        className={cn(
          "flex gap-3.5 p-4 rounded-2xl border transition-all",
          style.bg,
          style.border,
          update.link && "hover:shadow-md hover:-translate-y-0.5 no-underline",
        )}
      >
        <div
          className={cn(
            "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border",
            style.bg,
            style.border,
          )}
        >
          <style.Icon size={18} className={style.text} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-[11px] font-bold tracking-[0.12em] text-zinc-500 uppercase">
              {update.title || "Campus Update"}
            </p>
            <span className="shrink-0 text-[10px] font-semibold text-zinc-400 tabular-nums">
              {getTimeAgo(update.createdAt)}
            </span>
          </div>
          <p className="text-[14px] font-semibold text-zinc-900 leading-snug line-clamp-3">
            {body}
          </p>
          {update.link && (
            <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-zinc-600">
              Open link <ExternalLink size={12} />
            </span>
          )}
        </div>
      </Wrapper>
    );
  }

  const featured = idx === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: idx * 0.06, duration: 0.35 }}
    >
      <Wrapper
        {...linkProps}
        className={cn(
          "block rounded-[1.75rem] border transition-all no-underline",
          featured
            ? "p-5 md:p-6 bg-white border-amber-200/80 shadow-[0_20px_50px_-24px_rgba(245,158,11,0.45)] ring-1 ring-amber-100"
            : "p-4 md:p-5 bg-white/80 border-zinc-100 hover:border-zinc-200 hover:bg-white",
          update.link && "hover:shadow-lg",
        )}
      >
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "shrink-0 flex items-center justify-center rounded-2xl border shadow-sm",
              featured ? "w-14 h-14 bg-zinc-950 border-zinc-900" : "w-11 h-11",
              !featured && style.bg,
              !featured && style.border,
            )}
          >
            <style.Icon
              size={featured ? 22 : 18}
              className={featured ? "text-white" : style.text}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <LandingPill
                label={update.title || "Campus Update"}
                accent={featured ? "amber" : idx % 2 === 0 ? "blue" : "emerald"}
              />
              <span className="text-[11px] font-semibold text-zinc-400 tabular-nums ml-auto">
                {getTimeAgo(update.createdAt)}
              </span>
            </div>
            <p
              className={cn(
                "font-bold text-zinc-900 leading-snug",
                featured
                  ? "text-[16px] md:text-[18px] line-clamp-4"
                  : "text-[14px] line-clamp-2",
              )}
            >
              {body}
            </p>
            {update.link && (
              <span className="inline-flex items-center gap-1.5 mt-3 text-[12px] font-bold text-amber-700">
                Read more <ExternalLink size={13} />
              </span>
            )}
          </div>
        </div>
      </Wrapper>
    </motion.div>
  );
}

export default function CampusUpdatesFeed({
  variant = "landing",
  className,
  fallback = [],
  maxItems = 6,
}: CampusUpdatesFeedProps) {
  const { updates, loading } = useCampusUpdates(fallback);
  const items = updates.slice(0, maxItems);

  if (!loading && items.length === 0) return null;

  if (variant === "portal") {
    return (
      <section className={cn("mb-6", className)}>
        <div className="rounded-[1.75rem] border border-[#D4E8F5] bg-white shadow-[0_20px_50px_-30px_rgba(11,42,71,0.18)] overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 py-4 portal-banner-gradient text-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                <Megaphone size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-[0.16em] text-zinc-400 uppercase">
                  Live
                </p>
                <h2 className="text-[15px] font-bold tracking-tight">
                  Campus Updates
                </h2>
              </div>
            </div>
            {!loading && (
              <span className="px-2.5 py-1 rounded-full bg-white text-[#0B2A47] text-[10px] font-bold tracking-wide">
                {items.length} active
              </span>
            )}
          </div>

          <div className="p-4 space-y-3">
            {loading
              ? Array.from({ length: 2 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-24 rounded-2xl bg-zinc-50 animate-pulse border border-zinc-100"
                  />
                ))
              : items.map((update, idx) => (
                  <UpdateRow
                    key={update._id || update.id || idx}
                    update={update}
                    idx={idx}
                    variant="portal"
                  />
                ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <LandingSection
      id="campus-updates"
      className={cn(
        "!pt-12 !pb-14 md:!pt-20 md:!pb-24 bg-gradient-to-b from-amber-50/70 via-white to-white",
        className,
      )}
    >
      <div className="relative">
        <div className="pointer-events-none absolute -top-8 right-0 w-48 h-48 rounded-full bg-amber-200/30 blur-3xl" />

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8 md:mb-10">
          <div>
            <div className="inline-flex items-center gap-2.5 mb-4 px-3.5 py-2 rounded-full bg-amber-100 border border-amber-200/80 shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-60" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
              </span>
              <span className="text-[11px] font-bold tracking-[0.14em] text-amber-900 uppercase">
                Live Campus Updates
              </span>
            </div>
            <h2 className="text-[clamp(1.85rem,4.5vw,3.25rem)] md:text-[clamp(2.25rem,5vw,3.75rem)] font-semibold text-zinc-950 tracking-[-0.05em] leading-[1.02] max-w-4xl">
              Real-time campus events,
              <span className="text-zinc-400 font-light">
                {" "}
                piped directly to your feed.
              </span>
            </h2>
            <p className="mt-4 text-[15px] md:text-[17px] text-zinc-500 font-medium leading-relaxed max-w-xl">
              Official announcements from administration — registration windows,
              exams, events, and more.
            </p>
          </div>

          {!loading && items.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-zinc-200 shadow-sm shrink-0">
              <Bell size={16} className="text-amber-600" />
              <span className="text-[13px] font-bold text-zinc-800">
                {items.length} update{items.length === 1 ? "" : "s"} live
              </span>
            </div>
          )}
        </div>

        <div className="space-y-3 md:space-y-4">
          {loading
            ? Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="h-28 rounded-[1.75rem] bg-zinc-50 animate-pulse border border-zinc-100"
                />
              ))
            : items.map((update, idx) => (
                <UpdateRow
                  key={update._id || update.id || idx}
                  update={update}
                  idx={idx}
                  variant="landing"
                />
              ))}
        </div>

        {!loading && (
          <LandingCard
            hover={false}
            className="mt-6 p-5 md:p-6 border-amber-100/80 bg-amber-50/40"
          >
            <p className="text-[14px] md:text-[15px] font-semibold text-zinc-800 text-center leading-relaxed">
              Sign in to the student portal to see these updates on your
              dashboard — always in sync with the campus feed.
            </p>
          </LandingCard>
        )}
      </div>
    </LandingSection>
  );
}
