'use client';

import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';


import TextType from '@/components/ui/TextType';
import ScrollIndicators from '@/components/ui/ScrollIndicators';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getAssetUrl } from '@/lib/assets';
import { pingoSpeak } from '@/lib/pingoSpeak';

gsap.registerPlugin(ScrollTrigger);

/**
 * MorphText — dialogue text that morphs in on mount and morphs out on unmount.
 * Enter: blurry blob → sharp readable text (opacity 0 + blur(40px) + scale(1.12) → visible).
 * Exit: handled by the parent GSAP tween targeting the container (.scene-Xt-text).
 */
function MorphText({ children, className }: { children: React.ReactNode; className: string }) {
    const ref = useRef<HTMLHeadingElement>(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        // Morph in: blob sharpens into clean text
        gsap.to(el, {
            opacity: 1,
            filter: 'blur(0px)',
            scale: 1,
            duration: 0.6,
            ease: 'power2.out',
            delay: 0.04,
            clearProps: 'willChange',
        });
        return () => { gsap.killTweensOf(el); };
    }, []);
    return (
        <h2
            ref={ref}
            className={className}
            style={{
                opacity: 0,
                filter: 'blur(40px)',
                transform: 'scale(1.15)',
                willChange: 'filter, transform, opacity'
            }}
        >
            {children}
        </h2>
    );
}

import {
    FRAME_COUNT_1, FRAME_COUNT_2, FRAME_COUNT_3,
    FRAME_COUNT_4, FRAME_COUNT_5, FRAME_COUNT_6,
    TOTAL_FRAMES,
    IMAGES_PATH_1, IMAGES_PATH_2, IMAGES_PATH_3,
    IMAGES_PATH_4, IMAGES_PATH_5, IMAGES_PATH_6
} from '@/lib/sceneConstants';

