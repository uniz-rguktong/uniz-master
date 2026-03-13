'use client';

import { motion } from 'framer-motion';
import { useState, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface Particle {
    id: number;
    x: number;
    duration: number;
    delay: number;
    marginLeft: number;
}

function HologramModel({ isHovered }: { isHovered: boolean }) {
    const { scene } = useGLTF('/Ornate Falcon.glb');
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * 0.5;
            groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.05;
        }
    });

    // Clear embedded blob textures to prevent GLTFLoader reload errors
    useEffect(() => {
        scene.traverse((child) => {
            const mesh = child as THREE.Mesh;
            if (mesh.isMesh && mesh.material) {
                const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                mats.forEach(mat => {
                    const m = mat as THREE.MeshStandardMaterial;
                    if ((m.map?.image as HTMLImageElement)?.src?.startsWith('blob:')) m.map = null;
                });
            }
        });
    }, [scene]);

    // We can auto-calculate bounding box and scale it properly
    useEffect(() => {
        const box = new THREE.Box3().setFromObject(scene);
        const center = box.getCenter(new THREE.Vector3());
        scene.position.x += (scene.position.x - center.x);
        scene.position.y += (scene.position.y - center.y);
        scene.position.z += (scene.position.z - center.z);
    }, [scene]);

    // Scale to fit visually
    return (
        <group ref={groupRef} position={[0, 0, 0]}>
            <primitive object={scene} scale={3.5} />
        </group>
    );
}

// Preload the model
useGLTF.preload('/Ornate Falcon.glb');

export default function ProfileHologram({ imageUrl }: { imageUrl: string }) {
    const [isHovered, setIsHovered] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Generate random values for flicker effect and particles
    const randomFlickerDelay = useMemo(() => Math.random() * 5, []);

    const particles = useMemo(() => {
        return [...Array(15)].map((_, i) => ({
            id: i,
            x: Math.random() * 400 - 200,
            duration: 2 + Math.random() * 2,
            delay: Math.random() * 2,
            marginLeft: Math.random() * 200 - 100
        }));
    }, []);

    if (!mounted) {
        return <div className="relative w-full h-[500px]" />;
    }

    return (
        <div className="relative w-full h-[500px] flex items-center justify-center perspective-[1200px]">
            {/* Hologram Light Beam */}
            <div
                className="absolute bottom-0 w-[400px] h-[450px] bg-gradient-to-t from-[var(--color-neon)]/40 via-[var(--color-neon)]/10 to-transparent blur-2xl"
                style={{ clipPath: 'polygon(20% 100%, 80% 100%, 100% 0, 0 0)' }}
            />

            {/* Floating Container */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{
                    y: [0, -15, 0],
                    opacity: 1
                }}
                transition={{
                    y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                    opacity: { duration: 1 }
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="relative z-10 w-80 h-[400px] group"
            >
                {/* 3D Model Container with Framing */}
                <div className="relative w-full h-full overflow-hidden border border-[var(--color-neon)]/30 bg-black/40 backdrop-blur-sm shadow-[0_0_30px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.2)]">
                    <div className="absolute inset-0 z-0 opacity-90 group-hover:opacity-100 transition-opacity">
                        <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
                            <ambientLight intensity={1} />
                            <pointLight position={[10, 10, 10]} intensity={2} />
                            <HologramModel isHovered={isHovered} />
                            <OrbitControls
                                enableZoom={false}
                                enablePan={false}
                                minPolarAngle={Math.PI / 4}
                                maxPolarAngle={Math.PI / 1.5}
                                autoRotate={!isHovered}
                                autoRotateSpeed={2}
                            />
                        </Canvas>
                    </div>

                    {/* Scanline Effect Overlay */}
                    <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(transparent_50%,rgba(var(--color-neon-rgb, 57, 255, 20), 0.05)_50%)] bg-[size:100%_4px]" />

                    {/* Glitch/Flicker Overlay */}
                    <motion.div
                        animate={{ opacity: [0, 0.1, 0] }}
                        transition={{ duration: 0.1, repeat: Infinity, repeatDelay: randomFlickerDelay }}
                        className="absolute inset-0 bg-white/5 pointer-events-none z-10"
                    />

                    {/* Corner Accents */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[var(--color-neon)] z-20" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[var(--color-neon)] z-20" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[var(--color-neon)] z-20" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[var(--color-neon)] z-20" />
                </div>

                {/* Base Emitter Point */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-32 h-6 bg-[var(--color-neon)]/60 blur-xl rounded-[50%]" />
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-16 h-3 bg-white/80 blur-md rounded-[50%]" />
            </motion.div>

            {/* Particle Effects (Subtle dots floating up) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {particles.map((p: Particle) => (
                    <motion.div
                        key={p.id}
                        className="absolute w-1 h-1 bg-[var(--color-neon)] rounded-full"
                        initial={{
                            x: p.x,
                            y: 400,
                            opacity: 0,
                            left: '50%'
                        }}
                        animate={{
                            y: [400, 100],
                            opacity: [0, 0.8, 0]
                        }}
                        transition={{
                            duration: p.duration,
                            repeat: Infinity,
                            delay: p.delay
                        }}
                        style={{ marginLeft: `${p.marginLeft}px` }}
                    />
                ))}
            </div>
        </div>
    );
}
