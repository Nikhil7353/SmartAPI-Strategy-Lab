/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8FAFC',
        card: '#FFFFFF',
        text: {
          primary: '#0F172A',
          secondary: '#64748B',
          muted: '#94A3B8',
        },
        border: {
          DEFAULT: '#E2E8F0',
          dark: '#CBD5E1',
        },
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          light: '#EFF6FF',
        },
        bull: {
          DEFAULT: '#16A34A',
          light: '#DCFCE7',
          dark: '#15803D',
        },
        bear: {
          DEFAULT: '#DC2626',
          light: '#FEE2E2',
          dark: '#B91C1C',
        },
        warn: {
          DEFAULT: '#D97706',
          light: '#FEF3C7',
          dark: '#B45309',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
