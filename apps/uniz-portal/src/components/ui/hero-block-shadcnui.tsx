import React from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowDown, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BlurredStagger } from "./blurred-stagger-text";

export const HeroBlock = React.memo(() => {
  const navigate = useNavigate();

  // Optimized staggered variants for GPU-friendly entry
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
    },
  };

  return (
    <section className="relative flex items-center justify-center overflow-hidden bg-[#F4F6F8] min-h-screen w-full">
      <div className="relative z-10 mx-auto max-w-5xl text-center px-6">
        <motion.div
           variants={containerVariants}
           initial="hidden"
           animate="visible"
           viewport={{ once: true }}
        >
          <motion.h1
            variants={itemVariants}
            className="mb-6 text-7xl font-black text-slate-900 md:text-9xl tracking-tighter flex items-center justify-center"
          >
            <BlurredStagger text="UniZ Portal" className="inline-block" />
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mx-auto mb-10 max-w-3xl text-xl text-slate-500 md:text-2xl font-medium leading-relaxed"
          >
            Campus Administration Portal. <br className="hidden md:block" />
            Empowering students and faculty with seamless digital governance.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex justify-center"
          >
            <Button 
              size="lg" 
              className="rounded-full px-12 h-16 text-lg font-bold gap-3 bg-black text-white hover:bg-slate-800 transition-all shadow-2xl active:scale-95 group" 
              onClick={() => navigate("/student/signin")}
            >
              Explore Portal
              <Zap className="h-5 w-5 fill-current transition-transform group-hover:rotate-12" />
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Optimized Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{
          opacity: { delay: 1, duration: 0.6 },
          y: { delay: 1.2, duration: 1.5, repeat: Infinity },
        }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 transform pointer-events-none"
      >
        <ArrowDown className="h-6 w-6 text-slate-300" />
      </motion.div>
    </section>
  );
});

HeroBlock.displayName = "HeroBlock";
