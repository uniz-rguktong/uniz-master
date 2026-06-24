"use client";
import {
  CheckCircle,
  Ticket,
  FileText,
  ShieldAlert,
  Key,
} from "lucide-react";
import { useMemo } from "react";
import { cn } from "../../lib/utils";
import { AnimatedList } from "./animated-list";
import {
  LandingSection,
  LandingSectionHeader,
  LandingPill,
  landingCardClass,
} from "./landing-section";

interface Item {
  name: string;
  description: string;
  icon: any;
  color: string;
  time: string;
}

let notifications = [
  {
    name: "Sem registration started",
    description: "Academics",
    time: "1m ago",
    icon: CheckCircle,
    color: "#10b981",
  },
  {
    name: "Outpass granted successfully",
    description: "Requests",
    time: "5m ago",
    icon: Ticket,
    color: "#f59e0b",
  },
  {
    name: "Sem results uploaded",
    description: "Academics",
    time: "12m ago",
    icon: FileText,
    color: "#3b82f6",
  },
  {
    name: "New Login detected",
    description: "Security",
    time: "18m ago",
    icon: ShieldAlert,
    color: "#ef4444",
  },
  {
    name: "Password changed.",
    description: "Security",
    time: "30m ago",
    icon: Key,
    color: "#64748b",
  },
];

notifications = notifications.slice(0, 5);

const Notification = ({ name, description, icon: Icon, color, time }: Item) => {
  return (
    <figure className="relative mx-auto min-h-fit w-full max-w-[400px] cursor-pointer overflow-hidden rounded-2xl border border-zinc-100/80 bg-white/90 p-4 transition-all duration-300 hover:shadow-[0_12px_28px_-12px_rgba(0,0,0,0.12)] hover:-translate-y-0.5">
      <div className="flex flex-row items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-950 shadow-sm">
          <Icon className="size-4 text-white" />
        </div>
        <div className="flex flex-col overflow-hidden min-w-0">
          <figcaption className="flex flex-row items-center gap-1.5 min-w-0">
            <span className="text-sm font-bold text-zinc-900 truncate">
              {name}
            </span>
            <span className="text-zinc-300 shrink-0">·</span>
            <span className="text-[11px] font-semibold text-zinc-400 shrink-0 tabular-nums">
              {time}
            </span>
          </figcaption>
          <p className="text-xs font-medium text-zinc-500 truncate">
            {description}
          </p>
        </div>
      </div>
    </figure>
  );
};

