'use client';

import { motion } from 'framer-motion';
import { useState, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Globe2, Zap } from 'lucide-react';
import { useTheme, ACCENT_COLORS } from '@/context/ThemeContext';

const colors = ACCENT_COLORS;

const themes = [
    { name: 'Falcon', icon: Globe2, modelPath: '/Ornate Falcon.glb' },
    { name: 'Phoenix', icon: Zap, modelPath: '/Ornate Phoenix.glb' },
];

const avatarFrames = [
    { name: 'Cadet Unit', mode: 'metallic' },
];

function ShipModel({ activeColor, modelPath }: { activeColor: string | null, modelPath: string }) {
    const { scene } = useGLTF(modelPath);
    const groupRef = useRef<THREE.Group>(null);
    const clonedScene = useMemo(() => scene.clone(), [scene]);

    // Apply color tint correctly without destroying original textures
    useEffect(() => {
        clonedScene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;

                // Clone the material if it exists so we don't mess up the global GLTF cache
                if (mesh.material) {
                    if (Array.isArray(mesh.material)) {
                        mesh.material = mesh.material.map(mat => mat.clone());
                        mesh.material.forEach(mat => {
                            // Clear blob textures to prevent GLTFLoader reload errors
                            const m = mat as THREE.MeshStandardMaterial;
                            if ((m.map?.image as HTMLImageElement)?.src?.startsWith('blob:')) m.map = null;
                            if ('emissive' in mat) {
                                if (activeColor) {
                                    (mat as THREE.MeshStandardMaterial).emissive.set(activeColor);
                                    (mat as THREE.MeshStandardMaterial).emissiveIntensity = 0.5; // Slight glow on highlights
                                } else {
                                    (mat as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
                                    (mat as THREE.MeshStandardMaterial).emissiveIntensity = 0; // Remove glow
                                }
                            }
                        });
                    } else {
                        mesh.material = (mesh.material as THREE.Material).clone();
                        if ('emissive' in mesh.material) {
                            if (activeColor) {
                                (mesh.material as THREE.MeshStandardMaterial).emissive.set(activeColor);
                                (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5; // Slight glow on highlights
                            } else {
                                (mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
                                (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0; // Remove glow
                            }
                        }
                    }
                }
            }
        });
    }, [clonedScene, activeColor]);

    useFrame((state, delta) => {
        if (groupRef.current) {
            const baseY = isCadet ? -1.0 : 0;
            groupRef.current.position.y = baseY + Math.sin(state.clock.elapsedTime * 2) * 0.08;
        }
    });

    // Models will use their native position references (origin points) as requested
    // This ensures consistency with the Falcon model's exported coordinates

    const [scale, setScale] = useState(3.5);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 640) setScale(2.8);
            else if (window.innerWidth < 1024) setScale(3.5);
            else setScale(4.2);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isCadet = modelPath === '/Cadet.glb';
    const finalScale = scale * (isCadet ? 0.7 : 1.0);

    return (
        <group ref={groupRef}>
            <primitive object={clonedScene} scale={finalScale} />
        </group>
    );
}

// Preload the models
useGLTF.preload('/Ornate Falcon.glb');
useGLTF.preload('/Ornate Phoenix.glb');
useGLTF.preload('/Cadet.glb');

