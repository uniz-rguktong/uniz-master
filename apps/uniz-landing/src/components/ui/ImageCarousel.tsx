import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CAROUSEL_EXTENSIONS = /\.(jpe?g|png|gif|webp|svg)(\?.*)?$/i;
const CAROUSEL_EXCLUDES =
    /new\.gif|instagram|linkedin|twitter|youtube|rguktlogo|ap-logo|cutercounter/i;

export function filterCarouselImages(images: string[]): string[] {
    return images.filter(
        (url) => CAROUSEL_EXTENSIONS.test(url) && !CAROUSEL_EXCLUDES.test(url)
    );
}

export const ImageCarousel = ({ images }: { images: string[] }) => {
    const slides = filterCarouselImages(images);
    const [current, setCurrent] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const startTimer = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setCurrent((prev) => (prev + 1) % slides.length);
        }, 4500);
    }, [slides.length]);

    useEffect(() => {
        if (slides.length === 0) return;
        startTimer();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [slides.length, startTimer]);

    const go = (dir: "prev" | "next") => {
        setCurrent((prev) =>
            dir === "prev"
                ? (prev - 1 + slides.length) % slides.length
                : (prev + 1) % slides.length
        );
        startTimer();
    };

    if (slides.length === 0) return null;

    return (
        <div className="relative w-full h-full overflow-hidden group">
            <AnimatePresence mode="wait">
                <motion.img
                    key={current}
                    src={slides[current]}
                    alt={`Campus image ${current + 1}`}
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.7, ease: "easeInOut" }}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        e.currentTarget.style.display = "none";
                    }}
                />
            </AnimatePresence>

            {/* Dot indicators */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {slides.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => { setCurrent(i); startTimer(); }}
                        aria-label={`Go to slide ${i + 1}`}
                        className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "w-8 bg-white" : "w-1.5 bg-white/40"
                            }`}
                    />
                ))}
            </div>

            {/* Prev / Next */}
            <button
                onClick={() => go("prev")}
                aria-label="Previous slide"
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-white/40 transition-all duration-300 z-10"
            >
                <ChevronLeft size={20} />
            </button>
            <button
                onClick={() => go("next")}
                aria-label="Next slide"
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-white/40 transition-all duration-300 z-10"
            >
                <ChevronRight size={20} />
            </button>
        </div>
    );
};
