'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// The 5 accent colors matching ShipInterface
export const ACCENT_COLORS = ['#39FF14', '#00F0FF', '#7000FF', '#FFFFFF', '#FF9900'];
export const ACCENT_NAMES = ['Neon Green', 'Cyber Cyan', 'Deep Purple', 'Pure White', 'Solar Orange'];

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
        // Simple approach: just set a fixed mapping
        const darkMap: Record<string, string> = {
            '#39FF14': '#1F8A0B',
            '#00F0FF': '#007A85',
            '#7000FF': '#3A008A',
            '#FFFFFF': '#CCCCCC',
            '#FF9900': '#8A5200',
        };
        const dark = darkMap[color] ?? '#1F8A0B';
        document.documentElement.style.setProperty('--color-neon-dark', dark);

        // Pre-compute RGB format (e.g. "57, 255, 20") for Tailwind opacity combinations
        const rgbMap: Record<string, string> = {
            '#39FF14': '57, 255, 20',
            '#00F0FF': '0, 240, 255',
            '#7000FF': '112, 0, 255',
            '#FFFFFF': '255, 255, 255',
            '#FF9900': '255, 153, 0',
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
