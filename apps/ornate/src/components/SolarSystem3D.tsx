'use client';

import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars, Sparkles, Float, Html, Billboard, Image as ThreeImage } from '@react-three/drei';
import * as THREE from 'three';
import { PLANETS } from './planetary-system/planets';

function Planet({ planet, orbitRadius, orbitSpeed, rotationSpeed }: {
    planet: any,
    orbitRadius: number,
    orbitSpeed: number,
    rotationSpeed: number
}) {
    const meshRef = useRef<THREE.Mesh>(null);
    const orbitRef = useRef<THREE.Group>(null);
    const [texture] = useLoader(THREE.TextureLoader, [planet.texture]);

    // Generate a random starting position on the orbital path precisely once
    const startAngle = useMemo(() => Math.random() * Math.PI * 2, []);

    // Ensure texture is crisp
    if (texture) {
        texture.anisotropy = 16;
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        // Improve texture wrapping to show more of the image clearly
        texture.center.set(0.5, 0.5);
    }

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();

        // Orbit rotation (starting from random angle)
        if (orbitRef.current) {
            orbitRef.current.rotation.y = startAngle + t * orbitSpeed;
        }

        // Planet self-rotation
        if (meshRef.current) {
            meshRef.current.rotation.y += rotationSpeed;
        }
    });

    const size = 2.5; // Final increase for maximum logo visibility

    return (
        <group ref={orbitRef} rotation={[0, startAngle, 0]}>
            <group position={[orbitRadius, 0, 0]}>

                {/* Absolute Clarity Spherical Planet */}
                <mesh ref={meshRef}>
                    <sphereGeometry args={[size, 32, 32]} />
                    <meshBasicMaterial
                        map={texture}
                        transparent={false}
                        toneMapped={false} // Prevents post-processing from washing out the logo detail
                    />
                </mesh>

                {/* Single pixel-thin edge define */}
                <mesh scale={[size * 1.01, size * 1.01, size * 1.01]}>
                    <sphereGeometry args={[1, 32, 32]} />
                    <meshBasicMaterial
                        color={planet.color}
                        transparent
                        opacity={0.09}
                        side={THREE.BackSide}
                    />
                </mesh>

                {/* Label */}
                {/* Video Game Style HUD Label */}
                <Html distanceFactor={25} position={[0, size + 2, 0]} center>
                    <div className="relative group pointer-events-none select-none">
                        {/* Targeting Brackets */}
                        <div className="absolute -inset-4 border-l-2 border-t-2 border-[var(--color-neon)]/40 w-4 h-4" />
                        <div className="absolute -inset-4 border-r-2 border-b-2 border-[var(--color-neon)]/40 w-4 h-4 translate-x-[calc(100%+32px)] translate-y-[calc(100%+32px)]" />

                        <div className="flex flex-col gap-1 items-start min-w-[120px]">
                            {/* Header: Name and Status */}
                            <div className="flex items-center gap-2 w-full">
                                <div className="w-1.5 h-1.5 bg-[var(--color-neon)] animate-pulse rounded-full" />
                                <span className="text-[12px] font-black font-orbitron tracking-[0.3em] text-[var(--color-neon)] text-glow uppercase">
                                    {planet.name}
                                </span>
                            </div>

                            {/* HUD Body */}
                            <div className="flex flex-col bg-black/60 backdrop-blur-md border border-[var(--color-neon)]/20 p-2 pr-4 [clip-path:polygon(0_0,90%_0,100%_20%,100%_100%,10%_100%,0_80%)]">
                                <div className="flex justify-between items-center gap-4 border-b border-[var(--color-neon)]/10 pb-1 mb-1">
                                    <span className="text-[7px] text-gray-500 font-bold uppercase tracking-widest">Sector</span>
                                    <span className="text-[7px] text-[var(--color-neon)] font-mono capitalize">{planet.category || 'Deep Space'}</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <div className="flex justify-between items-center gap-6">
                                        <span className="text-[6px] text-gray-400 font-bold uppercase">Scanning...</span>
                                        <span className="text-[6px] text-[var(--color-neon)] font-mono">100%</span>
                                    </div>
                                    {/* Small Progress Bar */}
                                    <div className="w-full h-[2px] bg-white/5 overflow-hidden">
                                        <div className="h-full bg-[var(--color-neon)] w-[100%] animate-[shimmer_2s_infinite]" />
                                    </div>
                                </div>
                            </div>

                            {/* ID Tag / Coordinates */}
                            <div className="absolute -bottom-5 right-0 flex items-center gap-1 opacity-50">
                                <span className="text-[5px] font-mono text-gray-300 tracking-tighter">LAT: {Math.floor(orbitRadius)}.00</span>
                                <span className="text-[5px] font-mono text-gray-300 tracking-tighter">LNG: {Math.floor(orbitSpeed * 1000)}.55</span>
                            </div>
                        </div>

                        {/* Connection Line (Lead) */}
                        <div className="absolute top-[100%] left-0 w-[1px] h-8 bg-gradient-to-b from-[var(--color-neon)]/40 to-transparent" />
                    </div>
                </Html>
            </group>

            {/* Glowing Orbit Path Ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[orbitRadius - 0.15, orbitRadius + 0.15, 128]} />
                <meshBasicMaterial color={planet.color} transparent opacity={0.15} side={THREE.DoubleSide} />
            </mesh>
            {/* Inner neon line for the orbit */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[orbitRadius - 0.02, orbitRadius + 0.02, 128]} />
                <meshBasicMaterial color={planet.color} transparent opacity={0.5} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
}

