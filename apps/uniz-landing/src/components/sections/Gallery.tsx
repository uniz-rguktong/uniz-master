import React, { useState, useEffect } from "react";
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

export function Gallery({ images }: { images: readonly string[] }) {
  const [cardSize, setCardSize] = useState(400);
  const [imageList, setImageList] = useState<GalleryImage[]>([]);

  useEffect(() => {
    if (images.length > 0) {
      setImageList(
        images.map((src, idx) => ({
          imgSrc: src,
          tempId: idx,
        }))
      );
    }
  }, [images]);

  const handleMove = (steps: number) => {
    const newList = [...imageList];
    if (steps > 0) {
      for (let i = steps; i > 0; i--) {
        const item = newList.shift();
        if (!item) return;
        newList.push({ ...item, tempId: Math.random() });
      }
    } else {
      for (let i = steps; i < 0; i++) {
        const item = newList.pop();
        if (!item) return;
        newList.unshift({ ...item, tempId: Math.random() });
      }
    }
    setImageList(newList);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      handleMove(1);
    }, 5000);
    return () => clearInterval(interval);
  }, [imageList]);

  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      if (width >= 1280) setCardSize(420);
      else if (width >= 1024) setCardSize(380);
      else if (width >= 640) setCardSize(320);
      else setCardSize(260);
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  if (!imageList.length) return null;

  return (
    <section id="photo-gallery" className="section-editorial bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 mb-12 sm:mb-16">
        <div className="max-w-2xl">
          <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-[#800000] mb-4">
            Campus Gallery
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[#000035] leading-tight">
            Life @ campus
          </h2>
          <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed">
            A visual journey through campus life, events, and achievements.
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
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 text-[#000035] hover:bg-[#000035] hover:text-white hover:border-[#000035] transition-colors"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleMove(1)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 text-[#000035] hover:bg-[#000035] hover:text-white hover:border-[#000035] transition-colors"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
