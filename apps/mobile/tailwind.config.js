/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/tailwind/preset")],
  theme: {
    extend: {
      colors: {
        'ocean-bg': '#0B0F19',
        'ocean-panel': '#131B2F',
        'ocean-border': '#1E293B',
        'ocean-accent': '#34D399',
      }
    },
  },
  plugins: [],
};
