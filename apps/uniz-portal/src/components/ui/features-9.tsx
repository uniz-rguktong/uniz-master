"use client"
import { Activity, MessageCircle, Bell, CheckCircle, Ticket, FileText, ShieldAlert, Key } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "./chart"
import { useEffect, useState } from "react"
import { SYSTEM_HEALTH } from "../../api/endpoints"
import { cn } from "../../lib/utils"
import { AnimatedList } from "./animated-list"

interface Item {
    name: string
    description: string
    icon: any
    color: string
    time: string
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
]

notifications = Array.from({ length: 10 }, () => notifications).flat()

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
                "transform-gpu dark:bg-transparent dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] dark:backdrop-blur-md dark:[border:1px_solid_rgba(255,255,255,.1)]"
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
                        <span className="text-sm font-semibold text-slate-900 sm:text-base">{name}</span>
                        <span className="mx-1 text-slate-300">·</span>
                        <span className="text-xs font-semibold text-slate-400">{time}</span>
                    </figcaption>
                    <p className="text-xs font-medium text-slate-500 dark:text-white/60">
                        {description}
                    </p>
                </div>
            </div>
        </figure>
    )
}

export function Features() {
    const [health, setHealth] = useState<any>(null)

    useEffect(() => {
        const fetchHealth = async () => {
            try {
                const response = await fetch(SYSTEM_HEALTH)
                const result = await response.json()
                setHealth(result)
            } catch (error) {
                console.error("Health Check Error:", error)
            }
        }
        fetchHealth()
        const interval = setInterval(fetchHealth, 60000)
        return () => clearInterval(interval)
    }, [])

    return (
        <section className="w-full px-6 flex flex-col items-center pb-32">
            <div className="mb-16 text-left w-full max-w-7xl px-4 md:px-8">
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-6">
                    Real-time insights,<br className="hidden md:block" />
                    <span className="text-slate-400">complete control.</span>
                </h2>
                <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-2xl">
                    Keep your finger on the pulse of your university with comprehensive systems monitoring.
                </p>
            </div>

            <div className="mx-auto grid w-full max-w-7xl rounded-3xl border border-slate-200 shadow-sm md:grid-cols-2 bg-white overflow-hidden">
                <div className="border-b md:border-b-0 md:border-r border-slate-200">
                    <div className="p-6 sm:p-12 pb-6">
                        <span className="text-slate-500 font-bold flex items-center gap-2">
                            <Bell className="size-4" />
                            Live Updates
                        </span>

                        <p className="mt-8 text-2xl font-semibold text-slate-900">Real-time system events, piped directly to your dashboard.</p>
                    </div>

                    <div aria-hidden className="relative h-[400px] bg-slate-50 overflow-hidden flex flex-col p-2 border-t border-slate-100">
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

                        <p className="my-8 text-2xl font-semibold text-slate-900">Get instant answers to your queries with our AI-powered chatbot.</p>
                    </div>
                    <div aria-hidden className="flex flex-col gap-8">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="flex justify-center items-center size-5 rounded-full border border-slate-200 bg-white shadow-sm">
                                    <span className="size-3 rounded-full bg-navy-500" />
                                </span>
                                <span className="text-slate-500 font-medium text-xs">Sat 22 Feb</span>
                            </div>
                            <div className="rounded-xl shadow-sm border border-slate-200 bg-white mt-1.5 w-4/5 sm:w-3/5 p-4 text-sm font-medium text-slate-700">Hey, I'm having trouble with my account login.</div>
                        </div>

                        <div>
                            <div className="rounded-xl shadow-md border border-navy-100 ml-auto w-4/5 sm:w-3/5 bg-navy-900 p-4 text-sm font-medium text-white mb-2">We've identified the issue and pushed a patch. You should be able to log in now.</div>
                            <span className="text-slate-400 font-medium block text-right text-xs">Just now</span>
                        </div>
                    </div>
                </div>
                <div className="col-span-full border-y border-slate-200 p-12 bg-white flex flex-col items-center justify-center">
                    <p className="text-center text-5xl md:text-6xl font-black tracking-tight text-slate-900 mb-4">99.99% Uptime</p>
                    {health && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 border border-slate-200">
                            <div className={`w-2 h-2 rounded-full animate-pulse ${health.status === 'ok' ? 'bg-navy-900' : 'bg-red-500'}`}></div>
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                                Systems {health.status === 'ok' ? 'Operating Normally' : 'Degraded'}
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
                            Monitor your application's activity in real-time. <span className="text-slate-500"> Instantly identify and resolve issues.</span>
                        </p>
                    </div>
                    <MonitoringChart healthStatus={health} />
                </div>
            </div>
        </section>
    )
}

const chartConfig = {
    latency: {
        label: 'Latency (ms)',
        color: '#2563eb',
    }
} satisfies ChartConfig

const defaultData = [
    { service: 'auth', latency: 7 },
    { service: 'profile', latency: 6 },
    { service: 'cms', latency: 6 },
    { service: 'academics', latency: 7 },
    { service: 'requests', latency: 8 },
    { service: 'files', latency: 7 },
    { service: 'mail', latency: 8 },
    { service: 'notifications', latency: 7 },
    { service: 'cron', latency: 8 },
    { service: 'grievance', latency: 9 },
]

const MonitoringChart = ({ healthStatus }: { healthStatus: any }) => {
    // Transform Health API services array to recharts format
    const chartData = healthStatus?.services?.length > 0
        ? healthStatus.services.map((svc: any) => ({
            service: svc.name,
            latency: svc.latency ? parseInt(svc.latency.replace('ms', '') || '0') : 0
        }))
        : defaultData;

    return (
        <ChartContainer className="h-[400px] aspect-auto md:h-[450px] w-full mt-32 md:mt-16" config={chartConfig}>
            <AreaChart
                accessibilityLayer
                data={chartData}
                margin={{
                    top: 140,
                    left: 20,
                    right: 20,
                    bottom: 20
                }}>
                <defs>
                    <linearGradient id="fillLatency" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-latency)" stopOpacity={0.4} />
                        <stop offset="90%" stopColor="var(--color-latency)" stopOpacity={0.01} />
                    </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
                <XAxis
                    dataKey="service"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={12}
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                />
                <ChartTooltip active cursor={false} content={<ChartTooltipContent className="bg-white border-slate-200 shadow-xl" labelKey="service" />} />
                <Area
                    strokeWidth={2}
                    dataKey="latency"
                    type="monotone"
                    fill="url(#fillLatency)"
                    stroke="var(--color-latency)"
                />
            </AreaChart>
        </ChartContainer>
    )
}
