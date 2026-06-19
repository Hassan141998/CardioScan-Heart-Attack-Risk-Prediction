/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        crimson: {
          950: '#0d0404',
          900: '#1a0a0a',
          800: '#2d0f0f',
          700: '#3d1515',
          600: '#5c1f1f',
          500: '#8b2020',
        },
        electric: {
          red: '#ff3333',
          light: '#ff6666',
          dark: '#cc0000',
        },
        gold: {
          DEFAULT: '#ffd700',
          light: '#ffe44d',
          dark: '#cc9900',
          muted: '#b8960c',
        },
        risk: {
          low: '#22c55e',
          moderate: '#eab308',
          high: '#f97316',
          critical: '#ef4444',
        }
      },
      fontFamily: {
        playfair: ['Playfair Display', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'ecg': 'ecgDraw 3s linear infinite',
        'heartbeat': 'heartbeat 1.2s ease-in-out infinite',
        'pulse-ring': 'pulseRing 2s ease-out infinite',
        'fade-up': 'fadeUp 0.5s ease-out forwards',
        'slide-in': 'slideIn 0.4s ease-out forwards',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '14%': { transform: 'scale(1.3)' },
          '28%': { transform: 'scale(1)' },
          '42%': { transform: 'scale(1.2)' },
          '56%': { transform: 'scale(1)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(1)', opacity: '0.8' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        glow: {
          from: { boxShadow: '0 0 10px #ff3333, 0 0 20px #ff3333' },
          to: { boxShadow: '0 0 20px #ff3333, 0 0 40px #ff3333, 0 0 80px #ff3333' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      backgroundImage: {
        'crimson-gradient': 'linear-gradient(135deg, #1a0a0a 0%, #2d0f0f 50%, #1a0a0a 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(45,15,15,0.8) 0%, rgba(26,10,10,0.9) 100%)',
        'risk-gradient': 'linear-gradient(90deg, #22c55e 0%, #eab308 33%, #f97316 66%, #ef4444 100%)',
        'shimmer-gradient': 'linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.1) 50%, transparent 100%)',
      },
    },
  },
  plugins: [],
}
