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
        sans: ['"Cabin Condensed"', '"Cabin"', "system-ui", "sans-serif"],
        serif: ['"Cabin Condensed"', '"Cabin"', "Georgia", "serif"],
        inter: ['"Cabin Condensed"', '"Cabin"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
