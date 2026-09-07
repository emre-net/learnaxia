/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: '#050911',
        foreground: '#F8FAFC', 
        card: '#0a0f1c',
        cardForeground: '#F8FAFC',
        primary: '#3B82F6',
        primaryForeground: '#FFFFFF',
        secondary: '#1E293B',
        muted: '#0f172a',
        mutedForeground: '#94a3b8', 
        accent: '#34D399', // Emerald
        destructive: '#ef4444', 
        border: '#1E293B',
        input: '#1E293B',
        // Custom
        'ocean-bg': '#050911',
        'ocean-panel': '#0a0f1c',
        'ocean-border': '#1E293B',
        'ocean-accent': '#34D399',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
};

