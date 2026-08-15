import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'media',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#D4AF37',
          50: '#FAF5E4',
          100: '#F5EBC9',
          200: '#EBD793',
          300: '#E1C35D',
          400: '#D4AF37',
          500: '#B8962E',
          600: '#9C7D25',
          700: '#80641C',
          800: '#644B13',
          900: '#48320A',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'slide-up': 'slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'slide-up': {
          from: { transform: 'translateY(100%)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
