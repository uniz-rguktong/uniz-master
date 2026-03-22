import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowDown, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";

export const HeroBlock = React.memo(() => {
  const navigate = useNavigate();
  const signaturePathRef = useRef<SVGPathElement>(null);
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);

  useEffect(() => {
    if (signaturePathRef.current) {
      const length = signaturePathRef.current.getTotalLength();
      gsap.fromTo(signaturePathRef.current,
        { strokeDasharray: length, strokeDashoffset: length },
        {
          strokeDashoffset: 0,
          duration: 2.8,
          ease: "power2.inOut",
          onComplete: () => setIsAnimationComplete(true)
        }
      );
    }
  }, []);

  // Variant for sequential reveal
  const sequenceVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.15, ease: "linear" }
    },
  };

  return (
    <section className="relative flex items-center justify-center overflow-hidden bg-[#F4F6F8] min-h-screen w-full">
      <div className="relative z-10 mx-auto max-w-5xl text-center px-6">
        <div className="flex flex-col items-center">

          {/* Main uniz Handwriting Animation replacing "UniZ Portal" */}
          <div className="mb-4 flex items-center justify-center scale-100 md:scale-[1.2]">
            <svg viewBox="0 0 1400 400" className="w-[95vw] md:w-[950px]" aria-label="uniz" style={{ overflow: "visible" }}>
              <defs>
                <linearGradient id="apple-rainbow-hero" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FF3B30" />
                  <stop offset="16%" stopColor="#FF9500" />
                  <stop offset="33%" stopColor="#FFCC00" />
                  <stop offset="50%" stopColor="#4CD964" />
                  <stop offset="66%" stopColor="#5AC8FA" />
                  <stop offset="83%" stopColor="#007AFF" />
                  <stop offset="100%" stopColor="#5856D6" />
                </linearGradient>

                <mask id="uniZ-mask-hero">
                  <path
                    ref={signaturePathRef}
                    fill="none"
                    stroke="white"
                    strokeWidth="320"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    // Even wider path for the new container footprint
                    d="M -100 200 C 200 50, 500 350, 700 200 S 1150 50, 1500 200"
                  />
                </mask>
              </defs>

              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                alignmentBaseline="middle"
                fill="url(#apple-rainbow-hero)"
                fontSize="305"
                fontWeight="800"
                style={{ fontFamily: "'Great Vibes', cursive" }}
                className="drop-shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                mask="url(#uniZ-mask-hero)"
              >
                uniz
              </text>
            </svg>
          </div>

          {/* Slogan and Description - Sequentially revealed */}
          <motion.div
            variants={sequenceVariants}
            initial="hidden"
            animate={isAnimationComplete ? "visible" : "hidden"}
            className="flex flex-col items-center"
          >
            <p className="mx-auto mb-10 max-w-3xl text-xl text-slate-500 md:text-2xl font-medium leading-relaxed">
              Campus Administration Portal. <br className="hidden md:block" />
              Empowering students and faculty with seamless digital governance.
            </p>

            <div className="flex justify-center">
              <Button
                size="lg"
                className="rounded-full px-12 h-16 text-lg font-bold gap-3 bg-black text-white hover:bg-slate-800 transition-all shadow-2xl active:scale-95 group"
                onClick={() => navigate("/student/signin")}
              >
                Explore Portal
                <Zap className="h-5 w-5 fill-current transition-transform group-hover:rotate-12" />
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Optimized Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{
          opacity: { delay: 3.3, duration: 0.6 }, // Show shortly after sequence
          y: { delay: 3.5, duration: 1.5, repeat: Infinity },
        }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 transform pointer-events-none"
      >
        <ArrowDown className="h-6 w-6 text-slate-300" />
      </motion.div>
    </section>
  );
});

HeroBlock.displayName = "HeroBlock";
