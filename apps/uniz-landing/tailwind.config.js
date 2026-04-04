/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#800000", /* Maroon */
        accent: "#4c0519",  /* Deep Rose/Dark Maroon */
        navy: "#000035", // The core requested color #000035
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
