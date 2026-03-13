'use client';

import { useEffect, useMemo, useRef, useCallback } from 'react';
import { useGesture } from '@use-gesture/react';

type ImageItem = string | { src: string; alt?: string };

type DomeGalleryProps = {
    images?: ImageItem[];
    fit?: number;
    fitBasis?: 'auto' | 'min' | 'max' | 'width' | 'height';
    minRadius?: number;
    maxRadius?: number;
    padFactor?: number;
    overlayBlurColor?: string;
    maxVerticalRotationDeg?: number;
    dragSensitivity?: number;
    enlargeTransitionMs?: number;
    segments?: number;
    dragDampening?: number;
    openedImageWidth?: string;
    openedImageHeight?: string;
    imageBorderRadius?: string;
    openedImageBorderRadius?: string;
    grayscale?: boolean;
};

type ItemDef = {
    src: string;
    alt: string;
    x: number;
    y: number;
    sizeX: number;
    sizeY: number;
};

const DEFAULT_IMAGES: ImageItem[] = [
    {
        src: 'https://images.unsplash.com/photo-1755331039789-7e5680e26e8f?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        alt: 'Abstract art'
    },
    {
        src: 'https://images.unsplash.com/photo-1755569309049-98410b94f66d?q=80&w=772&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        alt: 'Modern sculpture'
    },
    {
        src: 'https://images.unsplash.com/photo-1755497595318-7e5e3523854f?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        alt: 'Digital artwork'
    },
    {
        src: 'https://images.unsplash.com/photo-1755353985163-c2a0fe5ac3d8?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        alt: 'Contemporary art'
    },
    {
        src: 'https://images.unsplash.com/photo-1745965976680-d00be7dc0377?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        alt: 'Geometric pattern'
    },
    {
        src: 'https://images.unsplash.com/photo-1752588975228-21f44630bb3c?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        alt: 'Textured surface'
    },
    {
        src: 'https://pbs.twimg.com/media/Gyla7NnXMAAXSo_?format=jpg&name=large',
        alt: 'Social media image'
    }
];

const DEFAULTS = {
    maxVerticalRotationDeg: 5,
    dragSensitivity: 20,
    enlargeTransitionMs: 300,
    segments: 35
};

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const normalizeAngle = (d: number) => ((d % 360) + 360) % 360;
const wrapAngleSigned = (deg: number) => {
    const a = (((deg + 180) % 360) + 360) % 360;
    return a - 180;
};
const getDataNumber = (el: HTMLElement, name: string, fallback: number) => {
    const attr = el.dataset[name] ?? el.getAttribute(`data-${name}`);
    const n = attr == null ? NaN : parseFloat(attr);
    return Number.isFinite(n) ? n : fallback;
};

function buildItems(pool: ImageItem[], seg: number): ItemDef[] {
    const xCols = Array.from({ length: seg }, (_, i) => -37 + i * 2);
    const evenYs = [-4, -2, 0, 2, 4];
    const oddYs = [-3, -1, 1, 3, 5];

    const coords = xCols.flatMap((x, c) => {
        const ys = c % 2 === 0 ? evenYs : oddYs;
        return ys.map(y => ({ x, y, sizeX: 2, sizeY: 2 }));
    });

    const totalSlots = coords.length;
    if (pool.length === 0) {
        return coords.map(c => ({ ...c, src: '', alt: '' }));
    }

    const normalizedImages = pool.map(image => {
        if (typeof image === 'string') {
            return { src: image, alt: '' };
        }
        return { src: image.src || '', alt: image.alt || '' };
    });

    const usedImages = Array.from({ length: totalSlots }, (_, i) => normalizedImages[i % normalizedImages.length]);

    return coords.map((c, i) => ({
        ...c,
        src: usedImages[i].src,
        alt: usedImages[i].alt
    }));
}

function computeItemBaseRotation(offsetX: number, offsetY: number, sizeX: number, sizeY: number, segments: number) {
    const unit = 360 / segments / 2;
    const rotateY = unit * (offsetX + (sizeX - 1) / 2);
    const rotateX = unit * (offsetY - (sizeY - 1) / 2);
    return { rotateX, rotateY };
}

