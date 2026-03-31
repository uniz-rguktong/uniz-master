"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import * as THREE from "three";
import gsap from "gsap";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap, ArrowDown } from "lucide-react";

// --- Main Hero Component ---
export const WovenLightHero = () => {
  const navigate = useNavigate();
  const signaturePathRef = useRef<SVGPathElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load elegant serif and sans fonts
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;700;900&family=Great+Vibes&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    // Signature Drawing Animation - Precise and Slow
    if (signaturePathRef.current) {
      const length = signaturePathRef.current.getTotalLength();
      gsap.fromTo(
        signaturePathRef.current,
        { strokeDasharray: length, strokeDashoffset: length },
        {
          strokeDashoffset: 0,
          duration: 7,
          ease: "expo.inOut",
          delay: 0.5,
        },
      );
    }

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-white"
    >
      {/* Interactive Woven Canvas Background */}
      <WovenCanvas />

      <div className="relative z-10 text-center px-4 max-w-5xl pointer-events-none">
        {/* Modern Label */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 1.5 }}
          className="mb-12 inline-flex items-center gap-2 border-b border-slate-100 pb-1"
        >
          <div className="w-1 h-1 rounded-full bg-blue-500" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
            Centralized Academic Portal
          </span>
        </motion.div>

        {/* The Signature - Delicate and Centered */}
        <div className="mb-8 flex items-center justify-center scale-[1.2] md:scale-[1.6]">
          <svg
            viewBox="0 0 1400 400"
            className="w-[90vw] md:w-[900px] h-auto overflow-visible select-none pointer-events-none"
          >
            <defs>
              <linearGradient
                id="signature-grad"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#0F172A" />
                <stop offset="100%" stopColor="#1E293B" />
              </linearGradient>

              <mask id="uniZ-mask-main">
                <path
                  ref={signaturePathRef}
                  fill="none"
                  stroke="white"
                  strokeWidth="320"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M -100 200 C 200 50, 500 350, 700 200 S 1150 50, 1500 200"
                />
              </mask>
            </defs>

            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              alignmentBaseline="middle"
              fill="url(#signature-grad)"
              fontSize="320"
              fontWeight="900"
              style={{ fontFamily: "'Great Vibes', cursive" }}
              className="drop-shadow-[0_10px_40px_rgba(0,0,0,0.04)]"
              mask="url(#uniZ-mask-main)"
            >
              uniz
            </text>
          </svg>
        </div>

        {/* Typography Reveal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 4, duration: 2, ease: "easeOut" }}
          className="flex flex-col items-center pointer-events-auto"
        >
          <h1
            className="text-4xl md:text-7xl font-bold text-[#0F172A] tracking-[-0.04em] leading-[1.1] mb-6"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Reimagining{" "}
            <span className="text-blue-600/90 italic">Mobility.</span>
          </h1>

          <p className="mx-auto mb-12 max-w-lg text-sm md:text-base text-slate-500 font-medium leading-relaxed tracking-tight">
            An interactive tapestry of university governance,
            <br />
            crafted with precision and digital transparency.
          </p>

          <div className="flex justify-center gap-4">
            <Button
              size="lg"
              className="rounded-full px-12 h-14 text-sm font-bold bg-[#0F172A] text-white hover:bg-black transition-all shadow-xl active:scale-95 group"
              onClick={() => navigate("/student/signin")}
            >
              Explore the Weave
              <Zap className="h-4 w-4 fill-current ml-2 transition-transform group-hover:rotate-12" />
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator - very subtle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4, y: [0, 5, 0] }}
        transition={{ delay: 6, duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-20"
      >
        <ArrowDown className="h-5 w-5 text-slate-400" />
      </motion.div>
    </div>
  );
};

// --- Three.js Canvas Component ---
const WovenCanvas = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    const clock = new THREE.Clock();
    const mouse = new THREE.Vector2(-10, -10);

    // --- Woven Web Geometry ---
    // Using a more complex knot for the "Woven" look
    const knotGeometry = new THREE.TorusKnotGeometry(2.2, 0.5, 400, 100);
    const particleCount = knotGeometry.attributes.position.count;

    const positions = new Float32Array(particleCount * 3);
    const initialPositions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const posAttr = knotGeometry.attributes.position;
    for (let i = 0; i < particleCount; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const z = posAttr.getZ(i);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      initialPositions[i * 3] = x;
      initialPositions[i * 3 + 1] = y;
      initialPositions[i * 3 + 2] = z;

      // Color Palette - Multi-colored but soft
      const color = new THREE.Color();
      const h = (i / particleCount) * 0.2 + 0.55; // Blue-ish range
      const s = 0.4;
      const l = 0.7;
      color.setHSL(h, s, l);

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = Math.random() * 2 + 1;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    // Custom shader for more delicate points if needed, but PointsMaterial is okay if scaled right
    const material = new THREE.PointsMaterial({
      size: 0.012,
      vertexColors: true,
      transparent: true,
      opacity: 0.4,
      blending: THREE.NormalBlending,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Mouse interaction
      const mouseVector = new THREE.Vector3(mouse.x * 5, mouse.y * 5, 0);

      const pos = geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        const x = initialPositions[idx];
        const y = initialPositions[idx + 1];
        const z = initialPositions[idx + 2];

        // Complex movement - woven wave
        const waveX = Math.sin(elapsedTime * 0.5 + y) * 0.05;
        const waveY = Math.cos(elapsedTime * 0.5 + x) * 0.05;

        const currentPos = new THREE.Vector3(
          pos[idx],
          pos[idx + 1],
          pos[idx + 2],
        );
        const targetPos = new THREE.Vector3(x + waveX, y + waveY, z);

        // Mouse avoidance
        const distToMouse = currentPos.distanceTo(mouseVector);
        if (distToMouse < 1.2) {
          const dir = new THREE.Vector3()
            .subVectors(currentPos, mouseVector)
            .normalize();
          const push = (1.2 - distToMouse) * 0.05;
          targetPos.add(dir.multiplyScalar(push));
        }

        pos[idx] += (targetPos.x - pos[idx]) * 0.1;
        pos[idx + 1] += (targetPos.y - pos[idx + 1]) * 0.1;
        pos[idx + 2] += (targetPos.z - pos[idx + 2]) * 0.1;
      }
      geometry.attributes.position.needsUpdate = true;

      points.rotation.y = elapsedTime * 0.1;
      points.rotation.z = elapsedTime * 0.05;

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div ref={mountRef} className="absolute inset-0 pointer-events-none z-0">
      {/* Soft vignetting for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,white_90%)]" />
    </div>
  );
};
