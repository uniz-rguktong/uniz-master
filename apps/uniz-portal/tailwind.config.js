/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
  // Class strategy so leftover `dark:` utilities stay off. The portal never
  // adds `.dark` and does not follow prefers-color-scheme.
  darkMode: "class",

  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Variable"', "Inter", "system-ui", "sans-serif"],
        serif: ['"Noto Serif Variable"', '"Noto Serif"', "Georgia", "serif"],
        body: ['"Inter Variable"', "Inter", "system-ui", "sans-serif"],
      },

      fontSize: {
        display: ["54px", { lineHeight: "66px", letterSpacing: "-0.01em" }],
        page: ["32px", { lineHeight: "40px", letterSpacing: "-0.01em" }],
        h2: ["28px", { lineHeight: "36px", letterSpacing: "-0.01em" }],
        h3: [
          "18px",
          { lineHeight: "26px", letterSpacing: "-0.01em", fontWeight: "600" },
        ],
        lede: ["19px", { lineHeight: "30px" }],
        body: ["15px", { lineHeight: "24px" }],
        dense: ["14px", { lineHeight: "20px" }],
        small: ["13px", { lineHeight: "18px" }],
        caption: ["12px", { lineHeight: "16px" }],
      },

      colors: {
        navy: {
          950: "var(--navy-950)",
          900: "var(--navy-900)",
          800: "var(--navy-800)",
          700: "var(--navy-700)",
          600: "var(--navy-600)",
          300: "var(--navy-300)",
          100: "var(--navy-100)",
          50: "var(--navy-50)",
        },
        neutral: {
          900: "var(--neutral-900)",
          800: "var(--neutral-800)",
          700: "var(--neutral-700)",
          600: "var(--neutral-600)",
          500: "var(--neutral-500)",
          400: "var(--neutral-400)",
          300: "var(--neutral-300)",
          200: "var(--neutral-200)",
          100: "var(--neutral-100)",
          50: "var(--neutral-50)",
        },
        bg: "var(--bg)",
        surface: {
          DEFAULT: "var(--surface)",
          2: "var(--surface-2)",
        },
        panel: "var(--panel)",
        tile: "var(--tile)",
        head: "var(--head)",
        tint: "var(--tint-2)",
        border: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
        },
        text: {
          DEFAULT: "var(--text)",
          2: "var(--text-2)",
          3: "var(--text-3)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--on-primary)",
          hover: "var(--primary-hover)",
          active: "var(--primary-active)",
        },
        "on-primary": "var(--on-primary)",
        link: "var(--link)",
        selected: "var(--selected)",
        ring: "var(--ring)",
        accent: "var(--accent)",
        error: "var(--error)",
        success: "var(--success)",
        warning: "var(--warning)",
        "on-error": "var(--on-error)",
        overlay: "var(--overlay)",
        background: "var(--bg)",
        foreground: "var(--text)",
        card: {
          DEFAULT: "var(--surface)",
          foreground: "var(--text)",
        },
        popover: {
          DEFAULT: "var(--surface)",
          foreground: "var(--text)",
        },
        muted: {
          DEFAULT: "var(--surface-2)",
          foreground: "var(--text-3)",
        },
        input: "var(--border-strong)",
        destructive: {
          DEFAULT: "var(--error)",
          foreground: "var(--on-error)",
        },
      },

      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        full: "9999px",
      },

      boxShadow: {
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },

      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },

      transitionDuration: {
        150: "150ms",
        200: "200ms",
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
