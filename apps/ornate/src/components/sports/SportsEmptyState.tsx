'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SportsEmptyStateProps {
  type: 'schedule' | 'results';
  onReset?: () => void;
}

export default function SportsEmptyState({ type, onReset }: SportsEmptyStateProps) {
  const messages = {
    schedule: "I couldn't find any upcoming matches here. Maybe they're still in the locker room? Try another search!",
    results: "No results matched your search. Looks like the scoreboard is taking a break. Try resetting the filters!"
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 py-6 px-5 bg-white/[0.03] border border-white/5 rounded-xl max-w-sm mx-auto my-8 shadow-sm"
    >
      <div className="w-10 h-10 shrink-0 bg-amber-400/10 rounded-full p-1.5 border border-amber-400/20 flex items-center justify-center">
        <img src="/assets/Pingo_Bot.png" alt="Pingo" className="w-full h-full object-contain filter drop-shadow-[0_0_5px_rgba(251,191,36,0.3)]" />
      </div>
      <div className="flex-1 text-left">
        <p className="text-xs font-bold text-gray-300 leading-tight">
          <span className="text-amber-400 font-black mr-1.5 text-[10px] tracking-wider uppercase">Pingo:</span>
          {messages[type]}
        </p>
        {onReset && (
          <button 
            onClick={onReset}
            className="mt-1.5 text-[9px] font-black text-amber-400/70 hover:text-amber-400 uppercase tracking-widest transition-colors"
          >
            Reset Filters
          </button>
        )}
      </div>
    </motion.div>
  );
}