export default function DomeGallery({
    images = DEFAULT_IMAGES,
    fit = 0.5,
    fitBasis = 'auto',
    minRadius = 600,
    maxRadius = Infinity,
    padFactor = 0.25,
    overlayBlurColor = '#060010',
    maxVerticalRotationDeg = DEFAULTS.maxVerticalRotationDeg,
    dragSensitivity = DEFAULTS.dragSensitivity,
    enlargeTransitionMs = DEFAULTS.enlargeTransitionMs,
    segments = DEFAULTS.segments,
    dragDampening = 2,
    openedImageWidth = '400px',
    openedImageHeight = '400px',
    imageBorderRadius = '30px',
    openedImageBorderRadius = '30px',
    grayscale = true
}: DomeGalleryProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const mainRef = useRef<HTMLDivElement>(null);
    const sphereRef = useRef<HTMLDivElement>(null);
    const frameRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<HTMLDivElement>(null);
    const scrimRef = useRef<HTMLDivElement>(null);
    const focusedElRef = useRef<HTMLElement | null>(null);
    const originalTilePositionRef = useRef<{
        left: number;
        top: number;
        width: number;
        height: number;
    } | null>(null);

    const rotationRef = useRef({ x: 0, y: 0 });
    const startRotRef = useRef({ x: 0, y: 0 });
    const startPosRef = useRef<{ x: number; y: number } | null>(null);
    const draggingRef = useRef(false);
    const movedRef = useRef(false);
    const inertiaRAF = useRef<number | null>(null);
    const pointerTypeRef = useRef<'mouse' | 'pen' | 'touch'>('mouse');
    const tapTargetRef = useRef<HTMLElement | null>(null);
    const openingRef = useRef(false);
    const openStartedAtRef = useRef(0);
    const lastDragEndAt = useRef(0);

    const scrollLockedRef = useRef(false);
    const lockScroll = useCallback(() => {
        if (scrollLockedRef.current) return;
        scrollLockedRef.current = true;
        document.body.classList.add('dg-scroll-lock');
    }, []);
    const unlockScroll = useCallback(() => {
        if (!scrollLockedRef.current) return;
        if (rootRef.current?.getAttribute('data-enlarging') === 'true') return;
        scrollLockedRef.current = false;
        document.body.classList.remove('dg-scroll-lock');
    }, []);

    const items = useMemo(() => buildItems(images, segments), [images, segments]);

    const applyTransform = (xDeg: number, yDeg: number) => {
        const el = sphereRef.current;
        if (el) {
            el.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${xDeg}deg) rotateY(${yDeg}deg)`;
        }
    };

    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        const ro = new ResizeObserver(entries => {
            const cr = entries[0].contentRect;
            const w = Math.max(1, cr.width),
                h = Math.max(1, cr.height);
            const minDim = Math.min(w, h),
                maxDim = Math.max(w, h),
                aspect = w / h;
            let basis: number;
            switch (fitBasis) {
                case 'min': basis = minDim; break;
                case 'max': basis = maxDim; break;
                case 'width': basis = w; break;
                case 'height': basis = h; break;
                default: basis = aspect >= 1.3 ? w : minDim;
            }
            let radius = basis * fit;
            radius = Math.min(radius, h * 1.35);
            radius = clamp(radius, minRadius, maxRadius);

            const viewerPad = Math.max(8, Math.round(minDim * padFactor));
            root.style.setProperty('--radius', `${Math.round(radius)}px`);
            root.style.setProperty('--viewer-pad', `${viewerPad}px`);
            root.style.setProperty('--overlay-blur-color', overlayBlurColor);
            root.style.setProperty('--tile-radius', imageBorderRadius);
            root.style.setProperty('--enlarge-radius', openedImageBorderRadius);
            root.style.setProperty('--image-filter', grayscale ? 'grayscale(1)' : 'none');
            applyTransform(rotationRef.current.x, rotationRef.current.y);
        });
        ro.observe(root);
        return () => ro.disconnect();
    }, [fit, fitBasis, minRadius, maxRadius, padFactor, overlayBlurColor, grayscale, imageBorderRadius, openedImageBorderRadius]);

    useEffect(() => {
        applyTransform(rotationRef.current.x, rotationRef.current.y);
    }, []);

    useEffect(() => {
        let rafId: number;
        const rotate = () => {
            if (!draggingRef.current && !openingRef.current && !inertiaRAF.current) {
                rotationRef.current.y = wrapAngleSigned(rotationRef.current.y - 0.03);
                applyTransform(rotationRef.current.x, rotationRef.current.y);
            }
            rafId = requestAnimationFrame(rotate);
        };
        rafId = requestAnimationFrame(rotate);
        return () => cancelAnimationFrame(rafId);
    }, []);

    const stopInertia = useCallback(() => {
        if (inertiaRAF.current) {
            cancelAnimationFrame(inertiaRAF.current);
            inertiaRAF.current = null;
        }
    }, []);

    const startInertia = useCallback(
        (vx: number, vy: number) => {
            const MAX_V = 1.4;
            let vX = clamp(vx, -MAX_V, MAX_V) * 80;
            let vY = clamp(vy, -MAX_V, MAX_V) * 80;
            let frames = 0;
            const d = clamp(dragDampening ?? 0.6, 0, 1);
            const frictionMul = 0.94 + 0.055 * d;
            const stopThreshold = 0.015 - 0.01 * d;
            const maxFrames = Math.round(90 + 270 * d);
            const step = () => {
                vX *= frictionMul;
                vY *= frictionMul;
                if (Math.abs(vX) < stopThreshold && Math.abs(vY) < stopThreshold || ++frames > maxFrames) {
                    inertiaRAF.current = null;
                    return;
                }
                const nextX = clamp(rotationRef.current.x - vY / 200, -maxVerticalRotationDeg, maxVerticalRotationDeg);
                const nextY = wrapAngleSigned(rotationRef.current.y + vX / 200);
                rotationRef.current = { x: nextX, y: nextY };
                applyTransform(nextX, nextY);
                inertiaRAF.current = requestAnimationFrame(step);
            };
            stopInertia();
            inertiaRAF.current = requestAnimationFrame(step);
        },
        [dragDampening, maxVerticalRotationDeg, stopInertia]
    );

    useGesture(
        {
            onDragStart: ({ event }) => {
                if (focusedElRef.current) return;
                stopInertia();
                const evt = event as PointerEvent;
                pointerTypeRef.current = (evt.pointerType as any) || 'mouse';
                if (pointerTypeRef.current === 'touch') { evt.preventDefault(); lockScroll(); }
                draggingRef.current = true;
                movedRef.current = false;
                startRotRef.current = { ...rotationRef.current };
                startPosRef.current = { x: evt.clientX, y: evt.clientY };
                tapTargetRef.current = (evt.target as Element).closest?.('.dg-image') as HTMLElement | null;
            },
            onDrag: ({ event, last, velocity: velArr = [0, 0], direction: dirArr = [0, 0], movement }) => {
                if (focusedElRef.current || !draggingRef.current || !startPosRef.current) return;
                const evt = event as PointerEvent;
                const dxTotal = evt.clientX - startPosRef.current.x;
                const dyTotal = evt.clientY - startPosRef.current.y;
                if (!movedRef.current && (dxTotal * dxTotal + dyTotal * dyTotal > 16)) movedRef.current = true;

                const nextX = clamp(startRotRef.current.x - dyTotal / dragSensitivity, -maxVerticalRotationDeg, maxVerticalRotationDeg);
                const nextY = startRotRef.current.y + dxTotal / dragSensitivity;

                if (rotationRef.current.x !== nextX || rotationRef.current.y !== nextY) {
                    rotationRef.current = { x: nextX, y: nextY };
                    applyTransform(nextX, nextY);
                }

                if (last) {
                    draggingRef.current = false;
                    let isTap = false;
                    if (startPosRef.current) {
                        const dx = evt.clientX - startPosRef.current.x;
                        const dy = evt.clientY - startPosRef.current.y;
                        if (dx * dx + dy * dy <= (pointerTypeRef.current === 'touch' ? 10 : 6) ** 2) isTap = true;
                    }
                    if (!isTap) {
                        let [vx, vy] = [velArr[0] * dirArr[0], velArr[1] * dirArr[1]];
                        if (Math.abs(vx) < 0.001 && Math.abs(vy) < 0.001 && Array.isArray(movement)) {
                            vx = (movement[0] / dragSensitivity) * 0.02;
                            vy = (movement[1] / dragSensitivity) * 0.02;
                        }
                        if (Math.abs(vx) > 0.005 || Math.abs(vy) > 0.005) startInertia(vx, vy);
                    }
                    if (isTap && tapTargetRef.current) openItemFromElement(tapTargetRef.current);
                    startPosRef.current = null; tapTargetRef.current = null;
                    if (pointerTypeRef.current === 'touch') unlockScroll();
                    if (movedRef.current) lastDragEndAt.current = performance.now();
                    movedRef.current = false;
                }
            }
        },
        { target: mainRef, eventOptions: { passive: false } }
    );

    useEffect(() => {
        const scrim = scrimRef.current;
        if (!scrim) return;
        const close = () => {
            if (performance.now() - openStartedAtRef.current < 250) return;
            const el = focusedElRef.current;
            if (!el) return;
            const parent = el.parentElement as HTMLElement;
            const overlay = viewerRef.current?.querySelector('.enlarge') as HTMLElement | null;
            const downloadBtn = viewerRef.current?.querySelector('.dg-download-btn') as HTMLElement | null;
            if (!overlay) return;

            const originalPos = originalTilePositionRef.current;
            if (!originalPos) {
                overlay.remove();
                downloadBtn?.remove();
                el.style.visibility = '';
                focusedElRef.current = null;
                rootRef.current?.removeAttribute('data-enlarging');
                openingRef.current = false;
                return;
            }

            const rootRect = rootRef.current!.getBoundingClientRect();

            // To find the current position of the slot, we temporarily reset deltas
            parent.style.setProperty('--rot-y-delta', `0deg`);
            parent.style.setProperty('--rot-x-delta', `0deg`);

            // Use a temporary ref to get the current screen position of the target slot
            const tempRef = document.createElement('div');
            tempRef.className = 'dg-image dg-image--reference opacity-0';
            const offsetX = getDataNumber(parent, 'offsetX', 0);
            const offsetY = getDataNumber(parent, 'offsetY', 0);
            const parentRot = computeItemBaseRotation(offsetX, offsetY, 2, 2, segments);
            tempRef.style.transform = `rotateX(${-parentRot.rotateX}deg) rotateY(${-parentRot.rotateY}deg)`;
            parent.appendChild(tempRef);

            void tempRef.offsetHeight; // force reflow
            const currentSlotRect = tempRef.getBoundingClientRect();

            const animatingOverlay = document.createElement('div');
            animatingOverlay.className = 'enlarge-closing';
            animatingOverlay.style.cssText = `
                position: absolute;
                left: ${overlay.getBoundingClientRect().left - rootRect.left}px;
                top: ${overlay.getBoundingClientRect().top - rootRect.top}px;
                width: ${overlay.offsetWidth}px;
                height: ${overlay.offsetHeight}px;
                z-index: 9999;
                border-radius: ${openedImageBorderRadius};
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0,0,0,.35);
                transition: all ${enlargeTransitionMs}ms cubic-bezier(0.2, 0, 0.2, 1);
                pointer-events: none;
            `;
            const originalImg = overlay.querySelector('img');
            if (originalImg) {
                const img = originalImg.cloneNode() as HTMLImageElement;
                img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
                animatingOverlay.appendChild(img);
            }
            overlay.remove();
            downloadBtn?.remove();
            rootRef.current!.appendChild(animatingOverlay);
            void animatingOverlay.getBoundingClientRect();

            requestAnimationFrame(() => {
                animatingOverlay.style.left = (currentSlotRect.left - rootRect.left) + 'px';
                animatingOverlay.style.top = (currentSlotRect.top - rootRect.top) + 'px';
                animatingOverlay.style.width = currentSlotRect.width + 'px';
                animatingOverlay.style.height = currentSlotRect.height + 'px';
                animatingOverlay.style.opacity = '0';
            });

            animatingOverlay.addEventListener('transitionend', () => {
                animatingOverlay.remove();
                parent.removeChild(tempRef);
                el.style.visibility = '';
                focusedElRef.current = null;
                rootRef.current?.removeAttribute('data-enlarging');
                openingRef.current = false;
                unlockScroll();
            }, { once: true });
        };
        scrim.addEventListener('click', close);
        window.addEventListener('keydown', (e) => e.key === 'Escape' && close());
        return () => { scrim.removeEventListener('click', close); };
    }, [enlargeTransitionMs, openedImageBorderRadius, unlockScroll]);

    const openItemFromElement = (el: HTMLElement) => {
        if (openingRef.current) return;
        openingRef.current = true;
        openStartedAtRef.current = performance.now();
        lockScroll();
        const parent = el.parentElement as HTMLElement;
        focusedElRef.current = el;
        const offsetX = getDataNumber(parent, 'offsetX', 0);
        const offsetY = getDataNumber(parent, 'offsetY', 0);
        const parentRot = computeItemBaseRotation(offsetX, offsetY, 2, 2, segments);
        const globalY = normalizeAngle(rotationRef.current.y);
        let rotY = -(normalizeAngle(parentRot.rotateY) + globalY) % 360;
        if (rotY < -180) rotY += 360;
        parent.style.setProperty('--rot-y-delta', `${rotY}deg`);
        parent.style.setProperty('--rot-x-delta', `${-parentRot.rotateX - rotationRef.current.x}deg`);

        const refDiv = document.createElement('div');
        refDiv.className = 'dg-image dg-image--reference opacity-0';
        refDiv.style.transform = `rotateX(${-parentRot.rotateX}deg) rotateY(${-parentRot.rotateY}deg)`;
        parent.appendChild(refDiv);
        void refDiv.offsetHeight;

        const tileR = refDiv.getBoundingClientRect();
        const mainR = mainRef.current?.getBoundingClientRect();
        const frameR = frameRef.current?.getBoundingClientRect();

        if (!mainR || !frameR) { openingRef.current = false; parent.removeChild(refDiv); unlockScroll(); return; }

        originalTilePositionRef.current = { left: tileR.left, top: tileR.top, width: tileR.width, height: tileR.height };
        el.style.visibility = 'hidden';
        const overlay = document.createElement('div');
        overlay.className = 'enlarge';
        overlay.style.cssText = `position:absolute; left:${frameR.left - mainR.left}px; top:${frameR.top - mainR.top}px; width:${frameR.width}px; height:${frameR.height}px; opacity:0; z-index:30; transition:transform ${enlargeTransitionMs}ms ease, opacity ${enlargeTransitionMs}ms ease; border-radius:${openedImageBorderRadius}; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,.35); transform-origin: top left; pointer-events: auto;`;
        const img = document.createElement('img');
        img.crossOrigin = 'anonymous';
        // Fallback for non-CORS images: if it fails to load with crossOrigin, retry without it
        img.onerror = () => {
            if (img.crossOrigin === 'anonymous') {
                img.crossOrigin = null;
                img.src = parent.dataset.src || '';
            }
        };
        img.src = parent.dataset.src || '';
        img.style.cssText = `width:100%; height:100%; object-fit:cover; filter:${grayscale ? 'grayscale(1)' : 'none'};`;
        overlay.appendChild(img);

        // Add Download Button outside the overlay (absolute to rootRef)
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'absolute top-[72px] right-4 sm:top-[88px] sm:right-10 z-[250] flex items-center bg-black/40 backdrop-blur-xl border border-white/20 text-white p-3 sm:px-5 sm:py-3 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest cursor-pointer transition-all dg-download-btn';
        downloadBtn.style.opacity = '0';
        downloadBtn.style.transform = 'translateY(16px)';
        downloadBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="sm:mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span class="hidden sm:inline">Download</span>
        `;

        downloadBtn.onmouseenter = () => {
            downloadBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            downloadBtn.style.borderColor = '#22d3ee';
            downloadBtn.style.color = '#22d3ee';
            downloadBtn.style.transform = 'translateY(0px) scale(1.05)';
        };
        downloadBtn.onmouseleave = () => {
            downloadBtn.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
            downloadBtn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            downloadBtn.style.color = 'white';
            downloadBtn.style.transform = 'translateY(0px) scale(1)';
        };

        downloadBtn.onclick = async (e) => {
            e.stopPropagation();
            const originalContent = downloadBtn.innerHTML;
            const fileName = `ornate-gallery-${Date.now()}.jpg`;

            const showFeedback = (text: string, color: string = '#22d3ee') => {
                downloadBtn.innerHTML = `<span class="px-2">${text}</span>`;
                downloadBtn.style.color = color;
                setTimeout(() => {
                    downloadBtn.innerHTML = originalContent;
                    downloadBtn.style.color = 'white';
                }, 3000);
            };

            showFeedback('PREPARING...');

            try {
                const imageSrc = img.src;

                // Use our dedicated download proxy to bypass CORS and force download
                const downloadUrl = `/api/download?url=${encodeURIComponent(imageSrc)}`;

                // Trigger the browser download behavior
                const link = document.createElement('a');
                link.style.display = 'none';
                link.href = downloadUrl;
                // Content-Disposition: attachment is handled by the server
                document.body.appendChild(link);
                link.click();

                setTimeout(() => {
                    link.remove();
                }, 100);

                showFeedback('DOWNLOADED!');

            } catch (err) {
                // If the proxy fail for some reason, fallback to manual save
                window.open(img.src, '_blank');
                showFeedback('SAVED MANUALLY');
            }
        };

        rootRef.current!.appendChild(downloadBtn);

        viewerRef.current!.appendChild(overlay);
        overlay.style.transform = `translate(${tileR.left - frameR.left}px, ${tileR.top - frameR.top}px) scale(${tileR.width / frameR.width}, ${tileR.height / frameR.height})`;
        setTimeout(() => {
            overlay.style.opacity = '1';
            overlay.style.transform = 'translate(0px, 0px) scale(1, 1)';

            if (downloadBtn) {
                downloadBtn.style.opacity = '1';
                downloadBtn.style.transform = 'translateY(0px)';
            }

            rootRef.current?.setAttribute('data-enlarging', 'true');
            // Reset opening state so rotation can resume if allowed
            setTimeout(() => {
                openingRef.current = false;
            }, enlargeTransitionMs);
        }, 16);
        parent.removeChild(refDiv);
    };

    const cssStyles = `
    .dg-container {
      --radius: 520px;
      --viewer-pad: 72px;
      --circ: calc(var(--radius) * 3.14159);
      --rot-y: calc((360deg / var(--segments-x)) / 2);
      --rot-x: calc((360deg / var(--segments-y)) / 2);
      --item-width: calc(var(--circ) / var(--segments-x));
      --item-height: calc(var(--circ) / var(--segments-y));
    }
    .dg-container * { box-sizing: border-box; }
    .dg-sphere, .dg-item, .dg-image { transform-style: preserve-3d; }
    .dg-stage { width: 100%; height: 100%; display: grid; place-items: center; position: absolute; inset: 0; perspective: calc(var(--radius) * 2); }
    .dg-sphere { transform: translateZ(calc(var(--radius) * -1)); will-change: transform; position: absolute; }
    .dg-item {
      width: calc(var(--item-width) * var(--item-size-x));
      height: calc(var(--item-height) * var(--item-size-y));
      position: absolute; inset: -999px; margin: auto; transform-origin: 50% 50%; backface-visibility: hidden; transition: transform 300ms;
      transform: rotateY(calc(var(--rot-y) * (var(--offset-x) + ((var(--item-size-x) - 1) / 2)) + var(--rot-y-delta, 0deg))) 
                 rotateX(calc(var(--rot-x) * (var(--offset-y) - ((var(--item-size-y) - 1) / 2)) + var(--rot-x-delta, 0deg))) 
                 translateZ(var(--radius));
    }
    .dg-container[data-enlarging="true"] .dg-scrim { opacity: 1 !important; pointer-events: all !important; }
    .dg-image { position: absolute; inset: 10px; border-radius: var(--tile-radius, 12px); overflow: hidden; cursor: pointer; backface-visibility: hidden; transition: transform 300ms; transform: translateZ(0); }
    .dg-image--reference { position: absolute; inset: 10px; pointer-events: none; }
    .dg-scroll-lock { overflow: hidden !important; touch-action: none !important; }
  `;

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
            <div ref={rootRef} className="dg-container relative w-full h-full" style={{ '--segments-x': segments, '--segments-y': segments } as any}>
                <main ref={mainRef} className="absolute inset-0 grid place-items-center overflow-hidden select-none bg-transparent" style={{ touchAction: 'none' }}>
                    <div className="dg-stage">
                        <div ref={sphereRef} className="dg-sphere">
                            {items.map((it, i) => (
                                <div key={i} className="dg-item" data-src={it.src} data-offset-x={it.x} data-offset-y={it.y} data-size-x={it.sizeX} data-size-y={it.sizeY}
                                    style={{ '--offset-x': it.x, '--offset-y': it.y, '--item-size-x': it.sizeX, '--item-size-y': it.sizeY } as any}>
                                    <div className="dg-image bg-gray-900 border border-white/5">
                                        {it.src ? (
                                            <img
                                                src={it.src}
                                                alt={it.alt}
                                                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                                                style={{ filter: `var(--image-filter)` }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white/5 uppercase text-[6px] tracking-widest font-black">Empty Sector</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `radial-gradient(rgba(0,0,0,0) 65%, var(--overlay-blur-color) 100%)` }} />
                    <div ref={viewerRef} className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                        <div ref={scrimRef} className="dg-scrim absolute inset-0 z-10 pointer-events-none opacity-0 transition-opacity duration-500 bg-black/60 backdrop-blur-md" />
                        <div ref={frameRef} className="dg-frame relative" style={{ maxWidth: '85vw', maxHeight: '85vh', width: openedImageWidth, height: openedImageHeight, borderRadius: `var(--enlarge-radius)` }} />
                    </div>
                </main>
            </div>
        </>
    );
}
