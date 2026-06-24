"use client";
import {
  Activity,
  MessageCircle,
  Bell,
  CheckCircle,
  Ticket,
  FileText,
  ShieldAlert,
  Key,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SYSTEM_HEALTH } from "../../api/endpoints";
import { cn } from "../../lib/utils";
import { AnimatedList } from "./animated-list";

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

notifications = Array.from({ length: 10 }, () => notifications).flat();

const Notification = ({ name, description, icon: Icon, color, time }: Item) => {
  return (
    <figure
      className={cn(
        "relative mx-auto min-h-fit w-full max-w-[400px] cursor-pointer overflow-hidden rounded-2xl p-4",
        // animation styles
        "transition-all duration-200 ease-in-out hover:scale-[103%]",
        // light styles
        "bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
        // dark styles
        "transform-gpu dark:bg-transparent dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] dark:backdrop-blur-md dark:[border:1px_solid_rgba(255,255,255,.1)]",
      )}
    >
      <div className="flex flex-row items-center gap-3">
        <div
          className="flex size-10 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: color,
          }}
        >
          <Icon className="size-5 text-white" />
        </div>
        <div className="flex flex-col overflow-hidden">
          <figcaption className="flex flex-row items-center text-lg font-medium whitespace-pre dark:text-white">
            <span className="text-sm font-semibold text-slate-900 sm:text-base">
              {name}
            </span>
            <span className="mx-1 text-slate-300">·</span>
            <span className="text-xs font-semibold text-slate-400">{time}</span>
          </figcaption>
          <p className="text-xs font-medium text-slate-500 dark:text-white/60">
            {description}
          </p>
        </div>
      </div>
    </figure>
  );
};

export function Features() {
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await fetch(SYSTEM_HEALTH);
        const result = await response.json();
        setHealth(result);
      } catch (error) {
        console.error("Health Check Error:", error);
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="w-full px-6 flex flex-col items-center pb-32">
      <div className="mb-16 text-left w-full max-w-7xl px-4 md:px-8">
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-6">
          Real-time insights,
          <br className="hidden md:block" />
          <span className="text-slate-400">complete control.</span>
        </h2>
        <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-2xl">
          Keep your finger on the pulse of your university with comprehensive
          systems monitoring.
        </p>
      </div>

      <div className="mx-auto grid w-full max-w-7xl rounded-3xl border border-slate-200 shadow-sm md:grid-cols-2 bg-white overflow-hidden">
        <div className="border-b md:border-b-0 md:border-r border-slate-200">
          <div className="p-6 sm:p-12 pb-6">
            <span className="text-slate-500 font-bold flex items-center gap-2">
              <Bell className="size-4" />
              Live Updates
            </span>

            <p className="mt-8 text-2xl font-semibold text-slate-900">
              Real-time system events, piped directly to your dashboard.
            </p>
          </div>

          <div
            aria-hidden
            className="relative h-[400px] bg-slate-50 overflow-hidden flex flex-col p-2 border-t border-slate-100"
          >
            <AnimatedList className="w-full">
              {notifications.map((item, idx) => (
                <Notification {...item} key={idx} />
              ))}
            </AnimatedList>
            <div className="from-slate-50 pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t" />
          </div>
        </div>
        <div className="bg-slate-50/50 p-6 sm:p-12">
          <div className="relative z-10">
            <span className="text-slate-500 font-bold flex items-center gap-2">
              <MessageCircle className="size-4" />
              Chatbot support
            </span>

            <p className="my-8 text-2xl font-semibold text-slate-900">
              Get instant answers to your queries with our AI-powered chatbot.
            </p>
          </div>
          <div aria-hidden className="flex flex-col gap-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex justify-center items-center size-5 rounded-full border border-slate-200 bg-white shadow-sm">
                  <span className="size-3 rounded-full bg-navy-500" />
                </span>
                <span className="text-slate-500 font-medium text-xs">
                  Sat 22 Feb
                </span>
              </div>
              <div className="rounded-xl shadow-sm border border-slate-200 bg-white mt-1.5 w-4/5 sm:w-3/5 p-4 text-sm font-medium text-slate-700">
                Hey, I'm having trouble with my account login.
              </div>
            </div>

            <div>
              <div className="rounded-xl shadow-md border border-navy-100 ml-auto w-4/5 sm:w-3/5 bg-navy-900 p-4 text-sm font-medium text-white mb-2">
                We've identified the issue and pushed a patch. You should be
                able to log in now.
              </div>
              <span className="text-slate-400 font-medium block text-right text-xs">
                Just now
              </span>
            </div>
          </div>
        </div>
        <div className="col-span-full border-y border-slate-200 p-12 bg-white flex flex-col items-center justify-center">
          <p className="text-center text-5xl md:text-6xl font-black tracking-tight text-slate-900 mb-4">
            99.99% Uptime
          </p>
          {health && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 border border-slate-200">
              <div
                className={`w-2 h-2 rounded-full animate-pulse ${health.status === "ok" ? "bg-navy-900" : "bg-red-500"}`}
              ></div>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                Systems{" "}
                {health.status === "ok" ? "Operating Normally" : "Degraded"}
              </span>
            </div>
          )}
        </div>
        <div className="relative col-span-full bg-slate-50/30">
          <div className="absolute z-10 max-w-lg px-6 pr-12 pt-6 md:px-12 md:pt-12">
            <span className="text-slate-500 font-bold flex items-center gap-2">
              <Activity className="size-4" />
              Activity feed
            </span>

            <p className="my-8 text-2xl font-semibold text-slate-900">
              Monitor your application's activity in real-time.{" "}
              <span className="text-slate-500">
                {" "}
                Instantly identify and resolve issues.
              </span>
            </p>
          </div>
          <MonitoringChart healthStatus={health} />
        </div>
      </div>
    </section>
  );
}

