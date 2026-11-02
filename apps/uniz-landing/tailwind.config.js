/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0A2540",
        accent: "#061B33",
        navy: "#0A2540",
      },
      fontFamily: {
        sans: ['"Source Sans 3"', "Segoe UI", "sans-serif"],
        serif: ['"Source Serif 4"', "Georgia", "serif"],
        inter: ['"Source Sans 3"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
