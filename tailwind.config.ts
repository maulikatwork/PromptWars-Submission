import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm, calming terracotta-orange — soft enough to soothe, deep enough to read.
        primary: {
          50: '#fdf5ef',
          100: '#fbe7d6',
          200: '#f5ccaa',
          300: '#eeac79',
          400: '#e68a4c',
          500: '#db6f30',
          600: '#c0561f',
          700: '#9c4419',
          800: '#7e3819',
          900: '#682f18',
        },
        neutral: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        },
        accent: { 100: '#fef3c7', 300: '#fcd34d', 500: '#f59e0b' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px rgba(192, 86, 31, 0.10)',
        'glass-lg': '0 16px 48px rgba(192, 86, 31, 0.16)',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to: { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(0, -24px) scale(1.05)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out',
        fadeInUp: 'fadeInUp 0.2s ease-out',
        slideUp: 'slideUp 0.25s ease-out',
        shimmer: 'shimmer 1.5s infinite',
        float: 'float 16s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
