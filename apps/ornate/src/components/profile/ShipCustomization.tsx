'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

const colors = ['var(--color-neon)', '#00F0FF', '#7000FF', '#FFFFFF', '#FF9900'];

const themes = [
    { name: 'Deep Space', image: '/assets/space_themes.png' }, // Using the generated image
    { name: 'Nebula', image: '/assets/space_themes.png' },
    { name: 'Dark Matte', image: '/assets/space_themes.png' },
];

const avatarFrames = [
    { name: 'Neon Ring', mode: 'green' },
    { name: 'Minimal White', mode: 'white' },
    { name: 'Metallic', mode: 'metallic' },
];

export default function ShipCustomization() {
    const [selectedColor, setSelectedColor] = useState(0);
    const [selectedTheme, setSelectedTheme] = useState(0);
    const [selectedAccent, setSelectedAccent] = useState(2);
    const [selectedFrame, setSelectedFrame] = useState(0);

    return (
        <div className="flex flex-col gap-6 p-6 border border-[var(--color-neon)]/30 bg-black/40 backdrop-blur-md rounded-xl font-orbitron h-full">
            <div className="flex items-center gap-2 border-b border-[var(--color-neon)]/20 pb-4">
                <div className="w-1 h-4 bg-[var(--color-neon)]" />
                <h3 className="text-lg font-black tracking-[0.2em] text-white uppercase italic">CUSTOMIZE YOUR SHIP</h3>
            </div>

            {/* Primary Accent Color */}
            <div className="space-y-3">
                <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase italic">Primary Accent Color:</p>
                <div className="flex gap-4">
                    {colors.map((color, i) => (
                        <button
                            key={i}
                            onClick={() => setSelectedColor(i)}
                            className={`w-6 h-6 rounded-full border-2 transition-all duration-300 ${selectedColor === i ? 'border-white scale-125' : 'border-transparent'}`}
                            style={{ backgroundColor: color, boxShadow: selectedColor === i ? `0 0 10px ${color}` : 'none' }}
                        />
                    ))}
                </div>
            </div>

            {/* Background Themes */}
            <div className="space-y-3">
                <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase italic">Background Themes:</p>
                <div className="grid grid-cols-3 gap-3">
                    {themes.map((theme, i) => (
                        <div key={i} className="flex flex-col gap-1 cursor-pointer" onClick={() => setSelectedTheme(i)}>
                            <div className={`aspect-square border-2 transition-all overflow-hidden ${selectedTheme === i ? 'border-[var(--color-neon)]' : 'border-gray-800'}`}>
                                <img src={theme.image} alt={theme.name} className="w-full h-full object-cover" />
                            </div>
                            <span className={`text-[8px] font-bold text-center uppercase tracking-tighter ${selectedTheme === i ? 'text-[var(--color-neon)]' : 'text-gray-500'}`}>
                                {theme.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Spaceship Accent */}
            <div className="space-y-3">
                <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase italic">Spaceship Accent:</p>
                <div className="flex gap-4">
                    {colors.map((color, i) => (
                        <button
                            key={i}
                            onClick={() => setSelectedAccent(i)}
                            className={`w-6 h-6 rounded-full border-2 transition-all duration-300 ${selectedAccent === i ? 'border-white scale-125' : 'border-transparent'}`}
                            style={{ backgroundColor: color, boxShadow: selectedAccent === i ? `0 0 10px ${color}` : 'none' }}
                        />
                    ))}
                </div>
            </div>

            {/* Avatar Frame Style */}
            <div className="space-y-3">
                <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase italic">Avatar Frame Style</p>
                <div className="flex justify-between gap-2">
                    {avatarFrames.map((frame, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => setSelectedFrame(i)}>
                            <div className={`relative w-12 h-12 rounded-full border-2 p-0.5 transition-all ${selectedFrame === i ? 'border-[var(--color-neon)] scale-110' : 'border-gray-800'}`}>
                                <div className="w-full h-full rounded-full overflow-hidden bg-gray-900">
                                    <img src="/cybernetic_astronaut_profile.png" alt="Avatar" className="w-full h-full object-cover" />
                                </div>
                                {selectedFrame === i && (
                                    <div className="absolute inset-0 rounded-full border border-[var(--color-neon)] animate-ping opacity-20" />
                                )}
                            </div>
                            <span className={`text-[8px] font-bold text-center uppercase tracking-tighter ${selectedFrame === i ? 'text-[var(--color-neon)]' : 'text-gray-500'}`}>
                                {frame.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Extra theme icons at bottom as shown in image */}
            <div className="grid grid-cols-3 gap-3">
                {themes.map((theme, i) => (
                    <div key={i} className="flex flex-col gap-1">
                        <div className="aspect-video border border-gray-800 bg-gray-900 overflow-hidden">
                            <img src={theme.image} alt={theme.name} className="w-full h-full object-cover opacity-50" />
                        </div>
                        <span className="text-[7px] font-bold text-center text-gray-600 uppercase tracking-tighter">
                            {theme.name}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
