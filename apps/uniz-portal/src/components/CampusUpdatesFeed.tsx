import { type CSSProperties } from "react";
import { Megaphone, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type CampusUpdate,
  getTimeAgo,
  useCampusUpdates,
} from "@/hooks/useCampusUpdates";
import { CAMPUS_UPDATES_FALLBACK } from "@/constants/campusUpdates";
import { LandingSection, LandingSectionHeader } from "@/components/ui/landing-section";

function updateBody(update: CampusUpdate) {
  return update.content || update.description || "";
}

function updateLabel(update: CampusUpdate) {
  const body = updateBody(update);
  if (update.title && body) return `${update.title} — ${body}`;
  return update.title || body || "Campus update";
}

type TickerTheme = "portal" | "landing";

const TICKER_THEMES: Record<
  TickerTheme,
  {
    shell: string;
    liveWrap: string;
    liveLabel: string;
    fadeFrom: string;
    text: string;
    textHover: string;
    icon: string;
    time: string;
    count: string;
    skeleton: string;
    marqueeClass: string;
  }
> = {
  portal: {
    shell:
      "rounded-portal-xl border border-navy-200 bg-white shadow-whisper",
    liveWrap: "border-navy-200 bg-navy-50 text-navy-900",
    liveLabel: "text-navy-900",
    fadeFrom: "from-white",
    text: "text-navy-800",
    textHover: "hover:text-navy-900",
    icon: "text-navy-500",
    time: "text-navy-400",
    count: "border-navy-200 bg-navy-50 text-navy-600",
    skeleton: "border-navy-200 bg-navy-50/60",
    marqueeClass: "portal-updates-marquee",
  },
  landing: {
    shell:
      "rounded-portal-2xl border border-zinc-200/90 bg-white shadow-whisper-landing",
    liveWrap: "border-zinc-200 bg-zinc-50 text-zinc-900",
    liveLabel: "text-zinc-800",
    fadeFrom: "from-white",
    text: "text-zinc-800",
    textHover: "hover:text-zinc-950",
    icon: "text-zinc-500",
    time: "text-zinc-400",
    count: "border-zinc-200 bg-zinc-50 text-zinc-600",
    skeleton: "border-zinc-200 bg-zinc-50/80",
    marqueeClass: "landing-updates-marquee",
  },
};

