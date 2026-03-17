'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CulturalsEmptyStateProps {
  type: 'highlights' | 'gallery' | 'promos';
  onReset?: () => void;
}

export default function CulturalsEmptyState({ type, onReset }: CulturalsEmptyStateProps) {
  const messages = {
    highlights: "I'm still scanning for today's top acts. Looks like the stage is warming up! Check back in a bit.",
    gallery: "Our archival lens is still focusing. No captures have been uploaded to this sector yet!",
    promos: "The cinematic feeds are currently offline. We're rendering some epic content for you as we speak!"
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 py-6 px-5 bg-white/[0.03] border border-white/5 rounded-xl max-w-sm mx-auto my-8 shadow-sm"
    >
      <div className="w-10 h-10 shrink-0 bg-[#22d3ee]/10 rounded-full p-1.5 border border-[#22d3ee]/20 flex items-center justify-center">
        <img src="/assets/Pingo_Bot.png" alt="Pingo" className="w-full h-full object-contain filter drop-shadow-[0_0_5px_rgba(34,211,238,0.3)]" />
      </div>
      <div className="flex-1 text-left">
        <p className="text-xs font-bold text-gray-300 leading-tight">
          <span className="text-[#22d3ee] font-black mr-1.5 text-[10px] tracking-wider uppercase">Pingo:</span>
          {messages[type]}
        </p>
        {onReset && (
          <button 
            onClick={onReset}
            className="mt-1.5 text-[9px] font-black text-[#22d3ee]/70 hover:text-[#22d3ee] uppercase tracking-widest transition-colors"
          >
            Refresh Feed
          </button>
        )}
      </div>
    </motion.div>
  );
}
