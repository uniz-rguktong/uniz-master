'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface UpdatesEmptyStateProps {
  onReset?: () => void;
}

export default function UpdatesEmptyState({ onReset }: UpdatesEmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 py-6 px-5 bg-white/[0.03] border border-white/5 rounded-xl max-w-sm mx-auto my-8 shadow-sm"
    >
      <div className="w-10 h-10 shrink-0 bg-[var(--color-neon)]/10 rounded-full p-1.5 border border-[var(--color-neon)]/20 flex items-center justify-center">
        <img src="/assets/Pingo_Bot.png" alt="Pingo" className="w-full h-full object-contain filter drop-shadow-[0_0_5px_rgba(57,255,20,0.3)]" />
      </div>
      <div className="flex-1 text-left">
        <p className="text-xs font-bold text-gray-300 leading-tight">
          <span className="text-[var(--color-neon)] font-black mr-1.5 text-[10px] tracking-wider uppercase">Pingo:</span>
          No frequency matches detected! My sensors are clean, but your filters might be a bit tight. Try loosening them up!
        </p>
        {onReset && (
          <button 
            onClick={onReset}
            className="mt-1.5 text-[9px] font-black text-[var(--color-neon)]/70 hover:text-[var(--color-neon)] uppercase tracking-widest transition-colors"
          >
            Reset Filters
          </button>
        )}
      </div>
    </motion.div>
  );
}