type ServiceStatus = "healthy" | "unhealthy" | "unknown";

interface ServiceHealth {
  name: string;
  latencyMs: number | null;
  latencyLabel: string;
  status: ServiceStatus;
  isColdStart: boolean;
}

const COLD_START_THRESHOLD_MS = 100;

const DEFAULT_SERVICES: ServiceHealth[] = [
  { name: "auth", latencyMs: 7, latencyLabel: "7ms", status: "healthy", isColdStart: false },
  { name: "profile", latencyMs: 6, latencyLabel: "6ms", status: "healthy", isColdStart: false },
  { name: "cms", latencyMs: 6, latencyLabel: "6ms", status: "healthy", isColdStart: false },
  { name: "academics", latencyMs: 7, latencyLabel: "7ms", status: "healthy", isColdStart: false },
  { name: "requests", latencyMs: 8, latencyLabel: "8ms", status: "healthy", isColdStart: false },
  { name: "files", latencyMs: 7, latencyLabel: "7ms", status: "healthy", isColdStart: false },
  { name: "mail", latencyMs: 8, latencyLabel: "8ms", status: "healthy", isColdStart: false },
  { name: "notifications", latencyMs: 7, latencyLabel: "7ms", status: "healthy", isColdStart: false },
  { name: "cron", latencyMs: 8, latencyLabel: "8ms", status: "healthy", isColdStart: false },
  { name: "grievance", latencyMs: 9, latencyLabel: "9ms", status: "healthy", isColdStart: false },
];

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
  if (!healthStatus?.services?.length) return DEFAULT_SERVICES;

  return healthStatus.services.map((svc: any) => {
    const latencyMs = parseLatencyMs(svc.latency);
    const isDocs = svc.name === "docs";

    return {
      name: svc.name,
      latencyMs,
      latencyLabel: svc.latency ?? (latencyMs != null ? `${latencyMs}ms` : "—"),
      status: toServiceStatus(svc.status),
      isColdStart:
        isDocs ||
        (latencyMs != null && latencyMs >= COLD_START_THRESHOLD_MS),
    };
  });
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
    dot: "bg-slate-400",
    bar: "bg-slate-400",
    label: "Unknown",
  },
};