export function Features() {
  return (
    <LandingSection className="!pt-0">
      <LandingSectionHeader
        eyebrow="System Health"
        title="Real-time insights,"
        titleMuted="complete control."
        description="Keep your finger on the pulse of your university with comprehensive systems monitoring."
      />

      <div
        className={cn(
          "mx-auto grid w-full md:grid-cols-2 shadow-[0_25px_60px_-20px_rgba(0,0,0,0.08)]",
          landingCardClass,
        )}
      >
        <div className="border-b md:border-b-0 md:border-r border-zinc-100/80">
          <div className="p-6 sm:p-10 pb-6">
            <LandingPill label="Live Updates" accent="emerald" className="mb-5" />

            <p className="text-xl md:text-2xl font-black text-zinc-950 tracking-[-0.03em] leading-snug">
              Real-time system events,{" "}
              <span className="text-zinc-400 font-light">
                piped directly to your dashboard.
              </span>
            </p>
          </div>

          <div
            aria-hidden
            className="relative h-[400px] bg-zinc-50/50 overflow-hidden flex flex-col p-2 border-t border-zinc-100/80"
          >
            <AnimatedList className="w-full" delay={2800}>
              {notifications.map((item, idx) => (
                <Notification {...item} key={idx} />
              ))}
            </AnimatedList>
            <div className="from-zinc-50/80 pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t" />
          </div>
        </div>
        <div className="bg-zinc-50/30 p-6 sm:p-10">
          <div className="relative z-10">
            <LandingPill label="Chatbot" accent="blue" className="mb-5" />

            <p className="text-xl md:text-2xl font-black text-zinc-950 tracking-[-0.03em] leading-snug">
              Instant answers{" "}
              <span className="text-zinc-400 font-light">from our AI assistant.</span>
            </p>
          </div>
          <div aria-hidden className="mt-8 flex flex-col gap-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="flex justify-center items-center size-5 rounded-full border border-zinc-200 bg-white shadow-sm">
                  <span className="size-2.5 rounded-full bg-zinc-400" />
                </span>
                <span className="text-zinc-400 font-semibold text-[11px] uppercase tracking-wider">
                  You
                </span>
              </div>
              <div className="rounded-2xl border border-zinc-100 bg-white w-[88%] p-4 text-sm font-medium text-zinc-700 shadow-sm">
                Hey, I'm having trouble with my account login.
              </div>
            </div>

            <div>
              <div className="rounded-2xl border border-zinc-800 ml-auto w-[88%] bg-zinc-950 p-4 text-sm font-medium text-white shadow-[0_16px_40px_-16px_rgba(0,0,0,0.4)] mb-2">
                We've identified the issue and pushed a patch. You should be
                able to log in now.
              </div>
              <span className="text-zinc-400 font-medium block text-right text-[11px]">
                Just now
              </span>
            </div>
          </div>
        </div>
        {/* Temporarily hidden — uptime banner
        <div className="col-span-full border-y border-zinc-100/80 p-10 md:p-12 bg-white flex flex-col items-center justify-center">
          <p className="text-center text-4xl md:text-5xl font-black tracking-[-0.04em] text-zinc-950 mb-4">
            99.99% Uptime
          </p>
          {health && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-50 border border-zinc-100">
              <div
                className={`w-2 h-2 rounded-full animate-pulse ${getDisplayHealthStatus(health) === "ok" ? "bg-emerald-500" : "bg-red-500"}`}
              ></div>
              <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest">
                Systems{" "}
                {getDisplayHealthStatus(health) === "ok"
                  ? "Operating Normally"
                  : "Degraded"}
              </span>
            </div>
          )}
        </div>
        */}
        {/* Temporarily hidden — response latency graph
        <div className="col-span-full border-t border-zinc-100/80 bg-zinc-50/20 p-6 sm:p-10">
          <div className="max-w-4xl mb-8">
            <LandingPill label="Activity feed" accent="amber" className="mb-5" />
            <p className="text-xl md:text-2xl font-black text-zinc-950 tracking-[-0.03em] leading-snug">
              Monitor activity in real-time.{" "}
              <span className="text-zinc-400 font-light">
                Instantly identify and resolve issues.
              </span>
            </p>
          </div>
          <MonitoringChart healthStatus={health} />
        </div>
        */}
      </div>
    </LandingSection>
  );
}

type ServiceStatus = "healthy" | "unhealthy" | "unknown";

interface ServiceHealth {
  name: string;
  latencyMs: number | null;
  latencyLabel: string;
  status: ServiceStatus;
}

function parseLatencyMs(value: string | number | undefined | null): number | null {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const match = String(value).match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : null;
}

function toServiceStatus(status: string | undefined): ServiceStatus {
  if (status === "healthy") return "healthy";
  if (status === "unhealthy") return "unhealthy";
  return "unknown";
}

function transformHealthServices(healthStatus: any): ServiceHealth[] {
  if (!healthStatus?.services?.length) return [];

  return healthStatus.services
    .filter((svc: any) => svc.name !== "docs")
    .map((svc: any) => {
      const latencyMs = parseLatencyMs(svc.latency);

      return {
        name: svc.name,
        latencyMs,
        latencyLabel: svc.latency ?? (latencyMs != null ? `${latencyMs}ms` : "—"),
        status: toServiceStatus(svc.status),
      };
    });
}

function getDisplayHealthStatus(healthStatus: any): "ok" | "degraded" {
  const services = transformHealthServices(healthStatus);
  if (!services.length) {
    return healthStatus?.status === "ok" ? "ok" : "degraded";
  }
  return services.every((svc) => svc.status === "healthy") ? "ok" : "degraded";
}

const statusStyles: Record<
  ServiceStatus,
  { dot: string; bar: string; label: string }
> = {
  healthy: {
    dot: "bg-emerald-500",
    bar: "bg-emerald-500",
    label: "Healthy",
  },
  unhealthy: {
    dot: "bg-red-500",
    bar: "bg-red-500",
    label: "Unhealthy",
  },
  unknown: {
    dot: "bg-zinc-400",
    bar: "bg-zinc-400",
    label: "Unknown",
  },
};

