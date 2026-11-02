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
      },

      colors: {
        background: "#ffffff",
        foreground: "#0A2540",

        primary: {
          DEFAULT: "var(--portal-navy, #0A2540)",
          foreground: "#ffffff",
        },

        muted: {
          DEFAULT: "#FAFAFA",
          foreground: "#5A7A94",
        },

        accent: {
          DEFAULT: "#EA2027",
          foreground: "#ffffff",
        },

        portal: {
          DEFAULT: "var(--portal-navy, #0A2540)",
          mid: "var(--portal-navy-mid, #0D3154)",
          deep: "var(--portal-navy-deep, #021227)",
          soft: "var(--portal-navy-soft, #163A5C)",
          muted: "var(--portal-navy-muted, #5A7A94)",
          tint: "var(--portal-navy-tint, #FAFAFA)",
          border: "var(--portal-navy-border, #EEEEEE)",
          accent: "#EA2027",
          footer: "#EEEEEE",
          cta: "#0A2540",
          link: "#061B33",
        },

        /* Remap zinc → ExamCell neutrals so leftover classes stay on-brand */
        zinc: {
          50: "#ffffff",
          100: "#fafafa",
          200: "#eeeeee",
          300: "#9bb0c4",
          400: "#5a7a94",
          500: "#3d6a8c",
          600: "#1e4a73",
          700: "#163a5c",
          800: "#0d3154",
          900: "#0a2540",
          950: "#021227",
        },

        neutral: {
          50: "#ffffff",
          100: "#fafafa",
          200: "#eeeeee",
          300: "#9bb0c4",
          400: "#5a7a94",
          500: "#3d6a8c",
          600: "#1e4a73",
          700: "#163a5c",
          800: "#0d3154",
          900: "#0a2540",
          950: "#021227",
        },

        /* Map blue utilities to ExamCell navy (remove indigo remap) */
        blue: {
          50: "#ffffff",
          100: "#fafafa",
          200: "#eeeeee",
          300: "#9bb0c4",
          400: "#5a7a94",
          500: "#3d6a8c",
          600: "#1e4a73",
          700: "#163a5c",
          800: "#0d3154",
          900: "#0a2540",
          950: "#021227",
        },

        navy: {
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
        },

        /* Copied from apps/uniz-landing (rguktong.in) */
        "brand-red": "#EA2027",
        ink: {
          DEFAULT: "#0F172A",
          muted: "#475569",
          subtle: "#64748B",
        },
        line: "#E2E8F0",
        surface: {
          DEFAULT: "#FAFAFA",
          2: "#F8FAFC",
        },

        slate: {
          50: "#fafafa",
          100: "#eeeeee",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          490: "#222222",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0a2540",
          950: "#021227",
        },
      },

      boxShadow: {
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
        xl: "12px",
        "2xl": "12px",
        "3xl": "12px",
        "portal-sm": "8px",
        "portal-lg": "8px",
        "portal-xl": "8px",
        "portal-2xl": "12px",
      },

      spacing: {
        portal: "32px",
        header: "68px",
      },

      height: {
        header: "68px",
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
        "premium-gradient": "linear-gradient(to right, #fafafa, #fafafa)",
        "portal-banner":
          "radial-gradient(circle farthest-corner at 16.5% 37.3%, #0A2540 0.1%, #021227 90%)",
        "portal-header":
          "radial-gradient(circle farthest-corner at 16.5% 37.3%, #0A2540 0.1%, #021227 90%)",
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