function UpdatesTicker({
  items,
  loading,
  theme,
}: {
  items: CampusUpdate[];
  loading: boolean;
  theme: TickerTheme;
}) {
  const t = TICKER_THEMES[theme];

  if (loading) {
    return (
      <div
        className={cn("h-11 md:h-12 animate-pulse border", t.skeleton, t.shell)}
      />
    );
  }

  if (items.length === 0) return null;

  const single = items.length === 1;
  const label = updateLabel(items[0]);
  const duration = Math.min(52, Math.max(24, label.length * 0.2));

  const segments = items.map((update, idx) => {
    const text = updateLabel(update);
    const inner = (
      <span
        className={cn(
          "inline-flex items-center gap-2 px-6 md:px-8 text-[13px] font-medium whitespace-nowrap",
          t.text,
        )}
      >
        <Megaphone size={13} className={cn("shrink-0", t.icon)} strokeWidth={2.25} />
        <span>{text}</span>
        {update.link && (
          <ExternalLink size={12} className={cn("shrink-0", t.time)} />
        )}
        <span className={cn("font-normal tabular-nums text-[11px]", t.time)}>
          {getTimeAgo(update.createdAt)}
        </span>
      </span>
    );

    if (update.link) {
      return (
        <a
          key={update._id || update.id || idx}
          href={update.link}
          target="_blank"
          rel="noopener noreferrer"
          className={cn("no-underline transition-colors", t.textHover)}
        >
          {inner}
        </a>
      );
    }

    return <span key={update._id || update.id || idx}>{inner}</span>;
  });

  const useMarquee = !single || label.length >= 56 || items.length > 1;

  return (
    <div
      className={cn(
        "group relative flex min-h-11 md:min-h-12 items-stretch overflow-hidden",
        t.shell,
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center gap-2 border-r px-3 sm:px-4",
          t.liveWrap,
        )}
      >
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-50",
              theme === "portal" ? "bg-navy-500" : "bg-zinc-500",
            )}
          />
          <span
            className={cn(
              "relative inline-flex h-2 w-2 rounded-full",
              theme === "portal" ? "bg-navy-900" : "bg-zinc-900",
            )}
          />
        </span>
        <span
          className={cn(
            "hidden text-[9px] font-bold uppercase tracking-[0.14em] sm:inline",
            t.liveLabel,
          )}
        >
          Live
        </span>
      </div>

      <div className="relative min-w-0 flex-1 overflow-hidden">
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r to-transparent",
            t.fadeFrom,
          )}
          aria-hidden
        />
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l to-transparent",
            t.fadeFrom,
          )}
          aria-hidden
        />

        {!useMarquee ? (
          <div className="flex h-full min-h-11 md:min-h-12 items-center px-3 sm:px-4">
            {items[0].link ? (
              <a
                href={items[0].link}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-2 no-underline transition-colors",
                  t.text,
                  t.textHover,
                )}
              >
                <p className="min-w-0 flex-1 truncate text-[13px] font-medium">
                  {label}
                </p>
                <ExternalLink size={13} className={cn("shrink-0", t.time)} />
              </a>
            ) : (
              <p className={cn("min-w-0 flex-1 truncate text-[13px] font-medium", t.text)}>
                {label}
              </p>
            )}
            <span className={cn("ml-2 shrink-0 text-[10px] font-semibold tabular-nums", t.time)}>
              {getTimeAgo(items[0].createdAt)}
            </span>
          </div>
        ) : (
          <div
            className="flex h-full min-h-11 md:min-h-12 items-center motion-reduce:animate-none"
            style={{ "--marquee-duration": `${duration}s` } as CSSProperties}
          >
            <div className={cn(t.marqueeClass, "flex w-max items-center py-2.5 md:py-3")}>
              {segments}
              {segments}
            </div>
          </div>
        )}
      </div>

      {items.length > 1 && (
        <div
          className={cn(
            "hidden shrink-0 items-center border-l px-3 text-[10px] font-bold tabular-nums sm:flex",
            t.count,
          )}
        >
          {items.length}
        </div>
      )}
    </div>
  );
}

type CampusUpdatesFeedProps = {
  variant?: "landing" | "portal";
  className?: string;
  fallback?: CampusUpdate[];
  maxItems?: number;
};

export default function CampusUpdatesFeed({
  variant = "landing",
  className,
  fallback = CAMPUS_UPDATES_FALLBACK,
  maxItems = 6,
}: CampusUpdatesFeedProps) {
  const { updates, loading, fromApi } = useCampusUpdates(fallback);
  const items = updates.slice(0, maxItems);

  if (!loading && items.length === 0) return null;

  if (variant === "portal") {
    return (
      <section className={cn("mb-5 md:mb-6", className)}>
        <UpdatesTicker items={items} loading={loading} theme="portal" />
      </section>
    );
  }

  return (
    <LandingSection
      id="campus-updates"
      className={cn("!pt-10 !pb-12 md:!pt-16 md:!pb-20", className)}
    >
      <div className="space-y-5 md:space-y-6">
        <LandingSectionHeader
          eyebrow="Live campus updates"
          title="What's happening on campus,"
          titleMuted="right now."
          description="Official announcements from administration — registration, exams, events, and more."
        />

        <UpdatesTicker items={items} loading={loading} theme="landing" />

        {!loading && !fromApi && (
          <p className="text-center text-[12px] font-medium text-zinc-400">
            Showing sample updates — connect CMS or run{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-600">
              npm run seed:local
            </code>{" "}
            for real data.
          </p>
        )}
      </div>
    </LandingSection>
  );
}