function ServiceChip({ service }: { service: ServiceHealth }) {
  const styles = statusStyles[service.status];
  const latency = service.latencyMs ?? 0;

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-zinc-600">
        <span className="truncate capitalize">{service.name}</span>
        <span className="tabular-nums text-zinc-400">{service.latencyLabel}</span>
      </div>
      <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", styles.bar)}
          style={{ width: `${Math.min(100, Math.max(8, (latency / 120) * 100))}%` }}
        />
      </div>
    </div>
  );
}

const MonitoringChart = ({ healthStatus }: { healthStatus: any }) => {
  const services = useMemo(
    () => transformHealthServices(healthStatus),
    [healthStatus],
  );

  const maxLatency = useMemo(() => {
    const values = services
      .map((svc) => svc.latencyMs)
      .filter((ms): ms is number => ms != null);
    return values.length ? Math.max(...values, 40) : 100;
  }, [services]);

  const avgLatencyMs = useMemo(() => {
    const values = services
      .map((svc) => svc.latencyMs)
      .filter((ms): ms is number => ms != null);
    if (!values.length) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }, [services]);

  const unhealthyCount = services.filter((s) => s.status === "unhealthy").length;
  const chartW = 640;
  const chartH = 200;
  const pad = { t: 16, r: 12, b: 36, l: 36 };
  const innerW = chartW - pad.l - pad.r;
  const innerH = chartH - pad.t - pad.b;
  const step = services.length > 1 ? innerW / (services.length - 1) : innerW;

  if (!healthStatus) {
    return (
      <div className="rounded-[2rem] border border-zinc-100/60 bg-white/60 backdrop-blur-sm p-8">
        <div className="flex items-center justify-center gap-3 text-zinc-400">
          <div className="size-5 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-600" />
          <span className="text-sm font-medium">Loading service health…</span>
        </div>
      </div>
    );
  }

  const points = services.map((svc, i) => {
    const x = pad.l + (services.length > 1 ? i * step : innerW / 2);
    const val = svc.status === "healthy" ? (svc.latencyMs ?? maxLatency * 0.5) : maxLatency;
    const y = pad.t + innerH - (val / maxLatency) * innerH;
    return { ...svc, x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? pad.l} ${pad.t + innerH} L ${points[0]?.x ?? pad.l} ${pad.t + innerH} Z`;

  return (
    <div className="rounded-[2rem] border border-zinc-100/60 bg-white/70 backdrop-blur-sm p-5 sm:p-8 shadow-[0_25px_60px_-20px_rgba(0,0,0,0.06)]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">
            Response latency
          </p>
          <p className="text-2xl font-black tracking-[-0.04em] text-zinc-950 tabular-nums">
            {avgLatencyMs != null ? `${avgLatencyMs.toFixed(1)}ms` : "—"}
            <span className="ml-2 text-sm font-medium text-zinc-400">avg</span>
          </p>
        </div>
        <div
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider",
            unhealthyCount === 0
              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
              : "border-amber-100 bg-amber-50 text-amber-700",
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full animate-pulse",
              unhealthyCount === 0 ? "bg-emerald-500" : "bg-amber-500",
            )}
          />
          {unhealthyCount === 0 ? "All healthy" : `${unhealthyCount} degraded`}
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartW} ${chartH}`}
          className="w-full min-w-[320px] h-auto"
          role="img"
          aria-label="API latency graph"
        >
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = pad.t + innerH * (1 - t);
            return (
              <g key={t}>
                <line
                  x1={pad.l}
                  x2={chartW - pad.r}
                  y1={y}
                  y2={y}
                  stroke="#f4f4f5"
                  strokeWidth="1"
                />
                <text
                  x={pad.l - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="#a1a1aa"
                  fontSize="9"
                  fontFamily="system-ui"
                >
                  {Math.round(maxLatency * t)}ms
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="url(#healthFill)" opacity="0.35" />
          <path
            d={linePath}
            fill="none"
            stroke="#18181b"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((p) => (
            <g key={p.name}>
              <circle
                cx={p.x}
                cy={p.y}
                r={p.status === "healthy" ? 5 : 6}
                fill={p.status === "healthy" ? "#18181b" : "#ef4444"}
                stroke="white"
                strokeWidth="2"
              />
              <text
                x={p.x}
                y={chartH - 10}
                textAnchor="middle"
                fill="#71717a"
                fontSize="8.5"
                fontWeight="600"
                fontFamily="system-ui"
              >
                {p.name}
              </text>
            </g>
          ))}

          <defs>
            <linearGradient id="healthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#18181b" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#18181b" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <ServiceChip key={service.name} service={service} />
        ))}
      </div>
    </div>
  );
};
