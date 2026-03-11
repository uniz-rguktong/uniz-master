import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Newspaper, FileText, Briefcase } from "lucide-react";
import {
    getNotifications,
    type Notification,
    type NotificationType,
} from "../../types/api";
import { AnimatedList } from "../ui/animated-list";
import { HoverEffect } from "../ui/card-hover-effect";
import { cn } from "../../lib/utils";

// The Unified Premium Card standardizing Magic UI & Aceternity
const NotificationCard = ({ item, isHovered = false }: { item: Notification, isHovered?: boolean }) => {
    const validLinks = item.links.filter((l) => l.url);

    // Extract a day number for the calendar icon 
    const dateStr = item.date?.split(" ")[0] || "01-01-2024";
    const day = dateStr.includes("-") ? dateStr.split("-")[0] : dateStr.slice(0, 2);

    return (
        <figure
            className={cn(
                "relative mx-auto min-h-fit w-full cursor-pointer overflow-hidden rounded-[1.25rem] p-5 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
                isHovered
                    ? "bg-transparent shadow-none"
                    : "bg-white border border-slate-100 hover:scale-[101%] shadow-[0_4px_12px_rgba(0,0,0,.03),0_12px_24px_rgba(0,0,0,.02)]"
            )}
        >
            <div className="flex flex-row items-start gap-4">
                {/* Visual Calendar Blob */}
                <div className="flex size-11 items-center justify-center rounded-[0.8rem] bg-gradient-to-b from-[#800000]/10 to-[#800000]/5 flex-shrink-0 border border-[#800000]/10 shadow-sm">
                    <span className="text-[15px] font-black text-[#800000] tracking-tighter" style={{ fontFamily: "monospace" }}>{day}</span>
                </div>

                <div className="flex flex-col overflow-hidden w-full">
                    {/* Timestamp Header */}
                    <figcaption className="flex flex-row items-center font-medium whitespace-pre">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] bg-slate-100 px-2 py-0.5 rounded-full inline-block">
                            {dateStr}
                        </span>
                    </figcaption>

                    {/* Content */}
                    <p className="text-[14.5px] font-semibold text-slate-800 leading-[1.6] mt-2 mb-1">
                        {item.title}
                    </p>

                    {/* Action Links */}
                    {validLinks.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                            {validLinks.map((link, j) => (
                                <a
                                    key={j}
                                    href={link.url!}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#800000] hover:text-white bg-slate-50 hover:bg-[#800000] transition-colors group/link px-3 py-1.5 rounded-lg border border-[#800000]/10"
                                >
                                    <span className="truncate flex-1 tracking-wide">{link.text}</span>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </figure>
    );
};

const AutoScrollGrid = ({ items, speedMultiplier = 4, className }: { items: any[], speedMultiplier?: number, className?: string }) => {
    const duration = Math.max(items.length * speedMultiplier, 10);

    return (
        <div
            className="absolute inset-0 w-full overflow-hidden"
            onMouseEnter={(e) => {
                const track = e.currentTarget.querySelector('.scroll-track') as HTMLElement;
                if (track) track.style.animationPlayState = 'paused';
            }}
            onMouseLeave={(e) => {
                const track = e.currentTarget.querySelector('.scroll-track') as HTMLElement;
                if (track) track.style.animationPlayState = 'running';
            }}
        >
            <div
                className="scroll-track absolute w-full flex flex-col hover:cursor-ns-resize"
                style={{ animation: `scroll-up ${duration}s linear infinite` }}
            >
                <div className="w-full flex justify-col">
                    <HoverEffect
                        items={items}
                        className={className}
                        renderItem={(item, isHovered) => <NotificationCard item={item} isHovered={isHovered} />}
                    />
                </div>
                {/* Perfect duplicate for seamless looping */}
                <div className="w-full flex justify-col">
                    <HoverEffect
                        items={items}
                        className={className}
                        renderItem={(item, isHovered) => <NotificationCard item={item} isHovered={isHovered} />}
                    />
                </div>
            </div>
        </div>
    );
};

export const NotificationsSection = () => {
    const [data, setData] = useState<Record<NotificationType, Notification[] | null>>({
        news_updates: null,
        tenders: null,
        careers: null,
    });

    useEffect(() => {
        const fetchAll = async () => {
            const types: NotificationType[] = ["news_updates", "tenders", "careers"];
            types.forEach(async (type) => {
                try {
                    const result = await getNotifications(type);
                    setData((prev) => ({ ...prev, [type]: result }));
                } catch {
                    setData((prev) => ({ ...prev, [type]: [] }));
                }
            });
        };
        fetchAll();
    }, []);

    // Create a constantly feeding duplicate array for Magic UI News to demo
    const feedingNews = data.news_updates ? [...data.news_updates, ...data.news_updates].slice(0, 15) : [];

    return (
        <section id="notifications" className="py-24 md:py-32 w-full bg-slate-50/50 border-t border-slate-100 overflow-hidden">
            <div className="w-full max-w-[1400px] mx-auto px-6 md:px-12 lg:px-[80px]">

                {/* Modern Aceternity Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16 md:mb-24 flex flex-col items-center text-center"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#800000]/5 border border-[#800000]/10 mb-6">
                        <div className="w-2 h-2 rounded-full bg-[#800000] animate-pulse" />
                        <span className="text-[#800000] font-black uppercase tracking-[0.15em] text-[10px] md:text-[11px]">Official Updates</span>
                    </div>
                    <h2 className="text-[40px] md:text-[56px] font-extrabold text-[#0f172a] tracking-tight leading-[1.1] mb-5">
                        Stay informed. <br />
                        <span className="text-[#800000] dark:text-[#A00000]">Stay ahead.</span>
                    </h2>
                    <p className="text-[16px] md:text-[18px] font-medium text-slate-500 leading-relaxed max-w-2xl mx-auto">
                        Your central intelligence hub for all institutional news, crucial procurement tenders, and career opportunities at RGUKT Ongole.
                    </p>
                </motion.div>

                {/* The "Bento Layout" grid for Magic UI + Aceternity integration */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">

                    {/* Left 5 Columns: The Magic UI Live Animated Stream */}
                    <div className="lg:col-span-5 relative flex flex-col w-full h-[600px] bg-white rounded-[2rem] border border-slate-200/60 shadow-lg overflow-hidden">

                        {/* Stream Header */}
                        <div className="px-8 py-6 flex items-center gap-3 w-full bg-gradient-to-b from-white to-white/90 z-20 border-b border-slate-100">
                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Newspaper size={18} />
                            </div>
                            <h3 className="text-[20px] font-extrabold text-slate-800 tracking-tight">Live News Feed</h3>
                        </div>

                        {/* Magic UI Stream Engine */}
                        {!data.news_updates ? (
                            <div className="flex-1 flex justify-center mt-10"><div className="w-8 h-8 rounded-full border-t-2 border-[#800000] animate-spin" /></div>
                        ) : (
                            <div className="relative flex w-full flex-col overflow-hidden px-4 md:px-6 py-4 flex-1">
                                <AnimatedList delay={3000}>
                                    {feedingNews.map((item, idx) => (
                                        <NotificationCard item={item} key={idx} />
                                    ))}
                                </AnimatedList>
                                <div className="from-white pointer-events-none absolute inset-x-0 bottom-0 h-[20%] bg-gradient-to-t" />
                            </div>
                        )}
                    </div>


                    {/* Right 7 Columns: Aceternity Hover Effect Grid for Tenders/Careers */}
                    <div className="lg:col-span-7 flex flex-col gap-8 h-[600px]">

                        {/* Tenders Block */}
                        <div className="flex-1 bg-white rounded-[2rem] border border-slate-200/60 shadow-lg overflow-hidden flex flex-col relative">
                            <div className="px-8 py-5 flex items-center gap-3 w-full border-b border-slate-100 bg-white sticky top-0 z-20">
                                <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
                                    <FileText size={18} />
                                </div>
                                <h3 className="text-[19px] font-extrabold text-slate-800 tracking-tight">Tenders</h3>
                            </div>
                            <div className="flex-1 relative hide-scrollbar overflow-hidden">
                                {!data.tenders ? (
                                    <div className="px-6 py-4 animate-pulse h-20 bg-slate-50 rounded-xl" />
                                ) : (
                                    <AutoScrollGrid
                                        items={data.tenders}
                                        className="grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-0 py-2"
                                        speedMultiplier={2}
                                    />
                                )}
                            </div>
                            {/* Blur bottom bounds */}
                            <div className="from-white pointer-events-none absolute inset-x-0 bottom-0 h-[30px] bg-gradient-to-t z-10" />
                        </div>

                        {/* Careers Block */}
                        <div className="flex-1 bg-white rounded-[2rem] border border-slate-200/60 shadow-lg overflow-hidden flex flex-col relative">
                            <div className="px-8 py-5 flex items-center gap-3 w-full border-b border-slate-100 bg-white sticky top-0 z-20">
                                <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                                    <Briefcase size={18} />
                                </div>
                                <h3 className="text-[19px] font-extrabold text-slate-800 tracking-tight">Careers</h3>
                            </div>
                            <div className="flex-1 relative hide-scrollbar overflow-hidden">
                                {!data.careers ? (
                                    <div className="px-6 py-4 animate-pulse h-20 bg-slate-50 rounded-xl" />
                                ) : (
                                    <AutoScrollGrid
                                        items={data.careers}
                                        className="grid-cols-1 md:grid-cols-2 gap-0 py-2"
                                        speedMultiplier={2}
                                    />
                                )}
                            </div>
                            {/* Blur bottom bounds */}
                            <div className="from-white pointer-events-none absolute inset-x-0 bottom-0 h-[30px] bg-gradient-to-t z-10" />
                        </div>

                    </div>
                </div>
            </div>

            {/* Injected styles to clean the internal scrolling within the Aceternity cards */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none; 
                    scrollbar-width: none; 
                }
                @keyframes scroll-up {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(-50%); }
                }
            `}} />
        </section>
    );
};
