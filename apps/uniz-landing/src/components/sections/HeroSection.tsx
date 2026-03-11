import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useRef } from "react";

export const HeroSection = () => {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"]
    });

    // Elite Parallax: Image moves slower than scroll
    const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
    const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.4]);

    return (
        <section
            ref={ref}
            id="hero"
            className="relative w-full h-[100vh] min-h-[700px] overflow-hidden flex items-center justify-center pt-[120px]"
        >
            {/* The Hero Image - Premium Parallax Effect */}
            <motion.div
                style={{ y, opacity }}
                className="absolute inset-0 z-0"
            >
                <img
                    src="/college.jpg"
                    alt="RGUKT Ongole Campus"
                    className="w-full h-full object-cover scale-110"
                />
                {/* Subtle dark overlay for text contrast */}
                <div className="absolute inset-0 bg-black/5" />
            </motion.div>

            {/* Center Title - High-Prestige Serif Typography */}
            <div className="relative z-10 text-center">
                <motion.h1
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    className="text-[90px] md:text-[150px] lg:text-[210px] font-serif font-medium text-white leading-[0.85] tracking-tighter select-none"
                    style={{ textShadow: "0 10px 30px rgba(0,0,0,0.5)" }}
                >
                    RGUKT
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.6 }}
                    className="text-[22px] md:text-[32px] text-white font-serif italic mt-0 md:mt-[-15px] opacity-90"
                    style={{ textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}
                >
                    Ongole Campus
                </motion.p>
            </div>

            {/* Bottom Signature Red Bar - Stanford Inspired */}
            <div className="absolute bottom-0 left-0 right-0 z-20">
                <motion.button
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 1 }}
                    onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                    className="w-full bg-[#8C1515] py-5 md:py-7 flex items-center justify-center gap-3 group transition-all hover:bg-[#a02020] text-white shadow-[0_-10px_30px_rgba(0,0,0,0.2)]"
                >
                    <span className="text-[20px] md:text-[24px] font-bold tracking-tight uppercase">Explore RGUKT Ongole</span>
                    <ChevronDown size={28} className="group-hover:translate-y-1.5 transition-transform duration-300" />
                </motion.button>
            </div>
        </section>
    );
};
