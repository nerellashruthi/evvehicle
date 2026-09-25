/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        studio: '#6b879d',
        sky: '#708fa2',
        panel: '#35586e',
        acid: {
          DEFAULT: '#edff39',
          dark: '#10190c',
        },
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
        },
        danger: {
          400: '#f87171',
          500: '#ef4444',
        },
        ink: {
          950: '#1a2530',
          900: '#1e2a36',
          850: '#243440',
          800: '#2a3c4a',
          700: '#35586e',
          600: '#4a6378',
          500: '#6b879d',
          400: '#8ba5b8',
          300: '#b0c4d2',
          200: '#d0dde6',
          100: '#e1eaf0',
          50: '#f0f5f8',
        },
        muted: '#e1eaf0',
        line: 'rgba(255,255,255,0.19)',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'pulse-glow': 'pulseGlow 5s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'dash': 'dash 1.5s linear infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'breath': 'breath 5s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-16px)' },
        },
        dash: {
          '0%': { strokeDashoffset: '20' },
          '100%': { strokeDashoffset: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        breath: {
          '0%, 100%': { opacity: '0.2', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.07)' },
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(237, 255, 57, 0.25)',
        'glow-lg': '0 0 40px rgba(237, 255, 57, 0.35)',
        'card': '0 8px 26px rgba(33, 63, 81, 0.12)',
      },
    },
  },
  plugins: [],
};
