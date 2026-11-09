/** Shared names and values with apps/uniz-landing `src/index.css` @theme. */
const navy = {
  DEFAULT: "#0A2540",
  950: "#021227",
  900: "#061B33",
  850: "#061527",
  800: "#0A2540",
  750: "#0B2A47",
  700: "#0D3154",
  600: "#113255",
  500: "#163A5C",
  400: "#5A7A94",
  300: "#9BB0C4",
  200: "#D8E0EA",
  100: "#FAFAFA",
  50: "#FFFFFF",
};

const brandRed = "#EA2027";

const ink = {
  DEFAULT: "#0F172A",
  muted: "#475569",
  subtle: "#64748B",
};

const line = "#E2E8F0";

const surface = {
  DEFAULT: "#FAFAFA",
  2: "#F8FAFC",
};

const status = {
  success: "#189B4B",
  warning: "#F59E0B",
  error: brandRed,
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}"],

  theme: {
    extend: {
      fontFamily: {
        sans: ['"Cabin Condensed"', "-apple-system", "system-ui", "sans-serif"],
        body: ['"Cabin Condensed"', "-apple-system", "system-ui", "sans-serif"],
        button: ['"Cabin Condensed"', "-apple-system", "system-ui", "sans-serif"],
        form: ['"Cabin Condensed"', "-apple-system", "system-ui", "sans-serif"],
        condensed: ['"Cabin Condensed"', '"Cabin"', "sans-serif"],
        serif: ['"Cabin Condensed"', "Georgia", "serif"],
        campus: ['"Cabin Condensed"', "-apple-system", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },

      fontSize: {
        h1: [
          "44px",
          { lineHeight: "48px", letterSpacing: "-0.02em", fontWeight: "500" },
        ],
        h2: [
          "32px",
          { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "500" },
        ],
        h3: [
          "24px",
          { lineHeight: "32px", letterSpacing: "-0.02em", fontWeight: "500" },
        ],
        h4: ["18px", { lineHeight: "26px", letterSpacing: "-0.015em", fontWeight: "500" }],

        base: ["16px", { lineHeight: "24px", fontWeight: "400" }],
        small: ["14px", { lineHeight: "20px", fontWeight: "400" }],
        micro: ["12px", { lineHeight: "16px", fontWeight: "500" }],
        caption: ["0.75rem", { lineHeight: "1rem" }],
        lead: ["1.125rem", { lineHeight: "1.75rem" }],
        body: ["1rem", { lineHeight: "1.5rem" }],
      },

      colors: {
        background: "#ffffff",
        foreground: navy.DEFAULT,

        primary: {
          DEFAULT: `var(--portal-navy, ${navy.DEFAULT})`,
          foreground: "#ffffff",
        },

        muted: {
          DEFAULT: surface.DEFAULT,
          foreground: navy[400],
        },

        accent: {
          DEFAULT: brandRed,
          foreground: "#ffffff",
        },

        portal: {
          DEFAULT: `var(--portal-navy, ${navy.DEFAULT})`,
          mid: `var(--portal-navy-mid, ${navy[700]})`,
          deep: `var(--portal-navy-deep, ${navy[950]})`,
          soft: `var(--portal-navy-soft, ${navy[500]})`,
          muted: `var(--portal-navy-muted, ${navy[400]})`,
          tint: `var(--portal-navy-tint, ${surface.DEFAULT})`,
          border: "var(--portal-navy-border, #EEEEEE)",
          accent: brandRed,
          footer: "#EEEEEE",
          cta: navy.DEFAULT,
          link: navy[900],
        },

        /* Remap zinc → ExamCell neutrals so leftover classes stay on-brand */
        zinc: {
          50: "#ffffff",
          100: surface.DEFAULT,
          200: "#eeeeee",
          300: navy[300],
          400: navy[400],
          500: "#3d6a8c",
          600: "#1e4a73",
          700: navy[500],
          800: navy[700],
          900: navy.DEFAULT,
          950: navy[950],
        },

        neutral: {
          50: "#ffffff",
          100: surface.DEFAULT,
          200: "#eeeeee",
          300: navy[300],
          400: navy[400],
          500: "#3d6a8c",
          600: "#1e4a73",
          700: navy[500],
          800: navy[700],
          900: navy.DEFAULT,
          950: navy[950],
        },

        /* Map blue utilities to ExamCell navy (remove indigo remap) */
        blue: {
          50: "#ffffff",
          100: surface.DEFAULT,
          200: "#eeeeee",
          300: navy[300],
          400: navy[400],
          500: "#3d6a8c",
          600: "#1e4a73",
          700: navy[500],
          800: navy[700],
          900: navy.DEFAULT,
          950: navy[950],
        },

        navy,
        "brand-red": brandRed,
        ink,
        line,
        surface,
        status,

        slate: {
          50: surface.DEFAULT,
          100: "#eeeeee",
          200: line,
          300: "#cbd5e1",
          400: "#94a3b8",
          490: "#222222",
          500: ink.subtle,
          600: ink.muted,
          700: "#334155",
          800: "#1e293b",
          900: navy.DEFAULT,
          950: navy[950],
        },
      },

      boxShadow: {
        xs: "0 1px 2px 0 rgb(6 27 51 / 0.05)",
        sm: "0 0 0 1px rgba(10,37,64,0.04), 0 1px 2px rgba(10,37,64,0.05)",
        DEFAULT: "0 0 0 1px rgba(10,37,64,0.04), 0 1px 2px rgba(10,37,64,0.04), 0 4px 12px -4px rgba(10,37,64,0.08)",
        md: "0 0 0 1px rgba(10,37,64,0.04), 0 4px 8px -2px rgba(10,37,64,0.06), 0 12px 24px -12px rgba(10,37,64,0.14)",
        lg: "0 25px 40px 0 rgba(0,0,0,0.11), 0 10px 25px 0 rgba(0,0,0,0.08)",
        xl: "0 25px 40px 0 rgba(0,0,0,0.11), 0 10px 25px 0 rgba(0,0,0,0.08)",
        "2xl": "0 25px 40px 0 rgba(0,0,0,0.14), 0 10px 25px 0 rgba(0,0,0,0.1)",
        inner: "inset 0 1px 2px 0 rgba(2, 18, 39, 0.04)",
        examcell:
          "0 15px 30px 0 rgba(0,0,0,0.11), 0 5px 15px 0 rgba(0,0,0,0.08)",
        "examcell-lg":
          "0 25px 40px 0 rgba(0,0,0,0.11), 0 10px 25px 0 rgba(0,0,0,0.08)",
        whisper:
          "0 15px 30px 0 rgba(0,0,0,0.11), 0 5px 15px 0 rgba(0,0,0,0.08)",
        "whisper-md":
          "0 15px 30px 0 rgba(0,0,0,0.11), 0 5px 15px 0 rgba(0,0,0,0.08)",
        "whisper-lg":
          "0 25px 40px 0 rgba(0,0,0,0.11), 0 10px 25px 0 rgba(0,0,0,0.08)",
        "whisper-navy":
          "0 15px 30px 0 rgba(0,0,0,0.11), 0 5px 15px 0 rgba(0,0,0,0.08)",
        "whisper-landing":
          "0 15px 30px 0 rgba(0,0,0,0.11), 0 5px 15px 0 rgba(0,0,0,0.08)",
      },

      borderRadius: {
        xs: "2px",
        md: "6px",
        lg: "8px",
        xl: "12px",
        "2xl": "12px",
        "3xl": "12px",
        "portal-sm": "8px",
        "portal-lg": "8px",
        "portal-xl": "8px",
        "portal-2xl": "12px",
        /* Semantic tokens (DESIGN.md) — opt-in; legacy radii unchanged */
        control: "var(--uniz-radius-control)",
        card: "var(--uniz-radius-card)",
        sheet: "var(--uniz-radius-sheet)",
        pill: "var(--uniz-radius-full)",
      },

      spacing: {
        portal: "32px",
        header: "68px",
      },

      height: {
        header: "68px",
      },

      transitionTimingFunction: {
        calm: "cubic-bezier(0.2, 0, 0, 1)",
        "ease-out": "var(--uniz-ease-out)",
        spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },

      transitionDuration: {
        150: "150ms",
        200: "200ms",
        ui: "var(--uniz-duration-ui)",
        400: "400ms",
        500: "500ms",
      },

      backgroundImage: {
        "premium-gradient": `linear-gradient(to right, ${surface.DEFAULT}, ${surface.DEFAULT})`,
        "portal-banner": `radial-gradient(circle farthest-corner at 16.5% 37.3%, ${navy.DEFAULT} 0.1%, ${navy[950]} 90%)`,
        "portal-header": `radial-gradient(circle farthest-corner at 16.5% 37.3%, ${navy.DEFAULT} 0.1%, ${navy[950]} 90%)`,
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
