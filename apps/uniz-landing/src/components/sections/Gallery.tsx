import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";

interface GalleryImage {
  imgSrc: string;
  tempId: number;
}

interface ImageCardProps {
  position: number;
  image: GalleryImage;
  handleMove: (steps: number) => void;
  cardSize: number;
}

const ImageCard: React.FC<ImageCardProps> = ({
  position,
  image,
  handleMove,
  cardSize,
}) => {
  const isCenter = position === 0;

  return (
    <div
      onClick={() => handleMove(position)}
      className={clsx(
        "absolute left-1/2 top-1/2 cursor-pointer overflow-hidden transition-all duration-500 ease-in-out",
        isCenter ? "z-10 shadow-xl" : "z-0 shadow-md"
      )}
      style={{
        width: cardSize,
        height: cardSize * 0.72,
        transform: `
          translate(-50%, -50%) 
          translateX(${(cardSize / 1.4) * position}px)
          scale(${isCenter ? 1.05 : 0.92})
        `,
        opacity: Math.abs(position) > 3 ? 0 : isCenter ? 1 : 0.65,
      }}
    >
      <img
        src={image.imgSrc}
        alt={`Campus gallery ${image.tempId + 1}`}
        className={clsx(
          "w-full h-full object-cover transition-all duration-500",
          isCenter ? "brightness-100" : "brightness-[0.75]"
        )}
        draggable={false}
      />
    </div>
  );
};

function cardSizeForWidth(width: number) {
  if (width >= 1280) return 420;
  if (width >= 1024) return 380;
  if (width >= 640) return 320;
  return 260;
}

export function Gallery({ images }: { images: readonly string[] }) {
  const [cardSize, setCardSize] = useState(() =>
    typeof window === "undefined" ? 400 : cardSizeForWidth(window.innerWidth),
  );
  const imagesKey = images.join("\0");
  const [imageList, setImageList] = useState<GalleryImage[]>(() =>
    images.map((src, idx) => ({ imgSrc: src, tempId: idx })),
  );
  const [seenKey, setSeenKey] = useState(imagesKey);
  if (seenKey !== imagesKey) {
    setSeenKey(imagesKey);
    setImageList(images.map((src, idx) => ({ imgSrc: src, tempId: idx })));
  }

  const handleMove = useCallback((steps: number) => {
    setImageList((current) => {
      if (current.length === 0) return current;
      const newList = [...current];
      if (steps > 0) {
        for (let i = steps; i > 0; i--) {
          const item = newList.shift();
          if (!item) return current;
          newList.push({ ...item, tempId: Math.random() });
        }
      } else {
        for (let i = steps; i < 0; i++) {
          const item = newList.pop();
          if (!item) return current;
          newList.unshift({ ...item, tempId: Math.random() });
        }
      }
      return newList;
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      handleMove(1);
    }, 5000);
    return () => clearInterval(interval);
  }, [handleMove]);

  useEffect(() => {
    const updateSize = () => setCardSize(cardSizeForWidth(window.innerWidth));
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  if (!imageList.length) return null;

  return (
    <section id="photo-gallery" className="section-editorial bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 mb-12 sm:mb-16">
        <div className="max-w-2xl">
          <p className="text-sm text-ink-muted mb-3">Campus gallery</p>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-navy-900 leading-tight">
            Campus photos
          </h2>
          <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed">
            Events, facilities, and student life at RGUKT Ongole.
          </p>
        </div>
      </div>

      <div
        className="relative w-full"
        style={{ height: cardSize * 0.72 + 120 }}
      >
        {imageList.map((image, index) => {
          const position =
            imageList.length % 2
              ? index - (imageList.length + 1) / 2
              : index - imageList.length / 2;
          return (
            <ImageCard
              key={image.tempId}
              image={image}
              handleMove={handleMove}
              position={position}
              cardSize={cardSize}
            />
          );
        })}

        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-3 z-20">
          <button
            onClick={() => handleMove(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 text-navy-900 hover:bg-navy-900 hover:text-white hover:border-navy-900 transition-colors"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleMove(1)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 text-navy-900 hover:bg-navy-900 hover:text-white hover:border-navy-900 transition-colors"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
