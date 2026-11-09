/** Machine-readable mirror of tokens.css — use for charts, PDFs, native shells. */

export const unizTokens = {
  accent: "#EA2027",
  fonts: {
    display: '"Source Serif 4", Georgia, serif',
    body: '"IBM Plex Sans", "Cabin Condensed", system-ui, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, monospace',
  },
  iconSet: "lucide-react",
  radius: {
    control: 10,
    card: 14,
    sheet: 20,
    full: 9999,
  },
  motion: {
    durationUiMs: 200,
    easeOut: "cubic-bezier(0, 0, 0.2, 1)",
  },
  spacing: [4, 8, 12, 16, 20, 24, 32, 40, 48, 64] as const,
  color: {
    light: {
      canvas: "#FAFAFA",
      elevated: "#FFFFFF",
      textPrimary: "#0F172A",
      textSecondary: "#475569",
      border: "#E2E8F0",
      navy: "#0A2540",
    },
    dark: {
      canvas: "#021227",
      elevated: "#061B33",
      textPrimary: "#F8FAFC",
      textSecondary: "#CBD5E1",
      border: "#163A5C",
      navy: "#0A2540",
    },
  },
} as const;

export type UnizTokens = typeof unizTokens;
