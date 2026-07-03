/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}"],

  theme: {
    extend: {
      fontFamily: {
        sans: ['"Google Sans"', "Inter", "system-ui", "sans-serif"],
        body: ['"Google Sans Text"', "Inter", "system-ui", "sans-serif"],
        condensed: ['"Cabin Condensed"', "sans-serif"],
      },

      fontSize: {
        h1: [
          "48px",
          { lineHeight: "56px", letterSpacing: "-0.02em", fontWeight: "600" },
        ],
        h2: [
          "36px",
          { lineHeight: "44px", letterSpacing: "-0.01em", fontWeight: "600" },
        ],
        h3: [
          "28px",
          { lineHeight: "36px", letterSpacing: "-0.01em", fontWeight: "600" },
        ],
        h4: ["22px", { lineHeight: "30px", fontWeight: "500" }],

        base: ["16px", { lineHeight: "24px", fontWeight: "400" }],
        small: ["14px", { lineHeight: "20px", fontWeight: "400" }],
        micro: ["12px", { lineHeight: "16px", fontWeight: "500" }],
      },

      colors: {
        background: "#ffffff",
        foreground: "#0f172a",

        primary: {
          DEFAULT: "var(--portal-navy, #0B2A47)",
          foreground: "#ffffff",
        },

        muted: {
          DEFAULT: "#f1f5f9",
          foreground: "#64748b",
        },

        accent: {
          DEFAULT: "#eef2ff",
          foreground: "#312e81",
        },

        portal: {
          DEFAULT: "var(--portal-navy, #0B2A47)",
          mid: "var(--portal-navy-mid, #0F3B63)",
          deep: "var(--portal-navy-deep, #081E33)",
          soft: "var(--portal-navy-soft, #1A4A73)",
          muted: "var(--portal-navy-muted, #5A94B8)",
          tint: "var(--portal-navy-tint, #EDF5FB)",
          border: "var(--portal-navy-border, #D4E8F5)",
        },

        blue: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },

        navy: {
          900: "var(--navy-900)",
          800: "var(--navy-800)",
          700: "var(--navy-700)",
          600: "var(--navy-600)",
          500: "var(--navy-500)",
          400: "var(--navy-400)",
          300: "var(--navy-300)",
          200: "var(--navy-200)",
          100: "var(--navy-100)",
          50: "var(--navy-50)",
        },

        slate: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          490: "#222222",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
      },

      boxShadow: {
        sm: "0 2px 8px -2px rgba(0,0,0,0.04), 0 1px 4px -1px rgba(0,0,0,0.02)",
        DEFAULT:
          "0 4px 12px -2px rgba(0,0,0,0.05), 0 2px 6px -1px rgba(0,0,0,0.03)",
        md: "0 8px 24px -4px rgba(0,0,0,0.06), 0 4px 12px -2px rgba(0,0,0,0.04)",
        lg: "0 16px 32px -8px rgba(0,0,0,0.08), 0 8px 16px -4px rgba(0,0,0,0.05)",
        xl: "0 24px 48px -12px rgba(0,0,0,0.12), 0 12px 24px -6px rgba(0,0,0,0.06)",
        "2xl":
          "0 32px 64px -16px rgba(0,0,0,0.16), 0 16px 32px -8px rgba(0,0,0,0.08)",
        inner: "inset 0 2px 4px 0 rgba(0,0,0,0.04)",
        whisper: "0 1px 2px rgba(11, 42, 71, 0.04)",
        "whisper-md": "0 4px 16px -6px rgba(11, 42, 71, 0.08)",
        "whisper-lg": "0 20px 50px -24px rgba(11, 42, 71, 0.12)",
        "whisper-navy": "0 1px 2px rgba(11, 42, 71, 0.16)",
        "whisper-landing": "0 20px 40px -15px rgba(0, 0, 0, 0.12)",
      },

      borderRadius: {
        "portal-lg": "12px",
        "portal-xl": "16px",
        "portal-2xl": "20px",
      },

      spacing: {
        portal: "32px",
      },

      transitionTimingFunction: {
        spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },

      transitionDuration: {
        400: "400ms",
        500: "500ms",
      },

      backgroundImage: {
        "premium-gradient": "linear-gradient(to right, #ffffff, #ffffff)",
        "portal-banner": "linear-gradient(to right, #0B2A47, #0F3B63)",
      },

      animation: {
        "spinner-blade": "spinner-blade 1s linear infinite",
      },

      keyframes: {
        "spinner-blade": {
          "0%": { opacity: "0.85" },
          "50%": { opacity: "0.25" },
          "100%": { opacity: "0.25" },
        },
      },
    },
  },

  plugins: [require("tailwind-scrollbar-hide")],
};