function Sun() {
    const meshRef = useRef<THREE.Mesh>(null);
    const [texture] = useLoader(THREE.TextureLoader, ['/assets/SUN.webp']);

    useFrame(({ clock }) => {
        if (meshRef.current) {
            meshRef.current.rotation.y = clock.getElapsedTime() * 0.08;
        }
    });

    return (
        <group>
            {/* The Sun Sphere */}
            <mesh ref={meshRef}>
                <sphereGeometry args={[6.5, 32, 32]} />
                <meshBasicMaterial
                    map={texture}
                    transparent={false}
                    toneMapped={false}
                />
            </mesh>

            {/* Sun Glow layers */}
            <mesh scale={[7.5, 7.5, 7.5]}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshBasicMaterial color="#fbbf24" transparent opacity={0.2} side={THREE.BackSide} />
            </mesh>
            <mesh scale={[10, 10, 10]}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshBasicMaterial color="#fbbf24" transparent opacity={0.08} side={THREE.BackSide} />
            </mesh>
            <pointLight intensity={5} distance={150} color="#fbbf24" />
        </group>
    );
}

function ShootingStars() {
    const starsData = useMemo(() => {
        return Array.from({ length: 8 }).map(() => ({
            position: [
                (Math.random() - 0.5) * 600,
                (Math.random() - 0.5) * 600,
                (Math.random() - 0.5) * 600
            ] as [number, number, number],
            speed: 1 + Math.random() * 2,
            length: 15 + Math.random() * 25
        }));
    }, []);

    const meshRef = useRef<THREE.Group>(null);

    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.children.forEach((child, i) => {
                const star = starsData[i];
                child.position.x += star.speed;
                child.position.z += star.speed * 0.5;
                if (child.position.x > 300 || child.position.z > 300) {
                    child.position.x = -300;
                    child.position.z = -300;
                }
            });
        }
    });

    return (
        <group ref={meshRef}>
            {starsData.map((star, i) => (
                <mesh key={i} position={star.position} rotation={[0, 0, Math.PI / 4]}>
                    <capsuleGeometry args={[0.1, star.length, 4, 8]} />
                    <meshBasicMaterial color="#fff" transparent opacity={0.4} />
                </mesh>
            ))}
        </group>
    );
}

export default function SolarSystem3D() {
    const displayPlanets = useMemo(() => {
        return PLANETS.filter(p => p.category === 'branches');
    }, []);

    return (
        <div className="absolute inset-0 z-0 bg-black">
            <Canvas
                camera={{ position: [0, 45, 110], fov: 45 }}
                gl={{ powerPreference: "high-performance", antialias: false, alpha: true, failIfMajorPerformanceCaveat: false }}
                dpr={[1, 1.5]}
                performance={{ min: 0.5 }}
                onCreated={({ gl }) => {
                    gl.setClearColor('#000000');
                }}
            >
                <Suspense fallback={null}>
                    <color attach="background" args={['#000']} />
                    <Stars radius={300} depth={80} count={25000} factor={8} saturation={1} fade speed={2.5} />
                    <Sparkles count={3000} scale={250} size={2.5} speed={0.6} opacity={0.7} color="#ffffff" />
                    <Sparkles count={800} scale={120} size={6} speed={0.3} opacity={0.4} color="#fbbf24" />
                    <ShootingStars />
                    <ambientLight intensity={2.5} />
                    <directionalLight position={[100, 100, 50]} intensity={5} color="#ffffff" />
                    <pointLight position={[-100, 50, -100]} intensity={3} color="#ffffff" />


                    <Sun />

                    {displayPlanets.map((planet, i) => (
                        <Planet
                            key={planet.id}
                            planet={planet}
                            orbitRadius={25 + i * 15}
                            orbitSpeed={0.06 / (i + 1)}
                            rotationSpeed={0.005 + Math.random() * 0.01}
                        />
                    ))}

                    <OrbitControls
                        enableZoom={false}
                        enablePan={false}
                        maxPolarAngle={Math.PI / 2.2}
                        minPolarAngle={Math.PI / 6}
                        autoRotate
                        autoRotateSpeed={0.3}
                        target={[0, -15, 0]}
                    />
                </Suspense>
            </Canvas>

            {/* HUD Scanline & Glow Overlays */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.1)_100%)] z-10" />
            <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.01)_50%)] bg-[size:100%_2px]" />
        </div>
    );
}


