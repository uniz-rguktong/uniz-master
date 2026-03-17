'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SVGLoader } from 'three-stdlib';
import gsap from 'gsap';
import { getAssetUrl } from '@/lib/assets';
import { Great_Vibes } from 'next/font/google';

const greatVibes = Great_Vibes({ weight: '400', subsets: ['latin'] });

export default function IntroAnimation({ onComplete }: { onComplete: () => void }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const maskOverlayRef = useRef<HTMLDivElement>(null);
    const signatureRef = useRef<HTMLDivElement>(null);
    const signaturePathRef = useRef<SVGPathElement>(null);

    useEffect(() => {
        let isMounted = true;
        let animationFrameId: number;
        let tl: gsap.core.Timeline | null = null;

        if (!canvasRef.current || !containerRef.current) return;

        // --- SCENE SETUP ---
        const w = window.innerWidth;
        const h = window.innerHeight;
        const scene = new THREE.Scene();

        // 1. Ambient Background (Deep-space depth)
        scene.fog = new THREE.FogExp2(0x050505, 0.0006);

        const camera = new THREE.PerspectiveCamera(45, w / h, 1, 10000);
        camera.position.z = 1500;

        const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Background subtle floating particles - calm drifting stars
        const bgParticleCount = 1500;
        const bgGeometry = new THREE.BufferGeometry();
        const bgPositions = new Float32Array(bgParticleCount * 3);
        const bgOpacities = new Float32Array(bgParticleCount);

        for (let i = 0; i < bgParticleCount; i++) {
            bgPositions[i * 3] = (Math.random() - 0.5) * 4000;
            bgPositions[i * 3 + 1] = (Math.random() - 0.5) * 4000;
            bgPositions[i * 3 + 2] = (Math.random() - 0.5) * 3000 - 500;
            bgOpacities[i] = Math.random() * 0.5;
        }

        bgGeometry.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3));
        bgGeometry.setAttribute('aOpacity', new THREE.BufferAttribute(bgOpacities, 1));

        const bgMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uOpacityMulti: { value: 1.0 }
            },
            vertexShader: `
                attribute float aOpacity;
                varying float vOpacity;
                uniform float uTime;
                void main() {
                    vOpacity = aOpacity;
                    vec3 pos = position;
                    // Slower, majestic drift to create a detailed calm environment
                    pos.x += sin(uTime * 0.1 + position.y * 0.003) * 60.0;
                    pos.y += sin(uTime * 0.1 + position.x * 0.003) * 60.0;
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = (6000.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying float vOpacity;
                uniform float uOpacityMulti;
                void main() {
                    float dist = length(gl_PointCoord - vec2(0.5));
                    if (dist > 0.5) discard;
                    gl_FragColor = vec4(1.0, 1.0, 1.0, vOpacity * (1.0 - dist * 2.0) * uOpacityMulti);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const bgParticles = new THREE.Points(bgGeometry, bgMaterial);
        scene.add(bgParticles);


        // --- MAIN LOGO PARTICLES SETUP ---
        const particleCount = 25000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const targetPositions = new Float32Array(particleCount * 3);
        const randomPositions = new Float32Array(particleCount * 3);
        const isOrbiting = new Float32Array(particleCount);
        const orbitOffsets = new Float32Array(particleCount);
        const randomColors = new Float32Array(particleCount);

        const loader = new SVGLoader();
        // Always load logo.svg from local /public to avoid CORS issues with SVGLoader's fetch.
        // The CDN R2 bucket lacks Access-Control-Allow-Origin headers for this file.
        loader.load('/assets/logo.svg', (data) => {
            const paths = data.paths;
            const logoPoints: THREE.Vector3[] = [];

            // 3. Better Particle Distribution From SVG (Sample path outlines cleanly)
            for (let i = 0; i < paths.length; i++) {
                const subPaths = paths[i].subPaths;
                for (let j = 0; j < subPaths.length; j++) {
                    const points = subPaths[j].getSpacedPoints(600);
                    points.forEach(p => {
                        logoPoints.push(new THREE.Vector3(p.x, -p.y, 0));
                    });
                }
            }

            const box = new THREE.Box3().setFromPoints(logoPoints);
            const center = new THREE.Vector3();
            box.getCenter(center);
            const size = new THREE.Vector3();
            box.getSize(size);

            const scaleFactor = Math.min(w, h) / size.x * 0.4;

            logoPoints.forEach(p => {
                p.sub(center).multiplyScalar(scaleFactor);
            });

            for (let i = 0; i < particleCount; i++) {
                // 6. Orbiting Particle Layer (~15% detached)
                const orbiting = Math.random() < 0.15 ? 1.0 : 0.0;
                isOrbiting[i] = orbiting;
                orbitOffsets[i] = Math.random() * Math.PI * 2;
                randomColors[i] = Math.random();

                const radius = 1500 + Math.random() * 2000;
                const theta = Math.random() * 2 * Math.PI;
                const phi = Math.acos((Math.random() * 2) - 1);

                const rx = radius * Math.sin(phi) * Math.cos(theta);
                const ry = radius * Math.sin(phi) * Math.sin(theta);
                const rz = radius * Math.cos(phi) - 500;

                randomPositions[i * 3] = rx;
                randomPositions[i * 3 + 1] = ry;
                randomPositions[i * 3 + 2] = rz;

                positions[i * 3] = rx;
                positions[i * 3 + 1] = ry;
                positions[i * 3 + 2] = rz;

                if (logoPoints.length > 0) {
                    const targetPoint = logoPoints[Math.floor(Math.random() * logoPoints.length)];
                    targetPositions[i * 3] = targetPoint.x + (Math.random() - 0.5);
                    targetPositions[i * 3 + 1] = targetPoint.y + (Math.random() - 0.5);
                    targetPositions[i * 3 + 2] = targetPoint.z + (Math.random() - 0.5) * 2.0;
                }
            }

            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('aTarget', new THREE.BufferAttribute(targetPositions, 3));
            geometry.setAttribute('aRandom', new THREE.BufferAttribute(randomPositions, 3));
            geometry.setAttribute('aIsOrbiting', new THREE.BufferAttribute(isOrbiting, 1));
            geometry.setAttribute('aOrbitOffset', new THREE.BufferAttribute(orbitOffsets, 1));
            geometry.setAttribute('aRandomColor', new THREE.BufferAttribute(randomColors, 1));

            const material = new THREE.ShaderMaterial({
                uniforms: {
                    uProgress: { value: 0 },
                    uTime: { value: 0 },
                    uBrightness: { value: 1.0 },
                    uTransitionAlpha: { value: 1.0 },
                    uSharpMode: { value: 0.0 }
                },
                vertexShader: `
                    attribute vec3 aTarget;
                    attribute vec3 aRandom;
                    attribute float aIsOrbiting;
                    attribute float aOrbitOffset;
                    attribute float aRandomColor;
                    
                    uniform float uProgress;
                    uniform float uTime;
                    uniform float uSharpMode;
                    
                    varying float vProgress;
                    varying float vIsOrbiting;
                    varying vec3 vColor;
                    
                    void main() {
                        vProgress = uProgress;
                        vIsOrbiting = aIsOrbiting;
                        
                        // Energy Convergence (Spiral)
                        float angle = (1.0 - uProgress) * 10.0 + uTime * 0.2;
                        mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
                        vec2 rotatedXY = aRandom.xy * rot;
                        
                        float depthAnim = (1.0 - uProgress) * 1000.0;
                        vec3 startPos = vec3(rotatedXY, aRandom.z + depthAnim);

                        // Particle Motion Smoothing (Drift)
                        vec3 noise = vec3(
                            sin(uTime * 2.0 + aRandom.y * 0.01),
                            cos(uTime * 2.0 + aRandom.x * 0.01),
                            sin(uTime * 2.0 + aRandom.z * 0.01)
                        ) * 50.0 * (1.0 - uProgress);

                        // Elegent Cubic Easing
                        float p = uProgress;
                        float ease = p < 0.5 ? 4.0 * p * p * p : 1.0 - pow(-2.0 * p + 2.0, 3.0) / 2.0;

                        vec3 pos = mix(startPos, aTarget, ease) + noise;

                        // Orbiting Layer snaps back
                        if (aIsOrbiting > 0.5 && uProgress > 0.01) {
                            float orbAngle = uTime * 1.5 + aOrbitOffset; 
                            float orbRadius = 120.0 + sin(aOrbitOffset * 3.0) * 80.0;
                            vec3 orbitTarget = aTarget + vec3(cos(orbAngle) * orbRadius, sin(orbAngle) * orbRadius, sin(orbAngle * 0.5) * orbRadius);
                            pos = mix(pos, orbitTarget, ease * (1.0 - uSharpMode));
                        }
                        
                        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                        
                        // Dynamic particle sizes stretching slightly
                        float pointSizeTarget = mix(6000.0, 2500.0, ease);
                        if (aIsOrbiting > 0.5) pointSizeTarget = mix(pointSizeTarget * 1.8, pointSizeTarget, uSharpMode);
                        
                        gl_PointSize = (pointSizeTarget / -mvPosition.z);
                        gl_Position = projectionMatrix * mvPosition;

                        // ---- PREMIUM GRADIENT CALCULATION ----
                        // Creating a gorgeous vibrant Cyan -> Violet -> Magenta palette based on geometry path X/Y and random noise
                        float mixFactor = (aTarget.x * 0.005 + 0.5) + (aTarget.y * 0.002) + (aRandomColor * 0.2) + sin(uTime * 0.4) * 0.2;
                        mixFactor = clamp(mixFactor, 0.0, 1.0);
                        
                        vec3 colA = vec3(0.0, 0.95, 1.0); // Bright Neon Cyan
                        vec3 colB = vec3(0.48, 0.1, 1.0); // Deep Violet
                        vec3 colC = vec3(1.0, 0.1, 0.6);  // Magenta Pink
                        
                        vec3 gradientColor;
                        if (mixFactor < 0.5) {
                            gradientColor = mix(colA, colB, mixFactor * 2.0);
                        } else {
                            gradientColor = mix(colB, colC, (mixFactor - 0.5) * 2.0);
                        }
                        
                        // When transitioning to header (uSharpMode -> 1), fade cleanly to pure white SVG vector color
                        vColor = mix(gradientColor, vec3(1.0), uSharpMode);
                    }
                `,
                fragmentShader: `
                    uniform float uBrightness;
                    uniform float uTransitionAlpha;
                    uniform float uSharpMode;
                    
                    varying float vIsOrbiting;
                    varying vec3 vColor;
                    
                    void main() {
                        vec2 coord = gl_PointCoord - vec2(0.5);
                        float dist = length(coord);
                        if(dist > 0.5) discard;
                        
                        // Premium MNC particle design:
                        // Sharp hot core with a smooth exponentially decaying optic spark shape
                        float falloff = pow(1.0 - dist * 2.0, 4.0);
                        float core = pow(1.0 - dist * 2.0, 10.0);
                        
                        vec3 color = vColor;
                        
                        // Make orbiters slightly hotter and brighter
                        if (vIsOrbiting > 0.5) {
                            color = mix(color, vec3(1.0), 0.6 * (1.0 - uSharpMode)); 
                        }
                        
                        vec3 finalColor = color * falloff * 1.5 + vec3(1.0) * core;
                        finalColor *= uBrightness;
                        
                        // At uSharpMode = 1.0, transform the spark drops instantly into solid crisp lines
                        float sharpAlpha = step(dist, 0.5);
                        float currentAlpha = mix(falloff, sharpAlpha, uSharpMode) * uTransitionAlpha;
                        
                        gl_FragColor = vec4(finalColor, currentAlpha);
                    }
                `,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });

            const particles = new THREE.Points(geometry, material);
            scene.add(particles);

            if (!isMounted) return;

            // 10. Timing Improvements (Total duration ~5 seconds)
            tl = gsap.timeline({
                onComplete: () => {
                    if (!isMounted) return;
                    gsap.to(containerRef.current, { opacity: 0, duration: 0.8, ease: 'power2.inOut', onComplete });
                }
            });

            // 7. Cinematic Camera Movement (Continuous slow push)
            gsap.to(camera.position, {
                z: 600,
                duration: 3.8,
                ease: "power1.inOut"
            });

            // Stage 1: Convergence (0s to 2.2s)
            tl.to(material.uniforms.uProgress, {
                value: 1,
                duration: 2.2,
                ease: 'power3.inOut'
            }, 0.2);

            // 8. Logo Micro Animation and Brightness Spikes
            tl.to(material.uniforms.uBrightness, {
                value: 3.0,
                duration: 0.4,
                ease: 'power2.out'
            }, 2.1);

            tl.to(material.uniforms.uBrightness, {
                value: 1.0,
                duration: 1.0,
                ease: 'power2.inOut'
            }, 2.5);

            // Make the particles fully sharp and flat before the morph
            tl.to(material.uniforms.uSharpMode, {
                value: 1.0,
                duration: 0.8,
                ease: 'power2.inOut'
            }, 2.5);

            // Loader fade out
            gsap.to(".intro-loader", { opacity: 0, duration: 0.5, delay: 2.5 });

            // 9. Morph into the Header Logo
            const tDesktop = document.getElementById('header-logo');
            const tMobile = document.getElementById('header-logo-mobile');
            // Choose the one that is actually visible/rendered (width > 0)
            const targetLogo = (tMobile && tMobile.getBoundingClientRect().width > 0) ? tMobile : tDesktop;

            let targetScreenX = 46;
            let targetScreenY = 46;
            let targetLogoWidth = 28;

            if (targetLogo) {
                const rect = targetLogo.getBoundingClientRect();
                targetScreenX = rect.left + rect.width / 2;
                targetScreenY = rect.top + rect.height / 2;
                targetLogoWidth = rect.width;
            }

            const vFov = (45 * Math.PI) / 180;
            const finalZ = 600; // Camera Z at the end of the push
            const visibleHeight = 2 * Math.tan(vFov / 2) * finalZ;
            const visibleWidth = visibleHeight * (w / h);

            const targetWorldX = ((targetScreenX / w) - 0.5) * visibleWidth;
            const targetWorldY = (0.5 - (targetScreenY / h)) * visibleHeight;

            const initialWorldWidth = Math.min(w, h) * 0.4;
            const targetWorldWidth = targetLogoWidth * (visibleHeight / h);
            const finalScale = targetWorldWidth / initialWorldWidth;

            // Fly the abstract logo to the header position while shrinking
            tl.to(particles.position, {
                x: targetWorldX,
                y: targetWorldY,
                z: 0,
                duration: 1.5,
                ease: 'power3.inOut'
            }, 3.8);

            tl.to(particles.scale, {
                x: finalScale,
                y: finalScale,
                z: finalScale,
                duration: 1.5,
                ease: 'power3.inOut'
            }, 3.8);

            // Fade out the background as it moves
            tl.to(bgMaterial.uniforms.uOpacityMulti, {
                value: 0,
                duration: 1.0,
                ease: 'power2.out'
            }, 3.8);

            // Reveal landing page beneath by fading mask
            tl.to(maskOverlayRef.current, {
                opacity: 0,
                duration: 1.5,
                ease: 'power2.inOut'
            }, 3.8);

            // Final Canvas fade-out when snap is done
            tl.to(canvasRef.current, {
                opacity: 0,
                duration: 0.3,
                ease: 'power2.inOut'
            }, 5.1);

            // Show container
            tl.to(signatureRef.current, {
                opacity: 1,
                duration: 0.1,
            }, 3.8);

            // True SVG Path Handwriting Reveal (stroke-dashoffset traces the letters elegantly and slowly)
            if (signaturePathRef.current) {
                const length = signaturePathRef.current.getTotalLength();
                tl.fromTo(signaturePathRef.current, 
                    { strokeDasharray: length, strokeDashoffset: length }, 
                    { 
                        strokeDashoffset: 0, 
                        duration: 4.0, // Slower, elegant pacing exactly as requested
                        ease: "power2.inOut" 
                    }, 
                3.8);
            }

            // Keep "Ornate 2026" perfectly visible holding the final frame for 0.1 seconds.
            // When this dummy tween finishes, the entire Intro container (including this text) 
            // smoothly fades out natively via the tl.onComplete callback (normal exit, no reverse).
            tl.set({}, {}, "+=0.01");

        },
            undefined, // onProgress — no-op
            () => {
                // onError fallback: SVG failed to load (CORS or 404).
                // Skip the logo animation and call onComplete after a short delay
                // so the page is not permanently stuck on the loading screen.
                if (!isMounted) return;
                console.warn('[IntroAnimation] logo.svg failed to load — skipping intro animation.');
                setTimeout(() => {
                    if (!isMounted) return;
                    gsap.to(containerRef.current, { opacity: 0, duration: 0.6, ease: 'power2.inOut', onComplete });
                }, 800);
            });

        // --- RENDER LOOP ---
        const clock = new THREE.Clock();

        const render = () => {
            if (!isMounted) return;
            const time = clock.getElapsedTime();

            bgMaterial.uniforms.uTime.value = time;

            scene.children.forEach(child => {
                if (child instanceof THREE.Points) {
                    const mat = child.material as THREE.ShaderMaterial;
                    if (mat && mat.uniforms && mat.uniforms.uTime) {
                        mat.uniforms.uTime.value = time;
                    }
                }
            });

            renderer.render(scene, camera);
            animationFrameId = requestAnimationFrame(render);
        };
        render();

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            isMounted = false;
            if (tl) tl.kill();
            gsap.killTweensOf(camera.position);
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
            renderer.dispose();
            scene.clear();
        };

    }, [onComplete]);

    return (
        <div ref={containerRef} className="fixed inset-0 z-[150] pointer-events-none">
            
            {/* 
                SCENE SIGNATURE — True Handwriting SVG Animation 
                Uses an SVG mask path that traces left-to-right, revealing the variable-width text organically.
            */}
            <div 
                ref={signatureRef} 
                className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none select-none opacity-0"
            >
                <svg viewBox="0 -80 1000 350" className="w-[90vw] md:w-[60vw]" aria-label="Ornate 2026" style={{ overflow: "visible" }}>
                    <defs>
                        <mask id="pen-tracing-mask">
                            {/* This is the invisible thick marker that traces and reveals the text */}
                            <path 
                                ref={signaturePathRef}
                                fill="none" 
                                stroke="white" 
                                strokeWidth="150" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                                // A smooth looping wave path that covers the "Ornate" and "2026" text layout beautifully sequentially
                                d="
                                    M 40 100 
                                    C 20 40, 100 180, 160 120 
                                    C 200 60, 200 160, 240 120 
                                    C 280 60, 280 160, 320 120 
                                    C 360 60, 360 160, 400 120 
                                    C 440 60, 440 160, 480 120 
                                    C 520 60, 520 160, 560 120 

                                    L 580 100 
                                    C 610 40, 610 160, 640 120 
                                    C 670 40, 670 160, 700 120 
                                    C 730 40, 730 160, 760 120 
                                    C 790 40, 790 160, 820 120 
                                    C 850 40, 850 160, 920 120
                                "
                            />
                        </mask>
                    </defs>

                    {/* The premium calligraphic variable-width text */}
                    <text 
                        x="50%" 
                        y="120" 
                        textAnchor="middle" 
                        alignmentBaseline="middle"
                        fill="#A3FF12" 
                        fontSize="140"
                        className={`drop-shadow-[0_0_15px_rgba(163,255,18,0.7)] ${greatVibes.className}`}
                        mask="url(#pen-tracing-mask)"
                    >
                        Ornate 2026
                    </text>
                </svg>
            </div>

            <div
                ref={maskOverlayRef}
                className="absolute inset-0 z-10 bg-[#050505] pointer-events-none"
            />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-20 pointer-events-none" />
            
            <div className="intro-loader absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 text-white opacity-50">
                <div className="relative flex items-center justify-center w-4 h-4 shrink-0">
                    <div className="absolute inset-0 rounded-full border border-white/20 animate-ping" />
                    <div className="w-full h-full rounded-full border-2 border-white border-t-transparent animate-spin" />
                </div>
                <span className="text-[10px] tracking-[0.3em] uppercase">Initializing Core System</span>
            </div>
        </div>
    );
}
