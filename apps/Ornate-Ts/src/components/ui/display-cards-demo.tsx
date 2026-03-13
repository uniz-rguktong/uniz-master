"use client";

import DisplayCards from "@/components/ui/display-cards";
import { Sparkles, TrendingUp, Zap } from "lucide-react";

const defaultCards = [
    {
        icon: <Sparkles className="size-4 text-blue-300" />,
        title: "Featured",
        description: "Discover amazing content",
        date: "Just now",
        iconClassName: "text-blue-500",
        titleClassName: "text-blue-500",
        image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa",
        className:
            "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
        icon: <TrendingUp className="size-4 text-emerald-300" />,
        title: "Popular",
        description: "Trending this week",
        date: "2 days ago",
        iconClassName: "text-emerald-500",
        titleClassName: "text-emerald-500",
        image: "https://images.unsplash.com/photo-1534067783941-51c9c23ecefd",
        className:
            "[grid-area:stack] translate-x-12 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
        icon: <Zap className="size-4 text-amber-300" />,
        title: "New",
        description: "Latest updates and features",
        date: "Today",
        iconClassName: "text-amber-500",
        titleClassName: "text-amber-500",
        image: "https://images.unsplash.com/photo-1518770660439-4636190af475",
        className:
            "[grid-area:stack] translate-x-24 translate-y-20 hover:translate-y-10",
    },
];

function DisplayCardsDemo() {
    return (
        <div className="flex min-h-[400px] w-full items-center justify-center py-20">
            <div className="w-full max-w-3xl">
                <DisplayCards cards={defaultCards} />
            </div>
        </div>
    );
}

export { DisplayCardsDemo };
