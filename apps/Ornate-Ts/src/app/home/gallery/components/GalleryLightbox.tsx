'use client';

import { motion } from 'framer-motion';
import { X, Download } from 'lucide-react';

export default function GalleryLightbox({
  url,
  onClose,
  total,
  current,
}: {
  url: string;
  onClose: () => void;
  total: number;
  current: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4 sm:p-12"
      onClick={onClose}
    >
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10">
        <div className="flex flex-col">
          <span className="text-[9px] text-neon font-black tracking-[0.4em] uppercase mb-1">Visual Archive</span>
          <span className="text-sm text-white/50 font-bold tracking-widest uppercase">{current} <span className="text-white/20">/</span> {total}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Download button - visible on all variants, but primarily requested for mobile */}
          <button 
            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-neon transition-all" 
            onClick={async (e) => {
              e.stopPropagation();
              try {
                const response = await fetch(url);
                const blob = await response.blob();
                const blobUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = `ornate_archive_${Date.now()}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(blobUrl);
              } catch (error) {
                // Fallback for CORS issues
                const a = document.createElement('a');
                a.href = url;
                a.download = `ornate_archive_${Date.now()}.png`;
                a.target = "_blank";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }
            }}
            title="Download Image"
          >
            <Download className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button 
            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-neon transition-all" 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            title="Close"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>

      <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <motion.img
          src={url}
          className="max-w-full max-h-full object-contain shadow-[0_0_100px_rgba(var(--color-neon-rgb),0.1)] select-none"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          alt="Gallery photo"
        />
      </div>
    </motion.div>
  );
}
