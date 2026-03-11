"use client";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import React, { useEffect, useState } from "react";

export const ImagesSlider = ({
    images,
    children,
    overlay = true,
    overlayClassName,
    className,
    autoplay = true,
    direction = "up",
}: {
    images: string[];
    children: React.ReactNode;
    overlay?: React.ReactNode;
    overlayClassName?: string;
    className?: string;
    autoplay?: boolean;
    direction?: "up" | "down";
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [_, setLoading] = useState(false);
    const [loadedImages, setLoadedImages] = useState<string[]>([]);

    const handleNext = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex + 1 === images.length ? 0 : prevIndex + 1
        );
    };

    const handlePrevious = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex - 1 < 0 ? images.length - 1 : prevIndex - 1
        );
    };

    useEffect(() => {
        loadImages();
    }, [images]); // Empty dependency array removed, depends on images properly now

    const loadImages = () => {
        setLoading(true);
        const loadPromises = images.map((image) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.src = image;
                img.onload = () => resolve(image);
                img.onerror = reject;
            });
        });

        Promise.all(loadPromises)
            .then((loadedImages) => {
                setLoadedImages(loadedImages as string[]);
                setLoading(false);
            })
            .catch((error) => console.error("Failed to load images", error));
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "ArrowRight") handleNext();
            else if (event.key === "ArrowLeft") handlePrevious();
        };

        window.addEventListener("keydown", handleKeyDown);

        let interval: any;
        if (autoplay) {
            interval = setInterval(() => {
                handleNext();
            }, 5000);
        }

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            clearInterval(interval);
        };
    }, [autoplay]); // Dependencies added properly

    const slideVariants = {
        initial: {
            scale: 1,
            opacity: 0,
            filter: "contrast(1.2) brightness(0.8)",
        },
        visible: {
            scale: 1.05,
            opacity: 1,
            filter: "contrast(1.05) brightness(1)",
            transition: {
                scale: { duration: 15, ease: "linear" as const }, // Extremely slow pan
                opacity: { duration: 1, ease: "easeInOut" as const },
                filter: { duration: 1, ease: "easeInOut" as const },
            },
        },
        upExit: {
            opacity: 0,
            filter: "contrast(0.8) brightness(0.5)",
            transition: { duration: 1, ease: "easeInOut" as const },
        },
        downExit: {
            opacity: 0,
            filter: "contrast(0.8) brightness(0.5)",
            transition: { duration: 1, ease: "easeInOut" as const },
        },
    };

    const areImagesLoaded = loadedImages.length > 0;

    return (
        <div
            className={cn(
                "overflow-hidden h-full w-full relative flex items-center justify-center bg-black",
                className
            )}
        >
            {areImagesLoaded && children}
            {areImagesLoaded && overlay && (
                <div
                    className={cn("absolute inset-0 z-10", overlayClassName)}
                    style={{
                        background: "radial-gradient(circle at center, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%), linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 100%)"
                    }}
                />
            )}
            {areImagesLoaded && (
                <AnimatePresence>
                    <motion.img
                        key={currentIndex}
                        src={loadedImages[currentIndex]}
                        initial="initial"
                        animate="visible"
                        exit={direction === "up" ? "upExit" : "downExit"}
                        variants={slideVariants}
                        className="absolute inset-0 h-full w-full object-cover object-center"
                    />
                </AnimatePresence>
            )}
        </div>
    );
};
