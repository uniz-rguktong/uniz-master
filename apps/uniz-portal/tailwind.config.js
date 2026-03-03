module.exports = {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Google Sans"', "Inter", "system-ui", "sans-serif"],
        body: ['"Google Sans Text"', "Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        h1: ["48px", { lineHeight: "56px", letterSpacing: "-0.02em", fontWeight: "600" }],
        h2: ["36px", { lineHeight: "44px", letterSpacing: "-0.01em", fontWeight: "600" }],
        h3: ["28px", { lineHeight: "36px", letterSpacing: "-0.01em", fontWeight: "600" }],
        h4: ["22px", { lineHeight: "30px", fontWeight: "500" }],
        base: ["16px", { lineHeight: "24px", fontWeight: "400" }],
        small: ["14px", { lineHeight: "20px", fontWeight: "400" }],
        micro: ["12px", { lineHeight: "16px", fontWeight: "500" }],
      },
      colors: {
        blue: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5", // A deeper, royal-indigo leaning blue
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        slate: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
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
    },
  },
  plugins: [require("tailwind-scrollbar-hide")],
};
