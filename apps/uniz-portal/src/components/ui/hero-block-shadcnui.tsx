import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowDown, LogIn, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function HeroBlock() {
  const navigate = useNavigate();

  return (
    <section className="relative flex items-center justify-center overflow-hidden bg-background min-h-screen w-full">

      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mb-6 text-6xl font-black text-foreground md:text-8xl tracking-tighter"
          >
            UniZ Portal
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mx-auto mb-8 max-w-3xl text-xl text-muted-foreground md:text-2xl font-medium"
          >
            Campus Administration Portal. <br className="hidden md:block" />
            Empowering students and faculty with seamless digital governance.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mb-12 flex flex-wrap justify-center gap-4"
          >
            <Button size="lg" className="rounded-full px-8 h-14 text-lg font-bold gap-2" onClick={() => navigate("/student/signin")}>
              <LogIn className="h-5 w-5" />
              Student Access
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-lg font-bold gap-2 shadow-sm" onClick={() => navigate("/admin/signin")}>
              <ShieldCheck className="h-5 w-5" />
              Admin Portal
            </Button>
          </motion.div>

          {/* Social media links removed as per request */}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 10, 0] }}
        transition={{
          opacity: { delay: 1, duration: 0.6 },
          y: { delay: 1.5, duration: 1.5, repeat: Infinity },
        }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 transform"
      >
        <ArrowDown className="h-6 w-6 text-muted-foreground" />
      </motion.div>
    </section>
  );
}