export default function SceneOne({ introComplete = false }: { introComplete?: boolean }) {
    const { status } = useSession();
    const isAuthenticated = status === 'authenticated';
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wormholeVideoRef = useRef<HTMLVideoElement>(null);
    const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES).fill(null));
    const [isLoaded, setIsLoaded] = useState(false);
    const [showWormhole, setShowWormhole] = useState(false);
    // Ref guard so setShowWormhole never fires on every RAF tick — only on threshold crossing.
    const wormholeShownRef = useRef(false);
    const [isWarpingActive, setIsWarpingActive] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
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
    const [showAuthCTA, setShowAuthCTA] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        setIsDesktop(window.innerWidth >= 1024);
        const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Refs to gate frame-based text transitions (fire exactly once per threshold crossing)
    const text1FadeStartedRef = useRef(false);
    const text1MountedRef = useRef(false); // tracks actual mount state — avoids stale closure bug
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
    const authCTAShownRef = useRef(false);
    // Auto-exit timers for text-1, text-4, text-5, and text-7
    const text1ExitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const text4ExitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const text5ExitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const text7ExitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 🔊 TTS Logic: Voice completely removed from landing page.

    // Flag that gates ALL text logic during a warp jump.
    // When true, the onUpdate skips every text show/hide block.
    const isWarpingRef = useRef(false);

    // Show Scene 1A text 2 seconds after intro logo animation completes
    // Implement 15 frames per second auto-scroll down the scene.
    useEffect(() => {
        if (!introComplete) return;
        if (introComplete) {
            // Text 1 now handled by ScrollTrigger for frame-based entry
        }

        let scrollRaf: number | null = null;
        let resumeTimer: ReturnType<typeof setTimeout> | null = null;
        let isAutoScrolling = false;

        const startAutoScroll = () => {
            if (isAutoScrolling) return;
            isAutoScrolling = true;

            const totalTicks = TOTAL_FRAMES * 4; // Arbitrary smoothing factor
            let currentTick = 0;

            const scrollFrame = () => {
                if (!containerRef.current || !isAutoScrolling) return;
                const totalScroll = containerRef.current.scrollHeight - window.innerHeight;
                const pixelsPerTick = totalScroll / totalTicks;

                if (window.scrollY < totalScroll) {
                    window.scrollBy({ top: pixelsPerTick, behavior: 'instant' });
                    scrollRaf = requestAnimationFrame(scrollFrame);
                } else {
                    isAutoScrolling = false;
                }
            };

            scrollRaf = requestAnimationFrame(scrollFrame);
        };

        // Delay until initial texts and animations settle
        const initialScrollTimer = setTimeout(startAutoScroll, 2500);

        const handleUserInterrupt = () => {
            if (isAutoScrolling) {
                isAutoScrolling = false;
                if (scrollRaf) {
                    cancelAnimationFrame(scrollRaf);
                    scrollRaf = null;
                }
            }

            // Reset the resume timer on every user interaction
            if (resumeTimer) clearTimeout(resumeTimer);

            // Resume auto-scroll after 1 second of inactivity
            resumeTimer = setTimeout(() => {
                startAutoScroll();
            }, 1000);
        };

        window.addEventListener('wheel', handleUserInterrupt, { passive: true });
        window.addEventListener('touchstart', handleUserInterrupt, { passive: true });
        window.addEventListener('touchmove', handleUserInterrupt, { passive: true });

        return () => {
            clearTimeout(initialScrollTimer);
            if (scrollRaf) cancelAnimationFrame(scrollRaf);
            if (resumeTimer) clearTimeout(resumeTimer);
            window.removeEventListener('wheel', handleUserInterrupt);
            window.removeEventListener('touchstart', handleUserInterrupt);
            window.removeEventListener('touchmove', handleUserInterrupt);
        };
    }, [introComplete]);


    // Progressive Background Preload
    useEffect(() => {
        let isMounted = true;

        const loadSequence = async (startIdx: number, frameCount: number, pathPref: string, concurrent = false) => {
            if (concurrent) {
                const promises: Promise<void>[] = [];
                for (let i = 1; i <= frameCount; i++) {
                    promises.push(new Promise((resolve) => {
                        const img = new window.Image();
                        const frameIndex = i.toString().padStart(3, '0');
                        img.src = `${pathPref}${frameIndex}.webp`;
                        img.onload = () => { if (isMounted) imagesRef.current[startIdx + i - 1] = img; resolve(); };
                        img.onerror = () => resolve();
                    }));
                }
                await Promise.all(promises);
            } else {
                for (let i = 1; i <= frameCount; i++) {
                    if (!isMounted) return;
                    await new Promise<void>((resolve) => {
                        const img = new window.Image();
                        const frameIndex = i.toString().padStart(3, '0');
                        img.src = `${pathPref}${frameIndex}.webp`;
                        img.onload = () => { if (isMounted) imagesRef.current[startIdx + i - 1] = img; resolve(); };
                        img.onerror = () => resolve();
                    });
                }
            }
        };

        const loadAllSequences = async () => {
            // Sequence 1 Priority (Concurrent to unlock UI instantly)
            await loadSequence(0, FRAME_COUNT_1, IMAGES_PATH_1, true);
            if (!isMounted) return;
            setIsLoaded(true);

            // Fetch subsequent sequences sequentially to free up Next.js network thread
            await loadSequence(FRAME_COUNT_1, FRAME_COUNT_2, IMAGES_PATH_2, false);
            if (!isMounted) return;

            await loadSequence(FRAME_COUNT_1 + FRAME_COUNT_2, FRAME_COUNT_3, IMAGES_PATH_3, false);
            if (!isMounted) return;

            await loadSequence(FRAME_COUNT_1 + FRAME_COUNT_2 + FRAME_COUNT_3, FRAME_COUNT_4, IMAGES_PATH_4, false);
            if (!isMounted) return;

            await loadSequence(FRAME_COUNT_1 + FRAME_COUNT_2 + FRAME_COUNT_3 + FRAME_COUNT_4, FRAME_COUNT_5, IMAGES_PATH_5, false);
            if (!isMounted) return;

            await loadSequence(FRAME_COUNT_1 + FRAME_COUNT_2 + FRAME_COUNT_3 + FRAME_COUNT_4 + FRAME_COUNT_5, FRAME_COUNT_6, IMAGES_PATH_6, false);
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
                // Guard with a ref so setState fires exactly once, not on every RAF tick.
                if (self.progress > 0.94 && !wormholeShownRef.current) {
                    wormholeShownRef.current = true;
                    setShowWormhole(true);
                } else if (self.progress <= 0.94 && wormholeShownRef.current) {
                    wormholeShownRef.current = false;
                    setShowWormhole(false);
                }

                if (self.progress > 0.95 && !authCTAShownRef.current) {
                    authCTAShownRef.current = true;
                    setShowAuthCTA(true);
                } else if (self.progress <= 0.95 && authCTAShownRef.current) {
                    authCTAShownRef.current = false;
                    setShowAuthCTA(false);
                }

                // ── WARP GUARD ──────────────────────────────────────────────
                // During a warp-drive jump (instant scroll to bottom) GSAP fires
                // onUpdate for every frame in a single tick. Skip all text logic
                // so no dialogue gets mounted in the flash.
                if (isWarpingRef.current) return;

                // ── TEXT-1 SHOW/ENTRY/EXIT (state-based, ref-guarded) ───────────
                // Enter morph handled by MorphText on mount.
                if (frameIndex >= 10 && frameIndex < 105 && !text1MountedRef.current) {
                    text1MountedRef.current = true;
                    text1FadeStartedRef.current = false;
                    setShowScene1aText(true);
                }
                // Scroll-back: unmount if above frame 10
                if (frameIndex < 10 && text1MountedRef.current) {
                    text1MountedRef.current = false;
                    setShowScene1aText(false);
                }

                // Exit fade starts at frame 105. Hard unmount at frame 120.
                if (frameIndex >= 105 && !text1FadeStartedRef.current && text1MountedRef.current) {
                    text1FadeStartedRef.current = true;
                    if (text1ExitTimerRef.current) clearTimeout(text1ExitTimerRef.current);
                    gsap.to(".scene-1a-text", { opacity: 0, duration: 0.5, ease: "power2.out" });
                }
                // Hard-force unmount
                if (frameIndex >= 120 && text1MountedRef.current) {
                    text1MountedRef.current = false;
                    setShowScene1aText(false);
                }
                // Scroll-back recovery: re-show Text-1 only if we're safely back before frame 95
                if (frameIndex < 95 && text1FadeStartedRef.current) {
                    text1FadeStartedRef.current = false;
                    text1MountedRef.current = true;
                    setShowScene1aText(true);
                    gsap.to(".scene-1a-text", { opacity: 1, duration: 0.5, ease: "power2.out" });
                }

                // ── TEXT-2 ENTER ─────────────────────────────────────────────
                // Enters at frame 79 (after Text-1 is fully gone at 65)
                if (frameIndex >= 79 && frameIndex < 164 && !text2ShownRef.current) {
                    text2ShownRef.current = true;
                    text2HideStartedRef.current = false;
                    setShowScene1bText(true);
                }
                // Scroll-back: unmount Text-2 completely
                if ((frameIndex < 60 || frameIndex >= 186) && text2ShownRef.current) {
                    text2ShownRef.current = false;
                    text2HideStartedRef.current = false;
                    setShowScene1bText(false);
                }

                // ── TEXT-2 EXIT ──────────────────────────────────────────────
                if (frameIndex >= 164 && text2ShownRef.current && !text2HideStartedRef.current) {
                    text2HideStartedRef.current = true;
                    gsap.to(".scene-1b-text", { opacity: 0, duration: 0.35, ease: "power2.out" });
                }
                // Scroll-back: restore Text-2
                if (frameIndex < 155 && text2HideStartedRef.current) {
                    text2HideStartedRef.current = false;
                    setShowScene1bText(true);
                    text2ShownRef.current = true;
                    gsap.to(".scene-1b-text", { opacity: 1, duration: 0.35, ease: "power2.out" });
                }

                // ── TEXT-3 ENTER ──────────────────────────────────────────────
                if (frameIndex >= 186 && frameIndex < 223 && !text3ShownRef.current) {
                    text3ShownRef.current = true;
                    text3HideStartedRef.current = false;
                    setShowScene3Text(true);
                }
                // Scroll-back: unmount Text-3
                if ((frameIndex < 170 || frameIndex >= 283) && text3ShownRef.current) {
                    text3ShownRef.current = false;
                    text3HideStartedRef.current = false;
                    setShowScene3Text(false);
                }

                // ── TEXT-3 EXIT ──────────────────────────────────────────────
                if (frameIndex >= 223 && text3ShownRef.current && !text3HideStartedRef.current) {
                    text3HideStartedRef.current = true;
                    gsap.to(".scene-3-text", { opacity: 0, duration: 0.35, ease: "power2.out" });
                }
                // Scroll-back: restore Text-3
                if (frameIndex < 215 && text3HideStartedRef.current) {
                    text3HideStartedRef.current = false;
                    setShowScene3Text(true);
                    text3ShownRef.current = true;
                    gsap.to(".scene-3-text", { opacity: 1, duration: 0.35, ease: "power2.out" });
                }

                // ── TEXT-4 ENTER ──────────────────────────────────────────────
                if (frameIndex >= 283 && frameIndex < 350 && !text4ShownRef.current) {
                    text4ShownRef.current = true;
                    text4HideStartedRef.current = false;
                    setShowScene4Text(true);
                    if (text4ExitTimerRef.current) clearTimeout(text4ExitTimerRef.current);
                }
                // Scroll-back: unmount Text-4
                if ((frameIndex < 265 || frameIndex >= 374) && text4ShownRef.current) {
                    text4ShownRef.current = false;
                    text4HideStartedRef.current = false;
                    setShowScene4Text(false);
                }

                // ── TEXT-4 EXIT ──────────────────────────────────────────────
                if (frameIndex >= 350 && text4ShownRef.current && !text4HideStartedRef.current) {
                    text4HideStartedRef.current = true;
                    if (text4ExitTimerRef.current) clearTimeout(text4ExitTimerRef.current);
                    gsap.to(".scene-4-text", { opacity: 0, duration: 0.35, ease: "power2.out" });
                }
                // Scroll-back: restore Text-4
                if (frameIndex < 340 && text4HideStartedRef.current) {
                    text4HideStartedRef.current = false;
                    if (text4ExitTimerRef.current) clearTimeout(text4ExitTimerRef.current);
                    setShowScene4Text(true);
                    text4ShownRef.current = true;
                    gsap.to(".scene-4-text", { opacity: 1, duration: 0.35, ease: "power2.out" });
                }



                // ── TEXT-6 ENTER ──────────────────────────────────────────────
                if (frameIndex >= 374 && frameIndex < 419 && !text6ShownRef.current) {
                    text6ShownRef.current = true;
                    text6HideStartedRef.current = false;
                    setShowScene6Text(true);
                }
                // Scroll-back: unmount Text-6
                if ((frameIndex < 360 || frameIndex >= 440) && text6ShownRef.current) {
                    text6ShownRef.current = false;
                    text6HideStartedRef.current = false;
                    setShowScene6Text(false);
                }

                // ── TEXT-6 EXIT ──────────────────────────────────────────────
                if (frameIndex >= 419 && text6ShownRef.current && !text6HideStartedRef.current) {
                    text6HideStartedRef.current = true;
                    gsap.to(".scene-6-text", { opacity: 0, duration: 0.35, ease: "power2.out" });
                }
                // Scroll-back: restore Text-6
                if (frameIndex < 410 && text6HideStartedRef.current) {
                    text6HideStartedRef.current = false;
                    setShowScene6Text(true);
                    text6ShownRef.current = true;
                    gsap.to(".scene-6-text", { opacity: 1, duration: 0.35, ease: "power2.out" });
                }

                // ── TEXT-7 ENTER ──────────────────────────────────────────────
                if (frameIndex >= 440 && frameIndex < 479 && !text7ShownRef.current) {
                    text7ShownRef.current = true;
                    text7HideStartedRef.current = false;
                    setShowScene7Text(true);
                    if (text7ExitTimerRef.current) clearTimeout(text7ExitTimerRef.current);
                    text7ExitTimerRef.current = setTimeout(() => {
                        if (!text7ShownRef.current || text7HideStartedRef.current) return;
                        text7HideStartedRef.current = true;
                        gsap.to(".scene-7-text", {
                            opacity: 0, duration: 0.35, ease: "power2.out",
                            onComplete: () => { text7ShownRef.current = false; setShowScene7Text(false); }
                        });
                    }, 5000);
                }
                // Scroll-back: unmount Text-7
                if ((frameIndex < 425 || frameIndex >= 509) && text7ShownRef.current) {
                    text7ShownRef.current = false;
                    text7HideStartedRef.current = false;
                    setShowScene7Text(false);
                }

                // ── TEXT-7 EXIT ──────────────────────────────────────────────
                if (frameIndex >= 479 && text7ShownRef.current && !text7HideStartedRef.current) {
                    text7HideStartedRef.current = true;
                    if (text7ExitTimerRef.current) clearTimeout(text7ExitTimerRef.current);
                    gsap.to(".scene-7-text", { opacity: 0, duration: 0.35, ease: "power2.out" });
                }
                // Scroll-back: restore Text-7
                if (frameIndex < 470 && text7HideStartedRef.current) {
                    text7HideStartedRef.current = false;
                    if (text7ExitTimerRef.current) clearTimeout(text7ExitTimerRef.current);
                    setShowScene7Text(true);
                    text7ShownRef.current = true;
                    gsap.to(".scene-7-text", { opacity: 1, duration: 0.35, ease: "power2.out" });
                }

                // ── TEXT-8 ENTER ──────────────────────────────────────────────
                if (frameIndex >= 509 && frameIndex < 569 && !text8ShownRef.current) {
                    text8ShownRef.current = true;
                    text8HideStartedRef.current = false;
                    setShowScene8Text(true);
                }
                // Scroll-back: unmount Text-8
                if ((frameIndex < 495 || frameIndex >= 595) && text8ShownRef.current) {
                    text8ShownRef.current = false;
                    text8HideStartedRef.current = false;
                    setShowScene8Text(false);
                }

                // ── TEXT-8 EXIT ──────────────────────────────────────────────
                if (frameIndex >= 569 && text8ShownRef.current && !text8HideStartedRef.current) {
                    text8HideStartedRef.current = true;
                    gsap.to(".scene-8-text", { opacity: 0, duration: 0.35, ease: "power2.out" });
                }
                // Scroll-back: restore Text-8
                if (frameIndex < 560 && text8HideStartedRef.current) {
                    text8HideStartedRef.current = false;
                    setShowScene8Text(true);
                    text8ShownRef.current = true;
                    gsap.to(".scene-8-text", { opacity: 1, duration: 0.35, ease: "power2.out" });
                }

                // ── TEXT-9 ENTER ──────────────────────────────────────────────
                if (frameIndex >= 595 && frameIndex < 644 && !text9ShownRef.current) {
                    text9ShownRef.current = true;
                    text9HideStartedRef.current = false;
                    setShowScene9Text(true);

                    if (typeof requestIdleCallback !== 'undefined') {
                        requestIdleCallback(() => { import('@/components/ui/AuthForm'); }, { timeout: 3000 });
                    } else {
                        setTimeout(() => { import('@/components/ui/AuthForm'); }, 500);
                    }
                }
                // Scroll-back: unmount Text-9
                if ((frameIndex < 580 || frameIndex >= 660) && text9ShownRef.current) {
                    text9ShownRef.current = false;
                    text9HideStartedRef.current = false;
                    setShowScene9Text(false);
                }

                // ── TEXT-9 EXIT ──────────────────────────────────────────────
                if (frameIndex >= 644 && text9ShownRef.current && !text9HideStartedRef.current) {
                    text9HideStartedRef.current = true;
                    gsap.to(".scene-9-text", { opacity: 0, duration: 0.35, ease: "power2.out" });
                }
                // Scroll-back: restore Text-9
                if (frameIndex < 635 && text9HideStartedRef.current) {
                    text9HideStartedRef.current = false;
                    setShowScene9Text(true);
                    text9ShownRef.current = true;
                    gsap.to(".scene-9-text", { opacity: 1, duration: 0.35, ease: "power2.out" });
                }

                // ── TEXT-10 ENTER ─────────────────────────────────────────────
                if (frameIndex >= 660 && frameIndex < 713 && !text10ShownRef.current) {
                    text10ShownRef.current = true;
                    text10HideStartedRef.current = false;
                    setShowScene10Text(true);
                }
                // Scroll-back: unmount Text-10
                if ((frameIndex < 645 || frameIndex >= 740) && text10ShownRef.current) {
                    text10ShownRef.current = false;
                    text10HideStartedRef.current = false;
                    setShowScene10Text(false);
                }

                // ── TEXT-10 EXIT ─────────────────────────────────────────────
                if (frameIndex >= 713 && text10ShownRef.current && !text10HideStartedRef.current) {
                    text10HideStartedRef.current = true;
                    gsap.to(".scene-10-text", { opacity: 0, duration: 0.35, ease: "power2.out" });
                }
                // Scroll-back: restore Text-10
                if (frameIndex < 705 && text10HideStartedRef.current) {
                    text10HideStartedRef.current = false;
                    setShowScene10Text(true);
                    text10ShownRef.current = true;
                    gsap.to(".scene-10-text", { opacity: 1, duration: 0.35, ease: "power2.out" });
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
        tl.to(".scene-1f-auth", { opacity: 1, duration: 0.02, ease: "power2.out", pointerEvents: "auto" }, 0.96);

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
        const handleWarpStart = () => {
            // 1. Gate onUpdate so no text logic runs during the jump
            isWarpingRef.current = true;
            setIsWarpingActive(true);

            // 2. Hide every dialogue instantly and lock all refs so
            //    the instant-scroll onUpdate can't re-show them.
            if (text1ExitTimerRef.current) clearTimeout(text1ExitTimerRef.current);
            if (text4ExitTimerRef.current) clearTimeout(text4ExitTimerRef.current);
            if (text5ExitTimerRef.current) clearTimeout(text5ExitTimerRef.current);
            if (text7ExitTimerRef.current) clearTimeout(text7ExitTimerRef.current);

            setShowScene1aText(false);
            setShowScene1bText(false);
            setShowScene3Text(false);
            setShowScene4Text(false);
            setShowScene5Text(false);
            setShowScene6Text(false);
            setShowScene7Text(false);
            setShowScene8Text(false);
            setShowScene9Text(false);
            setShowScene10Text(false);

            // Mark every ref as "already shown AND already hidden" so no
            // show/exit conditions can fire at the bottom frame after warp-end.
            text1FadeStartedRef.current = true;
            text1MountedRef.current = false;
            text2ShownRef.current = true; text2HideStartedRef.current = true;
            text3ShownRef.current = true; text3HideStartedRef.current = true;
            text4ShownRef.current = true; text4HideStartedRef.current = true;
            text5ShownRef.current = true; text5HideStartedRef.current = true;
            text6ShownRef.current = true; text6HideStartedRef.current = true;
            text7ShownRef.current = true; text7HideStartedRef.current = true;
            text8ShownRef.current = true; text8HideStartedRef.current = true;
            text9ShownRef.current = true; text9HideStartedRef.current = true;
            text10ShownRef.current = true; text10HideStartedRef.current = true;
        };
        const handleWarpEnd = () => {
            setIsWarpingActive(false);
            // Re-enable text logic now that we're at the end (auth form frame)
            isWarpingRef.current = false;
        };
        const handleAuthMode = (e: Event) => setAuthMode((e as CustomEvent).detail.mode);
        const handleAuthTrigger = () => handleAuthSuccess();

        window.addEventListener('warp-start', handleWarpStart);
        window.addEventListener('warp-end', handleWarpEnd);
        window.addEventListener('auth-mode', handleAuthMode);
        window.addEventListener('auth-success-trigger', handleAuthTrigger);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('warp-start', handleWarpStart);
            window.removeEventListener('warp-end', handleWarpEnd);
            window.removeEventListener('auth-mode', handleAuthMode);
            window.removeEventListener('auth-success-trigger', handleAuthTrigger);
        };
    }, []);

    // Removed blocking loading screen to prevent layout shifts

    const handleAuthSuccess = () => {
        // Pre-fetch correct destination
        const destination = isAuthenticated ? '/home' : '/login?mode=register';
        router.prefetch(destination);

        const video = wormholeVideoRef.current;
        if (!video) {
            router.push(destination);
            return;
        }

        // Step 1: Start playing the video in the background (it's already opacity-0)
        // We set it to opacity-1 but z-index is likely behind or we wait for play to start.
        video.currentTime = 0;
        const playPromise = video.play();

        const triggerTransition = () => {
            // Step 2: Force the wormhole visible container
            wormholeShownRef.current = true;
            setShowWormhole(true);

            // Immediately remove pointer-events
            gsap.set('.scene-1f-auth', { pointerEvents: 'none' });

            // Clear text overlays
            setShowScene1aText(false);
            setShowScene1bText(false);
            setShowScene3Text(false);
            setShowScene4Text(false);
            setShowScene5Text(false);
            setShowScene6Text(false);
            setShowScene7Text(false);
            setShowScene8Text(false);
            setShowScene9Text(false);
            setShowScene10Text(false);

            const tl = gsap.timeline();

            // Step 3: Fade out the UI and Canvas simultaneously
            // Since the video is now playing BEHIND it, there is no black gap.
            tl.to(['.scene-1f-auth', canvasRef.current], {
                opacity: 0,
                duration: 0.6,
                ease: 'power2.inOut',
                onComplete: () => {
                    gsap.set('.scene-1f-auth', { display: 'none' });
                    window.dispatchEvent(new Event('wormhole-start'));
                }
            });
        };

        if (playPromise !== undefined) {
            playPromise.then(() => {
                // Video started successfully, now fade the campus out
                triggerTransition();
            }).catch((error) => {
                console.error("Wormhole play failed:", error);
                router.push(isAuthenticated ? '/home' : '/login?mode=register');
            });
        } else {
            triggerTransition();
        }
    };



    return (
        <div ref={containerRef} className="relative h-[2700dvh] w-full"> {/* Sextuple height for six combined scenes, dynamic vh for mobile safety */}
            <ScrollIndicators />
            <div className="fixed inset-0 h-[100dvh] w-full overflow-hidden bg-black flex items-center justify-center">
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />

                {/* Wormhole Video Background (Scene Continuation) */}
                <div
                    className={`absolute inset-0 z-0 transition-opacity duration-700 pointer-events-none ${showWormhole ? 'opacity-100' : 'opacity-0'}`}
                >
                    <video
                        ref={wormholeVideoRef}
                        preload="auto"
                        muted
                        playsInline
                        onEnded={() => {
                            // Transition to auth hub or home after the video finishes
                            router.push(isAuthenticated ? '/home' : '/login?mode=register');
                        }}
                        className="w-full h-full object-cover"
                        style={{ transform: 'scale(1.2)' }}
                    >
                        <source src="/assets/wormhole.webm" type="video/webm" />
                    </video>
                </div>

                <div className={`absolute inset-0 z-10 grid place-items-center pointer-events-none transition-opacity duration-[50ms] ${isWarpingActive ? 'opacity-0' : 'opacity-100'}`}>

                    {showScene1aText && (
                        <>
                            <div className="scene-1a-text col-start-1 row-start-1 self-start justify-self-center mt-[20vh] landscape:max-md:mt-[30vh] md:self-start md:justify-self-center md:ml-0 md:mt-[30vh] lg:self-start lg:justify-self-center lg:mt-[25vh] lg:ml-0 max-w-[90vw] sm:max-w-2xl lg:max-w-none px-4">
                                <MorphText className="text-center text-2xl sm:text-4xl lg:text-5xl xl:text-6xl landscape:max-md:text-xl landscape:max-lg:text-2xl font-bold tracking-tighter text-white leading-tight drop-shadow-md">
                                    College fests on Earth have become...boring.
                                </MorphText>
                            </div>

                            {/* Scroll Indicator */}
                            <div className="scene-1a-text col-start-1 row-start-1 self-end justify-self-center mb-[8vh] sm:mb-[10vh] flex flex-col items-center gap-3">
                                <span className="text-[10px] sm:text-[11px] tracking-[0.4em] font-black text-[#A3FF12] uppercase animate-pulse drop-shadow-[0_0_10px_rgba(163,255,18,0.6)]">
                                    Scroll to sequence
                                </span>
                                <div className="w-[20px] h-[32px] sm:w-[24px] sm:h-[38px] rounded-full border border-[#A3FF12]/50 flex justify-center py-1.5 shadow-[0_0_20px_rgba(163,255,18,0.2)]">
                                    <div className="w-[3px] h-[6px] rounded-full bg-[#A3FF12] animate-[bounce_1.5s_infinite] shadow-[0_0_12px_rgba(163,255,18,1)]" />
                                </div>
                            </div>
                        </>
                    )}

                    {/* SCENE 1B CONTENT (Campus) — appears when entering scene 1B, exits smoothly before 1C */}
                    {showScene1bText && (
                        <div className="scene-1b-text col-start-1 row-start-1 place-self-center max-w-[90vw] sm:max-w-2xl lg:max-w-none px-4">
                            <MorphText className="text-center text-2xl sm:text-4xl lg:text-5xl xl:text-6xl landscape:max-md:text-xl landscape:max-lg:text-2xl font-bold tracking-tighter text-white leading-tight drop-shadow-md whitespace-pre-line">
                                {"Same stage.\nSame tents,\nSame samosas."}
                            </MorphText>
                        </div>
                    )}

                    {/* SCENE 1B TEXT-3 — appears at scene-1b frame _067, exits at _104 */}
                    {showScene3Text && (
                        <div className="scene-3-text col-start-1 row-start-1 self-start justify-self-center mt-[33vh] landscape:max-md:mt-[33vh] landscape:max-md:place-self-start landscape:max-md:mb-0 md:self-start md:justify-self-center md:mt-[25vh] md:mb-0 lg:self-start lg:justify-self-center lg:mt-[77vh] lg:mb-0 max-w-[90vw] sm:max-w-3xl lg:max-w-none px-4 sm:px-8">
                            <MorphText className="text-center text-2xl sm:text-4xl lg:text-5xl xl:text-6xl landscape:max-md:text-xl landscape:max-lg:text-2xl font-bold tracking-tighter text-white leading-tight drop-shadow-md whitespace-pre-line">
                                {"So... we decided to do something\nno college has ever done..."}
                            </MorphText>
                        </div>
                    )}

                    {/* SCENE 1C TEXT-4 — appears at scene-1c frame _044, exits before scene-1d frame _001 */}
                    {showScene4Text && (
                        <div className="scene-4-text col-start-1 row-start-1 self-start justify-self-center mt-[25vh] md:self-start md:justify-self-center md:mt-[35vh] md:mr-0 lg:self-start lg:justify-self-center lg:mt-[30vh] lg:ml-0 max-w-[90vw] sm:max-w-2xl lg:max-w-none px-4">
                            <MorphText className="text-center text-2xl sm:text-4xl lg:text-5xl xl:text-6xl landscape:max-md:text-xl landscape:max-lg:text-2xl font-bold tracking-tighter text-white leading-tight drop-shadow-md">
                                What if the ORNATE fest is happening in space?
                            </MorphText>
                        </div>
                    )}



                    {/* SCENE 1D TEXT-6 — appears at scene-1d frame _001, exits at _025 */}
                    {showScene6Text && (
                        <div className="scene-6-text col-start-1 row-start-1 self-start justify-self-center mt-[25vh] md:self-start md:justify-self-center md:mt-[30vh] lg:place-self-start lg:justify-self-center lg:mt-[15vh] max-w-[90vw] sm:max-w-3xl lg:max-w-xl px-4 sm:px-8">
                            <MorphText className="text-center text-2xl sm:text-4xl lg:text-5xl xl:text-6xl landscape:max-md:text-xl landscape:max-lg:text-2xl font-bold tracking-tighter text-white leading-tight drop-shadow-md">
                                {"Yes! \n We're taking ORNATE to space!"}
                            </MorphText>
                        </div>
                    )}

                    {/* SCENE 1D TEXT-7 — appears at scene-1d frame _030, exits all-at-once */}
                    {showScene7Text && (
                        <div className="scene-7-text col-start-1 row-start-1 place-self-center max-w-[90vw] sm:max-w-3xl lg:max-w-none px-4 sm:px-8">
                            <MorphText className="text-center text-2xl sm:text-4xl lg:text-5xl xl:text-6xl landscape:max-md:text-xl landscape:max-lg:text-2xl font-bold tracking-tighter text-white leading-tight drop-shadow-md whitespace-pre-line">
                                {"Branches become Planets. \nEvents become Missions. \nAnd every student becomes an explorer."}
                            </MorphText>
                        </div>
                    )}

                    {/* SCENE 1E TEXT-8 — appears at scene-1e frame _030, exits at _090 */}
                    {showScene8Text && (
                        <div className="scene-8-text col-start-1 row-start-1 place-self-center landscape:max-md:place-self-end landscape:max-md:mb-[15vh] md:self-start md:justify-self-center md:mt-[85vh] md:mr-0 lg:self-start lg:justify-self-center lg:mt-[83vh] lg:mr-0 max-w-[90vw] sm:max-w-2xl lg:max-w-none px-4">
                            <MorphText className="text-center text-2xl sm:text-4xl lg:text-5xl xl:text-6xl landscape:max-md:text-xl landscape:max-lg:text-2xl font-bold tracking-tighter text-white leading-tight drop-shadow-md">
                                And you&apos;ve been selected to join the mission
                            </MorphText>
                        </div>
                    )}

                    {/* SCENE 1E TEXT-9 — appears at scene-1e frame _116, exits at scene-1f _045 */}
                    {showScene9Text && (
                        <div className="scene-9-text col-start-1 row-start-1 place-self-center max-w-[90vw] sm:max-w-3xl px-4 sm:px-8 text-center">
                            <MorphText className="text-center text-2xl sm:text-4xl lg:text-5xl xl:text-6xl landscape:max-md:text-xl landscape:max-lg:text-2xl font-bold tracking-tighter text-white leading-tight drop-shadow-md">
                                {"Your Spaceship & Spacesuit are Ready!"}
                            </MorphText>
                        </div>
                    )}

                    {/* SCENE 1F TEXT-10 — appears at scene-1f frame _061, exits at _114 */}
                    {showScene10Text && (
                        <div className="scene-10-text col-start-1 row-start-1 self-start justify-self-center mt-[25vh] md:self-start md:justify-self-center md:mt-[30vh] md:mb-0 md:ml-0 lg:self-start lg:justify-self-center lg:mt-[25vh] lg:mb-0 lg:ml-0 max-w-[90vw] sm:max-w-2xl lg:max-w-none px-4">
                            <MorphText className="text-center text-2xl sm:text-4xl lg:text-5xl xl:text-6xl landscape:max-md:text-xl landscape:max-lg:text-2xl font-bold tracking-tighter text-white leading-tight drop-shadow-md">
                                But first... you need to Register.
                            </MorphText>
                        </div>
                    )}

                    <div className="scene-1f-auth opacity-0 col-start-1 row-start-1 w-full flex justify-center items-center px-3 sm:px-8 pointer-events-none z-50">
                        <div className="flex flex-col items-center gap-6 sm:gap-8">
                            <div className="flex flex-col items-center opacity-40 group-hover:opacity-80 transition-opacity duration-700">
                                <div className="flex gap-1 sm:gap-2">
                                    {[...Array(isDesktop ? 24 : 12)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-[1.5px] h-[1.5px] sm:w-[2px] sm:h-[2px] bg-[#A3FF12]/40"
                                            style={{ opacity: (i % 3 === 0 || i % 7 === 0) ? 1 : 0.2 }}
                                        />
                                    ))}
                                </div>
                                <span className="text-white/60 text-[8px] sm:text-[10px] tracking-[0.4em] sm:tracking-[0.6em] uppercase mt-2 mb-4">Call from Central Auth Hub</span>
                                <div className="w-[1px] h-8 sm:h-12 bg-gradient-to-t from-[#A3FF12] to-transparent" />
                            </div>

                            <button
                                onClick={handleAuthSuccess}
                                className="group relative px-10 sm:px-24 py-6 sm:py-10 transition-all duration-500 cursor-pointer"
                            >
                                {/* Futuristic Border Base */}
                                <div className="absolute inset-0 border border-[#A3FF12]/20 group-hover:border-[#A3FF12]/80 transition-colors duration-500 overflow-hidden bg-black/60 backdrop-blur-2xl">
                                    {/* Background Grid Pattern */}
                                    <div className="absolute inset-0 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity duration-700"
                                        style={{ backgroundImage: 'linear-gradient(to right, #A3FF12 1px, transparent 1px), linear-gradient(to bottom, #A3FF12 1px, transparent 1px)', backgroundSize: '15px 15px' }} />

                                    {/* Scanning Light Sweep */}
                                    <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#A3FF12] to-transparent top-0 animate-[scan_2s_linear_infinite]" />
                                    <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#A3FF12] to-transparent bottom-0 animate-[scan_2s_linear_infinite_reverse]" />
                                </div>

                                {/* Multi-Layer Glow */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none blur-2xl bg-[#A3FF12]/10" />

                                {/* Side Connection Bars - hidden on very small screens to save space */}
                                <div className="hidden xs:block absolute left-0 top-1/2 -translate-y-1/2 w-2 sm:w-4 h-[80%] border-l-2 border-t-2 border-b-2 border-[#A3FF12] group-hover:w-6 transition-all duration-500" />
                                <div className="hidden xs:block absolute right-0 top-1/2 -translate-y-1/2 w-2 sm:w-4 h-[80%] border-r-2 border-t-2 border-b-2 border-[#A3FF12] group-hover:w-6 transition-all duration-500" />

                                <div className="relative z-10 flex flex-col items-center space-y-1 sm:space-y-2">
                                    <div className="flex items-center gap-2 mb-1 animate-pulse">
                                        <div className="w-1 h-1 rounded-full bg-[#A3FF12] shadow-[0_0_8px_#A3FF12]" />
                                        <span className="text-[8px] sm:text-[10px] tracking-[0.3em] sm:tracking-[0.4em] text-[#A3FF12] uppercase font-bold">Action Required</span>
                                        <div className="w-1 h-1 rounded-full bg-[#A3FF12] shadow-[0_0_8px_#A3FF12]" />
                                    </div>
                                    {/* Main Text */}
                                    <span className="text-[#A3FF12] font-black text-3xl sm:text-5xl tracking-[0.15em] sm:tracking-[0.2em] uppercase transition-all duration-700 group-hover:tracking-[0.35em] drop-shadow-[0_0_25px_rgba(163,255,18,0.7)] group-hover:scale-105">
                                        Let&apos;s Go!
                                    </span>

                                    {/* Subtitle with Status */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] sm:text-[11px] tracking-[0.3em] sm:tracking-[0.4em] text-[#A3FF12]/60 uppercase group-hover:text-[#A3FF12] transition-colors">
                                            Initiating Sequence
                                        </span>
                                        <div className="flex gap-1">
                                            {[...Array(3)].map((_, i) => (
                                                <div key={i} className="w-1 h-1 bg-[#A3FF12] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
