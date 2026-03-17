'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// The 5 accent colors matching ShipInterface
// The 10 accent colors for premium spaceship and UI customization
export const ACCENT_COLORS = [
    '#39FF14', // Neon Green
    '#00F0FF', // Cyber Cyan
    '#7000FF', // Deep Purple
    '#FFFFFF', // Pure White
    '#FF9900', // Solar Orange
    '#FF3E6C', // Cosmic Crimson
    '#D4AF37', // Rose Gold
    '#9D00FF', // Royal Amethyst
    '#00FFAB', // Emerald Glitch
    '#E2E8F0', // Frost Silver
];

export const ACCENT_NAMES = [
    'Neon Green', 
    'Cyber Cyan', 
    'Deep Purple', 
    'Pure White', 
    'Solar Orange',
    'Cosmic Crimson',
    'Rose Gold',
    'Royal Amethyst',
    'Emerald Glitch',
    'Frost Silver'
];

const STORAGE_KEY = 'ornate-accent-index';

interface ThemeContextType {
    accentIndex: number;
    accentColor: string;
    setAccentIndex: (i: number) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    accentIndex: 0,
    accentColor: ACCENT_COLORS[0],
    setAccentIndex: () => { },
});

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [accentIndex, setAccentIndexState] = useState(0);

    // On mount, read saved preference
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved !== null) {
            const idx = parseInt(saved, 10);
            if (!isNaN(idx) && idx >= 0 && idx < ACCENT_COLORS.length) {
                setAccentIndexState(idx);
            }
        }
    }, []);

    // Whenever accent changes, update the CSS variable on <html>
    useEffect(() => {
        const color = ACCENT_COLORS[accentIndex];
        document.documentElement.style.setProperty('--color-neon', color);

        // Also pre-compute a darker variant for --color-neon-dark (30% darker)
        const darkMap: Record<string, string> = {
            '#39FF14': '#1F8A0B',
            '#00F0FF': '#007A85',
            '#7000FF': '#3A008A',
            '#FFFFFF': '#CCCCCC',
            '#FF9900': '#8A5200',
            '#FF3E6C': '#A31F41',
            '#D4AF37': '#8C701B',
            '#9D00FF': '#5A0099',
            '#00FFAB': '#009966',
            '#E2E8F0': '#94A3B8',
        };
        const dark = darkMap[color] ?? '#1F8A0B';
        document.documentElement.style.setProperty('--color-neon-dark', dark);

        // Pre-compute RGB format for Tailwind opacity combinations
        const rgbMap: Record<string, string> = {
            '#39FF14': '57, 255, 20',
            '#00F0FF': '0, 240, 255',
            '#7000FF': '112, 0, 255',
            '#FFFFFF': '255, 255, 255',
            '#FF9900': '255, 153, 0',
            '#FF3E6C': '255, 62, 108',
            '#D4AF37': '212, 175, 55',
            '#9D00FF': '157, 0, 255',
            '#00FFAB': '0, 255, 171',
            '#E2E8F0': '226, 232, 240',
        };
        const rgb = rgbMap[color] ?? '57, 255, 20';
        document.documentElement.style.setProperty('--color-neon-rgb', rgb);
    }, [accentIndex]);

    const setAccentIndex = (i: number) => {
        setAccentIndexState(i);
        localStorage.setItem(STORAGE_KEY, String(i));
    };

    return (
        <ThemeContext.Provider value={{ accentIndex, accentColor: ACCENT_COLORS[accentIndex], setAccentIndex }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
