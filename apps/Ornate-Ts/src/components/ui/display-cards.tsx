"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

import Link from "next/link";

interface DisplayCardProps {
    className?: string;
    icon?: React.ReactNode;
    title?: string;
    description?: string;
    date?: string;
    iconClassName?: string;
    titleClassName?: string;
    image?: string;
    accentColor?: string;
    link?: string;
}

function DisplayCard({
    className,
    icon = <Sparkles className="size-4 text-blue-300" />,
    title = "Featured",
    description = "Discover amazing content",
    date = "Just now",
    iconClassName = "text-blue-500",
    titleClassName = "text-blue-500",
    image,
    accentColor = "#22d3ee",
    link,
}: DisplayCardProps) {
    const content = (
        <>
            {/* Background Image/Nebula - VISIBLE BY DEFAULT */}
            {image && (
                <div className="absolute inset-0 z-0 opacity-60 transition-all duration-1000">
                    <img src={image} alt="" className="w-full h-full object-cover transition-all duration-1000 scale-110" />
                    <div className="absolute inset-0 transition-opacity duration-1000 opacity-60" style={{ backgroundColor: accentColor, mixBlendMode: 'overlay' }} />
                </div>
            )}

            {/* Scanline Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.05] z-[1]"
                style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent 0px, transparent 1px, #fff 1px, #fff 2px)', backgroundSize: '100% 4px' }}
            />

            {/* Tactical Corners */}
            <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-white/40 z-[2] transition-all scale-110" style={{ borderColor: accentColor + '66' }} />
            <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-white/40 z-[2] transition-all scale-110" style={{ borderColor: accentColor + '66' }} />

            {/* Animated Glow Component - VISIBLE BY DEFAULT */}
            <div className="absolute -inset-20 blur-[120px] opacity-30 transition-opacity duration-1000 pointer-events-none z-0 pulse-glow"
                style={{ background: `radial-gradient(circle at center, ${accentColor} 0%, transparent 70%)` }}
            />

            {/* Content Container */}
            <div className="relative z-10 flex items-center gap-6">
                <div className="relative">
                    <div className="absolute -inset-2 blur-md opacity-60 transition-opacity rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)]" style={{ backgroundColor: accentColor }} />
                    <span className="relative inline-block rounded-2xl bg-white/5 p-4 border border-white/40 backdrop-blur-md overflow-hidden transition-all">
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent" />
                        <div style={{ color: accentColor }} className="scale-[1.5]">
                            {React.isValidElement(icon) ? icon : <Sparkles />}
                        </div>
                    </span>
                    {/* Pulsing indicator */}
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full animate-ping opacity-75" style={{ backgroundColor: accentColor }} />
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full" style={{ backgroundColor: accentColor }} />
                </div>
                <div className="flex flex-col">
                    <p className="text-2xl font-black tracking-[0.15em] uppercase italic transition-all duration-500" style={{ color: accentColor }}>{title}</p>
                    <div className="h-1 w-24 mt-2 opacity-40" style={{ backgroundColor: accentColor }} />
                </div>
            </div>

            <p className="relative z-10 sm:whitespace-nowrap text-[12px] sm:text-xl font-bold text-white/90 tracking-wider transition-all duration-500">
                {description}
            </p>

            <div className="relative z-10 flex items-center justify-between pt-4">
                <div className="flex flex-col">
                    <p className="text-[8px] sm:text-[12px] font-black tracking-[0.3em] sm:tracking-[0.6em] text-white/70 uppercase transition-colors">
                        SYNCHRONIZATION SIGNAL // {date}
                    </p>
                </div>
                <div className="h-px flex-1 mx-4 sm:mx-12 bg-gradient-to-r from-white/20 to-transparent" />
                <div className="px-3 sm:px-6 py-1.5 sm:py-2 border border-white/10 rounded-sm bg-white/10 backdrop-blur-md transition-all">
                    <span className="text-[8px] sm:text-[10px] font-black tracking-[0.3em] sm:tracking-[0.5em] uppercase opacity-100 transition-all" style={{ color: accentColor }}>TACTICAL_RESOURCES</span>
                </div>
            </div>

            <style jsx>{`
                @keyframes pulse-glow {
                    0% { opacity: 0.15; transform: scale(1); }
                    50% { opacity: 0.25; transform: scale(1.1); }
                    100% { opacity: 0.15; transform: scale(1); }
                }
                .pulse-glow {
                    animation: pulse-glow 4s ease-in-out infinite;
                }
            `}</style>
        </>
    );

    if (link) {
        return (
            <Link
                href={link}
                className={cn(
                    "relative flex h-52 sm:h-64 w-[20rem] sm:w-[42rem] -skew-y-[8deg] select-none flex-col justify-between rounded-xl sm:rounded-3xl border-2 bg-[#050510]/90 backdrop-blur-2xl px-6 sm:px-10 py-6 sm:py-8 transition-all duration-700 overflow-hidden group block",
                    "border-white/30",
                    "after:absolute after:-right-1 after:top-[-5%] after:h-[110%] after:w-[18rem] sm:after:w-[38rem] after:bg-gradient-to-l after:from-background/90 after:to-transparent after:content-['']",
                    className
                )}
            >
                {content}
            </Link>
        );
    }

    return (
        <div
            className={cn(
                "relative flex h-52 sm:h-64 w-[20rem] sm:w-[42rem] -skew-y-[8deg] select-none flex-col justify-between rounded-xl sm:rounded-3xl border-2 bg-[#050510]/90 backdrop-blur-2xl px-6 sm:px-10 py-6 sm:py-8 transition-all duration-700 overflow-hidden group",
                "border-white/30",
                "after:absolute after:-right-1 after:top-[-5%] after:h-[110%] after:w-[18rem] sm:after:w-[38rem] after:bg-gradient-to-l after:from-background/90 after:to-transparent after:content-['']",
                className
            )}
        >
            {content}
        </div>
    );
}

interface DisplayCardsProps {
    cards?: (DisplayCardProps & { link?: string })[];
}

export default function DisplayCards({ cards }: DisplayCardsProps) {
    const defaultCards = [
        {
            className: "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration:700 hover:grayscale-0 before:left-0 before:top-0",
        },
        {
            className: "[grid-area:stack] translate-x-16 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration:700 hover:grayscale-0 before:left-0 before:top-0",
        },
        {
            className: "[grid-area:stack] translate-x-32 translate-y-20 hover:translate-y-10",
        },
    ];

    const displayCards = cards || defaultCards;

    return (
        <div className="grid [grid-template-areas:'stack'] place-items-center opacity-100 animate-in fade-in-0 duration-700">
            {displayCards.map((cardProps, index) => (
                <DisplayCard key={index} {...cardProps} />
            ))}
        </div>
    );
}
