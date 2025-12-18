/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // cần cho Typescript
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        playfair: ["Playfair Display", "serif"],
      },
      colors: {
        beige: "#E5D3BD",
        ivory: "#FBF8F5",
        clay: "#C75F4B",
        moss: "#4A6D56",
        darkText: "#3C3C3C",
      },
      boxShadow: {
        card: "0 2px 8px rgba(0,0,0,0.1)",
        deep: "0 6px 20px rgba(0,0,0,0.15)",
      },
    },
  },
  plugins: [],
};
