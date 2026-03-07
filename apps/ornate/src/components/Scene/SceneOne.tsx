'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

import SplitText from '@/components/UI/SplitText';
import TextType from '@/components/UI/TextType';
import AuthForm from '@/components/UI/AuthForm';
import ScrollIndicators from '@/components/UI/ScrollIndicators';
import { useRouter } from 'next/navigation';
import { getAssetUrl } from '@/lib/assets';

gsap.registerPlugin(ScrollTrigger);

/**
 * Text7Block — renders text-7 as a single animated block.
 * Entire h2 fades + drifts up together (no per-char/word splitting).
 * Container-level exit is handled by the parent frame-based GSAP.
 */
function Text7Block() {
    const ref = useRef<HTMLHeadingElement>(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        // Pin invisible before first paint
        gsap.set(el, { opacity: 0, y: 50, filter: 'blur(6px)' });
        // One-shot entry: whole block rises and sharpens together
        gsap.to(el, {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 1.2,
            ease: 'power3.out',
            delay: 0.05,
        });
        return () => { gsap.killTweensOf(el); };
    }, []);
    return (
        <h2
            ref={ref}
            className="text-center text-3xl sm:text-5xl md:text-7xl font-bold tracking-tighter text-white leading-[1.1]"
        >
            Planets for each branch, stars for your talents, and fun that&apos;s out of this world.
        </h2>
    );
}

const FRAME_COUNT_1 = 120;
const FRAME_COUNT_2 = 120;
const FRAME_COUNT_3 = 120;
const FRAME_COUNT_4 = 120;
const FRAME_COUNT_5 = 120;
const FRAME_COUNT_6 = 120;
const TOTAL_FRAMES = FRAME_COUNT_1 + FRAME_COUNT_2 + FRAME_COUNT_3 + FRAME_COUNT_4 + FRAME_COUNT_5 + FRAME_COUNT_6;
const IMAGES_PATH_1 = getAssetUrl('/assets/scene-1a/2fab1575-3709-4e41-a285-dcfd5941cd13_');
const IMAGES_PATH_2 = getAssetUrl('/assets/scene-1b/488422f7-dcac-4b00-a518-61d0d141a417_');
const IMAGES_PATH_3 = getAssetUrl('/assets/scene-1c/5df2306f-4dfc-49e3-8e28-ab5bf923e625_');
const IMAGES_PATH_4 = getAssetUrl('/assets/scene-1d/32c52baa-7487-46ea-9d58-a3f18f4ad9e3_');
const IMAGES_PATH_5 = getAssetUrl('/assets/scene-1e/a2ca7121-d62c-4635-aee7-8e5e3bd2cc54_');
const IMAGES_PATH_6 = getAssetUrl('/assets/scene-1f/bad9d594-cca8-496c-927d-0af09c3958c2_');

