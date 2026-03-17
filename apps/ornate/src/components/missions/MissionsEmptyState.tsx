'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface MissionsEmptyStateProps {
  type: 'search' | 'saved' | 'general' | 'trending' | 'new' | 'all';
  onReset?: () => void;
}

export default function MissionsEmptyState({ type, onReset }: MissionsEmptyStateProps) {
  const messages = {
    search: "Whoops! I couldn't find anything for that. Maybe try another word?",
    saved: "Your list is empty! Want to go find some cool missions to save?",
    all: "The mission board is empty for now. I'm still checking around!",
    trending: "Nothing's trending right now. You could be the first to start the trend!",
    new: "I'm still fetching the latest missions from HQ. Check back in a bit!",
    general: "Nothing here yet! Let's explore some other sectors for now."
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 py-6 px-5 bg-white/[0.03] border border-white/5 rounded-xl max-w-sm mx-auto my-4 shadow-sm"
    >
      <div className="w-10 h-10 shrink-0 bg-neon/10 rounded-full p-1.5 border border-neon/20 flex items-center justify-center">
        <img src="/assets/Pingo_Bot.png" alt="Pingo" className="w-full h-full object-contain filter drop-shadow-[0_0_5px_rgba(var(--color-neon-rgb,57,255,20),0.3)]" />
      </div>
      <div className="flex-1 text-left">
        <p className="text-xs font-bold text-gray-300 leading-tight">
          <span className="text-neon font-black mr-1.5 text-[10px] tracking-wider uppercase">Pingo:</span>
          {messages[type]}
        </p>
        {onReset && (
          <button 
            onClick={onReset}
            className="mt-1.5 text-[9px] font-black text-neon/70 hover:text-neon uppercase tracking-widest transition-colors"
          >
            Clear Search
          </button>
        )}
      </div>
    </motion.div>
  );
}
