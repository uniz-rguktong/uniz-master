"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, useTransform, useSpring, useMotionValue, AnimatePresence, animate } from "framer-motion";
import dynamic from "next/dynamic";
import { ArrowLeft, X, Maximize2 } from "lucide-react";
import { useRouter } from "next/navigation";

// --- Types ---
export type AnimationPhase = "scatter" | "line" | "circle" | "bottom-strip";

interface FlipCardProps {
    src: string;
    title: string;
    index: number;
    total: number;
    phase: AnimationPhase;
    target: { x: number; y: number; rotation: number; scale: number; opacity: number; zIndex?: number };
    isSelected: boolean;
    onClick: () => void;
}

// --- FlipCard Component ---
const IMG_WIDTH = 60;
const IMG_HEIGHT = 85;

function FlipCard({
    src,
    title,
    index,
    total,
    phase,
    target,
    isSelected,
    onClick,
}: FlipCardProps) {
    return (
        <motion.div
            animate={{
                x: target.x,
                y: target.y,
                rotate: target.rotation,
                scale: target.scale,
                opacity: target.opacity,
                zIndex: target.zIndex || 0,
            }}
            transition={{
                type: "spring",
                stiffness: 40,
                damping: 15,
            }}
            style={{
                position: "absolute",
                width: IMG_WIDTH,
                height: IMG_HEIGHT,
                transformStyle: "preserve-3d",
                perspective: "1000px",
            }}
            className="cursor-pointer group"
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            onTap={() => onClick()}
        >
            <motion.div
                className="relative h-full w-full cursor-pointer"
                style={{ transformStyle: "preserve-3d" }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                whileHover={{ rotateY: 180 }}
            >
                {/* Front Face */}
                <div
                    className="absolute inset-0 h-full w-full overflow-hidden rounded-xl shadow-[0_0_15px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.1)] bg-gray-900 border border-white/5"
                    style={{ backfaceVisibility: "hidden" }}
                >
                    <img
                        src={src}
                        alt={`hero-${index}`}
                        className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 transition-colors group-hover:bg-neon/10" />
                </div>

                {/* Back Face */}
                <div
                    className="absolute inset-0 h-full w-full overflow-hidden rounded-xl shadow-[0_0_20px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.2)] bg-black/95 flex flex-col items-center justify-center p-2 border border-neon/40 backdrop-blur-sm"
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                    <div className="text-center">
                        <p className="text-[6px] font-black text-neon uppercase tracking-[0.2em] mb-1 text-glow">Memory Core</p>
                        <p className="text-[8px] font-bold text-white tracking-widest leading-tight uppercase line-clamp-3">{title}</p>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// --- Main Hero Component ---
const FALLBACK_IMAGES = [
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300&q=80",
    "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=300&q=80",
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&q=80",
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&q=80",
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=300&q=80",
    "https://images.unsplash.com/photo-1506765515384-028b60a970df?w=300&q=80",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&q=80",
    "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=300&q=80",
    "https://images.unsplash.com/photo-1500485035595-cbe6f645feb1?w=300&q=80",
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300&q=80",
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&q=80",
    "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=300&q=80",
    "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=300&q=80",
    "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=300&q=80",
    "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=300&q=80",
    "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=300&q=80",
    "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=300&q=80",
    "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=300&q=80",
    "https://images.unsplash.com/photo-1523961131990-5ea7c61b2107?w=300&q=80",
    "https://images.unsplash.com/photo-1496568816309-51d7c20e3b21?w=300&q=80",
];

const lerp = (start: number, end: number, t: number) => start * (1 - t) + end * t;

const createScatterPositions = (count: number) =>
    Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * 1500,
        y: (Math.random() - 0.5) * 1000,
        rotation: (Math.random() - 0.5) * 180,
        scale: 0.6,
        opacity: 0,
    }));

