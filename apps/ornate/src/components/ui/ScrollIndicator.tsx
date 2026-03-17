'use client';

import { motion } from 'framer-motion';
import { MousePointer2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ScrollIndicator({ 
  color = 'var(--color-neon)',
  align = 'right'
}: { 
  color?: string,
  align?: 'left' | 'right'
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2, duration: 1 }}
      className={cn(
        "fixed z-[100] flex flex-col items-center gap-3 pointer-events-none transition-all duration-500",
        align === 'left' ? "bottom-10 left-10" : "bottom-10 right-10",
        "max-sm:top-16 max-sm:bottom-auto max-sm:right-4 max-sm:left-auto"
      )}
    >
      <div className="flex flex-col items-center gap-2">
        <motion.div
          animate={{
            y: [0, 12, 0],
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-5 h-8 border-2 rounded-full flex justify-center p-1"
          style={{ borderColor: `${color}80` }}
        >
          <motion.div 
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1 h-2 rounded-full" 
            style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
          />
        </motion.div>
        
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-black tracking-[0.4em] uppercase text-white/40 mb-1">
            Navigation
          </span>
          <span className="text-[11px] font-black tracking-[0.2em] uppercase drop-shadow-[0_0_8px_rgba(0,255,171,0.3)]" style={{ color }}>
            Scroll to Explore
          </span>
        </div>
      </div>

      {/* Subtle background glow */}
      <div className="absolute inset-x-[-20px] inset-y-[-10px] blur-3xl rounded-full -z-10" style={{ backgroundColor: `${color}0D` }} />
    </motion.div>
  );
}
