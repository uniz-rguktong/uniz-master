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
        "absolute left-1/2 top-1/2 cursor-pointer overflow-hidden rounded-2xl transition-all duration-500 ease-in-out",
        isCenter
          ? "z-10 ring-4 ring-primary/60 shadow-2xl shadow-primary/20"
          : "z-0 ring-2 ring-slate-200 hover:ring-primary/30 shadow-lg",
      )}
      style={{
        width: cardSize,
        height: cardSize * 0.72,
        transform: `
          translate(-50%, -50%) 
          translateX(${(cardSize / 1.4) * position}px)
          translateY(${isCenter ? -10 : position % 2 ? 20 : -20}px)
          rotate(${isCenter ? 0 : position % 2 ? 3 : -3}deg)
          scale(${isCenter ? 1.08 : 0.92})
        `,
        opacity: Math.abs(position) > 3 ? 0 : 1,
      }}
    >
      <img
        src={image.imgSrc}
        alt={`Campus gallery ${image.tempId + 1}`}
        className={clsx(
          "w-full h-full object-cover transition-all duration-500",
          isCenter ? "brightness-100" : "brightness-[0.7]",
        )}
        draggable={false}
      />
      {/* Subtle gradient overlay for non-center cards */}
      {!isCenter && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
      )}
    </div>
  );
};

export function Gallery({ images }: { images: readonly string[] }) {
  const [cardSize, setCardSize] = useState(400);
  const [imageList, setImageList] = useState<GalleryImage[]>([]);

  // Build the image list from props
  useEffect(() => {
    if (images.length > 0) {
      setImageList(
        images.map((src, idx) => ({
          imgSrc: src,
          tempId: idx,
        })),
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

  // Auto-play
  useEffect(() => {
    const interval = setInterval(() => {
      handleMove(1);
    }, 4000);
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
    <section
      id="photo-gallery"
      className="py-24 bg-gradient-to-b from-white via-slate-50 to-white overflow-hidden"
    >
      {/* Section Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
        <div className="text-center">
          <span className="inline-block px-5 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold tracking-wide mb-4">
            Campus Gallery
          </span>
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Life @ Campus
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-500">
            A visual journey through campus life, events, and achievements.
          </p>
        </div>
      </div>

      {/* Stagger Carousel */}
      <div
        className="relative w-full"
        style={{ height: cardSize * 0.72 + 140 }}
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

        {/* Navigation Buttons */}
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-3 z-20">
          <button
            onClick={() => handleMove(-1)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white border-2 border-slate-200 text-slate-700 shadow-lg hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleMove(1)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white border-2 border-slate-200 text-slate-700 shadow-lg hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
