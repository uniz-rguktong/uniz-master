'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Camera } from 'lucide-react';

type AlbumItem = {
  id: string;
  title: string;
  coverImage: string;
  count: number;
  color: string;
};

export default function GalleryAlbumGrid({
  albums,
  onOpen,
  emptyMessage,
}: {
  albums: AlbumItem[];
  onOpen: (id: string) => void;
  emptyMessage?: string;
}) {
  if (albums.length === 0) {
    return (
      <div className="col-span-full py-20 text-center opacity-40">
        <Camera className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <p className="text-xl font-black tracking-widest uppercase">{emptyMessage || 'No Archives Found'}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {albums.map((album, i) => (
        <motion.button
          key={album.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03, duration: 0.35 }}
          className="group relative cursor-pointer h-56 text-left"
          onClick={() => onOpen(album.id)}
        >
          <div className="absolute -inset-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-lg pointer-events-none z-0 rounded-sm" style={{ background: `${album.color}40` }} />

          <div className="relative z-10 h-full overflow-hidden border border-white/10 group-hover:border-white/40 transition-all duration-300 bg-[#09090f]">
            <div className="h-40 relative overflow-hidden">
              <Image
                src={album.coverImage}
                alt={album.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                className="object-cover opacity-55 group-hover:opacity-85 group-hover:scale-110 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-linear-to-t from-[#09090f] via-transparent to-transparent" />
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: album.color }} />
            </div>
            <div className="p-4">
              <h3 className="text-sm font-black text-white uppercase tracking-widest leading-tight truncate">{album.title}</h3>
              <p className="text-[9px] text-white/50 font-bold tracking-widest uppercase mt-1">{album.count} photos</p>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