function ServiceLatencyRow({
  service,
  maxMs,
  showColdStartBadge = false,
}: {
  service: ServiceHealth;
  maxMs: number;
  showColdStartBadge?: boolean;
}) {
  const styles = statusStyles[service.status];
  const widthPct =
    service.latencyMs != null && maxMs > 0
      ? Math.min(100, (service.latencyMs / maxMs) * 100)
      : 0;

  return (
    <div className="group relative grid grid-cols-[minmax(5.5rem,6.5rem)_1fr_auto] items-center gap-3 py-2.5 sm:grid-cols-[7rem_1fr_auto]">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={cn("h-2 w-2 shrink-0 rounded-full", styles.dot)}
          aria-hidden
        />
        <span className="truncate text-sm font-semibold capitalize text-slate-700">
          {service.name}
        </span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn("h-full rounded-full transition-all duration-500", styles.bar)}
          style={{ width: `${widthPct}%` }}
        />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="text-sm font-bold tabular-nums text-slate-900">
          {service.latencyLabel}
        </span>
        {showColdStartBadge && (
          <span className="hidden rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 sm:inline">
            Mintlify cold start
          </span>
        )}
      </div>

      <div className="pointer-events-none absolute left-0 top-full z-20 mt-1 hidden w-max rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-xl group-hover:block">
        <p className="font-bold capitalize text-slate-900">{service.name}</p>
        <p className="mt-0.5 text-slate-600">
          Latency: <span className="font-semibold text-slate-900">{service.latencyLabel}</span>
        </p>
        <p className="text-slate-600">
          Status:{" "}
          <span
            className={cn(
              "font-semibold",
              service.status === "healthy" && "text-emerald-600",
              service.status === "unhealthy" && "text-red-600",
              service.status === "unknown" && "text-slate-600",
            )}
          >
            {styles.label}
          </span>
        </p>
      </div>
    </div>
  );
}

const MonitoringChart = ({ healthStatus }: { healthStatus: any }) => {
  const services = useMemo(
    () => transformHealthServices(healthStatus),
    [healthStatus],
  );

  const coreServices = useMemo(
    () => services.filter((svc) => !svc.isColdStart),
    [services],
  );

  const slowServices = useMemo(
    () => services.filter((svc) => svc.isColdStart),
    [services],
  );

  const coreMaxMs = useMemo(() => {
    const values = coreServices
      .map((svc) => svc.latencyMs)
      .filter((ms): ms is number => ms != null);
    return Math.max(20, ...values, 1);
  }, [coreServices]);

  const slowMaxMs = useMemo(() => {
    const values = slowServices
      .map((svc) => svc.latencyMs)
      .filter((ms): ms is number => ms != null);
    return Math.max(...values, 1);
  }, [slowServices]);

  return (
    <div className="mt-32 w-full px-6 pb-10 pt-2 md:mt-16 md:px-12 md:pb-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Service latency
        </p>
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Healthy
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Unhealthy
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="divide-y divide-slate-100">
          {coreServices.map((service) => (
            <ServiceLatencyRow
              key={service.name}
              service={service}
              maxMs={coreMaxMs}
            />
          ))}
        </div>

        {slowServices.length > 0 && (
          <div className="mt-6 border-t border-dashed border-slate-200 pt-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Slow / cold-start services
              </p>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 sm:hidden">
                Mintlify cold start
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {slowServices.map((service) => (
                <ServiceLatencyRow
                  key={service.name}
                  service={service}
                  maxMs={slowMaxMs}
                  showColdStartBadge={service.name === "docs"}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
