'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface StallsEmptyStateProps {
  type: 'search' | 'empty';
  onReset?: () => void;
}

export default function StallsEmptyState({ type, onReset }: StallsEmptyStateProps) {
  const messages = {
    search: "I looked everywhere in the market, but I couldn't find that stall. Try another name?",
    empty: "The market is still getting set up! No stalls are registered yet, but they'll be here soon."
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 py-6 px-5 bg-white/[0.03] border border-white/5 rounded-xl max-w-sm mx-auto my-8 shadow-sm"
    >
      <div className="w-10 h-10 shrink-0 bg-[#BDFF00]/10 rounded-full p-1.5 border border-[#BDFF00]/20 flex items-center justify-center">
        <img src="/assets/Pingo_Bot.png" alt="Pingo" className="w-full h-full object-contain filter drop-shadow-[0_0_5px_rgba(189,255,0,0.3)]" />
      </div>
      <div className="flex-1 text-left">
        <p className="text-xs font-bold text-gray-300 leading-tight">
          <span className="text-[#BDFF00] font-black mr-1.5 text-[10px] tracking-wider uppercase">Pingo:</span>
          {messages[type]}
        </p>
        {onReset && (
          <button 
            onClick={onReset}
            className="mt-1.5 text-[9px] font-black text-[#BDFF00]/70 hover:text-[#BDFF00] uppercase tracking-widest transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>
    </motion.div>
  );
}
