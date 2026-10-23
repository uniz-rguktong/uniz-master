/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}"],

  theme: {
    extend: {
      fontFamily: {
        sans: ['"Open Sans"', "system-ui", "sans-serif"],
        body: ['"Open Sans"', "system-ui", "sans-serif"],
        button: ['"Nunito"', '"Open Sans"', "system-ui", "sans-serif"],
        form: ['"Cabin"', '"Open Sans"', "system-ui", "sans-serif"],
        condensed: ['"Cabin"', '"Open Sans"', "sans-serif"],
      },

      fontSize: {
        h1: [
          "48px",
          { lineHeight: "56px", letterSpacing: "-0.01em", fontWeight: "600" },
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
          cta: "#34495e",
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
        sm: "0 5px 15px 0 rgba(0,0,0,0.08)",
        DEFAULT: "0 15px 30px 0 rgba(0,0,0,0.11), 0 5px 15px 0 rgba(0,0,0,0.08)",
        md: "0 15px 30px 0 rgba(0,0,0,0.11), 0 5px 15px 0 rgba(0,0,0,0.08)",
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
        "portal-sm": "1px",
        "portal-lg": "2px",
        "portal-xl": "2px",
        "portal-2xl": "4px",
      },

      spacing: {
        portal: "32px",
        header: "60px",
      },

      height: {
        header: "60px",
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