export default function ShipInterface() {
    const { accentIndex, accentColor: themeAccent, setAccentIndex } = useTheme();
    const [selectedTheme, setSelectedTheme] = useState(0);
    const [selectedAccent, setSelectedAccent] = useState(-1);
    const [selectedFrame, setSelectedFrame] = useState(0);
    const [projection, setProjection] = useState<'ship' | 'cadet'>('ship');

    const activeColor = themeAccent;

    return (
        <div className="relative h-[500px] sm:h-[600px] lg:h-full border border-[#D6FF00]/30 bg-black font-orbitron overflow-y-auto lg:overflow-hidden side-scrollbar shadow-[0_0_30px_rgba(0,0,0,0.5)] rounded-xl">
            {/* Background Gradient - Darkened for Solid Look */}
            <div className="absolute inset-0 bg-black pointer-events-none z-0" />

            {/* Hologram Effects are now integrated into the central column for relative positioning */}

            {/* UI Content Layer - Grid Layout */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 h-full p-6 lg:p-8 gap-8">

                {/* Left Controls Column - SYSTEM CONFIG */}
                <div className="lg:col-span-3 flex flex-col gap-10 items-center lg:items-start pt-4 lg:pt-0 relative z-30 pointer-events-auto">
                    <div className="flex items-center gap-2 border-b border-[#D6FF00]/20 pb-4 w-full justify-center lg:justify-start">
                        <h3 className="text-base font-black tracking-[0.3em] text-white uppercase italic">STARSHIP SYSTEMS</h3>
                    </div>

                    {/* Primary Accent Color */}
                    <div className="space-y-4 flex flex-col items-center lg:items-start">
                        <div className="flex flex-col gap-1.5">
                            <p className="text-[11px] text-gray-400 font-bold tracking-[0.2em] uppercase italic">MAIN COLOR THEME:</p>
                            <span className="text-[9px] font-black tracking-[0.3em] uppercase px-3 py-1.5 rounded-sm w-fit" style={{ color: themeAccent, border: `1.5px solid ${themeAccent}60`, background: `${themeAccent}15` }}>
                                ◆ PROJECT NEON SYNC
                            </span>
                        </div>
                        <div className="grid grid-cols-5 gap-3 w-fit">
                            {colors.map((color, i) => (
                                <button
                                    key={i}
                                    onClick={() => setAccentIndex(i)}
                                    className={`w-7 h-7 rounded-sm border-2 transition-all duration-300 ${accentIndex === i ? 'border-white scale-110' : 'border-white/10 opacity-60'}`}
                                    style={{ backgroundColor: color, boxShadow: accentIndex === i ? `0 0 15px ${color}` : 'none' }}
                                />
                            ))}
                        </div>
                        <p className="text-[10px] font-black tracking-[0.4em] uppercase" style={{ color: themeAccent }}>
                            {['Neon Green', 'Cyber Cyan', 'Deep Purple', 'Pure White', 'Solar Orange', 'Cosmic Crimson', 'Rose Gold', 'Royal Amethyst', 'Emerald Glitch', 'Frost Silver'][accentIndex]}
                        </p>
                    </div>

                    {/* Background Themes */}
                    <div className="space-y-4 flex flex-col items-center lg:items-start w-full">
                        <p className="text-[11px] text-gray-400 font-bold tracking-[0.2em] uppercase italic">SELECT SPACECRAFT:</p>
                        <div className="grid grid-cols-2 lg:grid-cols-1 gap-6 sm:gap-6 w-fit lg:w-full">
                            {themes.map((theme, i) => (
                                <div key={i} className="group flex flex-col lg:flex-row items-center gap-3 lg:gap-4 cursor-pointer" onClick={() => {
                                    setSelectedTheme(i);
                                    setProjection('ship');
                                }}>
                                    <div className={`w-14 h-14 sm:w-16 sm:h-16 border-2 flex items-center justify-center transition-all ${selectedTheme === i && projection === 'ship' ? 'border-[#D6FF00] bg-[#D6FF00]/20 text-[#D6FF00] shadow-[0_0_20px_#D6FF0030]' : 'border-gray-800 bg-white/5 text-gray-500 opacity-40 group-hover:opacity-100 group-hover:border-gray-600'}`}
                                        style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)' }}>
                                        <theme.icon size={22} />
                                    </div>
                                    <span className={`text-[10px] sm:text-xs font-black uppercase tracking-widest transition-colors ${selectedTheme === i && projection === 'ship' ? 'text-[#D6FF00]' : 'text-gray-500 group-hover:text-gray-300'}`}>
                                        {theme.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Locked Projector Unit: Syncs Ship and Hologram Effects */}
                <div className="lg:col-span-6 flex items-center justify-center overflow-visible pointer-events-auto z-20 relative min-h-[300px] sm:min-h-[350px] lg:min-h-[400px]">
                    <div className="relative w-full h-full flex items-center justify-center overflow-visible">
                        {/* 1. Hologram Effects Layer (Platform, Beam, Glow) */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible">
                            <div className="relative w-full h-full flex items-center justify-center">
                                {/* Main Hologram Light Beam */}
                                <div
                                    className="absolute bottom-1/2 translate-y-[60px] sm:translate-y-[150px] lg:translate-y-[170px] w-[350px] sm:w-[400px] lg:w-[500px] h-[300px] sm:h-[400px] lg:h-[500px] pointer-events-none transition-all duration-700 blur-sm scale-[0.6] sm:scale-[0.8] lg:scale-100"
                                    style={{
                                        clipPath: 'polygon(50% 100%, 0 0, 100% 0)',
                                        backgroundImage: `linear-gradient(to top, ${activeColor} 0%, transparent 90%)`,
                                        opacity: 0.45,
                                        transformOrigin: 'bottom center'
                                    }}
                                />

                                {/* Origin Point Dot - Centered to Platform */}
                                <div className="absolute bottom-1/2 translate-y-[60px] sm:translate-y-[150px] lg:translate-y-[170px] w-2 h-2 z-20">
                                    <motion.div
                                        animate={{ scale: [1, 1.4, 1], opacity: [0.8, 1, 0.8] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="absolute inset-0 bg-white rounded-full"
                                        style={{ boxShadow: `0 0 25px 8px ${activeColor}` }}
                                    />
                                </div>

                                {/* Ground Glow */}
                                <div
                                    className="absolute bottom-1/2 translate-y-[70px] sm:translate-y-[160px] lg:translate-y-[180px] w-48 h-10 blur-2xl rounded-full opacity-60 scale-[0.7] sm:scale-[0.9] lg:scale-100"
                                    style={{ backgroundColor: activeColor }}
                                />

                                {/* Advanced Tech Platform */}
                                <div className="absolute bottom-1/2 translate-y-[110px] sm:translate-y-[195px] lg:translate-y-[217px] w-64 h-32 perspective-[1000px] scale-[0.6] sm:scale-[0.8] lg:scale-100" style={{ transformOrigin: 'center center' }}>
                                    <motion.div
                                        style={{ rotateX: '70deg' }}
                                        className="absolute inset-0 flex items-center justify-center translate-y-4"
                                    >
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                            className="absolute w-full h-full border border-dashed rounded-full opacity-30"
                                            style={{ borderColor: activeColor }}
                                        />
                                        <motion.div
                                            animate={{ rotate: -360 }}
                                            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                            className="absolute w-[80%] h-[80%] rounded-full opacity-50"
                                            style={{ border: `2px solid ${activeColor}`, boxShadow: `0 0 15px ${activeColor}44` }}
                                        >
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-white" />
                                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-white" />
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-white" />
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-white" />
                                        </motion.div>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                            className="absolute w-[50%] h-[50%] rounded-full opacity-70 border-t-4 border-r-4"
                                            style={{ borderColor: activeColor }}
                                        />
                                        <div className="absolute w-[10%] h-[10%] bg-white rounded-full z-20" style={{ boxShadow: `0 0 20px 5px ${activeColor}` }} />
                                        {[...Array(8)].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                className="absolute w-0.5 h-0.5 rounded-full z-30"
                                                style={{ backgroundColor: activeColor }}
                                                initial={{ opacity: 0, scale: 0 }}
                                                animate={{ y: [0, -120], x: (i - 4) * 8, opacity: [0, 1, 0], scale: [0, 1.2, 0] }}
                                                transition={{ duration: 2 + (i * 0.2), repeat: Infinity, delay: i * 0.3 }}
                                            />
                                        ))}
                                    </motion.div>
                                </div>
                            </div>
                        </div>

                        {/* 2. 3D Model Layer (Canvas) */}
                        <div className="w-full h-full min-h-[250px] relative z-20 translate-y-[-80px] sm:translate-y-[-20px] lg:translate-y-[-30px]">
                            <Canvas
                                camera={{ position: [0, 0, 8], fov: 45 }}
                                gl={{ powerPreference: "high-performance", antialias: false, alpha: true, failIfMajorPerformanceCaveat: false }}
                            >
                                <ambientLight intensity={1.5} />
                                <pointLight position={[10, 10, 10]} intensity={2.5} />
                                {projection === 'ship' ? (
                                    <ShipModel key="ship" activeColor={selectedAccent === -1 ? null : colors[selectedAccent]} modelPath={themes[selectedTheme].modelPath} />
                                ) : (
                                    <ShipModel key="cadet" activeColor={selectedAccent === -1 ? null : colors[selectedAccent]} modelPath="/Cadet.glb" />
                                )}
                                <OrbitControls
                                    enableZoom={false}
                                    enablePan={false}
                                    autoRotate
                                    autoRotateSpeed={2.5}
                                    minPolarAngle={Math.PI / 4}
                                    maxPolarAngle={Math.PI / 1.6}
                                />
                            </Canvas>
                        </div>
                    </div>
                </div>

                {/* Right Controls Column - VISUAL FX */}
                <div className="lg:col-span-3 flex flex-col gap-10 items-center lg:items-end lg:text-right pb-10 lg:pb-0 relative z-30 pointer-events-auto">
                    <div className="flex items-center gap-2 border-b border-[#D6FF00]/20 pb-4 justify-center lg:justify-end w-full">
                        <h3 className="text-base font-black tracking-[0.3em] text-white uppercase italic">VISUAL EFFECTS</h3>
                        <div className="w-1 h-4 bg-[#D6FF00]" />
                    </div>

                    {/* Spaceship Accent */}
                    <div className="space-y-4 flex flex-col items-center lg:items-end w-full">
                        <p className="text-[11px] text-gray-400 font-bold tracking-[0.2em] uppercase italic text-center lg:text-right">SPACESHIP ACCENT COLOR:</p>
                        <div className="grid grid-cols-6 gap-3 w-fit">
                            {/* Original Option */}
                            <button
                                onClick={() => setSelectedAccent(-1)}
                                className={`w-7 h-7 rounded-sm border-2 transition-all duration-300 ${selectedAccent === -1 ? 'border-white scale-110' : 'border-white/10 opacity-60'}`}
                                style={{ background: 'linear-gradient(135deg, #444, #111)', boxShadow: selectedAccent === -1 ? `0 0 15px white` : 'none' }}
                                title="Original Texture"
                            />
                            {colors.map((color, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSelectedAccent(i)}
                                    className={`w-7 h-7 rounded-sm border-2 transition-all duration-300 ${selectedAccent === i ? 'border-white scale-110' : 'border-white/10 opacity-60'}`}
                                    style={{ backgroundColor: color, boxShadow: selectedAccent === i ? `0 0 15px ${color}` : 'none' }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Avatar Frame Style */}
                    <div className="space-y-4 flex flex-col items-center lg:items-end w-full">
                        <p className="text-[11px] text-gray-400 font-bold tracking-[0.2em] uppercase italic text-center lg:text-right">ASTRONAUT STYLE:</p>
                        <div className="flex gap-6 justify-center lg:justify-end">
                            {avatarFrames.map((frame, i) => (
                                <div key={i} className="flex flex-col items-center gap-2.5 cursor-pointer group" onClick={() => {
                                    setSelectedFrame(i);
                                    setProjection('cadet');
                                }}>
                                    <div className={`relative w-14 h-14 rounded-full border-2 p-1 transition-all ${selectedFrame === i && projection === 'cadet' ? 'border-[#D6FF00] scale-110 shadow-[0_0_20px_#D6FF0040]' : 'border-gray-800 opacity-50 group-hover:opacity-100 group-hover:border-gray-500'}`}>
                                        <div className="w-full h-full rounded-full overflow-hidden bg-gray-900">
                                            <img src="/cybernetic_astronaut_profile.png" alt="Avatar" className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${selectedFrame === i && projection === 'cadet' ? 'text-[#D6FF00]' : 'text-gray-500'}`}>
                                        {frame.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .clip-item {
                    clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
                }
                .side-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .side-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.2);
                }
                .side-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(214, 255, 0, 0.3);
                    border-radius: 10px;
                }
                .side-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(214, 255, 0, 0.6);
                }
            `}</style>
        </div>
    );
}
