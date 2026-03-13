module.exports = {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Google Sans"',
          "Inter",
          "system-ui",
          "sans-serif",
        ],
        body: [
          '"Google Sans Text"',
          "Inter",
          "system-ui",
          "sans-serif",
        ],
      },
      fontSize: {
        xs: ["14px", { lineHeight: "20px" }],
        sm: ["16px", { lineHeight: "24px" }],
        base: ["20px", { lineHeight: "30px" }],
        lg: ["24px", { lineHeight: "32px" }],
        xl: ["28px", { lineHeight: "36px" }],
        "2xl": ["32px", { lineHeight: "42px" }],
        "3xl": ["40px", { lineHeight: "50px" }],

        h1: [
          "68px",
          { lineHeight: "76px", letterSpacing: "-0.02em", fontWeight: "600" },
        ],
        h2: [
          "54px",
          { lineHeight: "62px", letterSpacing: "-0.01em", fontWeight: "600" },
        ],
        h3: [
          "42px",
          { lineHeight: "50px", letterSpacing: "-0.01em", fontWeight: "600" },
        ],
        h4: ["32px", { lineHeight: "40px", fontWeight: "500" }],

        small: ["18px", { lineHeight: "26px", fontWeight: "400" }],
        micro: ["16px", { lineHeight: "22px", fontWeight: "500" }],
      },
      colors: {
        background: "var(--white)",
        foreground: "var(--text-primary)",
        primary: {
          DEFAULT: "var(--navy-900)",
          foreground: "var(--white)",
        },
        muted: {
          DEFAULT: "var(--bg-page)",
          foreground: "var(--text-secondary)",
        },
        accent: {
          DEFAULT: "var(--navy-50)",
          foreground: "var(--navy-900)",
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
          490: "#222222", // text-primary equivalent
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
      },
      boxShadow: {
        sm: "0 2px 8px -2px rgba(0, 0, 0, 0.04), 0 1px 4px -1px rgba(0, 0, 0, 0.02)",
        DEFAULT:
          "0 4px 12px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.03)",
        md: "0 8px 24px -4px rgba(0, 0, 0, 0.06), 0 4px 12px -2px rgba(0, 0, 0, 0.04)",
        lg: "0 16px 32px -8px rgba(0, 0, 0, 0.08), 0 8px 16px -4px rgba(0, 0, 0, 0.05)",
        xl: "0 24px 48px -12px rgba(0, 0, 0, 0.12), 0 12px 24px -6px rgba(0, 0, 0, 0.06)",
        "2xl":
          "0 32px 64px -16px rgba(0, 0, 0, 0.16), 0 16px 32px -8px rgba(0, 0, 0, 0.08)",
        inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.04)",
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
        "premium-gradient": "linear-gradient(to right, #f8fafc, #f1f5f9)",
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
