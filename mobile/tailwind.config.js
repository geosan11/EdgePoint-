/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        border: '#E2E8F0',
        input: '#E2E8F0',
        ring: '#059669',
        background: '#F8FAFC',
        foreground: '#0F172A',
        primary: {
          DEFAULT: '#059669',
          foreground: '#FFFFFF',
          soft: 'rgba(5, 150, 105, 0.12)',
        },
        secondary: {
          DEFAULT: '#0284C7',
          foreground: '#FFFFFF',
          soft: 'rgba(2, 132, 199, 0.12)',
        },
        destructive: {
          DEFAULT: '#DC2626',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#F1F5F9',
          foreground: '#64748B',
        },
        accent: {
          DEFAULT: '#059669',
          foreground: '#FFFFFF',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#0F172A',
        },
        sporty: {
          DEFAULT: '#E51B24',
          yellow: '#FFCC00',
        },
      },
    },
  },
  plugins: [],
};
