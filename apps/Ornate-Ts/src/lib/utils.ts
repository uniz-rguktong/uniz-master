import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function addAlpha(color: string, alphaHex: string) {
  if (!color) return color;
  if (color.startsWith('var(')) {
    const decimal = parseInt(alphaHex, 16);
    const percentage = Math.round((decimal / 255) * 100);
    return `color-mix(in srgb, ${color}, transparent ${100 - percentage}%)`;
  }
  if (color.startsWith('#') && color.length <= 7) {
    return `${color}${alphaHex}`;
  }
  return color;
}
