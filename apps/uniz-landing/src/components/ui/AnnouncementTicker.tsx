import { BellRing } from "lucide-react";
import type { HomeData } from "../../types/api";

export const AnnouncementTicker = ({
    announcements,
}: {
    announcements: HomeData["announcements"];
}) => {
    const filtered = announcements.filter((a) => a.text.trim() !== "");
    if (filtered.length === 0) return null;

    return (
        <div
            className="relative overflow-hidden flex items-center border-b border-[#800000]/15"
            style={{
                height: "42px",
                background: "linear-gradient(90deg, #fff9f9 0%, #ffffff 40%)",
            }}
        >
            {/* NOTICE label badge */}
            <div
                className="absolute left-0 top-0 bottom-0 z-20 flex items-center gap-2 px-5 select-none flex-shrink-0"
                style={{
                    background: "linear-gradient(135deg, #800000 0%, #600000 100%)",
                    minWidth: "110px",
                }}
            >
                <BellRing size={13} className="text-white/80 flex-shrink-0" />
                <span className="text-white text-[11px] font-black uppercase tracking-[0.18em]">
                    Notice
                </span>
            </div>

            {/* Thin right-side fade on label */}
            <div
                className="absolute z-10 top-0 bottom-0 w-8 pointer-events-none"
                style={{
                    left: "110px",
                    background: "linear-gradient(90deg, #800000/5, transparent)",
                }}
            />

            {/* Scrolling content */}
            <div className="ml-[118px] flex items-center overflow-hidden flex-1">
                <div className="animate-marquee flex items-center gap-0 whitespace-nowrap">
                    {[...filtered, ...filtered].map((a, i) => (
                        <a
                            key={i}
                            href={a.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 flex-shrink-0 group"
                            style={{ paddingRight: "48px" }}
                        >
                            {/* Dot separator */}
                            <span
                                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                style={{ background: "#800000", opacity: 0.45 }}
                            />
                            <span
                                className="text-[12px] font-medium text-slate-700 group-hover:text-[#800000] transition-colors duration-150"
                                style={{ letterSpacing: "0.01em" }}
                            >
                                {a.text}
                            </span>
                        </a>
                    ))}
                </div>
            </div>

            {/* Right fade mask */}
            <div
                className="absolute right-0 top-0 bottom-0 w-16 pointer-events-none z-10"
                style={{
                    background: "linear-gradient(to left, #ffffff, transparent)",
                }}
            />
        </div>
    );
};
