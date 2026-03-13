'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Images, Maximize2 } from 'lucide-react';
import Image from 'next/image';
import GalleryLightbox from './GalleryLightbox';

function PhotoGrid({ images, onPhotoClick }: { images: string[]; onPhotoClick: (url: string) => void }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 p-2 sm:p-4 max-w-7xl mx-auto">
      {images.map((img, i) => (
        <motion.div
          key={`${img}-${i}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.02, duration: 0.3 }}
          className="relative overflow-hidden group cursor-pointer border border-white/5 bg-white/5 aspect-square"
          onClick={() => onPhotoClick(img)}
        >
          <Image src={img} alt={`Archive ${i + 1}`} fill sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" loading="lazy" />
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
          <div className="absolute bottom-3 right-3 p-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-all">
            <Maximize2 className="w-3 h-3 text-white" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function GalleryAlbumViewer({
  album,
  onClose,
}: {
  album: { title: string; images: string[] };
  onClose: () => void;
}) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.35 }}
        className="fixed inset-0 z-400 bg-[#030308] overflow-y-auto scrollbar-hide"
      >
        <div className="sticky top-0 z-50 bg-[#030308]/90 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <button onClick={onClose} className="group flex items-center gap-2 px-4 py-2 text-white/60 hover:text-neon transition-all bg-white/5 border border-white/10 hover:border-neon/50">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-[10px] font-black tracking-[0.3em] uppercase">Return</span>
            </button>
            <div>
              <span className="text-[8px] text-neon font-bold tracking-[0.5em] uppercase opacity-60">Album Collection</span>
              <h3 className="text-xl font-black text-white tracking-widest uppercase">{album.title}</h3>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/5 rounded-full">
            <Images className="w-4 h-4 text-white/30" />
            <span className="text-[10px] font-black tracking-widest text-white/40 uppercase">{album.images.length} ARCHIVES</span>
          </div>
        </div>

        <div className="pb-24">
          <PhotoGrid images={album.images} onPhotoClick={setSelectedPhoto} />
        </div>

        <AnimatePresence>
          {selectedPhoto && (
            <GalleryLightbox
              url={selectedPhoto}
              onClose={() => setSelectedPhoto(null)}
              total={album.images.length}
              current={album.images.indexOf(selectedPhoto) + 1}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