export default function SceneOne({ introComplete = false }: { introComplete?: boolean }) {
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wormholeVideoRef = useRef<HTMLVideoElement>(null);
    const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES).fill(null));
    const [isLoaded, setIsLoaded] = useState(false);
    const [showWormhole, setShowWormhole] = useState(false);
    const [isWarpingActive, setIsWarpingActive] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [showScene1aText, setShowScene1aText] = useState(false);
    const [showScene1bText, setShowScene1bText] = useState(false);
    const [showScene3Text, setShowScene3Text] = useState(false);
    const [showScene4Text, setShowScene4Text] = useState(false);
    const [showScene5Text, setShowScene5Text] = useState(false);
    const [showScene6Text, setShowScene6Text] = useState(false);
    const [showScene7Text, setShowScene7Text] = useState(false);
    const [showScene8Text, setShowScene8Text] = useState(false);
    const [showScene9Text, setShowScene9Text] = useState(false);
    const [showScene10Text, setShowScene10Text] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        setIsDesktop(window.innerWidth >= 1024);
        const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Refs to gate frame-based text transitions (fire exactly once per threshold crossing)
    const text1FadeStartedRef = useRef(false);
    const text2ShownRef = useRef(false);
    const text2HideStartedRef = useRef(false);
    const text3ShownRef = useRef(false);
    const text3HideStartedRef = useRef(false);
    const text4ShownRef = useRef(false);
    const text4HideStartedRef = useRef(false);
    const text5ShownRef = useRef(false);
    const text5HideStartedRef = useRef(false);
    const text6ShownRef = useRef(false);
    const text6HideStartedRef = useRef(false);
    const text7ShownRef = useRef(false);
    const text7HideStartedRef = useRef(false);
    const text8ShownRef = useRef(false);
    const text8HideStartedRef = useRef(false);
    const text9ShownRef = useRef(false);
    const text9HideStartedRef = useRef(false);
    const text10ShownRef = useRef(false);
    const text10HideStartedRef = useRef(false);
    // Auto-exit timers for text-4 and text-5 (time-based, 2.5 s after entry completes)
    const text4ExitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const text5ExitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Show Scene 1A text 2 seconds after intro logo animation completes
    // Implement 15 frames per second auto-scroll down the scene.
    useEffect(() => {
        if (!introComplete) return;
        const timer = setTimeout(() => setShowScene1aText(true), 2000);

        let scrollInterval: ReturnType<typeof setInterval>;
        let isAutoScrolling = true;

        const startAutoScroll = () => {
            if (!isAutoScrolling) return;
            // 15 FPS = 66.67ms per tick
            const fps = 15;
            const msPerFrame = 1000 / fps;
            // 720 frames total over 48 seconds

            scrollInterval = setInterval(() => {
                if (!containerRef.current) return;
                const totalScroll = containerRef.current.scrollHeight - window.innerHeight;
                const totalTicks = TOTAL_FRAMES; // 720
                const pixelsPerTick = totalScroll / totalTicks;

                if (window.scrollY < totalScroll) {
                    window.scrollBy({ top: pixelsPerTick, behavior: 'instant' });
                } else {
                    clearInterval(scrollInterval);
                }
            }, msPerFrame);
        };

        // Delay until initial texts and animations settle
        const scrollTimer = setTimeout(startAutoScroll, 2500);

        const handleUserInterrupt = () => {
            isAutoScrolling = false;
            clearInterval(scrollInterval);
            window.removeEventListener('wheel', handleUserInterrupt);
            window.removeEventListener('touchstart', handleUserInterrupt);
        };

        window.addEventListener('wheel', handleUserInterrupt, { passive: true });
        window.addEventListener('touchstart', handleUserInterrupt, { passive: true });

        return () => {
            clearTimeout(timer);
            clearTimeout(scrollTimer);
            clearInterval(scrollInterval);
            window.removeEventListener('wheel', handleUserInterrupt);
            window.removeEventListener('touchstart', handleUserInterrupt);
        };
    }, [introComplete]);


    // Progressive Background Preload
    useEffect(() => {
        let isMounted = true;

        const loadSequence = async (startIdx: number, frameCount: number, pathPref: string) => {
            const promises: Promise<void>[] = [];
            for (let i = 1; i <= frameCount; i++) {
                promises.push(new Promise((resolve) => {
                    const img = new window.Image();
                    const frameIndex = i.toString().padStart(3, '0');
                    img.src = `${pathPref}${frameIndex}.webp`;

                    img.onload = () => {
                        if (isMounted) imagesRef.current[startIdx + i - 1] = img;
                        resolve();
                    };
                    img.onerror = () => resolve(); // Skip broken files smoothly
                }));
            }
            await Promise.all(promises);
        };

        const loadAllSequences = async () => {
            // Sequence 1 Priority (Unlocks the UI instantly)
            await loadSequence(0, FRAME_COUNT_1, IMAGES_PATH_1);
            if (!isMounted) return;
            setIsLoaded(true);

            // Sequence 2 (Fetches in background silently)
            await loadSequence(FRAME_COUNT_1, FRAME_COUNT_2, IMAGES_PATH_2);
            if (!isMounted) return;

            // Sequence 3
            await loadSequence(FRAME_COUNT_1 + FRAME_COUNT_2, FRAME_COUNT_3, IMAGES_PATH_3);
            if (!isMounted) return;

            // Sequence 4
            await loadSequence(FRAME_COUNT_1 + FRAME_COUNT_2 + FRAME_COUNT_3, FRAME_COUNT_4, IMAGES_PATH_4);
            if (!isMounted) return;

            // Sequence 5
            await loadSequence(FRAME_COUNT_1 + FRAME_COUNT_2 + FRAME_COUNT_3 + FRAME_COUNT_4, FRAME_COUNT_5, IMAGES_PATH_5);
            if (!isMounted) return;

            // Sequence 6
            await loadSequence(FRAME_COUNT_1 + FRAME_COUNT_2 + FRAME_COUNT_3 + FRAME_COUNT_4 + FRAME_COUNT_5, FRAME_COUNT_6, IMAGES_PATH_6);
        };

        loadAllSequences();

        return () => { isMounted = false; };
    }, []);

    // Initial Frame Render: Fires as soon as first sequence is loaded.
    // This removes the "black screen gap" while IntroAnimation is fading out.
    useGSAP(() => {
        if (!isLoaded || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvas.clientWidth * dpr;
        canvas.height = canvas.clientHeight * dpr;

        const img = imagesRef.current[0];
        if (img && img.complete && img.naturalHeight !== 0) {
            const hRatio = canvas.width / img.width;
            const vRatio = canvas.height / img.height;
            const ratio = Math.max(hRatio, vRatio);
            const centerShift_x = (canvas.width - img.width * ratio) / 2;
            const centerShift_y = (canvas.height - img.height * ratio) / 2;
            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = 'high';
            context.drawImage(img, 0, 0, img.width, img.height,
                centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
        }
    }, [isLoaded]);

    useGSAP(() => {
        // Wait until images are loaded AND intro is done (so overflow-hidden is removed
        // and the document is the full 2700dvh before ScrollTrigger measures anything).
        // The first render(0) call is now handled by the hook above for speed.
        if (!isLoaded || !introComplete || !canvasRef.current || !containerRef.current) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvas.clientWidth * dpr;
        canvas.height = canvas.clientHeight * dpr;

        let renderMath: {
            hRatio: number; vRatio: number; ratio: number;
            centerShift_x: number; centerShift_y: number;
            cw: number; ch: number; iw: number; ih: number;
        } | null = null;

        const render = (index: number) => {
            const img = imagesRef.current[index];
            if (img && img.complete && img.naturalHeight !== 0) {
                // Only calculate math if canvas size changed, image size changed, or it's the first render
                if (!renderMath || renderMath.cw !== canvas.width || renderMath.ch !== canvas.height || renderMath.iw !== img.width || renderMath.ih !== img.height) {
                    const hRatio = canvas.width / img.width;
                    const vRatio = canvas.height / img.height;
                    const ratio = Math.max(hRatio, vRatio);
                    const centerShift_x = (canvas.width - img.width * ratio) / 2;
                    const centerShift_y = (canvas.height - img.height * ratio) / 2;
                    renderMath = { hRatio, vRatio, ratio, centerShift_x, centerShift_y, cw: canvas.width, ch: canvas.height, iw: img.width, ih: img.height };
                }

                context.imageSmoothingEnabled = true;
                context.imageSmoothingQuality = 'high';

                // Optimization: Removing clearRect because the drawn image has `object-cover` math (Math.max) 
                // and perfectly fills/overflows the entire canvas bounds anyway. This cuts GPU repaints in half.
                context.drawImage(img, 0, 0, img.width, img.height,
                    renderMath.centerShift_x, renderMath.centerShift_y, img.width * renderMath.ratio, img.height * renderMath.ratio);
            }
        };

        render(0);

        ScrollTrigger.create({
            id: "scene1-trigger",
            trigger: containerRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: 4.5,
            onUpdate: (self) => {
                const frameIndex = Math.floor(self.progress * (TOTAL_FRAMES - 1));
                render(frameIndex);

                // Show wormhole video as the background for the Auth section (Scene 1F Ending)
                if (self.progress > 0.94) {
                    setShowWormhole(true);
                } else {
                    setShowWormhole(false);
                }

                // ── TEXT-1 EXIT ──────────────────────────────────────────────
                // Frame 050 of scene-1a (index 49): fast clean char wave exit
                if (frameIndex >= 49 && !text1FadeStartedRef.current) {
                    text1FadeStartedRef.current = true;
                    const isLg = window.innerWidth >= 1024;
                    gsap.to(isLg ? ".scene-1a-text .split-word" : ".scene-1a-text .split-char", {
                        opacity: 0,
                        y: isLg ? -25 : 40,
                        filter: isLg ? 'blur(8px)' : 'blur(0px)',
                        duration: isLg ? 0.5 : 0.35,
                        ease: isLg ? "power3.in" : "power3.out",
                        stagger: { each: isLg ? 0.05 : 0.025, from: isLg ? "end" : "start" },
                    });
                }
                // Scroll-back reset: before frame 040, restore chars
                if (frameIndex < 40 && text1FadeStartedRef.current) {
                    text1FadeStartedRef.current = false;
                    const isLg = window.innerWidth >= 1024;
                    gsap.to(isLg ? ".scene-1a-text .split-word" : ".scene-1a-text .split-char", {
                        opacity: 1, y: 0, filter: 'blur(0px)',
                        duration: isLg ? 0.5 : 0.35,
                        ease: isLg ? "power3.out" : "power3.out",
                        stagger: { each: isLg ? 0.05 : 0.025, from: isLg ? "start" : "end" },
                    });
                }

                // ── TEXT-2 ENTER ─────────────────────────────────────────────
                // Frame 080 of scene-1a (index 79): mount Text-2 → SplitText fires on mount
                if (frameIndex >= 79 && frameIndex < 190 && !text2ShownRef.current) {
                    text2ShownRef.current = true;
                    text2HideStartedRef.current = false;
                    setShowScene1bText(true);
                }
                // Scroll-back: before 065 or past buffer, unmount Text-2
                if ((frameIndex < 65 || frameIndex >= 190) && text2ShownRef.current) {
                    text2ShownRef.current = false;
                    text2HideStartedRef.current = false;
                    setShowScene1bText(false);
                }

                // ── TEXT-2 EXIT ──────────────────────────────────────────────
                // Frame 045 of scene-1b (global index 164 = 120+44): fast clean char wave exit
                if (frameIndex >= 164 && text2ShownRef.current && !text2HideStartedRef.current) {
                    text2HideStartedRef.current = true;
                    const isLg = window.innerWidth >= 1024;
                    gsap.to(isLg ? ".scene-1b-text .split-word" : ".scene-1b-text .split-char", {
                        opacity: 0,
                        y: isLg ? -25 : 40,
                        filter: isLg ? 'blur(8px)' : 'blur(0px)',
                        duration: isLg ? 0.5 : 0.35,
                        ease: isLg ? "power3.in" : "power3.out",
                        stagger: { each: isLg ? 0.05 : 0.025, from: isLg ? "end" : "start" },
                    });
                }
                // Scroll-back: before frame 150, restore Text-2 chars
                if (frameIndex < 150 && text2HideStartedRef.current) {
                    text2HideStartedRef.current = false;
                    const isLg = window.innerWidth >= 1024;
                    gsap.to(isLg ? ".scene-1b-text .split-word" : ".scene-1b-text .split-char", {
                        opacity: 1, y: 0, filter: 'blur(0px)',
                        duration: isLg ? 0.5 : 0.35,
                        ease: isLg ? "power3.out" : "power3.out",
                        stagger: { each: isLg ? 0.05 : 0.025, from: isLg ? "start" : "end" },
                    });
                }

                // ── TEXT-3 ENTER ──────────────────────────────────────────────
                // Scene-1b frame _067 (global index 186 = 120+66): mount Text-3
                if (frameIndex >= 186 && frameIndex < 250 && !text3ShownRef.current) {
                    text3ShownRef.current = true;
                    text3HideStartedRef.current = false;
                    setShowScene3Text(true);
                }
                // Scroll-back: before 175 or past buffer, unmount Text-3
                if ((frameIndex < 175 || frameIndex >= 250) && text3ShownRef.current) {
                    text3ShownRef.current = false;
                    text3HideStartedRef.current = false;
                    setShowScene3Text(false);
                }

                // ── TEXT-3 EXIT ──────────────────────────────────────────────
                // Scene-1b frame _104 (global index 223 = 120+103): fast clean char wave exit
                if (frameIndex >= 223 && text3ShownRef.current && !text3HideStartedRef.current) {
                    text3HideStartedRef.current = true;
                    const isLg = window.innerWidth >= 1024;
                    gsap.to(isLg ? ".scene-3-text .split-word" : ".scene-3-text .split-char", {
                        opacity: 0,
                        y: isLg ? -25 : 40,
                        filter: isLg ? 'blur(8px)' : 'blur(0px)',
                        duration: isLg ? 0.5 : 0.35,
                        ease: isLg ? "power3.in" : "power3.out",
                        stagger: { each: isLg ? 0.05 : 0.025, from: isLg ? "end" : "start" },
                    });
                }
                // Scroll-back: before frame 212, restore Text-3 chars
                if (frameIndex < 212 && text3HideStartedRef.current) {
                    text3HideStartedRef.current = false;
                    const isLg = window.innerWidth >= 1024;
                    gsap.to(isLg ? ".scene-3-text .split-word" : ".scene-3-text .split-char", {
                        opacity: 1, y: 0, filter: 'blur(0px)',
                        duration: isLg ? 0.5 : 0.35,
                        ease: isLg ? "power3.out" : "power3.out",
                        stagger: { each: isLg ? 0.05 : 0.025, from: isLg ? "start" : "end" },
                    });
                }

                // ── TEXT-4 ENTER ──────────────────────────────────────────────
                // Scene-1c frame _044 (global index 283 = 240+43): mount Text-4
                if (frameIndex >= 283 && frameIndex < 330 && !text4ShownRef.current) {
                    text4ShownRef.current = true;
                    text4HideStartedRef.current = false;
                    setShowScene4Text(true);
                }
                // Scroll-back: before 273 or past buffer, unmount Text-4
                if ((frameIndex < 273 || frameIndex >= 330) && text4ShownRef.current) {
                    text4ShownRef.current = false;
                    text4HideStartedRef.current = false;
                    setShowScene4Text(false);
                }

                // ── TEXT-4 EXIT ──────────────────────────────────────────────
                // Frame-based fallback exit for fast-scroll. Words blur-fade down (reverse of entry).
                if (frameIndex >= 305 && text4ShownRef.current && !text4HideStartedRef.current) {
                    text4HideStartedRef.current = true;
                    if (text4ExitTimerRef.current) clearTimeout(text4ExitTimerRef.current);
                    gsap.to(".scene-4-text .split-word", {
                        opacity: 0, y: -25, filter: 'blur(8px)',
                        duration: 0.5, ease: "power3.in",
                        stagger: { each: 0.05, from: "end" },
                    });
                }
                // Scroll-back: before frame 294, restore Text-4 words smoothly
                if (frameIndex < 294 && text4HideStartedRef.current) {
                    text4HideStartedRef.current = false;
                    if (text4ExitTimerRef.current) clearTimeout(text4ExitTimerRef.current);
                    gsap.to(".scene-4-text .split-word", {
                        opacity: 1, y: 0, filter: 'blur(0px)',
                        duration: 0.5, ease: "power3.out", stagger: { each: 0.05, from: "start" },
                    });
                }

                // ── TEXT-5 ENTER ──────────────────────────────────────────────
                // Delayed to enter after Text-4 completely exits
                if (frameIndex >= 320 && frameIndex < 370 && !text5ShownRef.current) {
                    text5ShownRef.current = true;
                    text5HideStartedRef.current = false;
                    setShowScene5Text(true);
                }
                // Scroll-back buffer for Text-5
                if ((frameIndex < 310 || frameIndex >= 370) && text5ShownRef.current) {
                    text5ShownRef.current = false;
                    text5HideStartedRef.current = false;
                    setShowScene5Text(false);
                }

                // ── TEXT-5 EXIT ──────────────────────────────────────────────
                // Frame-based fallback exit for fast-scroll. Words blur-fade down (reverse of entry).
                if (frameIndex >= 345 && text5ShownRef.current && !text5HideStartedRef.current) {
                    text5HideStartedRef.current = true;
                    if (text5ExitTimerRef.current) clearTimeout(text5ExitTimerRef.current);
                    gsap.to(".scene-5-text .split-word", {
                        opacity: 0, y: -25, filter: 'blur(8px)',
                        duration: 0.5, ease: "power3.in",
                        stagger: { each: 0.05, from: "end" },
                    });
                }
                // Scroll-back: restore Text-5 words smoothly
                if (frameIndex < 335 && text5HideStartedRef.current) {
                    text5HideStartedRef.current = false;
                    if (text5ExitTimerRef.current) clearTimeout(text5ExitTimerRef.current);
                    gsap.to(".scene-5-text .split-word", {
                        opacity: 1, y: 0, filter: 'blur(0px)',
                        duration: 0.5, ease: "power3.out", stagger: { each: 0.05, from: "start" },
                    });
                }

                // ── TEXT-6 ENTER ──────────────────────────────────────────────
                // Scene-1d frame _015 (global index 374 = 360+14): mount Text-6
                if (frameIndex >= 374 && frameIndex < 440 && !text6ShownRef.current) {
                    text6ShownRef.current = true;
                    text6HideStartedRef.current = false;
                    setShowScene6Text(true);
                }
                // Scroll-back: before 363 or past buffer, unmount Text-6
                if ((frameIndex < 363 || frameIndex >= 440) && text6ShownRef.current) {
                    text6ShownRef.current = false;
                    text6HideStartedRef.current = false;
                    setShowScene6Text(false);
                }

                // ── TEXT-6 EXIT ──────────────────────────────────────────────
                // Scene-1d frame _060 (global index 419 = 360+59): smooth char-wave exit
                if (frameIndex >= 419 && text6ShownRef.current && !text6HideStartedRef.current) {
                    text6HideStartedRef.current = true;
                    const isLg = window.innerWidth >= 1024;
                    gsap.to(isLg ? ".scene-6-text .split-word" : ".scene-6-text .split-char", {
                        opacity: 0,
                        y: isLg ? -25 : 40,
                        filter: isLg ? 'blur(8px)' : 'blur(0px)',
                        duration: isLg ? 0.5 : 0.35,
                        ease: isLg ? "power3.in" : "power3.out",
                        stagger: { each: isLg ? 0.05 : 0.025, from: isLg ? "end" : "start" },
                    });
                }
                // Scroll-back: before frame 408, restore Text-6 chars smoothly
                if (frameIndex < 408 && text6HideStartedRef.current) {
                    text6HideStartedRef.current = false;
                    const isLg = window.innerWidth >= 1024;
                    gsap.to(isLg ? ".scene-6-text .split-word" : ".scene-6-text .split-char", {
                        opacity: 1, y: 0, filter: 'blur(0px)',
                        duration: isLg ? 0.5 : 0.35,
                        ease: isLg ? "power3.out" : "power3.out",
                        stagger: { each: isLg ? 0.05 : 0.025, from: isLg ? "start" : "end" },
                    });
                }

                // ── TEXT-7 ENTER ──────────────────────────────────────────────
                // Scene-1d frame _070 (global index 429 = 360+69): mount Text-7
                if (frameIndex >= 429 && frameIndex < 500 && !text7ShownRef.current) {
                    text7ShownRef.current = true;
                    text7HideStartedRef.current = false;
                    setShowScene7Text(true);
                }
                // Scroll-back: before 418 or past buffer, unmount Text-7
                if ((frameIndex < 418 || frameIndex >= 500) && text7ShownRef.current) {
                    text7ShownRef.current = false;
                    text7HideStartedRef.current = false;
                    setShowScene7Text(false);
                }

                // ── TEXT-7 EXIT ──────────────────────────────────────────────
                // Scene-1d frame _120 (global index 479): whole container fades out at once
                if (frameIndex >= 479 && text7ShownRef.current && !text7HideStartedRef.current) {
                    text7HideStartedRef.current = true;
                    const isLg = window.innerWidth >= 1024;
                    if (isLg) {
                        gsap.to(".scene-7-text .split-word", { opacity: 0, y: -25, filter: 'blur(8px)', duration: 0.5, ease: "power3.in", stagger: { each: 0.05, from: "end" } });
                    } else {
                        gsap.to(".scene-7-text", { opacity: 0, y: -20, duration: 0.8, ease: "power2.inOut" });
                    }
                }
                // Scroll-back: before frame 468, restore Text-7 container at once
                if (frameIndex < 468 && text7HideStartedRef.current) {
                    text7HideStartedRef.current = false;
                    const isLg = window.innerWidth >= 1024;
                    if (isLg) {
                        gsap.to(".scene-7-text .split-word", { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.5, ease: "power3.out", stagger: { each: 0.05, from: "start" } });
                    } else {
                        gsap.to(".scene-7-text", { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" });
                    }
                }

                // ── TEXT-8 ENTER ──────────────────────────────────────────────
                // Scene-1e frame _030 (global index 509 = 480+29): mount Text-8
                if (frameIndex >= 509 && frameIndex < 590 && !text8ShownRef.current) {
                    text8ShownRef.current = true;
                    text8HideStartedRef.current = false;
                    setShowScene8Text(true);
                }
                // Scroll-back: before 498 or past buffer, unmount Text-8
                if ((frameIndex < 498 || frameIndex >= 590) && text8ShownRef.current) {
                    text8ShownRef.current = false;
                    text8HideStartedRef.current = false;
                    setShowScene8Text(false);
                }

                // ── TEXT-8 EXIT ──────────────────────────────────────────────
                // Scene-1e frame _090 (global index 569 = 480+89): smooth char-wave exit
                if (frameIndex >= 569 && text8ShownRef.current && !text8HideStartedRef.current) {
                    text8HideStartedRef.current = true;
                    const isLg = window.innerWidth >= 1024;
                    gsap.to(isLg ? ".scene-8-text .split-word" : ".scene-8-text .split-char", {
                        opacity: 0,
                        y: isLg ? -25 : 40,
                        filter: isLg ? 'blur(8px)' : 'blur(0px)',
                        duration: isLg ? 0.5 : 0.35,
                        ease: isLg ? "power3.in" : "power3.out",
                        stagger: { each: isLg ? 0.05 : 0.025, from: isLg ? "end" : "start" },
                    });
                }
                // Scroll-back: before frame 558, restore Text-8 chars smoothly
                if (frameIndex < 558 && text8HideStartedRef.current) {
                    text8HideStartedRef.current = false;
                    const isLg = window.innerWidth >= 1024;
                    gsap.to(isLg ? ".scene-8-text .split-word" : ".scene-8-text .split-char", {
                        opacity: 1, y: 0, filter: 'blur(0px)',
                        duration: isLg ? 0.5 : 0.35,
                        ease: isLg ? "power3.out" : "power3.out",
                        stagger: { each: isLg ? 0.05 : 0.025, from: isLg ? "start" : "end" },
                    });
                }

                // ── TEXT-9 ENTER ──────────────────────────────────────────────
                // Scene-1e frame _116 (global index 595 = 480+115): mount Text-9
                if (frameIndex >= 595 && frameIndex < 660 && !text9ShownRef.current) {
                    text9ShownRef.current = true;
                    text9HideStartedRef.current = false;
                    setShowScene9Text(true);
                }
                // Scroll-back: before 584 or past buffer, unmount Text-9
                if ((frameIndex < 584 || frameIndex >= 660) && text9ShownRef.current) {
                    text9ShownRef.current = false;
                    text9HideStartedRef.current = false;
                    setShowScene9Text(false);
                }

                // ── TEXT-9 EXIT ──────────────────────────────────────────────
                // Scene-1f frame _045 (global index 644 = 600+44): container fade-out
                if (frameIndex >= 644 && text9ShownRef.current && !text9HideStartedRef.current) {
                    text9HideStartedRef.current = true;
                    const isLg = window.innerWidth >= 1024;
                    if (isLg) {
                        gsap.to(".scene-9-text .split-word", { opacity: 0, y: -25, filter: 'blur(8px)', duration: 0.5, ease: "power3.in", stagger: { each: 0.05, from: "end" } });
                    } else {
                        gsap.to(".scene-9-text", { opacity: 0, y: 20, duration: 0.5, ease: "power3.out" });
                    }
                }
                // Scroll-back: before frame 633, restore Text-9 container
                if (frameIndex < 633 && text9HideStartedRef.current) {
                    text9HideStartedRef.current = false;
                    const isLg = window.innerWidth >= 1024;
                    if (isLg) {
                        gsap.to(".scene-9-text .split-word", { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.5, ease: "power3.out", stagger: { each: 0.05, from: "start" } });
                    } else {
                        gsap.to(".scene-9-text", { opacity: 1, y: 0, duration: 0.35, ease: "power3.out" });
                    }
                }

                // ── TEXT-10 ENTER ─────────────────────────────────────────────
                // Scene-1f frame _061 (global index 660 = 600+60): mount Text-10
                if (frameIndex >= 660 && frameIndex < 740 && !text10ShownRef.current) {
                    text10ShownRef.current = true;
                    text10HideStartedRef.current = false;
                    setShowScene10Text(true);
                }
                // Scroll-back: before 649 or past buffer, unmount Text-10
                if ((frameIndex < 649 || frameIndex >= 740) && text10ShownRef.current) {
                    text10ShownRef.current = false;
                    text10HideStartedRef.current = false;
                    setShowScene10Text(false);
                }

                // ── TEXT-10 EXIT ─────────────────────────────────────────────
                // Scene-1f frame _114 (global index 713 = 600+113): container fade-out
                if (frameIndex >= 713 && text10ShownRef.current && !text10HideStartedRef.current) {
                    text10HideStartedRef.current = true;
                    const isLg = window.innerWidth >= 1024;
                    if (isLg) {
                        gsap.to(".scene-10-text .split-word", { opacity: 0, y: -25, filter: 'blur(8px)', duration: 0.5, ease: "power3.in", stagger: { each: 0.05, from: "end" } });
                    } else {
                        gsap.to(".scene-10-text", { opacity: 0, y: 20, duration: 0.5, ease: "power3.out" });
                    }
                }
                // Scroll-back: before frame 702, restore Text-10 container
                if (frameIndex < 702 && text10HideStartedRef.current) {
                    text10HideStartedRef.current = false;
                    const isLg = window.innerWidth >= 1024;
                    if (isLg) {
                        gsap.to(".scene-10-text .split-word", { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.5, ease: "power3.out", stagger: { each: 0.05, from: "start" } });
                    } else {
                        gsap.to(".scene-10-text", { opacity: 1, y: 0, duration: 0.35, ease: "power3.out" });
                    }
                }
            }
        });

        // Text Animations (scrubbed timeline — only auth form fade-in remains)
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: containerRef.current,
                start: "top top",
                end: "bottom bottom",
                scrub: 4.5,
            }
        });
        tl.to(".scene-1f-auth", { opacity: 1, duration: 0.05, ease: "power1.out", pointerEvents: "auto" }, 0.95);

    }, [isLoaded, introComplete]); // Re-run when either changes so ScrollTrigger is created at the right time

    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current && containerRef.current) {
                const dpr = window.devicePixelRatio || 1;
                canvasRef.current.width = canvasRef.current.clientWidth * dpr;
                canvasRef.current.height = canvasRef.current.clientHeight * dpr;
                ScrollTrigger.refresh();
            }
        };
        window.addEventListener('resize', handleResize);

        // Listen for Warp Drive Telemetry from Header
        const handleWarpStart = () => setIsWarpingActive(true);
        const handleWarpEnd = () => setIsWarpingActive(false);
        const handleAuthMode = (e: Event) => setAuthMode((e as CustomEvent).detail.mode);
        window.addEventListener('warp-start', handleWarpStart);
        window.addEventListener('warp-end', handleWarpEnd);
        window.addEventListener('auth-mode', handleAuthMode);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('warp-start', handleWarpStart);
            window.removeEventListener('warp-end', handleWarpEnd);
            window.removeEventListener('auth-mode', handleAuthMode);
        };
    }, []);

    // Removed blocking loading screen to prevent layout shifts

    const handleAuthSuccess = () => {
        // Pre-fetch home in background while the video plays to satisfy the "preload" requirement
        router.prefetch('/home');

        gsap.to(".scene-1f-auth", {
            opacity: 0,
            duration: 0.5,
            ease: "power1.out",
            onComplete: () => {
                // Hide UI elements
                window.dispatchEvent(new Event('wormhole-start'));
                // The video is already visible as the background, now we just play it
                if (wormholeVideoRef.current) {
                    wormholeVideoRef.current.play();
                }
            }
        });
    };



    return (
        <div ref={containerRef} className="relative h-[2700dvh] w-full"> {/* Sextuple height for six combined scenes, dynamic vh for mobile safety */}
            <ScrollIndicators />
            <div className="sticky top-0 h-[100dvh] w-full overflow-hidden bg-black flex items-center justify-center">
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />

                {/* Wormhole Video Background (Scene Continuation) */}
                <div
                    className={`absolute inset-0 z-0 transition-opacity duration-1000 pointer-events-none ${showWormhole ? 'opacity-100' : 'opacity-0'}`}
                >
                    <video
                        ref={wormholeVideoRef}
                        src={getAssetUrl('/assets/wormhole.webm')}
                        preload="auto"
                        muted
                        playsInline
                        onEnded={() => {
                            // Transition to next page immediately after the video finishes
                            router.push('/home');
                        }}
                        className="w-full h-full object-cover mix-blend-screen"
                        style={{ transform: 'scale(1.2)' }}
                    />
                </div>

                <div className={`absolute inset-0 z-10 grid place-items-center pointer-events-none transition-opacity duration-[50ms] ${isWarpingActive ? 'opacity-0' : 'opacity-100'}`}>

                    {/* SCENE 1A CONTENT (Earth) — appears 2s after intro logo animation */}
                    {showScene1aText && (
                        <div className="scene-1a-text col-start-1 row-start-1 self-start justify-self-center mt-[20vh] landscape:max-md:mt-[30vh] md:self-start md:justify-self-center md:ml-0 md:mt-[30vh] lg:self-start lg:justify-self-center lg:mt-[25vh] lg:ml-0 max-w-[90vw] sm:max-w-2xl lg:max-w-none px-4">
                            <SplitText
                                text="College fests on Earth have become... boring."
                                className="text-center text-2xl sm:text-4xl lg:text-5xl xl:text-6xl landscape:max-md:text-xl landscape:max-lg:text-2xl font-bold tracking-tighter text-white leading-tight drop-shadow-md"
                                delay={isDesktop ? 60 : 60}
                                duration={isDesktop ? 0.5 : 0.6}
                                ease={isDesktop ? "power3.out" : "power4.out"}
                                splitType={isDesktop ? "words" : "chars"}
                                from={isDesktop ? { opacity: 0, y: 25, filter: 'blur(8px)' } : { opacity: 0, y: 40 }}
                                to={isDesktop ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 1, y: 0 }}
                                threshold={0.1}
                                rootMargin="-100px"
                                tag="h2"
                                textAlign="center"
                            />
                        </div>
                    )}

                    {/* SCENE 1B CONTENT (Campus) — appears when entering scene 1B, exits smoothly before 1C */}
                    {showScene1bText && (
                        <div className="scene-1b-text col-start-1 row-start-1 place-self-center max-w-[90vw] sm:max-w-2xl lg:max-w-none px-4">
                            <SplitText
                                text={"Same stage.\nSame tents,\nSame samosas."}
                                className="text-center text-2xl sm:text-4xl lg:text-5xl xl:text-6xl landscape:max-md:text-xl landscape:max-lg:text-2xl font-bold tracking-tighter text-white leading-tight drop-shadow-md whitespace-pre-line"
                                delay={isDesktop ? 60 : 60}
                                duration={isDesktop ? 0.5 : 0.6}
                                ease={isDesktop ? "power3.out" : "power4.out"}
                                splitType={isDesktop ? "words" : "chars"}
                                from={isDesktop ? { opacity: 0, y: 25, filter: 'blur(8px)' } : { opacity: 0, y: 40 }}
                                to={isDesktop ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 1, y: 0 }}
                                threshold={0.1}
                                rootMargin="-100px"
                                tag="h2"
                                textAlign="center"
                            />
                        </div>
                    )}

                    {/* SCENE 1B TEXT-3 — appears at scene-1b frame _067, exits at _104 */}
                    {showScene3Text && (
                        <div className="scene-3-text col-start-1 row-start-1 self-start justify-self-center mt-[33vh] landscape:max-md:mt-[33vh] landscape:max-md:place-self-start landscape:max-md:mb-0 md:self-start md:justify-self-center md:mt-[25vh] md:mb-0 lg:self-start lg:justify-self-center lg:mt-[77vh] lg:mb-0 max-w-[90vw] sm:max-w-3xl lg:max-w-none px-4 sm:px-8">
                            <SplitText
                                text={"So... we decided to do something\nno college has never done..."}
                                className="text-center text-2xl sm:text-4xl lg:text-5xl xl:text-6xl landscape:max-md:text-xl landscape:max-lg:text-2xl font-bold tracking-tighter text-white leading-tight drop-shadow-md whitespace-pre-line"
                                delay={isDesktop ? 60 : 60}
                                duration={isDesktop ? 0.5 : 0.6}
                                ease={isDesktop ? "power3.out" : "power4.out"}
                                splitType={isDesktop ? "words" : "chars"}
                                from={isDesktop ? { opacity: 0, y: 25, filter: 'blur(8px)' } : { opacity: 0, y: 40 }}
                                to={isDesktop ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 1, y: 0 }}
                                threshold={0.1}
                                rootMargin="-100px"
                                tag="h2"
                                textAlign="center"
                            />
                        </div>
                    )}

                    {/* SCENE 1C TEXT-4 — appears at scene-1c frame _044, auto-exits after 2.5s */}
                    {showScene4Text && (
                        <div className="scene-4-text col-start-1 row-start-1 self-start justify-self-center mt-[25vh] md:self-start md:justify-self-center md:mt-[35vh] md:mr-0 lg:self-start lg:justify-self-center lg:mt-[30vh] lg:ml-0 max-w-[90vw] sm:max-w-2xl lg:max-w-none px-4">
                            <SplitText
                                text="What if ORNATE didn't stay on the ground?"
                                className="text-center text-2xl sm:text-4xl lg:text-5xl xl:text-6xl landscape:max-md:text-xl landscape:max-lg:text-2xl font-bold tracking-tighter text-white leading-tight drop-shadow-md"
                                delay={isDesktop ? 60 : 60}
                                duration={isDesktop ? 0.5 : 0.6}
                                ease={isDesktop ? "power3.out" : "power4.out"}
                                splitType="words"
                                from={{ opacity: 0, y: 25, filter: 'blur(8px)' }}
                                to={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                threshold={0.1}
                                rootMargin="-100px"
                                tag="h2"
                                textAlign="center"
                                onLetterAnimationComplete={() => {
                                    if (text4ExitTimerRef.current) clearTimeout(text4ExitTimerRef.current);
                                    text4ExitTimerRef.current = setTimeout(() => {
                                        if (!text4ShownRef.current || text4HideStartedRef.current) return;
                                        text4HideStartedRef.current = true;
                                        gsap.to('.scene-4-text .split-word', {
                                            opacity: 0, y: -25, filter: 'blur(8px)',
                                            duration: 0.9, ease: 'power2.in',
                                            stagger: { each: 0.05, from: 'end' },
                                        });
                                    }, 2000);
                                }}
                            />
                        </div>
                    )}

                    {/* SCENE 1C TEXT-5 — appears at scene-1c frame _072, auto-exits after 2.5s */}
                    {showScene5Text && (
                        <div className="scene-5-text col-start-1 row-start-1 self-start justify-self-center mt-[25vh] md:self-start md:justify-self-center md:mt-[35vh] md:ml-0 lg:self-start lg:justify-self-center lg:mt-[30vh] lg:mr-0 max-w-[90vw] sm:max-w-3xl lg:max-w-none px-4">
                            <SplitText
                                text="What if every branch had its own world?"
                                className="text-center text-2xl sm:text-4xl lg:text-5xl xl:text-6xl landscape:max-md:text-xl landscape:max-lg:text-2xl font-bold tracking-tighter text-white leading-tight drop-shadow-md"
                                delay={isDesktop ? 60 : 60}
                                duration={isDesktop ? 0.5 : 0.6}
                                ease={isDesktop ? "power3.out" : "power4.out"}
                                splitType="words"
                                from={{ opacity: 0, y: 25, filter: 'blur(8px)' }}
                                to={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                threshold={0.1}
                                rootMargin="-100px"
                                tag="h2"
                                textAlign="center"
                                onLetterAnimationComplete={() => {
                                    if (text5ExitTimerRef.current) clearTimeout(text5ExitTimerRef.current);
                                    text5ExitTimerRef.current = setTimeout(() => {
                                        if (!text5ShownRef.current || text5HideStartedRef.current) return;
                                        text5HideStartedRef.current = true;
                                        gsap.to('.scene-5-text .split-word', {
                                            opacity: 0, y: -25, filter: 'blur(8px)',
                                            duration: 0.9, ease: 'power2.in',
                                            stagger: { each: 0.05, from: 'end' },
                                        });
                                    }, 2000);
                                }}
                            />
                        </div>
                    )}

                    {/* SCENE 1D TEXT-6 — appears at scene-1d frame _001, exits at _025 */}
                    {showScene6Text && (
                        <div className="scene-6-text col-start-1 row-start-1 self-start justify-self-center mt-[25vh] md:self-start md:justify-self-center md:mt-[30vh] lg:place-self-start lg:justify-self-center lg:mt-[15vh] max-w-[90vw] sm:max-w-3xl lg:max-w-xl px-4 sm:px-8">
                            <SplitText
                                text="Yes, we’re taking ORNATE to space!"
                                className="text-center text-2xl sm:text-4xl lg:text-5xl xl:text-6xl landscape:max-md:text-xl landscape:max-lg:text-2xl font-bold tracking-tighter text-white leading-tight drop-shadow-md"
                                delay={isDesktop ? 60 : 60}
                                duration={isDesktop ? 0.5 : 0.6}
                                ease={isDesktop ? "power3.out" : "power4.out"}
                                splitType={isDesktop ? "words" : "chars"}
                                from={isDesktop ? { opacity: 0, y: 25, filter: 'blur(8px)' } : { opacity: 0, y: 40 }}
                                to={isDesktop ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 1, y: 0 }}
                                threshold={0.1}
                                rootMargin="-100px"
                                tag="h2"
                                textAlign="center"
                            />
                        </div>
                    )}

                    {/* SCENE 1D TEXT-7 — appears at scene-1d frame _030, exits all-at-once */}
                    {showScene7Text && (
                        <div className="scene-7-text col-start-1 row-start-1 place-self-center max-w-[90vw] sm:max-w-3xl lg:max-w-none px-4 sm:px-8">
                            <SplitText
                                text={"Planets for each branch,\nStars for your talents,\nand fun that's out of this world."}
                                className="text-center text-2xl sm:text-4xl lg:text-5xl xl:text-6xl landscape:max-md:text-xl landscape:max-lg:text-2xl font-bold tracking-tighter text-white leading-tight drop-shadow-md whitespace-pre-line"
                                delay={isDesktop ? 60 : 60}
                                duration={isDesktop ? 0.5 : 0.6}
                                ease={isDesktop ? "power3.out" : "power4.out"}
                                splitType={isDesktop ? "words" : "chars"}
                                from={isDesktop ? { opacity: 0, y: 25, filter: 'blur(8px)' } : { opacity: 0, y: 40 }}
                                to={isDesktop ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 1, y: 0 }}
                                threshold={0.1}
                                rootMargin="-100px"
                                tag="h2"
                                textAlign="center"
                            />
                        </div>
                    )}

                    {/* SCENE 1E TEXT-8 — appears at scene-1e frame _030, exits at _090 */}
                    {showScene8Text && (
                        <div className="scene-8-text col-start-1 row-start-1 place-self-center landscape:max-md:place-self-end landscape:max-md:mb-[15vh] md:self-start md:justify-self-center md:mt-[85vh] md:mr-0 lg:self-start lg:justify-self-center lg:mt-[83vh] lg:mr-0 max-w-[90vw] sm:max-w-2xl lg:max-w-none px-4">
                            <SplitText
                                text="You’ve been selected to join the mission"
                                className="text-center text-2xl sm:text-4xl lg:text-5xl xl:text-6xl landscape:max-md:text-xl landscape:max-lg:text-2xl font-bold tracking-tighter text-white leading-tight drop-shadow-md"
                                delay={isDesktop ? 60 : 60}
                                duration={isDesktop ? 0.5 : 0.6}
                                ease={isDesktop ? "power3.out" : "power4.out"}
                                splitType={isDesktop ? "words" : "chars"}
                                from={isDesktop ? { opacity: 0, y: 25, filter: 'blur(8px)' } : { opacity: 0, y: 40 }}
                                to={isDesktop ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 1, y: 0 }}
                                threshold={0.1}
                                rootMargin="-100px"
                                tag="h2"
                                textAlign="center"
                            />
                        </div>
                    )}

                    {/* SCENE 1E TEXT-9 — appears at scene-1e frame _116, exits at scene-1f _045 */}
                    {showScene9Text && (
                        <div className="scene-9-text col-start-1 row-start-1 place-self-center max-w-[90vw] sm:max-w-3xl px-4 sm:px-8 text-center">
                            {isDesktop ? (
                                <SplitText
                                    text="Your space suit and ship are ready"
                                    className="text-center text-2xl sm:text-4xl lg:text-5xl xl:text-6xl landscape:max-md:text-xl landscape:max-lg:text-2xl font-bold tracking-tighter text-white leading-tight drop-shadow-md"
                                    delay={isDesktop ? 60 : 60}
                                    duration={isDesktop ? 0.5 : 0.6}
                                    ease={isDesktop ? "power3.out" : "power4.out"}
                                    splitType="words"
                                    from={{ opacity: 0, y: 25, filter: 'blur(8px)' }}
                                    to={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                    threshold={0.1}
                                    rootMargin="-100px"
                                    tag="h2"
                                    textAlign="center"
                                />
                            ) : (
                                <TextType
                                    text="Your space suit and ship are ready"
                                    as="h2"
                                    typingSpeed={60}
                                    deletingSpeed={40}
                                    pauseDuration={999999}
                                    loop={false}
                                    showCursor
                                    cursorCharacter="_"
                                    cursorBlinkDuration={0.5}
                                    className="text-center text-2xl sm:text-4xl lg:text-5xl xl:text-6xl landscape:max-md:text-xl landscape:max-lg:text-2xl font-bold tracking-tighter text-white leading-tight drop-shadow-md"
                                />
                            )}
                        </div>
                    )}

                    {/* SCENE 1F TEXT-10 — appears at scene-1f frame _061, exits at _114 */}
                    {showScene10Text && (
                        <div className="scene-10-text col-start-1 row-start-1 self-start justify-self-center mt-[25vh] md:self-start md:justify-self-center md:mt-[30vh] md:mb-0 md:ml-0 lg:self-start lg:justify-self-center lg:mt-[25vh] lg:mb-0 lg:ml-0 max-w-[90vw] sm:max-w-2xl lg:max-w-none px-4">
                            {isDesktop ? (
                                <SplitText
                                    text="But first... you need to register"
                                    className="text-center text-2xl sm:text-4xl lg:text-5xl xl:text-6xl landscape:max-md:text-xl landscape:max-lg:text-2xl font-bold tracking-tighter text-white leading-tight drop-shadow-md"
                                    delay={isDesktop ? 60 : 60}
                                    duration={isDesktop ? 0.5 : 0.6}
                                    ease={isDesktop ? "power3.out" : "power4.out"}
                                    splitType="words"
                                    from={{ opacity: 0, y: 25, filter: 'blur(8px)' }}
                                    to={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                    threshold={0.1}
                                    rootMargin="-100px"
                                    tag="h2"
                                    textAlign="center"
                                />
                            ) : (
                                <TextType
                                    text="But first... you need to register"
                                    as="h2"
                                    typingSpeed={60}
                                    deletingSpeed={40}
                                    pauseDuration={999999}
                                    loop={false}
                                    showCursor
                                    cursorCharacter="_"
                                    cursorBlinkDuration={0.5}
                                    className="text-center text-2xl sm:text-4xl lg:text-5xl xl:text-6xl landscape:max-md:text-xl landscape:max-lg:text-2xl font-bold tracking-tighter text-white leading-tight drop-shadow-md"
                                />
                            )}
                        </div>
                    )}

                    <div className="scene-1f-auth opacity-0 col-start-1 row-start-1 w-full flex justify-center items-start pt-[5vh] px-4 sm:px-8 pointer-events-none z-50">
                        <AuthForm initialMode={authMode} onSuccess={handleAuthSuccess} />
                    </div>
                </div>
            </div>
        </div>
    );
}