export default function IntroAnimation({
    albums = [],
    onOpenAlbum,
}: {
    albums?: any[];
    onOpenAlbum?: (album: { id?: string; title: string; images: string[] }) => void;
}) {
    const router = useRouter();
    const displayImages = useMemo(
        () =>
            albums.length > 0
                ? albums.map(a => a.coverImage || (a.images && a.images[0]?.url) || FALLBACK_IMAGES[0])
                : FALLBACK_IMAGES,
        [albums]
    );

    const TOTAL_IMAGES = displayImages.length;
    const MAX_SCROLL = 4000;

    const [introPhase, setIntroPhase] = useState<AnimationPhase>("scatter");
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const [selectedImage, setSelectedImage] = useState<number | null>(null);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // --- Container Size ---
    useEffect(() => {
        if (!containerRef.current) return;
        const handleResize = (entries: ResizeObserverEntry[]) => {
            for (const entry of entries) {
                setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height });
            }
        };
        const observer = new ResizeObserver(handleResize);
        observer.observe(containerRef.current);
        setContainerSize({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight });
        return () => observer.disconnect();
    }, []);

    // --- Virtual Scroll Logic ---
    const virtualScroll = useMotionValue(0);
    const scrollRef = useRef(0);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const handleWheel = (e: WheelEvent) => {
            if (selectedImage !== null || isGalleryOpen) return;
            e.preventDefault();
            const newScroll = Math.min(Math.max(scrollRef.current + e.deltaY, 0), MAX_SCROLL);
            scrollRef.current = newScroll;
            virtualScroll.set(newScroll);
        };
        container.addEventListener("wheel", handleWheel, { passive: false });
        // (Simplified touch support for brevity - full version recommended for production)
        return () => container.removeEventListener("wheel", handleWheel);
    }, [virtualScroll, selectedImage, isGalleryOpen]);

    const circleRotate = useTransform(virtualScroll, [0, 1000], [0, -360]);
    const smoothCircleRotate = useSpring(circleRotate, { stiffness: 35, damping: 20 });
    const morphProgress = useTransform(virtualScroll, [1000, 1600], [0, 1]);
    const smoothMorph = useSpring(morphProgress, { stiffness: 40, damping: 20 });
    const arcRotate = useTransform(virtualScroll, [1600, 4000], [0, -360]);
    const smoothArcRotate = useSpring(arcRotate, { stiffness: 40, damping: 20 });

    const autoRotation = useMotionValue(0);
    useEffect(() => {
        const controls = animate(autoRotation, -360, { duration: 30, repeat: Infinity, ease: "linear" });
        return () => controls.stop();
    }, [autoRotation]);

    const mouseX = useMotionValue(0);
    const smoothMouseX = useSpring(mouseX, { stiffness: 30, damping: 20 });

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const handleMouseMove = (e: MouseEvent) => {
            const rect = container.getBoundingClientRect();
            const normalizedX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouseX.set(normalizedX * 100);
        };
        container.addEventListener("mousemove", handleMouseMove);
        return () => container.removeEventListener("mousemove", handleMouseMove);
    }, [mouseX]);

    useEffect(() => {
        const timer1 = setTimeout(() => setIntroPhase("line"), 500);
        const timer2 = setTimeout(() => setIntroPhase("circle"), 2500);
        return () => { clearTimeout(timer1); clearTimeout(timer2); };
    }, []);

    const [scatterPositions, setScatterPositions] = useState<any[]>(() => createScatterPositions(TOTAL_IMAGES));

    useEffect(() => {
        setScatterPositions(createScatterPositions(TOTAL_IMAGES));
    }, [TOTAL_IMAGES]);

    const [morphValue, setMorphValue] = useState(0);
    const [rotateValue, setRotateValue] = useState(0);
    const [circleRotateValue, setCircleRotateValue] = useState(0);
    const [autoRotateValue, setAutoRotateValue] = useState(0);
    const [parallaxValue, setParallaxValue] = useState(0);
    const [currentScroll, setCurrentScroll] = useState(0);

    useEffect(() => {
        const unsubscribeMorph = smoothMorph.on("change", setMorphValue);
        const unsubscribeRotate = smoothArcRotate.on("change", setRotateValue);
        const unsubscribeCircle = smoothCircleRotate.on("change", setCircleRotateValue);
        const unsubscribeAuto = autoRotation.on("change", setAutoRotateValue);
        const unsubscribeParallax = smoothMouseX.on("change", setParallaxValue);
        const unsubscribeScroll = virtualScroll.on("change", setCurrentScroll);
        return () => {
            unsubscribeMorph(); unsubscribeRotate(); unsubscribeCircle();
            unsubscribeAuto(); unsubscribeParallax(); unsubscribeScroll();
        };
    }, [smoothMorph, smoothArcRotate, smoothCircleRotate, autoRotation, smoothMouseX, virtualScroll]);

    const contentOpacity = useTransform(smoothMorph, [0.8, 1], [0, 1]);
    const contentY = useTransform(smoothMorph, [0.8, 1], [20, 0]);

    const handleCardClick = (index: number) => {
        const album = albums[index];
        const albumImages = Array.isArray(album?.images)
            ? album.images.map((img: any) => (typeof img === "string" ? img : img?.url)).filter(Boolean)
            : [];
        const fallbackImage = displayImages[index];
        const usableImages = albumImages.length > 0
            ? albumImages
            : (fallbackImage ? [fallbackImage] : []);

        if (onOpenAlbum) {
            const fallbackTitle = album?.title || `Album ${index + 1}`;
            setSelectedImage(null);
            setIsGalleryOpen(false);
            onOpenAlbum({
                id: album?.id,
                title: fallbackTitle,
                images: usableImages,
            });
            return;
        }

        if (selectedImage === index) {
            setIsGalleryOpen(true);
            return;
        }

        const isMobile = containerSize.width < 768;
        let targetScroll = 0;

        if (currentScroll < 1300) {
            const cardBaseAngle = (index / TOTAL_IMAGES) * 360;
            let targetCircleRotation = -90 - cardBaseAngle;
            while (targetCircleRotation < 0) targetCircleRotation += 360;
            targetCircleRotation = targetCircleRotation % 360;
            targetScroll = (targetCircleRotation / 360) * 1000;
        } else {
            const spreadAngle = isMobile ? 100 : 130;
            const maxRotation = spreadAngle * 0.8;
            const step = spreadAngle / (TOTAL_IMAGES - 1);
            const targetProgress = ((index * step) - (spreadAngle / 2)) / maxRotation;
            const clampedProgress = Math.min(Math.max(targetProgress, 0), 1);
            targetScroll = 1600 + (clampedProgress * (4000 - 1600));
        }

        scrollRef.current = targetScroll;
        virtualScroll.set(targetScroll);
        setTimeout(() => setSelectedImage(index), 500);
    };

    const handleBackToHub = () => {
        router.push("/home");
    };

    return (
        <div ref={containerRef} className="relative w-full h-full bg-black overflow-hidden font-orbitron">
            <div className="space-bg opacity-50" />

            {/* Back Button */}
            <button
                type="button"
                onClick={handleBackToHub}
                className="absolute top-10 left-10 z-220 pointer-events-auto flex items-center gap-4 px-8 py-3 text-white/70 hover:text-neon transition-all group backdrop-blur-xl bg-black/60 border-l border-r border-neon/30 hover:border-neon hover:shadow-[0_0_20px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.2)] [clip-path:polygon(18px_0,100%_0,calc(100%-18px)_100%,0_100%)]"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-[10px] font-black tracking-[0.5em] uppercase">Abort to Hub</span>
            </button>

            {/* Circular Gallery Overlay */}
            <AnimatePresence>
                {isGalleryOpen && selectedImage !== null && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, backdropFilter: "blur(0px)" }}
                        animate={{ opacity: 1, scale: 1, backdropFilter: "blur(20px)" }}
                        exit={{ opacity: 0, scale: 1.1, backdropFilter: "blur(0px)" }}
                        className="fixed inset-0 z-200 bg-black/80 flex flex-col items-center justify-center p-0"
                    >
                        <button
                            onClick={() => setIsGalleryOpen(false)}
                            className="absolute top-10 right-10 z-210 p-4 rounded-full border border-white/20 text-white hover:text-neon hover:border-neon transition-all group backdrop-blur-md"
                        >
                            <span className="text-xs font-black tracking-[0.3em] uppercase">Close Gallery</span>
                        </button>

                        <div className="absolute inset-0 z-0 flex items-center justify-center p-4">
                            <motion.img
                                key={selectedImage}
                                initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                                src={displayImages[selectedImage]}
                                className="max-w-full max-h-[70vh] object-contain shadow-[0_0_50px_rgba(var(--color-neon-rgb,57,255,20),0.2)] rounded-lg border border-white/10"
                            />
                        </div>

                        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center pointer-events-none">
                            <p className="text-neon text-[10px] font-black tracking-[0.5em] uppercase mb-2">Album Segment</p>
                            <h3 className="text-white text-3xl font-black tracking-widest uppercase">
                                {albums[selectedImage]?.title || (selectedImage < displayImages.length ? `EXPLORATION SECTOR ${selectedImage + 1}` : "MISSION DATA")}
                            </h3>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex h-full w-full flex-col items-center justify-center perspective-1000 relative z-10">
                <div className="absolute z-0 flex flex-col items-center justify-center text-center pointer-events-none top-1/2 -translate-y-1/2">
                    <motion.h1
                        animate={introPhase === "circle" && morphValue < 0.5 ? { opacity: 1 - morphValue * 2, filter: "blur(0px)" } : { opacity: 0, filter: "blur(10px)" }}
                        className="text-2xl font-black tracking-widest text-neon text-glow md:text-5xl uppercase"
                    >
                        Capturing Every Stellar Moment.
                    </motion.h1>
                    <motion.p
                        animate={introPhase === "circle" && morphValue < 0.5 ? { opacity: 0.5 - morphValue } : { opacity: 0 }}
                        className="mt-4 text-xs font-bold tracking-[0.5em] text-gray-400"
                    >
                        SCROLL TO EXPLORE
                    </motion.p>
                </div>

                <motion.div
                    style={{ opacity: contentOpacity, y: contentY }}
                    className="absolute top-[10%] z-10 flex flex-col items-center justify-center text-center pointer-events-none px-4"
                >
                    <h2 className="text-3xl md:text-6xl font-black text-white tracking-[0.2em] text-glow mb-4 uppercase">Explore Our Vision</h2>
                    <p className="text-sm md:text-base text-gray-400 max-w-lg leading-relaxed font-medium tracking-wide">
                        Discover a world where technology meets creativity. Scroll through our curated collection of innovations.
                    </p>
                </motion.div>

                <div className="relative flex items-center justify-center w-full h-full">
                    <AnimatePresence>
                        {selectedImage !== null && (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 z-0 bg-black/60 backdrop-blur-md cursor-pointer"
                                onClick={() => setSelectedImage(null)}
                            />
                        )}
                    </AnimatePresence>

                    {displayImages.slice(0, TOTAL_IMAGES).map((src, i) => {
                        let target = { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1, zIndex: 0 };
                        if (introPhase === "scatter") {
                            target = { ...scatterPositions[i], zIndex: 0 };
                        } else if (introPhase === "line") {
                            const lineSpacing = 70;
                            const lineX = i * lineSpacing - (TOTAL_IMAGES * lineSpacing) / 2;
                            target = { x: lineX, y: 0, rotation: 0, scale: 1, opacity: 1, zIndex: 0 };
                        } else {
                            const isMobile = containerSize.width < 768;
                            const minDimension = Math.min(containerSize.width, containerSize.height);
                            const circleRadius = Math.min(minDimension * 0.35, 350);
                            const circleAngle = (i / TOTAL_IMAGES) * 360 + circleRotateValue + (autoRotateValue * (1 - morphValue));
                            const circleRad = (circleAngle * Math.PI) / 180;
                            const circlePos = { x: Math.cos(circleRad) * circleRadius, y: Math.sin(circleRad) * circleRadius, rotation: circleAngle + 90 };

                            const baseRadius = Math.min(containerSize.width, containerSize.height * 1.5);
                            const arcRadius = baseRadius * (isMobile ? 1.4 : 1.1);
                            const arcApexY = containerSize.height * (isMobile ? 0.35 : 0.25);
                            const arcCenterY = arcApexY + arcRadius;
                            const spreadAngle = isMobile ? 100 : 130;
                            const currentArcAngle = (-90 - (spreadAngle / 2)) + (i * (spreadAngle / (TOTAL_IMAGES - 1))) + (-Math.min(Math.max(rotateValue / 360, 0), 1) * spreadAngle * 0.8);
                            const arcRad = (currentArcAngle * Math.PI) / 180;
                            const arcPos = { x: Math.cos(arcRad) * arcRadius + parallaxValue, y: Math.sin(arcRad) * arcRadius + arcCenterY, rotation: currentArcAngle + 90, scale: isMobile ? 1.4 : 1.8 };

                            target = {
                                x: lerp(circlePos.x, arcPos.x, morphValue),
                                y: lerp(circlePos.y, arcPos.y, morphValue),
                                rotation: lerp(circlePos.rotation, arcPos.rotation, morphValue),
                                scale: lerp(1, arcPos.scale, morphValue),
                                opacity: 1, zIndex: 10,
                            };

                            if (selectedImage === i) {
                                target = { x: 0, y: isMobile ? -50 : -80, rotation: 0, scale: isMobile ? 4.5 : 5.5, opacity: 1, zIndex: 100 };
                            } else if (selectedImage !== null) {
                                target.opacity = 0.1; target.scale *= 0.8; target.zIndex = 0;
                            }
                        }

                        return (
                            <FlipCard
                                key={i}
                                src={src}
                                title={albums[i]?.title || (i < displayImages.length ? `SECTOR ${i + 1}` : "MISSION DATA")}
                                index={i}
                                total={TOTAL_IMAGES}
                                phase={introPhase}
                                target={target}
                                isSelected={selectedImage === i}
                                onClick={() => handleCardClick(i)}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
